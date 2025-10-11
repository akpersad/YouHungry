import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import {
  calculateRestaurantWeight,
  getUserDecisionHistory,
  getGroupDecisionHistory,
} from '@/lib/decisions';
import { z } from 'zod';

const resetWeightsSchema = z.object({
  collectionId: z.string().min(1),
  restaurantId: z.string().optional(),
});

// GET: Get current weights for a collection
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');

    logger.debug('Weights API: collectionId:', collectionId);
    logger.debug('Weights API: userId:', userId);

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

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

    // Determine collection type and get appropriate decision history
    let decisionHistory;
    if (collection.type === 'group') {
      // For group collections, get decision history across all group collections
      // The ownerId contains the Group ID for group collections
      logger.debug(
        'Getting group decision history for groupId:',
        collection.ownerId.toString()
      );
      decisionHistory = await getGroupDecisionHistory(
        collection.ownerId.toString()
      );
      logger.debug(
        'Found group decision history:',
        decisionHistory.length,
        'decisions'
      );
    } else {
      // For personal collections, get decision history across all user's personal collections
      decisionHistory = await getUserDecisionHistory(userId);
    }

    // Get all restaurants in the collection
    const restaurantIds = collection.restaurantIds.map(
      (
        id:
          | ObjectId
          | { _id: ObjectId; googlePlaceId: string }
          | { googlePlaceId: string }
      ) =>
        typeof id === 'object' && '_id' in id
          ? id._id
          : new ObjectId(id as ObjectId)
    );

    const restaurants = await db
      .collection('restaurants')
      .find({ _id: { $in: restaurantIds } })
      .toArray();

    // Calculate weights for each restaurant
    const weights = restaurants.map((restaurant) => {
      let weight: number = 1.0; // default weight
      try {
        const calculatedWeight = calculateRestaurantWeight(
          restaurant._id,
          decisionHistory
        );
        weight = calculatedWeight ?? 1.0; // ensure we have a number
      } catch (error) {
        logger.error(
          `Error calculating weight for restaurant ${restaurant._id}:`,
          error
        );
      }

      const selections = decisionHistory.filter(
        (d) => d.result?.restaurantId.toString() === restaurant._id.toString()
      );
      const lastSelected =
        selections.length > 0 ? selections[0].result?.selectedAt : undefined;

      const result = {
        restaurantId: restaurant._id.toString(),
        name: restaurant.name,
        currentWeight: weight,
        selectionCount: selections.length,
        lastSelected: lastSelected?.toISOString(),
        daysUntilFullWeight: calculateDaysUntilFullWeight(lastSelected),
      };

      return result;
    });

    // Sort by weight (descending)
    weights.sort((a, b) => b.currentWeight - a.currentWeight);

    return NextResponse.json({
      success: true,
      collectionId,
      weights,
      totalDecisions: decisionHistory.length,
    });
  } catch (error) {
    logger.error('Get weights error:', error);
    return NextResponse.json(
      { error: 'Failed to get weights' },
      { status: 500 }
    );
  }
}

// POST: Reset weights for a restaurant or entire collection
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { collectionId, restaurantId } = resetWeightsSchema.parse(body);

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

    // Build filter based on collection type
    const filter: Record<string, unknown> = {
      status: 'completed',
    };

    // For group collections, reset across all group collections
    // For personal collections, reset across all user's personal collections
    if (collection.type === 'group' && collection.groupId) {
      filter.groupId = new ObjectId(collection.groupId);
      filter.type = 'group';
    } else {
      filter.participants = userId;
      filter.type = 'personal';
    }

    // If restaurantId is provided, only reset that restaurant's history
    if (restaurantId) {
      filter['result.restaurantId'] = new ObjectId(restaurantId);
    }

    // Delete decision history (this will reset weights across all relevant collections)
    const result = await db.collection('decisions').deleteMany(filter);

    logger.info('Weights reset:', {
      collectionId,
      restaurantId,
      deletedCount: result.deletedCount,
      userId,
    });

    return NextResponse.json({
      success: true,
      message: restaurantId
        ? 'Restaurant weight reset successfully'
        : 'All weights reset successfully',
      deletedDecisions: result.deletedCount,
    });
  } catch (error) {
    logger.error('Reset weights error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to reset weights' },
      { status: 500 }
    );
  }
}

function calculateDaysUntilFullWeight(lastSelected?: Date): number {
  if (!lastSelected) return 0;

  const now = new Date();
  const daysSinceSelection = Math.floor(
    (now.getTime() - new Date(lastSelected).getTime()) / (24 * 60 * 60 * 1000)
  );

  const daysUntilFull = Math.max(0, 30 - daysSinceSelection);
  return daysUntilFull;
}
