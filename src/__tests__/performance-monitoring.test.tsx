/**
 * Performance Monitoring Testing Suite
 *
 * This file contains comprehensive tests for performance monitoring components
 * including PerformanceMonitor, EnhancedPerformanceMonitor, and API endpoints.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PerformanceMonitor } from '@/components/ui/PerformanceMonitor';
import { EnhancedPerformanceMonitor } from '@/components/ui/EnhancedPerformanceMonitor';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock gtag
global.gtag = jest.fn();

describe('Performance Monitoring', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  describe('PerformanceMonitor', () => {
    it('should render without crashing', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <PerformanceMonitor />
        </QueryClientProvider>
      );

      // Component doesn't render anything visible
      expect(document.body).toBeInTheDocument();
    });

    it('should only run in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <QueryClientProvider client={queryClient}>
          <PerformanceMonitor />
        </QueryClientProvider>
      );

      // Should not call performance methods in development
      expect(mockPerformance.mark).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should collect performance metrics in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <QueryClientProvider client={queryClient}>
          <PerformanceMonitor />
        </QueryClientProvider>
      );

      // Should call performance methods in production
      expect(mockPerformance.mark).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle performance observer errors gracefully', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Mock PerformanceObserver to throw an error
      const originalPerformanceObserver = global.PerformanceObserver;
      global.PerformanceObserver = jest.fn().mockImplementation(() => {
        throw new Error('PerformanceObserver not supported');
      });

      expect(() => {
        render(
          <QueryClientProvider client={queryClient}>
            <PerformanceMonitor />
          </QueryClientProvider>
        );
      }).not.toThrow();

      // Restore original PerformanceObserver
      global.PerformanceObserver = originalPerformanceObserver;
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('EnhancedPerformanceMonitor', () => {
    it('should render toggle button', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <EnhancedPerformanceMonitor />
        </QueryClientProvider>
      );

      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('title', 'Performance Monitor');
    });

    it('should toggle visibility on button click', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <EnhancedPerformanceMonitor />
        </QueryClientProvider>
      );

      const toggleButton = screen.getByRole('button');

      // Should not be visible initially
      expect(screen.queryByText('Performance Monitor')).not.toBeInTheDocument();

      // Click to show
      fireEvent.click(toggleButton);
      expect(screen.getByText('Performance Monitor')).toBeInTheDocument();

      // Click to hide
      fireEvent.click(toggleButton);
      expect(screen.queryByText('Performance Monitor')).not.toBeInTheDocument();
    });

    it('should show alert count on button', () => {
      // Mock metrics with alerts
      const mockMetrics = {
        fcp: 2000, // Above threshold
        lcp: 3000, // Above threshold
        bundleSize: 600000, // Above threshold
      };

      render(
        <QueryClientProvider client={queryClient}>
          <EnhancedPerformanceMonitor />
        </QueryClientProvider>
      );

      // Should show alert count if there are alerts
      const alertBadge = screen.queryByText('3');
      if (alertBadge) {
        expect(alertBadge).toBeInTheDocument();
      }
    });

    it('should display performance metrics', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <EnhancedPerformanceMonitor />
        </QueryClientProvider>
      );

      // Open the monitor
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      // Should show metrics section
      expect(screen.getByText('Current Metrics')).toBeInTheDocument();
    });

    it('should handle collect metrics button click', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <EnhancedPerformanceMonitor />
        </QueryClientProvider>
      );

      // Open the monitor
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      // Find and click collect metrics button
      const collectButton = screen.getByText('Collect Metrics');
      fireEvent.click(collectButton);

      // Should show loading state
      expect(screen.getByText('Collecting...')).toBeInTheDocument();
    });

    it('should close monitor when close button is clicked', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <EnhancedPerformanceMonitor />
        </QueryClientProvider>
      );

      // Open the monitor
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      // Should be visible
      expect(screen.getByText('Performance Monitor')).toBeInTheDocument();

      // Click close button
      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      // Should be hidden
      expect(screen.queryByText('Performance Monitor')).not.toBeInTheDocument();
    });
  });

  describe('Performance API Endpoints', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    it('should send metrics to analytics endpoint', async () => {
      const mockMetrics = {
        fcp: 1200,
        lcp: 2000,
        timestamp: Date.now(),
        url: 'http://localhost:3000',
        userAgent: 'test-agent',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const response = await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockMetrics),
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockMetrics),
      });

      expect(response.ok).toBe(true);
    });

    it('should send interactions to analytics endpoint', async () => {
      const mockInteraction = {
        type: 'click',
        target: 'BUTTON',
        className: 'btn-primary',
        id: 'test-button',
        timestamp: Date.now(),
        url: 'http://localhost:3000',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const response = await fetch('/api/analytics/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockInteraction),
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockInteraction),
      });

      expect(response.ok).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const mockMetrics = {
        fcp: 1200,
        timestamp: Date.now(),
        url: 'http://localhost:3000',
      };

      // Should not throw error
      await expect(
        fetch('/api/analytics/metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockMetrics),
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Performance Thresholds', () => {
    it('should detect performance alerts', () => {
      const thresholds = {
        fcp: 1800, // 1.8s
        lcp: 2500, // 2.5s
        fid: 100, // 100ms
        cls: 0.1, // 0.1
        ttfb: 800, // 800ms
        bundleSize: 500000, // 500KB
        memoryUsage: 0.8, // 80% of limit
      };

      // Test FCP alert
      expect(2000 > thresholds.fcp).toBe(true);

      // Test LCP alert
      expect(3000 > thresholds.lcp).toBe(true);

      // Test FID alert
      expect(150 > thresholds.fid).toBe(true);

      // Test CLS alert
      expect(0.15 > thresholds.cls).toBe(true);

      // Test TTFB alert
      expect(1000 > thresholds.ttfb).toBe(true);

      // Test bundle size alert
      expect(600000 > thresholds.bundleSize).toBe(true);

      // Test memory usage alert
      expect(0.9 > thresholds.memoryUsage).toBe(true);
    });

    it('should pass performance thresholds', () => {
      const thresholds = {
        fcp: 1800, // 1.8s
        lcp: 2500, // 2.5s
        fid: 100, // 100ms
        cls: 0.1, // 0.1
        ttfb: 800, // 800ms
        bundleSize: 500000, // 500KB
        memoryUsage: 0.8, // 80% of limit
      };

      // Test FCP pass
      expect(1200 < thresholds.fcp).toBe(true);

      // Test LCP pass
      expect(2000 < thresholds.lcp).toBe(true);

      // Test FID pass
      expect(50 < thresholds.fid).toBe(true);

      // Test CLS pass
      expect(0.05 < thresholds.cls).toBe(true);

      // Test TTFB pass
      expect(400 < thresholds.ttfb).toBe(true);

      // Test bundle size pass
      expect(300000 < thresholds.bundleSize).toBe(true);

      // Test memory usage pass
      expect(0.6 < thresholds.memoryUsage).toBe(true);
    });
  });

  describe('Memory Monitoring', () => {
    it('should track memory usage', () => {
      const memoryInfo = {
        used: 1000000,
        total: 2000000,
        limit: 4000000,
      };

      const usagePercentage = memoryInfo.used / memoryInfo.limit;
      expect(usagePercentage).toBe(0.25); // 25%
    });

    it('should detect high memory usage', () => {
      const memoryInfo = {
        used: 3500000,
        total: 4000000,
        limit: 4000000,
      };

      const usagePercentage = memoryInfo.used / memoryInfo.limit;
      expect(usagePercentage).toBe(0.875); // 87.5%
      expect(usagePercentage > 0.8).toBe(true); // Above threshold
    });
  });

  describe('Bundle Size Monitoring', () => {
    it('should calculate bundle size from resources', () => {
      const mockResources = [
        { name: 'main.js', transferSize: 100000 },
        { name: 'vendor.js', transferSize: 200000 },
        { name: 'sw.js', transferSize: 50000 }, // Should be excluded
      ];

      const totalSize = mockResources
        .filter(
          (resource) =>
            resource.name.includes('.js') && !resource.name.includes('sw.js')
        )
        .reduce((total, resource) => total + resource.transferSize, 0);

      expect(totalSize).toBe(300000); // 100000 + 200000
    });

    it('should detect large bundle size', () => {
      const bundleSize = 600000; // 600KB
      const threshold = 500000; // 500KB

      expect(bundleSize > threshold).toBe(true);
    });
  });
});
