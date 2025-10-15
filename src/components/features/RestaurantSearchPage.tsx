'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Restaurant, Collection } from '@/types/database';
import { RestaurantSearchForm } from '../forms/RestaurantSearchForm';
import { RestaurantSearchResults } from './RestaurantSearchResults';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useRestaurantSearch, useAddRestaurantToCollection } from '@/hooks/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { useSearchParams, useRouter } from 'next/navigation';

interface RestaurantSearchPageProps {
  onAddToCollection?: (restaurant: Restaurant) => void;
  collections?: Array<{ _id: string; name: string }>;
}

interface SearchFilters {
  cuisine?: string;
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  distance?: number;
}

export type SortOption =
  | 'distance-asc'
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc';

export function RestaurantSearchPage({
  onAddToCollection,
  collections: propCollections = [],
}: RestaurantSearchPageProps) {
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state management
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1')
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'distance-asc'
  );
  const [radiusFilter, setRadiusFilter] = useState(
    parseInt(searchParams.get('radius') || '5')
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [showAddToCollectionModal, setShowAddToCollectionModal] =
    useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [restaurantInCollections, setRestaurantInCollections] = useState<
    Set<string>
  >(new Set());
  const [selectedRestaurantCollections, setSelectedRestaurantCollections] =
    useState<Set<string>>(new Set());
  const [searchFilters, setSearchFilters] = useState<{
    location: string;
    q?: string;
    cuisine?: string;
    minRating?: number;
    maxPrice?: number;
    minPrice?: number;
    distance?: number;
  } | null>(null);

  // Use TanStack Query hooks - fetch all collections (personal + group)
  const { data: collectionsData, isLoading: isLoadingCollections } = useQuery({
    queryKey: ['allCollections', user?.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/collections?userId=${user?.id}&type=all`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }
      const data = await response.json();
      logger.debug('All collections API response:', data);
      logger.debug('Personal collections:', data.collections.personal);
      logger.debug('Group collections:', data.collections.group);
      // Combine personal and group collections into a single array
      const combined = [
        ...data.collections.personal,
        ...data.collections.group,
      ];
      logger.debug('Combined collections:', combined);
      return combined;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle the collections data structure
  const collections = useMemo(() => collectionsData || [], [collectionsData]);

  // Fetch ALL restaurants (up to 25 miles) - no server-side filtering
  const {
    data: allRestaurants = [],
    isLoading,
    error,
  } = useRestaurantSearch(
    searchFilters || { location: '' },
    !!searchFilters?.location
  );

  const addRestaurantMutation = useAddRestaurantToCollection();

  // Update URL params when sort, page, or radius changes
  useEffect(() => {
    if (!searchFilters?.location) return;

    const params = new URLSearchParams();
    if (sortBy !== 'distance-asc') params.set('sort', sortBy);
    if (currentPage !== 1) params.set('page', currentPage.toString());
    if (radiusFilter !== 5) params.set('radius', radiusFilter.toString());
    if (searchQuery) params.set('q', searchQuery);

    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(newUrl, { scroll: false });
  }, [
    sortBy,
    currentPage,
    radiusFilter,
    searchQuery,
    router,
    searchFilters?.location,
  ]);

  // Client-side filtering, sorting, and pagination
  const {
    filteredRestaurants,
    paginatedRestaurants,
    totalPages,
    availableRadii,
  } = useMemo(() => {
    let filtered = [...allRestaurants];

    // 1. Filter by radius (miles)
    filtered = filtered.filter((r) => {
      const dist = r.distance || 0;
      return dist <= radiusFilter;
    });

    // 2. Filter by cuisine (if provided)
    if (searchFilters?.cuisine) {
      filtered = filtered.filter((r) =>
        r.cuisine.toLowerCase().includes(searchFilters.cuisine!.toLowerCase())
      );
    }

    // 3. Filter by rating (if provided)
    if (searchFilters?.minRating) {
      filtered = filtered.filter((r) => r.rating >= searchFilters.minRating!);
    }

    // 4. Filter by price (if provided)
    if (searchFilters?.minPrice || searchFilters?.maxPrice) {
      filtered = filtered.filter((r) => {
        const priceLevel = r.priceRange
          ? r.priceRange === '$'
            ? 1
            : r.priceRange === '$$'
              ? 2
              : r.priceRange === '$$$'
                ? 3
                : 4
          : 0;

        if (searchFilters?.minPrice && priceLevel < searchFilters.minPrice) {
          return false;
        }
        if (searchFilters?.maxPrice && priceLevel > searchFilters.maxPrice) {
          return false;
        }
        return true;
      });
    }

    // 5. Sort restaurants
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance-asc':
          return (a.distance || 0) - (b.distance || 0);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc': {
          const priceA = a.priceRange?.length || 0;
          const priceB = b.priceRange?.length || 0;
          return priceA - priceB;
        }
        case 'price-desc': {
          const priceA = a.priceRange?.length || 0;
          const priceB = b.priceRange?.length || 0;
          return priceB - priceA;
        }
        default:
          return 0;
      }
    });

    // 6. Calculate available radii for smart no-results message
    const radiiOptions = [1, 5, 10, 25];
    const available = radiiOptions.filter((radius) =>
      allRestaurants.some((r) => (r.distance || 0) <= radius)
    );

    // 7. Paginate (12 per page)
    const ITEMS_PER_PAGE = 12;
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const paginated = filtered.slice(startIdx, endIdx);

    return {
      filteredRestaurants: filtered,
      paginatedRestaurants: paginated,
      totalPages,
      availableRadii: available,
    };
  }, [allRestaurants, radiusFilter, searchFilters, sortBy, currentPage]);

  // Alias for compatibility with existing code
  const restaurants = paginatedRestaurants;

  const checkRestaurantsInCollections = useCallback(
    async (collections: Collection[]) => {
      if (restaurants.length === 0 || collections.length === 0) return;

      try {
        // Get all restaurant IDs from search results (use googlePlaceId if _id not available)
        const restaurantIds = restaurants
          .filter((r) => r._id || r.googlePlaceId)
          .map((r) => (r._id || r.googlePlaceId).toString());

        // Check each collection for these restaurants
        const inCollections = new Set<string>();

        for (const collection of collections) {
          for (const restaurantId of restaurantIds) {
            if (
              collection.restaurantIds.some((restaurantData) => {
                // Handle both old format (string IDs) and new format (objects with _id and googlePlaceId)
                if (typeof restaurantData === 'string') {
                  return restaurantData === restaurantId;
                } else if (
                  restaurantData &&
                  typeof restaurantData === 'object' &&
                  'toString' in restaurantData
                ) {
                  return restaurantData.toString() === restaurantId;
                } else if (
                  restaurantData &&
                  typeof restaurantData === 'object'
                ) {
                  // New format: object with _id and/or googlePlaceId
                  const obj = restaurantData as Record<string, unknown>;
                  return (
                    ('_id' in obj &&
                      obj._id &&
                      obj._id.toString() === restaurantId) ||
                    ('googlePlaceId' in obj &&
                      obj.googlePlaceId &&
                      obj.googlePlaceId === restaurantId)
                  );
                }
                return false;
              })
            ) {
              inCollections.add(restaurantId);
            }
          }
        }

        setRestaurantInCollections(inCollections);
      } catch (error) {
        logger.error('Error checking restaurants in collections:', error);
      }
    },
    [restaurants]
  );

  // Fetch collections if not provided as props
  // Use propCollections if provided, otherwise use TanStack Query data
  const effectiveCollections = useMemo(() => {
    return propCollections.length > 0
      ? propCollections.map((prop) => ({
          _id: prop._id as unknown as Collection['_id'],
          name: prop.name,
          description: '',
          type: 'personal' as const,
          ownerId: 'temp' as unknown as Collection['ownerId'],
          restaurantIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      : Array.isArray(collections)
        ? collections
        : [];
  }, [propCollections, collections]);

  // Check restaurants in collections when restaurants or collections change
  useEffect(() => {
    if (restaurants.length > 0 && effectiveCollections.length > 0) {
      checkRestaurantsInCollections(effectiveCollections);
    }
  }, [restaurants, effectiveCollections, checkRestaurantsInCollections]);

  const searchRestaurants = (
    location: string,
    query?: string,
    filters?: SearchFilters
  ) => {
    setSearchQuery(query || '');
    setCurrentPage(1); // Reset to page 1 on new search

    // Set radius from filters if provided
    if (filters?.distance) {
      setRadiusFilter(filters.distance);
    }

    // Store filters for client-side filtering
    // Don't pass to API - we fetch all restaurants within 25 miles
    const searchParams = {
      location,
      ...(query && { q: query }),
      ...(filters?.cuisine && { cuisine: filters.cuisine }),
      ...(filters?.minRating && { minRating: filters.minRating }),
      ...(filters?.maxPrice && { maxPrice: filters.maxPrice }),
      ...(filters?.minPrice && { minPrice: filters.minPrice }),
      ...(filters?.distance && { distance: filters.distance }),
    };

    setSearchFilters(searchParams);
  };

  // Handler for sort change
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to page 1 when sorting changes
  };

  // Handler for radius change (from re-search)
  const handleRadiusChange = (newRadius: number) => {
    setRadiusFilter(newRadius);
    setCurrentPage(1); // Reset to page 1 when radius changes
  };

  // Handler for page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const checkRestaurantInSpecificCollections = (
    restaurant: Restaurant,
    collections: Collection[]
  ) => {
    // Use googlePlaceId if _id is not available (for search results)
    const restaurantId = restaurant._id || restaurant.googlePlaceId;
    if (!restaurantId) return new Set<string>();

    // Safety check: ensure collections is an array
    if (!Array.isArray(collections)) {
      logger.error('collections is not an array:', collections);
      return new Set<string>();
    }

    const inCollections = new Set<string>();
    logger.debug('Checking restaurant:', restaurantId.toString());
    logger.debug(
      'Available collections:',
      collections.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        restaurantIds: c.restaurantIds,
      }))
    );

    for (const collection of collections) {
      logger.debug(
        `Checking collection ${collection.name} with restaurantIds:`,
        collection.restaurantIds
      );
      const hasRestaurant = collection.restaurantIds.some((restaurantData) => {
        // Handle both old format (string IDs) and new format (objects with _id and googlePlaceId)
        if (typeof restaurantData === 'string') {
          const idStr = restaurantData;
          const restaurantIdStr = restaurantId.toString();
          logger.debug(
            `Comparing old format ${idStr} with ${restaurantIdStr}:`,
            idStr === restaurantIdStr
          );
          return idStr === restaurantIdStr;
        } else if (restaurantData && typeof restaurantData === 'object') {
          const obj = restaurantData as Record<string, unknown>;
          // Check if it's the new format with _id and googlePlaceId properties first
          if ('_id' in obj || 'googlePlaceId' in obj) {
            // New format: object with _id and/or googlePlaceId
            const matchesId =
              '_id' in obj &&
              obj._id &&
              String(obj._id) === String(restaurantId);
            const matchesGooglePlaceId =
              'googlePlaceId' in obj &&
              obj.googlePlaceId &&
              obj.googlePlaceId === restaurantId;
            logger.debug(
              `Comparing new format ${JSON.stringify(restaurantData)} with ${restaurantId}:`,
              `_id match: ${matchesId}, googlePlaceId match: ${matchesGooglePlaceId}`
            );
            return matchesId || matchesGooglePlaceId;
          } else if ('toString' in restaurantData) {
            // ObjectId format
            const idStr = restaurantData.toString();
            const restaurantIdStr = restaurantId.toString();
            logger.debug(
              `Comparing ObjectId format ${idStr} with ${restaurantIdStr}:`,
              idStr === restaurantIdStr
            );
            // Also try comparing the string representation
            return (
              idStr === restaurantIdStr || idStr === restaurantId.toString()
            );
          }
        }
        return false;
      });
      logger.debug(
        `Collection ${collection.name} has restaurant:`,
        hasRestaurant
      );
      if (hasRestaurant) {
        inCollections.add(collection._id.toString());
      }
    }

    logger.debug('Restaurant is in collections:', Array.from(inCollections));
    return inCollections;
  };

  const handleAddToCollection = (restaurant: Restaurant) => {
    if (onAddToCollection) {
      onAddToCollection(restaurant);
    } else {
      logger.debug('Selected restaurant:', restaurant);
      logger.debug('Restaurant ID:', restaurant._id);
      logger.debug('Restaurant ID type:', typeof restaurant._id);
      logger.debug('Restaurant keys:', Object.keys(restaurant));
      setSelectedRestaurant(restaurant);

      // Only proceed if we have valid collections data
      if (!Array.isArray(effectiveCollections)) {
        logger.error(
          'effectiveCollections is not an array:',
          effectiveCollections
        );
        setShowAddToCollectionModal(true);
        return;
      }

      // Check which collections already contain this restaurant
      const restaurantCollections = checkRestaurantInSpecificCollections(
        restaurant,
        effectiveCollections
      );
      logger.debug(
        'Restaurant collections result:',
        Array.from(restaurantCollections)
      );
      setSelectedRestaurantCollections(restaurantCollections);
      setShowAddToCollectionModal(true);
    }
  };

  const handleViewDetails = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleCollectionSelect = async (collectionId: string) => {
    if (!selectedRestaurant) return;

    logger.debug(
      'Selected restaurant for adding to collection:',
      selectedRestaurant
    );
    logger.debug('Restaurant _id:', selectedRestaurant._id);
    logger.debug('Restaurant _id type:', typeof selectedRestaurant._id);

    // Handle different possible ID formats
    let restaurantId: string;
    if (selectedRestaurant._id) {
      restaurantId = selectedRestaurant._id.toString();
    } else if (selectedRestaurant.googlePlaceId) {
      restaurantId = selectedRestaurant.googlePlaceId;
    } else {
      logger.error(
        'No valid ID found in selectedRestaurant:',
        selectedRestaurant
      );
      toast.error('Invalid restaurant data');
      return;
    }

    try {
      await addRestaurantMutation.mutateAsync({
        restaurantId,
        collectionId,
      });

      // Find the collection name for the success message
      const collection = effectiveCollections.find(
        (c) => c._id.toString() === collectionId
      );
      const collectionName = collection?.name || 'collection';

      // Show success message
      toast.success(`Added to ${collectionName}!`);

      // Invalidate collections cache to refresh the data
      queryClient.invalidateQueries({
        queryKey: ['allCollections', user?.id],
      });

      // Re-check restaurant collections to update the "already in collection" status
      if (selectedRestaurant) {
        const restaurantCollections = checkRestaurantInSpecificCollections(
          selectedRestaurant,
          effectiveCollections
        );
        setSelectedRestaurantCollections(restaurantCollections);
      }

      setShowAddToCollectionModal(false);
      setSelectedRestaurant(null);
      setSelectedCollectionId(''); // Reset selected collection

      // Show success message or trigger callback
      if (onAddToCollection) {
        onAddToCollection(selectedRestaurant);
      }
    } catch (err) {
      logger.error('Error adding restaurant to collection:', err);
      toast.error('Failed to add restaurant to collection');
    }
  };

  const handleCloseModal = () => {
    setShowAddToCollectionModal(false);
    setSelectedRestaurant(null);
    setSelectedCollectionId(''); // Reset selected collection
    setSelectedRestaurantCollections(new Set()); // Reset restaurant collections
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <RestaurantSearchForm
        onSearch={searchRestaurants}
        isLoading={isLoading}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-destructive">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Search Error</h3>
              <div className="mt-2 text-sm text-red-700">
                {error instanceof Error ? error.message : 'An error occurred'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart No Results Message */}
      {!isLoading &&
        searchFilters &&
        filteredRestaurants.length === 0 &&
        allRestaurants.length > 0 && (
          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <p className="text-text">
              No results within {radiusFilter}{' '}
              {radiusFilter === 1 ? 'mile' : 'miles'}.
              {availableRadii.length > 0 &&
                availableRadii[0] > radiusFilter && (
                  <>
                    {' '}
                    But{' '}
                    {
                      allRestaurants.filter(
                        (r) =>
                          (r.distance || 0) <=
                          availableRadii.find((r) => r > radiusFilter)!
                      ).length
                    }{' '}
                    restaurant
                    {allRestaurants.filter(
                      (r) =>
                        (r.distance || 0) <=
                        availableRadii.find((r) => r > radiusFilter)!
                    ).length !== 1
                      ? 's'
                      : ''}{' '}
                    found within {availableRadii.find((r) => r > radiusFilter)}{' '}
                    {availableRadii.find((r) => r > radiusFilter) === 1
                      ? 'mile'
                      : 'miles'}
                    .
                  </>
                )}
            </p>
            {availableRadii.length > 0 && availableRadii[0] > radiusFilter && (
              <button
                onClick={() =>
                  handleRadiusChange(
                    availableRadii.find((r) => r > radiusFilter)!
                  )
                }
                className="mt-2 text-primary hover:underline font-medium"
              >
                Expand to {availableRadii.find((r) => r > radiusFilter)}{' '}
                {availableRadii.find((r) => r > radiusFilter) === 1
                  ? 'mile'
                  : 'miles'}
              </button>
            )}
          </div>
        )}

      {/* Zero Results (no restaurants at all) */}
      {!isLoading && searchFilters && allRestaurants.length === 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-text">0 Results</p>
        </div>
      )}

      {/* Search Results */}
      <RestaurantSearchResults
        restaurants={restaurants}
        isLoading={isLoading}
        onAddToCollection={handleAddToCollection}
        onViewDetails={handleViewDetails}
        searchQuery={searchQuery}
        restaurantInCollections={restaurantInCollections}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalResults={filteredRestaurants.length}
      />

      {/* Add to Collection Modal */}
      <Modal
        isOpen={showAddToCollectionModal}
        onClose={handleCloseModal}
        title="Add to Collection"
      >
        {selectedRestaurant && (
          <div className="space-y-4">
            <div className="p-4 bg-surface rounded-lg">
              <h3 className="font-medium text-text">
                {selectedRestaurant.name}
              </h3>
              <p className="text-sm text-text-light">
                {selectedRestaurant.cuisine}
              </p>
              <p className="text-sm text-text-light">
                {selectedRestaurant.address}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-text">
                Select Collection
              </label>
              {!isLoaded ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-text-light">
                    Loading...
                  </span>
                </div>
              ) : !user ? (
                <p className="text-sm text-text-light">
                  Please sign in to add restaurants to collections.
                </p>
              ) : isLoadingCollections ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-text-light">
                    Loading collections...
                  </span>
                </div>
              ) : effectiveCollections.length > 0 ? (
                effectiveCollections.length <= 3 ? (
                  // Show as buttons when 3 or fewer collections
                  <div className="space-y-2">
                    {effectiveCollections.map((collection) => {
                      const isAlreadyInCollection =
                        selectedRestaurantCollections.has(
                          collection._id.toString()
                        );
                      logger.debug(
                        `Collection ${collection.name} isAlreadyInCollection:`,
                        isAlreadyInCollection
                      );
                      logger.debug(
                        'selectedRestaurantCollections:',
                        Array.from(selectedRestaurantCollections)
                      );
                      return (
                        <button
                          key={collection._id.toString()}
                          onClick={() =>
                            !isAlreadyInCollection &&
                            handleCollectionSelect(collection._id.toString())
                          }
                          disabled={isAlreadyInCollection}
                          className={`w-full text-left p-3 border rounded-lg transition-colors ${
                            isAlreadyInCollection
                              ? 'border-success bg-success/10 text-green-700 cursor-not-allowed'
                              : 'border-border hover:bg-surface cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{collection.name}</span>
                            {isAlreadyInCollection && (
                              <span className="text-success font-medium">
                                ✓ Added
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  // Show as dropdown when more than 3 collections
                  <div className="space-y-3">
                    <select
                      value={selectedCollectionId}
                      onChange={(e) => setSelectedCollectionId(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select a collection...</option>
                      {effectiveCollections
                        .filter(
                          (collection) =>
                            !selectedRestaurantCollections.has(
                              collection._id.toString()
                            )
                        )
                        .map((collection) => (
                          <option
                            key={collection._id.toString()}
                            value={collection._id.toString()}
                          >
                            {collection.name}
                          </option>
                        ))}
                    </select>
                    {effectiveCollections.some((collection) =>
                      selectedRestaurantCollections.has(
                        collection._id.toString()
                      )
                    ) && (
                      <div className="text-sm text-success bg-success/10 border border-green-200 rounded-lg p-2">
                        <div className="font-medium mb-1">
                          Already in collections:
                        </div>
                        <div className="space-y-1">
                          {collections
                            .filter((collection) =>
                              selectedRestaurantCollections.has(
                                collection._id.toString()
                              )
                            )
                            .map((collection) => (
                              <div
                                key={collection._id.toString()}
                                className="flex items-center"
                              >
                                <span className="text-success mr-2">✓</span>
                                <span>{collection.name}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={() =>
                        selectedCollectionId &&
                        handleCollectionSelect(selectedCollectionId)
                      }
                      disabled={
                        !selectedCollectionId || addRestaurantMutation.isPending
                      }
                      className="w-full"
                    >
                      {addRestaurantMutation.isPending
                        ? 'Adding...'
                        : 'Add to Collection'}
                    </Button>
                  </div>
                )
              ) : (
                <p className="text-sm text-text-light">
                  No collections available. Create a collection first.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Restaurant Details Modal */}
      <Modal
        isOpen={!!selectedRestaurant && !showAddToCollectionModal}
        onClose={() => setSelectedRestaurant(null)}
        title={selectedRestaurant?.name || 'Restaurant Details'}
      >
        {selectedRestaurant && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-text">Cuisine:</span>
                <p className="text-text-light">{selectedRestaurant.cuisine}</p>
              </div>
              <div>
                <span className="font-medium text-text">Rating:</span>
                <p className="text-text-light">
                  {selectedRestaurant.rating > 0
                    ? selectedRestaurant.rating.toFixed(1)
                    : 'No rating'}
                </p>
              </div>
              <div>
                <span className="font-medium text-text">Price Range:</span>
                <p className="text-text-light">
                  {selectedRestaurant.priceRange || 'Not available'}
                </p>
              </div>
              <div>
                <span className="font-medium text-text">Phone:</span>
                <p className="text-text-light">
                  {selectedRestaurant.phoneNumber || 'Not available'}
                </p>
              </div>
            </div>

            <div>
              <span className="font-medium text-text">Address:</span>
              <p className="text-text-light">{selectedRestaurant.address}</p>
            </div>

            {selectedRestaurant.website && (
              <div>
                <span className="font-medium text-text">Website:</span>
                <a
                  href={selectedRestaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-blue-800 ml-2"
                >
                  Visit Website
                </a>
              </div>
            )}

            {selectedRestaurant.hours && (
              <div>
                <span className="font-medium text-text">Hours:</span>
                <div className="mt-1 space-y-1">
                  {Object.entries(selectedRestaurant.hours).map(
                    ([day, hours]) => (
                      <p key={day} className="text-sm text-text-light">
                        {day}: {hours}
                      </p>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedRestaurant(null)}
              >
                Close
              </Button>
              <Button onClick={() => handleAddToCollection(selectedRestaurant)}>
                Add to Collection
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
