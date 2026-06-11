import { NextRequest, NextResponse } from 'next/server';
import type { Collection, Document } from 'mongodb';
import { connectToDatabase } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * MongoDB-backed fixed-window rate limiter.
 *
 * One document per (key, window) in the `rate_limits` collection, incremented
 * atomically via findOneAndUpdate + $inc upsert. Documents are garbage
 * collected by a TTL index on `expiresAt`.
 *
 * Deliberately FAILS OPEN: if the database is unreachable the request is
 * allowed and a warning is logged — availability over strictness.
 */

export interface RateLimitOptions {
  /** Unique identifier for the actor + route being limited. */
  key: string;
  /** Maximum number of requests allowed per window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the current window resets (0 when allowed). */
  retryAfterSeconds: number;
}

interface RateLimitDocument extends Document {
  key: string;
  count: number;
  expiresAt: Date;
}

const COLLECTION_NAME = 'rate_limits';

// Ensure indexes only once per process (serverless instances are short-lived,
// and createIndex is idempotent, so re-running on cold start is fine).
let indexesEnsured = false;

async function getRateLimitCollection(): Promise<
  Collection<RateLimitDocument>
> {
  const db = await connectToDatabase();
  const collection = db.collection<RateLimitDocument>(COLLECTION_NAME);

  if (!indexesEnsured) {
    indexesEnsured = true;
    // Fire-and-forget: index creation must never block or fail a request.
    Promise.all([
      // TTL cleanup of expired windows.
      collection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: 'rate_limits_ttl' }
      ),
      // One document per (key, window); also makes the upsert race-safe.
      collection.createIndex(
        { key: 1 },
        { unique: true, name: 'rate_limits_key_unique' }
      ),
    ]).catch((error) => {
      indexesEnsured = false; // retry on a later request
      logger.warn('Failed to ensure rate_limits indexes', { error });
    });
  }

  return collection;
}

/**
 * Check (and consume) one request against a fixed-window rate limit.
 * Fails open on database errors.
 */
export async function checkRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult> {
  try {
    const collection = await getRateLimitCollection();

    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const windowEnd = windowStart + windowMs;
    const windowKey = `${key}:${windowStart}`;

    let doc: RateLimitDocument | null = null;
    try {
      doc = await collection.findOneAndUpdate(
        { key: windowKey },
        {
          $inc: { count: 1 },
          // Keep the doc slightly past the window end so in-flight requests
          // still see it; the TTL monitor removes it afterwards.
          $setOnInsert: { expiresAt: new Date(windowEnd + 60_000) },
        },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (error) {
      // Two concurrent first requests can race the upsert against the unique
      // index (E11000). Exactly one wins; retry once for the loser.
      if (isDuplicateKeyError(error)) {
        doc = await collection.findOneAndUpdate(
          { key: windowKey },
          { $inc: { count: 1 } },
          { returnDocument: 'after' }
        );
      } else {
        throw error;
      }
    }

    const count = doc?.count ?? 1;
    const allowed = count <= limit;

    return {
      allowed,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: allowed
        ? 0
        : Math.max(1, Math.ceil((windowEnd - now) / 1000)),
    };
  } catch (error) {
    // FAIL OPEN: never block traffic because the limiter store is down.
    logger.warn('Rate limit check failed; allowing request (fail open)', {
      key,
      error,
    });
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}

/**
 * Best-effort client IP for unauthenticated routes. On Vercel the first
 * entry of x-forwarded-for is the real client IP (Vercel appends, so the
 * first hop is set by their edge and cannot be spoofed past it).
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  return 'unknown';
}

/** Rate-limit key scoped to an authenticated user. */
export function userRateLimitKey(scope: string, userId: string): string {
  return `${scope}:user:${userId}`;
}

/** Rate-limit key scoped to the client IP (for unauthenticated routes). */
export function ipRateLimitKey(scope: string, request: NextRequest): string {
  return `${scope}:ip:${getClientIp(request)}`;
}

/** Standard 429 response with a Retry-After header. */
export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  const response = NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429 }
  );
  response.headers.set('Retry-After', String(Math.max(1, retryAfterSeconds)));
  return response;
}
