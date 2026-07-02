'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cx } from './cx';

/**
 * v2 Reveal — the signature moment (IDENTITY.md): candidate names flap on
 * the always-dark board with decelerating ticks, lock on the winner, and the
 * winning tile floods gold. The one sanctioned >500ms animation in the
 * product.
 *
 * - Starts on mount; remount (change `key`) to replay.
 * - Skippable: the board is a button — any tap/Enter jumps to the result.
 * - prefers-reduced-motion (or `reduceMotion`): no ticking, straight to the
 *   locked result.
 * - Screen readers hear "Deciding" once, then the winner — never the ticks.
 */

// Decelerating tick schedule, ~2.1s total — inside the 1.4–2.2s budget.
const TICKS = [70, 75, 85, 100, 120, 145, 180, 225, 285, 360, 450];

export function Reveal({
  candidates,
  winner,
  context,
  onDone,
  reduceMotion,
  className,
}: {
  candidates: string[];
  winner: string;
  /** Settles in under the result after the lock — the "why this pick" line. */
  context?: ReactNode;
  onDone?: () => void;
  /** Test/consumer override; defaults to the OS preference. */
  reduceMotion?: boolean;
  className?: string;
}) {
  const prefersReduced = useMemo(() => {
    if (typeof reduceMotion === 'boolean') return reduceMotion;
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, [reduceMotion]);

  const [tick, setTick] = useState(0);
  const [locked, setLocked] = useState(prefersReduced);
  const doneRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The cycle deliberately never shows the winner mid-spin: fate shouldn't
  // tease the answer before it commits.
  const pool = useMemo(() => {
    const others = candidates.filter((c) => c !== winner);
    return others.length > 0 ? others : [winner];
  }, [candidates, winner]);

  useEffect(() => {
    if (locked) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
      return;
    }
    timerRef.current = setTimeout(() => {
      if (tick + 1 >= TICKS.length) setLocked(true);
      else setTick(tick + 1);
    }, TICKS[tick]);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tick, locked, onDone]);

  const skip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLocked(true);
  };

  return (
    <div
      className={cx(
        'overflow-hidden rounded-3xl bg-board p-6 text-board-ink sm:p-8',
        className
      )}
    >
      <p className="type-board text-sm text-board-muted">Tonight</p>

      {locked ? (
        <>
          <div className="mt-3 rounded-xl bg-gold px-4 py-3 text-gold-ink">
            <p className="type-board text-3xl leading-none sm:text-4xl">
              {winner}
            </p>
          </div>
          <p className="mt-3 text-lg font-semibold">We&apos;re going here.</p>
          {context && (
            <div className="mt-1 text-sm text-board-muted">{context}</div>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={skip}
          aria-label="Skip to the result"
          className="mt-3 block w-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <div
            aria-hidden="true"
            className="rounded-xl bg-board-raised px-4 py-3 text-left [perspective:400px]"
          >
            <p
              key={tick}
              className="type-board motion-safe:animate-flap text-3xl leading-none sm:text-4xl"
            >
              {pool[tick % pool.length]}
            </p>
          </div>
          <p className="mt-3 text-left text-sm text-board-muted">
            Deciding<span aria-hidden="true">…</span> tap to skip
          </p>
        </button>
      )}

      {/* Announce the outcome, not the theater. */}
      <p role="status" className="sr-only">
        {locked ? `We're going to ${winner}.` : 'Deciding.'}
      </p>
    </div>
  );
}
