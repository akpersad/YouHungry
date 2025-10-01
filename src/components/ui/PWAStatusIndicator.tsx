'use client';

// PWA Status Indicator Component
import React from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from './Button';

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
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {status.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Offline Actions Count */}
      {showOfflineActions && status.offlineActionsCount > 0 && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
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
          <span className="text-xs text-gray-600 dark:text-gray-400">
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
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🍽️</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Install You Hungry?
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
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
