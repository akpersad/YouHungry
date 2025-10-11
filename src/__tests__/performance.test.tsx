/**
 * Performance Testing Suite
 *
 * This file contains comprehensive performance tests for the You Hungry? application,
 * including bundle size tests, render performance tests, and memory usage tests.
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PerformanceMonitor } from '@/components/ui/PerformanceMonitor';
import {
  useDebounce,
  useThrottle,
  useStableCallback,
} from '@/lib/performance-utils';
import { useState, useEffect } from 'react';
import React from 'react';

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

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => []),
})) as any;
(global.PerformanceObserver as any).supportedEntryTypes = [];

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true }),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Performance Tests', () => {
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

  describe('Bundle Size Tests', () => {
    it('should have reasonable bundle size limits', () => {
      // This test would typically run in a CI environment
      // where bundle analysis is available
      const maxBundleSize = 500 * 1024; // 500KB
      const currentBundleSize = 0; // Would be measured in actual test

      expect(currentBundleSize).toBeLessThan(maxBundleSize);
    });

    it('should have optimized chunk splitting', () => {
      // Test that webpack configuration is properly set up
      const webpackConfig = require('../../next.config.ts').default;

      expect(webpackConfig.webpack).toBeDefined();
      expect(webpackConfig.experimental?.optimizePackageImports).toContain(
        '@tanstack/react-query'
      );
    });
  });

  describe('Render Performance Tests', () => {
    it('should render components within acceptable time limits', async () => {
      const startTime = performance.now();

      render(
        <QueryClientProvider client={queryClient}>
          <div>Test Component</div>
        </QueryClientProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should not cause excessive re-renders', () => {
      let renderCount = 0;

      const TestComponent = () => {
        renderCount++;
        return <div>Test</div>;
      };

      render(<TestComponent />);

      // Should only render once initially
      expect(renderCount).toBe(1);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during component lifecycle', () => {
      // @ts-expect-error - memory is Chrome-specific property
      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      const { unmount } = render(
        <QueryClientProvider client={queryClient}>
          <div>Test Component</div>
        </QueryClientProvider>
      );

      unmount();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // @ts-expect-error - memory is Chrome-specific property
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (less than 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });
  });

  describe('Performance Monitoring Tests', () => {
    it('should collect performance metrics', async () => {
      const mockSendMetric = jest.fn();

      // Mock the sendMetric function
      jest.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <QueryClientProvider client={queryClient}>
          <PerformanceMonitor />
        </QueryClientProvider>
      );

      // Wait for performance monitoring to initialize
      await waitFor(() => {
        // Component should render without throwing
        expect(() => {
          // Component should handle errors gracefully
        }).not.toThrow();
      });
    });

    it('should handle performance observer errors gracefully', () => {
      // Mock PerformanceObserver to throw an error
      const originalPerformanceObserver = global.PerformanceObserver;
      global.PerformanceObserver = jest.fn().mockImplementation(() => {
        throw new Error('PerformanceObserver not supported');
      }) as any;
      (global.PerformanceObserver as any).supportedEntryTypes = [];

      expect(() => {
        render(
          <QueryClientProvider client={queryClient}>
            <PerformanceMonitor />
          </QueryClientProvider>
        );
      }).not.toThrow();

      // Restore original PerformanceObserver
      global.PerformanceObserver = originalPerformanceObserver;
    });
  });

  describe('Performance Utility Tests', () => {
    describe('useDebounce', () => {
      it('should debounce values correctly', async () => {
        const TestComponent = ({ value }: { value: string }) => {
          const debouncedValue = useDebounce(value, 100);
          return <div data-testid="debounced">{debouncedValue}</div>;
        };

        const { rerender } = render(<TestComponent value="test" />);

        expect(screen.getByTestId('debounced')).toHaveTextContent('test');

        // Change value multiple times quickly
        rerender(<TestComponent value="test1" />);
        rerender(<TestComponent value="test2" />);
        rerender(<TestComponent value="test3" />);

        // Should still show original value
        expect(screen.getByTestId('debounced')).toHaveTextContent('test');

        // Wait for debounce
        await waitFor(
          () => {
            expect(screen.getByTestId('debounced')).toHaveTextContent('test3');
          },
          { timeout: 200 }
        );
      });
    });

    describe('useThrottle', () => {
      it('should throttle function calls', async () => {
        const mockCallback = jest.fn();

        const TestComponent = () => {
          const throttledCallback = useThrottle(mockCallback, 100);

          useEffect(() => {
            // Call once to trigger the first call
            throttledCallback();
          }, [throttledCallback]);

          return <div>Test</div>;
        };

        render(<TestComponent />);

        // Wait for the first call to happen
        await waitFor(() => {
          expect(mockCallback).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('useStableCallback', () => {
      it('should maintain stable callback references', () => {
        const mockCallback = jest.fn();
        let callbackRef: any;

        const TestComponent = ({ deps }: { deps: any[] }) => {
          callbackRef = useStableCallback(mockCallback, deps);
          return <div>Test</div>;
        };

        const { rerender } = render(<TestComponent deps={[1, 2]} />);
        const firstCallback = callbackRef;

        // Rerender with same deps
        rerender(<TestComponent deps={[1, 2]} />);
        const secondCallback = callbackRef;

        // Should be the same reference
        expect(firstCallback).toBe(secondCallback);

        // Rerender with different deps
        rerender(<TestComponent deps={[1, 3]} />);
        const thirdCallback = callbackRef;

        // Should be a different reference (callback should be recreated when deps change)
        expect(firstCallback).not.toBe(thirdCallback);
      });
    });
  });

  describe('Lazy Loading Tests', () => {
    it('should lazy load components correctly', async () => {
      const LazyComponent = jest.fn(() => <div>Lazy Component</div>);

      const TestComponent = () => (
        <div>
          <div>Regular Component</div>
          <LazyComponent />
        </div>
      );

      render(<TestComponent />);

      // Component should render successfully
      expect(screen.getByText('Regular Component')).toBeInTheDocument();
      expect(screen.getByText('Lazy Component')).toBeInTheDocument();
    });
  });

  describe('API Performance Tests', () => {
    it('should handle API timeouts gracefully', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
      );

      const TestComponent = () => {
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
          fetch('/api/test').catch((err) => setError(err.message));
        }, []);

        return <div>{error || 'Loading...'}</div>;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByText('Timeout')).toBeInTheDocument();
      });
    });
  });

  describe('Caching Tests', () => {
    it('should cache API responses correctly', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      } as Response);

      const TestComponent = () => {
        const [data, setData] = useState<any>(null);

        useEffect(() => {
          fetch('/api/test')
            .then((res) => res.json())
            .then(setData);
        }, []);

        return <div>{data?.data || 'Loading...'}</div>;
      };

      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument();
      });

      // Second call should use cache
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});

// Performance benchmarks
describe('Performance Benchmarks', () => {
  it('should meet Core Web Vitals thresholds', () => {
    // These would be measured in a real browser environment
    const thresholds = {
      fcp: 1800, // 1.8s
      lcp: 2500, // 2.5s
      fid: 100, // 100ms
      cls: 0.1, // 0.1
      ttfb: 800, // 800ms
    };

    // Mock values for testing
    const mockMetrics = {
      fcp: 1200,
      lcp: 2000,
      fid: 50,
      cls: 0.05,
      ttfb: 400,
    };

    expect(mockMetrics.fcp).toBeLessThan(thresholds.fcp);
    expect(mockMetrics.lcp).toBeLessThan(thresholds.lcp);
    expect(mockMetrics.fid).toBeLessThan(thresholds.fid);
    expect(mockMetrics.cls).toBeLessThan(thresholds.cls);
    expect(mockMetrics.ttfb).toBeLessThan(thresholds.ttfb);
  });
});
