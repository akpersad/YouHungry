import { NextRequest, NextResponse } from 'next/server';
import { addPushSubscription, removePushSubscription } from '@/lib/v2/account';
import { requireV2User } from '@/lib/v2/auth';
import { v2ErrorResponse } from '@/lib/v2/http';
import {
  pushSubscriptionSchema,
  removePushSubscriptionSchema,
} from '@/lib/v2/validation';

/**
 * This browser's web-push registration. POST stores the subscription the
 * page just created (idempotent per endpoint); DELETE forgets it after the
 * page unsubscribes locally. Dead endpoints also self-prune at send time
 * (notifications.ts), so a missed DELETE only lingers until the next fork
 * closes.
 */

export async function POST(request: NextRequest) {
  try {
    const user = await requireV2User();
    const subscription = pushSubscriptionSchema.parse(await request.json());
    await addPushSubscription(user._id, subscription);
    return NextResponse.json({ registered: true }, { status: 201 });
  } catch (error) {
    return v2ErrorResponse('account:push-subscribe', error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireV2User();
    const input = removePushSubscriptionSchema.parse(await request.json());
    await removePushSubscription(user._id, input.endpoint);
    return NextResponse.json({ removed: true });
  } catch (error) {
    return v2ErrorResponse('account:push-unsubscribe', error);
  }
}
