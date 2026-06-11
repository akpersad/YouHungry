import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import {
  checkRateLimit,
  ipRateLimitKey,
  rateLimitResponse,
} from '@/lib/rate-limit';

// NOTE: Clerk's backend SDK cannot verify email codes, so this endpoint never
// actually verifies anything — the client flow uses Clerk's
// signUp.attemptEmailAddressVerification() instead, and nothing in src/ calls
// this route. It is kept only to return a safe, uniform answer.
//
// Identical response for known and unknown emails so this endpoint cannot be
// used to enumerate registered accounts.
const GENERIC_RESPONSE = {
  success: false,
  error:
    'Please verify your email through the link sent to your inbox, or try signing in to receive a new verification email',
};

export async function POST(request: NextRequest) {
  try {
    // 10 per hour per IP — guards Clerk lookups and code brute-forcing.
    const rateLimit = await checkRateLimit({
      key: ipRateLimitKey('auth-verify-email', request),
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds);
    }

    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    try {
      const clerk = await clerkClient();

      // Get the user by email
      const users = await clerk.users.getUserList({
        emailAddress: [email],
      });

      if (users.data.length === 0) {
        // Don't reveal whether the account exists.
        return NextResponse.json(GENERIC_RESPONSE, { status: 400 });
      }

      const user = users.data[0];

      // Get the email address ID
      const emailAddress = user.emailAddresses.find(
        (e) => e.emailAddress === email
      );

      if (!emailAddress) {
        // Same generic response — "address not found" would leak existence.
        return NextResponse.json(GENERIC_RESPONSE, { status: 400 });
      }

      // Note: Clerk's backend SDK verification flow is different
      // Users should verify through Clerk's built-in verification system
      // For now, we'll log and return an informative message

      logger.info('Email verification attempt via API', {
        userId: user.id,
        email,
        currentStatus: emailAddress.verification?.status,
        note: 'Backend SDK verification limited - user should verify through Clerk UI or sign-in flow',
      });

      // Since backend SDK doesn't support code verification directly,
      // instruct users to use Clerk's sign-in flow for verification
      return NextResponse.json(GENERIC_RESPONSE, { status: 400 });
    } catch (clerkError) {
      logger.error('Error in email verification', {
        email,
        error: clerkError,
      });
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Unexpected error in email verification', { error });
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
