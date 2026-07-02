'use client';

import { useEffect, useState } from 'react';

/**
 * Countdown plumbing shared by the lane home and the fork page. Time is
 * concrete per the voice rules — "Closes in 12:40", never "expiring soon".
 */

/** Ticks once a second while `active`; returns the current epoch ms. */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

/** "12:40" under an hour, "1h 05m" above, "0:00" once due. */
export function formatRemaining(closesAtIso: string, nowMs: number): string {
  const remaining = Math.max(0, new Date(closesAtIso).getTime() - nowMs);
  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function isOverdue(closesAtIso: string, nowMs: number): boolean {
  return new Date(closesAtIso).getTime() <= nowMs;
}
