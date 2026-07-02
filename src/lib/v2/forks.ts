import { ObjectId } from 'mongodb';
import { getV2Db } from './db';
import { mintForkCode } from './tokens';
import {
  weightedSpin,
  weightsFromHistory,
  type Rng,
  type SelectionEvent,
} from './decision-engine';
import type {
  ForkDoc,
  ForkMode,
  ForkOption,
  ForkResult,
  ForkSource,
  Participant,
} from './schema';

/**
 * Fork lifecycle — Phase 1 carries only what the foundations exit demo
 * needs: create a fork, compute history-decayed weights, spin, persist the
 * result. Vote orchestration (ballots, quorum, SSE) arrives in Phase 3/4 on
 * top of the pure engine.
 */

/** Default lifespan when the caller doesn't set one (~30 min per charter). */
const DEFAULT_LIFESPAN_MS = 30 * 60 * 1000;

export interface CreateForkInput {
  organizer: Participant;
  source: ForkSource;
  mode: ForkMode;
  options: ForkOption[];
  crewId?: ObjectId;
  quorum?: number;
  closesAt?: Date;
}

export async function createFork(input: CreateForkInput): Promise<ForkDoc> {
  const { forks } = await getV2Db();
  const now = new Date();

  const doc: Omit<ForkDoc, '_id'> = {
    code: mintForkCode(),
    organizer: input.organizer,
    crewId: input.crewId,
    source: input.source,
    mode: input.mode,
    options: input.options,
    status: 'open',
    quorum: input.quorum,
    closesAt: input.closesAt ?? new Date(now.getTime() + DEFAULT_LIFESPAN_MS),
    votes: [],
    participantUserIds: input.organizer.userId ? [input.organizer.userId] : [],
    participantGuestIds: input.organizer.guestId
      ? [input.organizer.guestId]
      : [],
    createdAt: now,
    updatedAt: now,
  };

  // The unique index on `code` is the collision authority; at ~49 bits a
  // retry should never happen in practice, but handle it rather than hope.
  for (let attempt = 0; ; attempt++) {
    try {
      const result = await forks.insertOne({ ...doc } as ForkDoc);
      return { ...doc, _id: result.insertedId } as ForkDoc;
    } catch (error) {
      // Duck-typed duplicate-key check (E11000) — survives driver mocks and
      // serverless bundling where instanceof across realms is unreliable.
      const isDuplicateCode =
        typeof error === 'object' &&
        error !== null &&
        (error as { code?: unknown }).code === 11000;
      if (!isDuplicateCode || attempt >= 2) throw error;
      doc.code = mintForkCode();
    }
  }
}

export async function getForkByCode(code: string): Promise<ForkDoc | null> {
  const { forks } = await getV2Db();
  return forks.findOne({ code });
}

/**
 * Selection history feeding weight decay. Crew forks share history by
 * `crewId`; personal forks use everything the participant has been part of
 * (v1 precedent: weights span all of a user's personal collections).
 */
export async function getSelectionHistory(
  scope: { crewId: ObjectId } | { participant: Participant },
  limit: number = 100
): Promise<SelectionEvent[]> {
  const { forks } = await getV2Db();

  const filter =
    'crewId' in scope
      ? { crewId: scope.crewId }
      : scope.participant.userId
        ? { participantUserIds: scope.participant.userId }
        : { participantGuestIds: scope.participant.guestId ?? '' };

  const docs = await forks
    .find({ ...filter, status: 'closed', result: { $exists: true } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map((doc) => ({
    optionId: doc.result!.placeId.toString(),
    decidedAt: doc.result!.decidedAt,
  }));
}

/**
 * Spin an open fork: decay-weight its options against the relevant history,
 * pick, persist the result, close the fork. Returns the persisted result.
 */
export async function spinFork(
  forkId: ObjectId,
  opts: { now?: Date; rng?: Rng } = {}
): Promise<ForkResult> {
  const { forks } = await getV2Db();
  const now = opts.now ?? new Date();

  const fork = await forks.findOne({ _id: forkId });
  if (!fork) throw new Error('Fork not found');
  if (fork.mode !== 'spin') throw new Error('Fork is not in spin mode');
  if (fork.status !== 'open') throw new Error('Fork is no longer open');
  if (fork.options.length === 0) throw new Error('Fork has no options');

  const history = await getSelectionHistory(
    fork.crewId ? { crewId: fork.crewId } : { participant: fork.organizer }
  );

  const weights = weightsFromHistory(
    fork.options.map((option) => option.placeId.toString()),
    history,
    now
  );
  const outcome = weightedSpin(weights, opts.rng);

  const result: ForkResult = {
    placeId: new ObjectId(outcome.selectedId),
    decidedAt: now,
    reasoning: outcome.reasoning,
    weights: outcome.weights,
  };

  await forks.updateOne(
    { _id: forkId, status: 'open' },
    { $set: { result, status: 'closed', updatedAt: now } }
  );

  return result;
}
