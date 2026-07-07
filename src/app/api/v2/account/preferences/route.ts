import { NextRequest, NextResponse } from 'next/server';
import { setNotificationSettings } from '@/lib/v2/account';
import { requireV2User } from '@/lib/v2/auth';
import { v2ErrorResponse } from '@/lib/v2/http';
import { notificationSettingsSchema } from '@/lib/v2/validation';

/**
 * PATCH /api/v2/account/preferences — the two channel switches for the one
 * notification v2 sends ("We're going here.", notifications.ts). Partial:
 * only the provided flags change.
 */

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireV2User();
    const input = notificationSettingsSchema.parse(await request.json());
    const notifications = await setNotificationSettings(user._id, input);
    return NextResponse.json({ notifications });
  } catch (error) {
    return v2ErrorResponse('account:preferences', error);
  }
}
