'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Collection, Restaurant } from '@/types/database';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RestaurantSearchPage } from './RestaurantSearchPage';
import { CollectionRestaurantsList } from './CollectionRestaurantsList';
import { RestaurantManagementModal } from './RestaurantManagementModal';
import { RestaurantDetailsView } from './RestaurantDetailsView';
import { DecisionResultModal } from './DecisionResultModal';
import { DecisionStatistics } from './DecisionStatistics';

interface CollectionViewProps {
  collectionId: string;
}

export function CollectionView({ collectionId }: CollectionViewProps) {
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [isMakingDecision, setIsMakingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const fetchCollection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/collections/${collectionId}`);
      const data = await response.json();

      if (data.success) {
        setCollection(data.collection);
      } else {
        setError(data.error || 'Failed to fetch collection');
      }
    } catch (err) {
      setError('Failed to fetch collection');
      console.error('Error fetching collection:', err);
    } finally {
      setIsLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    if (collectionId) {
      fetchCollection();
    }
  }, [collectionId, fetchCollection]);

  const handleRestaurantAdded = () => {
    // Refresh the collection data
    fetchCollection();
    setShowAddRestaurant(false);
  };

  const handleRestaurantUpdate = () => {
    // Refresh the collection data
    fetchCollection();
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
      await fetchCollection();
    } catch (error) {
      console.error('Error updating restaurant:', error);
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
      await fetchCollection();
    } catch (error) {
      console.error('Error removing restaurant from collection:', error);
      throw error;
    }
  };

  const handleRandomDecision = async () => {
    if (!collection || collection.restaurantIds.length === 0) {
      setDecisionError('No restaurants in this collection to choose from!');
      return;
    }

    try {
      setIsMakingDecision(true);
      setDecisionError(null);

      // Set visit date to tomorrow at 7 PM
      const visitDate = new Date();
      visitDate.setDate(visitDate.getDate() + 1);
      visitDate.setHours(19, 0, 0, 0);

      const response = await fetch('/api/decisions/random-select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionId: collectionId,
          visitDate: visitDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to make decision');
      }

      // Fetch the selected restaurant details
      const restaurantResponse = await fetch(
        `/api/restaurants/${data.result.restaurantId}`
      );
      const restaurantData = await restaurantResponse.json();

      if (!restaurantResponse.ok) {
        throw new Error('Failed to fetch restaurant details');
      }

      setDecisionResult({
        restaurant: restaurantData.restaurant,
        reasoning: data.result.reasoning,
        visitDate: visitDate,
      });
      setIsDecisionResultOpen(true);
    } catch (error) {
      console.error('Error making decision:', error);
      setDecisionError(
        `Failed to make decision: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsMakingDecision(false);
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
              <p className="text-error mb-4">{error}</p>
              <div className="space-x-2">
                <Button onClick={fetchCollection} variant="outline">
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
              disabled={isMakingDecision}
            >
              {isMakingDecision ? 'Making Decision...' : 'Decide for Me'}
            </Button>
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
        isLoading={isMakingDecision}
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
