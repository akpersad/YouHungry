import { logger } from '../logger';
import type { PlaceDoc } from './schema';

/**
 * The consolidated Google Places client (Phase 5) — the ONE place v2 talks
 * to Google. It fills the cache seam `places.ts` established in Phase 3:
 * reads always hit the v2 `places` collection; this module backfills that
 * cache on miss and refreshes stale docs, nothing else.
 *
 * Design decisions (deliberate, not inherited by accident):
 * - Legacy Places REST endpoints, same as v1 — the project's API key is
 *   enabled for them and they carry production traffic today. Migrating to
 *   the new Places API needs an owner-level console change; not this phase.
 * - Default-closed billing gate, same shape as notification-suppression:
 *   Google is reachable only on the production deployment or with an
 *   explicit ALLOW_GOOGLE_PLACES=true. Dev, CI, Jest, and Playwright are
 *   cache-only and can never bill.
 * - Single-page fetches. v1 paginated to 60 results with 2s sleeps inside
 *   the request; a spin wheel caps at 12 options and search shows 8, so one
 *   page (20) is strictly more than we can show, at a third of the cost.
 * - Photos: we persist `photoRef` for the future but never build the legacy
 *   photo URL — it embeds the API key in client-visible markup, and the
 *   text-forward identity doesn't ask for photos.
 */

const BASE = 'https://maps.googleapis.com/maps/api/place';

/** Fetch signature injected in tests; global fetch in production. */
export type FetchLike = (url: string) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export function isGooglePlacesEnabled(): boolean {
  if (!process.env.GOOGLE_PLACES_API_KEY) return false;
  if (process.env.ALLOW_GOOGLE_PLACES === 'true') return true;
  return process.env.VERCEL_ENV === 'production';
}

/** Legacy API result subset we consume — everything PlaceDoc stores. */
export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  geometry?: { location?: { lat?: number; lng?: number } };
  types?: string[];
  rating?: number;
  price_level?: number;
  photos?: Array<{ photo_reference?: string }>;
}

interface GooglePlacesResponse {
  status?: string;
  results?: GooglePlaceResult[];
  result?: GooglePlaceResult;
}

/** Google types that say nothing about what kind of food a place serves. */
const GENERIC_TYPES = new Set([
  'restaurant',
  'food',
  'point_of_interest',
  'establishment',
  'store',
]);

/**
 * Map a legacy API result onto the PlaceDoc cache fields. Returns null for
 * results without the essentials (id, name, coordinates) — Google sends
 * skeleton rows for permanently-closed places sometimes.
 */
export function toPlaceFields(
  result: GooglePlaceResult
): Omit<PlaceDoc, '_id' | 'createdAt' | 'updatedAt' | 'cachedAt'> | null {
  const lat = result.geometry?.location?.lat;
  const lng = result.geometry?.location?.lng;
  if (!result.place_id || !result.name) return null;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return {
    googlePlaceId: result.place_id,
    name: result.name,
    address: result.formatted_address ?? result.vicinity ?? '',
    location: { type: 'Point', coordinates: [lng, lat] },
    categories: (result.types ?? [])
      .filter((type) => !GENERIC_TYPES.has(type))
      .map((type) => type.replace(/_/g, ' ')),
    ...(typeof result.price_level === 'number'
      ? { priceLevel: result.price_level }
      : {}),
    ...(typeof result.rating === 'number' ? { rating: result.rating } : {}),
    ...(result.photos?.[0]?.photo_reference
      ? { photoRef: result.photos[0].photo_reference }
      : {}),
  };
}

async function callGoogle(
  url: string,
  apiType:
    | 'google_places_nearby_search'
    | 'google_places_text_search'
    | 'google_places_details',
  fetchImpl: FetchLike
): Promise<GooglePlacesResponse | null> {
  try {
    const response = await fetchImpl(url);
    // Cost tracking is minimal by charter: one row per real call, no
    // metadata sprawl. Lazy import keeps the tracker out of unit tests.
    const { trackAPIUsage } = await import('../api-usage-tracker');
    await trackAPIUsage(apiType, false);
    if (!response.ok) {
      logger.warn('Google Places HTTP error', {
        apiType,
        status: response.status,
      });
      return null;
    }
    const body = (await response.json()) as GooglePlacesResponse;
    if (body.status && body.status !== 'OK' && body.status !== 'ZERO_RESULTS') {
      logger.warn('Google Places API status', { apiType, status: body.status });
      return null;
    }
    return body;
  } catch (error) {
    // A Google outage degrades to cache-only — it must never break a spin.
    logger.warn('Google Places fetch failed', {
      apiType,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Search fetchers return null on failure (HTTP/API/network error) and []
 * on a genuine ZERO_RESULTS — callers cache the latter, retry the former.
 */
export async function fetchNearbyFromGoogle(
  center: { lat: number; lng: number },
  radiusM: number,
  fetchImpl: FetchLike = fetch
): Promise<GooglePlaceResult[] | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const params = new URLSearchParams({
    location: `${center.lat},${center.lng}`,
    radius: String(radiusM),
    type: 'restaurant',
    key,
  });
  const body = await callGoogle(
    `${BASE}/nearbysearch/json?${params}`,
    'google_places_nearby_search',
    fetchImpl
  );
  return body ? (body.results ?? []) : null;
}

export async function fetchTextSearchFromGoogle(
  query: string,
  fetchImpl: FetchLike = fetch
): Promise<GooglePlaceResult[] | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const params = new URLSearchParams({
    query,
    type: 'restaurant',
    key,
  });
  const body = await callGoogle(
    `${BASE}/textsearch/json?${params}`,
    'google_places_text_search',
    fetchImpl
  );
  return body ? (body.results ?? []) : null;
}

export async function fetchPlaceDetailsFromGoogle(
  googlePlaceId: string,
  fetchImpl: FetchLike = fetch
): Promise<GooglePlaceResult | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const params = new URLSearchParams({
    place_id: googlePlaceId,
    fields:
      'place_id,name,formatted_address,geometry,types,rating,price_level,photos',
    key,
  });
  const body = await callGoogle(
    `${BASE}/details/json?${params}`,
    'google_places_details',
    fetchImpl
  );
  return body?.result ?? null;
}
