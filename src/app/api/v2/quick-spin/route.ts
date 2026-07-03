import { NextRequest, NextResponse } from 'next/server';
import { getV2User, participantFromUser } from '@/lib/v2/auth';
import { quickSpin } from '@/lib/v2/forks';
import { findNearbyPlaces, placeToOption } from '@/lib/v2/places';
import { placeSummary, v2ErrorResponse } from '@/lib/v2/http';
import { quickSpinSchema } from '@/lib/v2/validation';

/**
 * POST /api/v2/quick-spin — the cold-open journey. Public by design
 * (CHARTER: value in ≤2 taps before any account exists) and write-free:
 * nothing persists until the caller locks the result in (authed sibling
 * route). Signed-in spinners get their decay history applied; signed-out
 * spinners get base weights.
 */
export async function POST(request: NextRequest) {
  try {
    const input = quickSpinSchema.parse(await request.json());

    const places = await findNearbyPlaces(
      { lat: input.lat, lng: input.lng },
      { vibe: input.vibe, radiusM: input.radiusM }
    );
    if (places.length === 0) {
      // An honest empty state, not an error — the client owns the copy.
      return NextResponse.json({ places: [], spin: null });
    }

    const user = await getV2User();
    const outcome = await quickSpin(
      places.map(placeToOption),
      user ? participantFromUser(user) : null
    );

    return NextResponse.json({
      places: places.map(placeSummary),
      spin: {
        winnerPlaceId: outcome.winnerPlaceId,
        weights: outcome.weights,
        reasoning: outcome.reasoning,
      },
    });
  } catch (error) {
    return v2ErrorResponse('quick-spin', error);
  }
}
