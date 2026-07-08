import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { peekListInvite } from '@/lib/v2/lists';
import { ButtonLink, EmptyState } from '@/components/v2/ui';
import { JoinList } from '@/components/v2/places/JoinList';

export const metadata: Metadata = { title: 'List invite · Fork In The Road' };

/**
 * Shared-list invite landing. The signed token in the URL is the
 * capability (fork-link DNA): holding it shows you what you were invited
 * to; joining needs an account, so signed-out visitors get the sign-in
 * round-trip with the token preserved in ?next. Bad or expired tokens get
 * the honest dead-end, not a sign-in loop.
 */
export default async function JoinListPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const invite = token ? await peekListInvite(token) : null;

  if (!invite) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14">
        <EmptyState
          title="This invite link is not right"
          body="It may have expired (they last 7 days) or the list is gone. Ask for a fresh link."
          action={
            <ButtonLink href="/places" variant="quiet">
              Go to Places
            </ButtonLink>
          }
        />
      </main>
    );
  }

  const { userId } = await auth();
  const placeCount = invite.list.placeIds.length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-2">
        <p className="type-board text-sm text-ink-muted">List invite</p>
        <h1 className="type-board text-4xl break-words text-ink sm:text-5xl">
          {invite.list.name}
        </h1>
        <p className="max-w-lg text-ink-secondary">
          {invite.ownerFirstName} is sharing this list with you
          {placeCount > 0
            ? ` (${placeCount === 1 ? '1 place' : `${placeCount} places`} on it so far)`
            : ''}
          . Join it and you can save spots, take them off, and fork the list
          into a decision.
        </p>
      </div>

      {userId ? (
        <JoinList token={token!} />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-secondary">
            Joining a list needs an account, so everyone knows whose saves are
            whose.
          </p>
          <div className="flex gap-2">
            <ButtonLink
              href={`/sign-in?next=${encodeURIComponent(`/places/join?token=${token}`)}`}
            >
              Sign in to join
            </ButtonLink>
            <ButtonLink
              variant="quiet"
              href={`/sign-up?next=${encodeURIComponent(`/places/join?token=${token}`)}`}
            >
              Create an account
            </ButtonLink>
          </div>
        </div>
      )}
    </main>
  );
}
