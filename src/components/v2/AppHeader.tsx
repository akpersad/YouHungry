'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { ThemeToggle } from './ThemeToggle';

/**
 * The app shell header — wordmark, lanes nav, color mode, auth state.
 * Deliberately quiet: the frame never competes with the board, and gold
 * never appears here (it belongs to decision moments only).
 *
 * Phone-first: everything must fit one 56px row at 360px with 44px touch
 * targets — the wordmark condenses to "Fork" below sm, the color-mode
 * control is icon-register, and signing out lives on /account (the name
 * is the door; ending a session is upkeep, not a per-page action).
 */
export function AppHeader() {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="type-board flex min-h-11 shrink-0 items-center rounded-md text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Fork<span className="hidden sm:inline">&nbsp;in the road</span>
          </Link>
          <nav aria-label="Lanes" className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/places"
              className="flex min-h-11 items-center rounded-md px-1.5 text-sm font-semibold text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-focus motion-safe:duration-100 sm:px-2"
            >
              Places
            </Link>
            <Link
              href="/crew"
              className="flex min-h-11 items-center rounded-md px-1.5 text-sm font-semibold text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-focus motion-safe:duration-100 sm:px-2"
            >
              Crew
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {/* Render nothing until Clerk loads — no sign-in/out flash. */}
          {isLoaded &&
            (isSignedIn ? (
              /* The name is the door to /account — visible on every
                 width; a phone must not lose the only path in. */
              <Link
                href="/account"
                aria-label="Account"
                className="flex min-h-11 max-w-16 items-center rounded-md text-sm font-semibold text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-focus motion-safe:duration-100 sm:max-w-32"
              >
                <span className="truncate">{user?.firstName ?? 'Account'}</span>
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex h-11 items-center rounded-lg border border-line-strong bg-surface px-3 text-sm font-semibold text-ink outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-focus motion-safe:duration-100"
              >
                Sign in
              </Link>
            ))}
        </div>
      </div>
    </header>
  );
}
