'use client';

import { useEffect } from 'react';
import { RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';
import { logClientError } from '@/lib/error-tracking-client';

interface ErrorStateProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Surface name for error tracking, e.g. "dashboard" */
  surface: string;
  title?: string;
  message?: string;
}

/**
 * In-segment error panel for route-level error.tsx boundaries.
 * Unlike the root error page, this renders inside the app shell so
 * navigation stays usable when one surface crashes.
 */
export function ErrorState({
  error,
  reset,
  surface,
  title = 'Something went wrong',
  message = 'This section hit a snag. Your data is safe — try reloading it.',
}: ErrorStateProps) {
  useEffect(() => {
    logClientError(error, {
      digest: error.digest,
      page: `${surface}-error`,
    });
  }, [error, surface]);

  return (
    <div className="flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-primary">{title}</h2>
          <p className="text-secondary">{message}</p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm font-medium mb-2">
              Error Details (Development Only)
            </summary>
            <pre
              className="text-xs p-4 rounded-lg overflow-auto max-h-48"
              style={{ background: 'var(--bg-secondary)' }}
            >
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="primary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = '/dashboard')}
            variant="secondary"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
