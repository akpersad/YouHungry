'use client';

import { cn } from '@/lib/utils';

interface BreakdownEntry {
  first: number;
  second: number;
  third: number;
  total: number;
}

interface BreakdownRestaurant {
  _id: string;
  name: string;
}

interface VoteBreakdownProps {
  /** Aggregated tally keyed by restaurant id (from the decision API). */
  breakdown: Record<string, BreakdownEntry>;
  /** Restaurants in the collection, for resolving names. */
  restaurants: BreakdownRestaurant[];
  /** The winning restaurant id, highlighted in the list. */
  winnerId?: string;
  className?: string;
}

/**
 * How the tiered vote fell — a ranked bar chart of total points per restaurant
 * (1st = 3pts, 2nd = 2, 3rd = 1) with the per-rank tally underneath. Closes the
 * "votes never shown" gap (O8/V7).
 */
export function VoteBreakdown({
  breakdown,
  restaurants,
  winnerId,
  className,
}: VoteBreakdownProps) {
  const rows = Object.entries(breakdown)
    .map(([restaurantId, entry]) => ({
      restaurantId,
      name:
        restaurants.find((r) => r._id === restaurantId)?.name ??
        'Removed restaurant',
      ...entry,
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);

  if (rows.length === 0) {
    return (
      <p className={cn('text-sm text-ink-muted', className)}>
        No ranked votes were recorded.
      </p>
    );
  }

  const maxTotal = Math.max(...rows.map((r) => r.total));

  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-sm font-medium text-ink-secondary">How votes fell</h4>
      <ul className="space-y-2.5">
        {rows.map((row) => {
          const isWinner = row.restaurantId === winnerId;
          const widthPct = Math.round((row.total / maxTotal) * 100);
          return (
            <li key={row.restaurantId} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={cn(
                    'text-sm font-medium truncate',
                    isWinner ? 'text-ink' : 'text-ink-secondary'
                  )}
                >
                  {isWinner && (
                    <span aria-hidden="true" className="mr-1">
                      🏆
                    </span>
                  )}
                  {row.name}
                </span>
                <span className="shrink-0 text-xs font-semibold text-ink-muted tabular-nums">
                  {row.total} {row.total === 1 ? 'pt' : 'pts'}
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full"
                style={{ background: 'var(--surface-sunken)' }}
                role="presentation"
              >
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{
                    width: `${widthPct}%`,
                    background: isWinner ? 'var(--tomato)' : 'var(--olive)',
                  }}
                />
              </div>
              <p className="text-xs text-ink-muted tabular-nums">
                {row.first} × 1st · {row.second} × 2nd · {row.third} × 3rd
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
