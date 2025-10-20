'use client';

/**
 * Global Error Page
 *
 * Catches errors at the root level and provides recovery options
 */

import { useEffect, useState } from 'react';
import { RefreshCw, Home, MessageSquare } from 'lucide-react';
import { Mascot } from '@/components/errors/Mascot';
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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Mascot */}
        <div className="flex justify-center">
          <Mascot pose="sad" size={250} />
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold">Oops! Something went wrong</h1>
          <p className="text-lg">
            Nibbles is sad because something unexpected happened.
            <br />
            Don&apos;t worry, our team has been notified and is working on a
            fix!
          </p>
        </div>

        {/* Development Error Details */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm font-medium mb-2">
              Error Details (Development Only)
            </summary>
            <pre
              className="text-xs p-4 rounded-lg overflow-auto max-h-60"
              style={{
                background: 'var(--bg-secondary)',
              }}
            >
              {error.message}
              {'\n\n'}
              {error.stack}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button onClick={reset} variant="primary" className="min-w-[200px]">
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Again
          </Button>

          <Button
            onClick={() => (window.location.href = '/')}
            variant="secondary"
            className="min-w-[200px]"
          >
            <Home className="h-5 w-5 mr-2" />
            Go to Home
          </Button>
        </div>

        {/* Report Issue */}
        <button
          onClick={() => setShowReportModal(true)}
          className="inline-flex items-center gap-2 text-sm transition-colors hover:text-accent-primary"
        >
          <MessageSquare className="h-4 w-4" />
          Report this issue and help us improve
        </button>

        {/* Encouraging Message */}
        <div
          className="mt-8 p-4 rounded-lg"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <p className="text-sm">
            🍔 We&apos;re constantly improving! Your feedback helps us make the
            app better for everyone.
          </p>
        </div>
      </div>

      {showReportModal && (
        <ReportIssueModal
          error={error}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
