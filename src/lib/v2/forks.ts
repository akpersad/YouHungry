import { ObjectId } from 'mongodb';
import { getV2Db } from './db';
import { mintForkCode } from './tokens';
import {
  resolveConsensus,
  scoreBallots,
  weightedSpin,
  weightsFromHistory,
  type BreakdownEntry,
  type RankedBallot,
  type Rng,
  type SelectionEvent,
} from './decision-engine';
import type {
  ForkDoc,
  ForkMode,
  ForkOption,
  ForkResult,
  ForkSource,
  ForkStatus,
  ForkVote,
  Participant,
} from './schema';

/**
 * Fork lifecycle. Phase 1 laid create/spin for the exit demo; Phase 3 adds
 * the core loop: the ephemeral quick spin + lock-in, vote orchestration
 * (upsert ballots, quorum + timer auto-close), and the serialized fork view
 * the UI and SSE stream share.
 *
 * Lifespan enforcement is lazy — there is no cron. Every read path funnels
 * through `settleFork`, which closes an overdue vote (consensus over
 * whatever ballots exist) or expires an overdue fork with none. All
 * status-changing writes are guarded on `status: 'open'`, so concurrent
 * settlers/voters can't double-close.
 */

/** Default lifespan when the caller doesn't set one (~30 min per charter). */
const DEFAULT_LIFESPAN_MS = 30 * 60 * 1000;

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/** Stable dedup key for a participant (userId XOR guestId by schema rule). */
export function participantKey(participant: Participant): string {
  return participant.userId
    ? `u:${participant.userId.toString()}`
    : `g:${participant.guestId ?? ''}`;
}

function ballotsFromVotes(fork: ForkDoc): RankedBallot[] {
  return fork.votes.map((vote) => ({
    voterKey: participantKey(vote.voter),
    rankings: vote.rankings.map((id) => id.toString()),
  }));
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export interface CreateForkInput {
  organizer: Participant;
  source: ForkSource;
  mode: ForkMode;
  options: ForkOption[];
  crewId?: ObjectId;
  quorum?: number;
  closesAt?: Date;
}

/**
 * Insert with code-collision retry. The unique index on `code` is the
 * collision authority; at ~49 bits a retry should never happen in practice,
 * but handle it rather than hope.
 */
async function insertForkDoc(doc: Omit<ForkDoc, '_id'>): Promise<ForkDoc> {
  const { forks } = await getV2Db();
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

export async function createFork(input: CreateForkInput): Promise<ForkDoc> {
  const now = new Date();
  return insertForkDoc({
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
  });
}

export async function getForkByCode(code: string): Promise<ForkDoc | null> {
  const { forks } = await getV2Db();
  return forks.findOne({ code });
}

// ---------------------------------------------------------------------------
// History & weights
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Quick spin (the ≤2-tap cold-open journey)
// ---------------------------------------------------------------------------

export interface QuickSpinOutcome {
  options: ForkOption[];
  winnerPlaceId: string;
  weights: Record<string, number>;
  reasoning: string;
}

/**
 * Compute a spin without persisting anything. The home-screen quick spin is
 * exploratory — "Spin again" must not poison 30 days of decay history with
 * places nobody went to. Only "Lock it in" (below) writes; signed-out users
 * get the spin with no history on either side (all options at base weight,
 * nothing recorded), so the cold open stays account-free AND Phase 3 ships
 * zero unauthenticated writes — those are Phase 4's audited surface.
 */
export async function quickSpin(
  options: ForkOption[],
  participant: Participant | null,
  opts: { now?: Date; rng?: Rng } = {}
): Promise<QuickSpinOutcome> {
  if (options.length === 0) throw new Error('No options to spin');
  const now = opts.now ?? new Date();

  const history = participant ? await getSelectionHistory({ participant }) : [];
  const weights = weightsFromHistory(
    options.map((option) => option.placeId.toString()),
    history,
    now
  );
  const outcome = weightedSpin(weights, opts.rng);

  return {
    options,
    winnerPlaceId: outcome.selectedId,
    weights: outcome.weights,
    reasoning: outcome.reasoning,
  };
}

/**
 * Persist a locked-in quick spin as a closed fork so decay history sees it.
 * Weights are recomputed server-side (they're deterministic given history);
 * the caller only asserts which options were on the wheel and which won.
 */
export async function lockInQuickSpin(input: {
  organizer: Participant;
  source: ForkSource;
  options: ForkOption[];
  winnerPlaceId: ObjectId;
  now?: Date;
}): Promise<ForkDoc> {
  const now = input.now ?? new Date();
  const optionIds = input.options.map((option) => option.placeId.toString());
  if (!optionIds.includes(input.winnerPlaceId.toString())) {
    throw new Error('Winner is not one of the options');
  }

  const history = await getSelectionHistory({ participant: input.organizer });
  const weights = weightsFromHistory(optionIds, history, now);

  return insertForkDoc({
    code: mintForkCode(),
    organizer: input.organizer,
    source: input.source,
    mode: 'spin',
    options: input.options,
    status: 'closed',
    closesAt: now,
    votes: [],
    result: {
      placeId: input.winnerPlaceId,
      decidedAt: now,
      reasoning: 'Locked in from a quick spin.',
      weights,
    },
    participantUserIds: input.organizer.userId ? [input.organizer.userId] : [],
    participantGuestIds: input.organizer.guestId
      ? [input.organizer.guestId]
      : [],
    createdAt: now,
    updatedAt: now,
  });
}

// ---------------------------------------------------------------------------
// Spin a created fork
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Lifespan: lazy settle (timer auto-close without a cron)
// ---------------------------------------------------------------------------

/**
 * Enforce `closesAt` on read. An overdue vote fork with ballots closes with
 * a consensus result; an overdue fork with nothing to decide on expires.
 * Concurrency-safe: the write is guarded on `status: 'open'`, and on a lost
 * race we re-read and return whatever the winner persisted.
 */
export async function settleFork(
  fork: ForkDoc,
  opts: { now?: Date; rng?: Rng } = {}
): Promise<ForkDoc> {
  const now = opts.now ?? new Date();
  if (fork.status !== 'open' || fork.closesAt.getTime() > now.getTime()) {
    return fork;
  }

  if (fork.mode === 'vote' && fork.votes.length > 0) {
    return closeForkWithConsensus(fork, { now, rng: opts.rng });
  }

  const { forks } = await getV2Db();
  const settled = await forks.findOneAndUpdate(
    { _id: fork._id, status: 'open' },
    { $set: { status: 'expired' satisfies ForkStatus, updatedAt: now } },
    { returnDocument: 'after' }
  );
  return settled ?? (await forks.findOne({ _id: fork._id })) ?? fork;
}

/** The read path every route uses: fetch by code, then settle if overdue. */
export async function getSettledForkByCode(
  code: string,
  opts: { now?: Date; rng?: Rng } = {}
): Promise<ForkDoc | null> {
  const fork = await getForkByCode(code);
  if (!fork) return null;
  return settleFork(fork, opts);
}

/**
 * Resolve consensus over the fork's ballots and close it. Guarded on
 * `status: 'open'` — exactly one concurrent closer wins; losers re-read.
 */
export async function closeForkWithConsensus(
  fork: ForkDoc,
  opts: { now?: Date; rng?: Rng } = {}
): Promise<ForkDoc> {
  const now = opts.now ?? new Date();
  const outcome = resolveConsensus(
    ballotsFromVotes(fork),
    fork.options.map((option) => option.placeId.toString()),
    opts.rng
  );
  if (!outcome.winnerId) {
    throw new Error('Cannot close a vote with no ballots');
  }

  const result: ForkResult = {
    placeId: new ObjectId(outcome.winnerId),
    decidedAt: now,
    reasoning: outcome.reasoning,
    weights: outcome.scores,
  };

  const { forks } = await getV2Db();
  const closed = await forks.findOneAndUpdate(
    { _id: fork._id, status: 'open' },
    { $set: { result, status: 'closed' satisfies ForkStatus, updatedAt: now } },
    { returnDocument: 'after' }
  );
  return closed ?? (await forks.findOne({ _id: fork._id })) ?? fork;
}

// ---------------------------------------------------------------------------
// Voting
// ---------------------------------------------------------------------------

/**
 * Cast (or replace) a ballot on an open vote fork. Revote is allowed until
 * close — the upsert is a $pull of the voter's previous ballot followed by a
 * $push, both guarded on `status: 'open'`. Reaching quorum closes the fork
 * immediately with a consensus result.
 */
export async function submitVote(
  code: string,
  voter: Participant,
  rankings: ObjectId[],
  opts: { now?: Date; rng?: Rng } = {}
): Promise<ForkDoc> {
  const now = opts.now ?? new Date();
  const fork = await getSettledForkByCode(code, opts);
  if (!fork) throw new Error('Fork not found');
  if (fork.mode !== 'vote') throw new Error('Fork is not in vote mode');
  if (fork.status !== 'open') throw new Error('Fork is no longer open');

  if (rankings.length === 0 || rankings.length > 3) {
    throw new Error('Rank between one and three options');
  }
  const optionIds = new Set(
    fork.options.map((option) => option.placeId.toString())
  );
  const rankingIds = rankings.map((id) => id.toString());
  if (new Set(rankingIds).size !== rankingIds.length) {
    throw new Error('Rankings must be distinct');
  }
  if (rankingIds.some((id) => !optionIds.has(id))) {
    throw new Error('Ranking references an option not on this fork');
  }

  const { forks } = await getV2Db();
  // Dotted-path $pull condition — valid MongoDB the driver types can't
  // express against an embedded-document array, hence the cast.
  const voterFilter = (voter.userId
    ? { 'voter.userId': voter.userId }
    : { 'voter.guestId': voter.guestId }) as unknown as Partial<ForkVote>;

  // Two guarded writes, not one: Mongo can't $pull and $push the same array
  // field in a single update. The only overlap risk is the same voter
  // double-submitting concurrently, which at worst re-runs the $pull.
  await forks.updateOne(
    { _id: fork._id, status: 'open' },
    { $pull: { votes: voterFilter } }
  );
  const pushed = await forks.updateOne(
    { _id: fork._id, status: 'open' },
    {
      $push: { votes: { voter, rankings, submittedAt: now } },
      $set: { updatedAt: now },
      ...(voter.userId
        ? { $addToSet: { participantUserIds: voter.userId } }
        : { $addToSet: { participantGuestIds: voter.guestId ?? '' } }),
    }
  );
  if (pushed.modifiedCount === 0) {
    // Lost a race with a closer between the settle check and the write.
    throw new Error('Fork is no longer open');
  }

  const updated = await forks.findOne({ _id: fork._id });
  if (!updated) throw new Error('Fork not found');

  if (
    updated.status === 'open' &&
    updated.quorum &&
    updated.votes.length >= updated.quorum
  ) {
    return closeForkWithConsensus(updated, opts);
  }
  return updated;
}

// ---------------------------------------------------------------------------
// Queries for the lane home
// ---------------------------------------------------------------------------

/** Open forks a user is part of, newest first — the home "live now" rail. */
export async function getOpenForksForUser(
  userId: ObjectId,
  limit: number = 10
): Promise<ForkDoc[]> {
  const { forks } = await getV2Db();
  return forks
    .find({ participantUserIds: userId, status: 'open' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

// ---------------------------------------------------------------------------
// Serialized view (UI + SSE share this shape)
// ---------------------------------------------------------------------------

export interface ForkView {
  code: string;
  mode: ForkMode;
  status: ForkStatus;
  sourceKind: ForkSource['kind'];
  vibe?: string;
  organizerName: string;
  isOrganizer: boolean;
  options: Array<{ id: string; name: string }>;
  quorum?: number;
  closesAt: string;
  createdAt: string;
  voteCount: number;
  /** Display names only — ballots stay private (v1 precedent). */
  voterNames: string[];
  /** The viewer's own ballot, if any (placeId strings in rank order). */
  myRankings: string[] | null;
  result: {
    placeId: string;
    name: string;
    decidedAt: string;
    reasoning: string;
    weights: Record<string, number>;
  } | null;
  /** Aggregated 3/2/1 tally per option — only exposed once closed. */
  breakdown: Record<string, BreakdownEntry> | null;
}

/**
 * The fork as a viewer may see it. Individual ballots are never exposed —
 * only the aggregate breakdown (post-close) and the viewer's own rankings.
 */
export function serializeFork(
  fork: ForkDoc,
  viewer: Participant | null
): ForkView {
  const viewerKey = viewer ? participantKey(viewer) : null;
  const myVote = viewerKey
    ? fork.votes.find((vote) => participantKey(vote.voter) === viewerKey)
    : undefined;

  const optionName = new Map(
    fork.options.map((option) => [option.placeId.toString(), option.name])
  );

  const closed = fork.status === 'closed' && fork.result;

  return {
    code: fork.code,
    mode: fork.mode,
    status: fork.status,
    sourceKind: fork.source.kind,
    vibe: fork.source.kind === 'near-me' ? fork.source.vibe : undefined,
    organizerName: fork.organizer.displayName,
    isOrganizer:
      viewerKey !== null && participantKey(fork.organizer) === viewerKey,
    options: fork.options.map((option) => ({
      id: option.placeId.toString(),
      name: option.name,
    })),
    quorum: fork.quorum,
    closesAt: fork.closesAt.toISOString(),
    createdAt: fork.createdAt.toISOString(),
    voteCount: fork.votes.length,
    voterNames: fork.votes.map((vote) => vote.voter.displayName),
    myRankings: myVote ? myVote.rankings.map((id) => id.toString()) : null,
    result: closed
      ? {
          placeId: fork.result!.placeId.toString(),
          name:
            optionName.get(fork.result!.placeId.toString()) ?? 'Somewhere good',
          decidedAt: fork.result!.decidedAt.toISOString(),
          reasoning: fork.result!.reasoning,
          weights: fork.result!.weights,
        }
      : null,
    breakdown:
      closed && fork.mode === 'vote'
        ? scoreBallots(
            ballotsFromVotes(fork),
            fork.options.map((option) => option.placeId.toString())
          ).breakdown
        : null,
  };
}
