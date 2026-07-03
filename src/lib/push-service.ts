import webpush from 'web-push';
import { logger } from '@/lib/logger';
import {
  isExternalSendAllowed,
  warnSuppressed,
} from '@/lib/notification-suppression';

/**
 * Server-side web push, slimmed at the Phase 7 cutover to the one thing
 * v2 sends: a fork-result notification (lib/v2/notifications.ts). Sends
 * gate on the suppression seam, so dev/CI/tests never reach a provider.
 */

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
   * Send a push notification to a single subscription.
   * Returns 'expired' when the endpoint is dead and should be pruned.
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
      if (!isExternalSendAllowed()) {
        warnSuppressed('push', {
          endpoint: subscription.endpoint.substring(0, 50) + '...',
        });
        return true;
      }

      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        },
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
}

export const pushService = PushService.getInstance();
