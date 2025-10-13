import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    try {
      const clerk = await clerkClient();

      // Get the user by email
      const users = await clerk.users.getUserList({
        emailAddress: [email],
      });

      if (users.data.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const user = users.data[0];

      // Get the email address ID
      const emailAddress = user.emailAddresses.find(
        (e) => e.emailAddress === email
      );

      if (!emailAddress) {
        return NextResponse.json(
          { error: 'Email address not found' },
          { status: 404 }
        );
      }

      // Check if already verified
      if (emailAddress.verification?.status === 'verified') {
        return NextResponse.json(
          { error: 'Email is already verified' },
          { status: 400 }
        );
      }

      // Note: Clerk's backend SDK doesn't support manually resending verification codes
      // Clerk handles verification automatically based on dashboard settings
      // Users can request a new code by attempting to sign in

      logger.info('Resend verification requested', {
        userId: user.id,
        email,
        note: 'Clerk handles verification emails automatically',
      });

      return NextResponse.json({
        success: true,
        message:
          'If verification is required, please check your email or try signing in to receive a new code',
      });
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
