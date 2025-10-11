import { logger } from '@/lib/logger';
import { connectToDatabase } from './db';
import { Restaurant } from '@/types/database';
import { ObjectId } from 'mongodb';
import { calculateDistance } from './utils';
import {
  searchRestaurantsWithGooglePlaces,
  getPlaceDetails,
  searchRestaurantsByLocationConsistent,
  searchRestaurantsByLocationAndQuery,
} from './google-places';

export async function getRestaurantById(
  id: string
): Promise<Restaurant | null> {
  const db = await connectToDatabase();
  const restaurant = await db
    .collection('restaurants')
    .findOne({ _id: new ObjectId(id) });
  return restaurant as Restaurant | null;
}

export async function getRestaurantByGooglePlaceId(
  googlePlaceId: string
): Promise<Restaurant | null> {
  const db = await connectToDatabase();
  const restaurant = await db
    .collection('restaurants')
    .findOne({ googlePlaceId });
  return restaurant as Restaurant | null;
}

export async function searchRestaurants(
  query: string,
  location?: string
): Promise<Restaurant[]> {
  try {
    // First try to search using Google Places API
    const googleResults = await searchRestaurantsWithGooglePlaces(
      query,
      location
    );

    // Store new restaurants in database and get the stored versions
    const storedRestaurants = await Promise.all(
      googleResults.map(async (restaurant) => {
        try {
          const existing = await getRestaurantByGooglePlaceId(
            restaurant.googlePlaceId
          );
          if (existing) {
            return existing;
          } else {
            return await createRestaurant(restaurant);
          }
        } catch (error) {
          logger.error('Error storing restaurant:', error);
          return restaurant; // Return original if storage fails
        }
      })
    );

    return storedRestaurants;
  } catch (error) {
    logger.error(
      'Google Places search failed, falling back to local search:',
      error
    );

    // Check if it's an API key issue
    if (
      error instanceof Error &&
      error.message.includes('API keys with referer restrictions')
    ) {
      logger.error(
        'Google Places API key has referer restrictions. Please configure the API key without referer restrictions for server-side use.'
      );
    }

    // Fallback to local database search
    const db = await connectToDatabase();
    const restaurants = await db
      .collection('restaurants')
      .find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { cuisine: { $regex: query, $options: 'i' } },
          { address: { $regex: query, $options: 'i' } },
        ],
      })
      .limit(20)
      .toArray();

    return restaurants as Restaurant[];
  }
}

export async function createRestaurant(
  restaurantData: Omit<Restaurant, '_id' | 'cachedAt' | 'lastUpdated'>
): Promise<Restaurant> {
  const db = await connectToDatabase();
  const now = new Date();

  const restaurant: Omit<Restaurant, '_id'> = {
    ...restaurantData,
    cachedAt: now,
    lastUpdated: now,
  };

  const result = await db.collection('restaurants').insertOne(restaurant);
  return { ...restaurant, _id: result.insertedId } as Restaurant;
}

export async function updateRestaurant(
  id: string,
  updates: Partial<Pick<Restaurant, 'priceRange' | 'timeToPickUp'>>
): Promise<Restaurant | null> {
  const db = await connectToDatabase();

  const result = await db.collection('restaurants').findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...updates,
        lastUpdated: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  return result as Restaurant | null;
}

export async function deleteRestaurant(id: string): Promise<boolean> {
  const db = await connectToDatabase();

  const result = await db
    .collection('restaurants')
    .deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount > 0;
}

// Search restaurants by location coordinates (with optional query for hybrid search)
export async function searchRestaurantsByCoordinates(
  lat: number,
  lng: number,
  radius: number = 5000,
  query?: string
): Promise<Restaurant[]> {
  try {
    // Use hybrid search: if query provided, use location+query cache, otherwise use location-only cache
    const googleResults = query
      ? await searchRestaurantsByLocationAndQuery(lat, lng, query, radius)
      : await searchRestaurantsByLocationConsistent(lat, lng, radius);

    // Store new restaurants in database and get the stored versions
    const storedRestaurants = await Promise.all(
      googleResults.map(async (restaurant) => {
        try {
          const existing = await getRestaurantByGooglePlaceId(
            restaurant.googlePlaceId
          );
          if (existing) {
            // Preserve the distance from the API result
            return { ...existing, distance: restaurant.distance };
          } else {
            const created = await createRestaurant(restaurant);
            return { ...created, distance: restaurant.distance };
          }
        } catch (error) {
          logger.error('Error storing restaurant:', error);
          return restaurant; // Return original if storage fails
        }
      })
    );

    // Enrich restaurants with missing addresses using Place Details API
    const { enrichRestaurantsWithAddresses } = await import(
      './optimized-google-places'
    );
    const enrichedRestaurants =
      await enrichRestaurantsWithAddresses(storedRestaurants);

    return enrichedRestaurants;
  } catch (error) {
    logger.error('Location-based search failed:', error);
    return [];
  }
}

// Search restaurants by specific address (fallback for when nearby search misses restaurants)
export async function searchRestaurantsByAddress(
  address: string,
  lat: number,
  lng: number
): Promise<Restaurant[]> {
  try {
    // Use Google Places Text Search API to find restaurants at specific address
    const textSearchResults = await searchRestaurantsWithGooglePlaces(
      `restaurants near ${address}`,
      `${lat},${lng}`,
      1000 // 1km radius for specific address search
    );

    // Also try searching for the exact address
    const exactAddressResults = await searchRestaurantsWithGooglePlaces(
      address,
      `${lat},${lng}`,
      1000
    );

    // Combine and deduplicate results
    const allResults = [...textSearchResults, ...exactAddressResults];
    const uniqueResults = new Map<string, Restaurant>();

    allResults.forEach((restaurant) => {
      if (restaurant.googlePlaceId) {
        uniqueResults.set(restaurant.googlePlaceId, restaurant);
      }
    });

    const combinedResults = Array.from(uniqueResults.values());

    // Store new restaurants in database and get the stored versions
    const storedRestaurants = await Promise.all(
      combinedResults.map(async (restaurant) => {
        try {
          const existing = await getRestaurantByGooglePlaceId(
            restaurant.googlePlaceId
          );
          if (existing) {
            // Calculate distance from search coordinates
            const distance = calculateDistance(
              lat,
              lng,
              restaurant.coordinates.lat,
              restaurant.coordinates.lng
            );
            return { ...existing, distance };
          } else {
            const created = await createRestaurant(restaurant);
            const distance = calculateDistance(
              lat,
              lng,
              restaurant.coordinates.lat,
              restaurant.coordinates.lng
            );
            return { ...created, distance };
          }
        } catch (error) {
          logger.error('Error storing restaurant:', error);
          return restaurant;
        }
      })
    );

    return storedRestaurants;
  } catch (error) {
    logger.error('Address-based search failed:', error);
    return [];
  }
}

// Get restaurant details by ID (ObjectId or Google Place ID)
export async function getRestaurantDetails(
  id: string
): Promise<Restaurant | null> {
  try {
    // First try to get by ObjectId (internal database ID)
    if (ObjectId.isValid(id)) {
      const restaurant = await getRestaurantById(id);
      if (restaurant) {
        return restaurant;
      }
    }

    // If not found by ObjectId, try by Google Place ID
    const existing = await getRestaurantByGooglePlaceId(id);
    if (existing) {
      return existing;
    }

    // If not in database, fetch from Google Places API
    const details = await getPlaceDetails(id);
    if (details) {
      // Store in database for future use
      await createRestaurant(details);
      return details;
    }

    return null;
  } catch (error) {
    logger.error('Error getting restaurant details:', error);
    return null;
  }
}

// Search restaurants with filters
export async function searchRestaurantsWithFilters(
  query: string,
  location?: string,
  filters?: {
    cuisine?: string;
    minRating?: number;
    maxPrice?: number;
    minPrice?: number;
  }
): Promise<Restaurant[]> {
  const results = await searchRestaurants(query, location);

  if (!filters) {
    return results;
  }

  return results.filter((restaurant) => {
    if (
      filters.cuisine &&
      !restaurant.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase())
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
}
