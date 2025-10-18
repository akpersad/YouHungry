'use client';

import { logger } from '@/lib/logger';
import React, { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PushSubscriptionData } from '@/lib/push-notifications';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';

export default function PushTestPage() {
  const {
    status,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification,
    sendServerTestNotification,
  } = usePushNotifications();
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
        new Notification('Fork In The Road Test', {
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

  const handleServerTestNotification = async () => {
    setError('');
    setSuccess('');
    try {
      await sendServerTestNotification();
      setSuccess(
        'Server push notification sent! This is a real push notification that works even when the app is closed.'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    }
  };

  const getStatusIcon = (value: boolean) => {
    return value ? '✅' : '❌';
  };

  const getPermissionIcon = (permission: NotificationPermission) => {
    switch (permission) {
      case 'granted':
        return '✅';
      case 'denied':
        return '❌';
      default:
        return '⚠️';
    }
  };

  return (
    <div className="min-h-screen bg-primary p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-inverse mb-2">
            🔔 Push Notifications
          </h1>
          <p className="text-lg text-inverse/80">
            Test and configure push notifications for Fork In The Road
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-6 card-elevated">
          <CardHeader>
            <CardTitle className="text-xl">System Status</CardTitle>
            <CardDescription>
              Current notification capabilities and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-tertiary">
                  <span className="text-secondary font-medium">Supported</span>
                  <span className="text-lg">
                    {getStatusIcon(status.supported)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-tertiary">
                  <span className="text-secondary font-medium">Permission</span>
                  <span className="text-lg">
                    {getPermissionIcon(status.permission)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-tertiary">
                  <span className="text-secondary font-medium">Subscribed</span>
                  <span className="text-lg">
                    {getStatusIcon(status.subscribed)}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-tertiary">
                  <span className="text-secondary font-medium">iOS Device</span>
                  <span className="text-lg">{status.isIOS ? '📱' : '💻'}</span>
                </div>
                {status.isIOS && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-tertiary">
                    <span className="text-secondary font-medium">
                      iOS Support
                    </span>
                    <span className="text-lg">
                      {getStatusIcon(status.hasIOSSupport)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 rounded-xl bg-tertiary">
                  <span className="text-secondary font-medium">
                    Display Mode
                  </span>
                  <span className="text-lg">
                    {mounted &&
                    window.matchMedia('(display-mode: standalone)').matches
                      ? '📱 Standalone'
                      : '🌐 Browser'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* iOS Warnings/Info */}
        {status.isIOS && !status.hasIOSSupport && (
          <Card className="mb-6 border-warning">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-warning mb-2">
                    iOS Limitation
                  </h3>
                  <p className="text-sm text-secondary">
                    Push notifications require iOS 16.4 or later. Your device
                    may not support push notifications for PWAs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {status.isIOS && status.hasIOSSupport && (
          <Card className="mb-6 border-success">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="font-semibold text-success mb-2">
                    iOS Push Notifications Supported!
                  </h3>
                  <p className="text-sm text-secondary mb-3">
                    Your iOS version supports push notifications. Make sure to:
                  </p>
                  <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
                    <li>App is added to Home Screen (Installed)</li>
                    <li>You opened the app from Home Screen (not Safari)</li>
                    <li>Grant notification permission when prompted</li>
                  </ul>
                  <p className="text-xs text-tertiary mt-3">
                    Note: iOS notifications have some limitations compared to
                    Android (e.g., no action buttons, limited customization).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Info */}
        {mounted && (
          <Card className="mb-6 bg-tertiary">
            <CardHeader>
              <CardTitle className="text-lg">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-tertiary">Service Worker:</span>
                  <span>{'serviceWorker' in navigator ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">PushManager:</span>
                  <span>{'PushManager' in window ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Notification:</span>
                  <span>{'Notification' in window ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Loading:</span>
                  <span>{loading ? '⏳' : '✅'}</span>
                </div>
              </div>

              {!('serviceWorker' in navigator) && (
                <div className="mt-4 p-3 bg-accent/10 rounded-xl border border-accent/20">
                  <div className="flex items-center space-x-2">
                    <span className="text-accent">ℹ️</span>
                    <div>
                      <div className="font-medium text-accent text-sm">
                        Local Development Limitation
                      </div>
                      <div className="text-xs text-tertiary mt-1">
                        Service Workers require HTTPS. This will work in
                        production!
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Warnings for unsupported features */}
        {!status.supported && mounted && 'Notification' in window && (
          <Card className="mb-6 border-warning">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-warning mb-2">
                    Limited Notification Support
                  </h3>
                  <p className="text-sm text-secondary mb-2">
                    Push notifications (background/server-sent) aren&apos;t
                    available, but you can test basic notifications below.
                  </p>
                  <p className="text-xs text-tertiary">
                    <strong>iOS Chrome Limitation:</strong> Service Worker and
                    PushManager APIs aren&apos;t available.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!status.supported && mounted && !('Notification' in window) && (
          <Card className="mb-6 border-error">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">❌</span>
                <div>
                  <h3 className="font-semibold text-error mb-2">
                    Notifications Not Available
                  </h3>
                  <p className="text-sm text-secondary">
                    Your browser doesn&apos;t support any notification APIs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Test Notifications</CardTitle>
            <CardDescription>
              Subscribe to and test push notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Basic notification for unsupported browsers */}
              {!status.supported && mounted && 'Notification' in window && (
                <Button
                  onClick={handleBasicNotification}
                  variant="warm"
                  size="lg"
                  className="w-full"
                >
                  🔔 Try Basic Notification (iOS Fallback)
                </Button>
              )}

              {/* Main subscription flow */}
              {!status.subscribed ? (
                <Button
                  onClick={handleSubscribe}
                  disabled={loading || !status.supported}
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={loading}
                  loadingText="Processing..."
                >
                  🔔 Subscribe to Push Notifications
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={handleTestNotification}
                    disabled={loading}
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    isLoading={loading}
                    loadingText="Sending..."
                  >
                    📬 Send Test Notification (Client)
                  </Button>
                  <Button
                    onClick={handleServerTestNotification}
                    disabled={loading}
                    variant="accent"
                    size="lg"
                    className="w-full"
                    isLoading={loading}
                    loadingText="Sending..."
                  >
                    🚀 Send Server Push Notification
                  </Button>
                  <Button
                    onClick={handleUnsubscribe}
                    disabled={loading}
                    variant="outline"
                    size="lg"
                    className="w-full"
                    isLoading={loading}
                    loadingText="Processing..."
                  >
                    🔕 Unsubscribe
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        {error && (
          <Card className="mb-6 border-error">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">❌</span>
                <div>
                  <h3 className="font-semibold text-error mb-2">Error</h3>
                  <p className="text-sm text-secondary">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="mb-6 border-success">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="font-semibold text-success mb-2">Success</h3>
                  <p className="text-sm text-secondary">{success}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">How to Test</CardTitle>
            <CardDescription>
              Step-by-step guide to testing push notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-secondary">
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-accent text-inverse rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>
                  Click &quot;Subscribe to Push Notifications&quot; and allow
                  notifications when prompted
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-accent text-inverse rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>
                  Click &quot;Send Server Push Notification&quot; to test real
                  push notifications
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-accent text-inverse rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>
                  You should see a notification appear! Try closing the app and
                  testing again
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Platform Support */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Platform Support</CardTitle>
            <CardDescription>
              Push notification compatibility across devices and browsers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h4 className="font-semibold text-primary mb-1">
                    Full Support
                  </h4>
                  <p className="text-sm text-secondary">
                    Android Chrome, Desktop Chrome/Edge/Firefox
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">📱</span>
                <div>
                  <h4 className="font-semibold text-primary mb-1">
                    iOS Support
                  </h4>
                  <p className="text-sm text-secondary">
                    iOS 16.4+ (most users on iOS 17+) - requires Home Screen
                    installation
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">❌</span>
                <div>
                  <h4 className="font-semibold text-primary mb-1">
                    No Support
                  </h4>
                  <p className="text-sm text-secondary">
                    iOS &lt; 16.4 (older devices only)
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-accent/10 rounded-xl">
                <p className="text-xs text-tertiary italic">
                  💡 Most of your users on iOS 17 or iOS 18 will have push
                  notification support!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
