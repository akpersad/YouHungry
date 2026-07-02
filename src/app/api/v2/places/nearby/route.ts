import { NextRequest, NextResponse } from 'next/server';
import { requireV2User } from '@/lib/v2/auth';
import { findNearbyPlaces } from '@/lib/v2/places';
import { placeSummary, v2ErrorResponse } from '@/lib/v2/http';
import { quickSpinSchema } from '@/lib/v2/validation';

/**
 * GET /api/v2/places/nearby?lat&lng[&vibe][&radiusM] — the near-me source
 * preview in fork creation (authed; the public near-me path is quick-spin).
 * Reads the v2 place cache only — Phase 5 adds the Google client behind
 * the same lib seam.
 */
export async function GET(request: NextRequest) {
  try {
    await requireV2User();
    const searchParams = request.nextUrl.searchParams;
    // Absent params stay absent — Number(null) is 0, which would pass
    // validation and silently search the Gulf of Guinea.
    const numberParam = (name: string) => {
      const raw = searchParams.get(name);
      return raw === null || raw.trim() === '' ? undefined : Number(raw);
    };
    const input = quickSpinSchema.parse({
      lat: numberParam('lat'),
      lng: numberParam('lng'),
      vibe: searchParams.get('vibe') ?? undefined,
      radiusM: numberParam('radiusM'),
    });

    const places = await findNearbyPlaces(
      { lat: input.lat, lng: input.lng },
      { vibe: input.vibe, radiusM: input.radiusM }
    );
    return NextResponse.json({ places: places.map(placeSummary) });
  } catch (error) {
    return v2ErrorResponse('places:nearby', error);
  }
}
