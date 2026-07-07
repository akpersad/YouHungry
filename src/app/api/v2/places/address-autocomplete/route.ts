import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  rateLimitResponse,
  userRateLimitKey,
} from '@/lib/rate-limit';
import { requireV2User } from '@/lib/v2/auth';
import { fetchAddressSuggestions } from '@/lib/v2/google-places';
import { v2ErrorResponse } from '@/lib/v2/http';
import { addressSuggestQuerySchema } from '@/lib/v2/validation';

/**
 * GET /api/v2/places/address-autocomplete?q=[&session=] — the home-base
 * type-ahead (authed). Server-side proxy so the Google key never reaches
 * the client; the optional session token groups a typing burst with the
 * pick's details call for session billing. Behind the billing gate:
 * dev/CI answer [] and the input degrades to plain typing.
 *
 * Rate limited a bit above the debounced typing rate — the debounce
 * (350ms) does the real throttling; this is the abuse bound.
 */

const LOOKUPS_PER_USER_PER_MIN = 40;

export async function GET(request: NextRequest) {
  try {
    const user = await requireV2User();

    const rate = await checkRateLimit({
      key: userRateLimitKey('v2-addr-suggest', user._id.toString()),
      limit: LOOKUPS_PER_USER_PER_MIN,
      windowMs: 60_000,
    });
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

    const searchParams = request.nextUrl.searchParams;
    const input = addressSuggestQuerySchema.parse({
      q: searchParams.get('q') ?? '',
      session: searchParams.get('session') ?? undefined,
    });

    const suggestions = await fetchAddressSuggestions(input.q, input.session);
    return NextResponse.json({ suggestions });
  } catch (error) {
    return v2ErrorResponse('places:address-autocomplete', error);
  }
}
