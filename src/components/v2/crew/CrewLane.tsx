'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, ButtonLink, EmptyState } from '@/components/v2/ui';
import type { HistoryEntry } from '@/lib/v2/forks';

/**
 * The Crew lane (CHARTER lane 3): my people, our history. Crews are never
 * created from a blank form — the lane surfaces groups that already exist
 * in the fork record and offers to name them. History keeps the receipts
 * underneath. "Make it a crew" is the lane's decision moment (gold).
 */

export interface SuggestionView {
  memberIds: string[];
  /** "You, Marco & Mia" — caller folded in server-side. */
  displayLine: string;
  /** Real first names for the stored crew name ("Olivia, Marco & Mia"). */
  defaultName: string;
  forkCount: number;
}

export interface CrewSummaryView {
  id: string;
  name: string;
  memberCount: number;
}

export interface HistoryStats {
  total: number;
  distinctPlaces: number;
  topPlace: { name: string; count: number } | null;
}

function daysAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export function CrewLane({
  suggestions: initialSuggestions,
  crews: initialCrews,
  history,
  stats,
}: {
  suggestions: SuggestionView[];
  crews: CrewSummaryView[];
  history: HistoryEntry[];
  stats: HistoryStats;
}) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [crews, setCrews] = useState(initialCrews);
  const [acceptingKey, setAcceptingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accept = async (suggestion: SuggestionView) => {
    const key = suggestion.memberIds.join(':');
    if (acceptingKey) return;
    setAcceptingKey(key);
    setError(null);
    try {
      const response = await fetch('/api/v2/crews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suggestion.defaultName,
          memberIds: suggestion.memberIds,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? 'create failed');
      }
      setSuggestions((current) =>
        current.filter((s) => s.memberIds.join(':') !== key)
      );
      setCrews((current) => [payload.crew, ...current]);
      router.push(`/crew/${payload.crew.id}`);
    } catch (err) {
      setAcceptingKey(null);
      setError(
        err instanceof Error && err.message !== 'create failed'
          ? err.message
          : 'Could not make the crew. Try again.'
      );
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-2">
        <p className="type-board text-sm text-ink-muted">Crew</p>
        <h1 className="type-board text-4xl text-ink sm:text-5xl">
          Your people, your record
        </h1>
        <p className="max-w-lg text-ink-secondary">
          Fork with the same people a few times and they become a crew, with
          shared history. Nobody fills out a form.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {suggestions.length > 0 && (
        <section aria-label="Crew suggestions" className="flex flex-col gap-3">
          {suggestions.map((suggestion) => {
            const key = suggestion.memberIds.join(':');
            return (
              <div
                key={key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4"
              >
                <div>
                  <p className="font-semibold text-ink">
                    {suggestion.displayLine}
                  </p>
                  <p className="text-sm text-ink-secondary">
                    {suggestion.forkCount} forks together and counting.
                  </p>
                </div>
                <Button
                  onClick={() => accept(suggestion)}
                  loading={acceptingKey === key}
                >
                  Make it a crew
                </Button>
              </div>
            );
          })}
        </section>
      )}

      <section aria-label="Your crews" className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-ink">Your crews</h2>
        {crews.length === 0 ? (
          <EmptyState
            title="No crews yet"
            body="Close a few forks with the same people and the offer shows up here."
            action={
              <ButtonLink href="/new" variant="quiet">
                Start a fork
              </ButtonLink>
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {crews.map((crew) => (
              <li key={crew.id}>
                <Link
                  href={`/crew/${crew.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-focus motion-safe:duration-100"
                >
                  <span className="min-w-0 truncate font-semibold text-ink">
                    {crew.name}
                  </span>
                  <span className="tnum shrink-0 text-sm text-ink-muted">
                    {crew.memberCount} people
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-label="History"
        className="flex flex-col gap-4 border-t border-line pt-8"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold text-ink">History</h2>
          {stats.total > 0 && (
            <p className="tnum text-sm text-ink-muted">
              {stats.total} {stats.total === 1 ? 'decision' : 'decisions'} ·{' '}
              {stats.distinctPlaces}{' '}
              {stats.distinctPlaces === 1 ? 'place' : 'places'}
              {stats.topPlace && stats.topPlace.count > 1
                ? ` · ${stats.topPlace.name} leads with ${stats.topPlace.count}`
                : ''}
            </p>
          )}
        </div>

        {history.length === 0 ? (
          <EmptyState
            title="Nothing decided yet"
            body="Spin near you or start a fork. Every result lands here."
            action={
              <ButtonLink href="/" variant="quiet">
                Decide something
              </ButtonLink>
            }
          />
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {history.map((entry) => (
              <li key={entry.code}>
                <Link
                  href={`/f/${entry.code}`}
                  className="flex items-center justify-between gap-3 rounded-lg py-3 outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-focus motion-safe:duration-100"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {entry.winnerName}
                    </p>
                    <p className="text-sm text-ink-secondary">
                      {entry.mode === 'vote'
                        ? entry.voteCount === 1
                          ? 'Voted, 1 ballot'
                          : `Voted, ${entry.voteCount} ballots`
                        : 'Spun'}{' '}
                      · {daysAgo(entry.decidedAt)}
                    </p>
                  </div>
                  <span aria-hidden="true" className="shrink-0 text-ink-muted">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
