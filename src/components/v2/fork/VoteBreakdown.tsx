import { cx } from '@/components/v2/ui/cx';
import type { ForkView } from '@/lib/v2/forks';

/**
 * Post-close tally: points per option (3/2/1), winner marked by word and
 * position, never color alone. Numbers are mono + tabular — ticket energy.
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
      <h2 className="type-board text-sm text-ink-muted">The tally</h2>
      <ol className="divide-y divide-line rounded-2xl border border-line">
        {rows.map((row) => {
          const isWinner = row.id === fork.result!.placeId;
          const placings = [
            row.entry.first > 0 ? `${row.entry.first}× first` : null,
            row.entry.second > 0 ? `${row.entry.second}× second` : null,
            row.entry.third > 0 ? `${row.entry.third}× third` : null,
          ]
            .filter(Boolean)
            .join(', ');
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
              <p className="tnum shrink-0 font-mono text-lg text-ink">
                {row.entry.total}
                <span className="ml-1 text-sm text-ink-muted">pts</span>
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
