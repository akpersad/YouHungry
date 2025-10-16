'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

interface UsageData {
  bandwidth: {
    used: number;
    limit: number;
    percentage: number;
  };
  functionExecution: {
    used: number;
    limit: number;
    percentage: number;
  };
  requests: {
    count: number;
    averagePerHour: number;
  };
}

interface AlertThresholds {
  bandwidth: {
    warning: number;
    critical: number;
  };
  functionExecution: {
    warning: number;
    critical: number;
  };
  requests: {
    warning: number;
    critical: number;
  };
}

export function VercelUsageDashboard() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [thresholds, setThresholds] = useState<AlertThresholds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/monitoring/vercel-usage', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const result = await response.json();
      setUsageData(result.data);
      setThresholds(result.thresholds);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchUsageData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (
    percentage: number,
    thresholds: { warning: number; critical: number }
  ) => {
    if (percentage >= thresholds.critical) return 'destructive';
    if (percentage >= thresholds.warning) return 'secondary';
    return 'default';
  };

  const getStatusIcon = (
    percentage: number,
    thresholds: { warning: number; critical: number }
  ) => {
    if (percentage >= thresholds.critical)
      return <AlertTriangle className="h-4 w-4" />;
    if (percentage >= thresholds.warning)
      return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / 1024 ** 3;
    return `${gb.toFixed(1)} GB`;
  };

  if (loading && !usageData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vercel Usage Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading usage data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vercel Usage Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchUsageData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usageData || !thresholds) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Vercel Usage Monitoring</CardTitle>
          <div className="flex items-center space-x-2">
            <Button onClick={fetchUsageData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bandwidth Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Bandwidth</h3>
              <Badge
                variant={getStatusColor(
                  usageData.bandwidth.percentage,
                  thresholds.bandwidth
                )}
              >
                {getStatusIcon(
                  usageData.bandwidth.percentage,
                  thresholds.bandwidth
                )}
                <span className="ml-1">
                  {usageData.bandwidth.percentage.toFixed(1)}%
                </span>
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  usageData.bandwidth.percentage >=
                  thresholds.bandwidth.critical
                    ? 'bg-red-500'
                    : usageData.bandwidth.percentage >=
                        thresholds.bandwidth.warning
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.min(usageData.bandwidth.percentage, 100)}%`,
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatBytes(usageData.bandwidth.used)} /{' '}
              {formatBytes(usageData.bandwidth.limit)}
            </p>
          </div>

          {/* Function Execution */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Function Execution</h3>
              <Badge
                variant={getStatusColor(
                  usageData.functionExecution.percentage,
                  thresholds.functionExecution
                )}
              >
                {getStatusIcon(
                  usageData.functionExecution.percentage,
                  thresholds.functionExecution
                )}
                <span className="ml-1">
                  {usageData.functionExecution.percentage.toFixed(1)}%
                </span>
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  usageData.functionExecution.percentage >=
                  thresholds.functionExecution.critical
                    ? 'bg-red-500'
                    : usageData.functionExecution.percentage >=
                        thresholds.functionExecution.warning
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.min(usageData.functionExecution.percentage, 100)}%`,
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {usageData.functionExecution.used.toFixed(1)} /{' '}
              {usageData.functionExecution.limit} GB-hours
            </p>
          </div>

          {/* Request Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Request Volume</h3>
              <Badge
                variant={getStatusColor(
                  usageData.requests.averagePerHour,
                  thresholds.requests
                )}
              >
                {getStatusIcon(
                  usageData.requests.averagePerHour,
                  thresholds.requests
                )}
                <span className="ml-1">
                  {usageData.requests.averagePerHour} req/hr
                </span>
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Current hour: {usageData.requests.count} requests
              </span>
            </div>
          </div>

          {/* Alert Thresholds */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Alert Thresholds</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Bandwidth</p>
                <p className="text-muted-foreground">
                  Warning: {thresholds.bandwidth.warning}%<br />
                  Critical: {thresholds.bandwidth.critical}%
                </p>
              </div>
              <div>
                <p className="font-medium">Function Execution</p>
                <p className="text-muted-foreground">
                  Warning: {thresholds.functionExecution.warning}%<br />
                  Critical: {thresholds.functionExecution.critical}%
                </p>
              </div>
              <div>
                <p className="font-medium">Requests</p>
                <p className="text-muted-foreground">
                  Warning: {thresholds.requests.warning}/hr
                  <br />
                  Critical: {thresholds.requests.critical}/hr
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
