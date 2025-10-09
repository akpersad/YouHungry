import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const manualDecisionSchema = z.object({
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
    const { restaurantId, visitDate, type, groupId, notes } =
      manualDecisionSchema.parse(body);

    const db = await connectToDatabase();

    // Get user's MongoDB ID
    const user = await db.collection('users').findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

      if (
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

    // For manual decisions, we need to find a collection that contains this restaurant
    // Since we're now using user-wide/group-wide history, any collection will do
    let collectionId: ObjectId;

    if (type === 'group' && groupId) {
      // For group decisions, find any group collection that has this restaurant
      const groupCollection = await db.collection('collections').findOne({
        ownerId: new ObjectId(groupId),
        type: 'group',
        $or: [
          { restaurantIds: new ObjectId(restaurantId) },
          { 'restaurantIds._id': new ObjectId(restaurantId) },
        ],
      });

      if (!groupCollection) {
        return NextResponse.json(
          { error: 'Restaurant not found in any group collection' },
          { status: 404 }
        );
      }
      collectionId = groupCollection._id;
    } else {
      // For personal decisions, find any personal collection that has this restaurant
      logger.debug('Searching for personal collection with:', {
        ownerId: user._id,
        type: 'personal',
        restaurantId,
        restaurantObjectId: new ObjectId(restaurantId),
      });

      // For personal decisions, we need to find collections by Clerk ID
      // First, let's see what personal collections exist with the Clerk ID
      const personalCollections = await db
        .collection('collections')
        .find({
          ownerId: user.clerkId,
          type: 'personal',
        })
        .toArray();

      logger.debug(
        'Found personal collections with Clerk ID:',
        personalCollections.map((c) => ({
          _id: c._id,
          name: c.name,
          ownerId: c.ownerId,
          restaurantIds: c.restaurantIds,
        }))
      );

      const personalCollection = await db.collection('collections').findOne({
        ownerId: user.clerkId,
        type: 'personal',
        $or: [
          { restaurantIds: new ObjectId(restaurantId) },
          { 'restaurantIds._id': new ObjectId(restaurantId) },
        ],
      });

      if (!personalCollection) {
        return NextResponse.json(
          { error: 'Restaurant not found in any personal collection' },
          { status: 404 }
        );
      }
      collectionId = personalCollection._id;
    }

    const now = new Date();
    const decision = {
      type,
      collectionId,
      groupId: groupId ? new ObjectId(groupId) : undefined,
      participants: [userId],
      method: 'manual' as const,
      status: 'completed' as const,
      deadline: new Date(visitDate),
      visitDate: new Date(visitDate),
      result: {
        restaurantId: new ObjectId(restaurantId),
        selectedAt: new Date(visitDate), // Use the visit date, not the current date
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
