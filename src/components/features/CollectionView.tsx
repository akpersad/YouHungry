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

  const handleRandomDecision = () => {
    if (!collection || collection.restaurantIds.length === 0) {
      alert('No restaurants in this collection to choose from!');
      return;
    }

    // Simple random selection for now
    const randomIndex = Math.floor(
      Math.random() * collection.restaurantIds.length
    );
    // const randomRestaurantId = collection.restaurantIds[randomIndex];

    // Find the restaurant in the current collection data
    // For now, we'll just show an alert - in a real implementation,
    // we'd fetch the restaurant details and show a proper result modal
    alert(
      `Random selection: Restaurant at index ${randomIndex + 1} of ${collection.restaurantIds.length} restaurants`
    );
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
          <Button onClick={handleRandomDecision} variant="outline">
            Decide for Me
          </Button>
        )}
      </div>

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
    </div>
  );
}
