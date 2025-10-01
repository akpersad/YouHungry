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

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, you'd fetch from your API
      // For now, we'll simulate loading the data
      const response = await fetch('/api/admin/performance/metrics');
      if (!response.ok) {
        throw new Error('Failed to load performance metrics');
      }
      const data = await response.json();
      setMetrics(data.metrics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async (days: number = 1) => {
    try {
      logger.debug('Loading comparison for days:', days);
      const response = await fetch(
        `/api/admin/performance/compare?days=${days}`
      );
      if (!response.ok) {
        throw new Error('Failed to load comparison data');
      }
      const data = await response.json();
      setComparison(data);
    } catch (err) {
      logger.error('Failed to load comparison:', err);
    }
  };

  useEffect(() => {
    logger.debug('useEffect triggered with selectedDays:', selectedDays, 'v2');
    loadMetrics();
    loadComparison(selectedDays);
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
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'degradation':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (
    value: number,
    threshold: number,
    type: 'lower' | 'higher' = 'lower'
  ) => {
    const isGood = type === 'lower' ? value <= threshold : value >= threshold;
    return (
      <Badge variant={isGood ? 'default' : 'destructive'}>
        {isGood ? 'Good' : 'Needs Attention'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading performance metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Error Loading Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">{error}</p>
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="days" className="text-sm font-medium">
                Compare with:
              </label>
              <select
                id="days"
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value={1}>Yesterday</option>
                <option value={2}>2 days ago</option>
                <option value={7}>1 week ago</option>
                <option value={30}>1 month ago</option>
              </select>
            </div>
            <Button
              onClick={() => loadComparison(selectedDays)}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Comparison
            </Button>
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
                <div className="text-2xl font-bold text-green-600">
                  {comparison.summary.improvements}
                </div>
                <div className="text-sm text-gray-600">Improvements</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {comparison.summary.degradations}
                </div>
                <div className="text-sm text-gray-600">Degradations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {comparison.summary.neutral}
                </div>
                <div className="text-sm text-gray-600">No Change</div>
              </div>
            </div>

            {/* Detailed Changes */}
            <div className="space-y-4">
              {Object.entries(comparison.details).map(([category, metrics]) => (
                <div key={category}>
                  <h4 className="font-semibold text-lg mb-2 capitalize">
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(metrics as Record<string, unknown>).map(
                      ([metric, data]) => {
                        const dataObj = data as {
                          trend: string;
                          change: number;
                        };
                        return (
                          <div
                            key={metric}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <span className="text-sm font-medium">
                              {metric}
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
                <div className="text-gray-600">
                  {latestMetrics.system.platform}
                </div>
              </div>
              <div>
                <div className="font-medium">Architecture</div>
                <div className="text-gray-600">{latestMetrics.system.arch}</div>
              </div>
              <div>
                <div className="font-medium">Node Version</div>
                <div className="text-gray-600">
                  {latestMetrics.system.nodeVersion}
                </div>
              </div>
              <div>
                <div className="font-medium">Memory Usage</div>
                <div className="text-gray-600">
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
