/**
 * Performance Utils Testing Suite
 *
 * This file contains comprehensive tests for performance utility functions
 * including debouncing, throttling, memoization, and monitoring hooks.
 */

import { renderHook, act } from '@testing-library/react';
import {
  useDebounce,
  useThrottle,
  useStableCallback,
  useStableMemo,
  useIntersectionObserver,
  useVirtualScroll,
  usePerformanceMonitor,
  useMemoryMonitor,
  useBundleSizeMonitor,
  preloadImage,
} from '@/lib/performance-utils';

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

describe('Performance Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useDebounce', () => {
    it('should debounce values correctly', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 100 } }
      );

      expect(result.current).toBe('initial');

      // Change value multiple times quickly
      rerender({ value: 'test1', delay: 100 });
      rerender({ value: 'test2', delay: 100 });
      rerender({ value: 'test3', delay: 100 });

      // Should still be initial value
      expect(result.current).toBe('initial');

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should now be the latest value
      expect(result.current).toBe('test3');
    });

    it('should handle delay changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 100 } }
      );

      rerender({ value: 'test', delay: 200 });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should not have updated yet
      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should now be updated
      expect(result.current).toBe('test');
    });
  });

  describe('useThrottle', () => {
    it('should throttle function calls', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useThrottle(mockCallback, 100));

      // Call multiple times quickly
      act(() => {
        result.current();
        result.current();
        result.current();
      });

      // Should only be called once
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Call again
      act(() => {
        result.current();
      });

      // Should be called again
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('should handle callback changes', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();

      const { result, rerender } = renderHook(
        ({ callback, delay }) => useThrottle(callback, delay),
        { initialProps: { callback: mockCallback1, delay: 100 } }
      );

      act(() => {
        result.current();
      });

      expect(mockCallback1).toHaveBeenCalledTimes(1);

      rerender({ callback: mockCallback2, delay: 100 });

      act(() => {
        result.current();
      });

      expect(mockCallback2).toHaveBeenCalledTimes(1);
      expect(mockCallback1).toHaveBeenCalledTimes(1);
    });
  });

  describe('useStableCallback', () => {
    it('should maintain stable callback references', () => {
      const mockCallback = jest.fn();
      const { result, rerender } = renderHook(
        ({ deps }) => useStableCallback(mockCallback, deps),
        { initialProps: { deps: [1, 2] } }
      );

      const firstCallback = result.current;

      // Rerender with same deps
      rerender({ deps: [1, 2] });
      const secondCallback = result.current;

      // Should be the same reference
      expect(firstCallback).toBe(secondCallback);

      // Rerender with different deps
      rerender({ deps: [1, 3] });
      const thirdCallback = result.current;

      // Should be a different reference
      expect(firstCallback).not.toBe(thirdCallback);
    });

    it('should call the callback with correct arguments', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useStableCallback(mockCallback, []));

      act(() => {
        result.current('test', 123);
      });

      expect(mockCallback).toHaveBeenCalledWith('test', 123);
    });
  });

  describe('useStableMemo', () => {
    it('should memoize values with dependency array', () => {
      const factory = jest.fn(() => 'memoized value');
      const { result, rerender } = renderHook(
        ({ deps }) => useStableMemo(factory, deps),
        { initialProps: { deps: [1, 2] } }
      );

      expect(result.current).toBe('memoized value');
      expect(factory).toHaveBeenCalledTimes(1);

      // Rerender with same deps
      rerender({ deps: [1, 2] });
      expect(factory).toHaveBeenCalledTimes(1);

      // Rerender with different deps
      rerender({ deps: [1, 3] });
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it('should use custom equality function', () => {
      const factory = jest.fn(() => ({ value: 'test' }));
      const isEqual = (a: any, b: any) => a.value === b.value;

      const { result, rerender } = renderHook(
        ({ deps }) => useStableMemo(factory, deps, isEqual),
        { initialProps: { deps: [1, 2] } }
      );

      expect(factory).toHaveBeenCalledTimes(1);

      // Rerender with same deps but different object
      rerender({ deps: [1, 2] });
      expect(factory).toHaveBeenCalledTimes(1); // Should not call again due to custom equality
    });
  });

  describe('useIntersectionObserver', () => {
    it('should observe intersection changes', () => {
      const mockObserver = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };

      (global.IntersectionObserver as jest.Mock).mockImplementation(
        (callback) => {
          // Simulate intersection change
          setTimeout(() => callback([{ isIntersecting: true }]), 100);
          return mockObserver;
        }
      );

      const { result } = renderHook(() => useIntersectionObserver());

      expect(result.current.ref).toBeDefined();
      expect(result.current.isIntersecting).toBe(false);
      expect(result.current.hasIntersected).toBe(false);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.isIntersecting).toBe(true);
      expect(result.current.hasIntersected).toBe(true);
    });

    it('should handle cleanup', () => {
      const mockObserver = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };

      (global.IntersectionObserver as jest.Mock).mockImplementation(
        () => mockObserver
      );

      const { unmount } = renderHook(() => useIntersectionObserver());

      unmount();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });
  });

  describe('useVirtualScroll', () => {
    it('should calculate visible range correctly', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }));

      const { result } = renderHook(() =>
        useVirtualScroll({
          items,
          itemHeight: 50,
          containerHeight: 200,
          overscan: 2,
        })
      );

      expect(result.current.visibleItems).toHaveLength(6); // 200/50 + 2*2 overscan
      expect(result.current.totalHeight).toBe(5000); // 100 * 50
      expect(result.current.offsetY).toBe(0);
    });

    it('should update visible range when scroll position changes', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }));

      const { result } = renderHook(() =>
        useVirtualScroll({
          items,
          itemHeight: 50,
          containerHeight: 200,
          overscan: 2,
        })
      );

      // Simulate scroll
      act(() => {
        result.current.setScrollTop(100);
      });

      expect(result.current.offsetY).toBe(100);
    });
  });

  describe('usePerformanceMonitor', () => {
    it('should track render performance', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor('TestComponent')
      );

      expect(result.current.renderCount).toBe(1);

      // Rerender
      renderHook(() => usePerformanceMonitor('TestComponent'));

      expect(result.current.renderCount).toBe(1); // Each hook instance tracks its own renders
    });

    it('should call performance.mark and performance.measure', () => {
      renderHook(() => usePerformanceMonitor('TestComponent'));

      expect(mockPerformance.mark).toHaveBeenCalledWith(
        'TestComponent-render-start'
      );
      expect(mockPerformance.mark).toHaveBeenCalledWith(
        'TestComponent-render-end'
      );
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'TestComponent-render',
        'TestComponent-render-start',
        'TestComponent-render-end'
      );
    });
  });

  describe('useMemoryMonitor', () => {
    it('should return memory information', () => {
      const { result } = renderHook(() => useMemoryMonitor());

      expect(result.current).toEqual({
        used: 1000000,
        total: 2000000,
        limit: 4000000,
      });
    });

    it('should update memory information periodically', () => {
      const { result } = renderHook(() => useMemoryMonitor());

      // Update memory info
      (performance as any).memory.usedJSHeapSize = 1500000;

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current?.used).toBe(1500000);
    });
  });

  describe('useBundleSizeMonitor', () => {
    it('should calculate bundle size from performance entries', () => {
      const mockResources = [
        { name: 'main.js', transferSize: 100000 },
        { name: 'vendor.js', transferSize: 200000 },
        { name: 'sw.js', transferSize: 50000 }, // Should be excluded
      ];

      mockPerformance.getEntriesByType.mockReturnValue(mockResources);

      const { result } = renderHook(() => useBundleSizeMonitor());

      expect(result.current).toBe(300000); // 100000 + 200000
    });

    it('should return null if no resources found', () => {
      mockPerformance.getEntriesByType.mockReturnValue([]);

      const { result } = renderHook(() => useBundleSizeMonitor());

      expect(result.current).toBeNull();
    });
  });

  describe('preloadImage', () => {
    it('should preload image and return promise', async () => {
      const mockImage = {
        onload: null,
        onerror: null,
        src: '',
      };

      // Mock Image constructor
      (global as any).Image = jest.fn(() => mockImage);

      const preloadPromise = preloadImage('test.jpg');

      // Simulate successful load
      act(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      });

      const result = await preloadPromise;
      expect(result).toBe(mockImage);
    });

    it('should reject on image load error', async () => {
      const mockImage = {
        onload: null,
        onerror: null,
        src: '',
      };

      (global as any).Image = jest.fn(() => mockImage);

      const preloadPromise = preloadImage('invalid.jpg');

      // Simulate error
      act(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      });

      await expect(preloadPromise).rejects.toBeUndefined();
    });
  });
});
