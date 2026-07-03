import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { V2DomainError } from './errors';

/**
 * Shared plumbing for the /api/v2 routes: one error-mapping policy and the
 * JSON-safe place summary the UI renders (never the raw doc — cachedAt,
 * GeoJSON internals and future Google payload fields stay server-side).
 */

export function v2ErrorResponse(route: string, error: unknown): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid input', details: error.issues },
      { status: 400 }
    );
  }
  // Domain rejections (closed fork, bad rankings, 401/404…) carry a
  // user-facing message and an explicit status.
  if (error instanceof V2DomainError) {
    logger.warn(`v2 ${route}: rejected`, {
      message: error.message,
      status: error.status,
    });
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  // Everything else is an infrastructure failure: a real 500, generic body
  // (internal messages never reach the client), full detail to the logger.
  logger.error(`v2 ${route}: unexpected error`, { error });
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
}

// The canonical place serializer lives with the domain (places.ts, where
// Phase 5's Google client and enrichment also use it); routes keep their
// established import path.
export type { PlaceSummary } from './places';
export { toPlaceSummary as placeSummary } from './places';
