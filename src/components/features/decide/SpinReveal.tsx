'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface SpinRevealProps {
  /** Candidate restaurant names to cycle through while "spinning". */
  names: string[];
  /** The chosen winner — the cycle decelerates and lands here. */
  winner: string;
  /** Fired once the winner is revealed (animation done or reduced-motion skip). */
  onComplete?: () => void;
}

// Decelerating tick schedule (ms between name swaps) — ease-out feel, ~1.6s total.
const TICKS = [55, 65, 80, 95, 115, 140, 170, 205, 250, 300, 360];

/**
 * The decision-moment hero: restaurant names flick past with decelerating
 * cadence (saffron, "spinning"), then settle on the winner (olive, Fraunces).
 * Honors prefers-reduced-motion by revealing the winner instantly.
 */
export function SpinReveal({ names, winner, onComplete }: SpinRevealProps) {
  const prefersReduced = useReducedMotion();
  const reduce = !!prefersReduced;
  // Mid-spin name set only from timer callbacks; reveal is derived, not stored
  // in an effect, so we never setState in an effect body.
  const [spunName, setSpunName] = useState<string | null>(null);
  const [landedFromSpin, setLandedFromSpin] = useState(false);
  const onCompleteRef = useRef(onComplete);

  const revealed = reduce || landedFromSpin;
  const display = revealed ? winner : (spunName ?? names[0] ?? winner);

  // Keep the latest callback without retriggering the animation effect.
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (reduce) {
      onCompleteRef.current?.();
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const pool = names.length > 0 ? names : [winner];
    let elapsed = 0;

    TICKS.forEach((delay) => {
      elapsed += delay;
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setSpunName(pool[Math.floor(Math.random() * pool.length)] ?? winner);
        }, elapsed)
      );
    });

    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        setLandedFromSpin(true);
        onCompleteRef.current?.();
      }, elapsed + 340)
    );

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [winner, reduce, names]);

  return (
    <div
      className="flex min-h-[8rem] flex-col items-center justify-center text-center"
      aria-live="polite"
    >
      <p className="mb-2 text-sm font-medium uppercase tracking-wide text-ink-muted">
        {revealed ? 'Tonight you eat at' : 'Spinning…'}
      </p>
      <motion.span
        key={`${display}-${revealed}`}
        initial={reduce ? false : { opacity: 0.4, y: revealed ? 8 : 0 }}
        animate={{ opacity: 1, y: 0, scale: revealed ? 1.04 : 1 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="font-display text-3xl font-semibold sm:text-4xl"
        style={{ color: revealed ? 'var(--olive)' : 'var(--saffron)' }}
      >
        {display}
      </motion.span>
    </div>
  );
}
