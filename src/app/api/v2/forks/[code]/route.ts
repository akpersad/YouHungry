import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  ipRateLimitKey,
  rateLimitResponse,
} from '@/lib/rate-limit';
import { getSettledForkByCode, serializeFork } from '@/lib/v2/forks';
import { GUEST_COOKIE } from '@/lib/v2/guests';
import { v2ErrorResponse } from '@/lib/v2/http';
import { signForkToken } from '@/lib/v2/tokens';
import { resolveForkViewer } from '@/lib/v2/viewer';

/**
 * GET /api/v2/forks/[code] — current fork state for whoever holds the link.
 * Link-bearer semantics (Phase 4, the public Fork Link surface): knowing the
 * unguessable ~49-bit code IS the capability, matching how fork links travel
 * through a group chat. No account required; ballots stay private either way
 * (serializeFork exposes aggregates plus the viewer's own rankings only).
 *
 * Open vote forks come with a signed fork token — required on guest ballots,
 * binding them to this fork and its lifespan (tokens.ts). Reads settle
 * overdue forks (lazy timer close).
 */

/** Scan brake: generous for humans on a fork page, hostile to enumeration. */
const GET_LIMIT_PER_IP_PER_MIN = 60;

/** Tokens outlive the fork slightly so a ballot in flight at close isn't
 * rejected for the wrong reason (the closed fork already rejects it). */
const TOKEN_GRACE_MS = 2 * 60 * 1000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const rate = await checkRateLimit({
      key: ipRateLimitKey('v2-fork-get', request),
      limit: GET_LIMIT_PER_IP_PER_MIN,
      windowMs: 60_000,
    });
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

    const viewer = await resolveForkViewer(
      request.cookies.get(GUEST_COOKIE)?.value
    );

    const fork = await getSettledForkByCode(code);
    if (!fork) {
      return NextResponse.json({ error: 'Fork not found' }, { status: 404 });
    }

    const openForVotes = fork.status === 'open' && fork.mode === 'vote';
    return NextResponse.json({
      fork: serializeFork(fork, viewer.participant, viewer.claimedGuestIds),
      viewer: {
        kind: viewer.kind,
        displayName: viewer.participant?.displayName ?? null,
      },
      forkToken: openForVotes
        ? signForkToken(
            fork.code,
            new Date(fork.closesAt.getTime() + TOKEN_GRACE_MS)
          )
        : null,
    });
  } catch (error) {
    return v2ErrorResponse('forks:get', error);
  }
}
