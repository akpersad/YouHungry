'use client';

import { useState } from 'react';
import { Restaurant } from '@/types/database';
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
  collections = [],
}: RestaurantSearchPageProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [showAddToCollectionModal, setShowAddToCollectionModal] =
    useState(false);

  const searchRestaurants = async (
    query?: string,
    location: string,
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

  const handleAddToCollection = (restaurant: Restaurant) => {
    if (onAddToCollection) {
      onAddToCollection(restaurant);
    } else {
      setSelectedRestaurant(restaurant);
      setShowAddToCollectionModal(true);
    }
  };

  const handleViewDetails = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleCollectionSelect = (collectionId: string) => {
    if (selectedRestaurant) {
      // This would typically make an API call to add the restaurant to the collection
      console.log(
        `Adding restaurant ${selectedRestaurant._id} to collection ${collectionId}`
      );
      setShowAddToCollectionModal(false);
      setSelectedRestaurant(null);
    }
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
      />

      {/* Add to Collection Modal */}
      <Modal
        isOpen={showAddToCollectionModal}
        onClose={() => setShowAddToCollectionModal(false)}
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
              {collections.length > 0 ? (
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <button
                      key={collection._id}
                      onClick={() => handleCollectionSelect(collection._id)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      {collection.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No collections available. Create a collection first.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddToCollectionModal(false)}
              >
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
