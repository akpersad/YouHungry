'use client';

/**
 * Error Fallback UI
 *
 * Displays a user-friendly error message with recovery options
 */

import { useState } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReportIssueModal } from './ReportIssueModal';

interface ErrorFallbackProps {
  error: Error | null;
  level: 'root' | 'route' | 'component';
  onReset?: () => void;
}

export function ErrorFallback({ error, level, onReset }: ErrorFallbackProps) {
  const [showReportModal, setShowReportModal] = useState(false);

  const handleRefresh = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  // Different messages based on error level
  const getTitle = () => {
    switch (level) {
      case 'root':
        return 'Oops! Something went wrong';
      case 'route':
        return 'This page encountered an error';
      case 'component':
        return 'This section encountered an error';
      default:
        return 'An error occurred';
    }
  };

  const getMessage = () => {
    switch (level) {
      case 'root':
        return "We're sorry, but the app encountered an unexpected error. Our team has been notified and is working on a fix.";
      case 'route':
        return "This page couldn't load properly. Try refreshing or going back to the home page.";
      case 'component':
        return "This section couldn't load. You can continue using the rest of the app.";
      default:
        return 'Please try again or contact support if the problem persists.';
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center p-8 rounded-lg"
      style={{
        background: 'var(--bg-secondary)',
        minHeight:
          level === 'root' ? '100vh' : level === 'route' ? '50vh' : '200px',
      }}
    >
      <div className="flex flex-col items-center max-w-md text-center space-y-6">
        <div
          className="p-4 rounded-full"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <AlertTriangle
            className="h-12 w-12"
            style={{ color: 'var(--accent-primary)' }}
          />
        </div>

        <div className="space-y-2">
          <h2
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {getTitle()}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>{getMessage()}</p>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="w-full text-left">
            <summary
              className="cursor-pointer text-sm font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Error Details (Development Only)
            </summary>
            <pre
              className="text-xs p-3 rounded overflow-auto max-h-40"
              style={{
                background: 'var(--bg-quaternary)',
                color: 'var(--text-secondary)',
              }}
            >
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button onClick={handleRefresh} className="flex-1" variant="primary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          {level !== 'component' && (
            <Button
              onClick={handleGoHome}
              className="flex-1"
              variant="secondary"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="text-sm transition-colors flex items-center gap-1 hover:text-accent-primary"
          style={{ color: 'var(--text-light)' }}
        >
          <MessageSquare className="h-4 w-4" />
          Report this issue
        </button>
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
