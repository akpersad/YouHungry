/**
 * Performance Metrics API
 *
 * POST /api/admin/performance-metrics - Save new metrics
 * GET /api/admin/performance-metrics?period=1day|1week|2weeks|1month - Get recent metrics
 */

import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import {
  savePerformanceMetrics,
  getRecentPerformanceMetrics,
  getPerformanceMetrics,
} from '@/lib/performance-metrics';
import { PerformanceMetrics } from '@/types/performance-metrics';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/users';

// Get admin user IDs from environment variable (MongoDB user IDs)
const ADMIN_USER_IDS =
  process.env.ADMIN_USER_IDS?.split(',').map((id) => id.trim()) || [];

/**
 * GET - Retrieve performance metrics
 * Query params:
 *   - period: 1day|1week|2weeks|1month (optional, default: 1week)
 *   - date: YYYY-MM-DD (optional, get specific date)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin access
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (!user || !ADMIN_USER_IDS.includes(user._id.toString())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period');
    const date = searchParams.get('date');

    // If specific date requested
    if (date) {
      const metrics = await getPerformanceMetrics(date);
      if (!metrics) {
        return NextResponse.json(
          { error: 'Metrics not found for date' },
          { status: 404 }
        );
      }
      return NextResponse.json(metrics);
    }

    // Get recent metrics based on period
    let days = 7; // Default to 1 week
    if (period === '1day') days = 1;
    else if (period === '1week') days = 7;
    else if (period === '2weeks') days = 14;
    else if (period === '1month') days = 30;

    const metrics = await getRecentPerformanceMetrics(days);
    return NextResponse.json(metrics);
  } catch (error) {
    logger.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

/**
 * POST - Save performance metrics
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin access
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (!user || !ADMIN_USER_IDS.includes(user._id.toString())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const metrics: PerformanceMetrics = await request.json();

    // Validate required fields
    if (!metrics.date || !metrics.bundleSize || !metrics.buildTime) {
      return NextResponse.json(
        { error: 'Invalid metrics data' },
        { status: 400 }
      );
    }

    await savePerformanceMetrics(metrics);

    return NextResponse.json({ success: true, date: metrics.date });
  } catch (error) {
    logger.error('Error saving performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to save performance metrics' },
      { status: 500 }
    );
  }
}
