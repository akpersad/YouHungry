import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getFriends, removeFriend } from '@/lib/friends';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const friends = await getFriends(userId);

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
    const { searchParams } = new URL(request.url);
    const friendshipId = searchParams.get('friendshipId');
    const userId = searchParams.get('userId');

    if (!friendshipId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Friendship ID and user ID are required' },
        { status: 400 }
      );
    }

    const success = await removeFriend(friendshipId, userId);

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
