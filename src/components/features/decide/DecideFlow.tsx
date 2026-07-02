'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import { Restaurant } from '@/types/database';
import { useCollection } from '@/hooks/api/useCollections';
import { useRandomDecision } from '@/hooks/api/useDecisions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SpinReveal } from './SpinReveal';
import { DecideResult } from './DecideResult';
import { logger } from '@/lib/logger';
import { Utensils } from 'lucide-react';

interface DecideFlowProps {
  collectionId: string;
}

type Phase = 'idle' | 'spinning' | 'result';

async function fetchCollectionRestaurants(
  collectionId: string
): Promise<Restaurant[]> {
  const res = await fetch(`/api/collections/${collectionId}/restaurants`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load restaurants');
  return data.restaurants ?? [];
}

// Visit defaults to tomorrow at 7pm (matches the prior CollectionView behavior).
function defaultVisitDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(19, 0, 0, 0);
  return d;
}

export function DecideFlow({ collectionId }: DecideFlowProps) {
  const { data: collection, isLoading: loadingCollection } =
    useCollection(collectionId);
  const { data: restaurants, isLoading: loadingRestaurants } = useQuery({
    queryKey: ['collections', 'detail', collectionId, 'restaurants'],
    queryFn: () => fetchCollectionRestaurants(collectionId),
    enabled: !!collectionId,
    staleTime: 60 * 1000,
  });

  const randomDecision = useRandomDecision();
  const [phase, setPhase] = useState<Phase>('idle');
  const [winner, setWinner] = useState<Restaurant | null>(null);
  const [visitDate, setVisitDate] = useState<Date>(defaultVisitDate);

  const names = (restaurants ?? []).map((r) => r.name);

  const runSpin = useCallback(async () => {
    if (!restaurants || restaurants.length === 0) {
      toast.error('Add a restaurant to this collection first.');
      return;
    }
    const when = defaultVisitDate();
    setVisitDate(when);
    setPhase('spinning');
    try {
      const result = await randomDecision.mutateAsync({
        collectionId,
        visitDate: when.toISOString(),
      });
      const picked =
        restaurants.find(
          (r) => r._id.toString() === result.result.restaurantId
        ) ?? null;
      if (!picked) throw new Error('Picked restaurant not found in collection');
      setWinner(picked);
      // SpinReveal calls onComplete; phase flips to 'result' there.
    } catch (error) {
      logger.error('Decide spin failed:', error);
      toast.error('Something went wrong spinning. Try again.');
      setPhase('idle');
    }
  }, [restaurants, collectionId, randomDecision]);

  const handleConfirm = useCallback(() => {
    toast.success('Locked in. Enjoy your meal!');
    setPhase('idle');
    setWinner(null);
  }, []);

  if (loadingCollection || loadingRestaurants) {
    return <Card className="p-8 text-center text-ink-secondary">Loading…</Card>;
  }

  if (!collection) {
    return (
      <EmptyState
        title="Collection not found"
        description="It may have been removed. Pick another from your dashboard."
        action={
          <Link href="/dashboard" className="btn-base btn-primary btn-md">
            Back to dashboard
          </Link>
        }
      />
    );
  }

  if (!restaurants || restaurants.length === 0) {
    return (
      <EmptyState
        icon={<Utensils className="h-6 w-6" />}
        title="Nothing to spin yet"
        description={`"${collection.name}" has no restaurants. Add a few and the wheel comes to life.`}
        action={
          <Link
            href={`/collections/${collectionId}`}
            className="btn-base btn-primary btn-md"
          >
            Add restaurants
          </Link>
        }
      />
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4 text-center">
        <p className="text-sm text-ink-muted">Deciding from</p>
        <h2 className="font-display text-xl font-semibold text-ink">
          {collection.name}
        </h2>
      </div>

      {phase === 'idle' && (
        <div className="flex flex-col items-center gap-4 py-6">
          <p className="text-center text-ink-secondary">
            {restaurants.length} spots in the running. Let the weighting do the
            work.
          </p>
          <Button onClick={runSpin} className="px-10 py-3 text-base">
            Spin the wheel
          </Button>
        </div>
      )}

      {phase === 'spinning' && winner === null && (
        <div className="py-8">
          <SpinReveal names={names} winner={names[0] ?? ''} />
        </div>
      )}

      {phase === 'spinning' && winner !== null && (
        <div className="py-8">
          <SpinReveal
            names={names}
            winner={winner.name}
            onComplete={() => setPhase('result')}
          />
        </div>
      )}

      {phase === 'result' && winner && (
        <DecideResult
          collectionId={collectionId}
          restaurant={winner}
          visitDate={visitDate}
          remainingCount={Math.max(0, restaurants.length - 1)}
          onConfirm={handleConfirm}
          onSpinAgain={runSpin}
          isConfirming={false}
        />
      )}
    </Card>
  );
}
