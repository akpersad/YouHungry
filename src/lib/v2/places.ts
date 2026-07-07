import { ObjectId } from 'mongodb';
import type { AnyBulkWriteOperation, Filter } from 'mongodb';
import { getV2Db } from './db';
import type { ForkOption, PlaceDoc } from './schema';
import {
  fetchNearbyFromGoogle,
  fetchPlaceDetailsFromGoogle,
  fetchTextSearchFromGoogle,
  isGooglePlacesEnabled,
  toPlaceFields,
  type GooglePlaceResult,
} from './google-places';

/**
 * Place queries for the Fork lane — all reads against the v2 `places`
 * cache. Since Phase 5 the consolidated Google client (google-places.ts)
 * backfills that cache on miss, throttled by query markers; where Google
 * is unreachable or disabled (dev, CI, an outage) every function degrades
 * to cache-only exactly as Phase 3 shipped it, so nothing here can take a
 * spin down with it.
 */

/** Near-me search radius when the caller doesn't set one. */
export const DEFAULT_RADIUS_M = 2000;
export const MAX_NEARBY_OPTIONS = 12;

/** How long a fetched nearby area satisfies repeat lookups. */
const NEARBY_FRESH_MS = 24 * 60 * 60 * 1000;
/** How long a fetched text search satisfies repeat lookups. */
const TEXT_FRESH_MS = 7 * 24 * 60 * 60 * 1000;
/** Charter: places re-fetch after 30 days when something reads them. */
const PLACE_STALE_MS = 30 * 24 * 60 * 60 * 1000;

/** Seed fixtures (`dev-*`) are not Google payloads; never re-fetch them. */
function isFixtureId(googlePlaceId: string): boolean {
  return googlePlaceId.startsWith('dev-');
}

/** Upsert Google results into the place cache; returns nothing on purpose —
 * callers re-run their cache query so one code path serves both sources. */
async function upsertGoogleResults(
  results: GooglePlaceResult[]
): Promise<void> {
  const now = new Date();
  const ops: AnyBulkWriteOperation<PlaceDoc>[] = [];
  for (const result of results) {
    const fields = toPlaceFields(result);
    if (!fields || isFixtureId(fields.googlePlaceId)) continue;
    ops.push({
      updateOne: {
        filter: { googlePlaceId: fields.googlePlaceId },
        update: {
          $set: { ...fields, cachedAt: now, updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    });
  }
  if (ops.length === 0) return;
  const { places } = await getV2Db();
  await places.bulkWrite(ops, { ordered: false });
}

/**
 * Run `fetchFn` against Google at most once per `freshMs` for `key`.
 * Returns the marker's place ids (fresh or just-fetched), or null when
 * Google is disabled and no marker exists — the cue to serve cache-only.
 * Two racing callers may both fetch (marker written after the fetch);
 * that is rare, self-healing, and cheaper than a claim protocol.
 */
async function backfillOnce(
  key: string,
  freshMs: number,
  fetchFn: () => Promise<GooglePlaceResult[] | null>
): Promise<string[] | null> {
  const { placeQueries } = await getV2Db();
  const marker = await placeQueries.findOne({ key });
  if (marker && Date.now() - marker.fetchedAt.getTime() < freshMs) {
    return marker.googlePlaceIds;
  }
  if (!isGooglePlacesEnabled()) return marker?.googlePlaceIds ?? null;
  const results = await fetchFn();
  // null = the call failed: write no marker so the next caller retries
  // instead of pinning an outage's answer for a full TTL window. A real
  // ZERO_RESULTS ([]) is cached like any other answer.
  if (results === null) return marker?.googlePlaceIds ?? null;
  await upsertGoogleResults(results);
  const googlePlaceIds = results
    .map((result) => result.place_id)
    .filter(Boolean);
  const now = new Date();
  await placeQueries.updateOne(
    { key },
    { $set: { googlePlaceIds, fetchedAt: now } },
    { upsert: true }
  );
  return googlePlaceIds;
}

/**
 * Vibe filter — the one optional knob on a near-me spin (CHARTER: "near me
 * + optional vibe filter"). Keys are persisted on `ForkSource.vibe`, so
 * they are contract, not copy; labels are the UI's business.
 */
export interface Vibe {
  key: string;
  label: string;
  filter: Filter<PlaceDoc>;
}

export const VIBES: Vibe[] = [
  { key: 'cheap', label: 'Cheap eats', filter: { priceLevel: { $lte: 1 } } },
  { key: 'fancy', label: 'Make it fancy', filter: { priceLevel: { $gte: 3 } } },
  { key: 'top', label: 'Top rated', filter: { rating: { $gte: 4.5 } } },
];

export const VIBE_KEYS = VIBES.map((vibe) => vibe.key);

export function vibeFilter(vibeKey?: string): Filter<PlaceDoc> {
  return VIBES.find((vibe) => vibe.key === vibeKey)?.filter ?? {};
}

/**
 * Places near a point, closest first (2dsphere index), optionally narrowed
 * by vibe. Capped at MAX_NEARBY_OPTIONS — a spin wheel with 50 tiles is a
 * worse decision, not a better one. Backfills the cache from Google at most
 * once per area per day; the cache query itself is the single read path,
 * so vibe filters and distance order apply to both sources identically.
 */
export async function findNearbyPlaces(
  center: { lat: number; lng: number },
  opts: { radiusM?: number; vibe?: string; limit?: number } = {}
): Promise<PlaceDoc[]> {
  const radiusM = opts.radiusM ?? DEFAULT_RADIUS_M;
  // ~110m grid: close-together opens share one Google fetch.
  const areaKey = `nearby:${center.lat.toFixed(3)}:${center.lng.toFixed(3)}:${radiusM}`;
  await backfillOnce(areaKey, NEARBY_FRESH_MS, () =>
    fetchNearbyFromGoogle(center, radiusM)
  );
  const { places } = await getV2Db();
  return places
    .find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [center.lng, center.lat],
          },
          $maxDistance: radiusM,
        },
      },
      ...vibeFilter(opts.vibe),
    })
    .limit(opts.limit ?? MAX_NEARBY_OPTIONS)
    .toArray();
}

/**
 * Search bias radius: metro-scale. Legacy Text Search treats it as a bias,
 * not a fence, so an exact faraway name still resolves — but a chain query
 * answers with the branches near the anchor.
 */
export const SEARCH_BIAS_RADIUS_M = 40_000;

export interface SearchBias {
  lat: number;
  lng: number;
}

/**
 * Search — the ad-hoc fork source and the Places lane. Google-backed
 * searches serve the marker's ids in Google's relevance order (semantic
 * matching: "sushi" finds Kanoyama, which a name-regex cannot); when
 * Google is disabled or has never answered this query, falls back to the
 * Phase 3 name-regex over the cache, which is also what dev/CI exercise.
 *
 * `bias` anchors results near a point (the caller passes the viewer's
 * saved search anchor or live location). Biased and unbiased runs of the
 * same words are different questions, so the cache marker key carries a
 * ~11km grid cell — two cities can never poison each other's cached
 * answer, while neighbors still share one Google fetch.
 */
export async function searchPlaces(
  query: string,
  limit: number = 8,
  bias?: SearchBias
): Promise<PlaceDoc[]> {
  const normalized = query.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!normalized) return [];
  const { places } = await getV2Db();
  const markerKey = bias
    ? `text:${normalized}@${bias.lat.toFixed(1)}:${bias.lng.toFixed(1)}`
    : `text:${normalized}`;
  const markerIds = await backfillOnce(markerKey, TEXT_FRESH_MS, () =>
    fetchTextSearchFromGoogle(
      normalized,
      bias ? { ...bias, radiusM: SEARCH_BIAS_RADIUS_M } : undefined
    )
  );
  if (markerIds !== null) {
    const docs = await places
      .find({ googlePlaceId: { $in: markerIds.slice(0, limit) } })
      .toArray();
    const byGoogleId = new Map(docs.map((doc) => [doc.googlePlaceId, doc]));
    return markerIds
      .map((id) => byGoogleId.get(id))
      .filter((doc): doc is PlaceDoc => doc !== undefined)
      .slice(0, limit);
  }
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return places
    .find({ name: { $regex: escaped, $options: 'i' } })
    .limit(limit)
    .toArray();
}

export async function getPlacesByIds(ids: ObjectId[]): Promise<PlaceDoc[]> {
  if (ids.length === 0) return [];
  const { places } = await getV2Db();
  const docs = await places.find({ _id: { $in: ids } }).toArray();
  // Preserve caller order — Mongo returns $in matches in index order.
  const byId = new Map(docs.map((doc) => [doc._id.toString(), doc]));
  return ids
    .map((id) => byId.get(id.toString()))
    .filter((doc): doc is PlaceDoc => doc !== undefined);
}

export function placeToOption(place: PlaceDoc): ForkOption {
  return {
    placeId: place._id,
    googlePlaceId: place.googlePlaceId,
    name: place.name,
  };
}

/** The wire shape every v2 surface renders a place as. */
export interface PlaceSummary {
  id: string;
  name: string;
  address: string;
  categories: string[];
  priceLevel?: number;
  rating?: number;
  /** Google Maps listing (menu/photos/hours live there — owner call
   * 2026-07-06: link out rather than integrate a menu provider). */
  mapsUrl: string;
}

/**
 * The official Maps URLs scheme — free, no API key. `query_place_id` pins
 * the exact listing; the query text is the human-readable fallback Google
 * uses when the id is unknown (dev fixtures, retired places).
 */
export function mapsUrlFor(place: PlaceDoc): string {
  const params = new URLSearchParams({
    api: '1',
    query: `${place.name} ${place.address}`.trim(),
  });
  if (!isFixtureId(place.googlePlaceId)) {
    params.set('query_place_id', place.googlePlaceId);
  }
  return `https://www.google.com/maps/search/?${params}`;
}

export function toPlaceSummary(place: PlaceDoc): PlaceSummary {
  return {
    id: place._id.toString(),
    name: place.name,
    address: place.address,
    categories: place.categories,
    ...(typeof place.priceLevel === 'number'
      ? { priceLevel: place.priceLevel }
      : {}),
    ...(typeof place.rating === 'number' ? { rating: place.rating } : {}),
    mapsUrl: mapsUrlFor(place),
  };
}

/**
 * Attach winner place details (address/rating/price) to a serialized fork
 * view — the Phase 3 deferred item "result place details land with Phase
 * 5". No-op for open forks and for results whose place doc has vanished;
 * the view is always renderable without it.
 */
export async function enrichForkView<
  T extends { result: ({ placeId: string } & object) | null },
>(view: T): Promise<T> {
  if (!view.result || !ObjectId.isValid(view.result.placeId)) return view;
  const [doc] = await getFreshPlacesByIds([new ObjectId(view.result.placeId)]);
  if (!doc) return view;
  return {
    ...view,
    result: { ...view.result, place: toPlaceSummary(doc) },
  };
}

/**
 * Fetch places by id, refreshing any Google-backed doc whose payload is
 * older than 30 days (the charter's cache window) via Place Details. Used
 * where a single place is actually being shown to someone — fork results,
 * list detail — never on bulk search paths, so the details spend stays
 * proportional to real attention. Fixtures and refresh failures fall back
 * to the cached doc; this never subtracts places.
 */
export async function getFreshPlacesByIds(
  ids: ObjectId[]
): Promise<PlaceDoc[]> {
  const docs = await getPlacesByIds(ids);
  if (!isGooglePlacesEnabled()) return docs;
  const now = Date.now();
  const stale = docs.filter(
    (doc) =>
      !isFixtureId(doc.googlePlaceId) &&
      now - doc.cachedAt.getTime() > PLACE_STALE_MS
  );
  if (stale.length === 0) return docs;
  const results = await Promise.all(
    stale.map((doc) => fetchPlaceDetailsFromGoogle(doc.googlePlaceId))
  );
  await upsertGoogleResults(
    results.filter((result): result is GooglePlaceResult => result !== null)
  );
  return getPlacesByIds(ids);
}
