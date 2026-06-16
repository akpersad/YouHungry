import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
} from '@/lib/friends';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
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

    // Always act as the session user; caller-supplied userId is ignored.
    // The lib only updates requests addressed to this user.
    let friendship;
    if (action === 'accept') {
      friendship = await acceptFriendRequest(id, user.clerkId);
    } else {
      friendship = await declineFriendRequest(id, user.clerkId);
    }

    return NextResponse.json({
      success: true,
      friendship,
    });
  } catch (error) {
    logger.error('Update friend request error:', error);

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // The lib only deletes a pending request this user originally sent,
    // so a caller can never cancel someone else's request.
    await cancelFriendRequest(id, user.clerkId);

    return NextResponse.json({
      success: true,
      message: 'Friend request cancelled',
    });
  } catch (error) {
    logger.error('Cancel friend request error:', error);

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
