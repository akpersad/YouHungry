import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const manualDecisionSchema = z.object({
  collectionId: z.string().min(1),
  restaurantId: z.string().min(1),
  visitDate: z.string().datetime(),
  type: z.enum(['personal', 'group']).default('personal'),
  groupId: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { collectionId, restaurantId, visitDate, type, groupId, notes } =
      manualDecisionSchema.parse(body);

    const db = await connectToDatabase();

    // Verify collection exists and user has access
    const collection = await db
      .collection('collections')
      .findOne({ _id: new ObjectId(collectionId) });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Verify restaurant exists
    const restaurant = await db
      .collection('restaurants')
      .findOne({ _id: new ObjectId(restaurantId) });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // If group decision, verify group membership
    if (type === 'group' && groupId) {
      const group = await db
        .collection('groups')
        .findOne({ _id: new ObjectId(groupId) });

      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }

      // Get user's MongoDB ID
      const user = await db.collection('users').findOne({ clerkId: userId });
      if (
        !user ||
        !group.memberIds.some(
          (id: ObjectId) => id.toString() === user._id.toString()
        )
      ) {
        return NextResponse.json(
          { error: 'User is not a member of this group' },
          { status: 403 }
        );
      }
    }

    const now = new Date();
    const decision = {
      type,
      collectionId: new ObjectId(collectionId),
      groupId: groupId ? new ObjectId(groupId) : undefined,
      participants: [userId],
      method: 'manual' as const,
      status: 'completed' as const,
      deadline: new Date(visitDate),
      visitDate: new Date(visitDate),
      result: {
        restaurantId: new ObjectId(restaurantId),
        selectedAt: now,
        reasoning: notes || 'Manually entered decision',
        weights: {},
      },
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('decisions').insertOne(decision);

    logger.info('Manual decision created:', {
      decisionId: result.insertedId.toString(),
      userId,
      restaurantId,
      type,
    });

    return NextResponse.json({
      success: true,
      decision: {
        id: result.insertedId.toString(),
        type: decision.type,
        collectionId: decision.collectionId.toString(),
        restaurantId: decision.result.restaurantId.toString(),
        restaurant,
        visitDate: decision.visitDate.toISOString(),
        notes: decision.result.reasoning,
        createdAt: decision.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Create manual decision error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create manual decision' },
      { status: 500 }
    );
  }
}
