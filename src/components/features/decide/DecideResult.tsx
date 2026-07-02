'use client';

import { Restaurant } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { RestaurantImage } from '@/components/ui/RestaurantImage';
import { WhyThisPick } from './WhyThisPick';
import { MapPin, RotateCw, Check } from 'lucide-react';

interface DecideResultProps {
  collectionId: string;
  restaurant: Restaurant;
  visitDate: Date;
  /** Number of other restaurants still in the running, for the re-spin hint. */
  remainingCount: number;
  onConfirm: () => void;
  onSpinAgain: () => void;
  isConfirming?: boolean;
}

function directionsUrl(r: Restaurant): string {
  const q = encodeURIComponent(`${r.name} ${r.address ?? ''}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function DecideResult({
  collectionId,
  restaurant,
  visitDate,
  remainingCount,
  onConfirm,
  onSpinAgain,
  isConfirming = false,
}: DecideResultProps) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(visitDate);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <RestaurantImage
          src={restaurant.photos?.[0]}
          alt={restaurant.name}
          cuisine={restaurant.cuisine}
          className="h-32 w-full rounded-xl object-cover sm:w-32"
        />
        <div className="flex-1 space-y-2">
          <h3 className="font-display text-2xl font-semibold text-ink">
            {restaurant.name}
          </h3>
          {restaurant.address && (
            <p className="text-sm text-ink-secondary">{restaurant.address}</p>
          )}
          <div className="flex flex-wrap gap-3 text-sm text-ink-secondary">
            {restaurant.rating != null && (
              <span style={{ color: 'var(--saffron)' }}>
                ★ {restaurant.rating}
              </span>
            )}
            {restaurant.priceRange && <span>{restaurant.priceRange}</span>}
            {restaurant.cuisine && <span>{restaurant.cuisine}</span>}
          </div>
          <p className="text-sm text-ink-muted">Planned for {formattedDate}</p>
        </div>
      </div>

      <WhyThisPick
        collectionId={collectionId}
        restaurantId={restaurant._id.toString()}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={onConfirm} isLoading={isConfirming} className="flex-1">
          <Check className="mr-2 h-4 w-4" />
          Lock it in
        </Button>
        <Button
          onClick={onSpinAgain}
          variant="secondary"
          disabled={isConfirming}
          className="flex-1"
        >
          <RotateCw className="mr-2 h-4 w-4" />
          Spin again
          {remainingCount > 0 && (
            <span className="ml-1 text-ink-muted">({remainingCount} more)</span>
          )}
        </Button>
        <a
          href={directionsUrl(restaurant)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-base btn-outline btn-md flex flex-1 items-center justify-center"
        >
          <MapPin className="mr-2 h-4 w-4" />
          Directions
        </a>
      </div>
    </div>
  );
}
