'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  usePerformanceMonitor,
  useMemoryMonitor,
  useBundleSizeMonitor,
} from '@/lib/performance-utils';

interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  bundleSize?: number;
  memoryUsed?: number;
  memoryTotal?: number;
  memoryLimit?: number;
  networkType?: string;
  networkDownlink?: number;
  networkRtt?: number;
}

interface PerformanceAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  metric: string;
  value: number;
  threshold: number;
}

export function EnhancedPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);

  const memoryInfo = useMemoryMonitor();
  const bundleSize = useBundleSizeMonitor();
  const { renderCount } = usePerformanceMonitor('EnhancedPerformanceMonitor');

  const metricsRef = useRef<PerformanceMetrics>({});
  const alertThresholds = {
    fcp: 1800, // 1.8s
    lcp: 2500, // 2.5s
    fid: 100, // 100ms
    cls: 0.1, // 0.1
    ttfb: 800, // 800ms
    bundleSize: 500000, // 500KB
    memoryUsage: 0.8, // 80% of limit
  };

  // Collect performance metrics
  const collectMetrics = useCallback(async () => {
    if (isCollecting) return;

    setIsCollecting(true);
    const newMetrics: PerformanceMetrics = {};

    try {
      // Core Web Vitals
      const fcp = await getMetric('first-contentful-paint');
      const lcp = await getMetric('largest-contentful-paint');
      const fid = await getMetric('first-input-delay');
      const cls = await getMetric('cumulative-layout-shift');
      const ttfb = await getMetric('time-to-first-byte');

      if (fcp !== null) newMetrics.fcp = fcp;
      if (lcp !== null) newMetrics.lcp = lcp;
      if (fid !== null) newMetrics.fid = fid;
      if (cls !== null) newMetrics.cls = cls;
      if (ttfb !== null) newMetrics.ttfb = ttfb;

      // Bundle size
      if (bundleSize !== null) {
        newMetrics.bundleSize = bundleSize;
      }

      // Memory usage
      if (memoryInfo) {
        newMetrics.memoryUsed = memoryInfo.used;
        newMetrics.memoryTotal = memoryInfo.total;
        newMetrics.memoryLimit = memoryInfo.limit;
      }

      // Network information
      const connection = (
        navigator as {
          connection?: { effectiveType: string; downlink: number; rtt: number };
        }
      ).connection;
      if (connection) {
        newMetrics.networkType = connection.effectiveType;
        newMetrics.networkDownlink = connection.downlink;
        newMetrics.networkRtt = connection.rtt;
      }

      // Update metrics
      const updatedMetrics = { ...metricsRef.current, ...newMetrics };
      setMetrics(updatedMetrics);
      metricsRef.current = updatedMetrics;

      // Check for alerts
      checkAlerts(updatedMetrics);

      // Send to analytics
      await sendMetricsToAnalytics(updatedMetrics);
    } catch (error) {
      logger.error('Error collecting performance metrics:', error);
    } finally {
      setIsCollecting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCollecting]);

  // Get a specific performance metric
  const getMetric = (metricName: string): Promise<number | null> => {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === metricName || entry.entryType === metricName) {
            observer.disconnect();
            resolve(entry.startTime || entry.duration || 0);
            return;
          }
        }
      });

      try {
        observer.observe({
          entryTypes: [
            'paint',
            'largest-contentful-paint',
            'first-input',
            'layout-shift',
            'navigation',
          ],
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, 5000);
      } catch {
        resolve(null);
      }
    });
  };

  // Check for performance alerts
  const checkAlerts = (currentMetrics: PerformanceMetrics) => {
    const newAlerts: PerformanceAlert[] = [];

    // FCP alert
    if (currentMetrics.fcp && currentMetrics.fcp > alertThresholds.fcp) {
      newAlerts.push({
        type: 'warning',
        message: `First Contentful Paint is ${(currentMetrics.fcp / 1000).toFixed(1)}s (threshold: ${alertThresholds.fcp / 1000}s)`,
        metric: 'fcp',
        value: currentMetrics.fcp,
        threshold: alertThresholds.fcp,
      });
    }

    // LCP alert
    if (currentMetrics.lcp && currentMetrics.lcp > alertThresholds.lcp) {
      newAlerts.push({
        type: 'warning',
        message: `Largest Contentful Paint is ${(currentMetrics.lcp / 1000).toFixed(1)}s (threshold: ${alertThresholds.lcp / 1000}s)`,
        metric: 'lcp',
        value: currentMetrics.lcp,
        threshold: alertThresholds.lcp,
      });
    }

    // FID alert
    if (currentMetrics.fid && currentMetrics.fid > alertThresholds.fid) {
      newAlerts.push({
        type: 'warning',
        message: `First Input Delay is ${currentMetrics.fid.toFixed(0)}ms (threshold: ${alertThresholds.fid}ms)`,
        metric: 'fid',
        value: currentMetrics.fid,
        threshold: alertThresholds.fid,
      });
    }

    // CLS alert
    if (currentMetrics.cls && currentMetrics.cls > alertThresholds.cls) {
      newAlerts.push({
        type: 'warning',
        message: `Cumulative Layout Shift is ${currentMetrics.cls.toFixed(3)} (threshold: ${alertThresholds.cls})`,
        metric: 'cls',
        value: currentMetrics.cls,
        threshold: alertThresholds.cls,
      });
    }

    // Bundle size alert
    if (
      currentMetrics.bundleSize &&
      currentMetrics.bundleSize > alertThresholds.bundleSize
    ) {
      newAlerts.push({
        type: 'error',
        message: `Bundle size is ${(currentMetrics.bundleSize / 1024).toFixed(0)}KB (threshold: ${alertThresholds.bundleSize / 1024}KB)`,
        metric: 'bundleSize',
        value: currentMetrics.bundleSize,
        threshold: alertThresholds.bundleSize,
      });
    }

    // Memory usage alert
    if (currentMetrics.memoryUsed && currentMetrics.memoryLimit) {
      const memoryUsage =
        currentMetrics.memoryUsed / currentMetrics.memoryLimit;
      if (memoryUsage > alertThresholds.memoryUsage) {
        newAlerts.push({
          type: 'warning',
          message: `Memory usage is ${(memoryUsage * 100).toFixed(1)}% (threshold: ${alertThresholds.memoryUsage * 100}%)`,
          metric: 'memoryUsage',
          value: memoryUsage,
          threshold: alertThresholds.memoryUsage,
        });
      }
    }

    setAlerts(newAlerts);
  };

  // Send metrics to analytics
  const sendMetricsToAnalytics = async (currentMetrics: PerformanceMetrics) => {
    try {
      await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentMetrics,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          renderCount,
        }),
      });
    } catch (error) {
      logger.error('Failed to send metrics to analytics:', error);
    }
  };

  // Initialize monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Skip performance monitoring in production to reduce API calls
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    // Collect initial metrics
    const timer = setTimeout(collectMetrics, 2000);

    // Set up periodic collection - reduced frequency for production
    const interval = setInterval(
      collectMetrics,
      process.env.NODE_ENV === 'production' ? 300000 : 30000
    ); // 5 min in prod, 30s in dev

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [collectMetrics]);

  // Update metrics when memory or bundle size changes
  useEffect(() => {
    if (memoryInfo) {
      setMetrics((prev) => ({
        ...prev,
        memoryUsed: memoryInfo.used,
        memoryTotal: memoryInfo.total,
        memoryLimit: memoryInfo.limit,
      }));
    }
  }, [memoryInfo]);

  useEffect(() => {
    if (bundleSize !== null) {
      setMetrics((prev) => ({
        ...prev,
        bundleSize,
      }));
    }
  }, [bundleSize]);

  // Don't render in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        title="Performance Monitor"
      >
        {isVisible ? '📊' : '⚡'}
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {alerts.length}
          </span>
        )}
      </button>

      {/* Monitor Panel */}
      {isVisible && (
        <div className="absolute bottom-16 right-0 w-80 bg-white dark:bg-background rounded-lg shadow-xl border border-border dark:border-border p-4 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text dark:text-white">
              Performance Monitor
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-text-light hover:text-text dark:text-text-light dark:hover:text-text-light"
            >
              ✕
            </button>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-text dark:text-text-light mb-2">
                Alerts ({alerts.length})
              </h4>
              <div className="space-y-2">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs ${
                      alert.type === 'error'
                        ? 'bg-destructive/10 text-red-800 dark:bg-destructive/20 dark:text-red-200'
                        : alert.type === 'warning'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-primary/10 text-blue-800 dark:bg-primary/20 dark:text-blue-200'
                    }`}
                  >
                    {alert.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-text dark:text-text-light">
              Current Metrics
            </h4>

            {metrics.fcp && (
              <div className="flex justify-between text-xs">
                <span>FCP:</span>
                <span
                  className={
                    metrics.fcp > alertThresholds.fcp
                      ? 'text-destructive'
                      : 'text-success'
                  }
                >
                  {(metrics.fcp / 1000).toFixed(1)}s
                </span>
              </div>
            )}

            {metrics.lcp && (
              <div className="flex justify-between text-xs">
                <span>LCP:</span>
                <span
                  className={
                    metrics.lcp > alertThresholds.lcp
                      ? 'text-destructive'
                      : 'text-success'
                  }
                >
                  {(metrics.lcp / 1000).toFixed(1)}s
                </span>
              </div>
            )}

            {metrics.fid && (
              <div className="flex justify-between text-xs">
                <span>FID:</span>
                <span
                  className={
                    metrics.fid > alertThresholds.fid
                      ? 'text-destructive'
                      : 'text-success'
                  }
                >
                  {metrics.fid.toFixed(0)}ms
                </span>
              </div>
            )}

            {metrics.cls && (
              <div className="flex justify-between text-xs">
                <span>CLS:</span>
                <span
                  className={
                    metrics.cls > alertThresholds.cls
                      ? 'text-destructive'
                      : 'text-success'
                  }
                >
                  {metrics.cls.toFixed(3)}
                </span>
              </div>
            )}

            {metrics.bundleSize && (
              <div className="flex justify-between text-xs">
                <span>Bundle:</span>
                <span
                  className={
                    metrics.bundleSize > alertThresholds.bundleSize
                      ? 'text-destructive'
                      : 'text-success'
                  }
                >
                  {(metrics.bundleSize / 1024).toFixed(0)}KB
                </span>
              </div>
            )}

            {metrics.memoryUsed && metrics.memoryLimit && (
              <div className="flex justify-between text-xs">
                <span>Memory:</span>
                <span
                  className={
                    metrics.memoryUsed / metrics.memoryLimit >
                    alertThresholds.memoryUsage
                      ? 'text-destructive'
                      : 'text-success'
                  }
                >
                  {((metrics.memoryUsed / metrics.memoryLimit) * 100).toFixed(
                    1
                  )}
                  %
                </span>
              </div>
            )}

            <div className="flex justify-between text-xs">
              <span>Renders:</span>
              <span className="text-text-light">{renderCount}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-border dark:border-border">
            <button
              onClick={collectMetrics}
              disabled={isCollecting}
              className="w-full bg-primary text-white py-2 px-4 rounded text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCollecting ? 'Collecting...' : 'Collect Metrics'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
