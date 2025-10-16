import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import {
  searchRestaurantsByCoordinates,
  searchRestaurantsByAddress,
} from '@/lib/restaurants';
import { validateData, restaurantSearchSchema } from '@/lib/validation';
import { geocodeAddressOptimized } from '@/lib/optimized-google-places';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const location = searchParams.get('location');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    // Handle coordinate-based search
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json(
          { error: 'Invalid coordinates' },
          { status: 400 }
        );
      }

      // ALWAYS fetch 25 miles of data - no radius parameter needed
      // The hybrid search function handles caching internally
      const restaurants = await searchRestaurantsByCoordinates(
        latitude,
        longitude,
        40234, // 25 miles in meters (hard max)
        query || undefined // Pass query for hybrid search
      );

      // Return ALL restaurants with distances already calculated
      // Client-side will handle filtering by radius, cuisine, rating, price, etc.
      return NextResponse.json({
        success: true,
        restaurants: restaurants,
        count: restaurants.length,
        searchCoordinates: { lat: latitude, lng: longitude },
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

      logger.debug('\n=== RESTAURANT SEARCH DEBUG ===');
      logger.debug('Search Address:', location);
      logger.debug('Query:', query || 'none');
      logger.debug('Coordinates:', { lat: latitude, lng: longitude });

      logger.info('Searching for restaurants:', {
        hasQuery: !!query,
        query,
        latitude,
        longitude,
      });

      // ALWAYS fetch 25 miles of data - hybrid search handles caching
      let restaurants = await searchRestaurantsByCoordinates(
        latitude,
        longitude,
        40234, // 25 miles in meters (hard max)
        query || undefined // Pass query for hybrid search
      );

      // HYBRID SEARCH: Also try address-specific search if we have a specific address
      // This catches restaurants that exist but are filtered out by Google's ranking algorithm
      if (location && !coordinateMatch) {
        logger.debug('Running address-specific search fallback...');
        const addressResults = await searchRestaurantsByAddress(
          location,
          latitude,
          longitude
        );

        // Combine results and deduplicate by googlePlaceId
        const allRestaurantsMap = new Map();

        // Add coordinate search results first
        restaurants.forEach((restaurant) => {
          if (restaurant.googlePlaceId) {
            allRestaurantsMap.set(restaurant.googlePlaceId, restaurant);
          }
        });

        // Add address search results that aren't already included
        addressResults.forEach((restaurant) => {
          if (
            restaurant.googlePlaceId &&
            !allRestaurantsMap.has(restaurant.googlePlaceId)
          ) {
            allRestaurantsMap.set(restaurant.googlePlaceId, restaurant);
            logger.debug(
              `Added from address search: ${restaurant.name} at ${restaurant.address}`
            );
          }
        });

        restaurants = Array.from(allRestaurantsMap.values());
        logger.debug(
          `Combined results: ${restaurants.length} total (${restaurants.length - addressResults.length} from coordinate search, ${addressResults.length} from address search)`
        );
      }

      logger.debug('Total Results:', restaurants.length);
      logger.debug('Returned Restaurants:');
      restaurants.forEach((restaurant, index) => {
        logger.debug(
          `  ${index + 1}. ${restaurant.name} - ${restaurant.address} (${restaurant.distance?.toFixed(2)} miles)`
        );
      });
      logger.debug('=== END SEARCH DEBUG ===\n');

      logger.info('Restaurant search results:', {
        count: restaurants.length,
        hasQuery: !!query,
      });

      // Return ALL restaurants with distances already calculated
      // Client-side will handle filtering by radius, cuisine, rating, price, etc.
      return NextResponse.json({
        success: true,
        restaurants: restaurants,
        count: restaurants.length,
        searchCoordinates: { lat: latitude, lng: longitude },
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
