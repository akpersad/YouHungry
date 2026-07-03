import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { participantFromUser, requireV2User } from '@/lib/v2/auth';
import { serializeFork, submitVote } from '@/lib/v2/forks';
import { v2ErrorResponse } from '@/lib/v2/http';
import { voteSchema } from '@/lib/v2/validation';

/**
 * POST /api/v2/forks/[code]/vote — cast or replace a ranked ballot
 * (signed-in voters; guest ballots are Phase 4's audited surface). Reaching
 * quorum closes the fork in the same request, so the response may already
 * carry the result.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await requireV2User();
    const { code } = await params;
    const input = voteSchema.parse(await request.json());

    const voter = participantFromUser(user);
    const fork = await submitVote(
      code,
      voter,
      input.rankings.map((id) => new ObjectId(id))
    );

    return NextResponse.json({ fork: serializeFork(fork, voter) });
  } catch (error) {
    return v2ErrorResponse('forks:vote', error);
  }
}
