import type { Metadata } from 'next';
import { notFound as nextNotFound, redirect } from 'next/navigation';
import { ObjectId } from 'mongodb';
import { auth } from '@clerk/nextjs/server';
import { getV2User } from '@/lib/v2/auth';
import { V2DomainError } from '@/lib/v2/errors';
import { getListWithPlaces, type ListWithPlaces } from '@/lib/v2/lists';
import { toPlaceSummary } from '@/lib/v2/places';
import { ListDetail } from '@/components/v2/places/ListDetail';

export const metadata: Metadata = { title: 'List · Fork In The Road' };

/**
 * One list, owner-gated server-side. A foreign or missing id 404s
 * identically (the lib layer makes no distinction), and malformed ids
 * don't get to look special either.
 */
export default async function ListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { userId } = await auth();
  if (!userId) {
    redirect(
      `/beta/sign-in?next=${encodeURIComponent(`/beta/places/l/${id}`)}`
    );
  }
  const user = await getV2User();
  if (!user) {
    redirect(`/beta/sign-in?next=${encodeURIComponent('/beta/places')}`);
  }

  if (!ObjectId.isValid(id)) nextNotFound();

  let data: ListWithPlaces;
  try {
    data = await getListWithPlaces(user._id, new ObjectId(id));
  } catch (error) {
    // Foreign and missing lists 404 alike; anything else is a real error.
    if (error instanceof V2DomainError && error.status === 404) {
      nextNotFound();
    }
    throw error;
  }

  return (
    <ListDetail
      initial={{
        id: data.list._id.toString(),
        name: data.list.name,
        places: data.places.map(toPlaceSummary),
      }}
    />
  );
}
