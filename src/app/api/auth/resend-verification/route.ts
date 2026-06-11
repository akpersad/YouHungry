import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from '@/lib/rate-limit';

// Identical response for known and unknown emails so this endpoint cannot be
// used to enumerate registered accounts.
const GENERIC_RESPONSE = {
  success: true,
  message:
    'If an account exists for this email, please check your inbox or try signing in to receive a new code',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 3 per hour per IP+email — each lookup hits Clerk and (conceptually)
    // triggers an email send.
    const rateLimit = await checkRateLimit({
      key: `auth-resend-verification:ip:${getClientIp(request)}:email:${email.trim().toLowerCase()}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds);
    }

    try {
      const clerk = await clerkClient();

      // Get the user by email
      const users = await clerk.users.getUserList({
        emailAddress: [email],
      });

      if (users.data.length === 0) {
        // Don't reveal whether the account exists.
        return NextResponse.json(GENERIC_RESPONSE);
      }

      const user = users.data[0];

      // Get the email address ID
      const emailAddress = user.emailAddresses.find(
        (e) => e.emailAddress === email
      );

      if (!emailAddress || emailAddress.verification?.status === 'verified') {
        // Same generic response — "already verified" / "address not found"
        // would also leak account existence.
        return NextResponse.json(GENERIC_RESPONSE);
      }

      // Note: Clerk's backend SDK doesn't support manually resending verification codes
      // Clerk handles verification automatically based on dashboard settings
      // Users can request a new code by attempting to sign in

      logger.info('Resend verification requested', {
        userId: user.id,
        email,
        note: 'Clerk handles verification emails automatically',
      });

      return NextResponse.json(GENERIC_RESPONSE);
    } catch (clerkError) {
      logger.error('Error resending verification', {
        email,
        error: clerkError,
      });
      return NextResponse.json(
        { error: 'Failed to resend verification code' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Unexpected error in resend verification', { error });
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
