import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import type { PlaceDoc } from './schema';

/**
 * Shared plumbing for the /api/v2 routes: one error-mapping policy and the
 * JSON-safe place summary the UI renders (never the raw doc — cachedAt,
 * GeoJSON internals and future Google payload fields stay server-side).
 */

const NOT_FOUND_MESSAGES = new Set(['Fork not found', 'List not found']);

export function v2ErrorResponse(route: string, error: unknown): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid input', details: error.issues },
      { status: 400 }
    );
  }
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (NOT_FOUND_MESSAGES.has(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    // Domain rejections (closed fork, bad rankings…) are client errors.
    logger.warn(`v2 ${route}: rejected`, { message: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  logger.error(`v2 ${route}: unexpected error`, { error });
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
}

export interface PlaceSummary {
  id: string;
  name: string;
  address: string;
  categories: string[];
  priceLevel?: number;
  rating?: number;
}

export function placeSummary(place: PlaceDoc): PlaceSummary {
  return {
    id: place._id.toString(),
    name: place.name,
    address: place.address,
    categories: place.categories,
    priceLevel: place.priceLevel,
    rating: place.rating,
  };
}
