'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { AddressInput } from '@/components/ui/AddressInput';

interface RestaurantSearchFormProps {
  onSearch: (query?: string, location: string, filters?: SearchFilters) => void;
  isLoading?: boolean;
}

interface SearchFilters {
  cuisine?: string;
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
}

export function RestaurantSearchForm({
  onSearch,
  isLoading = false,
}: RestaurantSearchFormProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isAddressValid, setIsAddressValid] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !isAddressValid) return;

    onSearch(query.trim() || undefined, location.trim(), filters);
  };

  const handleCurrentLocation = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation(
              `${position.coords.latitude},${position.coords.longitude}`
            );
            setUseCurrentLocation(true);
          },
          (error) => {
            console.error('Error getting location:', error);
            alert(
              'Unable to get your location. Please enter an address manually.'
            );
          }
        );
      } else {
        alert('Geolocation is not supported by this browser.');
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleFilterChange = (
    key: keyof SearchFilters,
    value: string | number
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  const handleAddressSelect = (address: string) => {
    setLocation(address);
    setUseCurrentLocation(false);
  };

  const handleAddressValidationChange = (isValid: boolean) => {
    setIsAddressValid(isValid);
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Location (required)
          </label>
          <div className="flex gap-2">
            <AddressInput
              value={location}
              onChange={(value) => {
                setLocation(value);
                setUseCurrentLocation(false);
              }}
              onAddressSelect={handleAddressSelect}
              onValidationChange={handleAddressValidationChange}
              placeholder="Enter address or city..."
              className="flex-1"
              required
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleCurrentLocation}
              disabled={isLoading}
            >
              📍 Use Current Location
            </Button>
          </div>
          {useCurrentLocation && (
            <p className="text-sm text-green-600 mt-1">
              ✓ Using current location
            </p>
          )}
          {location && !isAddressValid && !useCurrentLocation && (
            <p className="text-sm text-amber-600 mt-1">
              ⚠ Address validation in progress...
            </p>
          )}
        </div>

        {/* Search Query */}
        <div>
          <label
            htmlFor="query"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Restaurant name or cuisine (optional)
          </label>
          <Input
            id="query"
            type="text"
            placeholder="e.g., Italian, pizza, sushi..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filters Toggle */}
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label
                htmlFor="cuisine"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cuisine Type
              </label>
              <Input
                id="cuisine"
                type="text"
                placeholder="e.g., Italian, Chinese..."
                value={filters.cuisine || ''}
                onChange={(e) => handleFilterChange('cuisine', e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="minRating"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Minimum Rating
              </label>
              <Input
                id="minRating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                placeholder="e.g., 4.0"
                value={filters.minRating || ''}
                onChange={(e) =>
                  handleFilterChange('minRating', parseFloat(e.target.value))
                }
              />
            </div>

            <div>
              <label
                htmlFor="minPrice"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Min Price Level
              </label>
              <select
                id="minPrice"
                value={filters.minPrice || ''}
                onChange={(e) =>
                  handleFilterChange('minPrice', parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any</option>
                <option value="1">$ (Budget)</option>
                <option value="2">$$ (Moderate)</option>
                <option value="3">$$$ (Expensive)</option>
                <option value="4">$$$$ (Very Expensive)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="maxPrice"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Max Price Level
              </label>
              <select
                id="maxPrice"
                value={filters.maxPrice || ''}
                onChange={(e) =>
                  handleFilterChange('maxPrice', parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any</option>
                <option value="1">$ (Budget)</option>
                <option value="2">$$ (Moderate)</option>
                <option value="3">$$$ (Expensive)</option>
                <option value="4">$$$$ (Very Expensive)</option>
              </select>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!location.trim() || !isAddressValid || isLoading}
          className="w-full"
          isLoading={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search Restaurants'}
        </Button>
        {location && !isAddressValid && !useCurrentLocation && (
          <p className="text-sm text-red-600 text-center mt-2">
            Please enter a valid address to search for restaurants
          </p>
        )}
      </form>
    </Card>
  );
}
