import {
  calculateDecayWeight,
  weightsFromHistory,
  weightedSpin,
  resolveConsensus,
  type RankedBallot,
  type SelectionEvent,
} from '../decision-engine';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-07-02T12:00:00.000Z');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY_MS);
}

describe('calculateDecayWeight', () => {
  it('returns full base weight when never selected', () => {
    expect(calculateDecayWeight(undefined, NOW)).toBe(1.0);
  });

  it('returns the 10% floor when selected today', () => {
    expect(calculateDecayWeight(NOW, NOW)).toBeCloseTo(0.1);
  });

  it('returns the midpoint weight at 15 days (v1 parity)', () => {
    // 0.1 + 0.9 * 15/30 = 0.55
    expect(calculateDecayWeight(daysAgo(15), NOW)).toBeCloseTo(0.55);
  });

  it('returns full weight at exactly 30 days', () => {
    expect(calculateDecayWeight(daysAgo(30), NOW)).toBe(1.0);
  });

  it('returns full weight beyond 30 days', () => {
    expect(calculateDecayWeight(daysAgo(90), NOW)).toBe(1.0);
  });

  it('floors partial days like v1 (23.9h since selection = 0 whole days)', () => {
    const almostOneDay = new Date(NOW.getTime() - (DAY_MS - 60_000));
    expect(calculateDecayWeight(almostOneDay, NOW)).toBeCloseTo(0.1);
  });

  it('scales with a non-default base weight', () => {
    expect(calculateDecayWeight(daysAgo(15), NOW, 2.0)).toBeCloseTo(1.1);
  });
});

describe('weightsFromHistory', () => {
  it('gives full weight to options with no history', () => {
    expect(weightsFromHistory(['a', 'b'], [], NOW)).toEqual({ a: 1, b: 1 });
  });

  it('uses the most recent selection per option', () => {
    const history: SelectionEvent[] = [
      { optionId: 'a', decidedAt: daysAgo(20) },
      { optionId: 'a', decidedAt: daysAgo(3) }, // more recent — wins
    ];
    const weights = weightsFromHistory(['a'], history, NOW);
    expect(weights.a).toBeCloseTo(0.1 + 0.9 * (3 / 30));
  });

  it('order of history events does not matter', () => {
    const forward: SelectionEvent[] = [
      { optionId: 'a', decidedAt: daysAgo(3) },
      { optionId: 'a', decidedAt: daysAgo(20) },
    ];
    expect(weightsFromHistory(['a'], forward, NOW)).toEqual(
      weightsFromHistory(['a'], [...forward].reverse(), NOW)
    );
  });

  it('ignores selections outside the 30-day window', () => {
    const history: SelectionEvent[] = [
      { optionId: 'a', decidedAt: daysAgo(45) },
    ];
    expect(weightsFromHistory(['a'], history, NOW).a).toBe(1.0);
  });

  it('ignores history for options not in the set', () => {
    const history: SelectionEvent[] = [
      { optionId: 'ghost', decidedAt: daysAgo(1) },
    ];
    expect(weightsFromHistory(['a'], history, NOW)).toEqual({ a: 1 });
  });
});

describe('weightedSpin', () => {
  it('throws on an empty option set', () => {
    expect(() => weightedSpin({})).toThrow('Cannot spin with no options');
  });

  it('always picks the only option', () => {
    expect(weightedSpin({ solo: 0.1 }, () => 0.99).selectedId).toBe('solo');
  });

  it('is deterministic under an injected rng', () => {
    const weights = { a: 1, b: 1, c: 1 };
    // total 3; rng 0 → first bucket, rng ~1 → last bucket
    expect(weightedSpin(weights, () => 0).selectedId).toBe('a');
    expect(weightedSpin(weights, () => 0.4).selectedId).toBe('b');
    expect(weightedSpin(weights, () => 0.99).selectedId).toBe('c');
  });

  it('respects weight proportions in bucket boundaries', () => {
    const weights = { heavy: 9, light: 1 }; // total 10
    expect(weightedSpin(weights, () => 0.89).selectedId).toBe('heavy');
    expect(weightedSpin(weights, () => 0.91).selectedId).toBe('light');
  });

  it('falls back to the last option when rng returns exactly 1', () => {
    // randomValue never reaches <= 0 in the scan; v1's residue fallback.
    expect(weightedSpin({ a: 1, b: 1 }, () => 1).selectedId).toBe('b');
  });

  it('returns the full weight map and a reasoning string', () => {
    const outcome = weightedSpin({ a: 0.55, b: 1 }, () => 0);
    expect(outcome.weights).toEqual({ a: 0.55, b: 1 });
    expect(outcome.reasoning).toContain('Weighted spin');
    expect(outcome.reasoning).toContain('2 options');
  });

  it('heavily down-weighted options still win when rng lands on them', () => {
    const outcome = weightedSpin({ recent: 0.1, fresh: 1.0 }, () => 0.01);
    expect(outcome.selectedId).toBe('recent');
  });
});

describe('resolveConsensus', () => {
  const OPTIONS = ['a', 'b', 'c', 'd'];

  function ballot(voterKey: string, rankings: string[]): RankedBallot {
    return { voterKey, rankings };
  }

  it('returns null winner with empty ballots and a zeroed breakdown', () => {
    const outcome = resolveConsensus([], OPTIONS);
    expect(outcome.winnerId).toBeNull();
    expect(outcome.reasoning).toBe('No votes submitted');
    expect(outcome.breakdown.a).toEqual({
      first: 0,
      second: 0,
      third: 0,
      total: 0,
    });
  });

  it('returns null winner when there are no options', () => {
    const outcome = resolveConsensus([ballot('u1', ['a'])], []);
    expect(outcome.winnerId).toBeNull();
  });

  it('scores 3/2/1 for the top three ranks', () => {
    const outcome = resolveConsensus([ballot('u1', ['a', 'b', 'c'])], OPTIONS);
    expect(outcome.scores).toEqual({ a: 3, b: 2, c: 1, d: 0 });
    expect(outcome.winnerId).toBe('a');
    // Reasoning speaks in ballots, never points (points read as headcounts).
    expect(outcome.reasoning).toBe('Ranked highest across 1 ballot.');
    expect(outcome.breakdown.a).toEqual({
      first: 1,
      second: 0,
      third: 0,
      total: 3,
    });
  });

  it('ignores ranks beyond the top three (v1 parity)', () => {
    const outcome = resolveConsensus(
      [ballot('u1', ['a', 'b', 'c', 'd'])],
      OPTIONS
    );
    expect(outcome.scores.d).toBe(0);
    expect(outcome.breakdown.d).toEqual({
      first: 0,
      second: 0,
      third: 0,
      total: 0,
    });
  });

  it('skips ghost rankings for options no longer on the ballot', () => {
    const outcome = resolveConsensus([ballot('u1', ['removed', 'a'])], OPTIONS);
    // 'removed' is skipped but does NOT shift ranks: 'a' stays 2nd = 2 pts.
    expect(outcome.scores.a).toBe(2);
    expect(outcome.winnerId).toBe('a');
    expect(outcome.scores).not.toHaveProperty('removed');
  });

  it('aggregates across voters', () => {
    const outcome = resolveConsensus(
      [
        ballot('u1', ['a', 'b', 'c']),
        ballot('u2', ['b', 'a', 'c']),
        ballot('u3', ['a', 'c', 'b']),
      ],
      OPTIONS
    );
    expect(outcome.scores).toEqual({ a: 8, b: 6, c: 4, d: 0 });
    expect(outcome.winnerId).toBe('a');
    expect(outcome.reasoning).toBe('Ranked highest across 3 ballots.');
  });

  it('breaks ties randomly via the injected rng', () => {
    const ballots = [ballot('u1', ['a']), ballot('u2', ['b'])];
    const pickFirst = resolveConsensus(ballots, OPTIONS, () => 0);
    const pickSecond = resolveConsensus(ballots, OPTIONS, () => 0.99);
    expect(pickFirst.winnerId).toBe('a');
    expect(pickSecond.winnerId).toBe('b');
    expect(pickFirst.reasoning).toBe(
      'Dead even at the top between 2 options. The board called it.'
    );
  });

  it('a tie among a subset still excludes lower scorers', () => {
    const ballots = [ballot('u1', ['a', 'c']), ballot('u2', ['b', 'c'])];
    // a=3, b=3, c=4 → c is the clear winner, no tie-break.
    const outcome = resolveConsensus(ballots, OPTIONS);
    expect(outcome.winnerId).toBe('c');
  });
});
