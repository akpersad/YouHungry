import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { removeUserFromGroup } from '@/lib/groups';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: groupId } = await params;
    const body = await request.json();

    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const db = await connectToDatabase();
    const usersCollection = db.collection<User>('users');
    const targetUser = await usersCollection.findOne({ email });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove user from group
    const success = await removeUserFromGroup(
      groupId,
      targetUser._id.toString(),
      user._id.toString()
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove user from group' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${targetUser.name} from the group`,
    });
  } catch (error) {
    console.error('Error removing user from group:', error);
    if (error instanceof Error) {
      if (error.message.includes('not an admin')) {
        return NextResponse.json(
          { error: 'Only group admins can remove members' },
          { status: 403 }
        );
      }
      if (error.message.includes('last admin')) {
        return NextResponse.json(
          { error: 'Cannot remove the last admin from the group' },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to remove user from group' },
      { status: 500 }
    );
  }
}
