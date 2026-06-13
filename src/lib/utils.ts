import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Compact, human relative date for "last decided"-style stats: "Today",
 * "Yesterday", "N days ago", "N weeks ago", "N months ago", then an absolute
 * date for anything older than a year. Accepts a Date, ISO string, or null.
 */
export function formatRelativeDate(
  value: Date | string | null | undefined
): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);

  if (days < 0) return formatDate(date); // future date — show absolute
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }
  return formatDate(date);
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * A restaurant identity can arrive in several shapes: a search result
 * (`Restaurant`, always carries `googlePlaceId`, may also have `_id`), or a
 * stored `Collection.restaurantIds` entry which is one of a bare `ObjectId`
 * (legacy), `{ _id, googlePlaceId }`, or `{ googlePlaceId }`. These helpers
 * normalize all of those so membership checks stop hand-rolling the brittle
 * "is it a string? an object? which field?" comparison at every call site.
 */
type RestaurantIdLike =
  | string
  | { _id?: unknown; googlePlaceId?: unknown; [key: string]: unknown }
  | { toString(): string }
  | null
  | undefined;

/**
 * Every key a value can legitimately be matched on. `googlePlaceId` is the
 * stable cross-source identifier (present on every Google result and every
 * new-format stored entry); the Mongo `_id` is the fallback for legacy
 * entries that predate googlePlaceId being stored.
 */
export function restaurantIdentityKeys(value: RestaurantIdLike): string[] {
  if (value == null) return [];
  if (typeof value === 'string') return value ? [value] : [];
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys: string[] = [];
    if ('googlePlaceId' in obj && obj.googlePlaceId) {
      keys.push(String(obj.googlePlaceId));
    }
    if ('_id' in obj && obj._id) {
      keys.push(String(obj._id));
    }
    // Bare ObjectId (or any value with a meaningful toString) — legacy entries.
    if (keys.length === 0 && typeof obj.toString === 'function') {
      const str = obj.toString();
      if (str && str !== '[object Object]') keys.push(str);
    }
    return keys;
  }
  return [];
}

/**
 * Canonical single id (googlePlaceId preferred, then `_id`). Use for React
 * keys and `Set` membership where one stable value per restaurant is needed.
 */
export function normalizeRestaurantId(value: RestaurantIdLike): string | null {
  return restaurantIdentityKeys(value)[0] ?? null;
}

/** True when two id-like values refer to the same restaurant. */
export function restaurantIdsMatch(
  a: RestaurantIdLike,
  b: RestaurantIdLike
): boolean {
  const aKeys = restaurantIdentityKeys(a);
  if (aKeys.length === 0) return false;
  const bKeys = restaurantIdentityKeys(b);
  return aKeys.some((key) => bKeys.includes(key));
}
