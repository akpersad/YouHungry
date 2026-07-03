import type { PlaceSummary } from '@/lib/v2/http';

/**
 * One quiet meta line for a place row: rating, price, first category.
 * Renders nothing when the cache knows nothing — no placeholder dashes.
 */
export function PlaceMeta({ place }: { place: PlaceSummary }) {
  const parts = [
    typeof place.rating === 'number' ? `${place.rating.toFixed(1)} ★` : null,
    typeof place.priceLevel === 'number' && place.priceLevel > 0
      ? '$'.repeat(place.priceLevel)
      : null,
    place.categories[0] ?? null,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <p className="tnum mt-0.5 text-sm text-ink-muted">{parts.join(' · ')}</p>
  );
}
