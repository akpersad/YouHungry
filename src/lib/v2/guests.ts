import { ObjectId } from 'mongodb';
import { getV2Db } from './db';
import { V2DomainError, notFound } from './errors';
import { mintGuestId, signGuestCookie, verifyGuestCookie } from './tokens';
import type { GuestDoc, Participant } from './schema';

/**
 * Guest identity domain (Phase 4). A guest is a browser that touched a fork
 * link: a 128-bit random `guestId` travelling in a signed httpOnly cookie,
 * a display name, and activity timestamps — zero PII by design (schema.ts).
 *
 * A guest doc is minted lazily on the first WRITE (casting a vote), never on
 * a page view — lurkers don't get database rows. "Claim your votes" points
 * the doc at a user (`claimedByUserId`) and stops there: historical fork
 * docs keep the guestId, and weight/history/viewer queries follow the claim
 * pointer (see forks.ts).
 */

export const GUEST_COOKIE = 'fitr_guest';

/**
 * Cookie policy: httpOnly (scripts never read identity), Lax (survives the
 * group-chat link tap), a year long (a guest identity should outlive one
 * dinner). Value is signed — see tokens.ts.
 */
export const GUEST_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 365 * 24 * 60 * 60,
} as const;

/** Resolve a signed cookie value to its GuestDoc; null on forged/unknown. */
export async function findGuestByCookie(
  cookieValue: string | undefined | null
): Promise<GuestDoc | null> {
  if (!cookieValue) return null;
  const guestId = verifyGuestCookie(cookieValue);
  if (!guestId) return null;
  const { guests } = await getV2Db();
  return guests.findOne({ guestId });
}

/** Mint a new guest. Returns the doc and the signed cookie value to set. */
export async function createGuest(
  displayName: string
): Promise<{ guest: GuestDoc; cookieValue: string }> {
  const { guests } = await getV2Db();
  const now = new Date();
  const doc: Omit<GuestDoc, '_id'> = {
    guestId: mintGuestId(),
    displayName: displayName.trim(),
    createdAt: now,
    lastSeenAt: now,
  };
  const inserted = await guests.insertOne(doc as GuestDoc);
  return {
    guest: { ...doc, _id: inserted.insertedId } as GuestDoc,
    cookieValue: signGuestCookie(doc.guestId),
  };
}

/** Bump lastSeenAt; optionally rename (guests can re-pick their name). */
export async function touchGuest(
  guestId: string,
  displayName?: string
): Promise<GuestDoc | null> {
  const { guests } = await getV2Db();
  return guests.findOneAndUpdate(
    { guestId },
    {
      $set: {
        lastSeenAt: new Date(),
        ...(displayName ? { displayName: displayName.trim() } : {}),
      },
    },
    { returnDocument: 'after' }
  );
}

export function participantFromGuest(guest: GuestDoc): Participant {
  return { guestId: guest.guestId, displayName: guest.displayName };
}

/**
 * Claim a guest identity for a signed-in user. Idempotent for the same
 * user; a guest already claimed by someone else is a 409 — identities are
 * never transferred.
 */
export async function claimGuest(
  guestId: string,
  userId: ObjectId
): Promise<GuestDoc> {
  const { guests } = await getV2Db();
  const claimed = await guests.findOneAndUpdate(
    {
      guestId,
      $or: [
        { claimedByUserId: { $exists: false } },
        { claimedByUserId: userId },
      ],
    },
    { $set: { claimedByUserId: userId, lastSeenAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (claimed) return claimed;

  const existing = await guests.findOne({ guestId });
  if (!existing) throw notFound('Guest');
  throw new V2DomainError(
    'These votes were already claimed by another account',
    409
  );
}

/**
 * Guest identities a user has claimed — the claim pointer, followed by
 * weight-history and viewer-identity queries. Bounded: one browser per
 * device ever claims, so this is a handful of ids at most.
 */
export async function getClaimedGuestIds(userId: ObjectId): Promise<string[]> {
  const { guests } = await getV2Db();
  const docs = await guests
    .find({ claimedByUserId: userId })
    .limit(20)
    .toArray();
  return docs.map((doc) => doc.guestId);
}
