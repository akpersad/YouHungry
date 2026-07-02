/**
 * Tap-to-rank: tapping an unranked option appends it (up to `max`);
 * tapping a ranked option removes it and everything below moves up.
 * Pure so the ballot behavior is pinned by unit tests.
 */
export function toggleRank(
  rankings: string[],
  optionId: string,
  max: number = 3
): string[] {
  if (rankings.includes(optionId)) {
    return rankings.filter((id) => id !== optionId);
  }
  if (rankings.length >= max) return rankings;
  return [...rankings, optionId];
}

/** 1-based rank of an option, or null when unranked. */
export function rankOf(rankings: string[], optionId: string): number | null {
  const index = rankings.indexOf(optionId);
  return index === -1 ? null : index + 1;
}
