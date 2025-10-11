'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Restaurant } from '@/types/database';
import { RestaurantCard } from './RestaurantCard';
import { RestaurantCardCompact } from './RestaurantCardCompact';
import { LazyMapView } from './LazyMapView';
import { ViewToggle, ViewType } from '@/components/ui/ViewToggle';
import { Button } from '@/components/ui/Button';
import { SortOption } from './RestaurantSearchPage';

interface RestaurantSearchResultsProps {
  restaurants: Restaurant[];
  isLoading?: boolean;
  onAddToCollection?: (restaurant: Restaurant) => void;
  onViewDetails?: (restaurant: Restaurant) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  searchQuery?: string;
  restaurantInCollections?: Set<string>;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalResults?: number;
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
  sortBy = 'distance-asc',
  onSortChange,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalResults = 0,
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

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'distance-asc', label: 'Distance (closest first)' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'price-asc', label: 'Price ($ to $$$$)' },
    { value: 'price-desc', label: 'Price ($$$$ to $)' },
  ];

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <h2 className="text-xl font-semibold text-text">
              {searchQuery ? `Results for "${searchQuery}"` : 'Restaurants'}
            </h2>
            <span className="text-sm text-text-light">
              {totalResults} restaurant{totalResults !== 1 ? 's' : ''}{' '}
              {totalResults !== restaurants.length &&
                `(showing ${restaurants.length})`}
            </span>
          </div>
          {/* View Toggle */}
          <div className="flex justify-end">
            <ViewToggle
              currentView={viewType}
              onToggle={handleViewTypeChange}
            />
          </div>
        </div>

        {/* Sort Dropdown */}
        {onSortChange && restaurants.length > 0 && (
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-text-light">
                Sort by:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="input-base shadow-neumorphic-light dark:shadow-neumorphic-dark py-2 px-3 text-sm"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
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
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-text">
                    {mapSelectedRestaurant.name}
                  </h4>
                  <p className="text-sm text-text-secondary">
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
                    className="border-accent text-accent hover:bg-accent/10"
                  >
                    View Details
                  </Button>
                  <Button
                    onClick={() => setMapSelectedRestaurant(null)}
                    size="sm"
                    variant="outline"
                    className="text-accent hover:bg-accent/10"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Load More Button (legacy) */}
      {hasMore && onLoadMore && !onPageChange && (
        <div className="text-center pt-6">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load More Restaurants'}
          </Button>
        </div>
      )}

      {/* Pagination Controls */}
      {onPageChange && totalPages > 1 && restaurants.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
          <div className="text-sm text-text-light">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              First
            </Button>
            <Button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>

            {/* Page Numbers */}
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      variant={currentPage === pageNum ? 'primary' : 'outline'}
                      size="sm"
                      className={`min-w-[2.5rem] ${
                        currentPage === pageNum ? 'bg-primary text-white' : ''
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                } else if (
                  (pageNum === currentPage - 2 && currentPage > 3) ||
                  (pageNum === currentPage + 2 && currentPage < totalPages - 2)
                ) {
                  return (
                    <span key={pageNum} className="px-2 py-1">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <Button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
            <Button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
