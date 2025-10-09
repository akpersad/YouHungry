import { logger } from '@/lib/logger';
import { Restaurant } from '@/types/database';
import { apiCache, generateCacheKey, withCache } from './api-cache';
// import { calculateDistance } from './utils';

// Optimized Google Places API integration with aggressive caching
// This reduces API costs by up to 90% through intelligent caching

interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  vicinity?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  price_level?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    weekday_text: string[];
  };
}

interface GooglePlacesResponse {
  results: GooglePlaceResult[];
  status: string;
  next_page_token?: string;
  error_message?: string;
  html_attributions?: string[];
}

// Convert Google Place result to our Restaurant interface
function convertGooglePlaceToRestaurant(
  place: GooglePlaceResult
): Omit<Restaurant, '_id' | 'cachedAt' | 'lastUpdated'> {
  // Determine cuisine type from Google's types
  let cuisine = 'Restaurant';

  if (place.types.includes('bar')) {
    cuisine = 'Bar & Grill';
  } else if (place.types.includes('cafe')) {
    cuisine = 'Cafe';
  } else if (place.types.includes('bakery')) {
    cuisine = 'Bakery';
  } else if (place.types.includes('meal_takeaway')) {
    cuisine = 'Takeaway';
  } else if (place.types.includes('meal_delivery')) {
    cuisine = 'Delivery';
  } else if (place.types.includes('italian_restaurant')) {
    cuisine = 'Italian';
  }

  // Convert price level to our format
  const priceRangeMap: { [key: number]: '$' | '$$' | '$$$' | '$$$$' } = {
    0: '$',
    1: '$$',
    2: '$$$',
    3: '$$$$',
  };

  // Convert opening hours to our format
  const hours: { [key: string]: string } = {};
  if (place.opening_hours?.weekday_text) {
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    place.opening_hours.weekday_text.forEach((dayText, index) => {
      if (index < days.length) {
        hours[days[index]] = dayText;
      }
    });
  }

  return {
    googlePlaceId: place.place_id,
    name: place.name,
    address:
      place.formatted_address || place.vicinity || 'Address not available',
    coordinates: {
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    },
    cuisine,
    rating: place.rating || 0,
    priceRange:
      place.price_level !== undefined
        ? priceRangeMap[place.price_level]
        : undefined,
    photos: place.photos?.map((photo) => {
      // Use cached photo URLs to avoid repeated generation
      return generatePhotoUrl(photo.photo_reference);
    }),
    phoneNumber: place.formatted_phone_number,
    website: place.website,
    hours: Object.keys(hours).length > 0 ? hours : undefined,
  };
}

// Generate photo URL with caching
function generatePhotoUrl(photoReference: string): string {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${apiKey}`;
}

// Optimized restaurant search with intelligent caching
export async function searchRestaurantsOptimized(
  query: string,
  location?: string,
  radius: number = 5000
): Promise<Restaurant[]> {
  const cacheKey = generateCacheKey('restaurant_search', {
    query: query.toLowerCase().trim(),
    location: location?.toLowerCase().trim(),
    radius,
  });

  return withCache(
    cacheKey,
    'restaurant_search',
    async () => {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        throw new Error('Google Places API key not configured');
      }

      // Build the search URL
      const baseUrl =
        'https://maps.googleapis.com/maps/api/place/textsearch/json';
      const params = new URLSearchParams({
        query: query,
        key: apiKey,
        type: 'restaurant',
      });

      if (location) {
        params.append('location', location);
        params.append('radius', radius.toString());
      }

      logger.info('Calling Google Places Text Search API:', {
        query,
        location,
        radius,
      });

      const response = await fetch(`${baseUrl}?${params.toString()}`);

      if (!response.ok) {
        logger.error('Google Places Text Search HTTP error:', {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data: GooglePlacesResponse = await response.json();

      logger.info('Google Places Text Search API response:', {
        status: data.status,
        resultsCount: data.results?.length || 0,
        errorMessage: data.error_message,
      });

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        const errorMessage = data.error_message || data.status;
        logger.error('Google Places Text Search API error:', {
          status: data.status,
          errorMessage,
        });
        throw new Error(
          `Google Places API error: ${data.status} - ${errorMessage}`
        );
      }

      // Convert results to our Restaurant format
      const restaurants = data.results.map(convertGooglePlaceToRestaurant);

      logger.info('Google Places Text Search results:', {
        totalResults: data.results.length,
        restaurantsWithPhotos: restaurants.filter(
          (r) => r.photos && r.photos.length > 0
        ).length,
        sampleNames: restaurants.slice(0, 5).map((r) => r.name),
        cacheKey,
      });

      return restaurants as Restaurant[];
    },
    {
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
      staleWhileRevalidate: true,
      apiType: 'google_places_text_search',
    }
  );
}

// Optimized nearby search with location-based caching
export async function searchRestaurantsByLocationOptimized(
  lat: number,
  lng: number,
  radius: number = 5000,
  type: string = 'restaurant'
): Promise<Restaurant[]> {
  // Round coordinates to reduce cache misses for nearby locations
  const roundedLat = Math.round(lat * 1000) / 1000; // ~100m precision
  const roundedLng = Math.round(lng * 1000) / 1000;

  const cacheKey = generateCacheKey('restaurant_nearby', {
    lat: roundedLat,
    lng: roundedLng,
    radius,
    type,
  });

  return withCache(
    cacheKey,
    'restaurant_search',
    async () => {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        throw new Error('Google Places API key not configured');
      }

      const baseUrl =
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: radius.toString(),
        type,
        key: apiKey,
      });

      logger.info('Calling Google Places Nearby Search API:', {
        lat,
        lng,
        radius,
        type,
      });

      const response = await fetch(`${baseUrl}?${params.toString()}`);

      if (!response.ok) {
        logger.error('Google Places API HTTP error:', {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data: GooglePlacesResponse = await response.json();

      logger.info('Google Places API response:', {
        status: data.status,
        resultsCount: data.results?.length || 0,
        errorMessage: data.error_message,
      });

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        const errorMessage = data.error_message || data.status;
        logger.error('Google Places API error:', {
          status: data.status,
          errorMessage,
        });
        throw new Error(
          `Google Places API error: ${data.status} - ${errorMessage}`
        );
      }

      // Convert results to our Restaurant format
      const restaurants = data.results.map(convertGooglePlaceToRestaurant);

      logger.info('Google Places nearby search results:', {
        totalResults: data.results.length,
        restaurantsWithPhotos: restaurants.filter(
          (r) => r.photos && r.photos.length > 0
        ).length,
        cacheKey,
      });

      return restaurants as Restaurant[];
    },
    {
      // Use shorter cache time to avoid stale data issues
      ttl: 24 * 60 * 60 * 1000, // 1 day
      staleWhileRevalidate: true,
      apiType: 'google_places_nearby_search',
    }
  );
}

// Optimized geocoding with aggressive caching
export async function geocodeAddressOptimized(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const normalizedAddress = address.toLowerCase().trim();
  const cacheKey = generateCacheKey('geocoding', {
    address: normalizedAddress,
  });

  return withCache(
    cacheKey,
    'geocoding',
    async () => {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        throw new Error('Google Places API key not configured');
      }

      const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
      const params = new URLSearchParams({
        address,
        key: apiKey,
      });

      const response = await fetch(`${baseUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Google Geocoding API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        const errorMessage = data.error_message || data.status;
        throw new Error(
          `Google Geocoding API error: ${data.status} - ${errorMessage}`
        );
      }

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
        };
      }

      return null;
    },
    {
      ttl: 90 * 24 * 60 * 60 * 1000, // 90 days - addresses don't change often
      staleWhileRevalidate: false,
      apiType: 'google_geocoding',
    }
  );
}

// Smart restaurant search that combines multiple strategies
export async function smartRestaurantSearch(
  query: string,
  location: string,
  radius: number = 5000
): Promise<Restaurant[]> {
  // If we have a specific query, use text search for better results
  if (query && query.trim()) {
    logger.info('Using Text Search API for query:', {
      query,
      location,
      radius,
    });

    // First, geocode the location to get coordinates for the text search
    const coordinates = await geocodeAddressOptimized(location);

    if (coordinates) {
      // Use text search with location bias
      const locationParam = `${coordinates.lat},${coordinates.lng}`;
      return searchRestaurantsOptimized(query, locationParam, radius);
    } else {
      // Fallback to text search without location
      return searchRestaurantsOptimized(query, location, radius);
    }
  }

  // If no query, use nearby search to get all nearby restaurants
  const coordinates = await geocodeAddressOptimized(location);

  if (!coordinates) {
    logger.warn('Could not geocode location for nearby search:', location);
    return [];
  }

  logger.info('Using Nearby Search API (no specific query):', {
    coordinates,
    radius,
  });

  return searchRestaurantsByLocationOptimized(
    coordinates.lat,
    coordinates.lng,
    radius
  );
}

// Batch restaurant details fetching to reduce API calls
export async function getRestaurantDetailsBatch(
  placeIds: string[]
): Promise<Restaurant[]> {
  const results: Restaurant[] = [];
  const uncachedIds: string[] = [];

  // Check cache first
  for (const placeId of placeIds) {
    const cacheKey = generateCacheKey('restaurant_details', { placeId });
    const cached = await apiCache.get<Restaurant>(
      cacheKey,
      'restaurant_details'
    );

    if (cached) {
      results.push(cached);
    } else {
      uncachedIds.push(placeId);
    }
  }

  // Fetch uncached details
  if (uncachedIds.length > 0) {
    const detailsPromises = uncachedIds.map(async (placeId) => {
      const cacheKey = generateCacheKey('restaurant_details', { placeId });

      return withCache(
        cacheKey,
        'restaurant_details',
        async () => {
          const apiKey = process.env.GOOGLE_PLACES_API_KEY;
          if (!apiKey) {
            throw new Error('Google Places API key not configured');
          }

          const baseUrl =
            'https://maps.googleapis.com/maps/api/place/details/json';
          const params = new URLSearchParams({
            place_id: placeId,
            key: apiKey,
            fields:
              'place_id,name,formatted_address,geometry,types,rating,price_level,photos,formatted_phone_number,website,opening_hours,reviews',
          });

          const response = await fetch(`${baseUrl}?${params.toString()}`);

          if (!response.ok) {
            throw new Error(`Google Places API error: ${response.status}`);
          }

          const data = await response.json();

          if (data.status !== 'OK') {
            throw new Error(`Google Places API error: ${data.status}`);
          }

          return convertGooglePlaceToRestaurant(data.result) as Restaurant;
        },
        {
          ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
          staleWhileRevalidate: true,
          apiType: 'google_places_details',
        }
      );
    });

    const details = await Promise.all(detailsPromises);
    results.push(...details);
  }

  return results;
}

// Export cache stats for monitoring
export async function getCacheStats() {
  return apiCache.getStats();
}
