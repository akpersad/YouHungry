/**
 * Cron Authentication Helpers
 *
 * Vercel Cron jobs authenticate with an `Authorization: Bearer ${CRON_SECRET}`
 * header. The comparison is timing-safe: both sides are hashed with SHA-256
 * before comparing so `timingSafeEqual` always receives equal-length buffers
 * and cannot throw on attacker-controlled input lengths.
 */

import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Returns true if the CRON_SECRET environment variable is configured.
 */
export function isCronSecretConfigured(): boolean {
  return Boolean(process.env.CRON_SECRET);
}

/**
 * Timing-safe verification of the cron Authorization header.
 *
 * @param authHeader The raw `authorization` header value (or null)
 * @returns true only when CRON_SECRET is configured and the header matches
 */
export function verifyCronAuth(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret || !authHeader) {
    return false;
  }

  // Hash both sides so the buffers are always the same length, which keeps
  // timingSafeEqual from throwing and avoids leaking length information.
  const expected = createHash('sha256').update(`Bearer ${secret}`).digest();
  const provided = createHash('sha256').update(authHeader).digest();

  return timingSafeEqual(expected, provided);
}
