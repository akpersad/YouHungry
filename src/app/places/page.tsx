import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getV2User } from '@/lib/v2/auth';
import { getListsForOwner } from '@/lib/v2/lists';
import { PlacesLane } from '@/components/v2/places/PlacesLane';

export const metadata: Metadata = { title: 'Places · Fork In The Road' };

/**
 * The Places lane. Saving needs an owner, so the lane is account-holders'
 * territory — the redirect carries people straight back after sign-in
 * (same pattern as /new). Lists render server-side; no skeleton
 * flash on arrival.
 */
export default async function PlacesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?next=${encodeURIComponent('/places')}`);
  }
  const user = await getV2User();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent('/places')}`);
  }

  const lists = await getListsForOwner(user._id);
  return (
    <PlacesLane
      initialLists={lists.map((list) => ({
        id: list._id.toString(),
        name: list.name,
        placeCount: list.placeIds.length,
      }))}
    />
  );
}
