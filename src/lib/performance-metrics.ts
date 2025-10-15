/**
 * Performance Metrics Database Operations
 *
 * Handles saving and querying performance metrics from MongoDB
 */

import { connectToDatabase } from './db';
import {
  PerformanceMetrics,
  MetricsComparison,
  ComparisonPeriod,
} from '@/types/performance-metrics';

const COLLECTION_NAME = 'performanceMetrics';

/**
 * Save performance metrics to MongoDB
 */
export async function savePerformanceMetrics(
  metrics: PerformanceMetrics
): Promise<void> {
  const db = await connectToDatabase();
  const collection = db.collection<PerformanceMetrics>(COLLECTION_NAME);

  // Upsert based on date (one entry per day)
  await collection.updateOne(
    { date: metrics.date },
    {
      $set: {
        ...metrics,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
}

/**
 * Get performance metrics for a specific date
 */
export async function getPerformanceMetrics(
  date: string
): Promise<PerformanceMetrics | null> {
  const db = await connectToDatabase();
  const collection = db.collection<PerformanceMetrics>(COLLECTION_NAME);

  const metrics = await collection.findOne({ date });
  return metrics;
}

/**
 * Get performance metrics for a date range
 */
export async function getPerformanceMetricsRange(
  startDate: string,
  endDate: string
): Promise<PerformanceMetrics[]> {
  const db = await connectToDatabase();
  const collection = db.collection<PerformanceMetrics>(COLLECTION_NAME);

  const metrics = await collection
    .find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    })
    .sort({ date: -1 })
    .toArray();

  return metrics;
}

/**
 * Get the most recent N days of performance metrics
 */
export async function getRecentPerformanceMetrics(
  days: number
): Promise<PerformanceMetrics[]> {
  const db = await connectToDatabase();
  const collection = db.collection<PerformanceMetrics>(COLLECTION_NAME);

  const metrics = await collection
    .find({})
    .sort({ date: -1 })
    .limit(days)
    .toArray();

  return metrics;
}

/**
 * Get date N days back from today
 */
function getDateDaysBack(daysBack: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(
  oldValue: number | null,
  newValue: number | null
): number | null {
  if (oldValue === null || newValue === null) return null;
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Compare metrics from two dates
 */
export async function comparePerformanceMetrics(
  date1: string,
  date2: string
): Promise<MetricsComparison> {
  const metrics1 = await getPerformanceMetrics(date1);
  const metrics2 = await getPerformanceMetrics(date2);

  const comparison: MetricsComparison = {
    date1,
    date2,
    metrics1,
    metrics2,
    comparison: {},
  };

  if (!metrics1 || !metrics2) {
    return comparison;
  }

  // Compare bundle size
  if (metrics1.bundleSize && metrics2.bundleSize) {
    comparison.comparison.bundleSize = {
      firstLoadJS: {
        value1: metrics1.bundleSize.firstLoadJS,
        value2: metrics2.bundleSize.firstLoadJS,
        change:
          metrics1.bundleSize.firstLoadJS && metrics2.bundleSize.firstLoadJS
            ? metrics2.bundleSize.firstLoadJS - metrics1.bundleSize.firstLoadJS
            : null,
        changePercent: calculatePercentageChange(
          metrics1.bundleSize.firstLoadJS,
          metrics2.bundleSize.firstLoadJS
        ),
      },
      totalBundleSize: {
        value1: metrics1.bundleSize.totalBundleSize,
        value2: metrics2.bundleSize.totalBundleSize,
        change:
          metrics2.bundleSize.totalBundleSize -
          metrics1.bundleSize.totalBundleSize,
        changePercent: calculatePercentageChange(
          metrics1.bundleSize.totalBundleSize,
          metrics2.bundleSize.totalBundleSize
        )!,
      },
      fileCount: {
        value1: metrics1.bundleSize.fileCount,
        value2: metrics2.bundleSize.fileCount,
        change: metrics2.bundleSize.fileCount - metrics1.bundleSize.fileCount,
        changePercent: calculatePercentageChange(
          metrics1.bundleSize.fileCount,
          metrics2.bundleSize.fileCount
        )!,
      },
    };
  }

  // Compare build time
  if (metrics1.buildTime && metrics2.buildTime) {
    comparison.comparison.buildTime = {
      buildTime: {
        value1: metrics1.buildTime.buildTime,
        value2: metrics2.buildTime.buildTime,
        change: metrics2.buildTime.buildTime - metrics1.buildTime.buildTime,
        changePercent: calculatePercentageChange(
          metrics1.buildTime.buildTime,
          metrics2.buildTime.buildTime
        )!,
      },
    };
  }

  // Compare web vitals
  if (metrics1.webVitals && metrics2.webVitals) {
    comparison.comparison.webVitals = {
      fcp: {
        value1: metrics1.webVitals.fcp,
        value2: metrics2.webVitals.fcp,
        change: metrics2.webVitals.fcp - metrics1.webVitals.fcp,
        changePercent: calculatePercentageChange(
          metrics1.webVitals.fcp,
          metrics2.webVitals.fcp
        )!,
      },
      lcp: {
        value1: metrics1.webVitals.lcp,
        value2: metrics2.webVitals.lcp,
        change: metrics2.webVitals.lcp - metrics1.webVitals.lcp,
        changePercent: calculatePercentageChange(
          metrics1.webVitals.lcp,
          metrics2.webVitals.lcp
        )!,
      },
      fid: {
        value1: metrics1.webVitals.fid,
        value2: metrics2.webVitals.fid,
        change: metrics2.webVitals.fid - metrics1.webVitals.fid,
        changePercent: calculatePercentageChange(
          metrics1.webVitals.fid,
          metrics2.webVitals.fid
        )!,
      },
      cls: {
        value1: metrics1.webVitals.cls,
        value2: metrics2.webVitals.cls,
        change: metrics2.webVitals.cls - metrics1.webVitals.cls,
        changePercent: calculatePercentageChange(
          metrics1.webVitals.cls,
          metrics2.webVitals.cls
        )!,
      },
      ttfb: {
        value1: metrics1.webVitals.ttfb,
        value2: metrics2.webVitals.ttfb,
        change: metrics2.webVitals.ttfb - metrics1.webVitals.ttfb,
        changePercent: calculatePercentageChange(
          metrics1.webVitals.ttfb,
          metrics2.webVitals.ttfb
        )!,
      },
    };
  }

  // Compare API performance
  if (metrics1.apiPerformance && metrics2.apiPerformance) {
    comparison.comparison.apiPerformance = {
      totalRequests: {
        value1: metrics1.apiPerformance.totalRequests,
        value2: metrics2.apiPerformance.totalRequests,
        change:
          metrics2.apiPerformance.totalRequests -
          metrics1.apiPerformance.totalRequests,
        changePercent: calculatePercentageChange(
          metrics1.apiPerformance.totalRequests,
          metrics2.apiPerformance.totalRequests
        )!,
      },
      cacheHitRate: {
        value1: metrics1.apiPerformance.cacheHitRate,
        value2: metrics2.apiPerformance.cacheHitRate,
        change:
          metrics2.apiPerformance.cacheHitRate -
          metrics1.apiPerformance.cacheHitRate,
        changePercent: calculatePercentageChange(
          metrics1.apiPerformance.cacheHitRate,
          metrics2.apiPerformance.cacheHitRate
        )!,
      },
      totalCacheHits: {
        value1: metrics1.apiPerformance.totalCacheHits,
        value2: metrics2.apiPerformance.totalCacheHits,
        change:
          metrics2.apiPerformance.totalCacheHits -
          metrics1.apiPerformance.totalCacheHits,
        changePercent: calculatePercentageChange(
          metrics1.apiPerformance.totalCacheHits,
          metrics2.apiPerformance.totalCacheHits
        )!,
      },
    };
  }

  // Compare system metrics
  if (metrics1.system && metrics2.system) {
    comparison.comparison.system = {
      memoryUsage: {
        heapUsed: {
          value1: metrics1.system.memoryUsage.heapUsed,
          value2: metrics2.system.memoryUsage.heapUsed,
          change:
            metrics2.system.memoryUsage.heapUsed -
            metrics1.system.memoryUsage.heapUsed,
          changePercent: calculatePercentageChange(
            metrics1.system.memoryUsage.heapUsed,
            metrics2.system.memoryUsage.heapUsed
          )!,
        },
      },
    };
  }

  return comparison;
}

/**
 * Compare current metrics with a specific period ago
 */
export async function compareWithPeriod(
  period: ComparisonPeriod
): Promise<MetricsComparison | null> {
  const today = new Date().toISOString().split('T')[0];

  let daysBack: number;
  switch (period) {
    case '1day':
      daysBack = 1;
      break;
    case '1week':
      daysBack = 7;
      break;
    case '2weeks':
      daysBack = 14;
      break;
    case '1month':
      daysBack = 30;
      break;
  }

  const compareDate = getDateDaysBack(daysBack);
  return comparePerformanceMetrics(compareDate, today);
}

/**
 * Delete metrics older than N days
 */
export async function deleteOldMetrics(daysToKeep: number): Promise<number> {
  const db = await connectToDatabase();
  const collection = db.collection<PerformanceMetrics>(COLLECTION_NAME);

  const cutoffDate = getDateDaysBack(daysToKeep);

  const result = await collection.deleteMany({
    date: { $lt: cutoffDate },
  });

  return result.deletedCount;
}
