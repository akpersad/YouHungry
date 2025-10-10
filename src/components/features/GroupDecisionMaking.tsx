'use client';

import { logger } from '@/lib/logger';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { DecisionResultModal } from './DecisionResultModal';
import { useGroupDecisionSubscription } from '@/hooks/api/useGroupDecisionSubscription';
import { Restaurant as DatabaseRestaurant } from '@/types/database';
import { toast } from 'sonner';

interface GroupDecisionMakingProps {
  groupId: string;
  collectionId: string;
  isAdmin: boolean;
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
  result?: {
    restaurantId: string;
    selectedAt: string;
    reasoning: string;
  };
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

export function GroupDecisionMaking({
  groupId,
  collectionId,
  isAdmin,
}: GroupDecisionMakingProps) {
  const { user } = useUser();
  const [showCreateDecision, setShowCreateDecision] = useState(false);
  const [showVotingInterface, setShowVotingInterface] = useState(false);
  const [selectedDecision, setSelectedDecision] =
    useState<GroupDecision | null>(null);
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

  // Use real-time subscription for group decisions
  const {
    decisions,
    isConnected,
    error: subscriptionError,
    reconnect,
  } = useGroupDecisionSubscription(groupId, undefined, true); // Re-enable subscription

  // Fallback to regular query if subscription fails or is disabled
  const { data: fallbackDecisions, isLoading: decisionsLoading } = useQuery({
    queryKey: ['groupDecisions', groupId],
    queryFn: async () => {
      const response = await fetch(`/api/decisions/group?groupId=${groupId}`);
      if (!response.ok) throw new Error('Failed to fetch group decisions');
      const data = await response.json();
      return data.decisions as GroupDecision[];
    },
    enabled: !isConnected || !!subscriptionError, // Use fallback if subscription is disabled or failed
  });

  // Use subscription data if available, otherwise fallback to query data
  const currentDecisions =
    decisions.length > 0 ? decisions : fallbackDecisions || [];

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

      // If it's a tiered decision, open the voting interface
      if (data.decision) {
        setSelectedDecision(data.decision);
        setShowVotingInterface(true);
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
      setShowVotingInterface(false);
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

    // Convert datetime-local value to ISO string
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

  const handleVote = () => {
    if (!selectedDecision || rankings.length === 0) {
      toast.error('Please select at least one restaurant');
      return;
    }

    // Use id property from API response
    const decisionId = selectedDecision.id;

    if (!decisionId) {
      logger.error('Selected decision has no ID!');
      toast.error('Error: Decision ID is missing. Please try again.');
      return;
    }

    submitVoteMutation.mutate({
      decisionId: decisionId,
      rankings,
    });
  };

  const handleCompleteDecision = (decision: GroupDecision) => {
    const decisionId = decision.id;
    completeDecisionMutation.mutate(decisionId);
  };

  const handleCloseDecision = (decision: GroupDecision) => {
    setDecisionToClose(decision);
    setShowCloseConfirmation(true);
  };

  const confirmCloseDecision = () => {
    if (decisionToClose) {
      const decisionId = decisionToClose.id;
      closeDecisionMutation.mutate(decisionId);
    }
    setShowCloseConfirmation(false);
    setDecisionToClose(null);
  };

  const handleRankRestaurant = (restaurantId: string) => {
    if (rankings.includes(restaurantId)) {
      setRankings(rankings.filter((id) => id !== restaurantId));
    } else if (rankings.length < 3) {
      setRankings([...rankings, restaurantId]);
    } else {
      toast.warning('You can only rank up to 3 restaurants');
    }
  };

  // Drag and drop handlers for reordering within rankings
  const handleDragStart = (e: React.DragEvent, restaurantId: string) => {
    // Only allow dragging if the item is already in rankings
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
      // Remove the item from its current position
      newRankings.splice(draggedIndex, 1);
      // Insert it at the new position
      newRankings.splice(targetIndex, 0, draggedItem);
      setRankings(newRankings);
    }

    setDraggedItem(null);
  };

  const handleRemoveFromRankings = (restaurantId: string) => {
    setRankings(rankings.filter((id) => id !== restaurantId));
  };

  const getVoteStatus = (decision: GroupDecision) => {
    if (!currentUserData?._id) return 'Not Voted';

    const userVote = decision.votes?.find(
      (vote) => vote.userId === currentUserData._id.toString()
    );
    if (userVote) {
      return userVote.hasRankings ? 'Voted' : 'Vote Submitted';
    }
    return 'Not Voted';
  };

  const hasUserVoted = (decision: GroupDecision) => {
    if (!currentUserData?._id) return false;

    const userVote = decision.votes?.find(
      (vote) => vote.userId === currentUserData._id.toString()
    );
    return !!userVote;
  };

  const canCompleteDecision = (decision: GroupDecision) => {
    return (
      isAdmin &&
      decision.method === 'tiered' &&
      decision.status === 'active' &&
      decision.votes &&
      decision.votes.length > 0
    );
  };

  const canCloseDecision = (decision: GroupDecision) => {
    return isAdmin && decision.status === 'active';
  };

  // Helper function to filter decisions for the main display
  const getVisibleDecisions = (decisions: GroupDecision[]) => {
    return decisions.filter((d) => {
      if (d.status === 'active') return true;
      if (d.status === 'completed') {
        // Only show completed decisions within 24 hours of visit date
        const visitDate = new Date(d.visitDate);
        const now = new Date();
        const hoursSinceVisit =
          (now.getTime() - visitDate.getTime()) / (1000 * 60 * 60);
        return hoursSinceVisit <= 24;
      }
      // Don't show closed decisions
      return false;
    });
  };

  if (decisionsLoading || restaurantsLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-text-light">Loading decisions...</div>
      </div>
    );
  }

  // Show connection status
  const connectionStatus = isConnected ? 'Connected' : 'Disconnected';
  const connectionColor = isConnected ? 'text-success' : 'text-destructive';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Group Decisions</h2>
          <div className="flex items-center space-x-2 mt-1">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span className={`text-sm ${connectionColor}`}>
              {connectionStatus}
            </span>
            {subscriptionError && (
              <Button
                onClick={reconnect}
                size="sm"
                className="text-xs bg-surface hover:bg-surface"
              >
                Reconnect
              </Button>
            )}
          </div>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowCreateDecision(true)}
            className="bg-blue-600 hover:bg-blue-700"
            data-start-decision
          >
            Start Decision
          </Button>
        )}
      </div>

      {/* Active and Recently Completed Decisions */}
      <div className="space-y-4">
        {getVisibleDecisions(currentDecisions || []).map((decision, index) => (
          <Card
            key={`group-decision-making-${decision.id || index}`}
            className="p-6"
          >
            {decision.status === 'completed' ? (
              // Completed Decision Display
              <div className="bg-success/10 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-success"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">
                      Decision Completed!
                    </h3>
                    <p className="text-sm text-green-700">
                      {decision.method === 'tiered'
                        ? 'Tiered Choice'
                        : 'Random Selection'}{' '}
                      •{new Date(decision.visitDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {decision.result && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="font-medium text-text mb-2">
                      Selected Restaurant:
                    </p>
                    {(() => {
                      const restaurant = restaurants?.find(
                        (r) => r._id === decision.result?.restaurantId
                      );
                      return restaurant ? (
                        <div className="space-y-1">
                          <p className="text-lg font-semibold text-text">
                            {restaurant.name}
                          </p>
                          {restaurant.address && (
                            <p className="text-sm text-text-light">
                              📍 {restaurant.address}
                            </p>
                          )}
                          {restaurant.phoneNumber && (
                            <p className="text-sm text-text-light">
                              📞 {restaurant.phoneNumber}
                            </p>
                          )}
                          {restaurant.rating && (
                            <p className="text-sm text-text-light">
                              ⭐ {restaurant.rating}/5
                            </p>
                          )}
                          {restaurant.priceRange && (
                            <p className="text-sm text-text-light">
                              💰 {restaurant.priceRange}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-text">Restaurant not found</p>
                      );
                    })()}
                    {decision.result.reasoning && (
                      <p className="text-sm text-text-light mt-3 pt-2 border-t">
                        <span className="font-medium">Reasoning:</span>{' '}
                        {decision.result.reasoning}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Active Decision Display
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-text">
                      {decision.method === 'tiered'
                        ? 'Tiered Choice'
                        : 'Random Selection'}
                    </h3>
                    {hasUserVoted(decision) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-green-800">
                        ✓ You&apos;ve Voted
                      </span>
                    )}
                  </div>
                  <p className="text-text-light">
                    Visit Date:{' '}
                    {new Date(decision.visitDate).toLocaleDateString()}
                  </p>
                  <p className="text-text-light">
                    Deadline: {new Date(decision.deadline).toLocaleString()}
                  </p>
                  <p className="text-sm text-text-light">
                    Status: {getVoteStatus(decision)}
                  </p>
                  {decision.votes && (
                    <p className="text-sm text-text-light">
                      Votes: {decision.votes.length} /{' '}
                      {decision.participants.length}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {decision.method === 'tiered' &&
                    decision.status === 'active' && (
                      <Button
                        key={`vote-${decision.id || index}`}
                        onClick={() => {
                          setSelectedDecision(decision);
                          setShowVotingInterface(true);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {hasUserVoted(decision) ? 'Re-vote' : 'Vote'}
                      </Button>
                    )}
                  {canCompleteDecision(decision) && (
                    <Button
                      key={`complete-${decision.id || index}`}
                      onClick={() => handleCompleteDecision(decision)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Complete
                    </Button>
                  )}
                  {canCloseDecision(decision) && (
                    <Button
                      key={`close-${decision.id || index}`}
                      onClick={() => handleCloseDecision(decision)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}

        {getVisibleDecisions(currentDecisions || []).length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-text-light">No active or recent decisions</p>
          </Card>
        )}
      </div>

      {/* Create Decision Modal */}
      <Modal
        isOpen={showCreateDecision}
        onClose={() => setShowCreateDecision(false)}
        title="Start Group Decision"
      >
        <div className="space-y-4">
          <div>
            <DatePicker
              id="visit-date"
              label="Visit Date"
              value={visitDate}
              onChange={setVisitDate}
              required
              placeholder="Select date and time for your visit"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Decision Method
            </label>
            <div className="space-y-2">
              <Button
                onClick={() => handleCreateDecision('tiered')}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={createDecisionMutation.isPending}
              >
                Tiered Choice (Voting)
              </Button>
              <Button
                onClick={() => handleCreateDecision('random')}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={randomSelectMutation.isPending}
              >
                Random Selection
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Voting Interface Modal */}
      <Modal
        isOpen={showVotingInterface}
        onClose={() => setShowVotingInterface(false)}
        title="Rank Your Preferences"
      >
        <div className="space-y-4">
          {selectedDecision && hasUserVoted(selectedDecision) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">
                    You&apos;ve already voted in this decision. Your new vote
                    will replace your previous vote.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-primary/10 border border-primary rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How to vote:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Click on up to 3 restaurants you want to vote for</li>
              <li>
                2. Drag and drop to reorder them by preference (1st, 2nd, 3rd
                choice)
              </li>
              <li>3. Submit your vote when ready</li>
            </ol>
          </div>

          {/* Rankings Display */}
          {rankings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-text">
                Your Rankings ({rankings.length}/3):
              </h4>
              <div className="space-y-2">
                {rankings.map((restaurantId, index) => {
                  const restaurant = restaurants?.find(
                    (r) => r._id === restaurantId
                  );
                  if (!restaurant) return null;

                  return (
                    <div
                      key={`ranking-${restaurantId}`}
                      className={`p-3 border-2 border-primary bg-primary/10 rounded-lg cursor-move transition-all hover:shadow-md ${
                        draggedItem === restaurantId ? 'opacity-50' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, restaurantId)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-text">
                              {restaurant.name}
                            </h4>
                            <p className="text-sm text-text-light">
                              {restaurant.cuisine}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFromRankings(restaurantId)}
                          className="text-destructive hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-destructive/10"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Restaurants */}
          <div className="space-y-2">
            <h4 className="font-medium text-text">
              Click to Select Restaurants ({rankings.length}/3 selected):
            </h4>
            {restaurants?.map((restaurant) => {
              const isSelected = rankings.includes(restaurant._id);
              const canSelect = !isSelected && rankings.length < 3;

              return (
                <div
                  key={restaurant._id}
                  className={`p-3 border rounded-lg transition-all ${
                    isSelected
                      ? 'border-success bg-success/10 cursor-not-allowed'
                      : canSelect
                        ? 'border-border hover:border-success hover:bg-success/10 cursor-pointer'
                        : 'border-border bg-surface cursor-not-allowed opacity-50'
                  }`}
                  onClick={() =>
                    canSelect && handleRankRestaurant(restaurant._id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                          isSelected
                            ? 'bg-green-500 text-white'
                            : canSelect
                              ? 'border-2 border-border'
                              : 'bg-surface'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>
                      <div>
                        <h4 className="font-medium text-text">
                          {restaurant.name}
                        </h4>
                        <p className="text-sm text-text-light">
                          {restaurant.cuisine}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-text">
                        ⭐ {restaurant.rating}
                      </p>
                      {restaurant.priceRange && (
                        <p className="text-sm text-text-light">
                          {restaurant.priceRange}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setShowVotingInterface(false)}
              className="bg-surface hover:bg-surface"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVote}
              disabled={rankings.length === 0 || submitVoteMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {selectedDecision && hasUserVoted(selectedDecision)
                ? 'Update Vote'
                : 'Submit Vote'}
            </Button>
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
          <p className="text-text">
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
              className="bg-red-600 hover:bg-red-700"
            >
              Close Decision
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
