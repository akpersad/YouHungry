import type { Metadata } from 'next';
import { notFound as nextNotFound, redirect } from 'next/navigation';
import { ObjectId } from 'mongodb';
import { auth } from '@clerk/nextjs/server';
import { getV2User } from '@/lib/v2/auth';
import { getCrewView, type CrewView } from '@/lib/v2/crews';
import { V2DomainError } from '@/lib/v2/errors';
import { CrewRoom } from '@/components/v2/crew/CrewRoom';

export const metadata: Metadata = { title: 'Crew · Fork In The Road' };

/** One crew, member-gated server-side; foreign = missing = 404. */
export default async function CrewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?next=${encodeURIComponent(`/crew/${id}`)}`);
  }
  const user = await getV2User();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent('/crew')}`);
  }

  if (!ObjectId.isValid(id)) nextNotFound();

  let crew: CrewView;
  try {
    crew = await getCrewView(new ObjectId(id), user._id);
  } catch (error) {
    if (error instanceof V2DomainError && error.status === 404) {
      nextNotFound();
    }
    throw error;
  }

  return <CrewRoom initial={crew} />;
}
