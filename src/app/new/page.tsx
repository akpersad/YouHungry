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
export default async function NewForkPage({
  searchParams,
}: {
  searchParams: Promise<{ list?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?next=${encodeURIComponent('/new')}`);
  }
  // "Fork this list" arrives with ?list= — pass it through only if it
  // even looks like an id; ownership is checked by the API it loads from.
  const { list } = await searchParams;
  const initialListId = list && /^[0-9a-f]{24}$/i.test(list) ? list : undefined;
  return <NewFork initialListId={initialListId} />;
}
