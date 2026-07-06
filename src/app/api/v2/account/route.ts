import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  rateLimitResponse,
  userRateLimitKey,
} from '@/lib/rate-limit';
import { setFirstName, syncAccountFromClerk } from '@/lib/v2/account';
import { requireV2User } from '@/lib/v2/auth';
import { v2ErrorResponse } from '@/lib/v2/http';
import { updateAccountSchema } from '@/lib/v2/validation';

/**
 * PATCH /api/v2/account — profile writes. With a firstName it renames via
 * Clerk (identity source of truth) and mirrors into Mongo; with an empty
 * body it just re-mirrors Clerk's current email/name — the client calls it
 * that way right after the in-browser email-change flow completes, so the
 * account page never waits on webhook delivery.
 *
 * Rate limited: every call hits the Clerk API.
 */

const WRITES_PER_USER_PER_MIN = 10;

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireV2User();

    const rate = await checkRateLimit({
      key: userRateLimitKey('v2-account', user._id.toString()),
      limit: WRITES_PER_USER_PER_MIN,
      windowMs: 60_000,
    });
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

    const input = updateAccountSchema.parse(await request.json());
    const account = input.firstName
      ? await setFirstName(user, input.firstName)
      : await syncAccountFromClerk(user);
    return NextResponse.json({ account });
  } catch (error) {
    return v2ErrorResponse('account:update', error);
  }
}
