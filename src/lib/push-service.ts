import webpush from 'web-push';
import { logger } from '@/lib/logger';

// Push Service - Server-side push notification sending
// Uses web-push library to send notifications to subscribed clients

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
}

class PushService {
  private static instance: PushService;
  private initialized = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): PushService {
    if (!PushService.instance) {
      PushService.instance = new PushService();
    }
    return PushService.instance;
  }

  private initialize() {
    if (this.initialized) return;

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject =
      process.env.VAPID_SUBJECT || 'mailto:noreply@forkintheroad.app';

    if (!vapidPublicKey || !vapidPrivateKey) {
      logger.warn(
        'VAPID keys not configured. Push notifications will not work.'
      );
      logger.warn('Generate keys with: npx web-push generate-vapid-keys');
      return;
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    this.initialized = true;
    logger.info('Push notification service initialized');
  }

  /**
   * Send a push notification to a single subscription
   */
  async sendNotification(
    subscription: PushSubscription,
    payload: NotificationPayload
  ): Promise<boolean | 'expired'> {
    if (!this.initialized) {
      logger.error('Push service not initialized. Check VAPID configuration.');
      return false;
    }

    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      };

      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload),
        {
          TTL: 60 * 60 * 24, // 24 hours
        }
      );

      logger.debug('Push notification sent successfully', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
      });

      return true;
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const statusCode = (error as { statusCode: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          // Subscription is no longer valid - mark for removal
          logger.warn('Push subscription expired, should be removed', {
            endpoint: subscription.endpoint.substring(0, 50) + '...',
          });
          return 'expired';
        }
      }
      logger.error('Failed to send push notification', { error });
      return false;
    }
  }

  /**
   * Send notifications to multiple subscriptions
   */
  async sendNotificationToMany(
    subscriptions: PushSubscription[],
    payload: NotificationPayload
  ): Promise<{ sent: number; failed: number }> {
    const results = await Promise.allSettled(
      subscriptions.map((sub) => this.sendNotification(sub, payload))
    );

    const sent = results.filter(
      (r) => r.status === 'fulfilled' && r.value
    ).length;
    const failed = results.length - sent;

    logger.info('Batch push notifications sent', {
      sent,
      failed,
      total: results.length,
    });

    return { sent, failed };
  }

  /**
   * Send group decision notification
   */
  async sendGroupDecisionNotification(
    subscriptions: PushSubscription[],
    groupName: string,
    decisionType: 'tiered' | 'random',
    deadline: Date,
    collectionUrl?: string
  ): Promise<{ sent: number; failed: number }> {
    logger.info('📬 Push Service: Preparing group decision notification', {
      groupName,
      decisionType,
      subscriptionCount: subscriptions.length,
      endpoints: subscriptions.map((s) => s.endpoint.substring(0, 50) + '...'),
    });

    const message =
      decisionType === 'tiered'
        ? `${groupName} has started a group decision! Cast your vote by ${deadline.toLocaleDateString()}.`
        : `${groupName} has started a random selection! The decision will be made at ${deadline.toLocaleDateString()}.`;

    const payload: NotificationPayload = {
      title: `${groupName} Decision Started`,
      body: message,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      tag: `group-decision-${groupName}`,
      requireInteraction: true,
      data: {
        type: 'group_decision',
        groupName,
        decisionType,
        deadline: deadline.toISOString(),
        url: collectionUrl ? `${collectionUrl}?tab=decisions` : '/groups',
      },
      actions: [
        {
          action: 'view',
          title: 'View Decision',
        },
      ],
    };

    return this.sendNotificationToMany(subscriptions, payload);
  }

  /**
   * Send friend request notification
   */
  async sendFriendRequestNotification(
    subscription: PushSubscription,
    requesterName: string
  ): Promise<boolean | 'expired'> {
    const payload: NotificationPayload = {
      title: 'New Friend Request',
      body: `${requesterName} sent you a friend request!`,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      tag: `friend-request-${requesterName}`,
      requireInteraction: true,
      data: {
        type: 'friend_request',
        requesterName,
        url: '/friends',
      },
      actions: [
        {
          action: 'view',
          title: 'View Request',
        },
      ],
    };

    return this.sendNotification(subscription, payload);
  }

  /**
   * Send group invitation notification
   */
  async sendGroupInvitationNotification(
    subscription: PushSubscription,
    groupName: string,
    inviterName: string
  ): Promise<boolean | 'expired'> {
    const payload: NotificationPayload = {
      title: 'Group Invitation',
      body: `${inviterName} invited you to join "${groupName}"!`,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      tag: `group-invitation-${groupName}`,
      requireInteraction: true,
      data: {
        type: 'group_invitation',
        groupName,
        inviterName,
        url: '/groups',
      },
      actions: [
        {
          action: 'view',
          title: 'View Invitation',
        },
      ],
    };

    return this.sendNotification(subscription, payload);
  }

  /**
   * Send decision result notification
   */
  async sendDecisionResultNotification(
    subscriptions: PushSubscription[],
    groupName: string,
    restaurantName: string
  ): Promise<{ sent: number; failed: number }> {
    const payload: NotificationPayload = {
      title: `${groupName} Decision Complete`,
      body: `The group has decided on ${restaurantName}!`,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      tag: `decision-result-${groupName}`,
      requireInteraction: true,
      data: {
        type: 'decision_result',
        groupName,
        restaurantName,
        url: '/groups',
      },
      actions: [
        {
          action: 'view',
          title: 'View Result',
        },
      ],
    };

    return this.sendNotificationToMany(subscriptions, payload);
  }
}

// Export singleton instance
export const pushService = PushService.getInstance();
