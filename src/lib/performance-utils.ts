/**
 * Performance Optimization Utilities
 *
 * This file contains utilities for optimizing performance across the application,
 * including memoization, debouncing, throttling, and other performance techniques.
 */

import { logger } from '@/lib/logger';
import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Debounce hook for search inputs and API calls
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for scroll events and frequent updates
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

// Memoized callback hook with dependency array
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps);
}

// Memoized value hook with custom equality function
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual?: (a: T, b: T) => boolean
): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>();

  if (
    !ref.current ||
    !areEqual(deps, ref.current.deps) ||
    (isEqual && !isEqual(ref.current.value, factory()))
  ) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options, hasIntersected]);

  return { ref, isIntersecting, hasIntersected };
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    return { start: Math.max(0, start - overscan), end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items
      .slice(visibleRange.start, visibleRange.end)
      .map((item, index) => ({
        item,
        index: visibleRange.start + index,
      }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    if (process.env.NODE_ENV === 'development') {
      logger.debug(
        `${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`
      );
    }

    // Send to performance monitoring
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'component_render', {
        event_category: 'Performance',
        event_label: componentName,
        value: Math.round(renderTime),
      });
    }

    startTime.current = performance.now();
  });

  return { renderCount: renderCount.current };
}

// Image preloading utility
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Batch API calls utility
export function useBatchedAPI<T, R>(
  apiCall: (items: T[]) => Promise<R[]>,
  batchSize: number = 10,
  delay: number = 100
) {
  const [batches, setBatches] = useState<T[][]>([]);
  const [results, setResults] = useState<R[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addItems = useCallback(
    (items: T[]) => {
      const newBatches = [];
      for (let i = 0; i < items.length; i += batchSize) {
        newBatches.push(items.slice(i, i + batchSize));
      }
      setBatches((prev) => [...prev, ...newBatches]);
    },
    [batchSize]
  );

  useEffect(() => {
    if (batches.length === 0) return;

    const processBatches = async () => {
      setIsLoading(true);
      const allResults: R[] = [];

      for (const batch of batches) {
        try {
          const batchResults = await apiCall(batch);
          allResults.push(...batchResults);

          // Add delay between batches to prevent overwhelming the API
          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        } catch (error) {
          logger.error('Batch API call failed:', error);
        }
      }

      setResults(allResults);
      setBatches([]);
      setIsLoading(false);
    };

    processBatches();
  }, [batches, apiCall, delay]);

  return { addItems, results, isLoading };
}

// Memory usage monitoring
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (
          performance as {
            memory?: {
              usedJSHeapSize: number;
              totalJSHeapSize: number;
              jsHeapSizeLimit: number;
            };
          }
        ).memory;
        setMemoryInfo({
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

// Bundle size monitoring
export function useBundleSizeMonitor() {
  const [bundleSize, setBundleSize] = useState<number | null>(null);

  useEffect(() => {
    const measureBundleSize = () => {
      const resources = performance.getEntriesByType('resource');
      const jsResources = resources.filter(
        (resource) =>
          resource.name.includes('.js') && !resource.name.includes('sw.js')
      );

      const totalSize = jsResources.reduce((total, resource) => {
        const transferSize =
          (resource as { transferSize?: number }).transferSize || 0;
        return total + transferSize;
      }, 0);

      setBundleSize(totalSize);
    };

    // Measure after a short delay to ensure all resources are loaded
    const timeout = setTimeout(measureBundleSize, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return bundleSize;
}

// Helper function to check if two dependency arrays are equal
function areEqual(a: React.DependencyList, b: React.DependencyList): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => Object.is(val, b[index]));
}

// Export all hooks and utilities
export {
  useDebounce,
  useThrottle,
  useStableCallback,
  useStableMemo,
  useIntersectionObserver,
  useVirtualScroll,
  usePerformanceMonitor,
  preloadImage,
  useBatchedAPI,
  useMemoryMonitor,
  useBundleSizeMonitor,
};
