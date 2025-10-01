import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getGroupInvitationsForUser } from '@/lib/groups';
import { connectToDatabase } from '@/lib/db';
import { Group, User } from '@/types/database';

export async function GET() {
  try {
    const user = await requireAuth();

    const invitations = await getGroupInvitationsForUser(user._id.toString());

    // Get group and inviter details for each invitation
    const db = await connectToDatabase();
    const groupsCollection = db.collection<Group>('groups');
    const usersCollection = db.collection<User>('users');

    const invitationsWithDetails = await Promise.all(
      invitations.map(async (invitation) => {
        const group = await groupsCollection.findOne({
          _id: invitation.groupId,
        });
        const inviter = await usersCollection.findOne({
          _id: invitation.inviterId,
        });

        return {
          _id: invitation._id.toString(),
          groupId: invitation.groupId.toString(),
          groupName: group?.name || 'Unknown Group',
          groupDescription: group?.description,
          inviterName: inviter?.name || 'Unknown User',
          inviterEmail: inviter?.email || 'unknown@example.com',
          createdAt: invitation.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      invitations: invitationsWithDetails,
    });
  } catch (error) {
    logger.error('Error fetching group invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}
