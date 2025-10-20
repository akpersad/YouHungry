'use client';

import { Card } from '@/components/ui/Card';
import { usePersonalAnalytics } from '@/hooks/api/useAnalytics';
import {
  TrendingUp,
  Users,
  MapPin,
  Award,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { data: analytics, isLoading, error } = usePersonalAnalytics();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8">
            <div className="text-center text-text-light">
              Loading analytics...
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8">
            <div className="text-center text-destructive">
              Error loading analytics: {(error as Error)?.message}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Your Analytics</h1>
          <p className="text-text-light">
            Insights about your restaurant decisions and preferences
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-light mb-1">
                  Total Decisions
                </p>
                <p className="text-3xl font-bold text-text">
                  {analytics.overview.totalDecisions}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-light mb-1">
                  Unique Restaurants
                </p>
                <p className="text-3xl font-bold text-text">
                  {analytics.overview.uniqueRestaurants}
                </p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-success" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-light mb-1">
                  Group Decisions
                </p>
                <p className="text-3xl font-bold text-text">
                  {analytics.overview.groupDecisions}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-light mb-1">
                  Personal Decisions
                </p>
                <p className="text-3xl font-bold text-text">
                  {analytics.overview.personalDecisions}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Popular Restaurants */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-6 h-6 text-warning" />
              <h2 className="text-xl font-bold text-text">
                Most Visited Restaurants
              </h2>
            </div>

            <div className="space-y-4">
              {analytics.popularRestaurants
                .slice(0, 5)
                .map((restaurant, index) => (
                  <div
                    key={restaurant.id}
                    className="flex items-center gap-4 p-3 bg-surface rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center text-warning font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text truncate">
                        {restaurant.name}
                      </p>
                      <p className="text-sm text-text-light">
                        {restaurant.cuisine} • {restaurant.priceRange || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-text">
                        {restaurant.selectionCount}
                      </p>
                      <p className="text-xs text-text-light">visits</p>
                    </div>
                  </div>
                ))}

              {analytics.popularRestaurants.length === 0 && (
                <p className="text-center text-text-light py-4">
                  No restaurant data yet
                </p>
              )}
            </div>
          </Card>

          {/* Favorite Cuisines */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <PieChart className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-text">Favorite Cuisines</h2>
            </div>

            <div className="space-y-3">
              {analytics.favoriteCuisines.map((cuisine) => {
                const total = analytics.favoriteCuisines.reduce(
                  (sum, c) => sum + c.count,
                  0
                );
                const percentage = ((cuisine.count / total) * 100).toFixed(0);

                return (
                  <div key={cuisine.cuisine}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text">
                        {cuisine.cuisine}
                      </span>
                      <span className="text-sm text-text-light">
                        {cuisine.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {analytics.favoriteCuisines.length === 0 && (
                <p className="text-center text-text-light py-4">
                  No cuisine data yet
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Decision Trends */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-success" />
            <h2 className="text-xl font-bold text-text">Decision Trends</h2>
          </div>

          <div className="space-y-2">
            {analytics.trends.slice(-6).map((trend) => {
              const monthDate = new Date(trend.month + '-01');
              const monthName = monthDate.toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              });

              return (
                <div key={trend.month} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium text-text">
                    {monthName}
                  </div>
                  <div className="flex-1 flex gap-2">
                    {trend.personal > 0 && (
                      <div
                        className="bg-accent h-8 rounded flex items-center justify-center text-white text-xs font-medium"
                        style={{
                          width: `${(trend.personal / trend.total) * 100}%`,
                          minWidth: '40px',
                        }}
                      >
                        {trend.personal}
                      </div>
                    )}
                    {trend.group > 0 && (
                      <div
                        className="bg-purple-500 h-8 rounded flex items-center justify-center text-white text-xs font-medium"
                        style={{
                          width: `${(trend.group / trend.total) * 100}%`,
                          minWidth: '40px',
                        }}
                      >
                        {trend.group}
                      </div>
                    )}
                  </div>
                  <div className="w-16 text-right text-sm font-semibold text-text">
                    {trend.total} total
                  </div>
                </div>
              );
            })}

            {analytics.trends.length === 0 && (
              <p className="text-center text-text-light py-4">
                No trend data yet
              </p>
            )}
          </div>

          <div className="flex gap-4 mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-accent rounded"></div>
              <span className="text-sm text-text-light">Personal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm text-text-light">Group</span>
            </div>
          </div>
        </Card>

        {/* Collections & Groups Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-text">Collections</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-3xl font-bold text-blue-900">
                  {analytics.collections.total}
                </p>
                <p className="text-sm text-primary mt-1">Total Collections</p>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <p className="text-3xl font-bold text-green-900">
                  {analytics.collections.avgRestaurantsPerCollection}
                </p>
                <p className="text-sm text-success mt-1">Avg Restaurants</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-900">
                  {analytics.collections.personal}
                </p>
                <p className="text-sm text-purple-700 mt-1">Personal</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-900">
                  {analytics.collections.group}
                </p>
                <p className="text-sm text-orange-700 mt-1">Group</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-text">Groups</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-900">
                  {analytics.groups.totalGroups}
                </p>
                <p className="text-sm text-purple-700 mt-1">Total Groups</p>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <p className="text-3xl font-bold text-green-900">
                  {analytics.groups.activeGroups}
                </p>
                <p className="text-sm text-success mt-1">Active Groups</p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg col-span-2">
                <p className="text-3xl font-bold text-blue-900">
                  {analytics.groups.adminGroups}
                </p>
                <p className="text-sm text-primary mt-1">Groups You Admin</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
