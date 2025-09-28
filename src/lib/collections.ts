import { connectToDatabase } from './db';
import { Collection, Restaurant } from '@/types/database';
import { ObjectId } from 'mongodb';

export async function getCollectionsByUserId(
  userId: string
): Promise<Collection[]> {
  const db = await connectToDatabase();

  // Handle both ObjectId and string userId formats
  let ownerId;
  try {
    ownerId = new ObjectId(userId);
  } catch {
    // If userId is not a valid ObjectId, treat it as a string
    ownerId = userId;
  }

  const collections = await db
    .collection('collections')
    .find({
      ownerId: ownerId,
      type: 'personal',
    })
    .sort({ createdAt: -1 })
    .toArray();

  return collections as Collection[];
}

export async function getCollectionById(
  id: string
): Promise<Collection | null> {
  const db = await connectToDatabase();
  const collection = await db
    .collection('collections')
    .findOne({ _id: new ObjectId(id) });
  return collection as Collection | null;
}

export async function createCollection(
  collectionData: Omit<Collection, '_id' | 'createdAt' | 'updatedAt'>
): Promise<Collection> {
  const db = await connectToDatabase();
  const now = new Date();

  // Handle both ObjectId and string ownerId formats
  let ownerId = collectionData.ownerId;
  if (typeof ownerId === 'string') {
    try {
      ownerId = new ObjectId(ownerId);
    } catch {
      // Keep as string if not a valid ObjectId
    }
  }

  const collection: Omit<Collection, '_id'> = {
    ...collectionData,
    ownerId,
    restaurantIds: [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection('collections').insertOne(collection);
  return { ...collection, _id: result.insertedId } as Collection;
}

export async function updateCollection(
  id: string,
  updates: Partial<Pick<Collection, 'name' | 'description'>>
): Promise<Collection | null> {
  const db = await connectToDatabase();

  const result = await db.collection('collections').findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  return result as unknown as Collection | null;
}

export async function isRestaurantInCollection(
  collectionId: string,
  restaurantId: string
): Promise<boolean> {
  const db = await connectToDatabase();

  // Check if restaurant exists in collection by either _id or googlePlaceId
  const collection = await db.collection('collections').findOne({
    _id: new ObjectId(collectionId),
    $or: [
      { 'restaurantIds._id': restaurantId },
      { 'restaurantIds.googlePlaceId': restaurantId },
      { restaurantIds: restaurantId }, // For backward compatibility with old format
    ],
  });

  return !!collection;
}

export async function addRestaurantToCollection(
  collectionId: string,
  restaurantId: string
): Promise<{ collection: Collection | null; wasAdded: boolean }> {
  const db = await connectToDatabase();

  // Check if restaurant already exists in collection
  const alreadyExists = await isRestaurantInCollection(
    collectionId,
    restaurantId
  );

  if (alreadyExists) {
    // Return the collection without adding the restaurant
    const collection = await getCollectionById(collectionId);
    return { collection, wasAdded: false };
  }

  // Add restaurant to collection
  // Store both database ID and Google Place ID for flexible matching
  let restaurantDataToStore;

  if (restaurantId.startsWith('ChIJ')) {
    // This is a Google Place ID, we need to find the database restaurant
    const restaurant = await db.collection('restaurants').findOne({
      googlePlaceId: restaurantId,
    });

    if (restaurant) {
      restaurantDataToStore = {
        _id: restaurant._id,
        googlePlaceId: restaurant.googlePlaceId,
      };
    } else {
      // If restaurant not found in database, store just the Google Place ID
      restaurantDataToStore = {
        googlePlaceId: restaurantId,
      };
    }
  } else {
    // This is a database ID, we need to find the Google Place ID
    try {
      const restaurant = await db.collection('restaurants').findOne({
        _id: new ObjectId(restaurantId),
      });

      if (restaurant) {
        restaurantDataToStore = {
          _id: restaurant._id,
          googlePlaceId: restaurant.googlePlaceId,
        };
      } else {
        // If restaurant not found, store just the database ID
        restaurantDataToStore = {
          _id: new ObjectId(restaurantId),
        };
      }
    } catch {
      // If it's not a valid ObjectId, store as is
      restaurantDataToStore = {
        _id: restaurantId,
      };
    }
  }

  const result = await db.collection('collections').findOneAndUpdate(
    { _id: new ObjectId(collectionId) },
    {
      $addToSet: { restaurantIds: restaurantDataToStore },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' }
  );

  return {
    collection: result as unknown as Collection | null,
    wasAdded: true,
  };
}

export async function removeRestaurantFromCollection(
  collectionId: string,
  restaurantId: string
): Promise<Collection | null> {
  const db = await connectToDatabase();

  const result = await db.collection('collections').findOneAndUpdate(
    { _id: new ObjectId(collectionId) },
    {
      $pull: { restaurantIds: new ObjectId(restaurantId) },
      $set: { updatedAt: new Date() },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    { returnDocument: 'after' }
  );

  return result as unknown as Collection | null;
}

export async function deleteCollection(id: string): Promise<boolean> {
  const db = await connectToDatabase();

  const result = await db
    .collection('collections')
    .deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount > 0;
}

export async function getRestaurantsByCollection(
  collectionId: string
): Promise<Restaurant[]> {
  const db = await connectToDatabase();
  const collection = await db
    .collection('collections')
    .findOne({ _id: new ObjectId(collectionId) });

  if (!collection) {
    return [];
  }

  // Extract restaurant IDs from the mixed format
  const restaurantIds = collection.restaurantIds
    .map((item) => {
      if (typeof item === 'string' || item instanceof ObjectId) {
        // Legacy format or direct ObjectId
        return item;
      } else if (item && typeof item === 'object' && '_id' in item) {
        // New format with both _id and googlePlaceId
        return item._id;
      }
      return null;
    })
    .filter((id) => id !== null);

  if (restaurantIds.length === 0) {
    return [];
  }

  const restaurants = await db
    .collection('restaurants')
    .find({
      _id: { $in: restaurantIds },
    })
    .toArray();

  return restaurants as Restaurant[];
}
