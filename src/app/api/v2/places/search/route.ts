import { NextRequest, NextResponse } from 'next/server';
import { requireV2User } from '@/lib/v2/auth';
import { searchPlaces, type SearchBias } from '@/lib/v2/places';
import { placeSummary, v2ErrorResponse } from '@/lib/v2/http';
import { searchQuerySchema } from '@/lib/v2/validation';

/**
 * GET /api/v2/places/search?q=[&lat&lng] — ad-hoc fork source and the
 * Places lane (authed). Results are location-biased so a chain name finds
 * the branches near you, not the country's famous ones: explicit lat/lng
 * (live location) wins, then the viewer's saved search anchor; with
 * neither, Google answers unbiased exactly as before.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireV2User();
    const searchParams = request.nextUrl.searchParams;
    // Absent params stay absent — Number(null) is 0, which would pass
    // validation and silently bias toward the Gulf of Guinea.
    const numberParam = (name: string) => {
      const raw = searchParams.get(name);
      return raw === null || raw.trim() === '' ? undefined : Number(raw);
    };
    const input = searchQuerySchema.parse({
      q: searchParams.get('q') ?? '',
      lat: numberParam('lat'),
      lng: numberParam('lng'),
    });

    let bias: SearchBias | undefined;
    if (input.lat !== undefined && input.lng !== undefined) {
      bias = { lat: input.lat, lng: input.lng };
    } else if (user.searchAnchor) {
      const [lng, lat] = user.searchAnchor.location.coordinates;
      bias = { lat, lng };
    }

    const places = await searchPlaces(input.q, undefined, bias);
    return NextResponse.json({ places: places.map(placeSummary) });
  } catch (error) {
    return v2ErrorResponse('places:search', error);
  }
}
