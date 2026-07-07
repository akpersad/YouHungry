import type { Metadata } from 'next';
import { unsubscribeEmailByToken } from '@/lib/v2/account';
import { ButtonLink } from '@/components/v2/ui';

export const metadata: Metadata = {
  title: 'Unsubscribe · Fork In The Road',
  robots: { index: false },
};

// The flip must run per request, never from a cached render.
export const dynamic = 'force-dynamic';

/**
 * The result email's visible opt-out landing. Public and session-free on
 * purpose: an unsubscribe that demands a sign-in is a dark pattern. The
 * signed token in the link is the authorization; the flip is idempotent,
 * so revisits and prefetches only re-set what is already off.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const done = token ? await unsubscribeEmailByToken(token) : false;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-2">
        <p className="type-board text-sm text-ink-muted">Notifications</p>
        <h1 className="type-board text-4xl text-ink sm:text-5xl">
          {done ? 'Result emails are off' : 'That link did not work'}
        </h1>
        <p className="max-w-lg text-ink-secondary">
          {done
            ? 'No more emails when a fork closes. Fork pages still show every result, and you can turn emails back on from your account any time.'
            : 'The link may be old or incomplete. You can manage result emails from your account instead.'}
        </p>
      </div>
      <div>
        <ButtonLink href="/account" variant="quiet">
          Open account settings
        </ButtonLink>
      </div>
    </main>
  );
}
