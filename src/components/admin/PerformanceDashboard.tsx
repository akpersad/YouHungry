'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from 'lucide-react';

interface PerformanceMetrics {
  date: string;
  environment: string;
  bundleSize?: {
    firstLoadJS: number;
    totalBundleSize: number;
    fileCount: number;
  };
  buildTime?: {
    buildTime: number;
  };
  webVitals?: {
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
  };
  apiPerformance?: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    totalRequests: number;
  };
  system?: {
    platform: string;
    arch: string;
    nodeVersion: string;
    memoryUsage:
      | number
      | {
          rss: number;
          heapTotal: number;
          heapUsed: number;
          external: number;
          arrayBuffers: number;
        };
  };
}

interface ComparisonData {
  comparison: {
    date1: string;
    date2: string;
    generatedAt: string;
  };
  summary: {
    totalComparisons: number;
    improvements: number;
    degradations: number;
    neutral: number;
  };
  details: Record<string, unknown>;
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(1); // Fixed: was 7, now 1 - v2
  const [collecting, setCollecting] = useState(false);
  const [collectSuccess, setCollectSuccess] = useState<string | null>(null);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch performance metrics from MongoDB
      const response = await fetch(
        '/api/admin/performance-metrics?period=1month'
      );
      if (!response.ok) {
        throw new Error('Failed to load performance metrics');
      }
      const data = await response.json();
      // API returns array directly, not wrapped in metrics object
      setMetrics(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async (days: number = 1) => {
    try {
      logger.debug('Loading comparison for days:', days);

      // Map days to period parameter
      let period = '1day';
      if (days === 7) period = '1week';
      else if (days === 14) period = '2weeks';
      else if (days === 30) period = '1month';

      const response = await fetch(
        `/api/admin/performance-metrics/compare?period=${period}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Failed to load comparison data:', {
          status: response.status,
          error: errorData.error || 'Unknown error',
        });
        // Don't throw error, just log it and continue without comparison data
        setComparison(null);
        return;
      }
      const comparisonData = await response.json();

      // Transform the new API response to match the expected format
      const transformedData = transformComparisonData(comparisonData);
      setComparison(transformedData);
    } catch (err) {
      logger.error('Failed to load comparison:', err);
      setComparison(null);
    }
  };

  // Transform the API response to match the dashboard's expected format
  const collectMetricsNow = async () => {
    try {
      setCollecting(true);
      setCollectSuccess(null);
      setError(null);

      logger.info('Manually triggering metrics collection');

      const response = await fetch('/api/admin/performance/collect', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to collect metrics');
      }

      logger.info('Metrics collection completed', data);

      setCollectSuccess(
        `Metrics collected successfully! Duration: ${data.duration}`
      );

      // Reload metrics and comparison data
      await loadMetrics();
      await loadComparison(selectedDays);

      // Clear success message after 5 seconds
      setTimeout(() => setCollectSuccess(null), 5000);
    } catch (err) {
      logger.error('Failed to collect metrics:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to collect metrics'
      );
    } finally {
      setCollecting(false);
    }
  };

  const transformComparisonData = (apiData: {
    metrics1: PerformanceMetrics | null;
    metrics2: PerformanceMetrics | null;
    date1: string;
    date2: string;
    comparison: Record<string, unknown>;
  }): ComparisonData | null => {
    if (!apiData || !apiData.metrics1 || !apiData.metrics2) {
      return null;
    }

    const comparison = apiData.comparison as Record<
      string,
      Record<string, unknown>
    >;

    // Count improvements, degradations, and neutral changes
    let improvements = 0;
    let degradations = 0;
    let neutral = 0;

    const details: Record<string, Record<string, unknown>> = {};

    // Process bundle size comparisons
    if (comparison.bundleSize) {
      details.bundle = {};
      Object.entries(comparison.bundleSize as Record<string, unknown>).forEach(
        ([key, value]) => {
          if (value && typeof value === 'object' && 'changePercent' in value) {
            const valueObj = value as {
              changePercent?: number;
              value1?: number;
              value2?: number;
            };
            const changePercent = valueObj.changePercent || 0;
            let trend = 'neutral';
            if (changePercent < -1) {
              trend = 'improvement';
              improvements++;
            } else if (changePercent > 1) {
              trend = 'degradation';
              degradations++;
            } else {
              neutral++;
            }
            details.bundle[key] = {
              trend,
              change: changePercent,
              old: valueObj.value1,
              new: valueObj.value2,
            };
          }
        }
      );
    }

    // Process web vitals comparisons
    if (comparison.webVitals) {
      details.webVitals = {};
      Object.entries(comparison.webVitals as Record<string, unknown>).forEach(
        ([key, value]) => {
          if (value && typeof value === 'object' && 'changePercent' in value) {
            const valueObj = value as {
              changePercent?: number;
              value1?: number;
              value2?: number;
            };
            const changePercent = valueObj.changePercent || 0;
            let trend = 'neutral';
            // For web vitals, lower is better
            if (changePercent < -1) {
              trend = 'improvement';
              improvements++;
            } else if (changePercent > 1) {
              trend = 'degradation';
              degradations++;
            } else {
              neutral++;
            }
            details.webVitals[key] = {
              trend,
              change: changePercent,
              old: valueObj.value1,
              new: valueObj.value2,
            };
          }
        }
      );
    }

    // Process API performance comparisons
    if (comparison.apiPerformance) {
      details.api = {};
      Object.entries(
        comparison.apiPerformance as Record<string, unknown>
      ).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'changePercent' in value) {
          const valueObj = value as {
            changePercent?: number;
            value1?: number;
            value2?: number;
          };
          const changePercent = valueObj.changePercent || 0;
          let trend = 'neutral';
          // For cache hit rate, higher is better; for others, context-dependent
          const higherIsBetter = key === 'cacheHitRate';
          if (higherIsBetter) {
            if (changePercent > 1) {
              trend = 'improvement';
              improvements++;
            } else if (changePercent < -1) {
              trend = 'degradation';
              degradations++;
            } else {
              neutral++;
            }
          } else {
            if (changePercent < -1) {
              trend = 'improvement';
              improvements++;
            } else if (changePercent > 1) {
              trend = 'degradation';
              degradations++;
            } else {
              neutral++;
            }
          }
          details.api[key] = {
            trend,
            change: changePercent,
            old: valueObj.value1,
            new: valueObj.value2,
          };
        }
      });
    }

    return {
      comparison: {
        date1: apiData.date1,
        date2: apiData.date2,
        generatedAt: new Date().toISOString(),
      },
      summary: {
        totalComparisons: improvements + degradations + neutral,
        improvements,
        degradations,
        neutral,
      },
      details,
    };
  };

  useEffect(() => {
    logger.debug('useEffect triggered with selectedDays:', selectedDays, 'v2');
    loadMetrics();
    loadComparison(selectedDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDays]);

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'time':
        return `${(value / 1000).toFixed(1)}s`;
      case 'size':
        return `${(value / 1024).toFixed(0)}KB`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'count':
        return value.toLocaleString();
      default:
        return value.toFixed(2);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improvement':
        return (
          <TrendingUp
            className="h-4 w-4"
            style={{ color: 'var(--color-success)' }}
          />
        );
      case 'degradation':
        return (
          <TrendingDown
            className="h-4 w-4"
            style={{ color: 'var(--color-error)' }}
          />
        );
      default:
        return (
          <Minus
            className="h-4 w-4"
            style={{ color: 'var(--text-secondary)' }}
          />
        );
    }
  };

  const formatMetricName = (metric: string): string => {
    const metricNames: Record<string, string> = {
      // Web Vitals
      fcp: 'First Contentful Paint',
      lcp: 'Largest Contentful Paint',
      fid: 'First Input Delay',
      cls: 'Cumulative Layout Shift',
      ttfb: 'Time to First Byte',

      // Bundle metrics
      firstLoadJS: 'First Load JS',
      totalBundleSize: 'Total Bundle Size',
      fileCount: 'File Count',

      // API metrics
      averageResponseTime: 'Average Response Time',
      successRate: 'Success Rate',
      errorRate: 'Error Rate',
      totalRequests: 'Total Requests',

      // Build metrics
      buildTime: 'Build Time',
    };

    return (
      metricNames[metric] ||
      metric
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
    );
  };

  const getStatusBadge = (
    value: number,
    threshold: number,
    type: 'lower' | 'higher' = 'lower'
  ) => {
    const isGood = type === 'lower' ? value <= threshold : value >= threshold;
    return (
      <Badge
        variant={isGood ? 'default' : 'destructive'}
        style={{
          backgroundColor: isGood
            ? 'var(--color-success)'
            : 'var(--color-error)',
          color: 'var(--text-inverse)',
        }}
      >
        {isGood ? 'Good' : 'Needs Attention'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw
          className="h-8 w-8 animate-spin"
          style={{ color: 'var(--accent-primary)' }}
        />
        <span className="ml-2" style={{ color: 'var(--text-primary)' }}>
          Loading performance metrics...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Card
        style={{
          borderColor: 'var(--color-error)',
          background: 'rgba(239, 68, 68, 0.1)',
        }}
      >
        <CardHeader>
          <CardTitle
            className="flex items-center"
            style={{ color: 'var(--color-error)' }}
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            Error Loading Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
          <Button onClick={loadMetrics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const latestMetrics = metrics[metrics.length - 1];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Monitoring</CardTitle>
          <CardDescription>
            Monitor Core Web Vitals, bundle size, and system performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Success message */}
            {collectSuccess && (
              <div
                className="p-3 rounded-md text-sm"
                style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: 'var(--color-success)',
                  border: '1px solid var(--color-success)',
                }}
              >
                {collectSuccess}
              </div>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label htmlFor="days" className="text-sm font-medium">
                  Compare with:
                </label>
                <select
                  id="days"
                  value={selectedDays}
                  onChange={(e) => setSelectedDays(Number(e.target.value))}
                  className="px-3 py-1 border rounded-md text-sm input-base"
                >
                  <option value={1}>Yesterday</option>
                  <option value={7}>1 Week</option>
                  <option value={14}>2 Weeks</option>
                  <option value={30}>1 Month</option>
                </select>
              </div>
              <Button
                onClick={() => loadComparison(selectedDays)}
                variant="outline"
                size="sm"
                disabled={collecting}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Comparison
              </Button>
              <Button
                onClick={collectMetricsNow}
                variant="primary"
                size="sm"
                disabled={collecting}
                style={{
                  backgroundColor: collecting
                    ? 'var(--bg-tertiary)'
                    : 'var(--accent-primary)',
                  color: collecting
                    ? 'var(--text-secondary)'
                    : 'var(--text-inverse)',
                }}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${collecting ? 'animate-spin' : ''}`}
                />
                {collecting ? 'Collecting...' : 'Collect Metrics Now'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Metrics */}
      {latestMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Core Web Vitals */}
          {latestMetrics.webVitals && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    First Contentful Paint (FCP)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatValue(latestMetrics.webVitals.fcp, 'time')}
                  </div>
                  {getStatusBadge(latestMetrics.webVitals.fcp, 1800)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Largest Contentful Paint (LCP)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatValue(latestMetrics.webVitals.lcp, 'time')}
                  </div>
                  {getStatusBadge(latestMetrics.webVitals.lcp, 2500)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    First Input Delay (FID)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {latestMetrics.webVitals.fid.toFixed(0)}ms
                  </div>
                  {getStatusBadge(latestMetrics.webVitals.fid, 100)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Cumulative Layout Shift (CLS)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {latestMetrics.webVitals.cls.toFixed(3)}
                  </div>
                  {getStatusBadge(latestMetrics.webVitals.cls, 0.1)}
                </CardContent>
              </Card>
            </>
          )}

          {/* Bundle Size */}
          {latestMetrics.bundleSize && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Bundle Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatValue(
                    latestMetrics.bundleSize.totalBundleSize,
                    'size'
                  )}
                </div>
                {getStatusBadge(latestMetrics.bundleSize.totalBundleSize, 500)}
              </CardContent>
            </Card>
          )}

          {/* API Performance */}
          {latestMetrics.apiPerformance && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">API Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {latestMetrics.apiPerformance.averageResponseTime.toFixed(
                      0
                    )}
                    ms
                  </div>
                  {getStatusBadge(
                    latestMetrics.apiPerformance.averageResponseTime,
                    200
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatValue(
                      latestMetrics.apiPerformance.successRate,
                      'percentage'
                    )}
                  </div>
                  {getStatusBadge(
                    latestMetrics.apiPerformance.successRate,
                    95,
                    'higher'
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Comparison Summary */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Comparison</CardTitle>
            <CardDescription>
              Comparing {comparison.comparison.date1} vs{' '}
              {comparison.comparison.date2}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div
                  className="text-2xl font-bold"
                  style={{ color: 'var(--color-success)' }}
                >
                  {comparison.summary.improvements}
                </div>
                <div
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Improvements
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-2xl font-bold"
                  style={{ color: 'var(--color-error)' }}
                >
                  {comparison.summary.degradations}
                </div>
                <div
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Degradations
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-2xl font-bold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {comparison.summary.neutral}
                </div>
                <div
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  No Change
                </div>
              </div>
            </div>

            {/* Detailed Changes */}
            <div className="space-y-4">
              {Object.entries(comparison.details).map(([category, metrics]) => (
                <div key={category}>
                  <h4 className="font-semibold text-lg mb-2">
                    {category === 'webVitals'
                      ? 'Web Vitals'
                      : category === 'bundle'
                        ? 'Bundle Size'
                        : category === 'api'
                          ? 'API Performance'
                          : category.charAt(0).toUpperCase() +
                            category.slice(1)}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(metrics as Record<string, unknown>).map(
                      ([metric, data]) => {
                        // Ensure data is an object with the expected structure
                        if (typeof data !== 'object' || data === null) {
                          return null;
                        }

                        const dataObj = data as {
                          trend: string;
                          change: number;
                          old?: number;
                          new?: number;
                        };

                        return (
                          <div
                            key={metric}
                            className="flex items-center justify-between p-2 rounded"
                            style={{ background: 'var(--bg-tertiary)' }}
                          >
                            <span className="text-sm font-medium">
                              {formatMetricName(metric)}
                            </span>
                            <div className="flex items-center gap-2">
                              {getTrendIcon(dataObj.trend)}
                              <span className="text-sm">
                                {dataObj.change > 0 ? '+' : ''}
                                {dataObj.change.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      {latestMetrics?.system && (
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Platform</div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {latestMetrics.system.platform}
                </div>
              </div>
              <div>
                <div className="font-medium">Architecture</div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {latestMetrics.system.arch}
                </div>
              </div>
              <div>
                <div className="font-medium">Node Version</div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {latestMetrics.system.nodeVersion}
                </div>
              </div>
              <div>
                <div className="font-medium">Memory Usage</div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {typeof latestMetrics.system.memoryUsage === 'object'
                    ? `${Math.round(latestMetrics.system.memoryUsage.heapUsed / 1024 / 1024)}MB`
                    : `${latestMetrics.system.memoryUsage}MB`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
