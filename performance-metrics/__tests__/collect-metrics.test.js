/**
 * Unit tests for collect-metrics.js
 * Epic 9 Story 4: Performance Benchmarking & Monitoring
 */

const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('child_process');
jest.mock('fs');

const {
  collectBundleSizeMetrics,
  collectBuildTimeMetrics,
  collectSystemMetrics,
  saveMetrics,
  generateReport,
} = require('../collect-metrics');

describe('Performance Metrics Collection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('collectSystemMetrics', () => {
    it('should collect system information', () => {
      const metrics = collectSystemMetrics();

      expect(metrics).toHaveProperty('platform');
      expect(metrics).toHaveProperty('arch');
      expect(metrics).toHaveProperty('nodeVersion');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('timestamp');

      expect(typeof metrics.platform).toBe('string');
      expect(typeof metrics.nodeVersion).toBe('string');
      expect(typeof metrics.memoryUsage).toBe('object');
      expect(typeof metrics.timestamp).toBe('number');
    });

    it('should include memory usage details', () => {
      const metrics = collectSystemMetrics();

      expect(metrics.memoryUsage).toHaveProperty('heapUsed');
      expect(metrics.memoryUsage).toHaveProperty('heapTotal');
      expect(metrics.memoryUsage).toHaveProperty('external');
    });
  });

  describe('saveMetrics', () => {
    it('should save metrics to dated JSON file', () => {
      const mockMetrics = {
        bundleSize: { firstLoadJS: 100, totalBundleSize: 500, fileCount: 10 },
        timestamp: Date.now(),
      };

      // Mock fs functions
      fs.existsSync = jest.fn(() => false);
      fs.mkdirSync = jest.fn();
      fs.readFileSync = jest.fn(() => '{}');
      fs.writeFileSync = jest.fn();

      const result = saveMetrics(mockMetrics);

      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(result).toContain('metrics-');
      expect(result).toContain('.json');
    });

    it('should merge with existing metrics if file exists', () => {
      const mockMetrics = {
        bundleSize: { firstLoadJS: 100 },
      };

      const existingMetrics = {
        system: { platform: 'darwin' },
      };

      fs.existsSync = jest.fn(() => true);
      fs.readFileSync = jest.fn(() => JSON.stringify(existingMetrics));
      fs.writeFileSync = jest.fn();

      saveMetrics(mockMetrics);

      expect(fs.writeFileSync).toHaveBeenCalled();
      const savedData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(savedData).toHaveProperty('bundleSize');
      expect(savedData).toHaveProperty('system');
    });
  });

  describe('generateReport', () => {
    it('should generate a comprehensive report from metrics', () => {
      const mockMetrics = {
        bundleSize: {
          firstLoadJS: 150,
          totalBundleSize: 600,
          fileCount: 12,
        },
        buildTime: {
          buildTime: 45000,
        },
        system: {
          platform: 'darwin',
          arch: 'x64',
          nodeVersion: 'v20.0.0',
          memoryUsage: { heapUsed: 100000000 },
        },
      };

      const report = generateReport(mockMetrics);

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('bundle');
      expect(report).toHaveProperty('build');
      expect(report).toHaveProperty('system');

      expect(report.summary.totalMetrics).toBeGreaterThan(0);
      expect(report.bundle.firstLoadJS).toBe('150 kB');
      expect(report.build.duration).toBe('45.00s');
    });

    it('should handle missing metrics gracefully', () => {
      const mockMetrics = {
        bundleSize: {
          firstLoadJS: 150,
          totalBundleSize: 600,
          fileCount: 12,
        },
      };

      const report = generateReport(mockMetrics);

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('bundle');
      expect(report.build).toBeNull();
      expect(report.webVitals).toBeNull();
      expect(report.api).toBeNull();
    });

    it('should format API metrics correctly when present', () => {
      const mockMetrics = {
        apiPerformance: {
          totalRequests: 150,
          cacheHitRate: 75.5,
          totalCacheHits: 113,
          memoryEntries: 50,
          dailyCost: 0.0045,
          monthlyCost: 0.135,
        },
      };

      const report = generateReport(mockMetrics);

      expect(report.api).not.toBeNull();
      expect(report.api.totalRequests).toBe(150);
      expect(report.api.cacheHitRate).toBe('75.5%');
      expect(report.api.dailyCost).toBe('$0.0045');
      expect(report.api.monthlyCost).toBe('$0.1350');
    });
  });

  describe('Metrics Data Integrity', () => {
    it('should include timestamps in all collected metrics', () => {
      const systemMetrics = collectSystemMetrics();

      expect(systemMetrics.timestamp).toBeDefined();
      expect(typeof systemMetrics.timestamp).toBe('number');
      expect(systemMetrics.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should use consistent date format for file naming', () => {
      const mockMetrics = { test: true };

      fs.existsSync = jest.fn(() => false);
      fs.mkdirSync = jest.fn();
      fs.writeFileSync = jest.fn();

      const result = saveMetrics(mockMetrics);

      // Should match YYYY-MM-DD format
      expect(result).toMatch(/metrics-\d{4}-\d{2}-\d{2}\.json$/);
    });
  });
});
