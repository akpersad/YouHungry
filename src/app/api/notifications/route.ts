import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { inAppNotifications } from '@/lib/in-app-notifications';
import { connectToDatabase } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    // Ensure database is connected
    await connectToDatabase();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const read = searchParams.get('read');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const filters = {
      userId: user._id,
      type: type as
        | 'group_decision'
        | 'friend_request'
        | 'group_invitation'
        | 'decision_result'
        | 'admin_alert'
        | undefined,
      read: read ? read === 'true' : undefined,
      limit,
      offset,
    };

    const notifications = await inAppNotifications.getNotifications(filters);
    const unreadCount = await inAppNotifications.getUnreadCount(user._id);

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    logger.error('Get notifications API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Ensure database is connected
    await connectToDatabase();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, notificationId } = body;

    if (action === 'mark_read' && notificationId) {
      const success = await inAppNotifications.markAsRead(notificationId);
      return NextResponse.json({ success });
    }

    if (action === 'mark_all_read') {
      const count = await inAppNotifications.markAllAsRead(user._id);
      return NextResponse.json({ success: true, count });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('Notification action API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
