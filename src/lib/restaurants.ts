import { connectToDatabase } from './db';
import { Restaurant } from '@/types/database';
import { ObjectId } from 'mongodb';

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

export async function searchRestaurants(query: string): Promise<Restaurant[]> {
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
