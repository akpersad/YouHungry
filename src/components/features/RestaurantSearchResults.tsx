'use client';

import { logger } from '@/lib/logger';
import { useState } from 'react';
import { Restaurant } from '@/types/database';
import { RestaurantCard } from './RestaurantCard';
import { RestaurantCardCompact } from './RestaurantCardCompact';
import { LazyMapView } from './LazyMapView';
import { ViewToggle, ViewType } from '@/components/ui/ViewToggle';
import { Button } from '@/components/ui/Button';
import {
  RestaurantCardSkeleton,
  SkeletonGroup,
} from '@/components/ui/Skeleton';
import { SortOption } from './RestaurantSearchPage';
import { normalizeRestaurantId } from '@/lib/utils';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'distance-asc', label: 'Distance (closest first)' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'price-asc', label: 'Price ($ to $$$$)' },
  { value: 'price-desc', label: 'Price ($$$$ to $)' },
];

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
  // Load view type from localStorage on mount (lazy initializer instead of
  // a setState-in-effect)
  const [viewType, setViewType] = useState<ViewType>(() => {
    if (typeof window === 'undefined') return 'list';
    const savedViewType = localStorage.getItem(
      'restaurant-search-view-type'
    ) as ViewType;
    return savedViewType && ['list', 'grid', 'map'].includes(savedViewType)
      ? savedViewType
      : 'list';
  });
  const [mapSelectedRestaurant, setMapSelectedRestaurant] =
    useState<Restaurant | null>(null);

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

  // Persistent sort affordance — rendered while loading and alongside results
  // so the control no longer pops in only after the first page arrives.
  const sortControl = onSortChange ? (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-ink-secondary">
        Sort by:
      </label>
      <select
        id="sort"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        disabled={isLoading}
        className="input-base shadow-subtle py-2 px-3 text-sm disabled:opacity-60"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ) : null;

  if (isLoading) {
    const skeletonCount = viewType === 'grid' ? 8 : 6;
    const skeletonGridClass =
      viewType === 'grid'
        ? 'grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        : 'space-y-4 md:grid md:grid-cols-3 md:gap-4 md:space-y-0';

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-xl font-semibold text-ink">
              {searchQuery ? `Results for "${searchQuery}"` : 'Restaurants'}
            </h2>
            <div className="hidden sm:flex justify-end">
              <ViewToggle
                currentView={viewType}
                onToggle={handleViewTypeChange}
              />
            </div>
          </div>
          {sortControl && <div className="flex justify-end">{sortControl}</div>}
        </div>

        <SkeletonGroup
          label="Searching for restaurants"
          className={skeletonGridClass}
        >
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <RestaurantCardSkeleton key={index} />
          ))}
        </SkeletonGroup>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-ink-secondary text-6xl mb-4">🍽️</div>
        <h3 className="text-lg font-medium text-ink mb-2">
          No restaurants found
        </h3>
        <p className="text-ink-secondary">
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
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <h2 className="text-xl font-semibold text-ink">
              {searchQuery ? `Results for "${searchQuery}"` : 'Restaurants'}
            </h2>
            <span className="text-sm text-ink-secondary">
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
        {sortControl && <div className="flex justify-end">{sortControl}</div>}
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
                normalizeRestaurantId(restaurant) ?? ''
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
            <div className="bg-tomato/10 border border-tomato/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-ink">
                    {mapSelectedRestaurant.name}
                  </h4>
                  <p className="text-sm text-ink-secondary">
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
                    className="border-tomato text-tomato hover:bg-tomato/10"
                  >
                    View Details
                  </Button>
                  <Button
                    onClick={() => setMapSelectedRestaurant(null)}
                    size="sm"
                    variant="outline"
                    className="text-tomato hover:bg-tomato/10"
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
        <div className="flex flex-col gap-4 pt-6 border-t border-border">
          <div className="text-sm text-ink-secondary text-center">
            Page {currentPage} of {totalPages}
          </div>

          {/* Mobile-first pagination */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 max-w-full overflow-x-auto">
            {/* First and Previous buttons - hidden on very small screens */}
            <div className="hidden sm:flex gap-1 sm:gap-2">
              <Button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                First
              </Button>
              <Button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                Previous
              </Button>
            </div>

            {/* Page Numbers */}
            <div className="flex gap-1 items-center">
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
                      className={`min-w-[2rem] sm:min-w-[2.5rem] text-xs sm:text-sm px-2 sm:px-3 ${
                        currentPage === pageNum
                          ? 'bg-bg !text-white border-tomato'
                          : 'bg-transparent text-ink hover:bg-tomato hover:text-white hover:border-tomato'
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
                    <span
                      key={pageNum}
                      className="px-1 sm:px-2 py-1 text-xs sm:text-sm text-ink-secondary"
                    >
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            {/* Next and Last buttons - hidden on very small screens */}
            <div className="hidden sm:flex gap-1 sm:gap-2">
              <Button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                Next
              </Button>
              <Button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                Last
              </Button>
            </div>
          </div>

          {/* Mobile navigation buttons for very small screens */}
          <div className="flex justify-between sm:hidden gap-2">
            <Button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              ← Previous
            </Button>
            <Button
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
