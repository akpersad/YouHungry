import { NextRequest, NextResponse } from 'next/server';
import { participantFromUser, requireV2User } from '@/lib/v2/auth';
import { decideForkNow, serializeFork } from '@/lib/v2/forks';
import { getClaimedGuestIds } from '@/lib/v2/guests';
import { v2ErrorResponse } from '@/lib/v2/http';
import { enrichForkView } from '@/lib/v2/places';

/**
 * POST /api/v2/forks/[code]/decide — "Decide now": the organizer ends the
 * vote early; the ballots already cast pick the winner via the same sealed
 * consensus close as quorum/timer. Organizer-only (organizers are signed-in
 * users — fork creation is authed), rejected while the ballot box is empty.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await requireV2User();
    const { code } = await params;

    const caller = participantFromUser(user);
    const claimedGuestIds = await getClaimedGuestIds(user._id);
    const fork = await decideForkNow(code, caller, { claimedGuestIds });

    return NextResponse.json({
      fork: await enrichForkView(serializeFork(fork, caller, claimedGuestIds)),
    });
  } catch (error) {
    return v2ErrorResponse('forks:decide', error);
  }
}
