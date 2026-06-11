/**
 * Admin Error Management API
 *
 * PATCH /api/admin/errors/[fingerprint] - Update error group status
 * DELETE /api/admin/errors/[fingerprint] - Delete error group
 */

import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fingerprint: string }> }
) {
  try {
    // Check if user is admin
    const user = await requireAdminAuth();

    const { fingerprint } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const db = await connectToDatabase();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = user._id;
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const result = await db
      .collection('errorGroups')
      .updateOne({ fingerprint }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Error group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    logger.error('Error updating error group:', error);
    return NextResponse.json(
      { error: 'Failed to update error group' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fingerprint: string }> }
) {
  try {
    // Check if user is admin
    await requireAdminAuth();

    const { fingerprint } = await params;
    const db = await connectToDatabase();

    // Delete error group and all associated logs
    await db.collection('errorGroups').deleteOne({ fingerprint });
    await db.collection('errorLogs').deleteMany({ fingerprint });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    logger.error('Error deleting error group:', error);
    return NextResponse.json(
      { error: 'Failed to delete error group' },
      { status: 500 }
    );
  }
}
