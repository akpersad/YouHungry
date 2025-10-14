import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const updateAmountSchema = z.object({
  amountSpent: z.number().positive('Amount must be a positive number'),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

// PATCH: Update amount spent for a decision
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid decision ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { amountSpent } = updateAmountSchema.parse(body);

    const db = await connectToDatabase();

    // Check if decision exists and user is a participant
    const decision = await db.collection('decisions').findOne({
      _id: new ObjectId(id),
      participants: userId,
      status: 'completed',
    });

    if (!decision) {
      return NextResponse.json(
        { error: 'Decision not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update the amount spent
    const result = await db.collection('decisions').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          amountSpent: Number(amountSpent.toFixed(2)), // Ensure 2 decimal places
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update decision' },
        { status: 500 }
      );
    }

    logger.info(`Amount spent updated for decision ${id}: $${amountSpent}`);

    return NextResponse.json({
      success: true,
      message: 'Amount spent updated successfully',
      amountSpent: Number(amountSpent.toFixed(2)),
    });
  } catch (error) {
    logger.error('Update amount spent error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update amount spent' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a decision
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid decision ID' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    // Check if decision exists and user is a participant
    const decision = await db.collection('decisions').findOne({
      _id: new ObjectId(id),
      participants: userId,
    });

    if (!decision) {
      return NextResponse.json(
        { error: 'Decision not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the decision
    const result = await db.collection('decisions').deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete decision' },
        { status: 500 }
      );
    }

    logger.info(
      `Decision ${id} deleted by user ${userId}. Restaurant: ${decision.result?.restaurantId}, Collection: ${decision.collectionId}`
    );

    return NextResponse.json({
      success: true,
      message: 'Decision deleted successfully',
    });
  } catch (error) {
    logger.error('Delete decision error:', error);

    return NextResponse.json(
      { error: 'Failed to delete decision' },
      { status: 500 }
    );
  }
}
