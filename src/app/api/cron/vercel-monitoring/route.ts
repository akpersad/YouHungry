import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

// This endpoint will be called by Vercel Cron Jobs
// Set up in vercel.json: https://vercel.com/docs/cron-jobs
export async function GET(_request: NextRequest) {
  try {
    // Import the monitoring function
    const { checkVercelUsage } = await import(
      '@/app/api/monitoring/vercel-usage/route'
    );

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
