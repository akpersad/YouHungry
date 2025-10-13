import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createUser } from '@/lib/users';
import { logger } from '@/lib/logger';
import twilio from 'twilio';

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      username,
      password,
      firstName,
      lastName,
      phoneNumber,
      smsOptIn,
      city,
      state,
    } = body;

    // Validate required fields
    if (!email || !username || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate username format (4-64 characters, alphanumeric + underscore/hyphen)
    if (username.length < 4 || username.length > 64) {
      return NextResponse.json(
        { error: 'Username must be 4-64 characters' },
        { status: 400 }
      );
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, -, and _' },
        { status: 400 }
      );
    }

    // Validate password strength (Clerk requires 10-72 characters)
    if (password.length < 10 || password.length > 72) {
      return NextResponse.json(
        {
          error: 'Password must be between 10 and 72 characters',
        },
        { status: 400 }
      );
    }

    // Validate phone number if SMS opt-in is enabled
    if (smsOptIn && !phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required for SMS notifications' },
        { status: 400 }
      );
    }

    try {
      // Create user in Clerk with email verification
      const clerk = await clerkClient();

      // Log what we're about to send to Clerk (without password)
      logger.info('Attempting to create Clerk user with data:', {
        email,
        username,
        firstName,
        lastName,
        hasPassword: !!password,
      });

      const clerkUser = await clerk.users.createUser({
        emailAddress: [email],
        username,
        password,
        firstName,
        lastName,
        skipPasswordRequirement: false,
        skipPasswordChecks: false,
        // Don't add phone to Clerk initially - we'll verify via Twilio first
        publicMetadata: {
          city: city || undefined,
          state: state || undefined,
          smsOptIn: smsOptIn || false,
          phoneNumber: phoneNumber || undefined,
        },
      });

      logger.info('Clerk user created successfully', {
        clerkId: clerkUser.id,
        email,
        username,
      });

      // In development (no webhook), create MongoDB user directly
      // In production (has webhook), let webhook handle user creation
      const hasWebhook = !!process.env.CLERK_WEBHOOK_SECRET;

      if (!hasWebhook) {
        logger.info('Development mode: Creating MongoDB user directly');

        // Create user in MongoDB (development only)
        await createUser({
          clerkId: clerkUser.id,
          email,
          name: `${firstName} ${lastName}`.trim(),
          profilePicture: clerkUser.imageUrl,
          phoneNumber: phoneNumber || undefined,
          phoneVerified: false, // Will be set to true after Twilio verification
          smsOptIn: smsOptIn || false,
          city,
          state,
          preferences: {
            locationSettings: {
              city: city || undefined,
              state: state || undefined,
              country: 'US',
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            notificationSettings: {
              groupDecisions: {
                started: true,
                completed: true,
              },
              friendRequests: true,
              groupInvites: true,
              smsEnabled: smsOptIn || false,
              emailEnabled: true,
              pushEnabled: true,
            },
          },
        });

        logger.info('MongoDB user created (dev mode)', {
          clerkId: clerkUser.id,
          email,
        });
      } else {
        logger.info(
          'Production mode: MongoDB user will be created via webhook'
        );
      }

      // Check email verification status
      // Note: Clerk automatically sends verification email when "Verify at sign-up" is enabled
      // in the dashboard. We just log the status for debugging.
      const emailAddresses = clerkUser.emailAddresses;
      if (emailAddresses && emailAddresses.length > 0) {
        const primaryEmail = emailAddresses[0];

        logger.info('Email verification status after user creation', {
          clerkId: clerkUser.id,
          email,
          verificationStatus: primaryEmail.verification?.status,
          verificationStrategy: primaryEmail.verification?.strategy,
          isVerified: primaryEmail.verification?.status === 'verified',
        });

        // If email is already verified, that means Clerk dashboard settings
        // don't require verification (or it auto-verified for some reason)
        if (primaryEmail.verification?.status === 'verified') {
          logger.warn(
            'Email was auto-verified by Clerk - check dashboard settings',
            {
              clerkId: clerkUser.id,
              email,
            }
          );
        }
      }

      // If SMS opt-in and phone number provided, send Twilio verification
      let phoneVerificationSent = false;
      if (smsOptIn && phoneNumber && TWILIO_VERIFY_SERVICE_SID) {
        try {
          const verification = await twilioClient.verify.v2
            .services(TWILIO_VERIFY_SERVICE_SID)
            .verifications.create({
              to: phoneNumber,
              channel: 'sms',
            });

          phoneVerificationSent = verification.status === 'pending';
          logger.info('Phone verification SMS sent', {
            clerkId: clerkUser.id,
            phoneNumber,
            verificationSid: verification.sid,
            status: verification.status,
          });
        } catch (twilioError) {
          logger.error('Failed to send phone verification', {
            clerkId: clerkUser.id,
            phoneNumber,
            error: twilioError,
          });
          // Don't fail registration if Twilio verification fails
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Account created successfully',
          userId: clerkUser.id,
          emailVerificationRequired: true,
          phoneVerificationSent,
        },
        { status: 201 }
      );
    } catch (clerkError: unknown) {
      // Log the full error details for debugging
      logger.error('Error creating user in Clerk', {
        error: clerkError,
        errorString: JSON.stringify(clerkError, null, 2),
        errors:
          clerkError && typeof clerkError === 'object' && 'errors' in clerkError
            ? clerkError.errors
            : undefined,
        status:
          clerkError && typeof clerkError === 'object' && 'status' in clerkError
            ? clerkError.status
            : undefined,
        clerkTraceId:
          clerkError &&
          typeof clerkError === 'object' &&
          'clerkTraceId' in clerkError
            ? clerkError.clerkTraceId
            : undefined,
      });

      // Handle specific Clerk errors
      if (
        clerkError &&
        typeof clerkError === 'object' &&
        'errors' in clerkError &&
        Array.isArray(clerkError.errors)
      ) {
        // Log each error detail
        clerkError.errors.forEach((err: unknown, index: number) => {
          logger.error(`Clerk error ${index}:`, {
            message:
              err && typeof err === 'object' && 'message' in err
                ? err.message
                : undefined,
            longMessage:
              err && typeof err === 'object' && 'longMessage' in err
                ? err.longMessage
                : undefined,
            code:
              err && typeof err === 'object' && 'code' in err
                ? err.code
                : undefined,
            meta:
              err && typeof err === 'object' && 'meta' in err
                ? err.meta
                : undefined,
          });
        });

        const errorMessage =
          clerkError.errors[0]?.message ||
          clerkError.errors[0]?.longMessage ||
          'Registration failed';

        // Check for duplicate email
        if (
          errorMessage.includes('already exists') ||
          errorMessage.includes('email') ||
          errorMessage.includes('duplicate')
        ) {
          return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 400 }
          );
        }

        // Check for password issues
        if (errorMessage.toLowerCase().includes('password')) {
          return NextResponse.json(
            { error: `Password error: ${errorMessage}` },
            { status: 400 }
          );
        }

        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Unexpected error in registration', { error });
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
