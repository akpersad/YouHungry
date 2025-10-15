import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getRecentPerformanceMetrics } from '@/lib/performance-metrics';

export async function GET() {
  try {
    // Get all metrics from MongoDB (limit to 90 days)
    const metrics = await getRecentPerformanceMetrics(90);

    if (!metrics || metrics.length === 0) {
      return NextResponse.json({
        metrics: [],
        message: 'No metrics found in database',
      });
    }

    // Sort by date ascending
    const sortedMetrics = metrics.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({
      metrics: sortedMetrics,
      totalFiles: sortedMetrics.length,
      dateRange: {
        from: sortedMetrics[0].date,
        to: sortedMetrics[sortedMetrics.length - 1].date,
      },
    });
  } catch (error) {
    logger.error('Error loading performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to load performance metrics' },
      { status: 500 }
    );
  }
}
