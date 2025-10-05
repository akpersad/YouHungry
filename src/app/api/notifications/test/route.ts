import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notification-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, options } = body;

    switch (type) {
      case 'group-decision':
        await notificationService.sendGroupDecisionNotification(data, options);
        break;
      case 'friend-request':
        await notificationService.sendFriendRequestNotification(data, options);
        break;
      case 'group-invitation':
        await notificationService.sendGroupInvitationNotification(
          data,
          options
        );
        break;
      case 'decision-result':
        await notificationService.sendDecisionResultNotification(data, options);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to send test notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
