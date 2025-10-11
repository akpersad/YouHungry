'use client';

import { logger } from '@/lib/logger';
import React, { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PushSubscriptionData } from '@/lib/push-notifications';

export default function PushTestPage() {
  const { status, loading, subscribe, unsubscribe, sendTestNotification } =
    usePushNotifications();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleBasicNotification = async () => {
    try {
      // Try basic Notification API (works without service worker)
      if (typeof window === 'undefined' || !('Notification' in window)) {
        throw new Error('Notification API not available');
      }

      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        new Notification('ForkInTheRoad Test', {
          body: 'This is a basic notification (no push/background support)',
          icon: '/icons/icon-192x192.svg',
          tag: 'test-notification',
        });

        setSuccess(
          'Basic notification sent! (Note: This only works while app is open)'
        );
      } else {
        setError('Notification permission denied');
      }
    } catch (err) {
      logger.error('Basic notification error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    }
  };

  const handleSubscribe = async () => {
    setError('');
    setSuccess('');

    try {
      // Check if APIs are available
      if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
        throw new Error(
          'Service Worker API not available - This is a known limitation when testing over HTTP on local network. Will work in production with HTTPS.'
        );
      }

      if (typeof window === 'undefined' || !('PushManager' in window)) {
        throw new Error(
          'Push Manager API not available - Requires HTTPS in production.'
        );
      }

      if (typeof window === 'undefined' || !('Notification' in window)) {
        throw new Error('Notification API not available');
      }

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error('Subscribe timeout - Service worker may not be ready')
            ),
          10000
        )
      );

      const subscribePromise = subscribe();

      const subscription = (await Promise.race([
        subscribePromise,
        timeoutPromise,
      ])) as PushSubscriptionData | null;

      if (subscription) {
        setSuccess('Successfully subscribed to push notifications!');
      } else {
        setError('Failed to subscribe. Permission may have been denied.');
      }
    } catch (err) {
      logger.error('Subscribe error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    }
  };

  const handleUnsubscribe = async () => {
    setError('');
    setSuccess('');
    try {
      const result = await unsubscribe();
      if (result) {
        setSuccess('Successfully unsubscribed from push notifications.');
      } else {
        setError('Failed to unsubscribe.');
      }
    } catch (err) {
      setError(String(err));
    }
  };

  const handleTestNotification = async () => {
    setError('');
    setSuccess('');
    try {
      await sendTestNotification();
      setSuccess('Test notification sent! Check your notifications.');
    } catch (err) {
      setError(String(err));
    }
  };

  const getStatusColor = (value: boolean) => {
    return value ? 'text-success' : 'text-destructive';
  };

  const getPermissionColor = (permission: NotificationPermission) => {
    switch (permission) {
      case 'granted':
        return 'text-success';
      case 'denied':
        return 'text-destructive';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-background rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-text dark:text-white mb-4">
            Push Notifications Test
          </h1>

          {/* Status Section */}
          <div className="mb-6 p-4 bg-surface dark:bg-background rounded-lg">
            <h2 className="font-semibold text-lg mb-3 text-text dark:text-white">
              Status
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-light dark:text-text-light">
                  Supported:
                </span>
                <span
                  className={`font-semibold ${getStatusColor(status.supported)}`}
                >
                  {status.supported ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-light dark:text-text-light">
                  Permission:
                </span>
                <span
                  className={`font-semibold ${getPermissionColor(status.permission)}`}
                >
                  {status.permission.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-light dark:text-text-light">
                  Subscribed:
                </span>
                <span
                  className={`font-semibold ${getStatusColor(status.subscribed)}`}
                >
                  {status.subscribed ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-light dark:text-text-light">
                  iOS Device:
                </span>
                <span
                  className={`font-semibold ${getStatusColor(status.isIOS)}`}
                >
                  {status.isIOS ? '📱 Yes' : '❌ No'}
                </span>
              </div>
              {status.isIOS && (
                <div className="flex justify-between">
                  <span className="text-text-light dark:text-text-light">
                    iOS Push Support:
                  </span>
                  <span
                    className={`font-semibold ${getStatusColor(status.hasIOSSupport)}`}
                  >
                    {status.hasIOSSupport ? '✅ Yes (iOS 16.4+)' : '❌ No'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* iOS Warning */}
          {status.isIOS && !status.hasIOSSupport && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                ⚠️ iOS Limitation
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Push notifications require iOS 16.4 or later. Your device may
                not support push notifications for PWAs.
              </p>
            </div>
          )}

          {/* iOS Requirements */}
          {status.isIOS && status.hasIOSSupport && (
            <div className="mb-6 p-4 bg-success/10 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                ✅ iOS Push Notifications Supported!
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                Your iOS version supports push notifications. Make sure to:
              </p>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 list-disc list-inside">
                <li>✓ App is added to Home Screen (Installed)</li>
                <li>✓ You opened the app from Home Screen (not Safari)</li>
                <li>✓ Grant notification permission when prompted</li>
              </ul>
              <p className="text-xs text-green-700 dark:text-green-300 mt-3">
                Note: iOS notifications have some limitations compared to
                Android (e.g., no action buttons, limited customization).
              </p>
            </div>
          )}

          {/* Debug Info */}
          {mounted && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg text-xs">
              <div className="font-semibold mb-1">Debug Info:</div>
              <div>Subscribed: {status.subscribed ? 'Yes' : 'No'}</div>
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
              <div>Supported: {status.supported ? 'Yes' : 'No'}</div>
              <div>
                Button Disabled: {loading || !status.supported ? 'Yes' : 'No'}
              </div>
              <div>Permission: {status.permission}</div>
              <div className="mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-700">
                <div>
                  SW in navigator:{' '}
                  {'serviceWorker' in navigator ? '✅ Yes' : '❌ No'}
                </div>
                <div>
                  PushManager: {'PushManager' in window ? '✅ Yes' : '❌ No'}
                </div>
                <div>
                  Notification: {'Notification' in window ? '✅ Yes' : '❌ No'}
                </div>
                <div className="mt-1 pt-1 border-t border-yellow-300 dark:border-yellow-600">
                  Display Mode:{' '}
                  {window.matchMedia('(display-mode: standalone)').matches
                    ? '✅ Standalone'
                    : '❌ Browser'}
                </div>
              </div>

              {!('serviceWorker' in navigator) && (
                <div className="mt-2 p-2 bg-primary/10 dark:bg-blue-800 rounded text-blue-900 dark:text-blue-100">
                  <div className="font-semibold text-xs">
                    ℹ️ Local Development Limitation
                  </div>
                  <div className="text-xs mt-1">
                    Service Workers require HTTPS. This will work in production!
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warning if not supported */}
          {!status.supported && mounted && 'Notification' in window && (
            <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900 rounded-lg border border-orange-200 dark:border-orange-700">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                ⚠️ Limited Notification Support
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                Push notifications (background/server-sent) aren&apos;t
                available, but you can test basic notifications below.
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                <strong>iOS Chrome Limitation:</strong> Service Worker and
                PushManager APIs aren&apos;t available.
              </p>
            </div>
          )}

          {!status.supported && mounted && !('Notification' in window) && (
            <div className="mb-4 p-4 bg-destructive/10 dark:bg-destructive/20 rounded-lg border border-destructive dark:border-red-700">
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                ❌ Notifications Not Available
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200">
                Your browser doesn&apos;t support any notification APIs.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 mb-6">
            {/* Show basic notification option if Notification API is available but PushManager isn't */}
            {!status.supported && mounted && 'Notification' in window && (
              <button
                onClick={handleBasicNotification}
                className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 font-medium"
                style={{
                  minHeight: '56px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                🔔 Try Basic Notification (iOS Fallback)
              </button>
            )}

            {!status.subscribed ? (
              <button
                onClick={handleSubscribe}
                disabled={loading || !status.supported}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-surface disabled:cursor-not-allowed font-medium"
                style={{
                  minHeight: '56px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {loading
                  ? 'Processing...'
                  : '🔔 Subscribe to Push Notifications (Full)'}
              </button>
            ) : (
              <>
                <button
                  onClick={handleTestNotification}
                  disabled={loading}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:bg-surface font-medium"
                >
                  {loading ? 'Sending...' : '📬 Send Test Notification'}
                </button>
                <button
                  onClick={handleUnsubscribe}
                  disabled={loading}
                  className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:bg-surface font-medium"
                >
                  {loading ? 'Processing...' : '🔕 Unsubscribe'}
                </button>
              </>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 dark:bg-destructive/20 rounded-lg border border-destructive dark:border-red-700">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-success/10 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
              <p className="text-sm text-green-800 dark:text-green-200">
                {success}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-surface dark:bg-background rounded-lg">
            <h3 className="font-semibold text-text dark:text-white mb-3">
              How to Test:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-text dark:text-text-light">
              <li>Click &quot;Subscribe to Notifications&quot;</li>
              <li>Allow notifications when prompted</li>
              <li>Click &quot;Send Test Notification&quot;</li>
              <li>You should see a notification appear!</li>
            </ol>
          </div>

          {/* Platform Information */}
          <div className="mt-6 p-4 bg-primary/10 dark:bg-primary/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Platform Support:
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>
                <strong>✅ Full Support:</strong> Android Chrome, Desktop
                Chrome/Edge/Firefox
              </p>
              <p>
                <strong>✅ iOS Support:</strong> iOS 16.4+ (most users on iOS
                17+) - requires Home Screen installation
              </p>
              <p>
                <strong>❌ No Support:</strong> iOS &lt; 16.4 (older devices
                only)
              </p>
              <p className="text-xs mt-2 italic">
                Most of your users on iOS 17 or iOS 26 will have push
                notification support!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
