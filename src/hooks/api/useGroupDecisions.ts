import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface GroupDecision {
  id: string;
  type: 'personal' | 'group';
  collectionId: string;
  groupId?: string;
  method: 'tiered' | 'random';
  status: 'active' | 'completed' | 'expired';
  deadline: string;
  visitDate: string;
  participants: string[];
  votes?: Array<{
    userId: string;
    submittedAt: string;
    hasRankings: boolean;
  }>;
  result?: {
    restaurantId: string;
    selectedAt: string;
    reasoning: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateGroupDecisionData {
  collectionId: string;
  groupId: string;
  method: 'random' | 'tiered';
  visitDate: string;
  deadlineHours?: number;
}

interface SubmitVoteData {
  decisionId: string;
  rankings: string[];
}

export function useGroupDecisions(groupId: string) {
  const queryClient = useQueryClient();

  // Fetch active group decisions with smart polling
  const {
    data: decisions,
    isLoading: decisionsLoading,
    error: decisionsError,
  } = useQuery({
    queryKey: ['groupDecisions', groupId],
    queryFn: async (): Promise<GroupDecision[]> => {
      const response = await fetch(`/api/decisions/group?groupId=${groupId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch group decisions');
      }
      const data = await response.json();
      return data.decisions;
    },
    // Smart polling: 30s when active decisions exist, 5min when inactive
    refetchInterval: (query) => {
      const decisions = (query.state.data as GroupDecision[]) || [];
      const hasActiveDecisions = decisions.some((d) => d.status === 'active');
      const hasRecentActivity = decisions.some((d) => {
        const updatedAt = new Date(d.updatedAt);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return updatedAt > fiveMinutesAgo;
      });

      // Poll every 30s if there are active decisions OR recent activity
      return hasActiveDecisions || hasRecentActivity ? 30000 : 300000;
    },
    refetchIntervalInBackground: false, // Don't poll when tab is inactive
  });

  // Create group decision mutation
  const createDecisionMutation = useMutation({
    mutationFn: async (data: CreateGroupDecisionData) => {
      const response = await fetch('/api/decisions/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create group decision');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupDecisions', groupId] });
    },
  });

  // Submit vote mutation
  const submitVoteMutation = useMutation({
    mutationFn: async (data: SubmitVoteData) => {
      const response = await fetch('/api/decisions/group/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupDecisions', groupId] });
    },
  });

  // Complete decision mutation
  const completeDecisionMutation = useMutation({
    mutationFn: async (decisionId: string) => {
      const response = await fetch('/api/decisions/group/vote', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId }),
      });
      if (!response.ok) {
        throw new Error('Failed to complete decision');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupDecisions', groupId] });
    },
  });

  // Random selection mutation
  const randomSelectMutation = useMutation({
    mutationFn: async (data: {
      collectionId: string;
      groupId: string;
      visitDate: string;
    }) => {
      const response = await fetch('/api/decisions/group/random-select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to perform random selection');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupDecisions', groupId] });
    },
  });

  return {
    // Data
    decisions,
    decisionsLoading,
    decisionsError,

    // Mutations
    createDecision: createDecisionMutation.mutate,
    createDecisionLoading: createDecisionMutation.isPending,
    createDecisionError: createDecisionMutation.error,

    submitVote: submitVoteMutation.mutate,
    submitVoteLoading: submitVoteMutation.isPending,
    submitVoteError: submitVoteMutation.error,

    completeDecision: completeDecisionMutation.mutate,
    completeDecisionLoading: completeDecisionMutation.isPending,
    completeDecisionError: completeDecisionMutation.error,

    randomSelect: randomSelectMutation.mutate,
    randomSelectLoading: randomSelectMutation.isPending,
    randomSelectError: randomSelectMutation.error,
  };
}
