'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback } from 'react';
import { Restaurant, Collection } from '@/types/database';
import { RestaurantCard } from './RestaurantCard';
import { RestaurantCardCompact } from './RestaurantCardCompact';
import { RestaurantManagementModal } from './RestaurantManagementModal';
import { ViewToggle, ViewType } from '@/components/ui/ViewToggle';
import { Button } from '@/components/ui/Button';

interface CollectionRestaurantsListProps {
  collection: Collection;
  onRestaurantUpdate?: () => void;
  onViewDetails?: (restaurant: Restaurant) => void;
  onManageRestaurant?: (restaurant: Restaurant) => void;
}

export function CollectionRestaurantsList({
  collection,
  onRestaurantUpdate,
  onViewDetails,
  onManageRestaurant,
}: CollectionRestaurantsListProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('list');

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/collections/${collection._id}/restaurants`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch restaurants');
      }

      setRestaurants(data.restaurants || []);
    } catch (err) {
      logger.error('Error fetching restaurants:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch restaurants'
      );
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  }, [collection._id]);

  useEffect(() => {
    if (collection._id) {
      fetchRestaurants();
    }
  }, [collection._id, fetchRestaurants]);

  const handleManageRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsManagementModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsManagementModalOpen(false);
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

      // Update local state
      setRestaurants((prev) =>
        prev.map((restaurant) =>
          restaurant._id.toString() === restaurantId
            ? ({ ...restaurant, ...updates } as Restaurant)
            : restaurant
        )
      );

      onRestaurantUpdate?.();
    } catch (error) {
      logger.error('Error updating restaurant:', error);
      throw error;
    }
  };

  const handleRemoveFromCollection = async (restaurantId: string) => {
    try {
      const response = await fetch(
        `/api/collections/${collection._id}/restaurants?restaurantId=${restaurantId}`,
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

      // Update local state
      setRestaurants((prev) =>
        prev.filter((restaurant) => restaurant._id.toString() !== restaurantId)
      );

      onRestaurantUpdate?.();
    } catch (error) {
      logger.error('Error removing restaurant from collection:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Restaurants in {collection.name}
          </h3>
          {/* View Toggle - Hidden on mobile during loading for now */}
          <div className="hidden sm:block">
            <ViewToggle currentView={viewType} onToggle={setViewType} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="animate-pulse"
              data-testid="animate-pulse"
            >
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Restaurants in {collection.name}
        </h3>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button
            onClick={fetchRestaurants}
            variant="outline"
            className="mt-2 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Restaurants in {collection.name}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}
          </span>
        </div>
        {/* View Toggle - Show on mobile and desktop */}
        <div className="flex justify-end">
          <ViewToggle currentView={viewType} onToggle={setViewType} />
        </div>
      </div>

      {restaurants.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No restaurants in this collection yet.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Search for restaurants and add them to this collection to get
            started.
          </p>
        </div>
      ) : (
        <>
          {/* List View */}
          {viewType === 'list' && (
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              {restaurants.map((restaurant) => (
                <div key={restaurant._id.toString()} className="relative group">
                  <RestaurantCard
                    restaurant={restaurant}
                    onViewDetails={() =>
                      onViewDetails?.(restaurant) ||
                      handleManageRestaurant(restaurant)
                    }
                    showAddButton={false}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {onViewDetails && (
                      <Button
                        onClick={() => onViewDetails(restaurant)}
                        size="sm"
                        variant="outline"
                        className="bg-white dark:bg-gray-800 shadow-sm"
                      >
                        View
                      </Button>
                    )}
                    <Button
                      onClick={() =>
                        onManageRestaurant?.(restaurant) ||
                        handleManageRestaurant(restaurant)
                      }
                      size="sm"
                      variant="outline"
                      className="bg-white dark:bg-gray-800 shadow-sm"
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grid View */}
          {viewType === 'grid' && (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {restaurants.map((restaurant) => (
                <RestaurantCardCompact
                  key={restaurant._id.toString()}
                  restaurant={restaurant}
                  onViewDetails={onViewDetails}
                  onManageRestaurant={
                    onManageRestaurant || handleManageRestaurant
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      <RestaurantManagementModal
        isOpen={isManagementModalOpen}
        onClose={handleCloseModal}
        restaurant={selectedRestaurant}
        collection={collection}
        onUpdateRestaurant={handleUpdateRestaurant}
        onRemoveFromCollection={handleRemoveFromCollection}
      />
    </div>
  );
}
