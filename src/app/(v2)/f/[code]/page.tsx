import { redirect } from 'next/navigation';

/**
 * /f/[code] — the short Fork Link that travels through group chats
 * (WORKPLAN Phase 4). Until cutover the fork room lives under /beta, so
 * this is a pure alias; Phase 7 makes it the canonical page. Kept inside
 * the (v2) route group so v1 never owns the path.
 */
export default async function ShortForkLink({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/beta/f/${encodeURIComponent(code)}`);
}
