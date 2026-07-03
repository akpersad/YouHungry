'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

/**
 * v2 theme toggle — hydration-safe (same shape as v1's ThemeProvider):
 * external state comes in through useSyncExternalStore (server snapshot =
 * light), the session choice wins, and the DOM class is synced in an
 * effect — no setState-in-effect. Persists to v2's own localStorage key;
 * the pre-hydration script in the (v2) root layout reads the same key.
 */

const subscribeToSystem = (cb: () => void) => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const noopSubscribe = () => () => {};

export function ThemeToggle() {
  const stored = useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return localStorage.getItem('fitr-v2-theme');
      } catch {
        return null;
      }
    },
    () => null
  );
  const system = useSyncExternalStore(
    subscribeToSystem,
    () =>
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light',
    () => 'light' as const
  );
  const [session, setSession] = useState<'light' | 'dark' | null>(null);
  const mode: 'light' | 'dark' =
    session ?? (stored === 'light' || stored === 'dark' ? stored : system);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(mode);
  }, [mode]);

  const apply = (next: 'light' | 'dark') => {
    setSession(next);
    try {
      localStorage.setItem('fitr-v2-theme', next);
    } catch {
      // private mode — the toggle still works for this visit
    }
  };

  return (
    <div
      role="group"
      aria-label="Color mode"
      className="flex rounded-lg border border-line-strong p-0.5"
    >
      {(['light', 'dark'] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => apply(m)}
          className={
            'h-9 rounded-md px-3 text-sm font-semibold outline-none transition-colors motion-safe:duration-100 ' +
            'focus-visible:ring-2 focus-visible:ring-focus ' +
            (mode === m
              ? 'bg-ink text-canvas'
              : 'text-ink-muted hover:text-ink')
          }
        >
          {m === 'light' ? 'Light' : 'Dark'}
        </button>
      ))}
    </div>
  );
}
