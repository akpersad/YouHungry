import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { performRandomSelection, getDecisionStatistics } from '@/lib/decisions';
import { verifyCollectionAccess } from '@/lib/collections';
import { z } from 'zod';

const randomSelectSchema = z.object({
  collectionId: z.string().min(1),
  visitDate: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { collectionId, visitDate } = randomSelectSchema.parse(body);

    // Caller must own the collection (personal) or be a group member (group)
    const collection = await verifyCollectionAccess(collectionId, user);
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Personal decisions store the Clerk ID in participants
    const result = await performRandomSelection(
      collectionId,
      user.clerkId,
      new Date(visitDate)
    );

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
    logger.error('Random selection error:', error);

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
      { error: 'Failed to perform random selection' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    // Caller must own the collection (personal) or be a group member (group)
    const collection = await verifyCollectionAccess(collectionId, user);
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const statistics = await getDecisionStatistics(collectionId);

    return NextResponse.json({
      success: true,
      statistics: {
        totalDecisions: statistics.totalDecisions,
        restaurantStats: statistics.restaurantStats.map((stat) => ({
          restaurantId: stat.restaurantId.toString(),
          name: stat.name,
          selectionCount: stat.selectionCount,
          lastSelected: stat.lastSelected?.toISOString(),
          currentWeight: stat.currentWeight,
        })),
      },
    });
  } catch (error) {
    logger.error('Get decision statistics error:', error);
    return NextResponse.json(
      { error: 'Failed to get decision statistics' },
      { status: 500 }
    );
  }
}
