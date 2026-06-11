import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { sendFriendRequest, getFriendRequests } from '@/lib/friends';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Always act as the session user; caller-supplied userId is ignored
    const requests = await getFriendRequests(user.clerkId);

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    logger.error('Get friend requests error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { addresseeId } = body;

    if (!addresseeId) {
      return NextResponse.json(
        { success: false, error: 'Addressee ID is required' },
        { status: 400 }
      );
    }

    // The requester is always the session user; caller-supplied
    // requesterId is ignored
    if (user.clerkId === addresseeId) {
      return NextResponse.json(
        { success: false, error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    const friendship = await sendFriendRequest(user.clerkId, addresseeId);

    return NextResponse.json(
      {
        success: true,
        friendship,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Send friend request error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
