'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Restaurant } from '@/types/database';
import { RestaurantCard } from './RestaurantCard';
import { RestaurantCardCompact } from './RestaurantCardCompact';
import { LazyMapView } from './LazyMapView';
import { ViewToggle, ViewType } from '@/components/ui/ViewToggle';
import { Button } from '@/components/ui/Button';

interface RestaurantSearchResultsProps {
  restaurants: Restaurant[];
  isLoading?: boolean;
  onAddToCollection?: (restaurant: Restaurant) => void;
  onViewDetails?: (restaurant: Restaurant) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  searchQuery?: string;
  restaurantInCollections?: Set<string>;
}

export function RestaurantSearchResults({
  restaurants,
  isLoading = false,
  onAddToCollection,
  onViewDetails,
  onLoadMore,
  hasMore = false,
  searchQuery,
  restaurantInCollections = new Set(),
}: RestaurantSearchResultsProps) {
  const [viewType, setViewType] = useState<ViewType>('list');
  const [mapSelectedRestaurant, setMapSelectedRestaurant] =
    useState<Restaurant | null>(null);

  // Load view type from localStorage on mount
  useEffect(() => {
    const savedViewType = localStorage.getItem(
      'restaurant-search-view-type'
    ) as ViewType;
    if (savedViewType && ['list', 'grid', 'map'].includes(savedViewType)) {
      setViewType(savedViewType);
    }
  }, []);

  // Save view type to localStorage when it changes
  const handleViewTypeChange = (newViewType: ViewType) => {
    setViewType(newViewType);
    localStorage.setItem('restaurant-search-view-type', newViewType);
  };

  const handleMapRestaurantSelect = (restaurant: Restaurant) => {
    setMapSelectedRestaurant(restaurant);
    logger.debug('Restaurant selected on map:', restaurant.name);
  };

  const handleMapRestaurantDetails = (restaurant: Restaurant) => {
    if (onViewDetails) {
      onViewDetails(restaurant);
    } else if (onAddToCollection) {
      onAddToCollection(restaurant);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text">
            {searchQuery ? `Results for "${searchQuery}"` : 'Restaurants'}
          </h2>
          {/* View Toggle - Hidden during loading */}
          <div className="hidden sm:block">
            <ViewToggle
              currentView={viewType}
              onToggle={handleViewTypeChange}
            />
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-text-light">Searching for restaurants...</p>
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-text-light text-6xl mb-4">🍽️</div>
        <h3 className="text-lg font-medium text-text mb-2">
          No restaurants found
        </h3>
        <p className="text-text-light">
          {searchQuery
            ? `No restaurants found for "${searchQuery}". Try a different search term.`
            : 'Try searching for restaurants in your area.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          <h2 className="text-xl font-semibold text-text">
            {searchQuery ? `Results for "${searchQuery}"` : 'Restaurants'}
          </h2>
          <span className="text-sm text-text-light">
            {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}{' '}
            found
          </span>
        </div>
        {/* View Toggle */}
        <div className="flex justify-end">
          <ViewToggle currentView={viewType} onToggle={handleViewTypeChange} />
        </div>
      </div>

      {/* List View */}
      {viewType === 'list' && (
        <div className="space-y-4 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.googlePlaceId}
              restaurant={restaurant}
              onAddToCollection={onAddToCollection}
              onViewDetails={onViewDetails}
              isInCollection={restaurantInCollections.has(
                (restaurant._id || restaurant.googlePlaceId).toString()
              )}
            />
          ))}
        </div>
      )}

      {/* Grid View */}
      {viewType === 'grid' && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {restaurants.map((restaurant) => (
            <RestaurantCardCompact
              key={restaurant.googlePlaceId}
              restaurant={restaurant}
              onViewDetails={onViewDetails}
              onManageRestaurant={onAddToCollection}
            />
          ))}
        </div>
      )}

      {/* Map View */}
      {viewType === 'map' && (
        <div className="space-y-4">
          <LazyMapView
            restaurants={restaurants}
            onRestaurantSelect={handleMapRestaurantSelect}
            onRestaurantDetails={handleMapRestaurantDetails}
            selectedRestaurant={mapSelectedRestaurant}
            height="500px"
            className="rounded-lg overflow-hidden shadow-lg"
          />
          {mapSelectedRestaurant && (
            <div className="bg-primary/10 dark:bg-primary/20/20 border border-primary dark:border-primary rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    {mapSelectedRestaurant.name}
                  </h4>
                  <p className="text-sm text-primary dark:text-primary">
                    {mapSelectedRestaurant.address}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      handleMapRestaurantDetails(mapSelectedRestaurant)
                    }
                    size="sm"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/10 dark:border-primary dark:text-primary dark:hover:bg-primary/20/30"
                  >
                    View Details
                  </Button>
                  <Button
                    onClick={() => setMapSelectedRestaurant(null)}
                    size="sm"
                    variant="outline"
                    className="text-primary hover:bg-primary/10 dark:text-primary dark:hover:bg-primary/20/30"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="text-center pt-6">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load More Restaurants'}
          </Button>
        </div>
      )}
    </div>
  );
}
