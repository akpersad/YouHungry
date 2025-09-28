'use client';

import { Restaurant } from '@/types/database';
import { RestaurantCard } from './RestaurantCard';
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
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Searching for restaurants...</p>
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">🍽️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No restaurants found
        </h3>
        <p className="text-gray-600">
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {searchQuery ? `Results for "${searchQuery}"` : 'Restaurants'}
        </h2>
        <span className="text-sm text-gray-600">
          {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}{' '}
          found
        </span>
      </div>

      {/* Restaurant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
