import { logger } from '@/lib/logger';

// Push Notifications Manager
// Handles push notification subscriptions and sending

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationManager {
  private static instance: PushNotificationManager;

  private constructor() {}

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  /**
   * Check if push notifications are supported
   * Note: This checks browser capability, not device eligibility
   * Push notifications work on iOS 16.4+ in Safari
   */
  isSupported(): boolean {
    // Ensure we're on the client side
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    // Check if we're in a secure context (required for push notifications)
    if (!window.isSecureContext) {
      logger.debug('Not in secure context - push notifications not supported');
      return false;
    }

    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotification = 'Notification' in window;

    logger.debug('Push notification API availability:', {
      hasServiceWorker,
      hasPushManager,
      hasNotification,
      isSecureContext: window.isSecureContext,
      userAgent: navigator.userAgent,
    });

    return hasServiceWorker && hasPushManager && hasNotification;
  }

  /**
   * Check current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  }

  /**
   * Check if on iOS
   */
  isIOS(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);

    const debugInfo = {
      userAgent: navigator.userAgent,
      userAgentLower: userAgent,
      isIOS,
    };

    logger.debug('iOS detection:', debugInfo);
    console.log('🔍 iOS detection:', JSON.stringify(debugInfo, null, 2));

    return isIOS;
  }

  /**
   * Check if iOS has push support (iOS 16.4+)
   * Updated to be more robust - if APIs are available, assume support
   */
  hasIOSPushSupport(): boolean {
    const isIOSDevice = this.isIOS();
    const debugInfo = {
      isIOSDevice,
      userAgent: navigator.userAgent,
    };

    logger.debug('hasIOSPushSupport check:', debugInfo);
    console.log(
      '🔍 hasIOSPushSupport check:',
      JSON.stringify(debugInfo, null, 2)
    );

    if (!isIOSDevice) {
      logger.debug('Not an iOS device, returning false');
      console.log('🔍 Not an iOS device, returning false');
      return false;
    }

    // Primary check: If the APIs are available, the device supports it
    // This is more reliable than version detection
    if (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    ) {
      logger.debug('iOS device has push notification APIs available');
      console.log('🔍 iOS device has push notification APIs available');
      return true;
    }

    // Fallback: Check iOS version
    // Try multiple regex patterns for different iOS version formats
    const patterns = [
      /OS (\d+)_/, // Standard iOS format (e.g., "OS 16_4")
      /Version\/(\d+)\./, // Alternative format
      /iPhone OS (\d+)_/, // Older format
    ];

    for (const pattern of patterns) {
      const match = navigator.userAgent.match(pattern);
      if (match) {
        const majorVersion = parseInt(match[1], 10);
        const hasSupport = majorVersion >= 16;
        const versionDebugInfo = {
          version: majorVersion,
          hasSupport,
          userAgent: navigator.userAgent,
        };
        logger.debug('iOS version detected:', versionDebugInfo);
        console.log(
          '🔍 iOS version detected:',
          JSON.stringify(versionDebugInfo, null, 2)
        );
        return hasSupport;
      }
    }

    // If we can't detect version but we're on iOS, log it
    const fallbackDebugInfo = {
      userAgent: navigator.userAgent,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasPushManager: typeof window !== 'undefined' && 'PushManager' in window,
    };
    logger.warn(
      'Could not detect iOS version from userAgent:',
      fallbackDebugInfo
    );
    console.log(
      '🔍 Could not detect iOS version:',
      JSON.stringify(fallbackDebugInfo, null, 2)
    );

    // Default to false if we can't detect version
    return false;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      logger.warn('Push notifications are not supported on this browser');
      throw new Error('Push notifications are not supported');
    }

    // Log iOS detection for debugging
    if (this.isIOS()) {
      const hasIOSSupport = this.hasIOSPushSupport();
      logger.debug('iOS device detected', {
        hasIOSSupport,
        userAgent: navigator.userAgent,
      });

      // Only throw error if APIs are definitively not available
      // Don't throw based on version detection alone
      if (!hasIOSSupport && !this.isSupported()) {
        logger.warn(
          'iOS device does not have push notification APIs available'
        );
        throw new Error(
          'Push notifications are not available on this iOS device. Requires iOS 16.4 or later.'
        );
      }

      // If APIs are available (isSupported() is true), proceed even if version detection failed
      if (hasIOSSupport) {
        logger.info('iOS device is eligible for push notifications');
      } else {
        logger.info(
          'iOS version detection uncertain, but APIs are available - proceeding'
        );
      }
    }

    const permission = await Notification.requestPermission();
    logger.debug('Notification permission result:', permission);
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscriptionData | null> {
    try {
      logger.debug('Starting push notification subscription process');

      // First, request permission
      const permission = await this.requestPermission();

      if (permission !== 'granted') {
        logger.debug('Push notification permission not granted:', permission);
        return null;
      }

      logger.debug(
        'Push notification permission granted, getting service worker...'
      );

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      logger.debug('Service worker ready');

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        logger.debug('Already subscribed to push notifications');
      } else {
        logger.debug('Not subscribed yet, creating new subscription...');

        // Use the VAPID public key directly (from .env.local)
        const vapidPublicKey =
          'BN1bJK60HzLLlEzqNj4D07BHSSOtPGQgw5qjFCzgB_TxBHzulUCWXafHJO7grUDUWlL6jI3F4M1TBqHkjCMGtgI';

        // Subscribe to push notifications with VAPID key
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            vapidPublicKey
          ) as BufferSource,
        });

        logger.debug('Push subscription created successfully');
      }

      // Convert subscription to a format we can store
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')),
        },
      };

      logger.debug('Push subscription data prepared', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
      });

      return subscriptionData;
    } catch (error) {
      logger.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Check if currently subscribed
   */
  async isSubscribed(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch {
      return false;
    }
  }

  /**
   * Send a test notification (client-side only, no server required)
   */
  async sendTestNotification(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported');
    }

    const permission = await this.requestPermission();

    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    // Send a simple notification
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification('Fork In The Road Test', {
      body: 'This is a test notification from your PWA!',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      tag: 'test-notification',
      requireInteraction: false,
    });
  }

  /**
   * Helper to convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Helper to convert URL-safe Base64 string to Uint8Array
   * Required for VAPID applicationServerKey
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Send group decision notification
   */
  async sendGroupDecisionNotification(
    groupName: string,
    decisionType: 'tiered' | 'random',
    deadline: Date
  ): Promise<void> {
    if (!this.isSupported()) {
      logger.warn('Push notifications not supported');
      return;
    }

    const permission = this.getPermissionStatus();
    if (permission !== 'granted') {
      logger.warn('Push notification permission not granted');
      return;
    }

    // const typeText = decisionType === 'tiered' ? 'voting' : 'random selection';
    const message =
      decisionType === 'tiered'
        ? `🍽️ ${groupName} has started a group decision! Cast your vote by ${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString()}.`
        : `🎲 ${groupName} has started a random selection! The decision will be made at ${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString()}.`;

    const notification = new Notification(`${groupName} Decision Started`, {
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
      },
    });

    notification.onclick = () => {
      // Navigate to the group page
      window.focus();
      window.location.href = '/groups';
      notification.close();
    };

    // Auto-close after 10 seconds if not interacted with
    setTimeout(() => {
      notification.close();
    }, 10000);
  }

  /**
   * Send friend request notification
   */
  async sendFriendRequestNotification(requesterName: string): Promise<void> {
    if (!this.isSupported()) {
      logger.warn('Push notifications not supported');
      return;
    }

    const permission = this.getPermissionStatus();
    if (permission !== 'granted') {
      logger.warn('Push notification permission not granted');
      return;
    }

    const notification = new Notification('New Friend Request', {
      body: `${requesterName} sent you a friend request!`,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      tag: `friend-request-${requesterName}`,
      requireInteraction: true,
      data: {
        type: 'friend_request',
        requesterName,
      },
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = '/friends';
      notification.close();
    };

    setTimeout(() => {
      notification.close();
    }, 8000);
  }

  /**
   * Send group invitation notification
   */
  async sendGroupInvitationNotification(
    groupName: string,
    inviterName: string
  ): Promise<void> {
    if (!this.isSupported()) {
      logger.warn('Push notifications not supported');
      return;
    }

    const permission = this.getPermissionStatus();
    if (permission !== 'granted') {
      logger.warn('Push notification permission not granted');
      return;
    }

    const notification = new Notification('Group Invitation', {
      body: `${inviterName} invited you to join "${groupName}"!`,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      tag: `group-invitation-${groupName}`,
      requireInteraction: true,
      data: {
        type: 'group_invitation',
        groupName,
        inviterName,
      },
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = '/groups';
      notification.close();
    };

    setTimeout(() => {
      notification.close();
    }, 8000);
  }

  /**
   * Send decision result notification
   */
  async sendDecisionResultNotification(
    groupName: string,
    restaurantName: string
  ): Promise<void> {
    if (!this.isSupported()) {
      logger.warn('Push notifications not supported');
      return;
    }

    const permission = this.getPermissionStatus();
    if (permission !== 'granted') {
      logger.warn('Push notification permission not granted');
      return;
    }

    const notification = new Notification(`${groupName} Decision Complete`, {
      body: `The group has decided on ${restaurantName}!`,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      tag: `decision-result-${groupName}`,
      requireInteraction: true,
      data: {
        type: 'decision_result',
        groupName,
        restaurantName,
      },
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = '/groups';
      notification.close();
    };

    setTimeout(() => {
      notification.close();
    }, 8000);
  }

  /**
   * Get notification capabilities info
   */
  getCapabilities() {
    const caps = {
      supported: this.isSupported(),
      permission: this.getPermissionStatus(),
      isIOS: this.isIOS(),
      hasIOSPushSupport: this.hasIOSPushSupport(),
      serviceWorkerReady:
        typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
      pushManager: typeof window !== 'undefined' && 'PushManager' in window,
      notifications: typeof window !== 'undefined' && 'Notification' in window,
      isSecureContext: typeof window !== 'undefined' && window.isSecureContext,
    };

    // Log detailed debugging info
    logger.debug('Push notification capabilities:', caps);
    console.log(
      '🔍 DEBUG: Push notification capabilities:',
      JSON.stringify(caps, null, 2)
    );
    console.log('🔍 DEBUG: isSupported() result:', this.isSupported());
    console.log(
      '🔍 DEBUG: window.isSecureContext:',
      typeof window !== 'undefined' ? window.isSecureContext : 'undefined'
    );
    console.log(
      '🔍 DEBUG: navigator.userAgent:',
      typeof navigator !== 'undefined' ? navigator.userAgent : 'undefined'
    );

    // Also log to server for easier debugging
    console.log(
      '🔍 SERVER DEBUG: Final capabilities result:',
      JSON.stringify(caps, null, 2)
    );

    // Send debug info to server
    try {
      fetch('/api/debug/push-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capabilities: caps,
          timestamp: new Date().toISOString(),
          userAgent:
            typeof navigator !== 'undefined'
              ? navigator.userAgent
              : 'undefined',
        }),
      }).catch(() => {
        // Ignore fetch errors
      });
    } catch {
      // Ignore errors
    }

    return caps;
  }
}

// Export singleton instance
export const pushNotifications = PushNotificationManager.getInstance();
