'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRestaurantWeights, useResetWeights } from '@/hooks/api/useWeights';
import {
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  Clock,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';

interface WeightManagementProps {
  collectionId: string;
  collectionName: string;
}

export function WeightManagement({
  collectionId,
  collectionName,
}: WeightManagementProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetTarget, setResetTarget] = useState<string | null>(null);

  const { data, isLoading, error } = useRestaurantWeights(collectionId);
  const resetMutation = useResetWeights();

  const handleResetAll = async () => {
    try {
      await resetMutation.mutateAsync({ collectionId });
      toast.success('All weights reset successfully');
      setShowResetConfirm(false);
    } catch (error) {
      toast.error((error as Error).message || 'Failed to reset weights');
    }
  };

  const handleResetRestaurant = async (restaurantId: string) => {
    try {
      await resetMutation.mutateAsync({ collectionId, restaurantId });
      toast.success('Restaurant weight reset successfully');
      setResetTarget(null);
    } catch (error) {
      toast.error((error as Error).message || 'Failed to reset weight');
    }
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 0.8) return 'text-success bg-success/10';
    if (weight >= 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-destructive bg-destructive/10';
  };

  const getWeightLabel = (weight: number) => {
    if (weight >= 0.8) return 'High';
    if (weight >= 0.5) return 'Medium';
    return 'Low';
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="text-center text-text-light">Loading weights...</div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-8">
        <div className="text-center text-destructive">
          Error loading weights: {(error as Error)?.message}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text mb-2">
            Weight Management
          </h2>
          <p className="text-text-light">
            Collection: {collectionName} • {data.totalDecisions} total decisions
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-2"
          disabled={resetMutation.isPending}
        >
          <RotateCcw className="w-4 h-4" />
          Reset All Weights
        </Button>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-primary/10 border-primary">
        <div className="flex gap-3">
          <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">
              How the 30-Day Weight System Works
            </p>
            <p>
              Restaurants selected recently have lower weights (less likely to
              be selected again). After 30 days without selection, a restaurant
              returns to full weight. This ensures variety while still allowing
              favorites to appear.
            </p>
          </div>
        </div>
      </Card>

      {/* Weights List */}
      <div className="space-y-3">
        {data.weights.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-text-light">
              No restaurants in this collection
            </div>
          </Card>
        ) : (
          data.weights.map((weight) => (
            <Card key={weight.restaurantId} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text truncate mb-2">
                    {weight.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-text-light">
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>Selected {weight.selectionCount} times</span>
                    </div>

                    {weight.lastSelected && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          Last:{' '}
                          {new Date(weight.lastSelected).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {weight.daysUntilFullWeight > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>
                          {weight.daysUntilFullWeight} days until full weight
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Weight Indicator */}
                  <div className="text-center">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium mb-1 ${getWeightColor(weight.currentWeight)}`}
                    >
                      {getWeightLabel(weight.currentWeight)}
                    </div>
                    <div className="text-2xl font-bold text-text">
                      {weight.currentWeight.toFixed(2)}
                    </div>
                    <div className="text-xs text-text-light">Weight</div>
                  </div>

                  {/* Weight Bar */}
                  <div className="w-32">
                    <div className="w-full bg-surface rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          weight.currentWeight >= 0.8
                            ? 'bg-green-500'
                            : weight.currentWeight >= 0.5
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${weight.currentWeight * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Reset Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setResetTarget(weight.restaurantId)}
                    disabled={resetMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Reset All Confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <h3 className="text-xl font-bold text-text">
                Reset All Weights?
              </h3>
            </div>

            <p className="text-text-light mb-6">
              This will delete all decision history for this collection and
              reset all restaurant weights to 1.0. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1"
                disabled={resetMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleResetAll}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? 'Resetting...' : 'Reset All'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reset Restaurant Confirmation */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h3 className="text-xl font-bold text-text">
                Reset Restaurant Weight?
              </h3>
            </div>

            <p className="text-text-light mb-6">
              This will delete the decision history for this restaurant and
              reset its weight to 1.0. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setResetTarget(null)}
                className="flex-1"
                disabled={resetMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleResetRestaurant(resetTarget)}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? 'Resetting...' : 'Reset Weight'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
