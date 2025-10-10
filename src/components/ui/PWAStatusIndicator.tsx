'use client';

// PWA Status Indicator Component
import React from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from './Button';
import { logger } from '@/lib/logger';

interface PWAStatusIndicatorProps {
  className?: string;
  showInstallButton?: boolean;
  showOfflineActions?: boolean;
}

export function PWAStatusIndicator({
  className = '',
  showInstallButton = true,
  showOfflineActions = true,
}: PWAStatusIndicatorProps) {
  const { status, installApp, canInstall } = usePWA();

  if (!status.isServiceWorkerReady) {
    return null; // Don't show anything if service worker isn't ready
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Online/Offline Status */}
      <div className="flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full ${
            status.isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={status.isOnline ? 'Online' : 'Offline'}
        />
        <span className="text-xs text-text-light dark:text-text-light">
          {status.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Offline Actions Count */}
      {showOfflineActions && status.offlineActionsCount > 0 && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs text-text-light dark:text-text-light">
            {status.offlineActionsCount} pending
          </span>
        </div>
      )}

      {/* Install Button */}
      {showInstallButton && canInstall && !status.isInstalled && (
        <Button
          size="sm"
          variant="outline"
          onClick={installApp}
          className="text-xs"
        >
          Install App
        </Button>
      )}

      {/* Installed Indicator */}
      {status.isInstalled && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs text-text-light dark:text-text-light">
            Installed
          </span>
        </div>
      )}
    </div>
  );
}

// PWA Install Prompt Component
interface PWAInstallPromptProps {
  onDismiss?: () => void;
  onInstall?: () => void;
}

export function PWAInstallPrompt({
  onDismiss,
  onInstall,
}: PWAInstallPromptProps) {
  const { status, installApp, canInstall } = usePWA();

  if (!canInstall || status.isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installApp();
    if (success && onInstall) {
      onInstall();
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-background border border-border dark:border-border rounded-lg shadow-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🍽️</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-text dark:text-white">
            Install You Hungry?
          </h3>
          <p className="text-xs text-text-light dark:text-text-light mt-1">
            Install this app on your device for a better experience and offline
            access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onDismiss}
            className="text-xs"
          >
            Not now
          </Button>
          <Button size="sm" onClick={handleInstall} className="text-xs">
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}

// PWA Offline Banner Component
export function PWAOfflineBanner() {
  const { status } = usePWA();

  if (status.isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
      <div className="flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-yellow-700" />
        <span>You&apos;re offline. Some features may be limited.</span>
      </div>
    </div>
  );
}

// PWA Debug Component (for development/testing)
export function PWADebugPanel() {
  const { status, installApp, canInstall } = usePWA();

  const handleManualInstall = async () => {
    logger.debug('Manual install attempt');
    const success = await installApp();
    logger.debug('Manual install result:', success);
  };

  const checkPWARequirements = () => {
    logger.debug('Check Requirements button clicked!');

    try {
      const requirements = {
        hasServiceWorker: 'serviceWorker' in navigator,
        hasManifest: document.querySelector('link[rel="manifest"]') !== null,
        isHTTPS:
          location.protocol === 'https:' ||
          location.hostname === 'localhost' ||
          location.hostname === '127.0.0.1' ||
          location.hostname.startsWith('192.168.'),
        hasIcons: document.querySelector('link[rel="icon"]') !== null,
        isOnline: navigator.onLine,
        userAgent: navigator.userAgent,
        url: location.href,
        protocol: location.protocol,
        hostname: location.hostname,
        isLocalhost:
          location.hostname === 'localhost' ||
          location.hostname === '127.0.0.1',
      };

      logger.debug('PWA Requirements Check:', requirements);

      // Also show an alert for mobile debugging
      alert(`PWA Requirements:
Service Worker: ${requirements.hasServiceWorker ? '✅' : '❌'}
Manifest: ${requirements.hasManifest ? '✅' : '❌'}
HTTPS/Localhost: ${requirements.isHTTPS ? '✅' : '❌'}
Icons: ${requirements.hasIcons ? '✅' : '❌'}
Online: ${requirements.isOnline ? '✅' : '❌'}

URL: ${requirements.url}
Protocol: ${requirements.protocol}
Hostname: ${requirements.hostname}

Check console for full details.`);

      return requirements;
    } catch (error) {
      logger.error('Error checking PWA requirements:', error);
      alert('Error checking requirements. Check console for details.');
    }
  };

  const checkPWAServerStatus = async () => {
    try {
      logger.debug('Checking PWA status via server...');
      const response = await fetch('/api/pwa-status');
      const data = await response.json();

      logger.debug('Server PWA Status:', data);

      alert(`Server PWA Status:
Service Worker: ${data.requirements.hasServiceWorker ? '✅' : '❌'}
Manifest: ${data.requirements.manifestExists ? '✅' : '❌'}
HTTPS/Localhost: ${data.requirements.isHTTPS ? '✅' : '❌'}
SW File Exists: ${data.requirements.swExists ? '✅' : '❌'}
Manifest File Exists: ${data.requirements.manifestExists ? '✅' : '❌'}

Mobile: ${data.mobile.isMobile ? 'Yes' : 'No'}
Browser: ${data.mobile.isChromeIOS ? 'Chrome (iOS)' : data.mobile.isChrome ? 'Chrome' : data.mobile.isSafari ? 'Safari' : data.mobile.isFirefox ? 'Firefox' : 'Other'}

Check server logs for full details.`);

      return data;
    } catch (error) {
      logger.error('Error checking server PWA status:', error);
      alert('Error checking server status. Check server logs.');
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-90 text-white p-3 rounded-lg text-xs max-w-xs">
      <h3 className="font-bold mb-2 text-sm">PWA Debug</h3>

      <div className="space-y-1 mb-3 text-xs">
        <div className="flex justify-between">
          <span>Online:</span>
          <span>{status.isOnline ? '✅' : '❌'}</span>
        </div>
        <div className="flex justify-between">
          <span>Installed:</span>
          <span>{status.isInstalled ? '✅' : '❌'}</span>
        </div>
        <div className="flex justify-between">
          <span>Can Install:</span>
          <span>{canInstall ? '✅' : '❌'}</span>
        </div>
        <div className="flex justify-between">
          <span>SW Ready:</span>
          <span>{status.isServiceWorkerReady ? '✅' : '❌'}</span>
        </div>
        <div className="flex justify-between">
          <span>Offline Actions:</span>
          <span>{status.offlineActionsCount}</span>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleManualInstall}
          disabled={!canInstall}
          className="w-full bg-blue-600 text-white px-2 py-2 rounded text-xs disabled:bg-surface"
          style={{
            minHeight: '44px',
            fontSize: '12px',
            touchAction: 'manipulation',
          }}
        >
          Manual Install
        </button>

        <button
          onClick={checkPWARequirements}
          className="w-full bg-green-600 text-white px-2 py-2 rounded text-xs"
          style={{
            minHeight: '44px',
            fontSize: '12px',
            touchAction: 'manipulation',
          }}
        >
          Check Requirements
        </button>

        <button
          onClick={checkPWAServerStatus}
          className="w-full bg-orange-600 text-white px-2 py-2 rounded text-xs"
          style={{
            minHeight: '44px',
            fontSize: '12px',
            touchAction: 'manipulation',
          }}
        >
          Server Status
        </button>

        <button
          onClick={() => {
            const info = `PWA Status:
Online: ${status.isOnline}
Installed: ${status.isInstalled}
Can Install: ${canInstall}
SW Ready: ${status.isServiceWorkerReady}
URL: ${location.href}`;
            navigator.clipboard
              ?.writeText(info)
              .then(() => {
                alert('PWA info copied to clipboard!');
              })
              .catch(() => {
                alert(info);
              });
          }}
          className="w-full bg-purple-600 text-white px-2 py-2 rounded text-xs"
          style={{
            minHeight: '44px',
            fontSize: '12px',
            touchAction: 'manipulation',
          }}
        >
          Copy Status
        </button>
      </div>
    </div>
  );
}
