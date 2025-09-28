import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createPersonalDecision, getDecisionHistory } from '@/lib/decisions';
import { z } from 'zod';

const createDecisionSchema = z.object({
  collectionId: z.string().min(1),
  method: z.enum(['random', 'tiered']).default('random'),
  visitDate: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { collectionId, method, visitDate } =
      createDecisionSchema.parse(body);

    const decision = await createPersonalDecision(
      collectionId,
      userId,
      method,
      new Date(visitDate)
    );

    return NextResponse.json({
      success: true,
      decision: {
        id: decision._id.toString(),
        type: decision.type,
        collectionId: decision.collectionId.toString(),
        method: decision.method,
        status: decision.status,
        deadline: decision.deadline.toISOString(),
        visitDate: decision.visitDate.toISOString(),
        createdAt: decision.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create decision error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues || [] },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create decision' },
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
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    const decisions = await getDecisionHistory(collectionId, limit);

    return NextResponse.json({
      success: true,
      decisions: decisions.map((decision) => ({
        id: decision._id.toString(),
        type: decision.type,
        collectionId: decision.collectionId.toString(),
        method: decision.method,
        status: decision.status,
        deadline: decision.deadline.toISOString(),
        visitDate: decision.visitDate.toISOString(),
        result: decision.result
          ? {
              restaurantId: decision.result.restaurantId.toString(),
              selectedAt: decision.result.selectedAt.toISOString(),
              reasoning: decision.result.reasoning,
            }
          : null,
        createdAt: decision.createdAt.toISOString(),
        updatedAt: decision.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get decisions error:', error);
    return NextResponse.json(
      { error: 'Failed to get decisions' },
      { status: 500 }
    );
  }
}
