'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface ShortenUrlOptions {
  url: string;
  expiresInDays?: number;
}

export interface ShortenUrlResult {
  success: boolean;
  originalUrl?: string;
  shortUrl?: string;
  error?: string;
}

export function useURLShortener() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shortenUrl = useCallback(
    async (options: ShortenUrlOptions): Promise<ShortenUrlResult> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/shorten', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to shorten URL');
        }

        return {
          success: true,
          originalUrl: data.originalUrl,
          shortUrl: data.shortUrl,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        logger.error('URL shortening error:', err);
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    shortenUrl,
  };
}
