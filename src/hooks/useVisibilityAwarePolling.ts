import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook for visibility-aware polling that reduces frequency when tab is inactive
 * This helps reduce server load and API costs
 */
export function useVisibilityAwarePolling(
  callback: () => void,
  activeInterval: number = 300000, // 5 minutes when active
  inactiveInterval: number = 900000, // 15 minutes when inactive
  enabled: boolean = true
) {
  const [isVisible, setIsVisible] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);

      // Restart interval with new frequency
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (enabled) {
        const interval = visible ? activeInterval : inactiveInterval;
        intervalRef.current = setInterval(() => {
          callbackRef.current();
        }, interval);
      }
    };

    // Set initial visibility
    setIsVisible(!document.hidden);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start initial interval
    if (enabled) {
      const interval = !document.hidden ? activeInterval : inactiveInterval;
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, interval);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeInterval, inactiveInterval, enabled]);

  // Handle enabled/disabled state
  useEffect(() => {
    if (!enabled && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else if (enabled && !intervalRef.current) {
      const interval = isVisible ? activeInterval : inactiveInterval;
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, interval);
    }
  }, [enabled, isVisible, activeInterval, inactiveInterval]);

  return { isVisible };
}

/**
 * Hook for smart polling with exponential backoff on errors
 */
export function useSmartPolling(
  callback: () => Promise<void>,
  baseInterval: number = 300000, // 5 minutes
  maxInterval: number = 1800000, // 30 minutes
  enabled: boolean = true
) {
  const [errorCount, setErrorCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const executeCallback = useCallback(async () => {
    try {
      await callbackRef.current();
      // Reset error count on success
      if (errorCount > 0) {
        setErrorCount(0);
      }
    } catch (error) {
      console.warn('Polling error:', error);
      setErrorCount((prev) => prev + 1);
    }
  }, [errorCount]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Calculate interval with exponential backoff
    const backoffMultiplier = Math.min(Math.pow(2, errorCount), 6); // Max 6x backoff
    const currentInterval = Math.min(
      baseInterval * backoffMultiplier,
      maxInterval
    );

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(executeCallback, currentInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, errorCount, baseInterval, maxInterval, executeCallback]);

  return { errorCount, resetErrors: () => setErrorCount(0) };
}
