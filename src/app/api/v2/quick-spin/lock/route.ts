import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { participantFromUser, requireV2User } from '@/lib/v2/auth';
import { lockInQuickSpin } from '@/lib/v2/forks';
import {
  DEFAULT_RADIUS_M,
  getPlacesByIds,
  placeToOption,
} from '@/lib/v2/places';
import { v2ErrorResponse } from '@/lib/v2/http';
import { lockInSchema } from '@/lib/v2/validation';

/**
 * POST /api/v2/quick-spin/lock — "Lock it in": persist the quick spin the
 * caller just saw as a closed fork in their own decay history. Signed-in
 * only; the server re-derives names and weights and validates the winner
 * was actually on the wheel.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireV2User();
    const input = lockInSchema.parse(await request.json());

    const places = await getPlacesByIds(
      input.optionPlaceIds.map((id) => new ObjectId(id))
    );
    if (places.length !== input.optionPlaceIds.length) {
      return NextResponse.json(
        { error: 'One or more places no longer exist' },
        { status: 400 }
      );
    }

    const fork = await lockInQuickSpin({
      organizer: participantFromUser(user),
      source: {
        kind: 'near-me',
        center: { type: 'Point', coordinates: [input.lng, input.lat] },
        radiusM: input.radiusM ?? DEFAULT_RADIUS_M,
        vibe: input.vibe,
      },
      options: places.map(placeToOption),
      winnerPlaceId: new ObjectId(input.winnerPlaceId),
    });

    return NextResponse.json({
      code: fork.code,
      decidedAt: fork.result!.decidedAt.toISOString(),
    });
  } catch (error) {
    return v2ErrorResponse('quick-spin/lock', error);
  }
}
