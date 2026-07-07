import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  rateLimitResponse,
  userRateLimitKey,
} from '@/lib/rate-limit';
import { requireV2User } from '@/lib/v2/auth';
import { v2ErrorResponse } from '@/lib/v2/http';
import { createListInvite } from '@/lib/v2/lists';
import { objectIdString } from '@/lib/v2/validation';

/**
 * POST /api/v2/lists/[id]/invite — mint a shared-list invite link
 * (owner-only, enforced in the lib layer). Returns the path; the client
 * prefixes its own origin, exactly like fork-link copying.
 */

const INVITES_PER_USER_PER_MIN = 10;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireV2User();

    const rate = await checkRateLimit({
      key: userRateLimitKey('v2-list-invite', user._id.toString()),
      limit: INVITES_PER_USER_PER_MIN,
      windowMs: 60_000,
    });
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

    const { id } = await params;
    const listId = new ObjectId(objectIdString.parse(id));
    const token = await createListInvite(user._id, listId);
    return NextResponse.json({
      invitePath: `/places/join?token=${encodeURIComponent(token)}`,
    });
  } catch (error) {
    return v2ErrorResponse('lists:invite', error);
  }
}
