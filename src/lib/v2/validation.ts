import { z } from 'zod';
import { VIBE_KEYS } from './places';

/**
 * Zod schemas for the v2 API surface. Every route validates its input here
 * before touching the DB (v1 discipline, kept). Coordinates are plain
 * lat/lng numbers at the API boundary; GeoJSON ordering ([lng, lat]) is a
 * storage concern the lib layer owns.
 */

export const objectIdString = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid id');

const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);

const vibe = z
  .string()
  .refine((value) => VIBE_KEYS.includes(value), 'Unknown vibe')
  .optional();

/** Radius bounds: below ~200m a city block empties, above 5km "near" lies. */
const radiusM = z.number().int().min(200).max(5000).optional();

export const quickSpinSchema = z.object({
  lat: latitude,
  lng: longitude,
  vibe,
  radiusM,
});

/**
 * Lock-in persists the outcome the user just saw. The server re-derives
 * everything derivable (place names, decay weights) and only trusts the
 * client for what it alone knows: which options were on the wheel and which
 * one won. Both are validated against real places, and the write lands
 * exclusively in the caller's own history.
 */
export const lockInSchema = z.object({
  lat: latitude,
  lng: longitude,
  vibe,
  radiusM,
  optionPlaceIds: z.array(objectIdString).min(1).max(24),
  winnerPlaceId: objectIdString,
});

const forkSource = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('near-me'),
    lat: latitude,
    lng: longitude,
    vibe,
    radiusM,
  }),
  z.object({ kind: z.literal('list'), listId: objectIdString }),
  z.object({ kind: z.literal('ad-hoc') }),
]);

export const createForkSchema = z.object({
  mode: z.enum(['spin', 'vote']),
  source: forkSource,
  optionPlaceIds: z.array(objectIdString).min(2).max(24),
  /** Forks end themselves — 5 minutes to 24 hours, default 30 minutes. */
  lifespanMinutes: z.number().int().min(5).max(1440).default(30),
  quorum: z.number().int().min(2).max(50).optional(),
});

export const voteSchema = z.object({
  rankings: z
    .array(objectIdString)
    .min(1)
    .max(3)
    .refine(
      (rankings) => new Set(rankings).size === rankings.length,
      'Rankings must be distinct'
    ),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(80),
});

export type QuickSpinInput = z.infer<typeof quickSpinSchema>;
export type LockInInput = z.infer<typeof lockInSchema>;
export type CreateForkApiInput = z.infer<typeof createForkSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
