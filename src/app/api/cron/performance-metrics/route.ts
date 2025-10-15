/**
 * Vercel Cron Job: Daily Performance Metrics Collection
 *
 * This endpoint is triggered by Vercel's cron scheduler to collect
 * performance metrics and save them to MongoDB.
 *
 * Schedule: Daily at 6:00 AM EST (11:00 AM UTC)
 * Configured in: vercel.json
 *
 * Security: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server';
import { collectAllMetrics, healthCheck } from '@/lib/metrics-collector';
import { logger } from '@/lib/logger';

// Allow up to 5 minutes for metrics collection
export const maxDuration = 300;

// Disable caching for cron jobs
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/performance-metrics
 *
 * Collects performance metrics and saves to MongoDB
 * Called by Vercel Cron on schedule or manually for testing
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Security: Verify cron secret
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      logger.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedAuth) {
      logger.warn('Unauthorized cron job access attempt', {
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log cron job execution
    logger.info('Cron job started: performance metrics collection', {
      trigger: 'vercel-cron',
      timestamp: new Date().toISOString(),
    });

    // Health check
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      logger.error('Health check failed before metrics collection');
      return NextResponse.json(
        {
          error: 'Health check failed',
          message: 'Unable to connect to required services',
        },
        { status: 503 }
      );
    }

    // Collect all metrics
    const result = await collectAllMetrics();

    const duration = Date.now() - startTime;

    if (result.success) {
      logger.info('Cron job completed successfully', {
        date: result.date,
        duration: `${duration}ms`,
        metricsCollected: Object.keys(result.metrics || {}).length,
      });

      return NextResponse.json({
        success: true,
        date: result.date,
        duration: `${duration}ms`,
        metrics: result.metrics,
        message: 'Performance metrics collected successfully',
      });
    } else {
      logger.error('Cron job completed with errors', {
        error: result.error,
        duration: `${duration}ms`,
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          duration: `${duration}ms`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    logger.error('Cron job failed with exception', {
      error: errorMessage,
      duration: `${duration}ms`,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/performance-metrics
 *
 * Manual trigger endpoint (admin only)
 * Useful for testing without waiting for scheduled cron
 */
export async function POST(request: NextRequest) {
  // For manual triggers, we could use different authentication
  // For now, reuse the same GET handler
  return GET(request);
}
