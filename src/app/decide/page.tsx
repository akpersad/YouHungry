'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useCollections } from '@/hooks/api/useCollections';
import { DecideFlow } from '@/components/features/decide/DecideFlow';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Utensils } from 'lucide-react';

function CollectionPicker() {
  const { user } = useUser();
  const { data: collections, isLoading } = useCollections(user?.id);

  if (isLoading) {
    return <Card className="p-8 text-center text-secondary">Loading…</Card>;
  }

  if (!collections || collections.length === 0) {
    return (
      <EmptyState
        icon={<Utensils className="h-6 w-6" />}
        title="No collections yet"
        description="Build a collection of spots, then come back to let the wheel decide."
        action={
          <Link href="/dashboard" className="btn-base btn-primary btn-md">
            Go to dashboard
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-center text-secondary">
        Which collection are we deciding from?
      </p>
      <div className="grid gap-3">
        {collections.map((c) => (
          <Link
            key={c._id.toString()}
            href={`/decide?collectionId=${c._id.toString()}`}
            className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-[var(--border-strong)]"
          >
            <span className="font-medium text-primary">{c.name}</span>
            <span className="text-sm text-tertiary">
              {c.restaurantIds.length}{' '}
              {c.restaurantIds.length === 1 ? 'spot' : 'spots'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DecideContent() {
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('collectionId');

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-center font-display text-3xl font-semibold text-primary">
        Let&apos;s decide
      </h1>
      {collectionId ? (
        <DecideFlow collectionId={collectionId} />
      ) : (
        <CollectionPicker />
      )}
    </div>
  );
}

export default function DecidePage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="mx-auto max-w-2xl px-4 py-6 text-center text-secondary">
            Loading…
          </div>
        }
      >
        <DecideContent />
      </Suspense>
    </ProtectedRoute>
  );
}
