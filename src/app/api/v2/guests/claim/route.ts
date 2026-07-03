import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  rateLimitResponse,
  userRateLimitKey,
} from '@/lib/rate-limit';
import { requireV2User } from '@/lib/v2/auth';
import { V2DomainError } from '@/lib/v2/errors';
import { GUEST_COOKIE, claimGuest } from '@/lib/v2/guests';
import { v2ErrorResponse } from '@/lib/v2/http';
import { verifyGuestCookie } from '@/lib/v2/tokens';

/**
 * POST /api/v2/guests/claim — "Claim your votes". Binds the browser's guest
 * identity (signed cookie) to the signed-in account: past guest forks start
 * feeding the account's decay history and viewer identity (forks.ts claim
 * pointer). The guest doc keeps its guestId — history is followed, never
 * rewritten — and a guest already claimed by another account is refused
 * (409): identities are never transferred.
 *
 * No body: the cookie IS the proof of who is claiming. A request without a
 * valid signed cookie has nothing to claim.
 */

const CLAIMS_PER_USER_PER_MIN = 10;

export async function POST(request: NextRequest) {
  try {
    const user = await requireV2User();

    const rate = await checkRateLimit({
      key: userRateLimitKey('v2-guest-claim', user._id.toString()),
      limit: CLAIMS_PER_USER_PER_MIN,
      windowMs: 60_000,
    });
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

    const cookieValue = request.cookies.get(GUEST_COOKIE)?.value;
    const guestId = cookieValue ? verifyGuestCookie(cookieValue) : null;
    if (!guestId) {
      throw new V2DomainError('No guest votes to claim in this browser', 404);
    }

    const guest = await claimGuest(guestId, user._id);
    return NextResponse.json({
      claimed: true,
      guestDisplayName: guest.displayName,
    });
  } catch (error) {
    return v2ErrorResponse('guests:claim', error);
  }
}
