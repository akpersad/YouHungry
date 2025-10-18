'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback } from 'react';
import {
  pushNotifications,
  PushSubscriptionData,
} from '@/lib/push-notifications';

export interface PushNotificationStatus {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  isIOS: boolean;
  hasIOSSupport: boolean;
}

export function usePushNotifications() {
  const [status, setStatus] = useState<PushNotificationStatus>({
    supported: false,
    permission: 'default',
    subscribed: false,
    isIOS: false,
    hasIOSSupport: false,
  });

  const [loading, setLoading] = useState(false);

  // Check initial status
  const checkStatus = useCallback(async () => {
    const capabilities = pushNotifications.getCapabilities();
    const subscribed = await pushNotifications.isSubscribed();

    setStatus({
      supported: capabilities.supported,
      permission: capabilities.permission,
      subscribed,
      isIOS: capabilities.isIOS,
      hasIOSSupport: capabilities.hasIOSPushSupport,
    });
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Request permission and subscribe
  const subscribe =
    useCallback(async (): Promise<PushSubscriptionData | null> => {
      setLoading(true);
      try {
        const subscription = await pushNotifications.subscribe();

        // Save subscription to server
        if (subscription) {
          const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription }),
          });

          if (!response.ok) {
            logger.warn('Failed to save subscription to server');
          }
        }

        await checkStatus();
        return subscription;
      } catch (error) {
        logger.error('Failed to subscribe to push notifications:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    }, [checkStatus]);

  // Unsubscribe
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      // Get current subscription to get endpoint
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      const success = await pushNotifications.unsubscribe();

      // Remove subscription from server
      if (success && subscription) {
        const response = await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        if (!response.ok) {
          logger.warn('Failed to remove subscription from server');
        }
      }

      await checkStatus();
      return success;
    } catch (error) {
      logger.error('Failed to unsubscribe from push notifications:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [checkStatus]);

  // Send test notification (client-side)
  const sendTestNotification = useCallback(async (): Promise<void> => {
    try {
      await pushNotifications.sendTestNotification();
    } catch (error) {
      logger.error('Failed to send test notification:', error);
      throw error;
    }
  }, []);

  // Send test notification from server (real push notification)
  const sendServerTestNotification = useCallback(async (): Promise<void> => {
    try {
      // First, log the current subscription
      const registration = await navigator.serviceWorker.ready;
      const currentSubscription =
        await registration.pushManager.getSubscription();

      if (currentSubscription) {
        logger.debug('Current browser subscription', {
          endpoint: currentSubscription.endpoint.substring(0, 60) + '...',
        });
      } else {
        logger.warn('No current browser subscription found!');
      }

      const response = await fetch('/api/push/test', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to send server test notification');
      }

      const data = await response.json();
      logger.info('Server test notification sent', data);
    } catch (error) {
      logger.error('Failed to send server test notification:', error);
      throw error;
    }
  }, []);

  // Send group decision notification
  const sendGroupDecisionNotification = useCallback(
    async (
      groupName: string,
      decisionType: 'tiered' | 'random',
      deadline: Date
    ): Promise<void> => {
      try {
        await pushNotifications.sendGroupDecisionNotification(
          groupName,
          decisionType,
          deadline
        );
      } catch (error) {
        logger.error('Failed to send group decision notification:', error);
        throw error;
      }
    },
    []
  );

  // Send friend request notification
  const sendFriendRequestNotification = useCallback(
    async (requesterName: string): Promise<void> => {
      try {
        await pushNotifications.sendFriendRequestNotification(requesterName);
      } catch (error) {
        logger.error('Failed to send friend request notification:', error);
        throw error;
      }
    },
    []
  );

  // Send group invitation notification
  const sendGroupInvitationNotification = useCallback(
    async (groupName: string, inviterName: string): Promise<void> => {
      try {
        await pushNotifications.sendGroupInvitationNotification(
          groupName,
          inviterName
        );
      } catch (error) {
        logger.error('Failed to send group invitation notification:', error);
        throw error;
      }
    },
    []
  );

  // Send decision result notification
  const sendDecisionResultNotification = useCallback(
    async (groupName: string, restaurantName: string): Promise<void> => {
      try {
        await pushNotifications.sendDecisionResultNotification(
          groupName,
          restaurantName
        );
      } catch (error) {
        logger.error('Failed to send decision result notification:', error);
        throw error;
      }
    },
    []
  );

  return {
    status,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification,
    sendServerTestNotification,
    sendGroupDecisionNotification,
    sendFriendRequestNotification,
    sendGroupInvitationNotification,
    sendDecisionResultNotification,
    refresh: checkStatus,
  };
}
