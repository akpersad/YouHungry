'use client';

import { useEffect } from 'react';

// Declare gtag for Google Analytics
declare global {
  function gtag(...args: unknown[]): void;
}

// interface PerformanceMetrics {
//   fcp?: number; // First Contentful Paint
//   lcp?: number; // Largest Contentful Paint
//   fid?: number; // First Input Delay
//   cls?: number; // Cumulative Layout Shift
//   ttfb?: number; // Time to First Byte
// }

// Extended interfaces for Performance Entry types
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
}

interface PerformanceResourceTiming extends PerformanceEntry {
  transferSize?: number;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface NetworkConnection {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

interface ExtendedNavigator extends Navigator {
  connection?: NetworkConnection;
}

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    // Core Web Vitals monitoring
    const observeWebVitals = () => {
      // First Contentful Paint (FCP)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            console.log('FCP:', entry.startTime);
            // Send to analytics
            sendMetric('fcp', entry.startTime);
          }
        }
      }).observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint (LCP)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
        sendMetric('lcp', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const fidEntry = entry as FirstInputEntry;
          console.log('FID:', fidEntry.processingStart - fidEntry.startTime);
          sendMetric('fid', fidEntry.processingStart - fidEntry.startTime);
        }
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const clsEntry = entry as LayoutShiftEntry;
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value;
            console.log('CLS:', clsValue);
            sendMetric('cls', clsValue);
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });

      // Time to First Byte (TTFB)
      const navigationEntry = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb =
          navigationEntry.responseStart - navigationEntry.requestStart;
        console.log('TTFB:', ttfb);
        sendMetric('ttfb', ttfb);
      }
    };

    // Send metrics to analytics service
    const sendMetric = (metricName: string, value: number | string) => {
      // In a real app, you would send this to your analytics service
      // For example: Google Analytics, Mixpanel, or custom endpoint

      // Example: Send to Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', metricName, {
          event_category: 'Web Vitals',
          event_label: metricName,
          value: typeof value === 'number' ? Math.round(value) : value,
          non_interaction: true,
        });
      }

      // Example: Send to custom endpoint
      if (typeof fetch !== 'undefined') {
        fetch('/api/analytics/metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metric: metricName,
            value: value,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          }),
        }).catch((error) => {
          console.error('Failed to send metric:', error);
        });
      }
    };

    // Monitor bundle size and loading performance
    const monitorBundlePerformance = () => {
      const resources = performance.getEntriesByType('resource');
      const jsResources = resources.filter(
        (resource) =>
          resource.name.includes('.js') && !resource.name.includes('sw.js')
      );

      const totalJSSize = jsResources.reduce((total, resource) => {
        const transferSize =
          (resource as PerformanceResourceTiming).transferSize || 0;
        return total + transferSize;
      }, 0);

      console.log('Total JS bundle size:', totalJSSize, 'bytes');

      // Alert if bundle size is too large (> 500KB)
      if (totalJSSize > 500000) {
        console.warn('Large bundle size detected:', totalJSSize, 'bytes');
      }

      sendMetric('bundle_size', totalJSSize);
    };

    // Monitor memory usage
    const monitorMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as ExtendedPerformance).memory;
        if (memory) {
          const memoryInfo = {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
          };

          console.log('Memory usage:', memoryInfo);
          sendMetric('memory_used', memoryInfo.used);
          sendMetric('memory_total', memoryInfo.total);

          // Alert if memory usage is high (> 80% of limit)
          if (memoryInfo.used / memoryInfo.limit > 0.8) {
            console.warn(
              'High memory usage detected:',
              (memoryInfo.used / memoryInfo.limit) * 100,
              '%'
            );
          }
        }
      }
    };

    // Monitor network performance
    const monitorNetworkPerformance = () => {
      const connection = (navigator as ExtendedNavigator).connection;
      if (connection) {
        const networkInfo = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        };

        console.log('Network info:', networkInfo);
        sendMetric('network_effective_type', networkInfo.effectiveType);
        sendMetric('network_downlink', networkInfo.downlink);
        sendMetric('network_rtt', networkInfo.rtt);
      }
    };

    // Monitor component render performance
    const monitorRenderPerformance = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.log('Render time:', entry.name, entry.duration);
            sendMetric(`render_${entry.name}`, entry.duration);
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });
    };

    // Initialize monitoring
    if (typeof window !== 'undefined') {
      observeWebVitals();
      monitorBundlePerformance();
      monitorMemoryUsage();
      monitorNetworkPerformance();
      monitorRenderPerformance();

      // Monitor memory usage periodically
      const memoryInterval = setInterval(monitorMemoryUsage, 30000); // Every 30 seconds

      // Cleanup
      return () => {
        clearInterval(memoryInterval);
      };
    }
  }, []);

  return null; // This component doesn't render anything
}

// Hook for measuring component render time
export function useRenderTime(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      performance.mark(`${componentName}-render-start`);
      performance.mark(`${componentName}-render-end`);
      performance.measure(
        `${componentName}-render`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );

      console.log(`${componentName} render time:`, renderTime, 'ms');
    };
  }, [componentName]);
}

// Hook for measuring API call performance
export function useAPIPerformance() {
  const measureAPICall = async (
    apiCall: () => Promise<unknown>,
    endpoint: string
  ) => {
    const startTime = performance.now();

    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`API call ${endpoint} took:`, duration, 'ms');

      // Send to analytics
      if (typeof fetch !== 'undefined') {
        fetch('/api/analytics/metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metric: 'api_call_duration',
            value: duration,
            endpoint: endpoint,
            timestamp: Date.now(),
          }),
        }).catch((error) => {
          console.error('Failed to send API metric:', error);
        });
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.error(`API call ${endpoint} failed after:`, duration, 'ms');

      // Send error metric
      if (typeof fetch !== 'undefined') {
        fetch('/api/analytics/metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metric: 'api_call_error',
            value: duration,
            endpoint: endpoint,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
          }),
        }).catch((analyticsError) => {
          console.error('Failed to send API error metric:', analyticsError);
        });
      }

      throw error;
    }
  };

  return { measureAPICall };
}

// Component for monitoring user interactions
export function InteractionMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    const trackInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      const interactionData = {
        type: event.type,
        target: target.tagName,
        className: target.className,
        id: target.id,
        timestamp: Date.now(),
        url: window.location.href,
      };

      console.log('User interaction:', interactionData);

      // Send to analytics
      if (typeof fetch !== 'undefined') {
        fetch('/api/analytics/interactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(interactionData),
        }).catch((error) => {
          console.error('Failed to send interaction data:', error);
        });
      }
    };

    // Track various user interactions
    const events = ['click', 'scroll', 'keydown', 'touchstart'];

    events.forEach((eventType) => {
      document.addEventListener(eventType, trackInteraction, { passive: true });
    });

    return () => {
      events.forEach((eventType) => {
        document.removeEventListener(eventType, trackInteraction);
      });
    };
  }, []);

  return null;
}
