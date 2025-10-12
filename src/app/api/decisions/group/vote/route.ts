import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  submitGroupVote,
  completeTieredGroupDecision,
  closeGroupDecision,
  getGroupDecision,
} from '@/lib/decisions';
import { sendDecisionCompletedNotifications } from '@/lib/decision-notifications';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user._id.toString();

    const body = await request.json();
    const { decisionId, rankings } = body;

    // Simple validation without Zod
    if (!decisionId || typeof decisionId !== 'string') {
      return NextResponse.json(
        { error: 'decisionId is required and must be a string' },
        { status: 400 }
      );
    }

    if (!rankings || !Array.isArray(rankings) || rankings.length === 0) {
      return NextResponse.json(
        { error: 'rankings is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    const result = await submitGroupVote(decisionId, userId, rankings);

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    logger.error('Submit vote error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to submit vote' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { decisionId } = body;

    // Simple validation without Zod
    if (!decisionId || typeof decisionId !== 'string') {
      return NextResponse.json(
        { error: 'decisionId is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await completeTieredGroupDecision(decisionId);

    // Get the decision details to send notifications
    const decision = await getGroupDecision(decisionId);
    if (decision && decision.groupId && decision.collectionId) {
      try {
        await sendDecisionCompletedNotifications(
          decision.groupId.toString(),
          decision.collectionId.toString(),
          decisionId,
          result.restaurantId.toString(),
          'tiered'
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
    logger.error('Complete decision error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to complete decision' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user._id.toString();

    const body = await request.json();
    const { decisionId } = body;

    // Simple validation without Zod
    if (!decisionId || typeof decisionId !== 'string') {
      return NextResponse.json(
        { error: 'decisionId is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await closeGroupDecision(decisionId, userId);

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    logger.error('Close decision error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to close decision' },
      { status: 500 }
    );
  }
}
