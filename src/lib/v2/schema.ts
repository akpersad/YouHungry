import { ObjectId } from 'mongodb';
import type { Db, IndexDescription } from 'mongodb';

/**
 * v2 data model — CHARTER.md's three lanes expressed as five collections.
 *
 * These live in the same Atlas cluster/database as v1 under new names
 * (no v1 collection is read or mutated before cutover). Every index is
 * code-defined here and applied by `ensureV2Indexes()` — the seed script
 * and (later) a deploy hook call it, so environments never drift.
 *
 * Identity model (one rule, no v1-style mixing): everything that refers to
 * a person uses a `Participant` — EITHER a v2 user (`userId`, ObjectId of
 * the `users` doc) OR a guest (`guestId`, opaque random token), never both.
 * Clerk ids appear only on the user doc itself.
 */

// ---------------------------------------------------------------------------
// Collection names
// ---------------------------------------------------------------------------

export const V2_COLLECTIONS = {
  forks: 'forks',
  places: 'places',
  lists: 'lists',
  crews: 'crews',
  guests: 'guests',
  /** Shared with v1 in prod until cutover; v2 only touches the lean fields. */
  users: 'users',
} as const;

// ---------------------------------------------------------------------------
// Participants (users + guests)
// ---------------------------------------------------------------------------

/**
 * A person taking part in a fork. Exactly one of `userId`/`guestId` is set.
 * `displayName` is denormalized so fork pages render without joins — for
 * guests it is the only identity we ever hold (no PII by design).
 */
export interface Participant {
  userId?: ObjectId;
  guestId?: string;
  displayName: string;
}

/**
 * Guest identity doc. Created the first time a browser interacts with a
 * fork link; the `guestId` (a 128-bit random token) travels in a signed
 * httpOnly cookie — see `tokens.ts` for the signing design. Guests carry
 * zero PII: a display name and activity timestamps, nothing else.
 * "Claim your votes" (Phase 4) sets `claimedByUserId` and stops there —
 * historical fork docs keep the guestId, and weight/history queries follow
 * the claim pointer.
 */
export interface GuestDoc {
  _id: ObjectId;
  guestId: string;
  displayName: string;
  createdAt: Date;
  lastSeenAt: Date;
  claimedByUserId?: ObjectId;
}

/** Lean v2 view of a user doc (v1 owns the full shape until cutover). */
export interface V2UserDoc {
  _id: ObjectId;
  clerkId: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Places & Lists
// ---------------------------------------------------------------------------

/**
 * A restaurant, cached from Google Places (30-day cache per charter).
 * `location` is GeoJSON so near-me queries use the 2dsphere index.
 */
export interface PlaceDoc {
  _id: ObjectId;
  googlePlaceId: string;
  name: string;
  address: string;
  location: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
  categories: string[];
  priceLevel?: number; // 0–4, Google convention
  rating?: number;
  photoRef?: string;
  /** When the Google payload was fetched; stale-after-30-days re-fetch. */
  cachedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** v1's "collection", renamed and reduced to ONE id shape (ObjectId[]). */
export interface ListDoc {
  _id: ObjectId;
  ownerId: ObjectId;
  name: string;
  placeIds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Forks (the decision object)
// ---------------------------------------------------------------------------

export type ForkMode = 'spin' | 'vote';

export type ForkStatus = 'open' | 'closed' | 'expired' | 'canceled';

export type ForkSource =
  | {
      kind: 'near-me';
      center: { type: 'Point'; coordinates: [number, number] };
      radiusM: number;
      vibe?: string;
    }
  | { kind: 'list'; listId: ObjectId }
  | { kind: 'ad-hoc' };

/** An option on the ballot/wheel. Denormalized name for join-free renders. */
export interface ForkOption {
  placeId: ObjectId;
  googlePlaceId: string;
  name: string;
  addedBy?: Participant;
}

/** One ballot. Top-3 ranks score 3/2/1; revote upserts until close. */
export interface ForkVote {
  voter: Participant;
  rankings: ObjectId[]; // placeIds, order = preference
  submittedAt: Date;
}

export interface ForkResult {
  placeId: ObjectId;
  decidedAt: Date;
  reasoning: string;
  /** placeId → weight (spin) or points (vote); the "why this pick" data. */
  weights: Record<string, number>;
}

/**
 * A Fork: source + mode + lifespan. Forks end themselves — `closesAt` is
 * enforced on read (an expired-but-open fork is treated and then marked
 * `expired`), and votes close early on `quorum`.
 *
 * `participantUserIds`/`participantGuestIds` are maintained flat (on create
 * and on every vote) purely so weight-history and "my forks" queries are
 * indexable without unwinding `votes`.
 */
export interface ForkDoc {
  _id: ObjectId;
  /** Short share code for /f/[code] (Phase 4). Unique, unguessable. */
  code: string;
  organizer: Participant;
  crewId?: ObjectId;
  source: ForkSource;
  mode: ForkMode;
  options: ForkOption[];
  status: ForkStatus;
  /** Vote mode: auto-close when this many ballots are in (optional). */
  quorum?: number;
  closesAt: Date;
  votes: ForkVote[];
  result?: ForkResult;
  participantUserIds: ObjectId[];
  participantGuestIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Crews
// ---------------------------------------------------------------------------

/**
 * A recurring decision group. Crews EMERGE from repeated co-participation
 * (Phase 6) — there is no create-a-crew-first ceremony. Shared weight
 * history is derived from forks with this `crewId`.
 */
export interface CrewDoc {
  _id: ObjectId;
  name: string;
  memberIds: ObjectId[];
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Indexes — the single source of truth
// ---------------------------------------------------------------------------

const V2_INDEXES: Record<string, IndexDescription[]> = {
  [V2_COLLECTIONS.forks]: [
    { key: { code: 1 }, unique: true },
    // Expiry sweep + "still open?" checks.
    { key: { status: 1, closesAt: 1 } },
    // "My forks" / personal weight history.
    { key: { participantUserIds: 1, createdAt: -1 } },
    { key: { participantGuestIds: 1, createdAt: -1 } },
    // Crew history / shared weights.
    { key: { crewId: 1, createdAt: -1 }, sparse: true },
  ],
  [V2_COLLECTIONS.places]: [
    { key: { googlePlaceId: 1 }, unique: true },
    { key: { location: '2dsphere' } },
  ],
  [V2_COLLECTIONS.lists]: [{ key: { ownerId: 1, updatedAt: -1 } }],
  [V2_COLLECTIONS.crews]: [{ key: { memberIds: 1 } }],
  [V2_COLLECTIONS.guests]: [
    { key: { guestId: 1 }, unique: true },
    { key: { claimedByUserId: 1 }, sparse: true },
  ],
  // users owns a clerkId unique index in v1 already; in a fresh dev database
  // v2 must create it itself.
  [V2_COLLECTIONS.users]: [{ key: { clerkId: 1 }, unique: true }],
};

/** Idempotent — createIndexes is a no-op for indexes that already exist. */
export async function ensureV2Indexes(db: Db): Promise<void> {
  for (const [collection, indexes] of Object.entries(V2_INDEXES)) {
    await db.collection(collection).createIndexes(indexes);
  }
}
