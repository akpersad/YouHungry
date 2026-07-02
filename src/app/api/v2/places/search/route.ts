import { NextRequest, NextResponse } from 'next/server';
import { requireV2User } from '@/lib/v2/auth';
import { searchPlaces } from '@/lib/v2/places';
import { placeSummary, v2ErrorResponse } from '@/lib/v2/http';
import { searchQuerySchema } from '@/lib/v2/validation';

/**
 * GET /api/v2/places/search?q= — ad-hoc fork source (authed). Cache-backed
 * name search in Phase 3; Phase 5 swaps in the consolidated Google client
 * behind the same lib seam.
 */
export async function GET(request: NextRequest) {
  try {
    await requireV2User();
    const { q } = searchQuerySchema.parse({
      q: request.nextUrl.searchParams.get('q') ?? '',
    });

    const places = await searchPlaces(q);
    return NextResponse.json({ places: places.map(placeSummary) });
  } catch (error) {
    return v2ErrorResponse('places:search', error);
  }
}
