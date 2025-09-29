import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { leaveGroup } from '@/lib/groups';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: groupId } = await params;

    const success = await leaveGroup(groupId, user._id.toString());

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to leave group' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully left the group',
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    if (error instanceof Error) {
      if (error.message.includes('not a member')) {
        return NextResponse.json(
          { error: 'You are not a member of this group' },
          { status: 400 }
        );
      }
      if (error.message.includes('last admin')) {
        return NextResponse.json(
          {
            error:
              'Cannot leave group as the last admin. Promote another member to admin first.',
          },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to leave group' },
      { status: 500 }
    );
  }
}
