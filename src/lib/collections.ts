import { connectToDatabase } from './db';
import { Collection, Restaurant } from '@/types/database';
import { ObjectId } from 'mongodb';
import { getUserByClerkId } from './users';

export async function getCollectionsByUserId(
  userId: string
): Promise<Collection[]> {
  const db = await connectToDatabase();

  console.log('getCollectionsByUserId called with userId:', userId);

  let ownerId;

  // First, try to find the user by Clerk ID
  console.log('Looking up user by Clerk ID:', userId);
  const user = await getUserByClerkId(userId);
  if (user) {
    // Found user by Clerk ID, use their database ID
    ownerId = user._id;
    console.log('✅ Found user by Clerk ID, using database ID:', ownerId);
  } else {
    console.log('❌ User not found by Clerk ID, trying as database ID');
    // Try to use userId as database ID directly
    try {
      ownerId = new ObjectId(userId);
      console.log('Using userId as ObjectId:', ownerId);
    } catch {
      // If userId is not a valid ObjectId, treat it as a string
      ownerId = userId;
      console.log('Using userId as string:', ownerId);
    }
  }

  // First try with database ID
  let query = {
    ownerId: ownerId,
    type: 'personal',
  };
  console.log('Querying collections with database ID:', query);

  let collections = await db
    .collection('collections')
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  console.log('Found collections with database ID:', collections);

  // If no collections found and we have a user, also try with Clerk ID
  if (collections.length === 0 && user) {
    query = {
      ownerId: userId, // Use the original Clerk ID
      type: 'personal',
    };
    console.log(
      'No collections found with database ID, trying with Clerk ID:',
      query
    );

    collections = await db
      .collection('collections')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    console.log('Found collections with Clerk ID:', collections);
  }

  console.log('Final collections result:', collections);
  return collections as Collection[];
}

export async function getGroupCollectionsByUserId(
  userId: string
): Promise<Collection[]> {
  const db = await connectToDatabase();

  console.log('getGroupCollectionsByUserId called with userId:', userId);

  let userIdObj;

  // First, try to find the user by Clerk ID
  console.log('Looking up user by Clerk ID for group collections:', userId);
  const user = await getUserByClerkId(userId);
  if (user) {
    // Found user by Clerk ID, use their database ID
    userIdObj = user._id;
    console.log(
      '✅ Found user by Clerk ID for group collections, using database ID:',
      userIdObj
    );
  } else {
    console.log(
      '❌ User not found by Clerk ID for group collections, trying as database ID'
    );
    // Try to use userId as database ID directly
    try {
      userIdObj = new ObjectId(userId);
      console.log('Using userId as ObjectId for group collections:', userIdObj);
    } catch {
      // If userId is not a valid ObjectId, treat it as a string
      userIdObj = userId;
      console.log('Using userId as string for group collections:', userIdObj);
    }
  }

  // Find all groups where the user is a member
  const groupQuery = {
    $or: [{ adminIds: userIdObj }, { memberIds: userIdObj }],
  };
  console.log('Querying groups with:', groupQuery);

  const groups = await db.collection('groups').find(groupQuery).toArray();

  console.log('Found groups:', groups);

  if (groups.length === 0) {
    console.log('No groups found, returning empty array');
    return [];
  }

  // Get all group collections
  const groupIds = groups.map((group) => group._id);
  const collections = await db
    .collection('collections')
    .find({
      ownerId: { $in: groupIds },
      type: 'group',
    })
    .sort({ createdAt: -1 })
    .toArray();

  return collections as Collection[];
}

export async function getAllCollectionsByUserId(
  userId: string
): Promise<{ personal: Collection[]; group: Collection[] }> {
  const [personalCollections, groupCollections] = await Promise.all([
    getCollectionsByUserId(userId),
    getGroupCollectionsByUserId(userId),
  ]);

  return {
    personal: personalCollections,
    group: groupCollections,
  };
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

  // If this is a group collection, update the group's collectionIds
  if (collectionData.type === 'group') {
    await db.collection('groups').updateOne(
      { _id: ownerId },
      {
        $addToSet: { collectionIds: result.insertedId },
        $set: { updatedAt: now },
      }
    );
  }

  return { ...collection, _id: result.insertedId } as Collection;
}

export async function createGroupCollection(
  groupId: string,
  name: string,
  description: string | undefined,
  userId: string
): Promise<Collection> {
  const db = await connectToDatabase();

  // Verify user is a member of the group
  const group = await db.collection('groups').findOne({
    _id: new ObjectId(groupId),
    $or: [
      { adminIds: new ObjectId(userId) },
      { memberIds: new ObjectId(userId) },
    ],
  });

  if (!group) {
    throw new Error('Group not found or user is not a member');
  }

  return createCollection({
    name: name.trim(),
    description: description?.trim() || undefined,
    type: 'group',
    ownerId: new ObjectId(groupId),
    restaurantIds: [],
  });
}

export async function canUserAccessCollection(
  collectionId: string,
  userId: string
): Promise<boolean> {
  const db = await connectToDatabase();

  const collection = await db.collection('collections').findOne({
    _id: new ObjectId(collectionId),
  });

  if (!collection) {
    return false;
  }

  // Personal collections - user must be the owner
  if (collection.type === 'personal') {
    return collection.ownerId.toString() === userId;
  }

  // Group collections - user must be a member of the group
  if (collection.type === 'group') {
    const group = await db.collection('groups').findOne({
      _id: collection.ownerId,
      $or: [
        { adminIds: new ObjectId(userId) },
        { memberIds: new ObjectId(userId) },
      ],
    });

    return !!group;
  }

  return false;
}

export async function canUserModifyCollection(
  collectionId: string,
  userId: string
): Promise<boolean> {
  const db = await connectToDatabase();

  const collection = await db.collection('collections').findOne({
    _id: new ObjectId(collectionId),
  });

  if (!collection) {
    return false;
  }

  // Personal collections - user must be the owner
  if (collection.type === 'personal') {
    return collection.ownerId.toString() === userId;
  }

  // Group collections - user must be an admin of the group
  if (collection.type === 'group') {
    const group = await db.collection('groups').findOne({
      _id: collection.ownerId,
      adminIds: new ObjectId(userId),
    });

    return !!group;
  }

  return false;
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
    .map(
      (
        item:
          | ObjectId
          | { _id: ObjectId; googlePlaceId: string }
          | { googlePlaceId: string }
          | string
      ) => {
        if (typeof item === 'string' || item instanceof ObjectId) {
          // Legacy format or direct ObjectId
          return item;
        } else if (item && typeof item === 'object' && '_id' in item) {
          // New format with both _id and googlePlaceId
          return item._id;
        } else if (
          item &&
          typeof item === 'object' &&
          'toString' in item &&
          'valueOf' in item
        ) {
          // Serialized ObjectId (from mock data)
          return new ObjectId(item.toString());
        }
        return null;
      }
    )
    .filter(
      (id: ObjectId | string | null): id is ObjectId | string => id !== null
    );

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
