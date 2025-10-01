import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { sendFriendRequest, getFriendRequests } from '@/lib/friends';

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

    const requests = await getFriendRequests(userId);

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
    const body = await request.json();
    const { requesterId, addresseeId } = body;

    if (!requesterId || !addresseeId) {
      return NextResponse.json(
        { success: false, error: 'Requester ID and addressee ID are required' },
        { status: 400 }
      );
    }

    if (requesterId === addresseeId) {
      return NextResponse.json(
        { success: false, error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    const friendship = await sendFriendRequest(requesterId, addresseeId);

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
