import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { performGroupRandomSelection } from '@/lib/decisions';
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

    const body = await request.json();
    const { collectionId, groupId, visitDate } =
      groupRandomSelectSchema.parse(body);

    // For now, we'll need to get the group members - this should be enhanced
    // to get actual group members from the group
    const participants = [userId]; // TODO: Get actual group members

    const result = await performGroupRandomSelection(
      collectionId,
      groupId,
      participants,
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
    console.error('Group random selection error:', error);

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
