import type { PlaceSummary } from '@/lib/v2/http';

/**
 * One quiet meta line for a place row: rating, price, first category, and
 * the way out to the full listing (menus and photos live on Google; the
 * owner's call was to link there rather than integrate a menu provider).
 * The facts render nothing when the cache knows nothing — no placeholder
 * dashes — but the Google link is always there.
 */
export function PlaceMeta({ place }: { place: PlaceSummary }) {
  const parts = [
    typeof place.rating === 'number' ? `${place.rating.toFixed(1)} ★` : null,
    typeof place.priceLevel === 'number' && place.priceLevel > 0
      ? '$'.repeat(place.priceLevel)
      : null,
    place.categories[0] ?? null,
  ].filter(Boolean);
  return (
    <p className="tnum mt-0.5 text-sm text-ink-muted">
      {parts.length > 0 && <>{parts.join(' · ')} · </>}
      <a
        href={place.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`See ${place.name} on Google Maps`}
        className="tap-target inline-block rounded underline underline-offset-2 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-focus"
      >
        See on Google
      </a>
    </p>
  );
}
