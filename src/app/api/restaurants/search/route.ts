import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { searchRestaurantsByCoordinates } from '@/lib/restaurants';
import { validateData, restaurantSearchSchema } from '@/lib/validation';
import {
  geocodeAddressOptimized,
  smartRestaurantSearch,
} from '@/lib/optimized-google-places';
import { calculateDistance } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const location = searchParams.get('location');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');
    const cuisine = searchParams.get('cuisine');
    const minRating = searchParams.get('minRating');
    const maxPrice = searchParams.get('maxPrice');
    const minPrice = searchParams.get('minPrice');
    const distance = searchParams.get('distance');

    // Handle coordinate-based search
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      // Convert distance from miles to meters (1 mile = 1609.34 meters)
      const distanceInMiles = distance ? parseInt(distance) : 10;
      const searchRadius = radius
        ? parseInt(radius)
        : Math.round(distanceInMiles * 1609.34);

      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json(
          { error: 'Invalid coordinates' },
          { status: 400 }
        );
      }

      const restaurants = await searchRestaurantsByCoordinates(
        latitude,
        longitude,
        searchRadius
      );

      // Calculate distances and sort by distance, then by rating
      const restaurantsWithDistance = restaurants.map((restaurant) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          restaurant.coordinates.lat,
          restaurant.coordinates.lng
        );
        return {
          ...restaurant,
          distance,
        };
      });

      // Sort by distance first, then by rating (descending)
      const sortedRestaurants = restaurantsWithDistance.sort((a, b) => {
        // First sort by distance
        if (Math.abs(a.distance - b.distance) > 0.1) {
          return a.distance - b.distance;
        }
        // If distances are very close, sort by rating
        return b.rating - a.rating;
      });

      return NextResponse.json({
        success: true,
        restaurants: sortedRestaurants,
        count: sortedRestaurants.length,
      });
    }

    // Handle text-based search with filters
    if (location) {
      // Validate parameters
      const validation = validateData(restaurantSearchSchema, {
        query: query || undefined,
        location,
      });
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid parameters', details: validation.error },
          { status: 400 }
        );
      }

      // Check if location is already coordinates (lat,lng format)
      const coordinateMatch = location.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
      let latitude: number;
      let longitude: number;

      if (coordinateMatch) {
        // Location is already coordinates
        latitude = parseFloat(coordinateMatch[1]);
        longitude = parseFloat(coordinateMatch[2]);
      } else {
        // Use optimized geocoding with caching
        try {
          logger.info('Geocoding address:', { location });
          const coordinates = await geocodeAddressOptimized(location);
          if (!coordinates) {
            logger.error('No coordinates returned for address:', { location });
            return NextResponse.json(
              { error: 'Could not find coordinates for the provided address' },
              { status: 400 }
            );
          }
          logger.info('Geocoded coordinates:', { coordinates });
          latitude = coordinates.lat;
          longitude = coordinates.lng;
        } catch (error) {
          logger.error('Geocoding error:', error);

          // Check if it's a REQUEST_DENIED error (API key issue)
          if (
            error instanceof Error &&
            error.message.includes('REQUEST_DENIED')
          ) {
            return NextResponse.json(
              {
                error:
                  'Google Geocoding API access denied. Please check your API key configuration and ensure the Geocoding API is enabled.',
                details:
                  'This usually means the API key is missing, invalid, or the Geocoding API is not enabled for your Google Cloud project.',
              },
              { status: 500 }
            );
          }

          return NextResponse.json(
            {
              error: 'Failed to geocode address',
              details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
          );
        }
      }

      // Build filters object
      const filters: {
        cuisine?: string;
        minRating?: number;
        maxPrice?: number;
        minPrice?: number;
      } = {};

      if (cuisine) filters.cuisine = cuisine;
      if (minRating) filters.minRating = parseFloat(minRating);
      if (maxPrice) filters.maxPrice = parseInt(maxPrice);
      if (minPrice) filters.minPrice = parseInt(minPrice);

      // Search restaurants by coordinates with filters
      // Convert distance from miles to meters (1 mile = 1609.34 meters)
      const distanceInMiles = distance ? parseInt(distance) : 10;
      const searchRadius = radius
        ? parseInt(radius)
        : Math.round(distanceInMiles * 1609.34);

      logger.info('Searching for restaurants:', {
        hasQuery: !!query,
        query,
        latitude,
        longitude,
        searchRadius,
        distanceInMiles,
      });

      let restaurants;
      if (query) {
        // Use smart search that combines multiple strategies for better results
        restaurants = await smartRestaurantSearch(
          query,
          location,
          searchRadius
        );
      } else {
        // If no query, use nearby search
        restaurants = await searchRestaurantsByCoordinates(
          latitude,
          longitude,
          searchRadius
        );
      }

      logger.info('Restaurant search results:', {
        count: restaurants.length,
        hasQuery: !!query,
      });

      // Apply filters to the results
      const filteredRestaurants = restaurants.filter((restaurant) => {
        if (
          filters.cuisine &&
          !restaurant.cuisine
            .toLowerCase()
            .includes(filters.cuisine.toLowerCase())
        ) {
          return false;
        }
        if (filters.minRating && restaurant.rating < filters.minRating) {
          return false;
        }
        if (filters.minPrice || filters.maxPrice) {
          const priceLevel = restaurant.priceRange
            ? restaurant.priceRange === '$'
              ? 1
              : restaurant.priceRange === '$$'
                ? 2
                : restaurant.priceRange === '$$$'
                  ? 3
                  : 4
            : 0;

          if (filters.minPrice && priceLevel < filters.minPrice) {
            return false;
          }
          if (filters.maxPrice && priceLevel > filters.maxPrice) {
            return false;
          }
        }
        return true;
      });

      // Calculate distances and sort by distance, then by rating
      const restaurantsWithDistance = filteredRestaurants.map((restaurant) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          restaurant.coordinates.lat,
          restaurant.coordinates.lng
        );
        return {
          ...restaurant,
          distance,
        };
      });

      // Sort by distance first, then by rating (descending)
      const sortedRestaurants = restaurantsWithDistance.sort((a, b) => {
        // First sort by distance
        if (Math.abs(a.distance - b.distance) > 0.1) {
          return a.distance - b.distance;
        }
        // If distances are very close, sort by rating
        return b.rating - a.rating;
      });

      return NextResponse.json({
        success: true,
        restaurants: sortedRestaurants,
        count: sortedRestaurants.length,
      });
    }

    return NextResponse.json(
      { error: 'Location parameter is required' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
