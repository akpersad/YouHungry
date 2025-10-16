/**
 * Performance Metrics Comparison API
 *
 * GET /api/admin/performance-metrics/compare?period=1day|1week|2weeks|1month
 * GET /api/admin/performance-metrics/compare?date1=YYYY-MM-DD&date2=YYYY-MM-DD
 */

import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import {
  comparePerformanceMetrics,
  compareWithPeriod,
} from '@/lib/performance-metrics';
import { ComparisonPeriod } from '@/types/performance-metrics';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/users';

// Get admin user IDs from environment variable (MongoDB user IDs)
const ADMIN_USER_IDS =
  process.env.ADMIN_USER_IDS?.split(',').map((id) => id.trim()) || [];

/**
 * GET - Compare performance metrics
 * Query params:
 *   - period: 1day|1week|2weeks|1month (compare with period ago)
 *   - date1: YYYY-MM-DD (custom comparison start date)
 *   - date2: YYYY-MM-DD (custom comparison end date)
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
    const period = searchParams.get('period') as ComparisonPeriod | null;
    const date1 = searchParams.get('date1');
    const date2 = searchParams.get('date2');

    // Custom date comparison
    if (date1 && date2) {
      const comparison = await comparePerformanceMetrics(date1, date2);
      return NextResponse.json(comparison);
    }

    // Period-based comparison
    if (period && ['1day', '1week', '2weeks', '1month'].includes(period)) {
      const comparison = await compareWithPeriod(period);
      if (!comparison) {
        return NextResponse.json(
          { error: 'Metrics not found for comparison period' },
          { status: 404 }
        );
      }
      return NextResponse.json(comparison);
    }

    return NextResponse.json(
      { error: 'Invalid parameters. Provide either period or date1 & date2' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error comparing performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to compare performance metrics' },
      { status: 500 }
    );
  }
}
