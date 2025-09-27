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

export async function addRestaurantToCollection(
  collectionId: string,
  restaurantId: string
): Promise<Collection | null> {
  const db = await connectToDatabase();

  const result = await db.collection('collections').findOneAndUpdate(
    { _id: new ObjectId(collectionId) },
    {
      $addToSet: { restaurantIds: new ObjectId(restaurantId) },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' }
  );

  return result as unknown as Collection | null;
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

  const restaurants = await db
    .collection('restaurants')
    .find({
      _id: { $in: collection.restaurantIds },
    })
    .toArray();

  return restaurants as Restaurant[];
}
