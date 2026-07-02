import { ObjectId } from 'mongodb';
import { getV2Db } from './db';
import { V2DomainError, notFound } from './errors';
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
 * whatever ballots exist) or expires an overdue fork with none.
 *
 * Concurrency model: ballot writes are single atomic updateOnes guarded on
 * `status: 'open'` (in-place replace for revotes, presence-guarded push for
 * first ballots — no delete window, no duplicates), and a close SEALS the
 * fork by flipping that status before computing the outcome from the sealed
 * document — so the persisted result always agrees with the persisted
 * ballots (see closeForkWithConsensus).
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
  if (options.length === 0) throw new V2DomainError('No options to spin');
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
    throw new V2DomainError('Winner is not one of the options');
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
  if (!fork) throw notFound('Fork');
  if (fork.mode !== 'spin') throw new V2DomainError('Fork is not in spin mode');
  if (fork.status !== 'open') throw new V2DomainError('Fork is no longer open');
  if (fork.options.length === 0) throw new V2DomainError('Fork has no options');

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

  const spun = await forks.updateOne(
    { _id: forkId, status: 'open' },
    { $set: { result, status: 'closed', updatedAt: now } }
  );
  if (spun.matchedCount === 0) {
    // A concurrent spin or settle won — never report an outcome that
    // wasn't the one persisted.
    throw new V2DomainError('Fork is no longer open');
  }

  return result;
}

// ---------------------------------------------------------------------------
// Lifespan: lazy settle (timer auto-close without a cron)
// ---------------------------------------------------------------------------

/**
 * Enforce `closesAt` on read. An overdue vote fork with ballots closes with
 * a consensus result; an overdue fork with nothing to decide on expires.
 * Concurrency-safe: every status write is guarded, and the vote branch
 * seals the ballot box before deciding (see closeForkWithConsensus), so a
 * ballot that beat the deadline is never discarded.
 */
export async function settleFork(
  fork: ForkDoc,
  opts: { now?: Date; rng?: Rng } = {}
): Promise<ForkDoc> {
  const now = opts.now ?? new Date();
  if (fork.status !== 'open' || fork.closesAt.getTime() > now.getTime()) {
    return fork;
  }

  const { forks } = await getV2Db();

  if (fork.mode === 'vote') {
    if (fork.votes.length > 0) {
      return closeForkWithConsensus(fork, { now, rng: opts.rng });
    }
    // Snapshot says no ballots — expire only if that is STILL true at
    // write time ('votes.0' guard); a ballot that lands in between wins
    // and the fork closes with a result instead.
    const expired = await forks.findOneAndUpdate(
      {
        _id: fork._id,
        status: 'open',
        'votes.0': { $exists: false },
      },
      { $set: { status: 'expired' satisfies ForkStatus, updatedAt: now } },
      { returnDocument: 'after' }
    );
    if (expired) return expired;
    const current = await forks.findOne({ _id: fork._id });
    if (!current) return fork;
    if (current.status === 'open') {
      // A late ballot blocked the expiry — settle it as a real close.
      return closeForkWithConsensus(current, { now, rng: opts.rng });
    }
    return current;
  }

  // Spin forks carry no ballots, so the plain guarded expire is race-free.
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
 * Close a vote fork in two atomic steps:
 *
 * 1. **Seal** — flip `status` open→closed. Exactly one concurrent closer
 *    wins the flip, and because every ballot write is guarded on
 *    `status: 'open'`, the sealed document's votes array is final. The
 *    consensus is computed from THAT array, never from the caller's
 *    (possibly stale) snapshot — a ballot accepted before the seal always
 *    counts; one after it is rejected outright.
 * 2. **Finish** — persist the result, guarded on `result` being absent so
 *    a rival closer's outcome is never overwritten. If a previous closer
 *    sealed and crashed before finishing, the next settle completes it.
 *
 * A fork sealed with zero ballots resolves to `expired`, not a decision.
 */
export async function closeForkWithConsensus(
  fork: ForkDoc,
  opts: { now?: Date; rng?: Rng } = {}
): Promise<ForkDoc> {
  const now = opts.now ?? new Date();
  const { forks } = await getV2Db();

  let sealed = await forks.findOneAndUpdate(
    { _id: fork._id, status: 'open' },
    { $set: { status: 'closed' satisfies ForkStatus, updatedAt: now } },
    { returnDocument: 'after' }
  );
  if (!sealed) {
    const current = await forks.findOne({ _id: fork._id });
    if (!current) return fork;
    // Someone else settled it — done, unless they sealed without
    // finishing (crash between the two steps): then finish for them.
    if (current.status !== 'closed' || current.result) return current;
    sealed = current;
  }

  const outcome = resolveConsensus(
    ballotsFromVotes(sealed),
    sealed.options.map((option) => option.placeId.toString()),
    opts.rng
  );

  if (!outcome.winnerId) {
    // Sealed with no ballots — an expiry, not a decision.
    const expired = await forks.findOneAndUpdate(
      { _id: sealed._id, result: { $exists: false } },
      { $set: { status: 'expired' satisfies ForkStatus, updatedAt: now } },
      { returnDocument: 'after' }
    );
    return expired ?? (await forks.findOne({ _id: sealed._id })) ?? sealed;
  }

  const result: ForkResult = {
    placeId: new ObjectId(outcome.winnerId),
    decidedAt: now,
    reasoning: outcome.reasoning,
    weights: outcome.scores,
  };

  const finished = await forks.findOneAndUpdate(
    { _id: sealed._id, result: { $exists: false } },
    { $set: { result, updatedAt: now } },
    { returnDocument: 'after' }
  );
  return finished ?? (await forks.findOne({ _id: sealed._id })) ?? sealed;
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
  if (!fork) throw notFound('Fork');
  if (fork.mode !== 'vote') throw new V2DomainError('Fork is not in vote mode');
  if (fork.status !== 'open') throw new V2DomainError('Fork is no longer open');

  if (rankings.length === 0 || rankings.length > 3) {
    throw new V2DomainError('Rank between one and three options');
  }
  const optionIds = new Set(
    fork.options.map((option) => option.placeId.toString())
  );
  const rankingIds = rankings.map((id) => id.toString());
  if (new Set(rankingIds).size !== rankingIds.length) {
    throw new V2DomainError('Rankings must be distinct');
  }
  if (rankingIds.some((id) => !optionIds.has(id))) {
    throw new V2DomainError('Ranking references an option not on this fork');
  }

  const { forks } = await getV2Db();
  // Dotted paths into the embedded votes array — valid MongoDB the driver
  // types can't express, hence the casts.
  const voterPath = voter.userId ? 'votes.voter.userId' : 'votes.voter.guestId';
  const voterId = voter.userId ?? voter.guestId;
  const ballot: ForkVote = { voter, rankings, submittedAt: now };

  // Atomic upsert without a delete window: a revote is an in-place $set of
  // the voter's existing array element (their old ballot is never removed
  // ahead of the replacement), and a first ballot is a $push guarded on
  // the voter NOT already being present — so a double-submit can't create
  // duplicate ballots, and losing a race to a closer leaves the previous
  // ballot intact. Each updateOne is atomic per document.
  let stored = false;
  for (let attempt = 0; attempt < 2 && !stored; attempt++) {
    const replaced = await forks.updateOne(
      { _id: fork._id, status: 'open', [voterPath]: voterId } as object,
      { $set: { 'votes.$': ballot, updatedAt: now } as object }
    );
    if (replaced.matchedCount > 0) {
      stored = true;
      break;
    }
    const pushed = await forks.updateOne(
      {
        _id: fork._id,
        status: 'open',
        [voterPath]: { $ne: voterId },
      } as object,
      {
        $push: { votes: ballot },
        $set: { updatedAt: now },
        ...(voter.userId
          ? { $addToSet: { participantUserIds: voter.userId } }
          : { $addToSet: { participantGuestIds: voter.guestId ?? '' } }),
      }
    );
    if (pushed.matchedCount > 0) {
      stored = true;
      break;
    }
    // Neither matched: the fork closed, or a concurrent submit from this
    // same voter pushed first — re-check and let the replace path retry.
    const current = await forks.findOne({ _id: fork._id });
    if (!current || current.status !== 'open') {
      throw new V2DomainError('Fork is no longer open');
    }
  }
  if (!stored) throw new V2DomainError('Fork is no longer open');

  const updated = await forks.findOne({ _id: fork._id });
  if (!updated) throw notFound('Fork');

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

/**
 * Open forks a user is part of, newest first — the home "live now" rail.
 * Each candidate goes through the settling read (the lazy-close contract):
 * an overdue fork resolves right here instead of haunting the rail as
 * "Closes in 0:00" forever, and only genuinely open ones are returned.
 */
export async function getOpenForksForUser(
  userId: ObjectId,
  limit: number = 10,
  opts: { now?: Date; rng?: Rng } = {}
): Promise<ForkDoc[]> {
  const { forks } = await getV2Db();
  const candidates = await forks
    .find({ participantUserIds: userId, status: 'open' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  const settled = await Promise.all(
    candidates.map((candidate) => settleFork(candidate, opts))
  );
  return settled.filter((fork) => fork.status === 'open');
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
