/**
 * v2 decision engine — the v1 IP (`src/lib/decisions.ts`) ported as pure
 * functions. Same math, zero I/O: history, clock, and randomness are inputs,
 * so every path is deterministic under test and reusable for both personal
 * and crew forks.
 *
 * Semantics preserved from v1 (verified against its test suite):
 * - Decay weight: base × (0.1 + 0.9 × min(daysSince/30, 1)), whole days
 *   (floor); never selected in the last 30 days → full base weight.
 * - Weighted spin: linear scan subtraction; falls back to the last candidate
 *   on floating-point residue.
 * - Ranked consensus: only the top three ranks score (3/2/1); rankings for
 *   options no longer on the ballot are skipped; ties resolve randomly.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const DECAY_WINDOW_DAYS = 30;
const WEIGHT_FLOOR = 0.1;

export type Rng = () => number;

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

/** One completed decision in scope for weight calculation. */
export interface SelectionEvent {
  optionId: string;
  decidedAt: Date;
}

/**
 * Decay weight for a single option given when it was last selected.
 * `lastSelectedAt` older than 30 days (or absent) yields the full base.
 */
export function calculateDecayWeight(
  lastSelectedAt: Date | undefined,
  now: Date,
  baseWeight: number = 1.0
): number {
  if (!lastSelectedAt) return baseWeight;
  const daysSince = Math.floor(
    (now.getTime() - lastSelectedAt.getTime()) / DAY_MS
  );
  if (daysSince >= DECAY_WINDOW_DAYS) return baseWeight;
  const multiplier = Math.min(daysSince / DECAY_WINDOW_DAYS, 1);
  return baseWeight * (WEIGHT_FLOOR + (1 - WEIGHT_FLOOR) * multiplier);
}

/**
 * Weights for a whole option set from a selection history (most recent
 * selection of each option wins, matching v1's sort-then-take-first).
 * Events outside the 30-day window are ignored.
 */
export function weightsFromHistory(
  optionIds: string[],
  history: SelectionEvent[],
  now: Date = new Date()
): Record<string, number> {
  const windowStart = now.getTime() - DECAY_WINDOW_DAYS * DAY_MS;
  const lastSelected = new Map<string, Date>();
  for (const event of history) {
    if (event.decidedAt.getTime() < windowStart) continue;
    const existing = lastSelected.get(event.optionId);
    if (!existing || event.decidedAt > existing) {
      lastSelected.set(event.optionId, event.decidedAt);
    }
  }
  const weights: Record<string, number> = {};
  for (const id of optionIds) {
    weights[id] = calculateDecayWeight(lastSelected.get(id), now);
  }
  return weights;
}

// ---------------------------------------------------------------------------
// Spin (weighted random)
// ---------------------------------------------------------------------------

export interface SpinOutcome {
  selectedId: string;
  weights: Record<string, number>;
  reasoning: string;
}

/**
 * Weighted-random selection. Throws on an empty option set — the caller
 * decides what an empty fork means; the math doesn't guess.
 */
export function weightedSpin(
  weights: Record<string, number>,
  rng: Rng = Math.random
): SpinOutcome {
  const entries = Object.entries(weights);
  if (entries.length === 0) {
    throw new Error('Cannot spin with no options');
  }

  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  let randomValue = rng() * totalWeight;

  let selectedId: string | null = null;
  for (const [id, weight] of entries) {
    randomValue -= weight;
    if (randomValue <= 0) {
      selectedId = id;
      break;
    }
  }
  // Floating-point residue can leave randomValue > 0 after the loop.
  if (selectedId === null) {
    selectedId = entries[entries.length - 1][0];
  }

  return {
    selectedId,
    weights,
    reasoning: `Weighted spin: weight ${weights[selectedId].toFixed(2)} of ${totalWeight.toFixed(2)} total across ${entries.length} options.`,
  };
}

// ---------------------------------------------------------------------------
// Ranked-choice consensus (3/2/1)
// ---------------------------------------------------------------------------

export interface RankedBallot {
  /** Stable identity of the voter (userId or guestId) — dedup is upstream. */
  voterKey: string;
  /** Option ids in preference order; only the first three score. */
  rankings: string[];
}

export interface BreakdownEntry {
  first: number;
  second: number;
  third: number;
  total: number;
}

export interface ConsensusOutcome {
  winnerId: string | null;
  reasoning: string;
  breakdown: Record<string, BreakdownEntry>;
  scores: Record<string, number>;
}

/**
 * Score ranked ballots and resolve a winner. Rankings referencing options
 * not in `optionIds` (removed after the ballot was cast) are skipped, and
 * ties break randomly via `rng` — both v1-proven behaviors.
 */
export function resolveConsensus(
  ballots: RankedBallot[],
  optionIds: string[],
  rng: Rng = Math.random
): ConsensusOutcome {
  const scores: Record<string, number> = {};
  const breakdown: Record<string, BreakdownEntry> = {};
  for (const id of optionIds) {
    scores[id] = 0;
    breakdown[id] = { first: 0, second: 0, third: 0, total: 0 };
  }

  if (ballots.length === 0) {
    return {
      winnerId: null,
      reasoning: 'No votes submitted',
      breakdown,
      scores,
    };
  }

  for (const ballot of ballots) {
    ballot.rankings.forEach((optionId, index) => {
      if (index > 2) return;
      if (!(optionId in scores)) return; // ghost ranking — option removed
      const points = 3 - index;
      scores[optionId] += points;
      if (index === 0) breakdown[optionId].first++;
      else if (index === 1) breakdown[optionId].second++;
      else breakdown[optionId].third++;
      breakdown[optionId].total += points;
    });
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return {
      winnerId: null,
      reasoning: 'No options available to choose from',
      breakdown,
      scores,
    };
  }

  const topScore = sorted[0][1];
  const tied = sorted.filter(([, score]) => score === topScore);

  if (tied.length === 1) {
    return {
      winnerId: sorted[0][0],
      reasoning: `Clear winner with ${topScore} points (${ballots.length} votes total)`,
      breakdown,
      scores,
    };
  }

  const winnerId = tied[Math.floor(rng() * tied.length)][0];
  return {
    winnerId,
    reasoning: `Tie between ${tied.length} options with ${topScore} points each; selected randomly.`,
    breakdown,
    scores,
  };
}
