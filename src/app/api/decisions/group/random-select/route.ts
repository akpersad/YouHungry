import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCurrentUser } from '@/lib/auth';
import { performGroupRandomSelection } from '@/lib/decisions';
import { getGroupById } from '@/lib/groups';
import { sendDecisionCompletedNotifications } from '@/lib/decision-notifications';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const groupRandomSelectSchema = z.object({
  collectionId: z.string().min(1),
  groupId: z.string().min(1),
  visitDate: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user for createdBy field
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { collectionId, groupId, visitDate } =
      groupRandomSelectSchema.parse(body);

    // Get the group to find all members
    const group = await getGroupById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get all group members (both admins and regular members) and remove duplicates
    const allMemberIds = [...group.adminIds, ...group.memberIds];
    const uniqueMemberIds = [
      ...new Set(allMemberIds.map((id) => id.toString())),
    ];
    const participants = uniqueMemberIds;

    const result = await performGroupRandomSelection(
      collectionId,
      groupId,
      participants,
      new Date(visitDate),
      currentUser._id.toString() // Pass createdBy
    );

    // Get the created decision to get its ID
    const db = await connectToDatabase();
    const decision = await db.collection('decisions').findOne(
      {
        groupId: new ObjectId(groupId),
        collectionId: new ObjectId(collectionId),
        'result.restaurantId': result.restaurantId,
        status: 'completed',
      },
      { sort: { createdAt: -1 } }
    );

    // Send decision completed notifications to all group members
    if (decision) {
      try {
        await sendDecisionCompletedNotifications(
          groupId,
          collectionId,
          decision._id.toString(),
          result.restaurantId.toString(),
          'random'
        );
      } catch (error) {
        // Log error but don't fail the request
        logger.error('Failed to send decision completed notifications:', error);
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        restaurantId: result.restaurantId.toString(),
        selectedAt: result.selectedAt.toISOString(),
        reasoning: result.reasoning,
        weights: result.weights,
      },
    });
  } catch (error) {
    logger.error('Group random selection error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to perform group random selection' },
      { status: 500 }
    );
  }
}
