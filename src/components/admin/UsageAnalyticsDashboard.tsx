'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  // TrendingUp,
  // Users,
  Activity,
  RefreshCw,
  Clock,
  Zap,
  // Target,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface UsageAnalytics {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  apiUsage: {
    googlePlaces: {
      calls: number;
      cost: number;
      errors: number;
    };
    googleMaps: {
      calls: number;
      cost: number;
      errors: number;
    };
    internal: {
      calls: number;
      errors: number;
    };
  };
  featureUsage: {
    restaurantSearch: number;
    groupDecisions: number;
    collectionCreation: number;
    groupCreation: number;
    friendRequests: number;
  };
  userBehavior: {
    totalUsers: number;
    avgCollectionsPerUser: number;
    avgGroupsPerUser: number;
    avgDecisionsPerUser: number;
    activeUsers: number;
    engagementRate: number;
  };
  trends: {
    dailyActivity: Array<{
      date: string;
      decisions: number;
      uniqueUsers: number;
    }>;
  };
  popularFeatures: Array<{
    name: string;
    usage: number;
    trend: string;
  }>;
  capacityPlanning: {
    currentUsers: number;
    projectedGrowth: number;
    storageUsage: number;
    apiQuotaUsage: number;
    recommendations: string[];
  };
}

export function UsageAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const fetchAnalytics = useCallback(
    async (period: string = selectedPeriod) => {
      try {
        const response = await fetch(
          `/api/admin/analytics/usage?period=${period}`
        );
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error('Error fetching usage analytics:', error);
      }
    },
    [selectedPeriod]
  );

  const handleRefresh = () => {
    setLoading(true);
    fetchAnalytics().finally(() => {
      setLoading(false);
    });
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setLoading(true);
    fetchAnalytics(period).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAnalytics().finally(() => {
      setLoading(false);
    });
  }, [fetchAnalytics]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTrendIcon = (trend: string) => {
    if (trend.startsWith('+')) {
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    } else if (trend.startsWith('-')) {
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
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
          <h2 className="text-2xl font-bold text-gray-900">Usage Analytics</h2>
          <p className="text-gray-600">
            Track API usage, user behavior, and feature adoption
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* API Usage Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Google Places API
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(analytics.apiUsage.googlePlaces.calls)}
                </p>
                <p className="text-xs text-gray-500">
                  ${analytics.apiUsage.googlePlaces.cost.toFixed(2)} cost
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Google Maps API
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(analytics.apiUsage.googleMaps.calls)}
                </p>
                <p className="text-xs text-gray-500">
                  ${analytics.apiUsage.googleMaps.cost.toFixed(2)} cost
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Internal API
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(analytics.apiUsage.internal.calls)}
                </p>
                <p className="text-xs text-gray-500">Total calls</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">API Errors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.apiUsage.googlePlaces.errors +
                    analytics.apiUsage.googleMaps.errors +
                    analytics.apiUsage.internal.errors}
                </p>
                <p className="text-xs text-gray-500">Total errors</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Feature Usage */}
      {analytics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Feature Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analytics.featureUsage).map(([feature, usage]) => (
              <div key={feature} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-2xl font-bold text-primary">{usage}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedPeriod === '7d'
                      ? 'This week'
                      : selectedPeriod === '30d'
                        ? 'This month'
                        : 'This quarter'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* User Behavior */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">User Engagement</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Users</span>
                <span className="font-semibold">
                  {analytics.userBehavior.totalUsers.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Users</span>
                <span className="font-semibold">
                  {analytics.userBehavior.activeUsers.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Engagement Rate</span>
                <span className="font-semibold text-green-600">
                  {analytics.userBehavior.engagementRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Avg Collections/User
                </span>
                <span className="font-semibold">
                  {analytics.userBehavior.avgCollectionsPerUser.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Groups/User</span>
                <span className="font-semibold">
                  {analytics.userBehavior.avgGroupsPerUser.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Avg Decisions/User
                </span>
                <span className="font-semibold">
                  {analytics.userBehavior.avgDecisionsPerUser.toFixed(1)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Capacity Planning</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Users</span>
                <span className="font-semibold">
                  {analytics.capacityPlanning.currentUsers.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Projected Growth</span>
                <span className="font-semibold text-blue-600">
                  {analytics.capacityPlanning.projectedGrowth.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Storage Usage</span>
                <span className="font-semibold">
                  {analytics.capacityPlanning.storageUsage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">API Quota Usage</span>
                <span className="font-semibold">
                  {analytics.capacityPlanning.apiQuotaUsage.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Popular Features */}
      {analytics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Most Popular Features</h3>
          <div className="space-y-3">
            {analytics.popularFeatures.map((feature, index) => (
              <div
                key={feature.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {feature.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {feature.usage} uses
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(feature.trend)}
                  <span
                    className={`text-sm font-medium ${
                      feature.trend.startsWith('+')
                        ? 'text-green-600'
                        : feature.trend.startsWith('-')
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {feature.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Daily Activity Chart */}
      {analytics && analytics.trends.dailyActivity.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Activity Trends</h3>
          <div className="space-y-4">
            {analytics.trends.dailyActivity.slice(-7).map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>{day.decisions} decisions</span>
                  <span>{day.uniqueUsers} users</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {analytics && analytics.capacityPlanning.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Optimization Recommendations
          </h3>
          <div className="space-y-3">
            {analytics.capacityPlanning.recommendations.map(
              (recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start p-3 bg-blue-50 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">{recommendation}</p>
                  </div>
                </div>
              )
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
