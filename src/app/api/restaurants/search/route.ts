import { NextRequest, NextResponse } from 'next/server';
import { searchRestaurantsByCoordinates } from '@/lib/restaurants';
import { validateData, restaurantSearchSchema } from '@/lib/validation';
import { geocodeAddress } from '@/lib/google-places';

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

    // Handle coordinate-based search
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const searchRadius = radius ? parseInt(radius) : 5000;

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

      return NextResponse.json({
        success: true,
        restaurants,
        count: restaurants.length,
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
        // Geocode the address to get coordinates
        try {
          const coordinates = await geocodeAddress(location);
          if (!coordinates) {
            return NextResponse.json(
              { error: 'Could not find coordinates for the provided address' },
              { status: 400 }
            );
          }
          latitude = coordinates.lat;
          longitude = coordinates.lng;
        } catch (error) {
          console.error('Geocoding error:', error);

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
      const searchRadius = radius ? parseInt(radius) : 5000;
      const restaurants = await searchRestaurantsByCoordinates(
        latitude,
        longitude,
        searchRadius
      );

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

      return NextResponse.json({
        success: true,
        restaurants: filteredRestaurants,
        count: filteredRestaurants.length,
      });
    }

    return NextResponse.json(
      { error: 'Location parameter is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
