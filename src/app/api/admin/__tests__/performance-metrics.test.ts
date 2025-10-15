/**
 * Performance Metrics API Tests
 *
 * Tests the /api/admin/performance/metrics endpoint (MongoDB version)
 */

import { GET } from '../performance/metrics/route';

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/lib/performance-metrics', () => ({
  getRecentPerformanceMetrics: jest.fn(),
}));

import { getRecentPerformanceMetrics } from '@/lib/performance-metrics';

describe('/api/admin/performance/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return metrics data successfully', async () => {
    const mockMetricsData = [
      {
        date: '2024-01-01',
        bundleSize: {
          firstLoadJS: 245760,
          totalBundleSize: 512000,
          fileCount: 15,
          timestamp: Date.now(),
        },
        buildTime: {
          buildTime: 45000,
          timestamp: Date.now(),
        },
        webVitals: {
          fcp: 1200,
          lcp: 2500,
          fid: 50,
          cls: 0.05,
          ttfb: 800,
          timestamp: Date.now(),
        },
        apiPerformance: {
          totalRequests: 1000,
          cacheHitRate: 85,
          totalCacheHits: 850,
          memoryEntries: 100,
          dailyCost: 0.05,
          monthlyCost: 1.5,
          timestamp: Date.now(),
        },
        system: {
          platform: 'linux',
          arch: 'x64',
          nodeVersion: 'v18.17.0',
          memoryUsage: {
            rss: 50000000,
            heapTotal: 30000000,
            heapUsed: 20000000,
            external: 10000000,
            arrayBuffers: 5000000,
          },
          uptime: 3600,
          timestamp: Date.now(),
        },
        lastUpdated: '2024-01-01T12:00:00Z',
      },
      {
        date: '2024-01-02',
        bundleSize: {
          firstLoadJS: 250000,
          totalBundleSize: 520000,
          fileCount: 16,
          timestamp: Date.now(),
        },
        buildTime: {
          buildTime: 46000,
          timestamp: Date.now(),
        },
        webVitals: {
          fcp: 1100,
          lcp: 2400,
          fid: 45,
          cls: 0.04,
          ttfb: 750,
          timestamp: Date.now(),
        },
        apiPerformance: {
          totalRequests: 1100,
          cacheHitRate: 87,
          totalCacheHits: 957,
          memoryEntries: 110,
          dailyCost: 0.06,
          monthlyCost: 1.8,
          timestamp: Date.now(),
        },
        system: {
          platform: 'linux',
          arch: 'x64',
          nodeVersion: 'v18.17.0',
          memoryUsage: {
            rss: 52000000,
            heapTotal: 32000000,
            heapUsed: 22000000,
            external: 11000000,
            arrayBuffers: 6000000,
          },
          uptime: 7200,
          timestamp: Date.now(),
        },
        lastUpdated: '2024-01-02T12:00:00Z',
      },
    ];

    (getRecentPerformanceMetrics as jest.Mock).mockResolvedValue(
      mockMetricsData
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metrics).toBeDefined();
    expect(data.metrics.length).toBe(2);
    expect(data.totalFiles).toBe(2);
    expect(data.dateRange).toBeDefined();
    expect(data.dateRange.from).toBe('2024-01-01');
    expect(data.dateRange.to).toBe('2024-01-02');
  });

  it('should return empty metrics when no data in database', async () => {
    (getRecentPerformanceMetrics as jest.Mock).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metrics).toEqual([]);
    expect(data.message).toBe('No metrics found in database');
  });

  it('should sort metrics by date correctly', async () => {
    const mockMetricsData = [
      {
        date: '2024-01-03',
        bundleSize: {
          firstLoadJS: 250000,
          totalBundleSize: 520000,
          fileCount: 16,
          timestamp: Date.now(),
        },
        buildTime: { buildTime: 46000, timestamp: Date.now() },
        webVitals: {
          fcp: 1100,
          lcp: 2400,
          fid: 45,
          cls: 0.04,
          ttfb: 750,
          timestamp: Date.now(),
        },
        apiPerformance: {
          totalRequests: 1100,
          cacheHitRate: 87,
          totalCacheHits: 957,
          memoryEntries: 110,
          dailyCost: 0.06,
          monthlyCost: 1.8,
          timestamp: Date.now(),
        },
        system: {
          platform: 'linux',
          arch: 'x64',
          nodeVersion: 'v18.17.0',
          memoryUsage: {
            rss: 52000000,
            heapTotal: 32000000,
            heapUsed: 22000000,
            external: 11000000,
            arrayBuffers: 6000000,
          },
          uptime: 7200,
          timestamp: Date.now(),
        },
        lastUpdated: '2024-01-03T12:00:00Z',
      },
      {
        date: '2024-01-01',
        bundleSize: {
          firstLoadJS: 245760,
          totalBundleSize: 512000,
          fileCount: 15,
          timestamp: Date.now(),
        },
        buildTime: { buildTime: 45000, timestamp: Date.now() },
        webVitals: {
          fcp: 1200,
          lcp: 2500,
          fid: 50,
          cls: 0.05,
          ttfb: 800,
          timestamp: Date.now(),
        },
        apiPerformance: {
          totalRequests: 1000,
          cacheHitRate: 85,
          totalCacheHits: 850,
          memoryEntries: 100,
          dailyCost: 0.05,
          monthlyCost: 1.5,
          timestamp: Date.now(),
        },
        system: {
          platform: 'linux',
          arch: 'x64',
          nodeVersion: 'v18.17.0',
          memoryUsage: {
            rss: 50000000,
            heapTotal: 30000000,
            heapUsed: 20000000,
            external: 10000000,
            arrayBuffers: 5000000,
          },
          uptime: 3600,
          timestamp: Date.now(),
        },
        lastUpdated: '2024-01-01T12:00:00Z',
      },
      {
        date: '2024-01-02',
        bundleSize: {
          firstLoadJS: 248000,
          totalBundleSize: 516000,
          fileCount: 15,
          timestamp: Date.now(),
        },
        buildTime: { buildTime: 45500, timestamp: Date.now() },
        webVitals: {
          fcp: 1150,
          lcp: 2450,
          fid: 48,
          cls: 0.045,
          ttfb: 775,
          timestamp: Date.now(),
        },
        apiPerformance: {
          totalRequests: 1050,
          cacheHitRate: 86,
          totalCacheHits: 903,
          memoryEntries: 105,
          dailyCost: 0.055,
          monthlyCost: 1.65,
          timestamp: Date.now(),
        },
        system: {
          platform: 'linux',
          arch: 'x64',
          nodeVersion: 'v18.17.0',
          memoryUsage: {
            rss: 51000000,
            heapTotal: 31000000,
            heapUsed: 21000000,
            external: 10500000,
            arrayBuffers: 5500000,
          },
          uptime: 5400,
          timestamp: Date.now(),
        },
        lastUpdated: '2024-01-02T12:00:00Z',
      },
    ];

    (getRecentPerformanceMetrics as jest.Mock).mockResolvedValue(
      mockMetricsData
    );

    const response = await GET();
    const data = await response.json();

    expect(data.totalFiles).toBe(3);
    expect(data.dateRange.from).toBe('2024-01-01'); // Sorted by date ascending
    expect(data.dateRange.to).toBe('2024-01-03');
    expect(data.metrics[0].date).toBe('2024-01-01');
    expect(data.metrics[2].date).toBe('2024-01-03');
  });

  it('should handle database errors', async () => {
    (getRecentPerformanceMetrics as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to load performance metrics');
  });

  it('should preserve original metrics data structure', async () => {
    const mockMetricsData = [
      {
        date: '2024-01-01',
        bundleSize: {
          firstLoadJS: 245760,
          totalBundleSize: 512000,
          fileCount: 15,
          timestamp: Date.now(),
        },
        buildTime: {
          buildTime: 45000,
          timestamp: Date.now(),
        },
        webVitals: {
          fcp: 1200,
          lcp: 2500,
          fid: 50,
          cls: 0.05,
          ttfb: 800,
          timestamp: Date.now(),
        },
        apiPerformance: {
          totalRequests: 1000,
          cacheHitRate: 85,
          totalCacheHits: 850,
          memoryEntries: 100,
          dailyCost: 0.05,
          monthlyCost: 1.5,
          timestamp: Date.now(),
        },
        system: {
          platform: 'linux',
          arch: 'x64',
          nodeVersion: 'v18.17.0',
          memoryUsage: {
            rss: 50000000,
            heapTotal: 30000000,
            heapUsed: 20000000,
            external: 10000000,
            arrayBuffers: 5000000,
          },
          uptime: 3600,
          timestamp: Date.now(),
        },
        lastUpdated: '2024-01-01T12:00:00Z',
      },
    ];

    (getRecentPerformanceMetrics as jest.Mock).mockResolvedValue(
      mockMetricsData
    );

    const response = await GET();
    const data = await response.json();

    expect(data.metrics[0].date).toBe('2024-01-01');
    expect(data.metrics[0].webVitals).toBeDefined();
    expect(data.metrics[0].bundleSize).toBeDefined();
    expect(data.metrics[0].system).toBeDefined();
  });

  it('should handle null or undefined metrics gracefully', async () => {
    (getRecentPerformanceMetrics as jest.Mock).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metrics).toEqual([]);
    expect(data.message).toBe('No metrics found in database');
  });

  it('should handle multiple metrics with different dates', async () => {
    const mockMetricsData = [
      {
        date: '2024-01-15',
        bundleSize: {
          firstLoadJS: 250000,
          totalBundleSize: 520000,
          fileCount: 16,
          timestamp: Date.now(),
        },
        buildTime: { buildTime: 46000, timestamp: Date.now() },
        webVitals: {
          fcp: 1100,
          lcp: 2400,
          fid: 45,
          cls: 0.04,
          ttfb: 750,
          timestamp: Date.now(),
        },
        apiPerformance: {
          totalRequests: 1100,
          cacheHitRate: 87,
          totalCacheHits: 957,
          memoryEntries: 110,
          dailyCost: 0.06,
          monthlyCost: 1.8,
          timestamp: Date.now(),
        },
        system: {
          platform: 'linux',
          arch: 'x64',
          nodeVersion: 'v18.17.0',
          memoryUsage: {
            rss: 52000000,
            heapTotal: 32000000,
            heapUsed: 22000000,
            external: 11000000,
            arrayBuffers: 6000000,
          },
          uptime: 7200,
          timestamp: Date.now(),
        },
        lastUpdated: '2024-01-15T12:00:00Z',
      },
      {
        date: '2024-01-10',
        bundleSize: {
          firstLoadJS: 245760,
          totalBundleSize: 512000,
          fileCount: 15,
          timestamp: Date.now(),
        },
        buildTime: { buildTime: 45000, timestamp: Date.now() },
        webVitals: {
          fcp: 1200,
          lcp: 2500,
          fid: 50,
          cls: 0.05,
          ttfb: 800,
          timestamp: Date.now(),
        },
        apiPerformance: {
          totalRequests: 1000,
          cacheHitRate: 85,
          totalCacheHits: 850,
          memoryEntries: 100,
          dailyCost: 0.05,
          monthlyCost: 1.5,
          timestamp: Date.now(),
        },
        system: {
          platform: 'linux',
          arch: 'x64',
          nodeVersion: 'v18.17.0',
          memoryUsage: {
            rss: 50000000,
            heapTotal: 30000000,
            heapUsed: 20000000,
            external: 10000000,
            arrayBuffers: 5000000,
          },
          uptime: 3600,
          timestamp: Date.now(),
        },
        lastUpdated: '2024-01-10T12:00:00Z',
      },
      {
        date: '2024-01-20',
        bundleSize: {
          firstLoadJS: 248000,
          totalBundleSize: 516000,
          fileCount: 15,
          timestamp: Date.now(),
        },
        buildTime: { buildTime: 45500, timestamp: Date.now() },
        webVitals: {
          fcp: 1150,
          lcp: 2450,
          fid: 48,
          cls: 0.045,
          ttfb: 775,
          timestamp: Date.now(),
        },
        apiPerformance: {
          totalRequests: 1050,
          cacheHitRate: 86,
          totalCacheHits: 903,
          memoryEntries: 105,
          dailyCost: 0.055,
          monthlyCost: 1.65,
          timestamp: Date.now(),
        },
        system: {
          platform: 'linux',
          arch: 'x64',
          nodeVersion: 'v18.17.0',
          memoryUsage: {
            rss: 51000000,
            heapTotal: 31000000,
            heapUsed: 21000000,
            external: 10500000,
            arrayBuffers: 5500000,
          },
          uptime: 5400,
          timestamp: Date.now(),
        },
        lastUpdated: '2024-01-20T12:00:00Z',
      },
    ];

    (getRecentPerformanceMetrics as jest.Mock).mockResolvedValue(
      mockMetricsData
    );

    const response = await GET();
    const data = await response.json();

    expect(data.metrics.length).toBe(3);
    expect(data.dateRange.from).toBe('2024-01-10'); // Earliest date after sorting
    expect(data.dateRange.to).toBe('2024-01-20'); // Latest date

    // Check that metrics are sorted by date ascending
    expect(data.metrics[0].date).toBe('2024-01-10');
    expect(data.metrics[1].date).toBe('2024-01-15');
    expect(data.metrics[2].date).toBe('2024-01-20');
  });
});
