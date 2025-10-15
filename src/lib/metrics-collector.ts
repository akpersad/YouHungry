/**
 * Performance Metrics Collector
 *
 * Collects comprehensive performance metrics from the production application
 * and saves them to MongoDB.
 *
 * This module can be called from:
 * - Local CLI: npm run perf:collect
 * - Vercel Cron Job: /api/cron/performance-metrics
 * - Manual API call (admin-only)
 */

import { savePerformanceMetrics } from './performance-metrics';
import { logger } from './logger';
import type { PerformanceMetrics } from '@/types/performance-metrics';

interface MetricsResult {
  success: boolean;
  date: string;
  metrics?: {
    bundleSize?: unknown;
    buildTime?: unknown;
    webVitals?: unknown;
    apiPerformance?: unknown;
    system?: unknown;
  };
  error?: string;
}

/**
 * Collect bundle size metrics from the production build
 * Note: Not used in serverless cron - only available during build time
 */
async function _collectBundleSizeMetrics() {
  // In production, we can't rebuild, so we'll fetch from the build manifest
  // or skip this metric. For now, return placeholder that indicates
  // this should be collected during build/deploy time
  logger.info('Skipping bundle size metrics (not available in serverless)');
  return null;
}

/**
 * Collect web vitals from the running application
 * Note: Not used in serverless cron - collected client-side via /api/web-vitals
 */
async function _collectWebVitalsMetrics() {
  // Web vitals should be collected client-side via /api/web-vitals
  // For the cron job, we can query recent web vitals from the database
  // or external monitoring service
  logger.info('Web vitals collected client-side via /api/web-vitals');
  return null;
}

/**
 * Collect API performance metrics from database
 */
async function collectAPIMetrics() {
  try {
    // In production, we need to make an internal API call
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/admin/cost-monitoring`, {
      headers: {
        // For internal calls, we might need to pass auth
        'x-internal-call': process.env.INTERNAL_API_SECRET || '',
      },
    });

    if (!response.ok) {
      logger.error('Failed to fetch API metrics', { status: response.status });
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.metrics) {
      logger.error('Invalid API response');
      return null;
    }

    // Calculate total API requests from all tracked services
    const googlePlaces = data.metrics.googlePlaces;
    const totalGoogleRequests =
      googlePlaces.textSearch +
      googlePlaces.nearbySearch +
      googlePlaces.placeDetails +
      googlePlaces.geocoding +
      googlePlaces.addressValidation;

    // Get cache statistics
    const cache = data.metrics.cache;

    return {
      totalRequests: totalGoogleRequests,
      cacheHitRate: cache.hitRate,
      totalCacheHits: cache.totalHits,
      memoryEntries: cache.memoryEntries,
      dailyCost: data.metrics.estimatedCosts.daily,
      monthlyCost: data.metrics.estimatedCosts.monthly,
      timestamp: Date.now(),
    };
  } catch (error) {
    logger.error('Error collecting API metrics', { error });
    return null;
  }
}

/**
 * Collect system metrics
 */
function collectSystemMetrics() {
  // In serverless, we get limited system info
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: Date.now(),
  };
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Collect all performance metrics and save to MongoDB
 *
 * This is the main function called by the cron job
 */
export async function collectAllMetrics(): Promise<MetricsResult> {
  const date = getCurrentDate();
  logger.info('Starting performance metrics collection', { date });

  try {
    const metrics: {
      bundleSize?: unknown;
      buildTime?: unknown;
      webVitals?: unknown;
      apiPerformance?: unknown;
      system?: unknown;
    } = {};

    // Collect available metrics
    // Note: Some metrics (bundle size, build time) are only available during build
    // and should be collected by build-time hooks or separate processes

    // API Performance (available in production)
    metrics.apiPerformance = await collectAPIMetrics();

    // System metrics (always available)
    metrics.system = collectSystemMetrics();

    // Bundle size and build time should be collected during deployment
    // Web vitals should be aggregated from client-side reporting

    // Prepare document for MongoDB
    const document: Partial<PerformanceMetrics> = {
      date,
      lastUpdated: new Date().toISOString(),
    };

    // Add optional metrics if available
    if (metrics.bundleSize)
      document.bundleSize =
        metrics.bundleSize as PerformanceMetrics['bundleSize'];
    if (metrics.buildTime)
      document.buildTime = metrics.buildTime as PerformanceMetrics['buildTime'];
    if (metrics.webVitals)
      document.webVitals = metrics.webVitals as PerformanceMetrics['webVitals'];
    if (metrics.apiPerformance)
      document.apiPerformance =
        metrics.apiPerformance as PerformanceMetrics['apiPerformance'];
    if (metrics.system)
      document.system = metrics.system as PerformanceMetrics['system'];

    // Save to MongoDB (upserts based on date)
    await savePerformanceMetrics(document as PerformanceMetrics);

    logger.info('Performance metrics collected successfully', { date });

    return {
      success: true,
      date,
      metrics,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to collect performance metrics', {
      error: errorMessage,
    });

    return {
      success: false,
      date,
      error: errorMessage,
    };
  }
}

/**
 * Health check for the metrics collector
 */
export async function healthCheck(): Promise<boolean> {
  try {
    // Verify MongoDB connection by attempting to query
    const { connectToDatabase } = await import('./db');
    await connectToDatabase();
    return true;
  } catch (error) {
    logger.error('Health check failed', { error });
    return false;
  }
}
