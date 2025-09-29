import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { promoteToAdmin } from '@/lib/groups';
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

    // Promote user to admin
    const success = await promoteToAdmin(
      groupId,
      targetUser._id.toString(),
      user._id.toString()
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to promote user to admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully promoted ${targetUser.name} to admin`,
    });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    if (error instanceof Error) {
      if (error.message.includes('not an admin')) {
        return NextResponse.json(
          { error: 'Only group admins can promote members' },
          { status: 403 }
        );
      }
      if (error.message.includes('not a member')) {
        return NextResponse.json(
          { error: 'User is not a member of this group' },
          { status: 400 }
        );
      }
      if (error.message.includes('already an admin')) {
        return NextResponse.json(
          { error: 'User is already an admin' },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to promote user to admin' },
      { status: 500 }
    );
  }
}
