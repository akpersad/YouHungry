'use client';

import { logger } from '@/lib/logger';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AddressInput } from '@/components/ui/AddressInput';
import { Input } from '@/components/ui/Input';

interface RestaurantSearchFormProps {
  onSearch: (location: string, query?: string, filters?: SearchFilters) => void;
  isLoading?: boolean;
}

interface SearchFilters {
  cuisine?: string;
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  distance?: number;
}

export function RestaurantSearchForm({
  onSearch,
  isLoading = false,
}: RestaurantSearchFormProps) {
  const [location, setLocation] = useState('');
  const [query, setQuery] = useState('');
  const [distance, setDistance] = useState(10);
  const [cuisine, setCuisine] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [currentLocationCoords, setCurrentLocationCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAddressValid) {
      setError('Please enter a valid address');
      return;
    }

    if (!location.trim()) {
      setError('Location is required');
      return;
    }

    setError('');

    const filters: SearchFilters = {
      distance,
      cuisine: cuisine || undefined,
      minRating: minRating || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    };

    // If using current location, pass the coordinates directly
    let searchLocation = location.trim();
    if (useCurrentLocation && currentLocationCoords) {
      searchLocation = `${currentLocationCoords.lat},${currentLocationCoords.lng}`;
    }

    onSearch(searchLocation, query.trim() || undefined, filters);
  };

  const handleCurrentLocation = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setCurrentLocationCoords(coords);
            setUseCurrentLocation(true);
            setLocation('Current Location');
            setIsAddressValid(true);
          },
          (error) => {
            logger.error('Error getting location:', error);
            alert(
              'Unable to get your location. Please enter an address manually.'
            );
          }
        );
      } else {
        alert('Geolocation is not supported by this browser.');
      }
    } catch (error) {
      logger.error('Error getting location:', error);
    }
  };

  const handleAddressSelect = (address: string) => {
    setLocation(address);
    setUseCurrentLocation(false);
    setCurrentLocationCoords(null);
  };

  const handleAddressValidationChange = (isValid: boolean) => {
    // Only update validation if not using current location
    if (!useCurrentLocation) {
      setIsAddressValid(isValid);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg shadow-neumorphic-light dark:shadow-neumorphic-dark">
            <p className="text-error text-sm" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-primary mb-2"
          >
            Location (required)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <AddressInput
              id="location"
              value={location}
              onChange={setLocation}
              onAddressSelect={handleAddressSelect}
              onValidationChange={handleAddressValidationChange}
              placeholder="Enter address or city..."
              className="w-full sm:flex-1"
              required
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleCurrentLocation}
              disabled={isLoading}
              className="w-full sm:w-auto sm:flex-shrink-0 sm:whitespace-nowrap"
            >
              📍 Use Current Location
            </Button>
          </div>
          {useCurrentLocation && (
            <p className="text-sm text-success mt-1">
              ✓ Using current location
            </p>
          )}
        </div>

        {/* Distance */}
        <div>
          <label
            htmlFor="distance"
            className="block text-sm font-medium text-primary mb-1"
          >
            Search Radius
          </label>
          <select
            id="distance"
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="input-base shadow-neumorphic-light dark:shadow-neumorphic-dark"
            disabled={isLoading}
          >
            <option value={1}>1 mile</option>
            <option value={5}>5 miles</option>
            <option value={10}>10 miles</option>
            <option value={25}>25 miles</option>
            <option value={50}>50 miles</option>
          </select>
        </div>

        {/* Search Query */}
        <div>
          <label
            htmlFor="query"
            className="block text-sm font-medium text-primary mb-1"
          >
            Restaurant name or cuisine (optional)
          </label>
          <Input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Italian, pizza, sushi..."
            disabled={isLoading}
          />
        </div>

        {/* Filters Toggle */}
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full"
            disabled={isLoading}
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg shadow-neumorphic-light dark:shadow-neumorphic-dark">
            <div>
              <label
                htmlFor="cuisine"
                className="block text-sm font-medium text-primary mb-1"
              >
                Cuisine Type
              </label>
              <Input
                id="cuisine"
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="e.g., Italian, Chinese..."
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="minRating"
                className="block text-sm font-medium text-primary mb-1"
              >
                Minimum Rating
              </label>
              <Input
                id="minRating"
                type="number"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                min="0"
                max="5"
                step="0.1"
                placeholder="e.g., 4.0"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="minPrice"
                className="block text-sm font-medium text-primary mb-1"
              >
                Min Price Level
              </label>
              <select
                id="minPrice"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="input-base shadow-neumorphic-light dark:shadow-neumorphic-dark"
                disabled={isLoading}
              >
                <option value={0}>Any</option>
                <option value={1}>$ (Budget)</option>
                <option value={2}>$$ (Moderate)</option>
                <option value={3}>$$$ (Expensive)</option>
                <option value={4}>$$$$ (Very Expensive)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="maxPrice"
                className="block text-sm font-medium text-primary mb-1"
              >
                Max Price Level
              </label>
              <select
                id="maxPrice"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="input-base shadow-neumorphic-light dark:shadow-neumorphic-dark"
                disabled={isLoading}
              >
                <option value={0}>Any</option>
                <option value={1}>$ (Budget)</option>
                <option value={2}>$$ (Moderate)</option>
                <option value={3}>$$$ (Expensive)</option>
                <option value={4}>$$$$ (Very Expensive)</option>
              </select>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isAddressValid || isLoading}
          className="w-full"
        >
          {isLoading ? 'Searching...' : 'Search Restaurants'}
        </Button>
      </form>
    </Card>
  );
}
