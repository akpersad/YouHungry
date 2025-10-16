/**
 * Admin API: Manually Trigger Performance Metrics Collection
 *
 * POST /api/admin/performance/collect
 *
 * Allows admins to manually trigger performance metrics collection
 * outside of the scheduled cron job.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/users';
import { collectAllMetrics } from '@/lib/metrics-collector';
import { logger } from '@/lib/logger';

// Get admin user IDs from environment variable (MongoDB user IDs)
const ADMIN_USER_IDS =
  process.env.ADMIN_USER_IDS?.split(',').map((id) => id.trim()) || [];

// Allow up to 5 minutes for metrics collection
export const maxDuration = 300;

/**
 * POST - Manually trigger performance metrics collection
 */
export async function POST(_request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check authentication and admin access
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (!user || !ADMIN_USER_IDS.includes(user._id.toString())) {
      logger.warn('Unauthorized metrics collection attempt', {
        userId,
        clerkId: userId,
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    logger.info('Manual metrics collection triggered', {
      userId: user._id.toString(),
      email: user.email,
    });

    // Collect all metrics
    const result = await collectAllMetrics();

    const duration = Date.now() - startTime;

    if (result.success) {
      logger.info('Manual metrics collection completed successfully', {
        date: result.date,
        duration: `${duration}ms`,
        userId: user._id.toString(),
      });

      return NextResponse.json({
        success: true,
        date: result.date,
        duration: `${duration}ms`,
        metrics: result.metrics,
        message: 'Performance metrics collected successfully',
      });
    } else {
      logger.error('Manual metrics collection failed', {
        error: result.error,
        duration: `${duration}ms`,
        userId: user._id.toString(),
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Unknown error occurred',
          duration: `${duration}ms`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error during manual metrics collection:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to collect performance metrics',
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}
