'use client';

/**
 * Global Error Page
 *
 * Catches errors at the root level and provides recovery options
 */

import { useEffect, useState } from 'react';
import { RefreshCw, Home, MessageSquare, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReportIssueModal } from '@/components/errors/ReportIssueModal';
import { logClientError } from '@/lib/error-tracking-client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    // Log error to our tracking system
    logClientError(error, {
      digest: error.digest,
      page: 'root-error',
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <main className="max-w-xl w-full text-center space-y-8">
        <div className="flex justify-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-tomato-tint">
            <UtensilsCrossed className="h-8 w-8 text-tomato" aria-hidden />
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="font-display text-4xl text-ink">
            Something went wrong in the kitchen
          </h1>
          <p className="text-lg text-ink-secondary text-pretty">
            An unexpected error got in the way. It&apos;s been logged — try
            again, and if it keeps happening, let us know.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm font-medium text-ink-secondary mb-2">
              Error details (development only)
            </summary>
            <pre className="text-xs text-ink-secondary bg-surface-sunken border border-border p-4 rounded-lg overflow-auto max-h-60">
              {error.message}
              {'\n\n'}
              {error.stack}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button onClick={reset} variant="primary" className="min-w-[200px]">
            <RefreshCw className="h-5 w-5 mr-2" />
            Try again
          </Button>

          <Button
            onClick={() => (window.location.href = '/')}
            variant="secondary"
            className="min-w-[200px]"
          >
            <Home className="h-5 w-5 mr-2" />
            Go home
          </Button>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-tomato"
        >
          <MessageSquare className="h-4 w-4" />
          Report this issue
        </button>
      </main>

      {showReportModal && (
        <ReportIssueModal
          error={error}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
