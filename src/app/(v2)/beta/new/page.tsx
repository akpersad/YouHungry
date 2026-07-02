import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { NewFork } from '@/components/v2/fork/NewFork';

export const metadata: Metadata = { title: 'Start a fork · Fork In The Road' };

/**
 * Organizing a fork requires an account (charter: someone must own the
 * lifecycle) — this is exactly where auth first enters the flow, so the
 * redirect carries the user straight back here after sign-in.
 */
export default async function NewForkPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/beta/sign-in?next=${encodeURIComponent('/beta/new')}`);
  }
  return <NewFork />;
}
