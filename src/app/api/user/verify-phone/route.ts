import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db';
import { logger } from '@/lib/logger';
import { trackAPIUsage } from '@/lib/api-usage-tracker';
import twilio from 'twilio';

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Get the Twilio Verify Service SID
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

// Format phone number for Twilio (ensure it starts with +1)
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // If it starts with 1 and is 11 digits, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // If it's 10 digits, add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If it already starts with +, return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }

  // Default: add +1
  return `+1${digits}`;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!TWILIO_VERIFY_SERVICE_SID) {
      logger.error('Twilio Verify Service SID not configured');
      return NextResponse.json(
        { error: 'Phone verification not configured' },
        { status: 500 }
      );
    }

    // Format the phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Send verification code using Twilio Verify API
    try {
      const verification = await twilioClient.verify.v2
        .services(TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({
          to: formattedPhone,
          channel: 'sms',
        });

      // Track Twilio Verify usage
      await trackAPIUsage('twilio_verify_sent', false, {
        userId,
        phoneNumber: formattedPhone,
        verificationSid: verification.sid,
      });

      logger.info('Verification code sent via Twilio Verify', {
        userId,
        phoneNumber: formattedPhone,
        verificationSid: verification.sid,
        status: verification.status,
      });

      return NextResponse.json({
        success: true,
        message: 'Verification code sent',
        phoneNumber: formattedPhone,
        status: verification.status,
      });
    } catch (twilioError) {
      logger.error('Twilio Verify error', {
        error: twilioError,
        userId,
        phoneNumber: formattedPhone,
      });

      // Check if it's a Twilio error
      if (twilioError instanceof Error) {
        if (twilioError.message.includes('not a valid phone number')) {
          return NextResponse.json(
            {
              error: 'Invalid phone number format',
            },
            { status: 400 }
          );
        }

        if (twilioError.message.includes('not a mobile number')) {
          return NextResponse.json(
            {
              error: 'Please enter a mobile phone number',
            },
            { status: 400 }
          );
        }

        if (twilioError.message.includes('Max send attempts reached')) {
          return NextResponse.json(
            {
              error: 'Too many verification attempts. Please try again later.',
            },
            { status: 429 }
          );
        }
      }

      return NextResponse.json(
        {
          error: 'Failed to send verification code. Please try again.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Phone verification error', { error });
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Verify the code
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, verificationCode } = body;

    if (!phoneNumber || !verificationCode) {
      return NextResponse.json(
        {
          error: 'Phone number and verification code are required',
        },
        { status: 400 }
      );
    }

    if (!TWILIO_VERIFY_SERVICE_SID) {
      logger.error('Twilio Verify Service SID not configured');
      return NextResponse.json(
        { error: 'Phone verification not configured' },
        { status: 500 }
      );
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Verify the code using Twilio Verify API
    try {
      const verificationCheck = await twilioClient.verify.v2
        .services(TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({
          to: formattedPhone,
          code: verificationCode,
        });

      logger.info('Verification check result', {
        userId,
        phoneNumber: formattedPhone,
        status: verificationCheck.status,
        valid: verificationCheck.valid,
      });

      // Check if verification was successful
      if (verificationCheck.status !== 'approved') {
        return NextResponse.json(
          {
            error: 'Invalid or expired verification code',
          },
          { status: 400 }
        );
      }

      // Update user profile with verified phone number in MongoDB
      const db = await connectToDatabase();
      const usersCollection = db.collection('users');
      await usersCollection.updateOne(
        { clerkId: userId },
        {
          $set: {
            phoneNumber: formattedPhone,
            phoneVerified: true,
            phoneVerifiedAt: new Date(),
          },
        }
      );

      logger.info('Phone number verified and saved', {
        userId,
        phoneNumber: formattedPhone,
      });

      return NextResponse.json({
        success: true,
        message: 'Phone number verified successfully',
        phoneNumber: formattedPhone,
      });
    } catch (twilioError) {
      logger.error('Twilio Verify check error', {
        error: twilioError,
        userId,
        phoneNumber: formattedPhone,
      });

      // Check if it's a Twilio error
      if (twilioError instanceof Error) {
        if (
          twilioError.message.includes('Max check attempts reached') ||
          twilioError.message.includes('verification check not found')
        ) {
          return NextResponse.json(
            {
              error:
                'Verification expired or too many attempts. Please request a new code.',
            },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        {
          error: 'Failed to verify code. Please try again.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Phone verification code error', { error });
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
