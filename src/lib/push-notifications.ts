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
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
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
    return /iPhone|iPad|iPod/.test(navigator.userAgent);
  }

  /**
   * Check if iOS has push support (iOS 16.4+)
   */
  hasIOSPushSupport(): boolean {
    if (!this.isIOS()) return false;

    // Check iOS version
    const match = navigator.userAgent.match(/OS (\d+)_/);
    if (!match) return false;

    const majorVersion = parseInt(match[1], 10);
    return majorVersion >= 16;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    if (this.isIOS() && !this.hasIOSPushSupport()) {
      throw new Error('Push notifications require iOS 16.4 or later');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscriptionData | null> {
    try {
      // First, request permission
      const permission = await this.requestPermission();

      if (permission !== 'granted') {
        logger.debug('Push notification permission denied');
        return null;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Subscribe to push notifications
        // Note: You'll need to generate VAPID keys for production
        // For now, we'll use the userVisibleOnly option
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          // applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY' // Add this for production
        });
      }

      // Convert subscription to a format we can store
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')),
        },
      };

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

    await registration.showNotification('You Hungry? Test', {
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
   * Get notification capabilities info
   */
  getCapabilities() {
    return {
      supported: this.isSupported(),
      permission: this.getPermissionStatus(),
      isIOS: this.isIOS(),
      hasIOSPushSupport: this.hasIOSPushSupport(),
      serviceWorkerReady: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notifications: 'Notification' in window,
    };
  }
}

// Export singleton instance
export const pushNotifications = PushNotificationManager.getInstance();
