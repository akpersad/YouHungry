import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getV2User, participantFromUser } from '@/lib/v2/auth';
import { getSettledForkByCode, serializeFork } from '@/lib/v2/forks';
import { ForkRoom } from '@/components/v2/fork/ForkRoom';

export const metadata: Metadata = { title: 'Fork · Fork In The Road' };

/**
 * The fork page. Phase 3 gates it behind sign-in; Phase 4 makes this the
 * public Fork Link surface (guests + signed tokens) at /f/[code]. The
 * server render settles overdue forks, so even a dead link resolves to an
 * honest terminal state.
 */
export default async function ForkPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const { userId } = await auth();
  if (!userId) {
    redirect(`/beta/sign-in?next=${encodeURIComponent(`/beta/f/${code}`)}`);
  }

  const user = await getV2User();
  if (!user) {
    // Session exists but the user doc can't be built yet (webhook gap
    // without an email) — the lane home is the honest landing.
    redirect('/beta');
  }

  const fork = await getSettledForkByCode(code);
  if (!fork) notFound();

  return <ForkRoom initial={serializeFork(fork, participantFromUser(user))} />;
}
