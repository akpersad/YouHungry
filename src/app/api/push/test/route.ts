import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db';
import { pushService } from '@/lib/push-service';
import { logger } from '@/lib/logger';
import type { PushSubscription } from '@/types/database';

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectToDatabase();

    // Find user by Clerk ID
    const user = await db.collection('users').findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's push subscriptions
    const subscriptions = (user.pushSubscriptions || []) as PushSubscription[];

    logger.debug('User subscriptions in database', {
      count: subscriptions.length,
      endpoints: subscriptions.map((s) => s.endpoint.substring(0, 60) + '...'),
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No push subscriptions found' },
        { status: 404 }
      );
    }

    // Send test notification to all subscriptions and collect results
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        pushService.sendNotification(sub, {
          title: 'Fork In The Road Test',
          body: 'This is a test notification from your PWA! 🎉',
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-72x72.svg',
          tag: 'test-notification',
          requireInteraction: false,
          data: {
            type: 'test',
            url: '/',
          },
        })
      )
    );

    // Find expired subscriptions to remove
    const expiredEndpoints: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value === 'expired') {
        expiredEndpoints.push(subscriptions[index].endpoint);
      }
    });

    // Remove expired subscriptions from database
    if (expiredEndpoints.length > 0) {
      logger.info('Removing expired push subscriptions', {
        count: expiredEndpoints.length,
        endpoints: expiredEndpoints.map((e) => e.substring(0, 50) + '...'),
      });

      await db.collection('users').updateOne(
        { clerkId: userId },
        {
          $pull: {
            pushSubscriptions: {
              endpoint: { $in: expiredEndpoints },
            },
          },
        }
      );
    }

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value === true
    ).length;

    logger.info('Test push notifications sent', {
      userId,
      total: subscriptions.length,
      successful,
      expired: expiredEndpoints.length,
    });

    return NextResponse.json({
      success: true,
      message: `Test notification sent to ${successful} of ${subscriptions.length} subscriptions${expiredEndpoints.length > 0 ? ` (${expiredEndpoints.length} expired subscriptions removed)` : ''}`,
      sent: successful,
      total: subscriptions.length,
      removed: expiredEndpoints.length,
    });
  } catch (error) {
    logger.error('Failed to send test push notification', { error });
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}
