import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { declineGroupInvitation } from '@/lib/groups';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: invitationId } = await params;

    const success = await declineGroupInvitation(
      invitationId,
      user._id.toString()
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to decline invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation declined',
    });
  } catch (error) {
    logger.error('Error declining group invitation:', error);
    if (error instanceof Error) {
      if (error.message.includes('Invitation not found')) {
        return NextResponse.json(
          { error: 'Invitation not found or already processed' },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to decline invitation' },
      { status: 500 }
    );
  }
}
