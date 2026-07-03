import { ObjectId } from 'mongodb';
import type { Filter } from 'mongodb';
import { getV2Db } from './db';
import type { ForkOption, PlaceDoc } from './schema';

/**
 * Place queries for the Fork lane — all reads against the v2 `places`
 * cache. This module is the seam Phase 5 fills with the consolidated
 * Google client (cache-first, backfill on miss); Phase 3 deliberately
 * never calls Google, so dev and CI bill nothing and prod simply reports
 * an honest empty state until the cache has places.
 */

/** Near-me search radius when the caller doesn't set one. */
export const DEFAULT_RADIUS_M = 2000;
export const MAX_NEARBY_OPTIONS = 12;

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
 * worse decision, not a better one.
 */
export async function findNearbyPlaces(
  center: { lat: number; lng: number },
  opts: { radiusM?: number; vibe?: string; limit?: number } = {}
): Promise<PlaceDoc[]> {
  const { places } = await getV2Db();
  return places
    .find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [center.lng, center.lat],
          },
          $maxDistance: opts.radiusM ?? DEFAULT_RADIUS_M,
        },
      },
      ...vibeFilter(opts.vibe),
    })
    .limit(opts.limit ?? MAX_NEARBY_OPTIONS)
    .toArray();
}

/** Name search against the cache — the ad-hoc fork source (Phase 3 scope). */
export async function searchPlaces(
  query: string,
  limit: number = 8
): Promise<PlaceDoc[]> {
  const { places } = await getV2Db();
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!escaped) return [];
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
