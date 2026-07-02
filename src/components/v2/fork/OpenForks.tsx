'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Card, Skeleton, SkeletonGroup } from '@/components/v2/ui';
import type { ForkView } from '@/lib/v2/forks';
import { formatRemaining, useNow } from './countdown';

/**
 * "Live now" — the signed-in user's open forks. Renders nothing when
 * signed out or when there is nothing live; the lane home stays a single
 * decisive block for the cold open.
 */
export function OpenForks() {
  const { isLoaded, isSignedIn } = useUser();
  const [forks, setForks] = useState<ForkView[] | null>(null);
  const [failed, setFailed] = useState(false);
  const now = useNow(Boolean(forks && forks.length > 0));

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    fetch('/api/v2/forks')
      .then((response) => {
        if (!response.ok) throw new Error('load failed');
        return response.json();
      })
      .then((payload: { forks: ForkView[] }) => {
        if (!cancelled) setForks(payload.forks);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn || failed) return null;

  if (forks === null) {
    return (
      <section aria-label="Live now">
        <SkeletonGroup label="Loading your open forks">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </SkeletonGroup>
      </section>
    );
  }

  if (forks.length === 0) return null;

  return (
    <section aria-label="Live now" className="flex flex-col gap-3">
      <h2 className="type-board text-sm text-ink-muted">Live now</h2>
      <ul className="flex flex-col gap-3">
        {forks.map((fork) => (
          <li key={fork.code}>
            <Link
              href={`/beta/f/${fork.code}`}
              className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <Card
                variant="outline"
                interactive
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">
                    {fork.mode === 'vote' ? 'Vote' : 'Spin'} ·{' '}
                    {fork.options.length} spots
                  </p>
                  <p className="text-sm text-ink-muted">
                    {fork.mode === 'vote'
                      ? fork.quorum
                        ? `${fork.voteCount} of ${fork.quorum} votes in`
                        : `${fork.voteCount} ${fork.voteCount === 1 ? 'vote' : 'votes'} in`
                      : `by ${fork.organizerName}`}
                  </p>
                </div>
                <p className="tnum shrink-0 font-mono text-sm text-ink-secondary">
                  Closes in {formatRemaining(fork.closesAt, now)}
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
