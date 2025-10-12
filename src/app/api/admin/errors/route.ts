/**
 * Admin Errors API
 *
 * GET /api/admin/errors - Retrieve error groups and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getErrorStats } from '@/lib/error-tracking';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    await requireAdminAuth();

    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await connectToDatabase();

    // If requesting specific group details
    if (groupId) {
      const group = await db.collection('errorGroups').findOne({
        fingerprint: groupId,
      });

      if (!group) {
        return NextResponse.json(
          { error: 'Error group not found' },
          { status: 404 }
        );
      }

      // Get individual error logs for this group
      const errorLogs = await db
        .collection('errorLogs')
        .find({ fingerprint: groupId })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      return NextResponse.json({
        group,
        logs: errorLogs,
      });
    }

    // Get error groups with filters
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (severity) {
      filter.severity = severity;
    }

    if (category) {
      filter.category = category;
    }

    const errorGroups = await db
      .collection('errorGroups')
      .find(filter)
      .sort({ lastSeenAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const totalCount = await db
      .collection('errorGroups')
      .countDocuments(filter);

    // Get error statistics
    const stats = await getErrorStats();

    return NextResponse.json({
      groups: errorGroups,
      total: totalCount,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.error('Error fetching errors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch errors' },
      { status: 500 }
    );
  }
}
