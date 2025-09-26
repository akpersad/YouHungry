import { connectToDatabase } from './db';
import { Restaurant } from '@/types/database';
import { ObjectId } from 'mongodb';
import {
  searchRestaurantsWithGooglePlaces,
  getPlaceDetails,
  searchRestaurantsByLocation,
  searchRestaurantsByLocationConsistent,
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

    // Store new restaurants in database for future local searches
    await Promise.all(
      googleResults.map(async (restaurant) => {
        try {
          const existing = await getRestaurantByGooglePlaceId(
            restaurant.googlePlaceId
          );
          if (!existing) {
            await createRestaurant(restaurant);
          }
        } catch (error) {
          console.error('Error storing restaurant:', error);
        }
      })
    );

    return googleResults;
  } catch (error) {
    console.error(
      'Google Places search failed, falling back to local search:',
      error
    );

    // Check if it's an API key issue
    if (
      error instanceof Error &&
      error.message.includes('API keys with referer restrictions')
    ) {
      console.error(
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

// Search restaurants by location coordinates
export async function searchRestaurantsByCoordinates(
  lat: number,
  lng: number,
  radius: number = 5000
): Promise<Restaurant[]> {
  try {
    // Use the consistent search function to ensure stable results across different radius values
    const googleResults = await searchRestaurantsByLocationConsistent(
      lat,
      lng,
      radius
    );

    // Store new restaurants in database
    await Promise.all(
      googleResults.map(async (restaurant) => {
        try {
          const existing = await getRestaurantByGooglePlaceId(
            restaurant.googlePlaceId
          );
          if (!existing) {
            await createRestaurant(restaurant);
          }
        } catch (error) {
          console.error('Error storing restaurant:', error);
        }
      })
    );

    return googleResults;
  } catch (error) {
    console.error('Location-based search failed:', error);
    return [];
  }
}

// Get restaurant details from Google Places API
export async function getRestaurantDetails(
  googlePlaceId: string
): Promise<Restaurant | null> {
  try {
    // First check if we have it in our database
    const existing = await getRestaurantByGooglePlaceId(googlePlaceId);
    if (existing) {
      return existing;
    }

    // If not, fetch from Google Places API
    const details = await getPlaceDetails(googlePlaceId);
    if (details) {
      // Store in database for future use
      await createRestaurant(details);
      return details;
    }

    return null;
  } catch (error) {
    console.error('Error getting restaurant details:', error);
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
