'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import { ThemeToggle } from './ThemeToggle';

/**
 * The app shell header — wordmark, color mode, auth state. Deliberately
 * quiet: the frame never competes with the board, and gold never appears
 * here (it belongs to decision moments only).
 */
export function AppHeader() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            className="type-board rounded-md text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Fork in the road
          </Link>
          <nav aria-label="Lanes" className="flex items-center gap-3">
            <Link
              href="/places"
              className="rounded-md text-sm font-semibold text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-focus motion-safe:duration-100"
            >
              Places
            </Link>
            <Link
              href="/crew"
              className="rounded-md text-sm font-semibold text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-focus motion-safe:duration-100"
            >
              Crew
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {/* Render nothing until Clerk loads — no sign-in/out flash. */}
          {isLoaded &&
            (isSignedIn ? (
              <>
                {/* The name is the door to /account — visible on every
                    width; a phone must not lose the only path in. */}
                <Link
                  href="/account"
                  aria-label="Account"
                  className="inline-block max-w-24 truncate rounded-md text-sm font-semibold text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-focus motion-safe:duration-100"
                >
                  {user?.firstName ?? 'Account'}
                </Link>
                <button
                  type="button"
                  onClick={() => signOut(() => router.push('/'))}
                  className="h-9 rounded-md px-2 text-sm font-semibold text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-focus motion-safe:duration-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex h-9 items-center rounded-lg border border-line-strong bg-surface px-3 text-sm font-semibold text-ink outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-focus motion-safe:duration-100"
              >
                Sign in
              </Link>
            ))}
        </div>
      </div>
    </header>
  );
}
