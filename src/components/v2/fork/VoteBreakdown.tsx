import { cx } from '@/components/v2/ui/cx';
import type { ForkView } from '@/lib/v2/forks';

/**
 * Post-close tally. The 3/2/1 scoring still decides the ORDER (and the
 * winner), but the display speaks in ballots and picks — a visible
 * "7 pts" reads as "7 people voted for it" to anyone outside the design
 * room (owner catch 2026-07-02). Winner marked by word and position,
 * never color alone; numbers mono + tabular.
 */
export function VoteBreakdown({ fork }: { fork: ForkView }) {
  if (!fork.breakdown || !fork.result) return null;
  const breakdown = fork.breakdown;

  const rows = fork.options
    .map((option) => ({
      ...option,
      entry: breakdown[option.id] ?? {
        first: 0,
        second: 0,
        third: 0,
        total: 0,
      },
    }))
    .sort((a, b) => b.entry.total - a.entry.total);

  return (
    <section
      aria-label="How the vote broke down"
      className="flex flex-col gap-2"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="type-board text-sm text-ink-muted">The tally</h2>
        <p className="tnum font-mono text-sm text-ink-muted">
          {fork.voteCount} {fork.voteCount === 1 ? 'ballot' : 'ballots'}
        </p>
      </div>
      <ol className="divide-y divide-line rounded-2xl border border-line">
        {rows.map((row) => {
          const isWinner = row.id === fork.result!.placeId;
          const rankedBy = row.entry.first + row.entry.second + row.entry.third;
          const placings = [
            row.entry.first > 0 ? `first pick ×${row.entry.first}` : null,
            row.entry.second > 0 ? `second ×${row.entry.second}` : null,
            row.entry.third > 0 ? `third ×${row.entry.third}` : null,
          ]
            .filter(Boolean)
            .join(' · ');
          return (
            <li
              key={row.id}
              className={cx(
                'flex items-center justify-between gap-3 px-4 py-3',
                isWinner && 'bg-gold-tint'
              )}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">
                  {row.name}
                  {isWinner && (
                    <span className="ml-2 text-sm font-semibold text-brass">
                      Winner
                    </span>
                  )}
                </p>
                {placings && (
                  <p className="text-sm text-ink-muted">{placings}</p>
                )}
              </div>
              {rankedBy > 0 ? (
                <p className="tnum shrink-0 font-mono text-lg text-ink">
                  {rankedBy}
                  <span className="ml-1 text-sm text-ink-muted">ranked it</span>
                </p>
              ) : (
                <p className="shrink-0 text-sm text-ink-muted">Not ranked</p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
