import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createPersonalDecision, getDecisionHistory } from '@/lib/decisions';
import { verifyCollectionAccess } from '@/lib/collections';
import { z } from 'zod';

const createDecisionSchema = z.object({
  collectionId: z.string().min(1),
  method: z.enum(['random', 'tiered']).default('random'),
  visitDate: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { collectionId, method, visitDate } =
      createDecisionSchema.parse(body);

    // Caller must own the collection (personal) or be a group member (group)
    const collection = await verifyCollectionAccess(collectionId, user);
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Personal decisions store the Clerk ID in participants
    const decision = await createPersonalDecision(
      collectionId,
      user.clerkId,
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
    logger.error('Create decision error:', error);

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
    const user = await getCurrentUser();
    if (!user) {
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

    // Caller must own the collection (personal) or be a group member (group)
    const collection = await verifyCollectionAccess(collectionId, user);
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
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
    logger.error('Get decisions error:', error);
    return NextResponse.json(
      { error: 'Failed to get decisions' },
      { status: 500 }
    );
  }
}
