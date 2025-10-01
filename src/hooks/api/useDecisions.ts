import { logger } from '@/lib/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Decision, Restaurant } from '@/types/database';

// Query keys for consistent cache management
export const decisionKeys = {
  all: ['decisions'] as const,
  lists: () => [...decisionKeys.all, 'list'] as const,
  list: (collectionId: string) =>
    [...decisionKeys.lists(), collectionId] as const,
  details: () => [...decisionKeys.all, 'detail'] as const,
  detail: (id: string) => [...decisionKeys.details(), id] as const,
  statistics: () => [...decisionKeys.all, 'statistics'] as const,
  statisticsQuery: (collectionId: string) =>
    [...decisionKeys.statistics(), collectionId] as const,
};

// Decision result interface
export interface DecisionResult {
  restaurant: Restaurant;
  reasoning: string;
  visitDate: Date;
  weight: number;
}

// Statistics interfaces
export interface RestaurantStat {
  restaurantId: string;
  restaurantName: string;
  selectionCount: number;
  lastSelected?: string;
  weight: number;
}

export interface DecisionStatistics {
  totalDecisions: number;
  restaurantStats: RestaurantStat[];
}

// API functions
const makeRandomDecision = async ({
  collectionId,
  visitDate,
}: {
  collectionId: string;
  visitDate: string;
}): Promise<{
  result: {
    restaurantId: string;
    reasoning: string;
    weight: number;
  };
  statistics: DecisionStatistics;
}> => {
  const response = await fetch('/api/decisions/random-select', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      collectionId,
      visitDate,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to make decision');
  }

  return data;
};

const fetchDecisionStatistics = async (
  collectionId: string
): Promise<DecisionStatistics> => {
  const response = await fetch(
    `/api/decisions/random-select?collectionId=${collectionId}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch statistics');
  }

  return data.statistics;
};

const fetchDecisionHistory = async (
  collectionId: string
): Promise<Decision[]> => {
  const response = await fetch(`/api/decisions?collectionId=${collectionId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch decision history');
  }

  return data.decisions || [];
};

// React Query hooks
export function useRandomDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: makeRandomDecision,
    onSuccess: (data, variables) => {
      // Invalidate statistics to refresh the data
      queryClient.invalidateQueries({
        queryKey: decisionKeys.statisticsQuery(variables.collectionId),
      });

      // Invalidate decision history
      queryClient.invalidateQueries({
        queryKey: decisionKeys.list(variables.collectionId),
      });

      // Invalidate collection data to refresh restaurant counts/weights
      queryClient.invalidateQueries({
        queryKey: ['collections', 'detail', variables.collectionId],
      });
    },
    onError: (error) => {
      logger.error('Failed to make random decision:', error);
    },
  });
}

export function useDecisionStatistics(collectionId: string, enabled = true) {
  return useQuery({
    queryKey: decisionKeys.statisticsQuery(collectionId),
    queryFn: () => fetchDecisionStatistics(collectionId),
    enabled: enabled && !!collectionId,
    staleTime: 2 * 60 * 1000, // 2 minutes for statistics
  });
}

export function useDecisionHistory(collectionId: string, enabled = true) {
  return useQuery({
    queryKey: decisionKeys.list(collectionId),
    queryFn: () => fetchDecisionHistory(collectionId),
    enabled: enabled && !!collectionId,
    staleTime: 5 * 60 * 1000, // 5 minutes for decision history
  });
}

// Helper hook to get a complete decision result with restaurant details
export function useDecisionWithRestaurant(
  decisionResult: {
    restaurantId: string;
    reasoning: string;
    weight: number;
    visitDate: Date;
  },
  enabled = true
) {
  const restaurantQuery = useQuery({
    queryKey: ['restaurants', 'detail', decisionResult.restaurantId],
    queryFn: async () => {
      const response = await fetch(
        `/api/restaurants/${decisionResult.restaurantId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch restaurant details');
      }

      return data.restaurant;
    },
    enabled: enabled && !!decisionResult.restaurantId,
    staleTime: 30 * 60 * 1000, // 30 minutes for restaurant details
  });

  return {
    ...restaurantQuery,
    data: restaurantQuery.data
      ? {
          restaurant: restaurantQuery.data,
          reasoning: decisionResult.reasoning,
          visitDate: decisionResult.visitDate,
          weight: decisionResult.weight,
        }
      : undefined,
  };
}
