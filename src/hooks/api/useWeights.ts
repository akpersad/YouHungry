import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

export interface RestaurantWeight {
  restaurantId: string;
  name: string;
  currentWeight: number;
  selectionCount: number;
  lastSelected?: string;
  daysUntilFullWeight: number;
}

export interface WeightsResponse {
  collectionId: string;
  weights: RestaurantWeight[];
  totalDecisions: number;
}

export interface ResetWeightsInput {
  collectionId: string;
  restaurantId?: string;
}

// Query Keys
export const weightsKeys = {
  all: ['restaurant-weights'] as const,
  byCollection: (collectionId: string) =>
    [...weightsKeys.all, collectionId] as const,
};

// Fetch restaurant weights
async function fetchWeights(collectionId: string): Promise<WeightsResponse> {
  const response = await fetch(
    `/api/decisions/weights?collectionId=${collectionId}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch weights');
  }

  return response.json();
}

// Reset weights
async function resetWeights(
  input: ResetWeightsInput
): Promise<{ message: string; deletedDecisions: number }> {
  const response = await fetch('/api/decisions/weights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reset weights');
  }

  return response.json();
}

// Hooks
export function useRestaurantWeights(collectionId: string, enabled = true) {
  return useQuery({
    queryKey: weightsKeys.byCollection(collectionId),
    queryFn: () => fetchWeights(collectionId),
    enabled: enabled && !!collectionId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useResetWeights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetWeights,
    onSuccess: (_, variables) => {
      // Invalidate weights queries
      queryClient.invalidateQueries({
        queryKey: weightsKeys.byCollection(variables.collectionId),
      });
      // Also invalidate decision statistics
      queryClient.invalidateQueries({
        queryKey: ['decision-statistics', variables.collectionId],
      });
      logger.info('Weights reset successfully');
    },
    onError: (error: Error) => {
      logger.error('Failed to reset weights:', error);
    },
  });
}
