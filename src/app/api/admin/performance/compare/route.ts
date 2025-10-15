import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import {
  getRecentPerformanceMetrics,
  comparePerformanceMetrics,
} from '@/lib/performance-metrics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '1');

    // Get recent metrics from MongoDB
    const metrics = await getRecentPerformanceMetrics(90);

    if (!metrics || metrics.length === 0) {
      return NextResponse.json(
        {
          error: 'No metrics found in database',
          availableDates: [],
        },
        { status: 404 }
      );
    }

    if (metrics.length < 2) {
      return NextResponse.json(
        {
          error: 'Need at least 2 metrics records to compare',
          availableFiles: metrics.length,
          availableDates: metrics.map((m) => m.date),
        },
        { status: 400 }
      );
    }

    // Sort by date descending (most recent first)
    const sortedMetrics = metrics.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate comparison dates
    const today = new Date().toISOString().split('T')[0];
    const compareDate = new Date();
    compareDate.setDate(compareDate.getDate() - days);
    const compareDateStr = compareDate.toISOString().split('T')[0];

    // Find the most recent metrics (today or closest to today)
    const metrics2 =
      sortedMetrics.find((m) => m.date <= today) || sortedMetrics[0];

    // Find the metrics for the comparison date or closest to it
    let metrics1 = sortedMetrics.find((m) => m.date <= compareDateStr);

    // If no metrics found for the requested day, keep going back until we find one
    if (!metrics1 && sortedMetrics.length > 1) {
      // Find the first metrics that's before the comparison date
      metrics1 = sortedMetrics.find((m) => m.date < compareDateStr);
      // If still no metrics found, use the second most recent (after metrics2)
      if (!metrics1 && sortedMetrics.length > 1) {
        metrics1 = sortedMetrics[1]; // Second most recent
      }
    }

    if (!metrics1 || !metrics2) {
      return NextResponse.json(
        {
          error: `No metrics found for comparison`,
          lookingFor: compareDateStr,
          availableDates: sortedMetrics.map((m) => m.date),
          totalRecords: sortedMetrics.length,
        },
        { status: 404 }
      );
    }

    // Ensure we're not comparing the same date
    if (metrics1.date === metrics2.date) {
      // If we're comparing the same date, find the previous unique date
      const uniqueDates = [...new Set(sortedMetrics.map((m) => m.date))];
      const currentIndex = uniqueDates.indexOf(metrics2.date);
      // Since array is sorted descending (newest first), we need the next index for an older date
      if (currentIndex >= 0 && currentIndex < uniqueDates.length - 1) {
        const previousDate = uniqueDates[currentIndex + 1];
        metrics1 =
          sortedMetrics.find((m) => m.date === previousDate) || metrics1;
      } else {
        return NextResponse.json(
          {
            error: `Cannot compare: only one unique date available`,
            availableDates: uniqueDates,
          },
          { status: 400 }
        );
      }
    }

    // Use the comparison function from the library
    const comparison = await comparePerformanceMetrics(
      metrics1.date,
      metrics2.date
    );

    // Add summary statistics
    const summary = {
      date1: metrics1.date,
      date2: metrics2.date,
      generatedAt: new Date().toISOString(),
      metricsCompared: Object.keys(comparison.comparison).length,
    };

    return NextResponse.json({
      ...summary,
      comparison: comparison.comparison,
      metrics1: comparison.metrics1,
      metrics2: comparison.metrics2,
    });
  } catch (error) {
    logger.error('Error comparing performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to compare performance metrics' },
      { status: 500 }
    );
  }
}
