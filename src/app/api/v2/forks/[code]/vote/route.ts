import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  ipRateLimitKey,
  rateLimitResponse,
} from '@/lib/rate-limit';
import { getV2User, participantFromUser } from '@/lib/v2/auth';
import { V2DomainError } from '@/lib/v2/errors';
import { serializeFork, submitVote } from '@/lib/v2/forks';
import { enrichForkView } from '@/lib/v2/places';
import {
  GUEST_COOKIE,
  GUEST_COOKIE_OPTIONS,
  createGuest,
  findGuestByCookie,
  getClaimedGuestIds,
  participantFromGuest,
  touchGuest,
} from '@/lib/v2/guests';
import { v2ErrorResponse } from '@/lib/v2/http';
import { verifyForkToken } from '@/lib/v2/tokens';
import { guestVoteSchema, voteSchema } from '@/lib/v2/validation';
import type { GuestDoc, Participant } from '@/lib/v2/schema';

/**
 * POST /api/v2/forks/[code]/vote — cast or replace a ranked ballot.
 *
 * Two identities, one ballot box:
 * - **Signed-in** — the Clerk session is the identity; ballots the user cast
 *   as a since-claimed guest are replaced, not duplicated (claim
 *   continuity, forks.ts).
 * - **Guest** (Phase 4's audited unauthenticated write) — layered checks,
 *   cheapest first: the signed fork token (binds ballot → this fork + its
 *   lifespan; forged/expired/cross-fork tokens die before any DB read),
 *   per-IP and per-fork rate limits, then the signed guest cookie. A first
 *   vote mints the guest identity (name required, no PII) and sets the
 *   cookie; revotes ride the cookie. The MAX_BALLOTS cap is enforced
 *   atomically in the lib.
 *
 * Reaching quorum closes the fork in the same request, so the response may
 * already carry the result.
 */

/** A human revotes a few times; a stuffer needs hundreds. */
const GUEST_VOTES_PER_IP_PER_MIN = 12;

/** Whole-fork brake: bounds distributed stuffing regardless of IP spread. */
const GUEST_VOTES_PER_FORK_PER_MIN = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();

    const user = await getV2User();
    if (user) {
      const input = voteSchema.parse(body);
      const voter = participantFromUser(user);
      const claimedGuestIds = await getClaimedGuestIds(user._id);
      const fork = await submitVote(
        code,
        voter,
        input.rankings.map((id) => new ObjectId(id)),
        { claimedGuestIds }
      );
      return NextResponse.json({
        fork: await enrichForkView(serializeFork(fork, voter, claimedGuestIds)),
      });
    }

    // ------------------------------------------------------------------
    // Guest path
    // ------------------------------------------------------------------
    const input = guestVoteSchema.parse(body);

    // Token first: rejects forged/expired/cross-fork ballots before any
    // database work. Issued alongside the fork view (GET / page render).
    if (!verifyForkToken(input.forkToken, code)) {
      throw new V2DomainError(
        'This voting link went stale. Refresh the page and try again.',
        403
      );
    }

    const ipRate = await checkRateLimit({
      key: ipRateLimitKey('v2-guest-vote', request),
      limit: GUEST_VOTES_PER_IP_PER_MIN,
      windowMs: 60_000,
    });
    if (!ipRate.allowed) return rateLimitResponse(ipRate.retryAfterSeconds);

    const forkRate = await checkRateLimit({
      key: `v2-guest-vote:fork:${code}`,
      limit: GUEST_VOTES_PER_FORK_PER_MIN,
      windowMs: 60_000,
    });
    if (!forkRate.allowed) return rateLimitResponse(forkRate.retryAfterSeconds);

    let guest: GuestDoc | null = await findGuestByCookie(
      request.cookies.get(GUEST_COOKIE)?.value
    );
    let cookieToSet: string | null = null;
    if (guest) {
      if (input.displayName && input.displayName !== guest.displayName) {
        guest = (await touchGuest(guest.guestId, input.displayName)) ?? guest;
      }
    } else {
      if (!input.displayName) {
        throw new V2DomainError('Pick a name so the group knows who voted');
      }
      const minted = await createGuest(input.displayName);
      guest = minted.guest;
      cookieToSet = minted.cookieValue;
    }

    const voter: Participant = participantFromGuest(guest);
    const fork = await submitVote(
      code,
      voter,
      input.rankings.map((id) => new ObjectId(id))
    );

    const response = NextResponse.json({
      fork: await enrichForkView(serializeFork(fork, voter)),
      viewer: { kind: 'guest', displayName: voter.displayName },
    });
    if (cookieToSet) {
      response.cookies.set(GUEST_COOKIE, cookieToSet, GUEST_COOKIE_OPTIONS);
    }
    return response;
  } catch (error) {
    return v2ErrorResponse('forks:vote', error);
  }
}
