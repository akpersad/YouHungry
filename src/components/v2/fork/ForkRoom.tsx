'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  ButtonLink,
  Dialog,
  EmptyState,
  Input,
  Reveal,
} from '@/components/v2/ui';
import { cx } from '@/components/v2/ui/cx';
import { SaveToListDialog } from '@/components/v2/places/SaveToListDialog';
import type { ForkView } from '@/lib/v2/forks';
import { formatRemaining, useNow } from './countdown';
import { rankOf, toggleRank } from './ranking';
import { VoteBreakdown } from './VoteBreakdown';

/**
 * The fork page: live state while it's open (SSE), the reveal when it
 * closes, the tally after. One component serves both modes — a spin waits
 * on the organizer's lever; a vote collects ranked ballots until quorum or
 * the timer calls it.
 *
 * Phase 4: this is the public Fork Link surface. Signed-in members, guests
 * (signed cookie), and anonymous link-bearers all land here; guests can
 * rank and vote with nothing but a name (the vote POST carries the signed
 * fork token and mints their identity), and a signed-in viewer with
 * unclaimed guest votes in this browser gets the claim banner.
 */

export interface RoomViewer {
  kind: 'user' | 'guest' | 'anonymous';
  displayName: string | null;
}

export interface ForkRoomProps {
  initial: ForkView;
  /** Defaults to a signed-in viewer (Phase 3 semantics) for existing call sites. */
  viewer?: RoomViewer;
  /** Signed token authorizing guest ballots on this fork; null when closed. */
  forkToken?: string | null;
  /** Set when the signed-in viewer holds an unclaimed guest identity. */
  claimGuestName?: string | null;
}

function closedContext(fork: ForkView): string {
  if (fork.mode === 'vote') {
    // The engine's consensus reasoning is already written for humans.
    return fork.result?.reasoning ?? '';
  }
  return `Fate picked from ${fork.options.length} spots.`;
}

export function ForkRoom({
  initial,
  viewer: initialViewer = { kind: 'user', displayName: null },
  forkToken = null,
  claimGuestName = null,
}: ForkRoomProps) {
  const [fork, setFork] = useState(initial);
  // Theater plays only for a close we witness live; a reloaded closed fork
  // goes straight to the result (no re-run of the one sanctioned moment).
  const [showTheater, setShowTheater] = useState(false);
  const [revealDone, setRevealDone] = useState(initial.status !== 'open');
  const statusRef = useRef(initial.status);

  const [rankings, setRankings] = useState<string[]>(initial.myRankings ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [viewer, setViewer] = useState(initialViewer);
  const [name, setName] = useState(initialViewer.displayName ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  // The viewer's ballot as confirmed by a vote response. The SSE stream
  // resolved identity at connect time, so for a guest whose cookie was
  // minted mid-stream its frames say "no ballot" — this fills that gap.
  const [castBallot, setCastBallot] = useState<string[] | null>(null);

  const [claim, setClaim] = useState<'offer' | 'claiming' | 'done' | 'hidden'>(
    claimGuestName ? 'offer' : 'hidden'
  );
  const [claimError, setClaimError] = useState<string | null>(null);

  const [decideOpen, setDecideOpen] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [decideError, setDecideError] = useState<string | null>(null);

  const [keepOpen, setKeepOpen] = useState(false);
  const [keptOn, setKeptOn] = useState<string | null>(null);

  const now = useNow(fork.status === 'open');

  const myBallot = fork.myRankings ?? castBallot;

  // Stable: touches only setState + a ref, both fine outside render.
  const applyUpdate = useCallback((next: ForkView) => {
    if (statusRef.current === 'open' && next.status === 'closed') {
      setShowTheater(true);
      setRevealDone(false);
    }
    statusRef.current = next.status;
    setFork(next);
  }, []);

  // Live updates while open. The stream also drives the lazy timer close —
  // the server settles the fork on every poll.
  useEffect(() => {
    if (fork.status !== 'open') return;
    const source = new EventSource(`/api/v2/forks/${fork.code}/live`);
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'fork') applyUpdate(payload.fork);
      } catch {
        // Malformed frame — the next poll supersedes it.
      }
    };
    return () => source.close();
  }, [fork.status, fork.code, applyUpdate]);

  const castVote = async () => {
    if (submitting || rankings.length === 0) return;

    let body: Record<string, unknown> = { rankings };
    if (viewer.kind !== 'user') {
      const trimmed = name.trim();
      if (!trimmed) {
        setNameError('Pick a name so the group knows who voted');
        return;
      }
      body = { rankings, forkToken, displayName: trimmed };
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/v2/forks/${fork.code}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'vote failed');
      applyUpdate(payload.fork);
      setCastBallot(payload.fork.myRankings ?? rankings);
      if (viewer.kind !== 'user') {
        setViewer({ kind: 'guest', displayName: name.trim() });
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message !== 'vote failed'
          ? err.message
          : 'Your vote did not go through. Try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const decideNow = async () => {
    if (deciding) return;
    setDeciding(true);
    setDecideError(null);
    try {
      const response = await fetch(`/api/v2/forks/${fork.code}/decide`, {
        method: 'POST',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'decide failed');
      setDecideOpen(false);
      applyUpdate(payload.fork);
    } catch (err) {
      setDecideError(
        err instanceof Error && err.message !== 'decide failed'
          ? err.message
          : 'That did not go through. Try again.'
      );
    } finally {
      setDeciding(false);
    }
  };

  const claimVotes = async () => {
    if (claim === 'claiming') return;
    setClaim('claiming');
    setClaimError(null);
    try {
      const response = await fetch('/api/v2/guests/claim', { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'claim failed');
      setClaim('done');
    } catch (err) {
      setClaim('offer');
      setClaimError(
        err instanceof Error && err.message !== 'claim failed'
          ? err.message
          : 'That claim did not go through. Try again.'
      );
    }
  };

  const spin = async () => {
    if (spinning) return;
    setSpinning(true);
    setError(null);
    try {
      const response = await fetch(`/api/v2/forks/${fork.code}/spin`, {
        method: 'POST',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'spin failed');
      applyUpdate(payload.fork);
    } catch (err) {
      setError(
        err instanceof Error && err.message !== 'spin failed'
          ? err.message
          : 'The spin did not go through. Try again.'
      );
    } finally {
      setSpinning(false);
    }
  };

  const copyLink = async () => {
    try {
      // The short link is the shareable artifact — group-chat friendly.
      await navigator.clipboard.writeText(
        `${window.location.origin}/f/${fork.code}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the URL bar still works.
    }
  };

  const heading =
    fork.status === 'closed'
      ? 'It’s decided'
      : fork.status === 'expired' || fork.status === 'canceled'
        ? 'This one expired'
        : fork.mode === 'vote'
          ? 'Rank your top 3'
          : fork.isOrganizer
            ? 'Let fate call it'
            : 'Waiting on the spin';

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="type-board text-sm text-ink-muted">
            Fork <span className="tnum font-mono uppercase">{fork.code}</span>
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="h-9 rounded-md px-2 text-sm font-semibold text-brass outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <h1 className="type-board text-3xl text-ink sm:text-4xl">{heading}</h1>
        <p className="text-sm text-ink-secondary">
          by {fork.organizerName}
          {fork.status === 'open' && (
            <>
              {' · '}
              <span className="tnum font-mono">
                Closes in {formatRemaining(fork.closesAt, now)}
              </span>
              {fork.mode === 'vote' && fork.quorum
                ? ` · closes early at ${fork.quorum} votes`
                : null}
            </>
          )}
        </p>
      </header>

      {/* Claim: signed in, with guest votes still riding this browser */}
      {claim !== 'hidden' && (
        <section
          aria-label="Claim your votes"
          className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
        >
          {claim === 'done' ? (
            <p role="status" className="text-sm font-semibold text-ink">
              Claimed. Votes cast as {claimGuestName} are yours now, history and
              all.
            </p>
          ) : (
            <>
              <p className="text-sm text-ink-secondary">
                Votes cast in this browser as {claimGuestName} are not on your
                account yet. Claim them and they count toward your history.
              </p>
              {claimError && (
                <p role="alert" className="text-sm text-danger">
                  {claimError}
                </p>
              )}
              <div>
                <Button
                  variant="quiet"
                  onClick={claimVotes}
                  loading={claim === 'claiming'}
                >
                  Claim your votes
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      {/* Terminal: expired with nothing decided */}
      {(fork.status === 'expired' || fork.status === 'canceled') && (
        <EmptyState
          title="The timer ran out before anyone decided"
          body="No harm done. Start another and let the board call it."
          action={
            <ButtonLink href="/new" variant="quiet">
              Start another fork
            </ButtonLink>
          }
        />
      )}

      {/* Terminal: decided */}
      {fork.status === 'closed' && fork.result && (
        <div className="flex flex-col gap-6">
          <Reveal
            candidates={fork.options.map((option) => option.name)}
            winner={fork.result.name}
            context={closedContext(fork)}
            reduceMotion={showTheater ? undefined : true}
            onDone={() => setRevealDone(true)}
          />
          {revealDone && fork.result.place && (
            <div className="text-sm text-ink-secondary">
              <p>{fork.result.place.address}</p>
              {(fork.result.place.rating || fork.result.place.priceLevel) && (
                <p className="tnum mt-0.5 text-ink-muted">
                  {[
                    fork.result.place.rating
                      ? `${fork.result.place.rating.toFixed(1)} ★`
                      : null,
                    fork.result.place.priceLevel
                      ? '$'.repeat(fork.result.place.priceLevel)
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
            </div>
          )}
          {revealDone && fork.mode === 'vote' && <VoteBreakdown fork={fork} />}
          {revealDone && (
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/" variant="quiet">
                Back to tonight
              </ButtonLink>
              {viewer.kind === 'user' &&
                (keptOn ? (
                  <p role="status" className="text-sm text-ink-muted">
                    Kept on {keptOn}
                  </p>
                ) : (
                  <Button variant="ghost" onClick={() => setKeepOpen(true)}>
                    Keep this one
                  </Button>
                ))}
            </div>
          )}
          {viewer.kind === 'user' && (
            <SaveToListDialog
              open={keepOpen}
              placeId={fork.result.placeId}
              placeName={fork.result.name}
              onClose={() => setKeepOpen(false)}
              onSaved={(listName) => setKeptOn(listName)}
            />
          )}
        </div>
      )}

      {/* Open: vote mode */}
      {fork.status === 'open' && fork.mode === 'vote' && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p role="status" className="text-sm text-ink-secondary">
              <span
                aria-hidden="true"
                className="mr-1.5 inline-block size-2 rounded-full bg-gold align-middle motion-safe:animate-pulse"
              />
              Live ·{' '}
              {fork.voteCount === 0
                ? 'no votes yet'
                : `${fork.voterNames.join(', ')} voted`}
            </p>
            {fork.isOrganizer && fork.voteCount > 0 && (
              <Button variant="quiet" onClick={() => setDecideOpen(true)}>
                Decide now
              </Button>
            )}
          </div>

          <ul className="flex flex-col gap-2" aria-label="Rank the spots">
            {fork.options.map((option) => {
              const rank = rankOf(rankings, option.id);
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setRankings((current) => toggleRank(current, option.id));
                      setError(null);
                    }}
                    aria-pressed={rank !== null}
                    className={cx(
                      'flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left outline-none',
                      'motion-safe:transition-colors motion-safe:duration-100 touch-manipulation',
                      'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
                      rank !== null
                        ? 'border-ink bg-surface'
                        : 'border-line bg-surface hover:bg-sunken'
                    )}
                  >
                    <span className="min-w-0 truncate font-semibold text-ink">
                      {option.name}
                    </span>
                    <span
                      className={cx(
                        'tnum flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold',
                        rank !== null
                          ? 'bg-ink text-canvas'
                          : 'border border-line-strong text-ink-muted'
                      )}
                    >
                      {rank ?? '·'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {rankings.length === 3 && (
            <p className="text-sm text-ink-muted">
              Ballot full. Tap a pick to swap it out.
            </p>
          )}

          {viewer.kind !== 'user' && (
            <Input
              label="Your name"
              required
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameError(null);
              }}
              maxLength={24}
              autoComplete="nickname"
              error={nameError ?? undefined}
              help={
                viewer.kind === 'anonymous'
                  ? 'No account needed. Just so the group knows who voted.'
                  : undefined
              }
              className="max-w-xs"
            />
          )}

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={castVote}
              loading={submitting}
              disabled={rankings.length === 0}
            >
              {myBallot ? 'Update your vote' : 'Cast your vote'}
            </Button>
            {rankings.length > 0 && (
              <Button variant="ghost" onClick={() => setRankings([])}>
                Clear
              </Button>
            )}
            {myBallot && (
              <p className="text-sm text-ink-muted">
                Your ballot is in. Revote until it closes.
              </p>
            )}
          </div>

          {viewer.kind === 'guest' && myBallot && (
            <p className="text-sm text-ink-muted">
              Voting as {viewer.displayName ?? name}.{' '}
              <a
                href={`/sign-up?next=${encodeURIComponent(`/f/${fork.code}`)}`}
                className="font-semibold text-brass underline-offset-2 hover:underline"
              >
                Create an account
              </a>{' '}
              to keep these votes in your history.
            </p>
          )}

          {/* Ending early is irreversible — confirm before the board flips. */}
          <Dialog
            open={decideOpen}
            onClose={() => {
              if (!deciding) setDecideOpen(false);
            }}
            title="Decide now?"
          >
            <p className="text-ink-secondary">
              Voting stops here. The{' '}
              {fork.voteCount === 1
                ? 'one ballot already in picks'
                : `${fork.voteCount} ballots already in pick`}{' '}
              the winner.
            </p>
            {decideError && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {decideError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setDecideOpen(false)}
                disabled={deciding}
              >
                Keep voting
              </Button>
              <Button onClick={decideNow} loading={deciding}>
                Decide now
              </Button>
            </div>
          </Dialog>
        </div>
      )}

      {/* Open: spin mode */}
      {fork.status === 'open' && fork.mode === 'spin' && (
        <div className="flex flex-col gap-5">
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {fork.options.map((option) => (
              <li key={option.id} className="px-4 py-3 font-semibold text-ink">
                {option.name}
              </li>
            ))}
          </ul>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          {fork.isOrganizer ? (
            <div>
              <Button size="lg" onClick={spin} loading={spinning}>
                Spin the board
              </Button>
            </div>
          ) : (
            <p className="text-sm text-ink-secondary">
              Only {fork.organizerName} can pull the lever on this one.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
