import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createGroupDecision, getActiveGroupDecisions } from '@/lib/decisions';
import { getGroupById } from '@/lib/groups';
import { z } from 'zod';

const createGroupDecisionSchema = z.object({
  collectionId: z.string().min(1),
  groupId: z.string().min(1),
  method: z.enum(['random', 'tiered']).default('tiered'),
  visitDate: z.string().datetime(),
  deadlineHours: z.number().min(1).max(336).default(24), // 1 hour to 2 weeks
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { collectionId, groupId, method, visitDate, deadlineHours } =
      createGroupDecisionSchema.parse(body);

    // Get the group to find all members
    const group = await getGroupById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get all group members (both admins and regular members) and remove duplicates
    const allMemberIds = [...group.adminIds, ...group.memberIds];
    const uniqueMemberIds = [
      ...new Set(allMemberIds.map((id) => id.toString())),
    ];
    const participants = uniqueMemberIds;

    const decision = await createGroupDecision(
      collectionId,
      groupId,
      participants,
      method,
      new Date(visitDate),
      deadlineHours
    );

    return NextResponse.json({
      success: true,
      decision: {
        id: decision._id.toString(),
        type: decision.type,
        collectionId: decision.collectionId.toString(),
        groupId: decision.groupId?.toString(),
        method: decision.method,
        status: decision.status,
        deadline: decision.deadline.toISOString(),
        visitDate: decision.visitDate.toISOString(),
        participants: decision.participants,
        createdAt: decision.createdAt.toISOString(),
        updatedAt: decision.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create group decision error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues || [] },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create group decision' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const decisions = await getActiveGroupDecisions(groupId);

    return NextResponse.json({
      success: true,
      decisions: decisions.map((decision) => ({
        id: decision._id.toString(),
        type: decision.type,
        collectionId: decision.collectionId.toString(),
        groupId: decision.groupId?.toString(),
        method: decision.method,
        status: decision.status,
        deadline: decision.deadline.toISOString(),
        visitDate: decision.visitDate.toISOString(),
        participants: decision.participants,
        votes: decision.votes?.map((vote) => ({
          userId: vote.userId,
          submittedAt: vote.submittedAt.toISOString(),
          hasRankings: vote.rankings.length > 0,
        })),
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
    console.error('Get group decisions error:', error);
    return NextResponse.json(
      { error: 'Failed to get group decisions' },
      { status: 500 }
    );
  }
}
