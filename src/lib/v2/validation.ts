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

/** A ballot with the same place twice is one choice pretending to be two. */
const distinctIds = <T extends z.ZodType<string[]>>(
  schema: T,
  message = 'Places must be distinct'
) => schema.refine((ids) => new Set(ids).size === ids.length, message);

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
  optionPlaceIds: distinctIds(z.array(objectIdString).min(1).max(24)),
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
  optionPlaceIds: distinctIds(z.array(objectIdString).min(2).max(24)),
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

/**
 * A guest's display name: 1–24 visible characters, whitespace collapsed,
 * no control/format characters (bidi overrides, zero-widths). This is the
 * ONLY thing a guest ever tells us about themselves.
 */
export const guestDisplayName = z
  .string()
  .trim()
  .transform((name) => name.replace(/\s+/g, ' '))
  .pipe(
    z
      .string()
      .min(1, 'Pick a name so the group knows who voted')
      .max(24, 'Keep the name under 24 characters')
      .refine(
        (name) => !/\p{C}/u.test(name),
        'That name contains unsupported characters'
      )
  );

/**
 * Guest ballot: rankings + the signed fork token issued with the page
 * (binds the vote to this fork and its lifespan — see tokens.ts), plus a
 * display name (required the first time, optional rename after).
 */
export const guestVoteSchema = voteSchema.extend({
  forkToken: z.string().min(1),
  displayName: guestDisplayName.optional(),
});

export const searchQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(80),
    /** Optional live-location bias — overrides the saved search anchor. */
    lat: latitude.optional(),
    lng: longitude.optional(),
  })
  .refine(
    (input) => (input.lat === undefined) === (input.lng === undefined),
    'lat and lng come together'
  );

/**
 * A list name: same hygiene as a guest display name (trim, collapse
 * whitespace, no control/format characters), a touch more room.
 */
export const listName = z
  .string()
  .trim()
  .transform((name) => name.replace(/\s+/g, ' '))
  .pipe(
    z
      .string()
      .min(1, 'Give the list a name')
      .max(40, 'Keep the name under 40 characters')
      .refine(
        (name) => !/\p{C}/u.test(name),
        'That name contains unsupported characters'
      )
  );

export const createListSchema = z.object({ name: listName });
export const renameListSchema = z.object({ name: listName });
export const savePlaceSchema = z.object({ placeId: objectIdString });
export const joinListSchema = z.object({ token: z.string().min(1).max(512) });

/** Crew names share list-name hygiene. */
export const createCrewSchema = z.object({
  name: listName,
  memberIds: distinctIds(
    z.array(objectIdString).min(2).max(20),
    'People must be distinct'
  ),
});
export const renameCrewSchema = z.object({ name: listName });
export const reforkSchema = z.object({
  mode: z.enum(['spin', 'vote']).optional(),
});

/**
 * A first name for the account page: guest-display-name hygiene (trim,
 * collapse whitespace, no control/format characters) at the same length —
 * it renders in exactly the places a guest name does.
 */
export const accountFirstName = z
  .string()
  .trim()
  .transform((name) => name.replace(/\s+/g, ' '))
  .pipe(
    z
      .string()
      .min(1, 'Your crew needs something to call you')
      .max(24, 'Keep it under 24 characters')
      .refine(
        (name) => !/\p{C}/u.test(name),
        'That name contains unsupported characters'
      )
  );

export const updateAccountSchema = z.object({
  firstName: accountFirstName.optional(),
  /** Search-anchor address: a string geocodes and saves, null clears. */
  address: z
    .string()
    .trim()
    .min(3, 'That address is too short')
    .max(200, 'Keep the address under 200 characters')
    .nullable()
    .optional(),
  /** Set when the address came from a type-ahead pick (resolves by id). */
  placeId: z.string().min(1).max(256).optional(),
  /** Autocomplete billing-session token, minted client-side per burst. */
  sessionToken: z.string().min(8).max(64).optional(),
});

export const addressSuggestQuerySchema = z.object({
  q: z.string().trim().min(3).max(200),
  session: z.string().min(8).max(64).optional(),
});

/** Clerk enforces its own password rules; the bounds here are sanity only. */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z
    .string()
    .min(8, 'At least 8 characters')
    .max(256, 'Keep it under 256 characters'),
});

export const notificationSettingsSchema = z
  .object({
    pushEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
  })
  .refine(
    (settings) =>
      settings.pushEnabled !== undefined || settings.emailEnabled !== undefined,
    'Nothing to change'
  );

/**
 * A browser PushSubscription.toJSON(). Endpoints are push-service HTTPS
 * URLs; keys are base64url material the push service hands back verbatim.
 */
export const pushSubscriptionSchema = z.object({
  endpoint: z
    .string()
    .url()
    .max(1024)
    .refine((url) => url.startsWith('https://'), 'Endpoint must be https'),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});

export const removePushSubscriptionSchema = z.object({
  endpoint: z.string().min(1).max(1024),
});

export type QuickSpinInput = z.infer<typeof quickSpinSchema>;
export type LockInInput = z.infer<typeof lockInSchema>;
export type CreateForkApiInput = z.infer<typeof createForkSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
