'use client';

// PWA Status Indicator Component
import React, { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from './Button';
import { Modal } from './Modal';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { trackPWAInstallPromptShown, trackPWAInstalled } from '@/lib/analytics';

interface PWAStatusIndicatorProps {
  className?: string;
  showInstallButton?: boolean;
  showOfflineActions?: boolean;
}

interface PWARequirements {
  hasServiceWorker: boolean;
  hasManifest: boolean;
  isHTTPS: boolean;
  hasIcons: boolean;
  isOnline: boolean;
  userAgent: string;
  url: string;
  protocol: string;
  hostname: string;
  isLocalhost: boolean;
}

interface PWAServerStatus {
  hasManifest?: boolean;
  hasServiceWorker?: boolean;
  manifestUrl?: string;
  serviceWorkerUrl?: string;
  requirements?: {
    hasServiceWorker?: boolean;
    manifestExists?: boolean;
    isHTTPS?: boolean;
    swExists?: boolean;
  };
  mobile?: {
    isMobile?: boolean;
    isChromeIOS?: boolean;
    isChrome?: boolean;
    isSafari?: boolean;
    isFirefox?: boolean;
  };
  [key: string]: unknown;
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

const PWA_DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION = 72 * 60 * 60 * 1000; // 72 hours in milliseconds

export function PWAInstallPrompt({
  onDismiss,
  onInstall,
}: PWAInstallPromptProps) {
  const { status, installApp, canInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if banner was dismissed within the last 72 hours
  useEffect(() => {
    const dismissedTime = localStorage.getItem(PWA_DISMISS_KEY);
    if (dismissedTime) {
      const elapsed = Date.now() - parseInt(dismissedTime, 10);
      if (elapsed < DISMISS_DURATION) {
        setIsDismissed(true);
      } else {
        // Clear expired dismissal
        localStorage.removeItem(PWA_DISMISS_KEY);
      }
    }
  }, []);

  // Track prompt shown on first render (must be before early return)
  useEffect(() => {
    if (canInstall && !status.isInstalled && !isDismissed) {
      trackPWAInstallPromptShown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  if (!canInstall || status.isInstalled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    // Store current timestamp
    localStorage.setItem(PWA_DISMISS_KEY, Date.now().toString());
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      // Track PWA installation
      trackPWAInstalled();

      // Clear any dismissal on successful install
      localStorage.removeItem(PWA_DISMISS_KEY);
      if (onInstall) {
        onInstall();
      }
    }
  };

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 bg-secondary rounded-lg p-4"
      style={{
        boxShadow: 'var(--shadow-strong)',
        border: '1px solid var(--bg-quaternary)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🍽️</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-primary">
            Install Fork In The Road
          </h3>
          <p className="text-xs text-secondary mt-1">
            Install this app on your device for a better experience and offline
            access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDismiss}
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
  const [showRequirements, setShowRequirements] = useState(false);
  const [requirementsData, setRequirementsData] =
    useState<PWARequirements | null>(null);
  const [showServerStatus, setShowServerStatus] = useState(false);
  const [serverStatusData, setServerStatusData] =
    useState<PWAServerStatus | null>(null);

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
      setRequirementsData(requirements);
      setShowRequirements(true);

      return requirements;
    } catch (error) {
      logger.error('Error checking PWA requirements:', error);
      toast.error('Error checking requirements. Check console for details.');
    }
  };

  const checkPWAServerStatus = async () => {
    try {
      logger.debug('Checking PWA status via server...');
      const response = await fetch('/api/pwa-status');
      const data = await response.json();

      logger.debug('Server PWA Status:', data);
      setServerStatusData(data);
      setShowServerStatus(true);

      return data;
    } catch (error) {
      logger.error('Error checking server PWA status:', error);
      toast.error('Error checking server status. Check server logs.');
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
                toast.success('PWA info copied to clipboard!');
              })
              .catch(() => {
                toast.error('Failed to copy to clipboard');
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

      {/* Requirements Modal */}
      {requirementsData && (
        <Modal
          isOpen={showRequirements}
          onClose={() => setShowRequirements(false)}
          title="PWA Requirements"
        >
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Service Worker:</div>
              <div>{requirementsData.hasServiceWorker ? '✅' : '❌'}</div>

              <div className="font-medium">Manifest:</div>
              <div>{requirementsData.hasManifest ? '✅' : '❌'}</div>

              <div className="font-medium">HTTPS/Localhost:</div>
              <div>{requirementsData.isHTTPS ? '✅' : '❌'}</div>

              <div className="font-medium">Icons:</div>
              <div>{requirementsData.hasIcons ? '✅' : '❌'}</div>

              <div className="font-medium">Online:</div>
              <div>{requirementsData.isOnline ? '✅' : '❌'}</div>
            </div>

            <div className="border-t pt-3 mt-3">
              <div className="font-medium mb-2">Environment:</div>
              <div className="text-xs space-y-1 text-text-light">
                <div>
                  <strong>URL:</strong> {requirementsData.url}
                </div>
                <div>
                  <strong>Protocol:</strong> {requirementsData.protocol}
                </div>
                <div>
                  <strong>Hostname:</strong> {requirementsData.hostname}
                </div>
              </div>
            </div>

            <p className="text-xs text-text-light">
              Check console for full details.
            </p>
          </div>
        </Modal>
      )}

      {/* Server Status Modal */}
      {serverStatusData && (
        <Modal
          isOpen={showServerStatus}
          onClose={() => setShowServerStatus(false)}
          title="Server PWA Status"
        >
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Service Worker:</div>
              <div>
                {serverStatusData.requirements?.hasServiceWorker ? '✅' : '❌'}
              </div>

              <div className="font-medium">Manifest:</div>
              <div>
                {serverStatusData.requirements?.manifestExists ? '✅' : '❌'}
              </div>

              <div className="font-medium">HTTPS/Localhost:</div>
              <div>{serverStatusData.requirements?.isHTTPS ? '✅' : '❌'}</div>

              <div className="font-medium">SW File Exists:</div>
              <div>{serverStatusData.requirements?.swExists ? '✅' : '❌'}</div>
            </div>

            <div className="border-t pt-3 mt-3">
              <div className="font-medium mb-2">Device Info:</div>
              <div className="text-xs space-y-1 text-text-light">
                <div>
                  <strong>Mobile:</strong>{' '}
                  {serverStatusData.mobile?.isMobile ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Browser:</strong>{' '}
                  {serverStatusData.mobile?.isChromeIOS
                    ? 'Chrome (iOS)'
                    : serverStatusData.mobile?.isChrome
                      ? 'Chrome'
                      : serverStatusData.mobile?.isSafari
                        ? 'Safari'
                        : serverStatusData.mobile?.isFirefox
                          ? 'Firefox'
                          : 'Other'}
                </div>
              </div>
            </div>

            <p className="text-xs text-text-light">
              Check server logs for full details.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
