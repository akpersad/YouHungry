import { ObjectId } from 'mongodb';
import { getV2Db } from './db';
import { V2DomainError, notFound } from './errors';
import { createFork, getSelectionHistory } from './forks';
import { weightsFromHistory } from './decision-engine';
import { getPlacesByIds } from './places';
import type { CrewDoc, ForkDoc, Participant } from './schema';

/**
 * Crews — CHARTER lane 3, with the structural inversion: crews EMERGE from
 * repeated co-participation instead of preceding decisions. Nobody fills
 * out a group form; after the same people close a few forks together, the
 * app offers to make it a Crew. Accepting back-attaches that shared
 * history (the history predates the crew on purpose), so shared decay
 * weights work from day one.
 */

/** "A few times" — the third fork together earns the suggestion. */
export const CREW_SUGGESTION_THRESHOLD = 3;

/** How many closed forks we scan per user when deriving suggestions. */
const SUGGESTION_SCAN_LIMIT = 200;

const MAX_SUGGESTIONS = 3;

export const MAX_CREWS_PER_USER = 50;

/** Canonical identity of a co-participant group: sorted user id key. */
export function memberKey(memberIds: ObjectId[]): string {
  return memberIds
    .map((id) => id.toString())
    .sort()
    .join(':');
}

export interface CrewSuggestion {
  memberIds: string[];
  /** Display names in the same order as memberIds (caller included). */
  memberNames: string[];
  forkCount: number;
  lastForkAt: Date;
}

/**
 * Groups of people (2+ accounts, exact same set) who have closed at least
 * CREW_SUGGESTION_THRESHOLD forks together without a crew. Guests don't
 * count toward the set — crews are account territory — but a fork that
 * also had guests still counts for its account-holders.
 */
export async function getCrewSuggestionsForUser(
  userId: ObjectId
): Promise<CrewSuggestion[]> {
  const { forks, crews, users } = await getV2Db();

  const candidates = await forks
    .find({
      participantUserIds: userId,
      status: 'closed',
      crewId: { $exists: false },
      // At least two account-holders — a solo streak is not a crew.
      'participantUserIds.1': { $exists: true },
    })
    .sort({ createdAt: -1 })
    .limit(SUGGESTION_SCAN_LIMIT)
    .project<Pick<ForkDoc, 'participantUserIds' | 'createdAt'>>({
      participantUserIds: 1,
      createdAt: 1,
    })
    .toArray();

  const groups = new Map<
    string,
    { memberIds: ObjectId[]; count: number; lastForkAt: Date }
  >();
  for (const fork of candidates) {
    const key = memberKey(fork.participantUserIds);
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      if (fork.createdAt > existing.lastForkAt) {
        existing.lastForkAt = fork.createdAt;
      }
    } else {
      groups.set(key, {
        memberIds: fork.participantUserIds,
        count: 1,
        lastForkAt: fork.createdAt,
      });
    }
  }

  // A group that already IS a crew never gets re-suggested.
  const existingCrews = await crews.find({ memberIds: userId }).toArray();
  const crewKeys = new Set(
    existingCrews.map((crew) => memberKey(crew.memberIds))
  );

  const qualifying = [...groups.entries()]
    .filter(
      ([key, group]) =>
        group.count >= CREW_SUGGESTION_THRESHOLD && !crewKeys.has(key)
    )
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, MAX_SUGGESTIONS);
  if (qualifying.length === 0) return [];

  const allIds = [
    ...new Set(
      qualifying.flatMap(([, group]) =>
        group.memberIds.map((id) => id.toString())
      )
    ),
  ].map((id) => new ObjectId(id));
  const memberDocs = await users
    .find({ _id: { $in: allIds } })
    .project<{ _id: ObjectId; name: string }>({ name: 1 })
    .toArray();
  const nameOf = new Map(
    memberDocs.map((doc) => [doc._id.toString(), doc.name.split(' ')[0]])
  );

  return qualifying.map(([, group]) => ({
    memberIds: group.memberIds.map((id) => id.toString()),
    memberNames: group.memberIds.map(
      (id) => nameOf.get(id.toString()) ?? 'Someone'
    ),
    forkCount: group.count,
    lastForkAt: group.lastForkAt,
  }));
}

/**
 * Create a crew from a suggestion (or any set of accounts including the
 * caller) and back-attach the matching history: closed crew-less forks
 * whose account-holder set is exactly these members get this crewId, so
 * shared decay weights are live immediately. Idempotent on the member
 * set — accepting the same suggestion twice returns the existing crew.
 */
export async function createCrew(
  creatorId: ObjectId,
  memberIds: ObjectId[],
  name: string
): Promise<CrewDoc> {
  const distinct = [
    ...new Map(memberIds.map((id) => [id.toString(), id])).values(),
  ];
  if (!distinct.some((id) => id.toString() === creatorId.toString())) {
    throw new V2DomainError('You have to be in your own crew');
  }
  if (distinct.length < 2) {
    throw new V2DomainError('A crew is at least two people');
  }
  if (distinct.length > 20) {
    throw new V2DomainError('Keep a crew under 20 people');
  }

  const { crews, users, forks } = await getV2Db();

  const existing = await crews.find({ memberIds: creatorId }).toArray();
  const key = memberKey(distinct);
  const already = existing.find((crew) => memberKey(crew.memberIds) === key);
  if (already) return already;
  if (existing.length >= MAX_CREWS_PER_USER) {
    throw new V2DomainError(
      `That's ${MAX_CREWS_PER_USER} crews. Retire one before starting another.`
    );
  }

  const memberCount = await users.countDocuments({ _id: { $in: distinct } });
  if (memberCount !== distinct.length) {
    throw new V2DomainError('One of those people does not have an account');
  }

  const now = new Date();
  const crew: CrewDoc = {
    _id: new ObjectId(),
    name,
    memberIds: distinct,
    createdBy: creatorId,
    createdAt: now,
    updatedAt: now,
  };
  await crews.insertOne(crew);

  // Back-attach: exact same account set, closed, still crew-less. Forks
  // that also had guests still belong to this crew's story.
  await forks.updateMany(
    {
      status: 'closed',
      crewId: { $exists: false },
      participantUserIds: { $all: distinct, $size: distinct.length },
    },
    { $set: { crewId: crew._id, updatedAt: now } }
  );

  return crew;
}

/** Member-gated fetch; a foreign crew id 404s like a missing one. */
export async function getCrewForMember(
  crewId: ObjectId,
  userId: ObjectId
): Promise<CrewDoc> {
  const { crews } = await getV2Db();
  const crew = await crews.findOne({ _id: crewId, memberIds: userId });
  if (!crew) throw notFound('Crew');
  return crew;
}

export async function getCrewsForUser(userId: ObjectId): Promise<CrewDoc[]> {
  const { crews } = await getV2Db();
  return crews.find({ memberIds: userId }).sort({ updatedAt: -1 }).toArray();
}

export async function renameCrew(
  crewId: ObjectId,
  userId: ObjectId,
  name: string
): Promise<CrewDoc> {
  const { crews } = await getV2Db();
  const crew = await crews.findOneAndUpdate(
    { _id: crewId, memberIds: userId },
    { $set: { name, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!crew) throw notFound('Crew');
  return crew;
}

export interface CrewView {
  id: string;
  name: string;
  memberNames: string[];
  isCreator: boolean;
  forkCount: number;
  /** Newest first. */
  recentForks: Array<{
    code: string;
    winnerName: string;
    decidedAt: string;
  }>;
  /**
   * The shared board, "why this pick" made visible: every place this crew
   * has ever picked, with its current decay weight (1 = full slice again).
   */
  weights: Array<{
    placeId: string;
    name: string;
    lastPickedAt: string;
    weight: number;
  }>;
}

export async function getCrewView(
  crewId: ObjectId,
  userId: ObjectId,
  now: Date = new Date()
): Promise<CrewView> {
  const crew = await getCrewForMember(crewId, userId);
  const { users, forks } = await getV2Db();

  const memberDocs = await users
    .find({ _id: { $in: crew.memberIds } })
    .project<{ _id: ObjectId; name: string }>({ name: 1 })
    .toArray();

  const crewForks = await forks
    .find({ crewId: crew._id, status: 'closed', result: { $exists: true } })
    .sort({ createdAt: -1 })
    .toArray();

  const optionName = new Map<string, string>();
  for (const fork of crewForks) {
    for (const option of fork.options) {
      optionName.set(option.placeId.toString(), option.name);
    }
  }

  const history = await getSelectionHistory({ crewId: crew._id });
  const pickedIds = [...new Set(history.map((event) => event.optionId))];
  const weights = weightsFromHistory(pickedIds, history, now);
  const lastPicked = new Map<string, Date>();
  for (const event of history) {
    const current = lastPicked.get(event.optionId);
    if (!current || event.decidedAt > current) {
      lastPicked.set(event.optionId, event.decidedAt);
    }
  }

  // Names for picked places that no longer appear in any kept fork options
  // resolve from the place cache (denormalized names are the normal path).
  const unnamed = pickedIds.filter((id) => !optionName.has(id));
  if (unnamed.length > 0) {
    const docs = await getPlacesByIds(unnamed.map((id) => new ObjectId(id)));
    for (const doc of docs) optionName.set(doc._id.toString(), doc.name);
  }

  return {
    id: crew._id.toString(),
    name: crew.name,
    memberNames: memberDocs.map((doc) => doc.name.split(' ')[0]),
    isCreator: crew.createdBy.toString() === userId.toString(),
    forkCount: crewForks.length,
    recentForks: crewForks.slice(0, 10).map((fork) => ({
      code: fork.code,
      winnerName:
        optionName.get(fork.result!.placeId.toString()) ?? 'Somewhere good',
      decidedAt: fork.result!.decidedAt.toISOString(),
    })),
    weights: pickedIds
      .map((placeId) => ({
        placeId,
        name: optionName.get(placeId) ?? 'Somewhere good',
        lastPickedAt: (lastPicked.get(placeId) ?? now).toISOString(),
        weight: weights[placeId] ?? 1,
      }))
      .sort((a, b) => a.weight - b.weight),
  };
}

/**
 * One-tap re-fork: a fresh fork for this crew with the last crew fork's
 * ballot. The new fork carries the crewId, so spins and votes settle
 * against the crew's SHARED decay history (spinFork already scopes by
 * crewId — "we just did sushi" counts for everyone in the crew).
 */
export async function reforkCrew(
  crewId: ObjectId,
  organizer: Participant & { userId: ObjectId },
  opts: { mode?: 'spin' | 'vote'; lifespanMinutes?: number; now?: Date } = {}
): Promise<ForkDoc> {
  const crew = await getCrewForMember(crewId, organizer.userId);
  const { forks } = await getV2Db();

  const lastFork = await forks.findOne(
    { crewId: crew._id },
    { sort: { createdAt: -1 } }
  );
  if (!lastFork) {
    throw new V2DomainError(
      'This crew has no forks to run back yet. Start one from scratch.'
    );
  }

  const now = opts.now ?? new Date();
  const lifespanMinutes = opts.lifespanMinutes ?? 30;
  return createFork({
    organizer,
    source: lastFork.source,
    mode: opts.mode ?? lastFork.mode,
    options: lastFork.options,
    crewId: crew._id,
    quorum: lastFork.quorum,
    closesAt: new Date(now.getTime() + lifespanMinutes * 60 * 1000),
  });
}
