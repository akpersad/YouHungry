'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import {
  Database,
  // Server,
  HardDrive,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  // TrendingUp,
  // Clock,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface DatabaseStats {
  connection: {
    status: string;
    latency: number;
  };
  overview: {
    totalCollections: number;
    totalDocuments: number;
    totalStorageSize: number;
    totalIndexSize: number;
  };
  collections: Array<{
    name: string;
    count: number;
    storageSize: number;
    indexSize: number;
    indexes: number;
    error?: string;
  }>;
  performance: {
    averageResponseTime: number;
    slowQueries: number;
    totalQueries: number;
    recentActivity: {
      newUsers: number;
      newCollections: number;
      newGroups: number;
      newDecisions: number;
      newErrors: number;
      newErrorGroups: number;
    };
  };
  recommendations: Array<{
    type: 'warning' | 'info' | 'error';
    message: string;
  }>;
}

export function DatabaseManagementDashboard() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/database/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      logger.error('Error fetching database stats:', error);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchStats().finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchStats().finally(() => {
      setLoading(false);
    });
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-warning" />;
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <CheckCircle className="h-4 w-4 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw
          className="h-8 w-8 animate-spin text-primary"
          role="status"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Database Management</h2>
          <p>Monitor database performance and health</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Connection Status */}
      {stats && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getConnectionStatusIcon(stats.connection.status)}
              <div className="ml-3">
                <h3 className="text-lg font-semibold">Database Connection</h3>
                <p className="text-text-light">
                  Status:{' '}
                  <span className="capitalize font-medium">
                    {stats.connection.status}
                  </span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-light">Response Time</p>
              <p className="text-lg font-semibold">
                {stats.connection.latency}ms
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-light">
                  Collections
                </p>
                <p className="text-2xl font-bold text-text">
                  {stats.overview.totalCollections}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-success" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-light">
                  Total Documents
                </p>
                <p className="text-2xl font-bold text-text">
                  {stats.overview.totalDocuments.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <HardDrive className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-light">
                  Storage Size
                </p>
                <p className="text-2xl font-bold text-text">
                  {formatBytes(stats.overview.totalStorageSize)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning/20 rounded-lg">
                <Activity className="h-6 w-6 text-warning" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-light">
                  Index Size
                </p>
                <p className="text-2xl font-bold text-text">
                  {formatBytes(stats.overview.totalIndexSize)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Collection Details */}
      {stats && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Collection Statistics</h3>
          <div className="overflow-x-auto">
            <table
              className="min-w-full divide-y"
              style={{ borderColor: 'var(--bg-quaternary)' }}
            >
              <thead style={{ background: 'var(--bg-tertiary)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Collection
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Storage Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Index Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Indexes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody
                className="divide-y"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--bg-quaternary)',
                }}
              >
                {stats.collections.map((collection) => (
                  <tr
                    key={collection.name}
                    style={{ background: 'var(--bg-secondary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {collection.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {collection.count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatBytes(collection.storageSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatBytes(collection.indexSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {collection.indexes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {collection.error ? (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                          }}
                        >
                          Error
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                          }}
                        >
                          Healthy
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Performance Metrics */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-light">
                  Average Response Time
                </span>
                <span className="font-semibold">
                  {stats.performance.averageResponseTime}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-light">Slow Queries</span>
                <span className="font-semibold">
                  {stats.performance.slowQueries}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-light">Total Queries</span>
                <span className="font-semibold">
                  {stats.performance.totalQueries.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Recent Activity (7 days)
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-light">New Users</span>
                <span className="font-semibold">
                  {stats.performance.recentActivity.newUsers}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-light">New Collections</span>
                <span className="font-semibold">
                  {stats.performance.recentActivity.newCollections}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-light">New Groups</span>
                <span className="font-semibold">
                  {stats.performance.recentActivity.newGroups}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-light">New Decisions</span>
                <span className="font-semibold">
                  {stats.performance.recentActivity.newDecisions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-light">New Errors</span>
                <span className="font-semibold">
                  {stats.performance.recentActivity.newErrors}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-light">
                  New Error Groups
                </span>
                <span className="font-semibold">
                  {stats.performance.recentActivity.newErrorGroups}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      {stats && stats.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
          <div className="space-y-3">
            {stats.recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="flex items-start p-3 bg-surface rounded-lg"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getRecommendationIcon(recommendation.type)}
                </div>
                <div className="ml-3">
                  <p
                    className={`text-sm ${
                      recommendation.type === 'error'
                        ? 'text-red-800'
                        : recommendation.type === 'warning'
                          ? 'text-warning'
                          : 'text-blue-800'
                    }`}
                  >
                    {recommendation.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
