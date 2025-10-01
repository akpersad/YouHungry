'use client';

import { logger } from '@/lib/logger';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Restaurant } from '@/types/database';
import { useCollection, useRandomDecision, useGroup } from '@/hooks/api';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RestaurantSearchPage } from './RestaurantSearchPage';
import { CollectionRestaurantsList } from './CollectionRestaurantsList';
import { RestaurantManagementModal } from './RestaurantManagementModal';
import { RestaurantDetailsView } from './RestaurantDetailsView';
import { DecisionResultModal } from './DecisionResultModal';
import { DecisionStatistics } from './DecisionStatistics';
import { GroupDecisionMaking } from './GroupDecisionMaking';

interface CollectionViewProps {
  collectionId: string;
}

export function CollectionView({ collectionId }: CollectionViewProps) {
  const router = useRouter();
  const { user } = useUser();
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDecisionResultOpen, setIsDecisionResultOpen] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [decisionResult, setDecisionResult] = useState<{
    restaurant: Restaurant;
    reasoning: string;
    visitDate: Date;
  } | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  // Use TanStack Query hooks
  const {
    data: collection,
    isLoading,
    error,
    refetch,
  } = useCollection(collectionId);

  // Get group data if this is a group collection
  const { data: groupData, isLoading: groupLoading } = useGroup(
    collection?.type === 'group' ? collection.ownerId.toString() : ''
  );

  const randomDecisionMutation = useRandomDecision();

  // Get current user's database ID for admin check
  const { data: currentUserData } = useQuery({
    queryKey: ['currentUser', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/user/current`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.user;
    },
    enabled: !!user?.id,
  });

  // Check if current user is admin of the group
  const isCurrentUserAdmin =
    groupData?.adminIds?.some(
      (adminId) => adminId.toString() === currentUserData?._id?.toString()
    ) || false;

  // Debug logging
  logger.debug('Collection type:', collection?.type);
  logger.debug('Group data:', groupData);
  logger.debug('Current user ID (Clerk):', user?.id);
  logger.debug('Current user data (DB):', currentUserData);
  logger.debug(
    'Admin IDs:',
    groupData?.adminIds?.map((id) => id.toString())
  );
  logger.debug('Is current user admin:', isCurrentUserAdmin);

  const handleRestaurantAdded = () => {
    // TanStack Query will automatically refetch the collection data
    setShowAddRestaurant(false);
  };

  const handleRestaurantUpdate = () => {
    // TanStack Query will automatically refetch the collection data
    // No manual refetch needed
  };

  const handleViewDetails = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsDetailsModalOpen(true);
  };

  const handleManageRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsManagementModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsManagementModalOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedRestaurant(null);
  };

  const handleUpdateRestaurant = async (
    restaurantId: string,
    updates: { priceRange?: string; timeToPickUp?: number }
  ) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update restaurant');
      }

      // Refresh collection data
      // TanStack Query will automatically refetch
    } catch (error) {
      logger.error('Error updating restaurant:', error);
      throw error;
    }
  };

  const handleRemoveFromCollection = async (restaurantId: string) => {
    try {
      const response = await fetch(
        `/api/collections/${collectionId}/restaurants?restaurantId=${restaurantId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to remove restaurant from collection'
        );
      }

      // Refresh collection data
      // TanStack Query will automatically refetch
    } catch (error) {
      logger.error('Error removing restaurant from collection:', error);
      throw error;
    }
  };

  const handleRandomDecision = async () => {
    if (!collection || collection.restaurantIds.length === 0) {
      setDecisionError('No restaurants in this collection to choose from!');
      return;
    }

    setDecisionError(null);

    // Set visit date to tomorrow at 7 PM
    const visitDate = new Date();
    visitDate.setDate(visitDate.getDate() + 1);
    visitDate.setHours(19, 0, 0, 0);

    try {
      const result = await randomDecisionMutation.mutateAsync({
        collectionId: collectionId,
        visitDate: visitDate.toISOString(),
      });

      // Fetch the selected restaurant details using the hook
      const restaurantResponse = await fetch(
        `/api/restaurants/${result.result.restaurantId}`
      );
      const restaurantData = await restaurantResponse.json();

      if (!restaurantResponse.ok) {
        throw new Error('Failed to fetch restaurant details');
      }

      setDecisionResult({
        restaurant: restaurantData.restaurant,
        reasoning: result.result.reasoning,
        visitDate: visitDate,
      });
      setIsDecisionResultOpen(true);
    } catch (error) {
      logger.error('Error making decision:', error);
      setDecisionError(
        `Failed to make decision: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleConfirmVisit = async () => {
    // Here you could add logic to confirm the visit, send notifications, etc.
    // For now, just close the modal - success feedback could be shown in a toast or banner
    setIsDecisionResultOpen(false);
    setDecisionResult(null);
  };

  const handleTryAgain = () => {
    setIsDecisionResultOpen(false);
    setDecisionResult(null);
    handleRandomDecision();
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-8">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
            role="status"
            aria-label="Loading collection"
          ></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-error mb-4">
                {error instanceof Error
                  ? error.message
                  : 'Failed to fetch collection'}
              </p>
              <div className="space-x-2">
                <Button onClick={() => refetch()} variant="outline">
                  Try Again
                </Button>
                <Button onClick={() => router.back()} variant="outline">
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-text-muted mb-4">Collection not found</p>
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-text-light">{collection.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => router.back()} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-text-muted">
          <span>{collection.restaurantIds.length} restaurants</span>
          <span>•</span>
          <span>
            Created {new Date(collection.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button onClick={() => setShowAddRestaurant(true)}>
          Add Restaurant
        </Button>
        {collection.restaurantIds.length > 0 && (
          <>
            <Button
              onClick={handleRandomDecision}
              variant="outline"
              disabled={randomDecisionMutation.isPending}
            >
              {randomDecisionMutation.isPending
                ? 'Making Decision...'
                : 'Decide for Me'}
            </Button>
            {collection.type === 'group' && isCurrentUserAdmin && (
              <Button
                onClick={() => {
                  // Scroll to group decision section and trigger start decision
                  const groupDecisionSection = document.getElementById(
                    'group-decision-section'
                  );
                  if (groupDecisionSection) {
                    groupDecisionSection.scrollIntoView({ behavior: 'smooth' });
                    // Trigger the start decision modal
                    setTimeout(() => {
                      const startButton = groupDecisionSection.querySelector(
                        '[data-start-decision]'
                      ) as HTMLButtonElement;
                      if (startButton) {
                        startButton.click();
                      }
                    }, 500);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start Group Decision
              </Button>
            )}
            <Button onClick={() => setIsStatisticsOpen(true)} variant="outline">
              View Statistics
            </Button>
          </>
        )}
      </div>

      {/* Decision Error Display */}
      {decisionError && (
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-red-600">⚠️</div>
                  <div>
                    <p className="font-medium text-red-900">Decision Error</p>
                    <p className="text-red-700 text-sm">{decisionError}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setDecisionError(null)}
                  variant="outline"
                  size="sm"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Restaurants List */}
      <CollectionRestaurantsList
        collection={collection}
        onRestaurantUpdate={handleRestaurantUpdate}
        onViewDetails={handleViewDetails}
        onManageRestaurant={handleManageRestaurant}
      />

      {/* Group Decision Making - Only show for group collections */}
      {collection.type === 'group' && !groupLoading && (
        <div id="group-decision-section" className="mt-8">
          <GroupDecisionMaking
            groupId={collection.ownerId.toString()}
            collectionId={collectionId}
            isAdmin={isCurrentUserAdmin}
          />
        </div>
      )}

      {/* Add Restaurant Modal */}
      <Modal
        isOpen={showAddRestaurant}
        onClose={() => setShowAddRestaurant(false)}
        title="Add Restaurant to Collection"
      >
        <RestaurantSearchPage
          onAddToCollection={handleRestaurantAdded}
          collections={[
            { _id: collection._id.toString(), name: collection.name },
          ]}
        />
      </Modal>

      {/* Restaurant Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseModals}
        title={selectedRestaurant?.name || 'Restaurant Details'}
      >
        {selectedRestaurant && (
          <RestaurantDetailsView
            restaurant={selectedRestaurant}
            onManage={() => {
              setIsDetailsModalOpen(false);
              setIsManagementModalOpen(true);
            }}
            showManageButton={true}
          />
        )}
      </Modal>

      {/* Restaurant Management Modal */}
      <Modal
        isOpen={isManagementModalOpen}
        onClose={handleCloseModals}
        title={`Manage ${selectedRestaurant?.name || 'Restaurant'}`}
      >
        {selectedRestaurant && (
          <RestaurantManagementModal
            isOpen={isManagementModalOpen}
            restaurant={selectedRestaurant}
            collection={collection}
            onUpdateRestaurant={handleUpdateRestaurant}
            onRemoveFromCollection={handleRemoveFromCollection}
            onClose={handleCloseModals}
          />
        )}
      </Modal>

      {/* Decision Result Modal */}
      <DecisionResultModal
        isOpen={isDecisionResultOpen}
        onClose={() => setIsDecisionResultOpen(false)}
        selectedRestaurant={decisionResult?.restaurant || null}
        reasoning={decisionResult?.reasoning || ''}
        visitDate={decisionResult?.visitDate || new Date()}
        onConfirmVisit={handleConfirmVisit}
        onTryAgain={handleTryAgain}
        isLoading={randomDecisionMutation.isPending}
      />

      {/* Decision Statistics Modal */}
      <Modal
        isOpen={isStatisticsOpen}
        onClose={() => setIsStatisticsOpen(false)}
        title="Decision Statistics"
      >
        <DecisionStatistics
          collectionId={collectionId}
          onClose={() => setIsStatisticsOpen(false)}
        />
      </Modal>
    </div>
  );
}
