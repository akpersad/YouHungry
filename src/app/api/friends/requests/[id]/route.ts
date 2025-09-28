import { NextRequest, NextResponse } from 'next/server';
import { acceptFriendRequest, declineFriendRequest } from '@/lib/friends';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, userId } = body;

    if (!action || !userId) {
      return NextResponse.json(
        { success: false, error: 'Action and user ID are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Action must be either "accept" or "decline"',
        },
        { status: 400 }
      );
    }

    let friendship;
    if (action === 'accept') {
      friendship = await acceptFriendRequest(id, userId);
    } else {
      friendship = await declineFriendRequest(id, userId);
    }

    return NextResponse.json({
      success: true,
      friendship,
    });
  } catch (error) {
    console.error('Update friend request error:', error);

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
