import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { toAccountView } from '@/lib/v2/account';
import { getV2User } from '@/lib/v2/auth';
import { AccountLane } from '@/components/v2/account/AccountLane';

export const metadata: Metadata = { title: 'Account · Fork In The Road' };

/**
 * The account lane: profile, sign-in details, and the notification
 * switches. Account territory like Places and Crew — the page gates
 * itself with the same ?next= round-trip.
 */
export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?next=${encodeURIComponent('/account')}`);
  }
  const user = await getV2User();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent('/account')}`);
  }

  return <AccountLane account={toAccountView(user)} />;
}
