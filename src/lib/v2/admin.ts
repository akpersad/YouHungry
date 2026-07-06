import type { V2UserDoc } from './schema';

const DAY_MS = 24 * 60 * 60 * 1000;

/** The admin page's reporting window: the last 30 days. */
export function adminWindowStart(): Date {
  return new Date(Date.now() - 30 * DAY_MS);
}

/**
 * Admin = user whose Mongo `_id` is listed in ADMIN_USER_IDS
 * (comma-separated; same convention and Vercel env var as v1).
 */
export function isAdminUser(user: V2UserDoc): boolean {
  const raw = process.env.ADMIN_USER_IDS;
  if (!raw) return false;
  const ids = raw.split(',').map((id) => id.trim());
  return ids.includes(user._id.toString());
}
