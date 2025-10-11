/**
 * Performance Metrics API Tests
 *
 * Tests the /api/admin/performance/metrics endpoint
 */

import { GET } from '../performance/metrics/route';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import * as fs from 'fs';
import * as path from 'path';

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('/api/admin/performance/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock process.cwd()
    process.cwd = jest.fn().mockReturnValue('/app');
  });

  it('should return metrics data successfully', async () => {
    const mockMetricsData = {
      date: '2024-01-01',
      environment: 'production',
      webVitals: {
        fcp: 1200,
        lcp: 2500,
        fid: 50,
        cls: 0.05,
        ttfb: 800,
      },
      bundleSize: {
        firstLoadJS: 245760,
        totalBundleSize: 512000,
        fileCount: 15,
      },
      buildTime: {
        buildTime: 45000,
      },
    };

    mockPath.join.mockReturnValue('/app/performance-metrics/daily-metrics');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([
      'metrics-2024-01-01.json',
      'metrics-2024-01-02.json',
    ] as any);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(mockMetricsData));

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

  it('should return empty metrics when directory does not exist', async () => {
    mockPath.join.mockReturnValue('/app/performance-metrics/daily-metrics');
    mockFs.existsSync.mockReturnValue(false);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metrics).toEqual([]);
    expect(data.message).toBe('No metrics directory found');
  });

  it('should filter and sort metrics files correctly', async () => {
    const mockFiles = [
      'metrics-2024-01-03.json',
      'metrics-2024-01-01.json',
      'invalid-file.txt',
      'metrics-2024-01-02.json',
      'not-metrics-file.json',
    ];

    mockPath.join.mockReturnValue('/app/performance-metrics/daily-metrics');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(mockFiles as any);
    mockFs.readFileSync.mockReturnValue('{}');

    const response = await GET();
    const data = await response.json();

    expect(data.totalFiles).toBe(3); // Only metrics files
    expect(data.dateRange.from).toBe('2024-01-01'); // Sorted by date
    expect(data.dateRange.to).toBe('2024-01-03');
  });

  it('should handle invalid JSON files gracefully', async () => {
    const mockFiles = ['metrics-2024-01-01.json', 'metrics-2024-01-02.json'];

    mockPath.join.mockReturnValue('/app/performance-metrics/daily-metrics');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(mockFiles as any);
    mockFs.readFileSync
      .mockReturnValueOnce('{"valid": "json"}')
      .mockReturnValueOnce('invalid json content');

    const response = await GET();
    const data = await response.json();

    expect(data.metrics.length).toBe(1); // Only valid JSON file
    expect(data.totalFiles).toBe(2); // Total files found
  });

  it('should handle file reading errors gracefully', async () => {
    const mockFiles = ['metrics-2024-01-01.json'];

    mockPath.join.mockReturnValue('/app/performance-metrics/daily-metrics');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(mockFiles as any);
    mockFs.readFileSync.mockImplementation(() => {
      throw new Error('File read error');
    });

    const response = await GET();
    const data = await response.json();

    expect(data.metrics.length).toBe(0); // No valid metrics due to error
    expect(data.totalFiles).toBe(1); // File was found but couldn't be read
  });

  it('should return null dateRange when no files exist', async () => {
    mockPath.join.mockReturnValue('/app/performance-metrics/daily-metrics');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([] as any);

    const response = await GET();
    const data = await response.json();

    expect(data.dateRange).toBeNull();
    expect(data.totalFiles).toBe(0);
  });

  it('should handle filesystem errors', async () => {
    mockPath.join.mockReturnValue('/app/performance-metrics/daily-metrics');
    mockFs.existsSync.mockImplementation(() => {
      throw new Error('Filesystem error');
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to load performance metrics');
  });

  it('should handle readdirSync errors', async () => {
    mockPath.join.mockReturnValue('/app/performance-metrics/daily-metrics');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockImplementation(() => {
      throw new Error('Directory read error');
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to load performance metrics');
  });

  it('should preserve original metrics data structure', async () => {
    const mockMetricsData = {
      date: '2024-01-01',
      environment: 'production',
      webVitals: {
        fcp: 1200,
        lcp: 2500,
        fid: 50,
        cls: 0.05,
        ttfb: 800,
      },
      apiPerformance: {
        averageResponseTime: 150,
        successRate: 98.5,
        errorRate: 1.5,
        totalRequests: 1000,
      },
      system: {
        platform: 'linux',
        arch: 'x64',
        nodeVersion: '18.17.0',
        memoryUsage: {
          rss: 50000000,
          heapTotal: 30000000,
          heapUsed: 20000000,
          external: 10000000,
          arrayBuffers: 5000000,
        },
      },
    };

    mockPath.join.mockReturnValue('/app/performance-metrics/daily-metrics');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(['metrics-2024-01-01.json'] as any);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(mockMetricsData));

    const response = await GET();
    const data = await response.json();

    expect(data.metrics[0]).toEqual(mockMetricsData);
  });

  it('should handle empty metrics files', async () => {
    mockPath.join.mockReturnValue('/app/performance-metrics/daily-metrics');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(['metrics-2024-01-01.json'] as any);
    mockFs.readFileSync.mockReturnValue('{}');

    const response = await GET();
    const data = await response.json();

    expect(data.metrics[0]).toEqual({ date: '2024-01-01' });
  });

  it('should use correct path construction', async () => {
    mockPath.join.mockReturnValue('/app/performance-metrics/daily-metrics');
    mockFs.existsSync.mockReturnValue(false);

    await GET();

    expect(mockPath.join).toHaveBeenCalledWith(
      '/app',
      'performance-metrics',
      'daily-metrics'
    );
  });

  it('should handle multiple metrics files with different dates', async () => {
    const mockFiles = [
      'metrics-2024-01-15.json',
      'metrics-2024-01-10.json',
      'metrics-2024-01-20.json',
    ];

    const mockMetricsData1 = { webVitals: { fcp: 1000 } };
    const mockMetricsData2 = { webVitals: { fcp: 1200 } };
    const mockMetricsData3 = { webVitals: { fcp: 800 } };

    mockPath.join.mockReturnValue('/app/performance-metrics/daily-metrics');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(mockFiles as any);
    mockFs.readFileSync
      .mockReturnValueOnce(JSON.stringify(mockMetricsData1))
      .mockReturnValueOnce(JSON.stringify(mockMetricsData2))
      .mockReturnValueOnce(JSON.stringify(mockMetricsData3));

    const response = await GET();
    const data = await response.json();

    expect(data.metrics.length).toBe(3);
    expect(data.dateRange.from).toBe('2024-01-10'); // Earliest date
    expect(data.dateRange.to).toBe('2024-01-20'); // Latest date

    // Check that metrics are sorted by date
    expect(data.metrics[0].date).toBe('2024-01-10');
    expect(data.metrics[1].date).toBe('2024-01-15');
    expect(data.metrics[2].date).toBe('2024-01-20');
  });
});
