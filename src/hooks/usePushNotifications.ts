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
      const success = await pushNotifications.unsubscribe();
      await checkStatus();
      return success;
    } catch (error) {
      logger.error('Failed to unsubscribe from push notifications:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [checkStatus]);

  // Send test notification
  const sendTestNotification = useCallback(async (): Promise<void> => {
    try {
      await pushNotifications.sendTestNotification();
    } catch (error) {
      logger.error('Failed to send test notification:', error);
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
    sendGroupDecisionNotification,
    sendFriendRequestNotification,
    sendGroupInvitationNotification,
    sendDecisionResultNotification,
    refresh: checkStatus,
  };
}
