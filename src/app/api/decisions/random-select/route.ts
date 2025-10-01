import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { performRandomSelection, getDecisionStatistics } from '@/lib/decisions';
import { z } from 'zod';

const randomSelectSchema = z.object({
  collectionId: z.string().min(1),
  visitDate: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { collectionId, visitDate } = randomSelectSchema.parse(body);

    const result = await performRandomSelection(
      collectionId,
      userId,
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
    const { userId } = await auth();
    if (!userId) {
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
