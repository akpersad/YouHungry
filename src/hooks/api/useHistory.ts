import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { Decision } from '@/types/database';

export interface DecisionHistoryFilters {
  type?: 'personal' | 'group' | 'all';
  collectionId?: string;
  groupId?: string;
  restaurantId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface DecisionHistoryItem {
  id: string;
  type: 'personal' | 'group';
  collectionId: string;
  collectionName: string;
  groupId?: string;
  groupName?: string;
  method: string;
  visitDate: string;
  amountSpent?: number;
  result: {
    restaurantId: string;
    restaurant: {
      _id: string;
      name: string;
      address?: string;
      cuisine?: string;
      rating?: number;
      priceRange?: string;
    };
    selectedAt: string;
    reasoning: string;
  } | null;
  createdAt: string;
}

export interface DecisionHistoryResponse {
  decisions: DecisionHistoryItem[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface ManualDecisionInput {
  restaurantId: string;
  visitDate: string;
  type?: 'personal' | 'group';
  groupId?: string;
  notes?: string;
}

// Query Keys
export const historyKeys = {
  all: ['decision-history'] as const,
  filtered: (filters: DecisionHistoryFilters) =>
    [...historyKeys.all, filters] as const,
};

// Fetch decision history
async function fetchDecisionHistory(
  filters: DecisionHistoryFilters
): Promise<DecisionHistoryResponse> {
  const params = new URLSearchParams();

  if (filters.type) params.append('type', filters.type);
  if (filters.collectionId) params.append('collectionId', filters.collectionId);
  if (filters.groupId) params.append('groupId', filters.groupId);
  if (filters.restaurantId) params.append('restaurantId', filters.restaurantId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const response = await fetch(`/api/decisions/history?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch decision history');
  }

  const data = await response.json();
  return data;
}

// Create manual decision
async function createManualDecision(
  input: ManualDecisionInput
): Promise<{ decision: Decision }> {
  const response = await fetch('/api/decisions/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create manual decision');
  }

  return response.json();
}

// Hooks
export function useDecisionHistory(
  filters: DecisionHistoryFilters = {},
  enabled = true
) {
  return useQuery({
    queryKey: historyKeys.filtered(filters),
    queryFn: () => fetchDecisionHistory(filters),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useManualDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createManualDecision,
    onSuccess: () => {
      // Invalidate decision history queries
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
      logger.info('Manual decision created successfully');
    },
    onError: (error: Error) => {
      logger.error('Failed to create manual decision:', error);
    },
  });
}

// Update amount spent for a decision
async function updateDecisionAmountSpent(data: {
  decisionId: string;
  amountSpent: number;
}): Promise<{ success: boolean }> {
  const response = await fetch(`/api/decisions/history/${data.decisionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amountSpent: data.amountSpent }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update amount spent');
  }

  return response.json();
}

// Delete a decision
async function deleteDecision(
  decisionId: string
): Promise<{ success: boolean }> {
  const response = await fetch(`/api/decisions/history/${decisionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete decision');
  }

  return response.json();
}

export function useUpdateAmountSpent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDecisionAmountSpent,
    onSuccess: () => {
      // Invalidate decision history queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
      logger.info('Amount spent updated successfully');
    },
    onError: (error: Error) => {
      logger.error('Failed to update amount spent:', error);
    },
  });
}

export function useDeleteDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDecision,
    onSuccess: () => {
      // Invalidate decision history queries
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
      logger.info('Decision deleted successfully');
    },
    onError: (error: Error) => {
      logger.error('Failed to delete decision:', error);
    },
  });
}
