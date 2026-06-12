import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { isCronSecretConfigured, verifyCronAuth } from '@/lib/cron-auth';

// This endpoint will be called by Vercel Cron Jobs
// Set up in vercel.json: https://vercel.com/docs/cron-jobs
export async function GET(request: NextRequest) {
  try {
    // Security: Verify cron secret (timing-safe comparison)
    const authHeader = request.headers.get('authorization');

    if (!isCronSecretConfigured()) {
      logger.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    if (!verifyCronAuth(authHeader)) {
      logger.warn('Unauthorized cron job access attempt', {
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Import the monitoring function
    const { checkVercelUsage } =
      await import('@/app/api/monitoring/vercel-usage/route');

    // Run the usage check
    await checkVercelUsage();

    return NextResponse.json({
      success: true,
      message: 'Vercel usage monitoring completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cron job failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
