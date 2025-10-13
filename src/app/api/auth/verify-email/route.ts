import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json(
        {
          success: false,
          error:
            'Please verify your email through the link sent to your inbox, or try signing in to receive a new verification email',
        },
        { status: 400 }
      );
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
