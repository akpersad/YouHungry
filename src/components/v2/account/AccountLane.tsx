'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { Button, Input } from '@/components/v2/ui';
import type { AccountView } from '@/lib/v2/account';
import { EmailSection } from './EmailSection';
import { HomeBaseSection } from './HomeBaseSection';
import { PasswordSection } from './PasswordSection';
import { NotificationsSection } from './NotificationsSection';

/**
 * The account lane: who you are (first name is the only name the product
 * ever shows), how you sign in (email, password), and how the one
 * notification reaches you. All frame register, zero gold: managing an
 * account is upkeep, not a decision moment.
 */
export function AccountLane({ account }: { account: AccountView }) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [signingOut, setSigningOut] = useState(false);
  const [firstName, setFirstName] = useState(account.firstName);
  const [savedName, setSavedName] = useState(account.firstName);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);

  const saveName = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || firstName.trim() === savedName) return;
    setNameError(null);
    setNameSuccess(null);
    setSaving(true);
    try {
      const response = await fetch('/api/v2/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'save failed');
      setSavedName(payload.account.firstName);
      setFirstName(payload.account.firstName);
      setNameSuccess('Saved.');
    } catch (err) {
      setNameError(
        err instanceof Error && err.message !== 'save failed'
          ? err.message
          : 'Could not save your name. Try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-2">
        <p className="type-board text-sm text-ink-muted">Account</p>
        <h1 className="type-board text-4xl text-ink sm:text-5xl">
          Your details, your call
        </h1>
        <p className="max-w-lg text-ink-secondary">
          What the app knows about you and how it reaches you. Guests never
          appear here: voting on a fork link needs none of this.
        </p>
      </div>

      <section aria-label="Profile" className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-ink">Profile</h2>
        <form
          onSubmit={saveName}
          className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
        >
          <Input
            label="First name"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value);
              setNameSuccess(null);
            }}
            error={nameError ?? undefined}
            success={nameSuccess ?? undefined}
            help="How you show up on forks and crews."
          />
          <Button
            variant="quiet"
            size="sm"
            type="submit"
            className="self-start"
            loading={saving}
            disabled={firstName.trim() === savedName || firstName.trim() === ''}
          >
            Save name
          </Button>
        </form>
        <HomeBaseSection initialLabel={account.searchAnchorLabel} />
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
          <EmailSection initialEmail={account.email} />
          <div className="border-t border-line" />
          <PasswordSection />
        </div>
      </section>

      <NotificationsSection
        initialSettings={account.notifications}
        registeredEndpoints={account.pushEndpoints}
      />

      {/* Signing out lives here, not the header: the name in the shell is
          the door in, and a phone-width header has no room for a rare,
          settings-register action. */}
      <section
        aria-label="Session"
        className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
      >
        <div>
          <h2 className="text-xl font-semibold text-ink">Signed in</h2>
          <p className="text-sm text-ink-secondary">
            Ends your session on this device only.
          </p>
        </div>
        <Button
          variant="quiet"
          size="md"
          type="button"
          className="self-start"
          loading={signingOut}
          onClick={() => {
            setSigningOut(true);
            void signOut(() => router.push('/'));
          }}
        >
          Sign out
        </Button>
      </section>

      <p className="text-sm text-ink-muted">
        Want everything gone? Account deletion is handled by hand for now: ask
        through the repo linked on the{' '}
        <a
          href="/privacy"
          className="rounded text-brass underline underline-offset-2 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-focus"
        >
          privacy page
        </a>
        .
      </p>
    </main>
  );
}
