import { connectToDatabase } from './db';
import { User } from '@/types/database';
import { ObjectId } from 'mongodb';

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  const db = await connectToDatabase();
  const user = await db.collection('users').findOne({ clerkId });
  return user as User | null;
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await connectToDatabase();
  const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
  return user as User | null;
}

export async function createUser(
  userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>
): Promise<User> {
  const db = await connectToDatabase();
  const now = new Date();

  const user: Omit<User, '_id'> = {
    ...userData,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection('users').insertOne(user);
  return { ...user, _id: result.insertedId } as User;
}

export async function updateUser(
  id: string,
  updates: Partial<
    Pick<
      User,
      | 'email'
      | 'name'
      | 'city'
      | 'profilePicture'
      | 'smsOptIn'
      | 'smsPhoneNumber'
      | 'preferences'
    >
  >
): Promise<User | null> {
  const db = await connectToDatabase();

  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  return result as User | null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = await connectToDatabase();

  const result = await db
    .collection('users')
    .deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount > 0;
}
