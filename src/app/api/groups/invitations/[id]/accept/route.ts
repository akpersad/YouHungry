import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { acceptGroupInvitation } from '@/lib/groups';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: invitationId } = await params;

    const success = await acceptGroupInvitation(
      invitationId,
      user._id.toString()
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to accept invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the group',
    });
  } catch (error) {
    console.error('Error accepting group invitation:', error);
    if (error instanceof Error) {
      if (error.message.includes('Invitation not found')) {
        return NextResponse.json(
          { error: 'Invitation not found or already processed' },
          { status: 404 }
        );
      }
      if (error.message.includes('Failed to add user')) {
        return NextResponse.json(
          { error: 'Failed to join group' },
          { status: 500 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
