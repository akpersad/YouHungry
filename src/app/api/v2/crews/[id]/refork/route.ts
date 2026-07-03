import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { participantFromUser, requireV2User } from '@/lib/v2/auth';
import { reforkCrew } from '@/lib/v2/crews';
import { serializeFork } from '@/lib/v2/forks';
import { v2ErrorResponse } from '@/lib/v2/http';
import { objectIdString, reforkSchema } from '@/lib/v2/validation';

/**
 * POST /api/v2/crews/[id]/refork — run it back: a fresh fork on the last
 * crew ballot, carrying the crewId so it settles against the crew's
 * SHARED decay history. Any member can pull the trigger; they become the
 * organizer of the new fork.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireV2User();
    const { id } = await params;
    const crewId = new ObjectId(objectIdString.parse(id));
    const body = await request.json().catch(() => ({}));
    const input = reforkSchema.parse(body ?? {});

    const organizer = { ...participantFromUser(user), userId: user._id };
    const fork = await reforkCrew(crewId, organizer, { mode: input.mode });

    return NextResponse.json(
      { fork: serializeFork(fork, organizer) },
      { status: 201 }
    );
  } catch (error) {
    return v2ErrorResponse('crews:refork', error);
  }
}
