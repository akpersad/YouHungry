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
  /** Find Place From Text answers under this key. */
  candidates?: GooglePlaceResult[];
  /** Autocomplete answers under this key. */
  predictions?: Array<{ description?: string; place_id?: string }>;
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
    | 'google_places_details'
    | 'google_places_find_place'
    | 'google_places_autocomplete',
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

/**
 * Location bias for text searches. Legacy Text Search treats
 * location+radius as a BIAS, not a fence — an explicit exact-name query
 * still finds a distant match, but "mcdonalds" answers with the ones near
 * the anchor instead of the country's most famous ones.
 */
export interface TextSearchBias {
  lat: number;
  lng: number;
  radiusM: number;
}

export async function fetchTextSearchFromGoogle(
  query: string,
  bias?: TextSearchBias,
  fetchImpl: FetchLike = fetch
): Promise<GooglePlaceResult[] | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const params = new URLSearchParams({
    query,
    type: 'restaurant',
    key,
  });
  if (bias) {
    params.set('location', `${bias.lat},${bias.lng}`);
    params.set('radius', String(bias.radiusM));
  }
  const body = await callGoogle(
    `${BASE}/textsearch/json?${params}`,
    'google_places_text_search',
    fetchImpl
  );
  return body ? (body.results ?? []) : null;
}

/** One address suggestion for the home-base type-ahead. */
export interface AddressSuggestion {
  label: string;
  placeId: string;
}

/**
 * Address type-ahead (the v1 behavior, restored by owner ask 2026-07-06):
 * "123 Ma" offers real "123 Main Street"s. `types=geocode` so city-level
 * anchors work too (the form's help copy promises "a city and state is
 * enough"). The session token groups a burst of keystrokes with the
 * details call that resolves the pick, so Google bills the session, not
 * every keystroke. Gate-closed (dev/CI) returns [] — the input degrades
 * to plain typing.
 */
export async function fetchAddressSuggestions(
  input: string,
  sessionToken?: string,
  fetchImpl: FetchLike = fetch
): Promise<AddressSuggestion[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !isGooglePlacesEnabled()) return [];
  const params = new URLSearchParams({
    input,
    types: 'geocode',
    key,
  });
  if (sessionToken) params.set('sessiontoken', sessionToken);
  const body = await callGoogle(
    `${BASE}/autocomplete/json?${params}`,
    'google_places_autocomplete',
    fetchImpl
  );
  return (body?.predictions ?? [])
    .filter(
      (prediction): prediction is { description: string; place_id: string } =>
        typeof prediction.description === 'string' &&
        typeof prediction.place_id === 'string'
    )
    .map((prediction) => ({
      label: prediction.description,
      placeId: prediction.place_id,
    }));
}

/**
 * Resolve a picked autocomplete suggestion to its point + label via Place
 * Details (address fields only). Passing the same session token that fed
 * the suggestions closes the billing session. NOT the cached-restaurant
 * details fetch — an address must never enter the place pool.
 */
export async function geocodePlaceId(
  placeId: string,
  sessionToken?: string,
  fetchImpl: FetchLike = fetch
): Promise<{ label: string; lat: number; lng: number } | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !isGooglePlacesEnabled()) return null;
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'formatted_address,geometry',
    key,
  });
  if (sessionToken) params.set('sessiontoken', sessionToken);
  const body = await callGoogle(
    `${BASE}/details/json?${params}`,
    'google_places_details',
    fetchImpl
  );
  const lat = body?.result?.geometry?.location?.lat;
  const lng = body?.result?.geometry?.location?.lng;
  const label = body?.result?.formatted_address;
  if (typeof lat !== 'number' || typeof lng !== 'number' || !label) {
    return null;
  }
  return { label, lat, lng };
}

/**
 * Geocode an address the user typed into a point + normalized label, via
 * Find Place From Text — the Places family the prod key is already enabled
 * for (the standalone Geocoding API may not be). Deliberately NOT routed
 * through the place cache: a home address must never become a restaurant
 * in the pool. Returns null when the gate is closed, the call fails, or
 * Google can't resolve the text. (The free-typed fallback: a picked
 * suggestion goes through geocodePlaceId instead.)
 */
export async function geocodeAddress(
  address: string,
  fetchImpl: FetchLike = fetch
): Promise<{ label: string; lat: number; lng: number } | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !isGooglePlacesEnabled()) return null;
  const params = new URLSearchParams({
    input: address,
    inputtype: 'textquery',
    fields: 'formatted_address,geometry',
    key,
  });
  const body = await callGoogle(
    `${BASE}/findplacefromtext/json?${params}`,
    'google_places_find_place',
    fetchImpl
  );
  const candidate = body?.candidates?.[0];
  const lat = candidate?.geometry?.location?.lat;
  const lng = candidate?.geometry?.location?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { label: candidate?.formatted_address ?? address, lat, lng };
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
