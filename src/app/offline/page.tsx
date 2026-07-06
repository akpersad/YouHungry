import type { Metadata } from 'next';
import { EmptyState, ButtonLink } from '@/components/v2/ui';

// The service worker's navigation fallback (precached at install). Static
// by design: it must render from cache with zero network.
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Offline | Fork In The Road',
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16">
      <EmptyState
        title="You're offline"
        body="This page needs a connection. Get back online and try again."
        action={<ButtonLink href="/">Back to the fork lane</ButtonLink>}
      />
    </main>
  );
}
