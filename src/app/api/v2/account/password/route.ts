import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  checkRateLimit,
  rateLimitResponse,
  userRateLimitKey,
} from '@/lib/rate-limit';
import { changePassword } from '@/lib/v2/account';
import { requireV2User } from '@/lib/v2/auth';
import { v2ErrorResponse } from '@/lib/v2/http';
import { changePasswordSchema } from '@/lib/v2/validation';

/**
 * POST /api/v2/account/password — verify the current password with Clerk,
 * set the new one, revoke every other session. The tight limit is the
 * brake on using this endpoint to guess the current password.
 */

const ATTEMPTS_PER_USER_PER_MIN = 5;

export async function POST(request: NextRequest) {
  try {
    const user = await requireV2User();

    const rate = await checkRateLimit({
      key: userRateLimitKey('v2-account-password', user._id.toString()),
      limit: ATTEMPTS_PER_USER_PER_MIN,
      windowMs: 60_000,
    });
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

    const input = changePasswordSchema.parse(await request.json());
    const { sessionId } = await auth();
    await changePassword(user, {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      currentSessionId: sessionId,
    });
    return NextResponse.json({ changed: true });
  } catch (error) {
    return v2ErrorResponse('account:password', error);
  }
}
