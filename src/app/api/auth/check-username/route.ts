import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format (4-64 characters, alphanumeric + underscore/hyphen)
    if (username.length < 4 || username.length > 64) {
      return NextResponse.json(
        { available: false, error: 'Username must be 4-64 characters' },
        { status: 200 }
      );
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          available: false,
          error: 'Username can only contain letters, numbers, -, and _',
        },
        { status: 200 }
      );
    }

    // Check if username exists in Clerk
    try {
      const clerk = await clerkClient();
      const users = await clerk.users.getUserList({
        username: [username],
      });

      const available = users.data.length === 0;

      logger.info('Username availability check', {
        username,
        available,
      });

      return NextResponse.json({ available });
    } catch (clerkError) {
      logger.error('Error checking username with Clerk', {
        username,
        error: clerkError,
      });
      return NextResponse.json(
        { error: 'Failed to check username availability' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Unexpected error in username check', { error });
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
