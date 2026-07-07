import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  rateLimitResponse,
  userRateLimitKey,
} from '@/lib/rate-limit';
import { requireV2User } from '@/lib/v2/auth';
import { v2ErrorResponse } from '@/lib/v2/http';
import { joinListByToken } from '@/lib/v2/lists';
import { joinListSchema } from '@/lib/v2/validation';

/**
 * POST /api/v2/lists/join — accept a shared-list invite. The signed token
 * is the authorization; the session is the identity. Idempotent: joining
 * a list you are already on (or own) is success.
 */

const JOINS_PER_USER_PER_MIN = 10;

export async function POST(request: NextRequest) {
  try {
    const user = await requireV2User();

    const rate = await checkRateLimit({
      key: userRateLimitKey('v2-list-join', user._id.toString()),
      limit: JOINS_PER_USER_PER_MIN,
      windowMs: 60_000,
    });
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

    const input = joinListSchema.parse(await request.json());
    const list = await joinListByToken(user._id, input.token);
    return NextResponse.json({
      list: { id: list._id.toString(), name: list.name },
    });
  } catch (error) {
    return v2ErrorResponse('lists:join', error);
  }
}
