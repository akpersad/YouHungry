'use client';

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
import { logger } from '@/lib/logger';

export function PushNotificationTestDashboard() {
  const {
    status,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification,
    sendServerTestNotification,
    refresh,
  } = usePushNotifications();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Fix hydration issues
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Capture console logs
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);

      // Capture debug logs
      const message = args.join(' ');
      if (
        message.includes('🔍 DEBUG:') ||
        message.includes('iOS detection:') ||
        message.includes('hasIOSPushSupport check:')
      ) {
        setDebugLogs((prev) => [
          ...prev.slice(-9),
          `${new Date().toLocaleTimeString()}: ${message}`,
        ]);
      }
    };

    return () => {
      console.log = originalLog;
    };
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

      // Wait for service worker to be ready first
      console.log('🔍 Waiting for service worker to be ready...');
      await navigator.serviceWorker.ready;
      console.log('🔍 Service worker is ready!');

      // Add longer timeout and better error handling
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Subscribe timeout - Service worker may not be ready. Try refreshing the page.'
              )
            ),
          30000 // Increased to 30 seconds
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

  // Get real-time capabilities (bypass React state)
  const getRealTimeCapabilities = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        supported: false,
        permission: 'default' as NotificationPermission,
        isIOS: false,
        hasIOSSupport: false,
      };
    }

    const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotification = 'Notification' in window;
    const isSecureContext = window.isSecureContext;

    const supported =
      hasServiceWorker && hasPushManager && hasNotification && isSecureContext;
    const hasIOSSupport = isIOS && supported;

    return {
      supported,
      permission:
        'Notification' in window
          ? Notification.permission
          : ('default' as NotificationPermission),
      isIOS,
      hasIOSSupport,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-text mb-2">
            🔔 Push Notification Testing
          </h2>
          <p className="text-text-light">
            Test push notification functionality and device eligibility
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              console.log('🔍 REFRESH BUTTON CLICKED');
              refresh();
            }}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            🔄 Refresh Status
          </Button>
          <Button
            onClick={() => {
              console.log('🔍 FORCE UPDATE CLICKED');
              // Force a re-render by updating state
              setMounted(false);
              setTimeout(() => setMounted(true), 100);
            }}
            variant="outline"
            size="sm"
          >
            🔄 Force Update
          </Button>
          <Button
            onClick={async () => {
              console.log('🔍 REGISTER SW CLICKED');
              try {
                if ('serviceWorker' in navigator) {
                  const registration =
                    await navigator.serviceWorker.register('/sw.js');
                  console.log('🔍 Service worker registered:', registration);
                  setSuccess('Service worker registered! Try subscribing now.');
                }
              } catch (error) {
                console.error('🔍 Service worker registration failed:', error);
                setError('Failed to register service worker: ' + error);
              }
            }}
            variant="outline"
            size="sm"
          >
            🔧 Register SW
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className="card-elevated">
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
                  {mounted
                    ? getStatusIcon(getRealTimeCapabilities().supported)
                    : '⏳'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-tertiary">
                <span className="text-secondary font-medium">Permission</span>
                <span className="text-lg">
                  {mounted
                    ? getPermissionIcon(getRealTimeCapabilities().permission)
                    : '⏳'}
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
                <span className="text-lg">
                  {mounted
                    ? getRealTimeCapabilities().isIOS
                      ? '📱'
                      : '💻'
                    : '⏳'}
                </span>
              </div>
              {mounted && getRealTimeCapabilities().isIOS && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-tertiary">
                  <span className="text-secondary font-medium">
                    iOS Support
                  </span>
                  <span className="text-lg">
                    {getStatusIcon(getRealTimeCapabilities().hasIOSSupport)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 rounded-xl bg-tertiary">
                <span className="text-secondary font-medium">Display Mode</span>
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
        <Card className="border-warning">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-warning mb-2">
                  iOS Limitation
                </h3>
                <p className="text-sm text-secondary">
                  Push notifications require iOS 16.4 or later. Your device may
                  not support push notifications for PWAs, or the APIs may not
                  be available. Try accessing the app from a standalone PWA
                  (installed to home screen).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status.isIOS && status.hasIOSSupport && (
        <Card className="border-success">
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      {mounted && (
        <Card className="bg-tertiary">
          <CardHeader>
            <CardTitle className="text-lg">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-tertiary">Service Worker:</span>
                <span className="font-mono">
                  {'serviceWorker' in navigator ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tertiary">SW Ready:</span>
                <span className="font-mono">
                  {mounted && 'serviceWorker' in navigator
                    ? navigator.serviceWorker.controller
                      ? '✅'
                      : '⏳'
                    : '❌'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tertiary">PushManager:</span>
                <span className="font-mono">
                  {'PushManager' in window ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tertiary">Notification:</span>
                <span className="font-mono">
                  {'Notification' in window ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tertiary">Secure Context:</span>
                <span className="font-mono">
                  {window.isSecureContext ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tertiary">Display Mode:</span>
                <span className="font-mono">
                  {window.matchMedia('(display-mode: standalone)').matches
                    ? 'PWA'
                    : 'Web'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tertiary">isSupported():</span>
                <span className="font-mono">
                  {status.supported ? '✅' : '❌'}
                </span>
              </div>
            </div>

            {/* Raw Debug Values */}
            <div className="mt-4 p-3 bg-quaternary rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Raw Debug Values:</h4>
              <pre className="text-xs text-tertiary overflow-x-auto">
                {JSON.stringify(
                  {
                    supported: status.supported,
                    permission: status.permission,
                    subscribed: status.subscribed,
                    isIOS: status.isIOS,
                    hasIOSSupport: status.hasIOSSupport,
                    userAgent: navigator.userAgent,
                    isSecureContext: window.isSecureContext,
                    location: window.location.href,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            {/* Debug Logs */}
            {debugLogs.length > 0 && (
              <div className="mt-4 p-3 bg-quaternary rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Debug Logs:</h4>
                <div className="space-y-1">
                  {debugLogs.map((log, index) => (
                    <div
                      key={index}
                      className="text-xs text-tertiary font-mono break-all"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
          <CardDescription>
            Test push notification functionality on this device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* iOS fallback for devices without full push support */}
            {status.isIOS && !status.supported && (
              <Button
                onClick={handleBasicNotification}
                disabled={loading}
                variant="outline"
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
                disabled={loading || !getRealTimeCapabilities().supported}
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
        <Card className="border-error">
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
        <Card className="border-success">
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
    </div>
  );
}
