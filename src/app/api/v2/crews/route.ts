import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { requireV2User } from '@/lib/v2/auth';
import {
  createCrew,
  getCrewSuggestionsForUser,
  getCrewsForUser,
} from '@/lib/v2/crews';
import { v2ErrorResponse } from '@/lib/v2/http';
import { createCrewSchema } from '@/lib/v2/validation';

/**
 * Crews for the signed-in caller. GET returns both what exists and what
 * could: the caller's crews plus suggestions derived from repeated
 * co-participation (the lane's whole thesis — crews emerge from
 * decisions). POST accepts a suggestion (or any member set including the
 * caller); accepting the same set twice returns the same crew.
 */

export async function GET() {
  try {
    const user = await requireV2User();
    const [crews, suggestions] = await Promise.all([
      getCrewsForUser(user._id),
      getCrewSuggestionsForUser(user._id),
    ]);
    return NextResponse.json({
      crews: crews.map((crew) => ({
        id: crew._id.toString(),
        name: crew.name,
        memberCount: crew.memberIds.length,
      })),
      suggestions,
    });
  } catch (error) {
    return v2ErrorResponse('crews:list', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireV2User();
    const input = createCrewSchema.parse(await request.json());
    const crew = await createCrew(
      user._id,
      input.memberIds.map((id) => new ObjectId(id)),
      input.name
    );
    return NextResponse.json(
      {
        crew: {
          id: crew._id.toString(),
          name: crew.name,
          memberCount: crew.memberIds.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return v2ErrorResponse('crews:create', error);
  }
}
