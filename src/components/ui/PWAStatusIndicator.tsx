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
            status.isOnline ? 'bg-success' : 'bg-destructive'
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
          <div className="w-2 h-2 rounded-full bg-warning" />
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
          <div className="w-2 h-2 rounded-full bg-accent" />
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
const PWA_IOS_DISMISS_KEY = 'pwa-ios-install-dismissed';
const DISMISS_DURATION = 72 * 60 * 60 * 1000; // 72 hours in milliseconds

// Detect if device is iOS
const isIOS = () => {
  if (typeof window === 'undefined') return false;

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

// Detect if device is Android
const _isAndroid = () => {
  if (typeof window === 'undefined') return false;

  return /Android/.test(navigator.userAgent);
};

// Detect if device is in standalone mode (installed)
const isInStandaloneMode = () => {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as Record<string, unknown>).standalone === true
  );
};

export function PWAInstallPrompt({
  onDismiss,
  onInstall,
}: PWAInstallPromptProps) {
  const { status, installApp, canInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isIOSDismissed, setIsIOSDismissed] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [_isAutoClosing, setIsAutoClosing] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Check if device is iOS and dismissal state
  useEffect(() => {
    const iOS = isIOS();
    const standalone = isInStandaloneMode();
    setIsIOSDevice(iOS && !standalone);

    // Check Chrome/Edge dismissal
    const dismissedTime = localStorage.getItem(PWA_DISMISS_KEY);
    if (dismissedTime) {
      const elapsed = Date.now() - parseInt(dismissedTime, 10);
      if (elapsed < DISMISS_DURATION) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(PWA_DISMISS_KEY);
      }
    }

    // Check iOS dismissal
    const iOSDismissedTime = localStorage.getItem(PWA_IOS_DISMISS_KEY);
    if (iOSDismissedTime) {
      const elapsed = Date.now() - parseInt(iOSDismissedTime, 10);
      if (elapsed < DISMISS_DURATION) {
        setIsIOSDismissed(true);
      } else {
        localStorage.removeItem(PWA_IOS_DISMISS_KEY);
      }
    }
  }, []);

  // Show iOS banner if on iOS and not dismissed
  const showIOSBanner = isIOSDevice && !isIOSDismissed && !status.isInstalled;

  // Show Chrome/Edge banner if can install and not dismissed
  const showStandardBanner = canInstall && !status.isInstalled && !isDismissed;

  const handleDismiss = React.useCallback(
    (isAutoClose = false) => {
      // Only set dismissal in localStorage if manually dismissed (not auto-close)
      if (!isAutoClose) {
        if (showIOSBanner) {
          localStorage.setItem(PWA_IOS_DISMISS_KEY, Date.now().toString());
          setIsIOSDismissed(true);
        } else {
          localStorage.setItem(PWA_DISMISS_KEY, Date.now().toString());
          setIsDismissed(true);
        }
      }
      if (onDismiss) {
        onDismiss();
      }
    },
    [showIOSBanner, onDismiss]
  );

  // Track prompt shown on first render (must be before early return)
  useEffect(() => {
    if (canInstall && !status.isInstalled && !isDismissed) {
      trackPWAInstallPromptShown();
    } else if (isIOSDevice && !isIOSDismissed) {
      trackPWAInstallPromptShown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Auto-close countdown timer
  useEffect(() => {
    if (isHidden) return; // Don't start timer if already hidden

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsAutoClosing(true);
          setIsHidden(true);
          handleDismiss(true); // Pass true to indicate auto-close
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleDismiss, isHidden]);

  // Don't show any banner if none of the conditions are met or if hidden
  if (!showIOSBanner && !showStandardBanner) {
    return null;
  }

  // Don't show banner if auto-closed
  if (isHidden) {
    return null;
  }

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

  // iOS Install Banner (Manual Instructions)
  if (showIOSBanner) {
    return (
      <>
        {/* Blur/Glass Overlay - Mobile Only - Click to dismiss */}
        <div
          className="fixed inset-0 z-[100] sm:hidden backdrop-blur-md bg-black/30"
          onClick={() => handleDismiss(false)}
          role="presentation"
        />

        {/* Arrow pointing to top right - Mobile Only */}
        <div className="fixed top-4 right-4 z-[102] sm:hidden">
          <svg
            width="80"
            height="120"
            viewBox="0 0 300 300"
            className="text-accent dark:text-accent"
            style={{
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
            }}
          >
            <g transform="translate(0,300) scale(0.100000,-0.100000)">
              <path
                d="M1666 2993 c-33 -9 -632 -230 -654 -242 -32 -17 -52 -52 -52 -89 0 -46 46 -92 93 -92 26 0 304 96 451 156 16 6 15 1 -8 -37 -64 -102 -208 -415 -254 -550 -164 -479 -175 -915 -32 -1341 77 -231 213 -467 378 -653 103 -116 133 -138 190 -138 59 0 92 34 92 95 0 38 -6 47 -59 97 -231 220 -405 543 -473 883 -31 152 -33 479 -4 633 28 151 79 329 136 472 48 120 208 443 220 443 3 0 41 -97 84 -216 84 -226 106 -264 161 -264 56 0 105 47 105 99 0 34 -256 702 -276 721 -21 20 -68 31 -98 23z m62 -46 c20 -22 256 -625 268 -687 5 -21 0 -32 -20 -48 -31 -24 -61 -19 -83 14 -8 13 -46 105 -84 206 -38 100 -77 190 -86 200 -40 44 -76 10 -162 -154 -194 -368 -291 -727 -291 -1076 0 -281 54 -510 181 -767 80 -163 169 -291 292 -421 48 -52 87 -102 87 -113 0 -11 -11 -32 -24 -48 -23 -26 -25 -27 -51 -13 -41 22 -186 181 -260 285 -165 231 -267 478 -322 775 -27 151 -25 476 6 645 51 284 148 551 315 865 51 96 54 110 27 134 -23 21 -13 24 -269 -70 -96 -35 -185 -64 -198 -64 -35 0 -60 43 -45 76 13 30 6 27 339 148 145 53 280 105 300 116 48 25 54 25 80 -3z"
                fill="currentColor"
                stroke="none"
              />
            </g>
          </svg>
        </div>

        {/* Auto-close countdown - Mobile Only */}
        <div className="fixed top-4 left-4 z-[102] sm:hidden">
          <div className="bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
            Will automatically close in {countdown} seconds
          </div>
        </div>

        <div
          className="fixed top-60 left-4 right-4 z-[101] bg-secondary rounded-lg p-4 md:left-auto md:right-4 md:max-w-md md:bottom-4 md:z-50"
          style={{
            boxShadow: 'var(--shadow-strong)',
            border: '1px solid var(--bg-quaternary)',
          }}
        >
          {/* Mobile Layout: Stacked */}
          <div className="flex flex-col gap-3 sm:hidden">
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
                  Tap Share{' '}
                  <span className="inline-flex items-center mx-1">
                    {isIOS() ? (
                      // iOS Share Icon
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-accent"
                      >
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                      </svg>
                    ) : (
                      // Android Share Icon
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-accent"
                      >
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                      </svg>
                    )}
                  </span>{' '}
                  then &quot;Add to Home Screen&quot;
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDismiss(false)}
                className="text-xs flex-1"
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={() => handleDismiss(false)}
                className="text-xs flex-1"
              >
                Got it
              </Button>
            </div>
          </div>

          {/* Desktop/Tablet Layout: Horizontal */}
          <div className="hidden sm:flex items-start gap-3">
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
                Tap Share{' '}
                <span className="inline-flex items-center mx-1">
                  {isIOS() ? (
                    // iOS Share Icon
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-accent"
                    >
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                    </svg>
                  ) : (
                    // Android Share Icon
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-accent"
                    >
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                    </svg>
                  )}
                </span>{' '}
                then &quot;Add to Home Screen&quot;
              </p>
            </div>

            <div className="flex items-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDismiss(false)}
                className="text-xs"
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Blur/Glass Overlay - Mobile Only - Click to dismiss */}
      <div
        className="fixed inset-0 z-[100] sm:hidden backdrop-blur-md bg-black/30"
        onClick={() => handleDismiss(false)}
        role="presentation"
      />

      {/* Arrow pointing to top right - Mobile Only */}
      <div className="fixed top-4 right-4 z-[102] sm:hidden">
        <svg
          width="80"
          height="120"
          viewBox="0 0 300 300"
          className="text-accent dark:text-accent"
          style={{
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
          }}
        >
          <g transform="translate(0,300) scale(0.100000,-0.100000)">
            <path
              d="M1666 2993 c-33 -9 -632 -230 -654 -242 -32 -17 -52 -52 -52 -89 0 -46 46 -92 93 -92 26 0 304 96 451 156 16 6 15 1 -8 -37 -64 -102 -208 -415 -254 -550 -164 -479 -175 -915 -32 -1341 77 -231 213 -467 378 -653 103 -116 133 -138 190 -138 59 0 92 34 92 95 0 38 -6 47 -59 97 -231 220 -405 543 -473 883 -31 152 -33 479 -4 633 28 151 79 329 136 472 48 120 208 443 220 443 3 0 41 -97 84 -216 84 -226 106 -264 161 -264 56 0 105 47 105 99 0 34 -256 702 -276 721 -21 20 -68 31 -98 23z m62 -46 c20 -22 256 -625 268 -687 5 -21 0 -32 -20 -48 -31 -24 -61 -19 -83 14 -8 13 -46 105 -84 206 -38 100 -77 190 -86 200 -40 44 -76 10 -162 -154 -194 -368 -291 -727 -291 -1076 0 -281 54 -510 181 -767 80 -163 169 -291 292 -421 48 -52 87 -102 87 -113 0 -11 -11 -32 -24 -48 -23 -26 -25 -27 -51 -13 -41 22 -186 181 -260 285 -165 231 -267 478 -322 775 -27 151 -25 476 6 645 51 284 148 551 315 865 51 96 54 110 27 134 -23 21 -13 24 -269 -70 -96 -35 -185 -64 -198 -64 -35 0 -60 43 -45 76 13 30 6 27 339 148 145 53 280 105 300 116 48 25 54 25 80 -3z"
              fill="currentColor"
              stroke="none"
            />
          </g>
        </svg>
      </div>

      {/* Auto-close countdown - Mobile Only */}
      <div className="fixed top-4 left-4 z-[102] sm:hidden">
        <div className="bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
          Will automatically close in {countdown} seconds
        </div>
      </div>

      <div
        className="fixed top-60 left-4 right-4 z-[101] bg-secondary rounded-lg p-4 md:left-auto md:right-4 md:max-w-md md:bottom-4 md:z-50"
        style={{
          boxShadow: 'var(--shadow-strong)',
          border: '1px solid var(--bg-quaternary)',
        }}
      >
        {/* Mobile Layout: Stacked */}
        <div className="flex flex-col gap-3 sm:hidden">
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
                Install this app on your device for a better experience and
                offline access.
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDismiss(false)}
              className="text-xs flex-1"
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={handleInstall}
              className="text-xs flex-1"
            >
              Install
            </Button>
          </div>
        </div>

        {/* Desktop/Tablet Layout: Horizontal */}
        <div className="hidden sm:flex items-start gap-3">
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
              Install this app on your device for a better experience and
              offline access.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDismiss(false)}
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
    </>
  );
}

// PWA Offline Banner Component
export function PWAOfflineBanner() {
  const { status } = usePWA();

  if (status.isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-warning text-white px-4 py-2 text-center text-sm font-medium">
      <div className="flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-white" />
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
          className="w-full bg-accent text-white px-2 py-2 rounded text-xs disabled:bg-surface"
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
          className="w-full bg-success text-white px-2 py-2 rounded text-xs"
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
          className="w-full bg-warning text-white px-2 py-2 rounded text-xs"
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
          className="w-full bg-info text-white px-2 py-2 rounded text-xs"
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
