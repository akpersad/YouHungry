import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getGroupById,
  updateGroup,
  deleteGroup,
  getGroupMembers,
} from '@/lib/groups';
import { validateData, groupSchema } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id: groupId } = await params;

    const group = await getGroupById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get group members with user details
    const members = await getGroupMembers(groupId);

    return NextResponse.json({
      group: {
        ...group,
        members,
      },
    });
  } catch (error) {
    logger.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: groupId } = await params;
    const body = await request.json();

    // Validate request body
    const validation = validateData(groupSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, description } = validation.data!;

    const group = await updateGroup(
      groupId,
      { name, description },
      user._id.toString()
    );
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or user is not an admin' },
        { status: 404 }
      );
    }

    return NextResponse.json({ group });
  } catch (error) {
    logger.error('Error updating group:', error);
    if (error instanceof Error && error.message.includes('not an admin')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: groupId } = await params;

    const success = await deleteGroup(groupId, user._id.toString());
    if (!success) {
      return NextResponse.json(
        { error: 'Group not found or user is not an admin' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting group:', error);
    if (error instanceof Error && error.message.includes('not an admin')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}
