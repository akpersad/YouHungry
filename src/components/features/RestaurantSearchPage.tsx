'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Restaurant, Collection } from '@/types/database';
import { RestaurantSearchForm } from '../forms/RestaurantSearchForm';
import { RestaurantSearchResults } from './RestaurantSearchResults';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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

export function RestaurantSearchPage({
  onAddToCollection,
  collections: propCollections = [],
}: RestaurantSearchPageProps) {
  const { user, isLoaded } = useUser();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [showAddToCollectionModal, setShowAddToCollectionModal] =
    useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [restaurantInCollections, setRestaurantInCollections] = useState<
    Set<string>
  >(new Set());
  const [selectedRestaurantCollections, setSelectedRestaurantCollections] =
    useState<Set<string>>(new Set());

  // Fetch collections if not provided as props
  useEffect(() => {
    if (propCollections.length > 0) {
      // Convert propCollections to Collection format
      const convertedCollections: Collection[] = propCollections.map(
        (prop) => ({
          _id: prop._id as unknown as Collection['_id'], // Convert string to ObjectId-like structure for client
          name: prop.name,
          description: '',
          type: 'personal' as const,
          ownerId: 'temp' as unknown as Collection['ownerId'], // This will be overridden when fetched from API
          restaurantIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
      setCollections(convertedCollections);
    } else if (isLoaded && user) {
      fetchCollections();
    }
  }, [propCollections, isLoaded, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCollections = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingCollections(true);
    try {
      const response = await fetch(`/api/collections?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        console.log('Fetched collections:', data.collections);
        setCollections(data.collections || []);
        // Check which restaurants are already in collections
        checkRestaurantsInCollections(data.collections || []);
      } else {
        console.error('Failed to fetch collections:', data.error);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setIsLoadingCollections(false);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
                } else {
                  // New format: object with _id and/or googlePlaceId
                  return (
                    ('_id' in restaurantData &&
                      restaurantData._id &&
                      restaurantData._id.toString() === restaurantId) ||
                    (restaurantData.googlePlaceId &&
                      restaurantData.googlePlaceId === restaurantId)
                  );
                }
              })
            ) {
              inCollections.add(restaurantId);
            }
          }
        }

        setRestaurantInCollections(inCollections);
      } catch (error) {
        console.error('Error checking restaurants in collections:', error);
      }
    },
    [restaurants]
  );

  const searchRestaurants = async (
    location: string,
    query?: string,
    filters?: SearchFilters
  ) => {
    setIsLoading(true);
    setError(null);
    setSearchQuery(query || '');

    try {
      const params = new URLSearchParams({
        location,
        ...(query && { q: query }),
        ...(filters?.cuisine && { cuisine: filters.cuisine }),
        ...(filters?.minRating && { minRating: filters.minRating.toString() }),
        ...(filters?.maxPrice && { maxPrice: filters.maxPrice.toString() }),
        ...(filters?.minPrice && { minPrice: filters.minPrice.toString() }),
        ...(filters?.distance && { distance: filters.distance.toString() }),
      });

      const response = await fetch(`/api/restaurants/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search restaurants');
      }

      setRestaurants(data.restaurants || []);

      // Check which restaurants are already in collections
      if (collections.length > 0) {
        checkRestaurantsInCollections(collections);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to search restaurants'
      );
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkRestaurantInSpecificCollections = (
    restaurant: Restaurant,
    collections: Collection[]
  ) => {
    // Use googlePlaceId if _id is not available (for search results)
    const restaurantId = restaurant._id || restaurant.googlePlaceId;
    if (!restaurantId) return new Set<string>();

    const inCollections = new Set<string>();
    console.log('Checking restaurant:', restaurantId.toString());
    console.log(
      'Available collections:',
      collections.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        restaurantIds: c.restaurantIds,
      }))
    );

    for (const collection of collections) {
      const hasRestaurant = collection.restaurantIds.some((restaurantData) => {
        // Handle both old format (string IDs) and new format (objects with _id and googlePlaceId)
        if (typeof restaurantData === 'string') {
          const idStr = restaurantData;
          const restaurantIdStr = restaurantId.toString();
          console.log(
            `Comparing old format ${idStr} with ${restaurantIdStr}:`,
            idStr === restaurantIdStr
          );
          return idStr === restaurantIdStr;
        } else if (
          restaurantData &&
          typeof restaurantData === 'object' &&
          'toString' in restaurantData
        ) {
          const idStr = restaurantData.toString();
          const restaurantIdStr = restaurantId.toString();
          console.log(
            `Comparing ObjectId format ${idStr} with ${restaurantIdStr}:`,
            idStr === restaurantIdStr
          );
          return idStr === restaurantIdStr;
        } else {
          // New format: object with _id and/or googlePlaceId
          const matchesId =
            '_id' in restaurantData &&
            restaurantData._id &&
            restaurantData._id.toString() === restaurantId.toString();
          const matchesGooglePlaceId =
            restaurantData.googlePlaceId &&
            restaurantData.googlePlaceId === restaurantId.toString();
          console.log(
            `Comparing new format ${JSON.stringify(restaurantData)} with ${restaurantId}:`,
            `_id match: ${matchesId}, googlePlaceId match: ${matchesGooglePlaceId}`
          );
          return matchesId || matchesGooglePlaceId;
        }
      });
      console.log(
        `Collection ${collection.name} has restaurant:`,
        hasRestaurant
      );
      if (hasRestaurant) {
        inCollections.add(collection._id.toString());
      }
    }

    console.log('Restaurant is in collections:', Array.from(inCollections));
    return inCollections;
  };

  const handleAddToCollection = (restaurant: Restaurant) => {
    if (onAddToCollection) {
      onAddToCollection(restaurant);
    } else {
      console.log('Selected restaurant:', restaurant);
      console.log('Restaurant ID:', restaurant._id);
      setSelectedRestaurant(restaurant);
      // Check which collections already contain this restaurant
      const restaurantCollections = checkRestaurantInSpecificCollections(
        restaurant,
        collections
      );
      console.log(
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

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantData: selectedRestaurant,
          collectionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle duplicate restaurant error specifically
        if (data.alreadyExists) {
          throw new Error(
            'This restaurant is already in the selected collection'
          );
        }
        throw new Error(data.error || 'Failed to add restaurant to collection');
      }

      setShowAddToCollectionModal(false);
      setSelectedRestaurant(null);
      setSelectedCollectionId(''); // Reset selected collection

      // Show success message or trigger callback
      if (onAddToCollection) {
        onAddToCollection(selectedRestaurant);
      }
    } catch (err) {
      console.error('Error adding restaurant to collection:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to add restaurant to collection'
      );
    } finally {
      setIsLoading(false);
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
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Search Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
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
      />

      {/* Add to Collection Modal */}
      <Modal
        isOpen={showAddToCollectionModal}
        onClose={handleCloseModal}
        title="Add to Collection"
      >
        {selectedRestaurant && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">
                {selectedRestaurant.name}
              </h3>
              <p className="text-sm text-gray-600">
                {selectedRestaurant.cuisine}
              </p>
              <p className="text-sm text-gray-600">
                {selectedRestaurant.address}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Collection
              </label>
              {!isLoaded ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading...</span>
                </div>
              ) : !user ? (
                <p className="text-sm text-gray-500">
                  Please sign in to add restaurants to collections.
                </p>
              ) : isLoadingCollections ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    Loading collections...
                  </span>
                </div>
              ) : collections.length > 0 ? (
                collections.length <= 3 ? (
                  // Show as buttons when 3 or fewer collections
                  <div className="space-y-2">
                    {collections.map((collection) => {
                      const isAlreadyInCollection =
                        selectedRestaurantCollections.has(
                          collection._id.toString()
                        );
                      console.log(
                        `Collection ${collection.name} isAlreadyInCollection:`,
                        isAlreadyInCollection
                      );
                      console.log(
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
                              ? 'border-green-300 bg-green-50 text-green-700 cursor-not-allowed'
                              : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{collection.name}</span>
                            {isAlreadyInCollection && (
                              <span className="text-green-600 font-medium">
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
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a collection...</option>
                      {collections
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
                    {collections.some((collection) =>
                      selectedRestaurantCollections.has(
                        collection._id.toString()
                      )
                    ) && (
                      <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-2">
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
                                <span className="text-green-600 mr-2">✓</span>
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
                      disabled={!selectedCollectionId}
                      className="w-full"
                    >
                      Add to Collection
                    </Button>
                  </div>
                )
              ) : (
                <p className="text-sm text-gray-500">
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
                <span className="font-medium text-gray-700">Cuisine:</span>
                <p className="text-gray-600">{selectedRestaurant.cuisine}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Rating:</span>
                <p className="text-gray-600">
                  {selectedRestaurant.rating > 0
                    ? selectedRestaurant.rating.toFixed(1)
                    : 'No rating'}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Price Range:</span>
                <p className="text-gray-600">
                  {selectedRestaurant.priceRange || 'Not available'}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <p className="text-gray-600">
                  {selectedRestaurant.phoneNumber || 'Not available'}
                </p>
              </div>
            </div>

            <div>
              <span className="font-medium text-gray-700">Address:</span>
              <p className="text-gray-600">{selectedRestaurant.address}</p>
            </div>

            {selectedRestaurant.website && (
              <div>
                <span className="font-medium text-gray-700">Website:</span>
                <a
                  href={selectedRestaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 ml-2"
                >
                  Visit Website
                </a>
              </div>
            )}

            {selectedRestaurant.hours && (
              <div>
                <span className="font-medium text-gray-700">Hours:</span>
                <div className="mt-1 space-y-1">
                  {Object.entries(selectedRestaurant.hours).map(
                    ([day, hours]) => (
                      <p key={day} className="text-sm text-gray-600">
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
