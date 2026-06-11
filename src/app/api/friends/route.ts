import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getFriends, removeFriend } from '@/lib/friends';

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
    const friends = await getFriends(user.clerkId);

    return NextResponse.json({
      success: true,
      friends,
      count: friends.length,
    });
  } catch (error) {
    logger.error('Get friends error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const friendshipId = searchParams.get('friendshipId');

    if (!friendshipId) {
      return NextResponse.json(
        { success: false, error: 'Friendship ID is required' },
        { status: 400 }
      );
    }

    // Always act as the session user; lib verifies the user is part of
    // the friendship before deleting
    const success = await removeFriend(friendshipId, user.clerkId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to remove friend' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Friend removed successfully',
    });
  } catch (error) {
    logger.error('Remove friend error:', error);

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
