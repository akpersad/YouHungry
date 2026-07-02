import { logger } from '@/lib/logger';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserByClerkId, createUser } from './users';
import { User } from '@/types/database';

// Get admin user IDs from environment variable
const getAdminUserIds = (): string[] => {
  return process.env.ADMIN_USER_IDS?.split(',').map((id) => id.trim()) || [];
};

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    // Try to get existing user
    let user = await getUserByClerkId(userId);

    if (!user) {
      // The Clerk webhook normally creates the DB user; this fallback covers
      // the gap before it fires (or a missed delivery). Pull the real profile
      // from Clerk rather than persisting placeholder values.
      const clerkUser = await currentUser();
      const email =
        clerkUser?.primaryEmailAddress?.emailAddress ||
        clerkUser?.emailAddresses?.[0]?.emailAddress;
      const name =
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
        clerkUser?.username ||
        undefined;

      if (!email) {
        // Never persist a fabricated email — without one we can't create a
        // coherent user record; let the webhook (which has it) do it.
        logger.warn(
          'getCurrentUser: no email available from Clerk; deferring user creation to the webhook',
          { clerkId: userId }
        );
        return null;
      }

      user = await createUser({
        clerkId: userId,
        email,
        name: name || email.split('@')[0],
        smsOptIn: false,
        preferences: {
          locationSettings: {
            city: undefined,
            state: undefined,
            country: undefined,
            timezone: undefined,
          },
          notificationSettings: {
            groupDecisions: {
              started: true,
              completed: true,
            },
            friendRequests: true,
            groupInvites: true,
            smsEnabled: false,
            emailEnabled: true,
            pushEnabled: false, // Default to false - requires explicit permission
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

export function isAdminUser(user: User): boolean {
  // ADMIN_USER_IDS may hold either form of a user's id — the Mongo _id or the
  // Clerk id. Accepting both removes the silent id-form footgun (a Clerk id
  // in the env var used to never match, locking the admin out).
  const adminUserIds = getAdminUserIds();
  return (
    adminUserIds.includes(user._id.toString()) ||
    adminUserIds.includes(user.clerkId)
  );
}

export async function requireAdminAuth(): Promise<User> {
  const user = await requireAuth();

  if (!isAdminUser(user)) {
    throw new Error('Admin access required');
  }

  return user;
}
