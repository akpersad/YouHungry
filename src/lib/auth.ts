import { logger } from '@/lib/logger';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId, createUser } from './users';
import { User } from '@/types/database';

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    // Try to get existing user
    let user = await getUserByClerkId(userId);

    if (!user) {
      // User doesn't exist in our database, create them
      // For development, we'll create a basic user record
      user = await createUser({
        clerkId: userId,
        email: 'user@example.com', // Placeholder for development
        name: 'User', // Placeholder for development
        smsOptIn: false,
        preferences: {
          notificationSettings: {
            groupDecisions: true,
            friendRequests: true,
            groupInvites: true,
          },
        },
      });
    }

    return user;
  } catch (error) {
    logger.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}
