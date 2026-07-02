import { auth, currentUser } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { getV2Db } from './db';
import { V2DomainError } from './errors';
import type { Participant, V2UserDoc } from './schema';

/**
 * v2 auth helpers — Clerk session → lean v2 user doc. The Clerk webhook
 * normally creates the DB user; the auto-create here covers the gap before
 * it fires. v1 lesson (Phase 2 honesty pass): never persist fabricated
 * profile values — if Clerk can't give us an email yet, defer to the webhook
 * instead of inventing one.
 */

export async function getV2User(): Promise<V2UserDoc | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  // Deliberately NO catch-all: null means "no identity" (signed out, or the
  // webhook gap without an email). A DB failure must propagate and become a
  // 500 — swallowing it here would tell a validly signed-in user they are
  // unauthorized and hide the outage from error-rate monitoring.
  const { users } = await getV2Db();
  const existing = await users.findOne({ clerkId });
  if (existing) return existing;

  const profile = await currentUser();
  const email =
    profile?.primaryEmailAddress?.emailAddress ??
    profile?.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    logger.warn(
      'getV2User: no email available from Clerk; deferring user creation to the webhook',
      { clerkId }
    );
    return null;
  }

  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    email.split('@')[0];
  const now = new Date();
  // Upsert on clerkId: the users collection is shared with v1 until
  // cutover, so a concurrent webhook insert must not produce a duplicate.
  return users.findOneAndUpdate(
    { clerkId },
    {
      $set: { email, name, updatedAt: now },
      $setOnInsert: { clerkId, createdAt: now },
    },
    { upsert: true, returnDocument: 'after' }
  );
}

/** Throws when unauthenticated — API routes translate this into a 401. */
export async function requireV2User(): Promise<V2UserDoc> {
  const user = await getV2User();
  if (!user) throw new V2DomainError('Unauthorized', 401);
  return user;
}

/** The Participant identity a signed-in user acts as on forks. */
export function participantFromUser(user: V2UserDoc): Participant {
  return {
    userId: user._id,
    // First name only — fork pages are a group-chat surface, not a directory.
    displayName: user.name.split(' ')[0] || user.name,
  };
}
