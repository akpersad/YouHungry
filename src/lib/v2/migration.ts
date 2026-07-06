import type { ObjectId } from 'mongodb';
import type {
  CrewDoc,
  ForkDoc,
  ForkOption,
  ForkVote,
  ListDoc,
  Participant,
  PlaceDoc,
} from './schema';

/**
 * v1 → v2 migration transforms (WORKPLAN Phase 7). Pure functions only —
 * the CLI in `scripts/v2/migrate-v1.ts` owns all I/O, so every mapping
 * rule here is unit-testable and the dry-run report is exactly the real
 * run minus the writes.
 *
 * Mapping decisions (owner signs off on these via the dry-run report):
 *
 * - `users` is untouched — v2 already reads its lean fields off the same
 *   shared collection.
 * - v2 docs REUSE the v1 `_id` (restaurants→places, collections→lists,
 *   groups→crews, decisions→forks), which makes the whole migration
 *   idempotent upserts and every v2 doc traceable to its v1 source.
 * - Only groups with at least one completed decision become crews —
 *   crews emerge from decisions (charter); ceremony-only groups are
 *   reported, not migrated.
 * - Only completed decisions with a resolvable winner become forks; the
 *   fork is `closed` with `result.decidedAt = result.selectedAt`, so the
 *   30-day decay math sees the same history v1 saw.
 *
 * The v1 shapes are declared leanly HERE (not imported from
 * `src/types/database.ts`) because the v1 type module is deleted later
 * in this same phase.
 */

// ---------------------------------------------------------------------------
// Lean v1 shapes (only the fields the migration reads)
// ---------------------------------------------------------------------------

export interface V1UserLean {
  _id: ObjectId;
  clerkId: string;
  name?: string;
  email?: string;
}

export interface V1Restaurant {
  _id: ObjectId;
  googlePlaceId: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  cuisine?: string;
  rating?: number;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
  photos?: string[];
  cachedAt?: Date;
}

export type V1RestaurantRef =
  | ObjectId
  | { _id: ObjectId; googlePlaceId?: string }
  | { googlePlaceId: string };

export interface V1Collection {
  _id: ObjectId;
  name: string;
  type: 'personal' | 'group';
  /** User id for personal collections, GROUP id for group collections. */
  ownerId: ObjectId;
  restaurantIds: V1RestaurantRef[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface V1Group {
  _id: ObjectId;
  name: string;
  adminIds: ObjectId[];
  memberIds: ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface V1Decision {
  _id: ObjectId;
  type: 'personal' | 'group';
  collectionId: ObjectId;
  groupId?: ObjectId;
  createdBy?: ObjectId;
  /** Clerk user ids as strings (v1's mixed identity model). */
  participants: string[];
  method: 'tiered' | 'random' | 'manual';
  status: 'active' | 'completed' | 'expired';
  visitDate?: Date;
  result?: {
    restaurantId: ObjectId;
    selectedAt: Date;
    reasoning?: string;
    weights?: Record<string, number>;
  };
  votes?: {
    userId: string;
    rankings: ObjectId[];
    submittedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Restaurants → Places
// ---------------------------------------------------------------------------

export function priceRangeToLevel(
  priceRange?: V1Restaurant['priceRange']
): number | undefined {
  if (!priceRange) return undefined;
  return { $: 1, $$: 2, $$$: 3, $$$$: 4 }[priceRange];
}

export interface MigrationSkip {
  id: string;
  reason: string;
}

export function restaurantToPlace(
  restaurant: V1Restaurant,
  now: Date
): PlaceDoc | MigrationSkip {
  const { coordinates } = restaurant;
  if (
    !restaurant.googlePlaceId ||
    typeof coordinates?.lat !== 'number' ||
    typeof coordinates?.lng !== 'number' ||
    Number.isNaN(coordinates.lat) ||
    Number.isNaN(coordinates.lng)
  ) {
    return {
      id: restaurant._id.toString(),
      reason: 'missing googlePlaceId or coordinates',
    };
  }
  const place: PlaceDoc = {
    _id: restaurant._id,
    googlePlaceId: restaurant.googlePlaceId,
    name: restaurant.name,
    address: restaurant.address ?? '',
    location: {
      type: 'Point',
      coordinates: [coordinates.lng, coordinates.lat],
    },
    categories: restaurant.cuisine ? [restaurant.cuisine] : [],
    rating: restaurant.rating,
    // v1 photos are full URLs (some embed the API key); v2 renders no
    // photos, so they are deliberately dropped rather than carried.
    cachedAt: restaurant.cachedAt ?? now,
    createdAt: restaurant.cachedAt ?? now,
    updatedAt: now,
  };
  const priceLevel = priceRangeToLevel(restaurant.priceRange);
  if (priceLevel !== undefined) place.priceLevel = priceLevel;
  return place;
}

export function isSkip(value: unknown): value is MigrationSkip {
  return typeof value === 'object' && value !== null && 'reason' in value;
}

// ---------------------------------------------------------------------------
// Resolving v1's three-shape restaurant references
// ---------------------------------------------------------------------------

/** Lookup maps built from the migrated places. */
export interface PlaceIndex {
  /** v1 restaurant `_id` string → place (same doc, `_id` reused). */
  byRestaurantId: Map<string, PlaceDoc>;
  byGooglePlaceId: Map<string, PlaceDoc>;
}

export function buildPlaceIndex(places: PlaceDoc[]): PlaceIndex {
  const byRestaurantId = new Map<string, PlaceDoc>();
  const byGooglePlaceId = new Map<string, PlaceDoc>();
  for (const place of places) {
    byRestaurantId.set(place._id.toString(), place);
    if (!byGooglePlaceId.has(place.googlePlaceId)) {
      byGooglePlaceId.set(place.googlePlaceId, place);
    }
  }
  return { byRestaurantId, byGooglePlaceId };
}

export function resolveRestaurantRef(
  ref: V1RestaurantRef,
  index: PlaceIndex
): PlaceDoc | null {
  // Shape-based, not instanceof-based: a bare ObjectId has neither an
  // `_id` nor a `googlePlaceId` property, in prod or under test mocks.
  if (typeof ref !== 'object' || ref === null) return null;
  if ('_id' in ref && ref._id) {
    const byId = index.byRestaurantId.get(ref._id.toString());
    if (byId) return byId;
  }
  if ('googlePlaceId' in ref && ref.googlePlaceId) {
    return index.byGooglePlaceId.get(ref.googlePlaceId) ?? null;
  }
  if (!('_id' in ref) && !('googlePlaceId' in ref)) {
    return index.byRestaurantId.get(ref.toString()) ?? null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Collections → Lists
// ---------------------------------------------------------------------------

export interface CollectionMigrationContext {
  index: PlaceIndex;
  /** v1 group id string → group (for group-collection ownership). */
  groupsById: Map<string, V1Group>;
  /** v1 user id string → user (to verify owners still exist). */
  usersById: Map<string, V1UserLean>;
}

export interface ListMigration {
  list: ListDoc;
  droppedPlaceRefs: number;
}

export function collectionToList(
  collection: V1Collection,
  ctx: CollectionMigrationContext,
  now: Date
): ListMigration | MigrationSkip {
  let ownerId: ObjectId;
  let name = collection.name;

  if (collection.type === 'group') {
    const group = ctx.groupsById.get(collection.ownerId.toString());
    const admin = group?.adminIds.find((id) =>
      ctx.usersById.has(id.toString())
    );
    if (!group || !admin) {
      return {
        id: collection._id.toString(),
        reason: 'group collection whose group/admin no longer resolves',
      };
    }
    ownerId = admin;
    // v2 lists are personal; keep the group context in the name.
    name = `${collection.name} (${group.name})`;
  } else {
    if (!ctx.usersById.has(collection.ownerId.toString())) {
      return {
        id: collection._id.toString(),
        reason: 'personal collection whose owner no longer resolves',
      };
    }
    ownerId = collection.ownerId;
  }

  const placeIds: ObjectId[] = [];
  const seen = new Set<string>();
  let droppedPlaceRefs = 0;
  for (const ref of collection.restaurantIds ?? []) {
    const place = resolveRestaurantRef(ref, ctx.index);
    if (!place) {
      droppedPlaceRefs += 1;
      continue;
    }
    const key = place._id.toString();
    if (seen.has(key)) continue;
    seen.add(key);
    placeIds.push(place._id);
  }

  return {
    list: {
      _id: collection._id,
      ownerId,
      name,
      placeIds,
      createdAt: collection.createdAt ?? now,
      updatedAt: now,
    },
    droppedPlaceRefs,
  };
}

// ---------------------------------------------------------------------------
// Groups → Crews (only groups with completed decision history)
// ---------------------------------------------------------------------------

export function groupToCrew(
  group: V1Group,
  usersById: Map<string, V1UserLean>,
  now: Date
): CrewDoc | MigrationSkip {
  const memberIds: ObjectId[] = [];
  const seen = new Set<string>();
  for (const id of [...(group.adminIds ?? []), ...(group.memberIds ?? [])]) {
    const key = id.toString();
    if (seen.has(key) || !usersById.has(key)) continue;
    seen.add(key);
    memberIds.push(id);
  }
  if (memberIds.length < 2) {
    return {
      id: group._id.toString(),
      reason: 'fewer than two resolvable members',
    };
  }
  const createdBy =
    (group.adminIds ?? []).find((id) => seen.has(id.toString())) ??
    memberIds[0];
  return {
    _id: group._id,
    name: group.name,
    memberIds,
    createdBy,
    createdAt: group.createdAt ?? now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Decisions → Forks
// ---------------------------------------------------------------------------

export interface DecisionMigrationContext {
  index: PlaceIndex;
  /** CLERK id string → user (v1 stored participants as Clerk ids). */
  usersByClerkId: Map<string, V1UserLean>;
  /** v1 user ObjectId string → user. */
  usersById: Map<string, V1UserLean>;
  /** collection id string → migrated list (for the fork's source). */
  listsByCollectionId: Map<string, ListDoc>;
  /** group id string → migrated crew (group decisions keep shared weights). */
  crewsByGroupId: Map<string, CrewDoc>;
}

export interface ForkMigration {
  /** Everything but `code`, which the CLI mints per insert. */
  fork: Omit<ForkDoc, 'code'>;
  droppedVotes: number;
}

function participantOf(user: V1UserLean): Participant {
  return { userId: user._id, displayName: user.name || 'Someone' };
}

export function decisionToFork(
  decision: V1Decision,
  ctx: DecisionMigrationContext,
  now: Date
): ForkMigration | MigrationSkip {
  const id = decision._id.toString();
  if (decision.status !== 'completed' || !decision.result) {
    return { id, reason: `not a completed decision (${decision.status})` };
  }

  const winner = ctx.index.byRestaurantId.get(
    decision.result.restaurantId.toString()
  );
  if (!winner) {
    return { id, reason: 'winning restaurant did not migrate' };
  }

  // The option set at decision time is best reconstructed as the union of
  // the persisted weight keys (the wheel, for spins), every ranking that
  // was voted on, and the winner itself.
  const optionRestaurantIds = new Set<string>([
    decision.result.restaurantId.toString(),
  ]);
  for (const key of Object.keys(decision.result.weights ?? {})) {
    optionRestaurantIds.add(key);
  }
  for (const vote of decision.votes ?? []) {
    for (const ranked of vote.rankings ?? []) {
      optionRestaurantIds.add(ranked.toString());
    }
  }
  const options: ForkOption[] = [];
  const weights: Record<string, number> = {};
  for (const restaurantId of optionRestaurantIds) {
    const place = ctx.index.byRestaurantId.get(restaurantId);
    if (!place) continue; // dropped ref; winner is guaranteed above
    options.push({
      placeId: place._id,
      googlePlaceId: place.googlePlaceId,
      name: place.name,
    });
    const weight = decision.result.weights?.[restaurantId];
    if (weight !== undefined) {
      weights[place._id.toString()] = weight;
    }
  }

  // Organizer: creator if resolvable, else first resolvable participant.
  const creator = decision.createdBy
    ? ctx.usersById.get(decision.createdBy.toString())
    : undefined;
  const firstParticipant = (decision.participants ?? [])
    .map((clerkId) => ctx.usersByClerkId.get(clerkId))
    .find((user) => user !== undefined);
  const organizerUser = creator ?? firstParticipant;
  if (!organizerUser) {
    return { id, reason: 'no resolvable organizer or participants' };
  }

  const votes: ForkVote[] = [];
  let droppedVotes = 0;
  for (const vote of decision.votes ?? []) {
    const voter = ctx.usersByClerkId.get(vote.userId);
    const rankings = (vote.rankings ?? [])
      .map((restaurantId) =>
        ctx.index.byRestaurantId.get(restaurantId.toString())
      )
      .filter((place): place is PlaceDoc => place !== undefined)
      .map((place) => place._id);
    if (!voter || rankings.length === 0) {
      droppedVotes += 1;
      continue;
    }
    votes.push({
      voter: participantOf(voter),
      rankings,
      submittedAt: vote.submittedAt ?? decision.result.selectedAt,
    });
  }

  const participantUserIds: ObjectId[] = [];
  const seenParticipants = new Set<string>();
  const candidates = [
    organizerUser._id,
    ...votes.map((vote) => vote.voter.userId!),
    ...(decision.participants ?? [])
      .map((clerkId) => ctx.usersByClerkId.get(clerkId)?._id)
      .filter((oid): oid is ObjectId => oid !== undefined),
  ];
  for (const oid of candidates) {
    const key = oid.toString();
    if (seenParticipants.has(key)) continue;
    seenParticipants.add(key);
    participantUserIds.push(oid);
  }

  const list = ctx.listsByCollectionId.get(decision.collectionId.toString());
  const crew = decision.groupId
    ? ctx.crewsByGroupId.get(decision.groupId.toString())
    : undefined;
  const decidedAt = decision.result.selectedAt;

  const fork: Omit<ForkDoc, 'code'> = {
    _id: decision._id,
    organizer: participantOf(organizerUser),
    source: list ? { kind: 'list', listId: list._id } : { kind: 'ad-hoc' },
    mode: decision.method === 'tiered' ? 'vote' : 'spin',
    options,
    status: 'closed',
    closesAt: decidedAt,
    votes,
    result: {
      placeId: winner._id,
      decidedAt,
      reasoning:
        decision.result.reasoning ||
        (decision.method === 'manual'
          ? 'Logged from a past visit.'
          : 'Migrated from v1.'),
      weights,
    },
    participantUserIds,
    participantGuestIds: [],
    createdAt: decision.createdAt ?? decidedAt,
    updatedAt: now,
  };
  if (crew) fork.crewId = crew._id;
  return { fork, droppedVotes };
}
