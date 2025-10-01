'use client';

import React, { useState, useEffect } from 'react';

export default function PWAExplorerPage() {
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (test: string, result: unknown) => {
    setResults((prev) => ({ ...prev, [test]: result }));
    setTestResults((prev) => [...prev, `${test}: ${JSON.stringify(result)}`]);
  };

  const testFeature = async (name: string, testFn: () => Promise<unknown>) => {
    try {
      const result = await testFn();
      addResult(name, { success: true, result });
      return result;
    } catch (error) {
      addResult(name, { success: false, error: String(error) });
      return null;
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    setResults({});

    // Test 1: Browser Detection
    await testFeature('Browser Detection', async () => ({
      userAgent: navigator.userAgent,
      isChromeIOS: /CriOS/.test(navigator.userAgent),
      isSafari:
        /Safari/.test(navigator.userAgent) &&
        !/CriOS|Chrome/.test(navigator.userAgent),
      platform: navigator.platform,
      vendor: navigator.vendor,
    }));

    // Test 2: Service Worker Support
    await testFeature('Service Worker Support', async () => ({
      supported: 'serviceWorker' in navigator,
      controller: !!navigator.serviceWorker?.controller,
      ready: navigator.serviceWorker
        ? 'ready' in navigator.serviceWorker
        : false,
    }));

    // Test 3: Service Worker Registration
    if ('serviceWorker' in navigator) {
      await testFeature('Service Worker Registration', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          return {
            registered: true,
            scope: registration.scope,
            active: !!registration.active,
            installing: !!registration.installing,
            waiting: !!registration.waiting,
          };
        } catch (error) {
          return { registered: false, error: String(error) };
        }
      });
    }

    // Test 4: Manifest Support
    await testFeature('Manifest Support', async () => {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      return {
        manifestLinkExists: !!manifestLink,
        manifestHref: manifestLink?.getAttribute('href'),
      };
    });

    // Test 5: Install Prompt
    await testFeature('Install Prompt', async () => ({
      beforeInstallPromptSupported: 'BeforeInstallPromptEvent' in window,
      hasPromptEvent: false, // Will be updated by event
    }));

    // Test 6: Display Mode
    await testFeature('Display Mode', async () => ({
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      navigatorStandalone: (navigator as unknown as Record<string, unknown>)
        .standalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches
        ? 'standalone'
        : 'browser',
    }));

    // Test 7: Cache API
    await testFeature('Cache API', async () => ({
      supported: 'caches' in window,
      canOpen: !!caches.open,
    }));

    // Test 8: IndexedDB
    await testFeature('IndexedDB', async () => ({
      supported: 'indexedDB' in window,
      canOpen: !!indexedDB.open,
    }));

    // Test 9: Push Notifications
    await testFeature('Push Notifications', async () => ({
      supported: 'Notification' in window,
      permission: Notification.permission,
      pushManager: 'PushManager' in window,
    }));

    // Test 10: Background Sync
    await testFeature('Background Sync', async () => ({
      supported:
        'sync' in (navigator.serviceWorker?.constructor.prototype || {}),
    }));

    // Test 11: Web Share API
    await testFeature('Web Share API', async () => ({
      supported: 'share' in navigator,
    }));

    // Test 12: Fetch API
    await testFeature('Fetch API', async () => ({
      supported: 'fetch' in window,
    }));

    // Test 13: LocalStorage
    await testFeature('LocalStorage', async () => ({
      supported: 'localStorage' in window,
      canWrite: (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
    }));

    // Test 14: Geolocation
    await testFeature('Geolocation', async () => ({
      supported: 'geolocation' in navigator,
    }));

    // Test 15: Camera/Media
    await testFeature('Media Devices', async () => ({
      supported: 'mediaDevices' in navigator,
      getUserMedia: 'getUserMedia' in (navigator.mediaDevices || {}),
    }));
  };

  useEffect(() => {
    runAllTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusIcon = (result: unknown) => {
    if (
      result &&
      typeof result === 'object' &&
      'success' in result &&
      result.success
    ) {
      return '✅';
    }
    return '❌';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            PWA Feature Explorer for iOS
          </h1>

          <div className="mb-6">
            <button
              onClick={runAllTests}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🔄 Run All Tests Again
            </button>
          </div>

          <div className="space-y-4">
            {Object.entries(results).map(([test, result]) => (
              <div
                key={test}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {getStatusIcon(result)} {test}
                  </h3>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 overflow-auto">
                  <pre className="text-xs text-gray-700 dark:text-gray-300">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>

          {testResults.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Running tests...
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📱 iOS PWA Installation Instructions
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>
              Tap the <strong>Share button</strong> (square with arrow up)
            </li>
            <li>
              Scroll down and tap{' '}
              <strong>&quot;Add to Home Screen&quot;</strong>
            </li>
            <li>
              Tap <strong>&quot;Add&quot;</strong> in the top right
            </li>
            <li>The app will appear on your home screen!</li>
          </ol>
        </div>

        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4">
          <h2 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            ⚠️ iOS PWA Limitations
          </h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
            <li>
              <strong>Chrome on iOS</strong> uses Safari&apos;s WebKit engine
            </li>
            <li>
              <strong>Service Workers</strong> have limited support
            </li>
            <li>
              <strong>No automatic install prompts</strong> - must use manual
              installation
            </li>
            <li>
              <strong>Push notifications</strong> may not work fully
            </li>
            <li>
              <strong>Background sync</strong> is limited
            </li>
            <li>
              <strong>Some APIs</strong> may not be available
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
