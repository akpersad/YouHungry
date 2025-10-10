import { logger } from '@/lib/logger';
import { Restaurant } from '@/types/database';
import { calculateDistance } from './utils';
import { connectToDatabase } from './db';

// Google Places API types
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

interface GooglePlaceDetailsResponse {
  result: GooglePlaceResult & {
    reviews?: Array<{
      author_name: string;
      rating: number;
      text: string;
      time: number;
    }>;
  };
  status: string;
}

// Convert Google Place result to our Restaurant interface
function convertGooglePlaceToRestaurant(
  place: GooglePlaceResult
): Omit<Restaurant, '_id' | 'cachedAt' | 'lastUpdated'> {
  // Determine cuisine type from Google's types
  let cuisine = 'Restaurant';

  // Look for specific establishment types first
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
  } else {
    // For restaurants without specific types, we'll need to use Place Details
    // to get more specific cuisine information. For now, keep as 'Restaurant'
    cuisine = 'Restaurant';
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
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Generated photo URL:', {
          photoUrl,
          photoReference: photo.photo_reference,
          hasApiKey: !!process.env.GOOGLE_PLACES_API_KEY,
          apiKeyLength: process.env.GOOGLE_PLACES_API_KEY?.length,
        });
      }
      return photoUrl;
    }),
    phoneNumber: place.formatted_phone_number,
    website: place.website,
    hours: Object.keys(hours).length > 0 ? hours : undefined,
  };
}

// Search restaurants using Google Places API - with pagination support
export async function searchRestaurantsWithGooglePlaces(
  query: string,
  location?: string,
  radius: number = 5000
): Promise<Restaurant[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

  let allRestaurants: Restaurant[] = [];
  let nextPageToken: string | undefined;
  let pageCount = 0;
  const MAX_PAGES = 3; // Google Places returns max 60 results (3 pages of 20)

  try {
    // Fetch all pages of results
    do {
      const params = new URLSearchParams({
        query: query, // Don't automatically append "restaurant" - let the user specify what they want
        key: apiKey,
        type: 'restaurant',
      });

      if (location) {
        params.append('location', location);
        params.append('radius', radius.toString());
      }

      // Add page token if we have one (for subsequent pages)
      if (nextPageToken) {
        params.append('pagetoken', nextPageToken);
      }

      const response = await fetch(`${baseUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data: GooglePlacesResponse = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        const errorMessage = data.error_message || data.status;
        throw new Error(
          `Google Places API error: ${data.status} - ${errorMessage}`
        );
      }

      // Convert results to our Restaurant format and add to collection
      const restaurants = data.results.map(convertGooglePlaceToRestaurant);
      allRestaurants = [...allRestaurants, ...(restaurants as Restaurant[])];

      // Get next page token if available
      nextPageToken = data.next_page_token;
      pageCount++;

      logger.debug(
        `Fetched text search page ${pageCount} with ${restaurants.length} restaurants`,
        {
          hasNextPage: !!nextPageToken,
          totalSoFar: allRestaurants.length,
          query,
        }
      );

      // Google requires a short delay before using next_page_token
      if (nextPageToken && pageCount < MAX_PAGES) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
      }
    } while (nextPageToken && pageCount < MAX_PAGES);

    // Debug logging for photos
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Google Places text search complete:', {
        query,
        totalPages: pageCount,
        totalResults: allRestaurants.length,
        restaurantsWithPhotos: allRestaurants.filter(
          (r) => r.photos && r.photos.length > 0
        ).length,
      });
    }

    return allRestaurants as Restaurant[];
  } catch (error) {
    logger.error('Google Places API search error:', error);
    throw error;
  }
}

// Get detailed information about a specific place
export async function getPlaceDetails(
  placeId: string
): Promise<Restaurant | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
  const params = new URLSearchParams({
    place_id: placeId,
    key: apiKey,
    fields:
      'place_id,name,formatted_address,geometry,types,rating,price_level,photos,formatted_phone_number,website,opening_hours,reviews',
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data: GooglePlaceDetailsResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const restaurant = convertGooglePlaceToRestaurant(data.result);
    return restaurant as Restaurant;
  } catch (error) {
    logger.error('Google Places API details error:', error);
    throw error;
  }
}

// Search restaurants by location (lat, lng) - with pagination support
export async function searchRestaurantsByLocation(
  lat: number,
  lng: number,
  radius: number = 5000,
  type: string = 'restaurant'
): Promise<Restaurant[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  const baseUrl =
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

  let allRestaurants: Restaurant[] = [];
  let nextPageToken: string | undefined;
  let pageCount = 0;
  const MAX_PAGES = 3; // Google Places returns max 60 results (3 pages of 20)

  try {
    // Fetch all pages of results
    do {
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: radius.toString(),
        type,
        key: apiKey,
      });

      // Add page token if we have one (for subsequent pages)
      if (nextPageToken) {
        params.append('pagetoken', nextPageToken);
      }

      const response = await fetch(`${baseUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data: GooglePlacesResponse = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        const errorMessage = data.error_message || data.status;
        throw new Error(
          `Google Places API error: ${data.status} - ${errorMessage}`
        );
      }

      // Convert results to our Restaurant format and add to collection
      const restaurants = data.results.map(convertGooglePlaceToRestaurant);
      allRestaurants = [...allRestaurants, ...(restaurants as Restaurant[])];

      // Get next page token if available
      nextPageToken = data.next_page_token;
      pageCount++;

      logger.debug(
        `Fetched page ${pageCount} with ${restaurants.length} restaurants`,
        {
          hasNextPage: !!nextPageToken,
          totalSoFar: allRestaurants.length,
        }
      );

      // Google requires a short delay before using next_page_token
      // https://developers.google.com/maps/documentation/places/web-service/search-nearby#PlaceSearchPaging
      if (nextPageToken && pageCount < MAX_PAGES) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
      }
    } while (nextPageToken && pageCount < MAX_PAGES);

    // Debug logging for photos
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Google Places nearby search complete:', {
        totalPages: pageCount,
        totalResults: allRestaurants.length,
        restaurantsWithPhotos: allRestaurants.filter(
          (r) => r.photos && r.photos.length > 0
        ).length,
      });
    }

    return allRestaurants as Restaurant[];
  } catch (error) {
    logger.error('Google Places API nearby search error:', error);
    return allRestaurants.length > 0 ? allRestaurants : []; // Return what we have so far
  }
}

// Search restaurants by location with consistent results across different radius values
// This function uses intelligent caching and progressive search to minimize API costs
// ALWAYS fetches 25 miles of data and returns ALL results with distance calculated
export async function searchRestaurantsByLocationConsistent(
  lat: number,
  lng: number,
  _requestedRadius: number = 5000,
  type: string = 'restaurant'
): Promise<Restaurant[]> {
  // Check if we have cached results for this location (location-only cache)
  const cachedResults = await getCachedRestaurantsForLocation(lat, lng);

  let allRestaurants: Restaurant[];

  if (cachedResults && cachedResults.length > 0) {
    logger.debug(
      `Using cached results for location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    );
    allRestaurants = cachedResults;
  } else {
    // No cached results, fetch from Google Places API
    // ALWAYS fetch 25 miles to maximize coverage and enable client-side filtering
    const MAX_SEARCH_RADIUS = 40234; // 25 miles in meters

    const googleResults = await searchRestaurantsByLocation(
      lat,
      lng,
      MAX_SEARCH_RADIUS,
      type
    );

    // Cache the results for future use
    await cacheRestaurantsForLocation(lat, lng, googleResults);
    allRestaurants = googleResults;
  }

  // Calculate distances for all restaurants and attach to the object
  const restaurantsWithDistance = allRestaurants.map((restaurant) => {
    const distance = calculateDistance(
      lat,
      lng,
      restaurant.coordinates.lat,
      restaurant.coordinates.lng
    );
    return {
      ...restaurant,
      distance,
    };
  }) as Restaurant[];

  // Return ALL restaurants with distance calculated (no filtering here - done on client)
  // Sort by distance by default
  return restaurantsWithDistance.sort((a, b) => {
    const distA = a.distance || 0;
    const distB = b.distance || 0;
    if (Math.abs(distA - distB) > 0.1) {
      return distA - distB;
    }
    return b.rating - a.rating;
  });
}

// Search restaurants by location AND text query with separate caching
// This enables text-specific searches while maintaining location-only cache
export async function searchRestaurantsByLocationAndQuery(
  lat: number,
  lng: number,
  query: string,
  _requestedRadius: number = 5000,
  _type: string = 'restaurant'
): Promise<Restaurant[]> {
  // Check if we have cached results for this location + query combination
  const cachedResults = await getCachedRestaurantsForLocationAndQuery(
    lat,
    lng,
    query
  );

  let allRestaurants: Restaurant[];

  if (cachedResults && cachedResults.length > 0) {
    logger.debug(
      `Using cached results for location+query (${lat.toFixed(4)}, ${lng.toFixed(4)}, "${query}")`
    );
    allRestaurants = cachedResults;
  } else {
    // No cached results, fetch from Google Places API with text search
    // ALWAYS fetch 25 miles to maximize coverage and enable client-side filtering
    const MAX_SEARCH_RADIUS = 40234; // 25 miles in meters

    const googleResults = await searchRestaurantsWithGooglePlaces(
      query,
      `${lat},${lng}`,
      MAX_SEARCH_RADIUS
    );

    // Cache the results for future use (with query in cache key)
    await cacheRestaurantsForLocationAndQuery(lat, lng, query, googleResults);
    allRestaurants = googleResults;
  }

  // Calculate distances for all restaurants and attach to the object
  const restaurantsWithDistance = allRestaurants.map((restaurant) => {
    const distance = calculateDistance(
      lat,
      lng,
      restaurant.coordinates.lat,
      restaurant.coordinates.lng
    );
    return {
      ...restaurant,
      distance,
    };
  }) as Restaurant[];

  // Return ALL restaurants with distance calculated (no filtering here - done on client)
  // Sort by distance by default
  return restaurantsWithDistance.sort((a, b) => {
    const distA = a.distance || 0;
    const distB = b.distance || 0;
    if (Math.abs(distA - distB) > 0.1) {
      return distA - distB;
    }
    return b.rating - a.rating;
  });
}

// Cache restaurants for a specific location
async function cacheRestaurantsForLocation(
  lat: number,
  lng: number,
  restaurants: Restaurant[]
): Promise<void> {
  try {
    const db = await connectToDatabase();
    const locationKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

    const cacheData = {
      locationKey,
      lat,
      lng,
      restaurants,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    };

    // Store in a cache collection
    await db
      .collection('location_cache')
      .replaceOne({ locationKey }, cacheData, { upsert: true });

    logger.debug(
      `Cached ${restaurants.length} restaurants for location ${locationKey}`
    );
  } catch (error) {
    logger.error('Error caching restaurants:', error);
  }
}

// Get cached restaurants for a location
async function getCachedRestaurantsForLocation(
  lat: number,
  lng: number
): Promise<Restaurant[] | null> {
  try {
    const db = await connectToDatabase();
    const locationKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

    const cacheEntry = await db.collection('location_cache').findOne({
      locationKey,
      expiresAt: { $gt: new Date() }, // Only return if not expired
    });

    if (cacheEntry && cacheEntry.restaurants) {
      logger.debug(`Using cached results for location ${locationKey}`);
      return cacheEntry.restaurants;
    }

    return null;
  } catch (error) {
    logger.error('Error getting cached restaurants:', error);
    return null;
  }
}

// Cache restaurants for a specific location + query combination
async function cacheRestaurantsForLocationAndQuery(
  lat: number,
  lng: number,
  query: string,
  restaurants: Restaurant[]
): Promise<void> {
  try {
    const db = await connectToDatabase();
    const locationKey = `${lat.toFixed(4)},${lng.toFixed(4)}:${query.toLowerCase().trim()}`;

    const cacheData = {
      locationKey,
      lat,
      lng,
      query: query.toLowerCase().trim(),
      restaurants,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    };

    // Store in the same cache collection but with query in the key
    await db
      .collection('location_cache')
      .replaceOne({ locationKey }, cacheData, { upsert: true });

    logger.debug(
      `Cached ${restaurants.length} restaurants for location+query ${locationKey}`
    );
  } catch (error) {
    logger.error('Error caching restaurants for location+query:', error);
  }
}

// Get cached restaurants for a location + query combination
async function getCachedRestaurantsForLocationAndQuery(
  lat: number,
  lng: number,
  query: string
): Promise<Restaurant[] | null> {
  try {
    const db = await connectToDatabase();
    const locationKey = `${lat.toFixed(4)},${lng.toFixed(4)}:${query.toLowerCase().trim()}`;

    const cacheEntry = await db.collection('location_cache').findOne({
      locationKey,
      expiresAt: { $gt: new Date() }, // Only return if not expired
    });

    if (cacheEntry && cacheEntry.restaurants) {
      logger.debug(`Using cached results for location+query ${locationKey}`);
      return cacheEntry.restaurants;
    }

    return null;
  } catch (error) {
    logger.error('Error getting cached restaurants for location+query:', error);
    return null;
  }
}

// Clean up expired cache entries (call this periodically)
export async function cleanupExpiredCache(): Promise<void> {
  try {
    const db = await connectToDatabase();
    const result = await db.collection('location_cache').deleteMany({
      expiresAt: { $lt: new Date() },
    });

    if (result.deletedCount > 0) {
      logger.debug(`Cleaned up ${result.deletedCount} expired cache entries`);
    }
  } catch (error) {
    logger.error('Error cleaning up cache:', error);
  }
}

// Get location cache statistics for monitoring
export async function getLocationCacheStats(): Promise<{
  totalEntries: number;
  locationOnlyEntries: number;
  locationQueryEntries: number;
  oldestEntry?: Date;
  newestEntry?: Date;
  averageRestaurantsPerEntry: number;
  estimatedSizeKB: number;
}> {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('location_cache');

    // Get total count
    const totalEntries = await collection.countDocuments();

    // Get location-only entries (no query in locationKey)
    const locationOnlyEntries = await collection.countDocuments({
      locationKey: { $not: { $regex: ':' } },
    });

    // Get location+query entries (has query in locationKey)
    const locationQueryEntries = await collection.countDocuments({
      locationKey: { $regex: ':' },
    });

    // Get oldest and newest entries
    const oldestEntry = await collection
      .find({})
      .sort({ cachedAt: 1 })
      .limit(1)
      .toArray();
    const newestEntry = await collection
      .find({})
      .sort({ cachedAt: -1 })
      .limit(1)
      .toArray();

    // Calculate average restaurants per entry
    const allEntries = await collection.find({}).toArray();
    const totalRestaurants = allEntries.reduce(
      (sum, entry) =>
        sum +
        ((entry as { restaurants?: Restaurant[] }).restaurants?.length || 0),
      0
    );
    const averageRestaurantsPerEntry =
      totalEntries > 0 ? totalRestaurants / totalEntries : 0;

    // Estimate size in KB (rough estimate based on document count and average doc size)
    const estimatedSizeKB = totalRestaurants * 2; // ~2KB per restaurant estimate

    return {
      totalEntries,
      locationOnlyEntries,
      locationQueryEntries,
      oldestEntry: oldestEntry[0]?.cachedAt,
      newestEntry: newestEntry[0]?.cachedAt,
      averageRestaurantsPerEntry:
        Math.round(averageRestaurantsPerEntry * 10) / 10,
      estimatedSizeKB: Math.round(estimatedSizeKB),
    };
  } catch (error) {
    logger.error('Error getting location cache stats:', error);
    return {
      totalEntries: 0,
      locationOnlyEntries: 0,
      locationQueryEntries: 0,
      averageRestaurantsPerEntry: 0,
      estimatedSizeKB: 0,
    };
  }
}

// Clear cache for a specific location (admin function)
export async function clearLocationCache(
  lat?: number,
  lng?: number
): Promise<number> {
  try {
    const db = await connectToDatabase();

    if (lat !== undefined && lng !== undefined) {
      // Clear specific location (both location-only and location+query caches)
      const locationPrefix = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      const result = await db.collection('location_cache').deleteMany({
        locationKey: { $regex: `^${locationPrefix}` },
      });
      logger.info(
        `Cleared ${result.deletedCount} cache entries for location (${lat}, ${lng})`
      );
      return result.deletedCount;
    } else {
      // Clear all location caches
      const result = await db.collection('location_cache').deleteMany({});
      logger.info(`Cleared all ${result.deletedCount} location cache entries`);
      return result.deletedCount;
    }
  } catch (error) {
    logger.error('Error clearing location cache:', error);
    throw error;
  }
}

// Geocode an address to get coordinates
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  const params = new URLSearchParams({
    address,
    key: apiKey,
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    // Enhanced error logging for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Geocoding API response:', {
        status: data.status,
        error_message: data.error_message,
        address,
        hasResults: data.results && data.results.length > 0,
      });
    }

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
  } catch (error) {
    logger.error('Geocoding error:', error);
    throw error;
  }
}

// Get user's current location (client-side)
export function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}
