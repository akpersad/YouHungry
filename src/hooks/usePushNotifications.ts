'use client';

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
        console.error('Failed to subscribe to push notifications:', error);
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
      console.error('Failed to unsubscribe from push notifications:', error);
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
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }, []);

  return {
    status,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification,
    refresh: checkStatus,
  };
}
