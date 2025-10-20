'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { logger } from '@/lib/logger';

export interface PullToRefreshOptions {
  /**
   * Minimum distance to pull before triggering refresh (in pixels)
   * @default 80
   */
  threshold?: number;

  /**
   * Maximum distance the indicator can be pulled (in pixels)
   * @default 120
   */
  maxPullDistance?: number;

  /**
   * Only enable on installed PWAs
   * @default true
   */
  pwaOnly?: boolean;

  /**
   * Only enable on mobile devices
   * @default true
   */
  mobileOnly?: boolean;

  /**
   * Custom refresh function (if not provided, uses window.location.reload)
   */
  onRefresh?: () => Promise<void> | void;

  /**
   * Callback when pull starts
   */
  onPullStart?: () => void;

  /**
   * Callback when pull ends
   */
  onPullEnd?: () => void;
}

export interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
  isEnabled: boolean;
}

/**
 * Hook to implement pull-to-refresh functionality
 * Designed for PWA mobile apps
 */
export function usePullToRefresh(options: PullToRefreshOptions = {}) {
  const {
    threshold = 80,
    maxPullDistance = 120,
    pwaOnly = true,
    mobileOnly = true,
    onRefresh,
    onPullStart,
    onPullEnd,
  } = options;

  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    isEnabled: false,
  });

  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const pullDistance = useRef<number>(0);

  // Check if pull-to-refresh should be enabled
  const checkIfEnabled = useCallback(() => {
    let enabled = true;

    // Check if PWA
    if (pwaOnly) {
      const isPWA =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as Record<string, unknown>).standalone ===
          true ||
        Boolean(
          document.referrer && document.referrer.includes('android-app://')
        );

      if (!isPWA) {
        enabled = false;
      }
    }

    // Check if mobile
    if (mobileOnly && enabled) {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768;

      if (!isMobile) {
        enabled = false;
      }
    }

    setState((prev) => ({ ...prev, isEnabled: enabled }));
    return enabled;
  }, [pwaOnly, mobileOnly]);

  // Handle refresh action
  const handleRefresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isRefreshing: true }));

    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        // Force a hard reload to get fresh content
        window.location.reload();
      }
    } catch (error) {
      logger.error('Pull-to-refresh failed:', error);
    } finally {
      setState((prev) => ({
        ...prev,
        isRefreshing: false,
        isPulling: false,
        pullDistance: 0,
      }));
    }
  }, [onRefresh]);

  // Touch start handler
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      // Don't trigger if modal is open
      const hasOpenModal = document.querySelector('.modal-overlay');
      if (hasOpenModal) return;

      // Only trigger if we're at the top of the page
      if (window.scrollY > 0) return;

      // Only trigger if scrolling container is at the top
      const target = e.target as HTMLElement;
      const scrollableParent = target.closest(
        '[data-scrollable]'
      ) as HTMLElement;
      if (scrollableParent && scrollableParent.scrollTop > 0) return;

      touchStartY.current = e.touches[0].clientY;
      touchCurrentY.current = touchStartY.current;

      onPullStart?.();
    },
    [onPullStart]
  );

  // Touch move handler
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      // Don't trigger if modal is open
      const hasOpenModal = document.querySelector('.modal-overlay');
      if (hasOpenModal) return;

      if (state.isRefreshing) return;

      touchCurrentY.current = e.touches[0].clientY;
      const distance = touchCurrentY.current - touchStartY.current;

      // Only pull down
      if (distance > 0 && window.scrollY === 0) {
        // Prevent default scrolling behavior
        e.preventDefault();

        // Apply resistance - the further you pull, the harder it gets
        const resistance = 2.5;
        const adjustedDistance = Math.min(
          distance / resistance,
          maxPullDistance
        );

        pullDistance.current = adjustedDistance;

        setState((prev) => ({
          ...prev,
          isPulling: true,
          pullDistance: adjustedDistance,
        }));
      }
    },
    [state.isRefreshing, maxPullDistance]
  );

  // Touch end handler
  const handleTouchEnd = useCallback(() => {
    onPullEnd?.();

    const distance = pullDistance.current;

    if (distance >= threshold) {
      handleRefresh();
    } else {
      setState((prev) => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
      }));
    }

    touchStartY.current = 0;
    touchCurrentY.current = 0;
    pullDistance.current = 0;
  }, [threshold, handleRefresh, onPullEnd]);

  // Set up event listeners
  useEffect(() => {
    const enabled = checkIfEnabled();

    if (!enabled) return;

    // Add passive: false to prevent default scrolling during pull
    const options = { passive: false };

    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [checkIfEnabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Re-check enabled status on window events
  useEffect(() => {
    checkIfEnabled();

    window.addEventListener('resize', checkIfEnabled);

    return () => {
      window.removeEventListener('resize', checkIfEnabled);
    };
  }, [checkIfEnabled]);

  return {
    ...state,
    refresh: handleRefresh,
  };
}
