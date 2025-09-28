'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface RestaurantStat {
  restaurantId: string;
  name: string;
  selectionCount: number;
  lastSelected?: string;
  currentWeight: number;
}

interface DecisionStatisticsProps {
  collectionId: string;
  onClose?: () => void;
}

export function DecisionStatistics({
  collectionId,
  onClose,
}: DecisionStatisticsProps) {
  const [statistics, setStatistics] = useState<{
    totalDecisions: number;
    restaurantStats: RestaurantStat[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, [collectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/decisions/random-select?collectionId=${collectionId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch statistics');
      }

      setStatistics(data.statistics);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch statistics'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSelected = (lastSelected?: string) => {
    if (!lastSelected) return 'Never';

    const date = new Date(lastSelected);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.ceil(diffDays / 7);
      return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    }
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 0.8) return 'text-green-600 bg-green-50';
    if (weight >= 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getWeightLabel = (weight: number) => {
    if (weight >= 0.8) return 'High Priority';
    if (weight >= 0.5) return 'Medium Priority';
    return 'Low Priority';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div
            className="flex items-center justify-center py-8"
            role="status"
            aria-label="Loading"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchStatistics} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Decision Statistics
          </h3>
          {onClose && (
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-900">
                Total Decisions Made
              </span>
              <span className="text-2xl font-bold text-blue-600">
                {statistics.totalDecisions}
              </span>
            </div>
          </div>

          {/* Restaurant Statistics */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">
              Restaurant Selection History
            </h4>

            {statistics.restaurantStats.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No decisions have been made yet for this collection.
              </p>
            ) : (
              <div className="space-y-2">
                {statistics.restaurantStats.map((stat) => (
                  <div
                    key={stat.restaurantId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {stat.name}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Selected {stat.selectionCount} times</span>
                        <span>
                          Last: {formatLastSelected(stat.lastSelected)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getWeightColor(stat.currentWeight)}`}
                      >
                        {getWeightLabel(stat.currentWeight)}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {stat.currentWeight.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">Weight</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Explanation */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              How the Weight System Works
            </h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                • Restaurants selected recently have lower weights (less likely
                to be chosen again)
              </p>
              <p>
                • Restaurants not selected in 30+ days have higher weights (more
                likely to be chosen)
              </p>
              <p>
                • This ensures variety while still allowing favorites to be
                selected
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
