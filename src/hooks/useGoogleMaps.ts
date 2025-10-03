'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface GoogleMapsState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  loadGoogleMaps: () => Promise<void>;
}

// Global state to track if Google Maps is already loaded
let googleMapsLoaded = false;
let googleMapsLoading = false;
let googleMapsError: string | null = null;

export function useGoogleMaps(): GoogleMapsState {
  const [isLoaded, setIsLoaded] = useState(googleMapsLoaded);
  const [isLoading, setIsLoading] = useState(googleMapsLoading);
  const [error, setError] = useState(googleMapsError);

  const loadGoogleMaps = useCallback(async (): Promise<void> => {
    // If already loaded, return immediately
    if (googleMapsLoaded) {
      setIsLoaded(true);
      return;
    }

    // If already loading, wait for it
    if (googleMapsLoading) {
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (googleMapsLoaded) {
            setIsLoaded(true);
            resolve();
          } else if (googleMapsError) {
            setError(googleMapsError);
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }

    // Start loading
    googleMapsLoading = true;
    setIsLoading(true);
    setError(null);

    try {
      // Check if Google Maps is already available globally
      if (typeof window !== 'undefined' && window.google?.maps) {
        googleMapsLoaded = true;
        googleMapsLoading = false;
        setIsLoaded(true);
        setIsLoading(false);
        return;
      }

      // Load Google Maps script dynamically
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;

      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          googleMapsLoaded = true;
          googleMapsLoading = false;
          setIsLoaded(true);
          setIsLoading(false);
          logger.debug('Google Maps loaded successfully');
          resolve();
        };

        script.onerror = (error) => {
          const errorMessage = 'Failed to load Google Maps API';
          googleMapsError = errorMessage;
          googleMapsLoading = false;
          setError(errorMessage);
          setIsLoading(false);
          logger.error('Google Maps loading failed:', error);
          reject(new Error(errorMessage));
        };

        document.head.appendChild(script);
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Unknown error loading Google Maps';
      googleMapsError = errorMessage;
      googleMapsLoading = false;
      setError(errorMessage);
      setIsLoading(false);
      logger.error('Google Maps loading error:', err);
    }
  }, []);

  return {
    isLoaded,
    isLoading,
    error,
    loadGoogleMaps,
  };
}
