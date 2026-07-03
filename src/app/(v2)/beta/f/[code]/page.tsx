import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSettledForkByCode, serializeFork } from '@/lib/v2/forks';
import { GUEST_COOKIE, findGuestByCookie } from '@/lib/v2/guests';
import { forkTokenFor } from '@/lib/v2/tokens';
import { resolveForkViewer } from '@/lib/v2/viewer';
import { ForkRoom } from '@/components/v2/fork/ForkRoom';

export const metadata: Metadata = { title: 'Fork · Fork In The Road' };

/**
 * The fork page — the public Fork Link surface (Phase 4). No sign-in gate:
 * holding the unguessable code is the capability, matching how the link
 * travels through a group chat. Members, guests, and first-time visitors
 * all land here; the vote POST carries the signed fork token and mints
 * guest identity on first ballot. The server render settles overdue forks,
 * so even a dead link resolves to an honest terminal state.
 */
export default async function ForkPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const cookieStore = await cookies();
  const guestCookie = cookieStore.get(GUEST_COOKIE)?.value;
  const viewer = await resolveForkViewer(guestCookie);

  const fork = await getSettledForkByCode(code);
  if (!fork) notFound();

  // Signed in with an unclaimed guest identity still in this browser →
  // offer the claim. (Claimed-by-self is already folded into the viewer.)
  let claimGuestName: string | null = null;
  if (viewer.kind === 'user') {
    const guest = await findGuestByCookie(guestCookie);
    if (guest && !guest.claimedByUserId) claimGuestName = guest.displayName;
  }

  const openForVotes = fork.status === 'open' && fork.mode === 'vote';

  return (
    <ForkRoom
      initial={serializeFork(fork, viewer.participant, viewer.claimedGuestIds)}
      viewer={{
        kind: viewer.kind,
        displayName: viewer.participant?.displayName ?? null,
      }}
      forkToken={openForVotes ? forkTokenFor(fork.code, fork.closesAt) : null}
      claimGuestName={claimGuestName}
    />
  );
}
