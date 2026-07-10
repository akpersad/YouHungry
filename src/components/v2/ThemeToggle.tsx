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
          aria-label={m === 'light' ? 'Light' : 'Dark'}
          title={m === 'light' ? 'Light' : 'Dark'}
          onClick={() => apply(m)}
          className={
            'tap-target flex h-9 w-9 items-center justify-center rounded-md outline-none transition-colors motion-safe:duration-100 ' +
            'focus-visible:ring-2 focus-visible:ring-focus ' +
            (mode === m
              ? 'bg-ink text-canvas'
              : 'text-ink-muted hover:text-ink')
          }
        >
          {m === 'light' ? <SunIcon /> : <MoonIcon />}
        </button>
      ))}
    </div>
  );
}

/* Icon register keeps the control phone-sized; the accessible names stay
 * "Light"/"Dark". One family, one stroke weight. */
function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="size-4.5"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4.5"
    >
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
    </svg>
  );
}
