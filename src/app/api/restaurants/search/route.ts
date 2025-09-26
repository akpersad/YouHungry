import { NextRequest, NextResponse } from 'next/server';
import {
  searchRestaurantsByCoordinates,
  searchRestaurantsWithFilters,
} from '@/lib/restaurants';
import { validateData, restaurantSearchSchema } from '@/lib/validation';

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

      // Search restaurants with filters
      const restaurants = await searchRestaurantsWithFilters(
        query || 'restaurant', // Default to 'restaurant' if no query provided
        location,
        filters
      );

      return NextResponse.json({
        success: true,
        restaurants,
        count: restaurants.length,
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
