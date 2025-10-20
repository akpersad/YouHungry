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
    // Only check on client side
    if (typeof window === 'undefined') {
      return;
    }

    console.log('🔍 HOOK DEBUG: Starting checkStatus');

    // Use real-time detection instead of the potentially stale capabilities
    const realTimeCapabilities = {
      supported: (() => {
        if (typeof window === 'undefined' || typeof navigator === 'undefined')
          return false;
        if (!window.isSecureContext) return false;
        return (
          'serviceWorker' in navigator &&
          'PushManager' in window &&
          'Notification' in window
        );
      })(),
      permission: (() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          return Notification.permission;
        }
        return 'default' as NotificationPermission;
      })(),
      isIOS: (() => {
        if (typeof navigator === 'undefined') return false;
        return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
      })(),
      hasIOSPushSupport: (() => {
        if (typeof navigator === 'undefined') return false;
        const isIOS = /iphone|ipad|ipod/.test(
          navigator.userAgent.toLowerCase()
        );
        if (!isIOS) return false;
        if (typeof window === 'undefined') return false;
        return (
          'serviceWorker' in navigator &&
          'PushManager' in window &&
          'Notification' in window &&
          window.isSecureContext
        );
      })(),
    };

    const subscribed = await pushNotifications.isSubscribed();

    const newStatus = {
      supported: realTimeCapabilities.supported,
      permission: realTimeCapabilities.permission,
      subscribed,
      isIOS: realTimeCapabilities.isIOS,
      hasIOSSupport: realTimeCapabilities.hasIOSPushSupport,
    };

    console.log(
      '🔍 HOOK DEBUG: Setting status to:',
      JSON.stringify(newStatus, null, 2)
    );

    // Force a re-render by using a callback
    setStatus((prevStatus) => {
      console.log(
        '🔍 HOOK DEBUG: Previous status was:',
        JSON.stringify(prevStatus, null, 2)
      );
      console.log(
        '🔍 HOOK DEBUG: New status will be:',
        JSON.stringify(newStatus, null, 2)
      );
      return newStatus;
    });
  }, []);

  useEffect(() => {
    // Wait for service worker to be ready before checking status
    const initializeStatus = async () => {
      try {
        // Wait for service worker to be ready
        if ('serviceWorker' in navigator) {
          console.log('🔍 Waiting for service worker to be ready...');

          // Check if service worker is already registered
          const registration = await navigator.serviceWorker.getRegistration();
          if (!registration) {
            console.log(
              '🔧 No service worker found, attempting to register...'
            );
            try {
              await navigator.serviceWorker.register('/sw.js', { scope: '/' });
              console.log('✅ Service worker registered successfully');
            } catch (regError) {
              console.error('❌ Failed to register service worker:', regError);
            }
          }

          await navigator.serviceWorker.ready;
          console.log('🔍 Service worker is ready!');
        }

        // Now check status
        await checkStatus();
      } catch (error) {
        console.error(
          '🔍 Failed to initialize push notification status:',
          error
        );
        // Fallback: try without waiting for service worker
        await checkStatus();
      }
    };

    initializeStatus();
  }, [checkStatus]);

  // Request permission and subscribe
  const subscribe =
    useCallback(async (): Promise<PushSubscriptionData | null> => {
      setLoading(true);
      try {
        // Wait for service worker to be ready first
        if ('serviceWorker' in navigator) {
          console.log('🔍 Waiting for service worker before subscribing...');
          await navigator.serviceWorker.ready;
          console.log('🔍 Service worker ready, proceeding with subscription');
        }

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
