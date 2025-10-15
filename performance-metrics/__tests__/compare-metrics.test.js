/**
 * Unit tests for compare-metrics.js
 * Epic 9 Story 4: Performance Benchmarking & Monitoring
 */

const {
  compareBundleMetrics,
  compareBuildTimeMetrics,
  compareWebVitalsMetrics,
  compareAPIMetrics,
  generateComparisonReport,
} = require('../compare-metrics');

describe('Performance Metrics Comparison', () => {
  describe('compareBundleMetrics', () => {
    it('should compare bundle size metrics correctly', () => {
      const metrics1 = {
        bundleSize: {
          firstLoadJS: 100,
          totalBundleSize: 500,
          fileCount: 10,
        },
      };

      const metrics2 = {
        bundleSize: {
          firstLoadJS: 120,
          totalBundleSize: 550,
          fileCount: 12,
        },
      };

      const comparison = compareBundleMetrics(metrics1, metrics2);

      expect(comparison).toHaveProperty('firstLoadJS');
      expect(comparison).toHaveProperty('totalBundleSize');
      expect(comparison).toHaveProperty('fileCount');

      expect(comparison.firstLoadJS.old).toBe(100);
      expect(comparison.firstLoadJS.new).toBe(120);
      expect(comparison.firstLoadJS.trend).toBe('increase');
      expect(comparison.firstLoadJS.change).toBeCloseTo(20, 0);
    });

    it('should detect decreases in bundle size', () => {
      const metrics1 = {
        bundleSize: {
          firstLoadJS: 150,
          totalBundleSize: 600,
          fileCount: 12,
        },
      };

      const metrics2 = {
        bundleSize: {
          firstLoadJS: 120,
          totalBundleSize: 500,
          fileCount: 10,
        },
      };

      const comparison = compareBundleMetrics(metrics1, metrics2);

      expect(comparison.firstLoadJS.trend).toBe('decrease');
      expect(comparison.totalBundleSize.trend).toBe('decrease');
      expect(comparison.firstLoadJS.change).toBeLessThan(0);
    });

    it('should return null if bundle metrics are missing', () => {
      const metrics1 = {};
      const metrics2 = {};

      const comparison = compareBundleMetrics(metrics1, metrics2);

      expect(comparison).toBeNull();
    });
  });

  describe('compareBuildTimeMetrics', () => {
    it('should compare build time correctly', () => {
      const metrics1 = {
        buildTime: {
          buildTime: 30000,
        },
      };

      const metrics2 = {
        buildTime: {
          buildTime: 35000,
        },
      };

      const comparison = compareBuildTimeMetrics(metrics1, metrics2);

      expect(comparison).toHaveProperty('buildTime');
      expect(comparison.buildTime.old).toBe(30000);
      expect(comparison.buildTime.new).toBe(35000);
      expect(comparison.buildTime.trend).toBe('increase');
    });

    it('should return null if build time metrics are missing', () => {
      const metrics1 = {};
      const metrics2 = {};

      const comparison = compareBuildTimeMetrics(metrics1, metrics2);

      expect(comparison).toBeNull();
    });
  });

  describe('compareWebVitalsMetrics', () => {
    it('should compare web vitals and identify improvements', () => {
      const metrics1 = {
        webVitals: {
          fcp: 2000,
          lcp: 3000,
          fid: 100,
          cls: 0.15,
          ttfb: 500,
        },
      };

      const metrics2 = {
        webVitals: {
          fcp: 1800,
          lcp: 2500,
          fid: 80,
          cls: 0.1,
          ttfb: 400,
        },
      };

      const comparison = compareWebVitalsMetrics(metrics1, metrics2);

      expect(comparison).toHaveProperty('fcp');
      expect(comparison).toHaveProperty('lcp');
      expect(comparison).toHaveProperty('fid');
      expect(comparison).toHaveProperty('cls');
      expect(comparison).toHaveProperty('ttfb');

      // Lower is better for web vitals
      expect(comparison.fcp.trend).toBe('improvement');
      expect(comparison.lcp.trend).toBe('improvement');
      expect(comparison.fid.trend).toBe('improvement');
    });

    it('should identify degradations in web vitals', () => {
      const metrics1 = {
        webVitals: {
          fcp: 1500,
          lcp: 2000,
        },
      };

      const metrics2 = {
        webVitals: {
          fcp: 2500,
          lcp: 3500,
        },
      };

      const comparison = compareWebVitalsMetrics(metrics1, metrics2);

      expect(comparison.fcp.trend).toBe('degradation');
      expect(comparison.lcp.trend).toBe('degradation');
    });

    it('should return null if web vitals are missing', () => {
      const metrics1 = {};
      const metrics2 = {};

      const comparison = compareWebVitalsMetrics(metrics1, metrics2);

      expect(comparison).toBeNull();
    });
  });

  describe('compareAPIMetrics', () => {
    it('should compare API performance metrics', () => {
      const metrics1 = {
        apiPerformance: {
          averageResponseTime: 200,
          successRate: 98,
          errorRate: 2,
          totalRequests: 1000,
        },
      };

      const metrics2 = {
        apiPerformance: {
          averageResponseTime: 180,
          successRate: 99,
          errorRate: 1,
          totalRequests: 1200,
        },
      };

      const comparison = compareAPIMetrics(metrics1, metrics2);

      expect(comparison).toHaveProperty('averageResponseTime');
      expect(comparison).toHaveProperty('successRate');
      expect(comparison).toHaveProperty('errorRate');

      expect(comparison.averageResponseTime.trend).toBe('improvement');
      expect(comparison.successRate.trend).toBe('improvement');
      expect(comparison.errorRate.trend).toBe('improvement');
    });

    it('should return null if API metrics are missing', () => {
      const metrics1 = {};
      const metrics2 = {};

      const comparison = compareAPIMetrics(metrics1, metrics2);

      expect(comparison).toBeNull();
    });
  });

  describe('generateComparisonReport', () => {
    it('should generate a complete comparison report', () => {
      const comparison = {
        bundle: {
          firstLoadJS: {
            old: 100,
            new: 120,
            change: 20,
            trend: 'increase',
          },
        },
        webVitals: {
          fcp: {
            old: 2000,
            new: 1800,
            change: -10,
            trend: 'improvement',
          },
        },
      };

      const report = generateComparisonReport(
        comparison,
        '2024-01-01',
        '2024-01-02'
      );

      expect(report).toHaveProperty('comparison');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('details');

      expect(report.comparison.date1).toBe('2024-01-01');
      expect(report.comparison.date2).toBe('2024-01-02');
      expect(report.summary).toHaveProperty('improvements');
      expect(report.summary).toHaveProperty('degradations');
      expect(report.summary).toHaveProperty('neutral');
    });

    it('should count improvements and degradations correctly', () => {
      const comparison = {
        bundle: {
          firstLoadJS: {
            old: 100,
            new: 120,
            change: 20,
            trend: 'increase', // neutral
          },
        },
        webVitals: {
          fcp: {
            old: 2000,
            new: 1800,
            change: -10,
            trend: 'improvement',
          },
          lcp: {
            old: 2500,
            new: 3000,
            change: 20,
            trend: 'degradation',
          },
        },
      };

      const report = generateComparisonReport(
        comparison,
        '2024-01-01',
        '2024-01-02'
      );

      expect(report.summary.improvements).toBe(1);
      expect(report.summary.degradations).toBe(1);
    });

    it('should handle empty comparisons', () => {
      const comparison = {};
      const report = generateComparisonReport(
        comparison,
        '2024-01-01',
        '2024-01-02'
      );

      expect(report.summary.improvements).toBe(0);
      expect(report.summary.degradations).toBe(0);
      expect(report.summary.neutral).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values in percentage calculations', () => {
      const metrics1 = {
        bundleSize: {
          firstLoadJS: 0,
          totalBundleSize: 0,
          fileCount: 0,
        },
      };

      const metrics2 = {
        bundleSize: {
          firstLoadJS: 100,
          totalBundleSize: 500,
          fileCount: 10,
        },
      };

      const comparison = compareBundleMetrics(metrics1, metrics2);

      expect(comparison.firstLoadJS.change).toBe(100); // From 0 to 100 is 100% increase
    });

    it('should handle identical metrics', () => {
      const metrics1 = {
        bundleSize: {
          firstLoadJS: 100,
          totalBundleSize: 500,
          fileCount: 10,
        },
      };

      const metrics2 = {
        bundleSize: {
          firstLoadJS: 100,
          totalBundleSize: 500,
          fileCount: 10,
        },
      };

      const comparison = compareBundleMetrics(metrics1, metrics2);

      expect(comparison.firstLoadJS.change).toBe(0);
      expect(comparison.totalBundleSize.change).toBe(0);
    });
  });
});
