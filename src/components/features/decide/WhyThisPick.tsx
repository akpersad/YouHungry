'use client';

import { useQuery } from '@tanstack/react-query';

interface WeightEntry {
  restaurantId: string;
  name: string;
  currentWeight: number;
  selectionCount: number;
  lastSelected?: string;
  daysUntilFullWeight: number;
}

interface WhyThisPickProps {
  collectionId: string;
  restaurantId: string;
}

async function fetchWeights(collectionId: string): Promise<WeightEntry[]> {
  const res = await fetch(
    `/api/decisions/weights?collectionId=${collectionId}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load weights');
  return data.weights ?? [];
}

function lastVisitedLabel(lastSelected?: string): string {
  if (!lastSelected) return 'Never picked before — a fresh choice.';
  const days = Math.floor(
    (Date.now() - new Date(lastSelected).getTime()) / 86_400_000
  );
  if (days <= 0) return 'Last picked today.';
  if (days === 1) return 'Last picked yesterday.';
  if (days >= 30) return 'Not picked in over a month — well rested.';
  return `Last picked ${days} days ago.`;
}

/**
 * Explains a weighted-random pick with the real numbers (replaces the generic
 * "weighted random selection" string): how this restaurant's odds compared to
 * the rest of the collection, and how recently it was last chosen.
 */
export function WhyThisPick({ collectionId, restaurantId }: WhyThisPickProps) {
  const { data: weights, isLoading } = useQuery({
    queryKey: ['decisions', 'weights', collectionId],
    queryFn: () => fetchWeights(collectionId),
    enabled: !!collectionId,
    staleTime: 60 * 1000,
  });

  if (isLoading || !weights || weights.length === 0) return null;

  const mine = weights.find((w) => w.restaurantId === restaurantId);
  if (!mine) return null;

  const maxWeight = Math.max(...weights.map((w) => w.currentWeight));
  const pct =
    maxWeight > 0 ? Math.round((mine.currentWeight / maxWeight) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-surface-sunken p-4">
      <h4 className="mb-3 text-sm font-semibold text-ink">Why this pick?</h4>

      <div className="mb-2 flex items-center justify-between text-xs text-ink-secondary">
        <span>Chance relative to the field</span>
        <span className="font-medium text-ink">{pct}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: 'var(--border)' }}
        role="img"
        aria-label={`This restaurant's selection chance was ${pct} percent of the strongest candidate`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: 'var(--tomato)' }}
        />
      </div>

      <p className="mt-3 text-sm text-ink-secondary">
        {lastVisitedLabel(mine.lastSelected)}
        {mine.selectionCount > 0 &&
          ` Picked ${mine.selectionCount} ${
            mine.selectionCount === 1 ? 'time' : 'times'
          } from this collection.`}
      </p>
    </div>
  );
}
