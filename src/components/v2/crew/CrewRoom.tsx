'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Dialog, EmptyState, Input } from '@/components/v2/ui';
import type { CrewView } from '@/lib/v2/crews';

/**
 * One crew: the people, the shared board, the receipts. "Run it back" is
 * the page's decision moment (gold) — a fresh fork on the last ballot,
 * settling against the crew's shared decay history. The weight board makes
 * "why this pick" visible: recently picked places hold a smaller slice
 * until the 30 days run down.
 */

function daysAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export function CrewRoom({ initial }: { initial: CrewView }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [reforking, setReforking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(initial.name);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  const refork = async () => {
    if (reforking) return;
    setReforking(true);
    setError(null);
    try {
      const response = await fetch(`/api/v2/crews/${initial.id}/refork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'refork failed');
      router.push(`/beta/f/${payload.fork.code}`);
    } catch (err) {
      setReforking(false);
      setError(
        err instanceof Error && err.message !== 'refork failed'
          ? err.message
          : 'Could not start the fork. Try again.'
      );
    }
  };

  const rename = async () => {
    if (renaming) return;
    const next = renameValue.trim();
    if (!next) {
      setRenameError('Give the crew a name');
      return;
    }
    setRenaming(true);
    setRenameError(null);
    try {
      const response = await fetch(`/api/v2/crews/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: next }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'rename failed');
      }
      setName(next);
      setRenameOpen(false);
    } catch (err) {
      setRenameError(
        err instanceof Error && err.message !== 'rename failed'
          ? err.message
          : 'Could not rename it. Try again.'
      );
    } finally {
      setRenaming(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-2">
        <p className="type-board text-sm text-ink-muted">
          <Link
            href="/beta/crew"
            className="rounded outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-focus"
          >
            Crew
          </Link>
        </p>
        <h1 className="type-board text-4xl text-ink sm:text-5xl">{name}</h1>
        <p className="text-ink-secondary">{initial.memberNames.join(' · ')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {initial.forkCount > 0 && (
          <Button onClick={refork} loading={reforking}>
            Run it back
          </Button>
        )}
        <Button
          variant="quiet"
          onClick={() => {
            setRenameValue(name);
            setRenameError(null);
            setRenameOpen(true);
          }}
        >
          Rename
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {initial.weights.length > 0 && (
        <section aria-label="The shared board" className="flex flex-col gap-3">
          <div>
            <h2 className="text-xl font-semibold text-ink">The shared board</h2>
            <p className="text-sm text-ink-secondary">
              Recent picks hold a smaller slice of the next spin. Thirty days
              brings a place all the way back.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {initial.weights.map((row) => (
              <li key={row.placeId} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate font-semibold text-ink">{row.name}</p>
                  <p className="tnum shrink-0 text-sm text-ink-muted">
                    picked {daysAgo(row.lastPickedAt)} ·{' '}
                    {Math.round(row.weight * 100)}%
                  </p>
                </div>
                <div
                  aria-hidden="true"
                  className="h-1.5 w-full overflow-hidden rounded-full bg-sunken"
                >
                  <div
                    className="h-full rounded-full bg-ink-muted"
                    style={{ width: `${Math.round(row.weight * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        aria-label="Crew history"
        className="flex flex-col gap-4 border-t border-line pt-8"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold text-ink">Together so far</h2>
          <p className="tnum text-sm text-ink-muted">
            {initial.forkCount} {initial.forkCount === 1 ? 'fork' : 'forks'}
          </p>
        </div>
        {initial.recentForks.length === 0 ? (
          <EmptyState
            title="No crew forks yet"
            body="Run one and the shared history starts counting."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {initial.recentForks.map((fork) => (
              <li key={fork.code}>
                <Link
                  href={`/beta/f/${fork.code}`}
                  className="flex items-center justify-between gap-3 rounded-lg py-3 outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-focus motion-safe:duration-100"
                >
                  <p className="truncate font-semibold text-ink">
                    {fork.winnerName}
                  </p>
                  <p className="tnum shrink-0 text-sm text-ink-muted">
                    {daysAgo(fork.decidedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename this crew"
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void rename();
          }}
        >
          <Input
            label="Crew name"
            value={renameValue}
            onChange={(event) => {
              setRenameValue(event.target.value);
              if (renameError) setRenameError(null);
            }}
            error={renameError ?? undefined}
            maxLength={40}
          />
          <div className="flex gap-2">
            <Button type="submit" variant="quiet" loading={renaming}>
              Rename it
            </Button>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Dialog>
    </main>
  );
}
