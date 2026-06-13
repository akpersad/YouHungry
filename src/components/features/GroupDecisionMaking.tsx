'use client';

import { logger } from '@/lib/logger';
import React, { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import {
  trackDecisionGroupStart,
  trackDecisionVoteSubmitted,
  trackDecisionGroupComplete,
} from '@/lib/analytics';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { DecisionResultModal } from './DecisionResultModal';
import { VoteBreakdown } from './decide/VoteBreakdown';
import { useGroupDecisionSubscription } from '@/hooks/api/useGroupDecisionSubscription';
import { Restaurant as DatabaseRestaurant } from '@/types/database';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GroupDecisionMakingProps {
  groupId: string;
  collectionId: string;
  isAdmin: boolean;
}

interface VoteBreakdownEntry {
  first: number;
  second: number;
  third: number;
  total: number;
}

interface GroupDecision {
  id: string;
  type: 'personal' | 'group';
  collectionId: string;
  groupId?: string;
  method: 'tiered' | 'random';
  status: 'active' | 'completed' | 'expired' | 'closed';
  deadline: string;
  visitDate: string;
  participants: string[];
  votes?: Array<{
    userId: string;
    submittedAt: string;
    hasRankings: boolean;
  }>;
  voteBreakdown?: Record<string, VoteBreakdownEntry>;
  myRankings?: string[];
  result?: {
    restaurantId: string;
    selectedAt: string;
    reasoning: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Restaurant {
  _id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  cuisine: string;
  rating: number;
  priceRange?: string;
  phoneNumber?: string;
  photos?: string[];
  cachedAt: Date;
  lastUpdated: Date;
}

const MAX_RANKINGS = 3;
const draftKey = (decisionId: string) => `fitr-vote-draft:${decisionId}`;

function readDraft(decisionId: string): string[] {
  try {
    const raw = localStorage.getItem(draftKey(decisionId));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// A completed decision is "recent" for the celebratory card up to 24h past its
// visit date; older completed/closed decisions move to the past-decisions list.
function isRecentlyCompleted(d: GroupDecision): boolean {
  if (d.status !== 'completed') return false;
  const hoursSinceVisit =
    (Date.now() - new Date(d.visitDate).getTime()) / (1000 * 60 * 60);
  return hoursSinceVisit <= 24;
}

export function GroupDecisionMaking({
  groupId,
  collectionId,
  isAdmin,
}: GroupDecisionMakingProps) {
  const { user } = useUser();
  const [showCreateDecision, setShowCreateDecision] = useState(false);
  // The decision currently being voted on — when set, the full-page voting
  // view replaces the decision list (V3: out of the cramped modal).
  const [votingDecision, setVotingDecision] = useState<GroupDecision | null>(
    null
  );
  const [showDecisionResult, setShowDecisionResult] = useState(false);
  const [decisionResult, setDecisionResult] = useState<{
    restaurant: DatabaseRestaurant;
    reasoning: string;
    visitDate: Date;
  } | null>(null);
  const [rankings, setRankings] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [visitDate, setVisitDate] = useState('');
  const [deadlineHours] = useState(24);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [decisionToClose, setDecisionToClose] = useState<GroupDecision | null>(
    null
  );

  const queryClient = useQueryClient();

  // Open the full-page voting view. Preloads the user's existing ballot (V5)
  // or a locally-saved draft (V4) so picks are never lost.
  const openVoting = useCallback((decision: GroupDecision) => {
    const fromServer = decision.myRankings ?? [];
    const fromDraft = readDraft(decision.id);
    const preset = fromServer.length > 0 ? fromServer : fromDraft;
    setRankings(preset);
    setVotingDecision(decision);
  }, []);

  // Use real-time subscription for active group decisions.
  const { decisions, isConnected } = useGroupDecisionSubscription(
    groupId,
    undefined,
    true
  );

  // Always-on query for the full decision history (active + completed +
  // closed) — drives the past-decisions section and is the fallback for the
  // live list when the SSE stream is down.
  const { data: allDecisions, isLoading: decisionsLoading } = useQuery({
    queryKey: ['groupDecisions', groupId, 'all'],
    queryFn: async () => {
      const response = await fetch(`/api/decisions/group?groupId=${groupId}`);
      if (!response.ok) throw new Error('Failed to fetch group decisions');
      const data = await response.json();
      return data.decisions as GroupDecision[];
    },
  });

  // Get current user's database ID
  const { data: currentUserData } = useQuery({
    queryKey: ['currentUser', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/user/current');
      if (!response.ok) throw new Error('Failed to fetch current user');
      const data = await response.json();
      return data.user;
    },
    enabled: !!user?.id,
  });

  // Fetch restaurants for the collection
  const { data: restaurants, isLoading: restaurantsLoading } = useQuery({
    queryKey: ['collectionRestaurants', collectionId],
    queryFn: async () => {
      const response = await fetch(
        `/api/collections/${collectionId}/restaurants`
      );
      if (!response.ok) throw new Error('Failed to fetch restaurants');
      const data = await response.json();
      return data.restaurants as Restaurant[];
    },
  });

  // Active decisions stream live over SSE; everything else comes from the
  // history query. Merge so completed/closed decisions are always available.
  const liveActive = (decisions as GroupDecision[]).filter(
    (d) => d.status === 'active'
  );
  const activeDecisions: GroupDecision[] =
    liveActive.length > 0
      ? liveActive
      : (allDecisions || []).filter((d) => d.status === 'active');

  const nonActiveDecisions: GroupDecision[] = (allDecisions || []).filter(
    (d) => d.status !== 'active'
  );

  const recentResults = nonActiveDecisions.filter(isRecentlyCompleted);
  const pastDecisions = nonActiveDecisions.filter(
    (d) => !isRecentlyCompleted(d)
  );

  // Create group decision mutation
  const createDecisionMutation = useMutation({
    mutationFn: async (data: {
      collectionId: string;
      groupId: string;
      method: 'random' | 'tiered';
      visitDate: string;
      deadlineHours: number;
    }) => {
      const response = await fetch('/api/decisions/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create decision');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groupDecisions', groupId] });
      setShowCreateDecision(false);

      if (data.decision) {
        trackDecisionGroupStart({
          groupId,
          collectionId,
          decisionType: data.decision.method,
          restaurantCount: restaurants?.length || 0,
        });

        // Open the full-page voting view for the freshly started decision.
        openVoting(data.decision as GroupDecision);
      }
    },
  });

  // Submit vote mutation
  const submitVoteMutation = useMutation({
    mutationFn: async (data: { decisionId: string; rankings: string[] }) => {
      const response = await fetch('/api/decisions/group/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to submit vote');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupDecisions', groupId] });

      if (votingDecision) {
        trackDecisionVoteSubmitted({
          groupId,
          decisionId: votingDecision.id.toString(),
          rankingPositions: rankings.length,
        });
        try {
          localStorage.removeItem(draftKey(votingDecision.id));
        } catch {
          // best-effort draft cleanup
        }
      }

      toast.success('Vote submitted.');
      setVotingDecision(null);
      setRankings([]);
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
      if (!response.ok) throw new Error('Failed to complete decision');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groupDecisions', groupId] });

      if (data.result && data.decision) {
        trackDecisionGroupComplete({
          groupId,
          decisionId: data.decision._id?.toString() || '',
          decisionType: data.decision.method,
          voteCount: data.decision.votes?.length || 0,
          selectedRestaurantId: data.result.restaurantId?.toString(),
        });
      }

      if (data.result) {
        setDecisionResult({
          restaurant: data.result.restaurant,
          reasoning: data.result.reasoning,
          visitDate: new Date(data.result.visitDate || data.result.selectedAt),
        });
      }
      setShowDecisionResult(true);
    },
  });

  // Close decision mutation
  const closeDecisionMutation = useMutation({
    mutationFn: async (decisionId: string) => {
      const response = await fetch('/api/decisions/group/vote', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId }),
      });
      if (!response.ok) throw new Error('Failed to close decision');
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
      if (!response.ok) throw new Error('Failed to perform random selection');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groupDecisions', groupId] });
      if (data.result) {
        setDecisionResult({
          restaurant: data.result.restaurant,
          reasoning: data.result.reasoning,
          visitDate: new Date(data.result.visitDate || data.result.selectedAt),
        });
      }
      setShowDecisionResult(true);
    },
  });

  const handleCreateDecision = (method: 'random' | 'tiered') => {
    if (!visitDate) {
      toast.error('Please select a visit date');
      return;
    }

    const isoVisitDate = new Date(visitDate).toISOString();

    if (method === 'random') {
      randomSelectMutation.mutate({
        collectionId,
        groupId,
        visitDate: isoVisitDate,
      });
    } else {
      createDecisionMutation.mutate({
        collectionId,
        groupId,
        method: 'tiered',
        visitDate: isoVisitDate,
        deadlineHours,
      });
    }
  };

  // Persist the in-progress ballot so closing the tab/app keeps the picks (V4).
  useEffect(() => {
    if (!votingDecision) return;
    try {
      localStorage.setItem(
        draftKey(votingDecision.id),
        JSON.stringify(rankings)
      );
    } catch {
      // localStorage may be unavailable (private mode) — non-fatal.
    }
  }, [rankings, votingDecision]);

  const handleVote = () => {
    if (!votingDecision || rankings.length === 0) {
      toast.error('Please select at least one restaurant');
      return;
    }

    const decisionId = votingDecision.id;
    if (!decisionId) {
      logger.error('Selected decision has no ID!');
      toast.error('Error: Decision ID is missing. Please try again.');
      return;
    }

    submitVoteMutation.mutate({ decisionId, rankings });
  };

  const handleCompleteDecision = (decision: GroupDecision) => {
    completeDecisionMutation.mutate(decision.id);
  };

  const handleCloseDecision = (decision: GroupDecision) => {
    setDecisionToClose(decision);
    setShowCloseConfirmation(true);
  };

  const confirmCloseDecision = () => {
    if (decisionToClose) {
      closeDecisionMutation.mutate(decisionToClose.id);
    }
    setShowCloseConfirmation(false);
    setDecisionToClose(null);
  };

  // Tap-to-rank: tapping an unranked restaurant appends it; tapping a ranked
  // one removes it. Works without drag — the primary path on mobile (V3).
  const toggleRanking = (restaurantId: string) => {
    if (rankings.includes(restaurantId)) {
      setRankings(rankings.filter((id) => id !== restaurantId));
    } else if (rankings.length < MAX_RANKINGS) {
      setRankings([...rankings, restaurantId]);
    } else {
      toast.warning(`You can only rank up to ${MAX_RANKINGS} restaurants`);
    }
  };

  // Tap-friendly reorder controls (alternative to drag for touch).
  const moveRanking = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rankings.length) return;
    const next = [...rankings];
    [next[index], next[target]] = [next[target], next[index]];
    setRankings(next);
  };

  // Drag-and-drop reorder (progressive enhancement for pointer devices).
  const handleDragStart = (e: React.DragEvent, restaurantId: string) => {
    if (rankings.includes(restaurantId)) {
      setDraggedItem(restaurantId);
      e.dataTransfer.effectAllowed = 'move';
    } else {
      e.preventDefault();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem || !rankings.includes(draggedItem)) return;

    const newRankings = [...rankings];
    const draggedIndex = newRankings.indexOf(draggedItem);
    if (draggedIndex !== -1) {
      newRankings.splice(draggedIndex, 1);
      newRankings.splice(targetIndex, 0, draggedItem);
      setRankings(newRankings);
    }
    setDraggedItem(null);
  };

  const hasUserVoted = (decision: GroupDecision) => {
    if (!currentUserData?._id) return false;
    return !!decision.votes?.find(
      (vote) => vote.userId === currentUserData._id.toString()
    );
  };

  const votedCount = (decision: GroupDecision) =>
    decision.votes?.filter((v) => v.hasRankings).length ?? 0;

  const canCompleteDecision = (decision: GroupDecision) =>
    isAdmin &&
    decision.method === 'tiered' &&
    decision.status === 'active' &&
    !!decision.votes &&
    decision.votes.length > 0;

  const canCloseDecision = (decision: GroupDecision) =>
    isAdmin && decision.status === 'active';

  const restaurantById = (id?: string) =>
    id ? restaurants?.find((r) => r._id === id) : undefined;

  if (decisionsLoading || restaurantsLoading) {
    return (
      <SkeletonGroup label="Loading group decisions" className="space-y-4">
        {[0, 1].map((i) => (
          <Card key={i} className="space-y-3 p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full max-w-[12rem]" />
          </Card>
        ))}
      </SkeletonGroup>
    );
  }

  // ---- Full-page voting view (V3) ----------------------------------------
  if (votingDecision) {
    const alreadyVoted = hasUserVoted(votingDecision);
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVotingDecision(null)}
          >
            ← Back
          </Button>
          <h2 className="font-display text-2xl font-semibold text-primary">
            Rank your top {MAX_RANKINGS}
          </h2>
        </div>

        {alreadyVoted && (
          <div
            className="rounded-xl border p-4 text-sm"
            style={{
              background: 'var(--saffron-tint)',
              borderColor: 'var(--saffron)',
              color: 'var(--on-saffron)',
            }}
          >
            You&apos;ve already voted — submitting again replaces your previous
            ranking. Your picks are preloaded below.
          </div>
        )}

        <p className="text-secondary">
          Tap up to {MAX_RANKINGS} restaurants in order of preference. Your 1st
          choice is worth 3 points, 2nd worth 2, and 3rd worth 1 — the highest
          total wins.
        </p>

        {/* Current ranking */}
        {rankings.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-secondary">
              Your ranking ({rankings.length}/{MAX_RANKINGS})
            </h3>
            <ul className="space-y-2">
              {rankings.map((restaurantId, index) => {
                const restaurant = restaurantById(restaurantId);
                if (!restaurant) return null;
                return (
                  <li
                    key={`rank-${restaurantId}`}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 transition-all',
                      draggedItem === restaurantId && 'opacity-50'
                    )}
                    style={{
                      borderColor: 'var(--tomato)',
                      background: 'var(--tomato-tint)',
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, restaurantId)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-inverse"
                      style={{ background: 'var(--tomato)' }}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-primary">
                        {restaurant.name}
                      </p>
                      <p className="truncate text-sm text-tertiary">
                        {restaurant.cuisine}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveRanking(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${restaurant.name} up`}
                        className="touch-target rounded px-2 py-1 text-secondary disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRanking(index, 1)}
                        disabled={index === rankings.length - 1}
                        aria-label={`Move ${restaurant.name} down`}
                        className="touch-target rounded px-2 py-1 text-secondary disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRanking(restaurantId)}
                        aria-label={`Remove ${restaurant.name}`}
                        className="touch-target rounded px-2 py-1 text-sm text-destructive"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Available restaurants */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-secondary">
            {rankings.length >= MAX_RANKINGS
              ? 'Ranking full — remove one to swap'
              : 'Tap to add to your ranking'}
          </h3>
          <ul className="space-y-2">
            {restaurants?.map((restaurant) => {
              const isSelected = rankings.includes(restaurant._id);
              const canSelect = !isSelected && rankings.length < MAX_RANKINGS;
              return (
                <li key={restaurant._id}>
                  <button
                    type="button"
                    onClick={() => toggleRanking(restaurant._id)}
                    disabled={!isSelected && !canSelect}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all',
                      isSelected
                        ? 'border-[var(--olive)]'
                        : canSelect
                          ? 'border-border hover:border-[var(--border-strong)]'
                          : 'border-border opacity-50'
                    )}
                    style={
                      isSelected
                        ? { background: 'var(--olive-tint)' }
                        : undefined
                    }
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm',
                          isSelected ? 'text-inverse' : 'border border-border'
                        )}
                        style={
                          isSelected
                            ? { background: 'var(--olive)' }
                            : undefined
                        }
                        aria-hidden="true"
                      >
                        {isSelected ? '✓' : ''}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-primary">
                          {restaurant.name}
                        </p>
                        <p className="truncate text-sm text-tertiary">
                          {restaurant.cuisine}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-secondary">
                        ⭐ {restaurant.rating}
                      </p>
                      {restaurant.priceRange && (
                        <p className="text-sm text-tertiary">
                          {restaurant.priceRange}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-surface py-3">
          <Button variant="outline" onClick={() => setVotingDecision(null)}>
            Cancel
          </Button>
          <Button
            onClick={handleVote}
            disabled={rankings.length === 0 || submitVoteMutation.isPending}
          >
            {alreadyVoted ? 'Update vote' : 'Submit vote'}
          </Button>
        </div>
      </div>
    );
  }

  // ---- Decision hub -------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-primary">
            Group Decisions
          </h2>
          <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-tertiary">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isConnected && 'motion-safe:animate-pulse'
              )}
              style={{
                background: isConnected
                  ? 'var(--color-success)'
                  : 'var(--border-strong)',
              }}
              aria-hidden="true"
            />
            {isConnected ? 'Live' : 'Reconnecting…'}
          </span>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowCreateDecision(true)}
            data-start-decision
          >
            Start Decision
          </Button>
        )}
      </div>

      {/* Active decisions */}
      <div className="space-y-4">
        {activeDecisions.map((decision) => (
          <Card key={`active-${decision.id}`} className="p-6">
            <div className="block md:flex md:items-start md:justify-between">
              <div className="w-full md:w-auto">
                <div className="mb-4 flex items-center justify-between gap-3 md:mb-2 md:justify-start">
                  <h3 className="text-lg font-semibold text-primary">
                    {decision.method === 'tiered'
                      ? 'Tiered Choice'
                      : 'Random Selection'}
                  </h3>
                  {hasUserVoted(decision) && (
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        background: 'var(--olive-tint)',
                        color: 'var(--olive)',
                      }}
                    >
                      ✓ You&apos;ve Voted
                    </span>
                  )}
                </div>

                <div className="mb-6 space-y-2 md:mb-0 md:space-y-0">
                  <p className="text-secondary">
                    Visit Date:{' '}
                    {new Date(decision.visitDate).toLocaleDateString()}
                  </p>
                  <p className="text-secondary">
                    Deadline: {new Date(decision.deadline).toLocaleDateString()}{' '}
                    {new Date(decision.deadline).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {/* Presence line — quiet live status (O6/V6) */}
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        isConnected && 'motion-safe:animate-pulse'
                      )}
                      style={{
                        background: isConnected
                          ? 'var(--color-success)'
                          : 'var(--border-strong)',
                      }}
                      aria-hidden="true"
                    />
                    {isConnected ? 'Live · ' : ''}
                    {votedCount(decision)} of {decision.participants.length}{' '}
                    voted
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col space-y-2 md:mt-0 md:flex-row md:space-x-2 md:space-y-0">
                {decision.method === 'tiered' &&
                  decision.status === 'active' && (
                    <Button
                      onClick={() => openVoting(decision)}
                      className="w-full touch-target md:w-auto"
                    >
                      {hasUserVoted(decision) ? 'Re-vote' : 'Vote'}
                    </Button>
                  )}
                {canCompleteDecision(decision) && (
                  <Button
                    onClick={() => handleCompleteDecision(decision)}
                    variant="outline"
                    className="w-full touch-target md:w-auto"
                  >
                    Complete
                  </Button>
                )}
                {canCloseDecision(decision) && (
                  <Button
                    onClick={() => handleCloseDecision(decision)}
                    variant="outline"
                    className="w-full touch-target border-destructive text-destructive md:w-auto"
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {activeDecisions.length === 0 && (
          <EmptyState
            title="No active decision"
            description={
              isAdmin
                ? 'Start a tiered vote or spin a random pick for the group.'
                : 'When an admin starts a decision, it shows up here to vote on.'
            }
            action={
              isAdmin
                ? {
                    label: 'Start Decision',
                    onClick: () => setShowCreateDecision(true),
                  }
                : undefined
            }
          />
        )}
      </div>

      {/* Recent results — celebratory card with the full breakdown (O8/V7) */}
      {recentResults.map((decision) => {
        const winner = restaurantById(decision.result?.restaurantId);
        return (
          <Card key={`result-${decision.id}`} className="p-6">
            <div className="mb-3 flex items-center gap-3">
              <span aria-hidden="true" className="text-2xl">
                🎉
              </span>
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  Decision Completed!
                </h3>
                <p className="text-sm text-tertiary">
                  {decision.method === 'tiered'
                    ? 'Tiered Choice'
                    : 'Random Selection'}{' '}
                  · {new Date(decision.visitDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {winner ? (
              <div className="mb-4">
                <p className="text-sm text-tertiary">Selected Restaurant</p>
                <p className="font-display text-xl font-semibold text-primary">
                  {winner.name}
                </p>
                {winner.address && (
                  <p className="text-sm text-secondary">📍 {winner.address}</p>
                )}
              </div>
            ) : (
              decision.result && (
                <p className="mb-4 text-secondary">Restaurant not found</p>
              )
            )}

            {decision.method === 'tiered' && decision.voteBreakdown && (
              <VoteBreakdown
                breakdown={decision.voteBreakdown}
                restaurants={restaurants || []}
                winnerId={decision.result?.restaurantId}
              />
            )}

            {decision.result?.reasoning && (
              <p className="mt-3 border-t border-border pt-2 text-sm text-tertiary">
                <span className="font-medium">Reasoning:</span>{' '}
                {decision.result.reasoning}
              </p>
            )}
          </Card>
        );
      })}

      {/* Past decisions — no more 24h history cliff (O8) */}
      {pastDecisions.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-xl font-semibold text-primary">
            Past decisions
          </h3>
          {pastDecisions.slice(0, 10).map((decision) => {
            const winner = restaurantById(decision.result?.restaurantId);
            return (
              <Card key={`past-${decision.id}`} className="p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-primary">
                      {winner?.name ??
                        (decision.status === 'closed'
                          ? 'Closed without a pick'
                          : 'No selection')}
                    </p>
                    <p className="text-sm text-tertiary">
                      {decision.method === 'tiered'
                        ? 'Tiered Choice'
                        : 'Random Selection'}{' '}
                      · {new Date(decision.visitDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                    style={{
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {decision.status}
                  </span>
                </div>
                {decision.method === 'tiered' && decision.voteBreakdown && (
                  <VoteBreakdown
                    breakdown={decision.voteBreakdown}
                    restaurants={restaurants || []}
                    winnerId={decision.result?.restaurantId}
                  />
                )}
              </Card>
            );
          })}
        </section>
      )}

      {/* Create Decision Modal */}
      <Modal
        isOpen={showCreateDecision}
        onClose={() => setShowCreateDecision(false)}
        title="Start Group Decision"
      >
        <div className="space-y-4">
          <DatePicker
            id="visit-date"
            label="Visit Date"
            value={visitDate}
            onChange={setVisitDate}
            required
            placeholder="Select date and time for your visit"
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-primary">
              Decision Method
            </label>
            <div className="space-y-2">
              <Button
                onClick={() => handleCreateDecision('tiered')}
                className="w-full"
                disabled={createDecisionMutation.isPending}
              >
                Tiered Choice (Voting)
              </Button>
              <Button
                onClick={() => handleCreateDecision('random')}
                variant="outline"
                className="w-full"
                disabled={randomSelectMutation.isPending}
              >
                Random Selection
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Decision Result Modal */}
      {showDecisionResult && decisionResult && (
        <DecisionResultModal
          isOpen={showDecisionResult}
          onClose={() => setShowDecisionResult(false)}
          selectedRestaurant={decisionResult.restaurant}
          reasoning={decisionResult.reasoning}
          visitDate={decisionResult.visitDate}
          onConfirmVisit={() => setShowDecisionResult(false)}
          onTryAgain={() => setShowDecisionResult(false)}
        />
      )}

      {/* Close Decision Confirmation Modal */}
      <Modal
        isOpen={showCloseConfirmation}
        onClose={() => {
          setShowCloseConfirmation(false);
          setDecisionToClose(null);
        }}
        title="Close Decision?"
      >
        <div className="space-y-4">
          <p className="text-secondary">
            Are you sure you want to close this decision? This will end voting
            without selecting a restaurant.
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setShowCloseConfirmation(false);
                setDecisionToClose(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCloseDecision}
              className="border-destructive text-destructive"
              variant="outline"
            >
              Close Decision
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
