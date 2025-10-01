'use client';

import { logger } from '@/lib/logger';
// PWA Hook for managing Progressive Web App features
import { useState, useEffect, useCallback } from 'react';
import { offlineStorage, OfflineAction } from '@/lib/offline-storage';

export interface PWAStatus {
  isOnline: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  isServiceWorkerReady: boolean;
  offlineActionsCount: number;
  lastSync: number | null;
}

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [status, setStatus] = useState<PWAStatus>({
    isOnline: true,
    isInstalled: false,
    canInstall: false,
    isServiceWorkerReady: false,
    offlineActionsCount: 0,
    lastSync: null,
  });

  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null
  );

  // Check if app is installed
  const checkInstallStatus = useCallback(() => {
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as Record<string, unknown>).standalone ===
        true ||
      Boolean(
        document.referrer && document.referrer.includes('android-app://')
      );

    setStatus((prev) => ({ ...prev, isInstalled }));
  }, []);

  // Check service worker status
  const checkServiceWorkerStatus = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const isReady = Boolean(registration && registration.active);

        setStatus((prev) => ({
          ...prev,
          isServiceWorkerReady: isReady,
        }));
      } catch (error) {
        // Service worker check failed - this is expected on some browsers/iOS
        logger.error('Failed to check service worker status:', error);
      }
    }
  }, []);

  // Check offline actions count
  const checkOfflineActions = useCallback(async () => {
    try {
      const syncStatus = await offlineStorage.getSyncStatus();
      setStatus((prev) => ({
        ...prev,
        offlineActionsCount: syncStatus.pendingActions,
        lastSync: syncStatus.lastSync,
      }));
    } catch (error) {
      logger.error('Failed to check offline actions:', error);
    }
  }, []);

  // Handle install prompt
  const handleInstallPrompt = useCallback((e: Event) => {
    e.preventDefault();
    setInstallPrompt(e as InstallPromptEvent);
    setStatus((prev) => ({ ...prev, canInstall: true }));
  }, []);

  // Install the app
  const installApp = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setStatus((prev) => ({
          ...prev,
          isInstalled: true,
          canInstall: false,
        }));
        setInstallPrompt(null);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to install app:', error);
      return false;
    }
  }, [installPrompt]);

  // Sync offline actions
  const syncOfflineActions = useCallback(async (): Promise<boolean> => {
    try {
      const actions = await offlineStorage.getAllOfflineActions();
      const pendingActions = actions.filter((a) => a.retryCount < a.maxRetries);

      let allSuccessful = true;

      for (const action of pendingActions) {
        try {
          const response = await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.data ? JSON.stringify(action.data) : undefined,
          });

          if (response.ok) {
            await offlineStorage.removeOfflineAction(action.id);
          } else {
            allSuccessful = false;
            await offlineStorage.updateOfflineAction(action.id, {
              retryCount: action.retryCount + 1,
            });
          }
        } catch (error) {
          logger.error(`Failed to sync action ${action.id}:`, error);
          allSuccessful = false;
          await offlineStorage.updateOfflineAction(action.id, {
            retryCount: action.retryCount + 1,
          });
        }
      }

      // Update status after sync
      await checkOfflineActions();

      return allSuccessful;
    } catch (error) {
      logger.error('Failed to sync offline actions:', error);
      return false;
    }
  }, [checkOfflineActions]);

  // Queue offline action
  const queueOfflineAction = useCallback(
    async (
      type: OfflineAction['type'],
      data: Record<string, unknown>,
      url: string,
      method: string = 'POST',
      headers: Record<string, string> = { 'Content-Type': 'application/json' }
    ): Promise<void> => {
      try {
        await offlineStorage.saveOfflineAction({
          type,
          data,
          url,
          method,
          headers,
          createdAt: Date.now(),
          retryCount: 0,
          maxRetries: 3,
        });

        await checkOfflineActions();
      } catch (error) {
        logger.error('Failed to queue offline action:', error);
      }
    },
    [checkOfflineActions]
  );

  // Check online/offline status
  const updateOnlineStatus = useCallback(() => {
    const isOnline = navigator.onLine;
    setStatus((prev) => ({ ...prev, isOnline }));

    // Sync when coming back online
    if (isOnline && status.offlineActionsCount > 0) {
      syncOfflineActions();
    }
  }, [status.offlineActionsCount, syncOfflineActions]);

  // Initialize PWA features
  useEffect(() => {
    // Check initial status
    checkInstallStatus();
    checkServiceWorkerStatus();
    checkOfflineActions();

    // Set up event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setStatus((prev) => ({ ...prev, isInstalled: true, canInstall: false }));
      setInstallPrompt(null);
    });

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        checkServiceWorkerStatus
      );
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener(
          'controllerchange',
          checkServiceWorkerStatus
        );
      }
    };
  }, [
    checkInstallStatus,
    checkServiceWorkerStatus,
    checkOfflineActions,
    updateOnlineStatus,
    handleInstallPrompt,
  ]);

  // Periodic sync when online
  useEffect(() => {
    if (!status.isOnline || status.offlineActionsCount === 0) return;

    const interval = setInterval(() => {
      syncOfflineActions();
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(interval);
  }, [status.isOnline, status.offlineActionsCount, syncOfflineActions]);

  return {
    status,
    installApp,
    syncOfflineActions,
    queueOfflineAction,
    canInstall: status.canInstall && !!installPrompt,
  };
}
