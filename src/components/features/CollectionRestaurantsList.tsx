'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Restaurant, Collection } from '@/types/database';
import { RestaurantCard } from './RestaurantCard';
import { RestaurantCardCompact } from './RestaurantCardCompact';
import { RestaurantManagementModal } from './RestaurantManagementModal';
import { LazyMapView } from './LazyMapView';
import { ViewToggle, ViewType } from '@/components/ui/ViewToggle';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';

type SortOption = 'rating-desc' | 'name-asc' | 'name-desc';

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
  const [mapSelectedRestaurant, setMapSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('rating-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load view type from localStorage on mount
  useEffect(() => {
    const savedViewType = localStorage.getItem(
      'collection-view-type'
    ) as ViewType;
    if (savedViewType && ['list', 'grid', 'map'].includes(savedViewType)) {
      setViewType(savedViewType);
    }
  }, []);

  // Save view type to localStorage when it changes
  const handleViewTypeChange = (newViewType: ViewType) => {
    setViewType(newViewType);
    localStorage.setItem('collection-view-type', newViewType);
  };

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

  const handleMapRestaurantSelect = (restaurant: Restaurant) => {
    setMapSelectedRestaurant(restaurant);
    logger.debug('Restaurant selected on map:', restaurant.name);
  };

  const handleMapRestaurantDetails = (restaurant: Restaurant) => {
    if (onViewDetails) {
      onViewDetails(restaurant);
    } else {
      handleManageRestaurant(restaurant);
    }
  };

  // Sort and paginate restaurants
  const sortedRestaurants = useMemo(() => {
    const sorted = [...restaurants];

    switch (sortBy) {
      case 'rating-desc':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return sorted;
  }, [restaurants, sortBy]);

  const paginatedRestaurants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedRestaurants.slice(startIndex, endIndex);
  }, [sortedRestaurants, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedRestaurants.length / itemsPerPage);

  // Reset to page 1 when sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">
            Restaurants in {collection.name}
          </h3>
          {/* View Toggle - Hidden on mobile during loading for now */}
          <div className="hidden sm:block">
            <ViewToggle
              currentView={viewType}
              onToggle={handleViewTypeChange}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="animate-pulse"
              data-testid="animate-pulse"
            >
              <div className="bg-quaternary dark:bg-surface rounded-lg h-48"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">
          Restaurants in {collection.name}
        </h3>
        <div className="bg-destructive/10 dark:bg-destructive/20/20 border border-destructive dark:border-destructive rounded-md p-4">
          <p className="text-destructive dark:text-destructive">{error}</p>
          <Button
            onClick={fetchRestaurants}
            variant="outline"
            className="mt-2 text-destructive border-destructive hover:bg-destructive/10 dark:text-destructive dark:border-destructive dark:hover:bg-destructive/20/20"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <h3 className="text-lg font-semibold text-primary">
              Restaurants in {collection.name}
            </h3>
            <span className="text-sm text-secondary">
              {restaurants.length} restaurant
              {restaurants.length !== 1 ? 's' : ''}
            </span>
          </div>
          {/* View Toggle - Show on mobile and desktop */}
          <div className="flex justify-end">
            <ViewToggle
              currentView={viewType}
              onToggle={handleViewTypeChange}
            />
          </div>
        </div>

        {/* Sort Controls */}
        {restaurants.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-text-muted">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-md border border-border bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="rating-desc">Rating (Highest First)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        )}
      </div>

      {restaurants.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-tertiary dark:text-text-light mb-4">
            No restaurants in this collection yet.
          </p>
          <p className="text-sm text-text-light dark:text-tertiary">
            Search for restaurants and add them to this collection to get
            started.
          </p>
        </div>
      ) : (
        <>
          {/* List View */}
          {viewType === 'list' && (
            <div className="space-y-4 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
              {paginatedRestaurants.map((restaurant) => (
                <div key={restaurant._id.toString()} className="relative group">
                  <RestaurantCard
                    restaurant={restaurant}
                    onViewDetails={() =>
                      onViewDetails?.(restaurant) ||
                      handleManageRestaurant(restaurant)
                    }
                    showAddButton={false}
                  />
                  {/* Desktop: Show buttons on hover */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex gap-1">
                    {onViewDetails && (
                      <Button
                        onClick={() => onViewDetails(restaurant)}
                        size="sm"
                        variant="outline"
                        className="bg-white/90 dark:bg-secondary/90 backdrop-blur-sm shadow-sm border border-border/50"
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
                      className="bg-white dark:bg-background shadow-sm"
                    >
                      Manage
                    </Button>
                  </div>

                  {/* Mobile: Show dropdown menu */}
                  <div className="absolute top-2 right-2 flex md:hidden">
                    <DropdownMenu
                      trigger={
                        <button
                          className="p-2 bg-white/90 dark:bg-secondary/90 backdrop-blur-sm shadow-sm rounded-lg transition-colors border border-border/50"
                          aria-label="Restaurant actions"
                        >
                          <svg
                            className="w-4 h-4 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>
                      }
                      align="right"
                    >
                      {onViewDetails && (
                        <DropdownMenuItem
                          onClick={() => onViewDetails(restaurant)}
                        >
                          View Details
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() =>
                          onManageRestaurant?.(restaurant) ||
                          handleManageRestaurant(restaurant)
                        }
                      >
                        Manage Restaurant
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grid View */}
          {viewType === 'grid' && (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {paginatedRestaurants.map((restaurant) => (
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

          {/* Map View - Show all restaurants on map */}
          {viewType === 'map' && (
            <div className="space-y-4">
              <LazyMapView
                restaurants={sortedRestaurants}
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

          {/* Pagination Controls */}
          {totalPages > 1 && viewType !== 'map' && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Show first page, last page, current page, and pages around current
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1;

                    const showEllipsis =
                      (page === 2 && currentPage > 3) ||
                      (page === totalPages - 1 && currentPage < totalPages - 2);

                    if (showEllipsis) {
                      return (
                        <span key={page} className="px-2 text-text-muted">
                          ...
                        </span>
                      );
                    }

                    if (!showPage) return null;

                    return (
                      <Button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        variant={currentPage === page ? 'primary' : 'outline'}
                        size="sm"
                        className="min-w-[2.5rem]"
                      >
                        {page}
                      </Button>
                    );
                  }
                )}
              </div>

              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
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
