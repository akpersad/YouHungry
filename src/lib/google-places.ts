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

// Search restaurants using Google Places API
export async function searchRestaurantsWithGooglePlaces(
  query: string,
  location?: string,
  radius: number = 5000
): Promise<Restaurant[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  // Build the search URL
  const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
  const params = new URLSearchParams({
    query: query, // Don't automatically append "restaurant" - let the user specify what they want
    key: apiKey,
    type: 'restaurant',
  });

  if (location) {
    params.append('location', location);
    params.append('radius', radius.toString());
  }

  try {
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

    // Convert results to our Restaurant format
    const restaurants = data.results.map(convertGooglePlaceToRestaurant);

    // Debug logging for photos
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Google Places search results:', {
        totalResults: data.results.length,
        restaurantsWithPhotos: restaurants.filter(
          (r) => r.photos && r.photos.length > 0
        ).length,
        sampleRestaurant: restaurants[0]
          ? {
              name: restaurants[0].name,
              hasPhotos: !!restaurants[0].photos,
              photoCount: restaurants[0].photos?.length || 0,
              firstPhoto: restaurants[0].photos?.[0],
            }
          : null,
      });
    }

    return restaurants as Restaurant[];
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

// Search restaurants by location (lat, lng)
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
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: radius.toString(),
    type,
    key: apiKey,
  });

  try {
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

    // Convert results to our Restaurant format
    const restaurants = data.results.map(convertGooglePlaceToRestaurant);

    // Debug logging for photos
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Google Places nearby search results:', {
        totalResults: data.results.length,
        restaurantsWithPhotos: restaurants.filter(
          (r) => r.photos && r.photos.length > 0
        ).length,
        sampleRestaurant: restaurants[0]
          ? {
              name: restaurants[0].name,
              hasPhotos: !!restaurants[0].photos,
              photoCount: restaurants[0].photos?.length || 0,
              firstPhoto: restaurants[0].photos?.[0],
            }
          : null,
      });
    }

    return restaurants as Restaurant[];
  } catch (error) {
    logger.error('Google Places API nearby search error:', error);
    return [];
  }
}

// Search restaurants by location with consistent results across different radius values
// This function uses intelligent caching and progressive search to minimize API costs
export async function searchRestaurantsByLocationConsistent(
  lat: number,
  lng: number,
  requestedRadius: number = 5000,
  type: string = 'restaurant'
): Promise<Restaurant[]> {
  const requestedRadiusInMiles = requestedRadius / 1609.34; // Convert meters to miles

  // Check if we have cached results for this location
  const cachedResults = await getCachedRestaurantsForLocation(lat, lng);

  if (cachedResults && cachedResults.length > 0) {
    // Use cached results and filter by requested radius
    const restaurantsWithDistance = cachedResults.map((restaurant) => {
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
    });

    const filteredRestaurants = restaurantsWithDistance.filter(
      (restaurant) => restaurant.distance <= requestedRadiusInMiles
    );

    // Sort by distance first, then by rating (descending)
    const sortedRestaurants = filteredRestaurants.sort((a, b) => {
      if (Math.abs(a.distance - b.distance) > 0.1) {
        return a.distance - b.distance;
      }
      return b.rating - a.rating;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return sortedRestaurants.map(({ distance, ...restaurant }) => restaurant);
  }

  // No cached results, fetch from Google Places API
  // Use a reasonable default radius (10 miles) to balance cost and coverage
  const defaultRadius = 16093; // 10 miles in meters
  const searchRadius = Math.max(requestedRadius, defaultRadius);

  const googleResults = await searchRestaurantsByLocation(
    lat,
    lng,
    searchRadius,
    type
  );

  // Cache the results for future use
  await cacheRestaurantsForLocation(lat, lng, googleResults);

  // Calculate distances and filter by requested radius
  const restaurantsWithDistance = googleResults.map((restaurant) => {
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
  });

  const filteredRestaurants = restaurantsWithDistance.filter(
    (restaurant) => restaurant.distance <= requestedRadiusInMiles
  );

  // Sort by distance first, then by rating (descending)
  const sortedRestaurants = filteredRestaurants.sort((a, b) => {
    if (Math.abs(a.distance - b.distance) > 0.1) {
      return a.distance - b.distance;
    }
    return b.rating - a.rating;
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return sortedRestaurants.map(({ distance, ...restaurant }) => restaurant);
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
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
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
