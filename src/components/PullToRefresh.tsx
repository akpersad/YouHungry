'use client';

import {
  usePullToRefresh,
  PullToRefreshOptions,
} from '@/hooks/usePullToRefresh';
import { useEffect, useState } from 'react';

interface PullToRefreshProps extends PullToRefreshOptions {
  children?: React.ReactNode;
}

/**
 * Pull-to-refresh component for PWA mobile apps
 * Follows Twitter-style UI pattern with content displacement
 */
export function PullToRefresh({ children, ...options }: PullToRefreshProps) {
  const { isPulling, pullDistance, isRefreshing, isEnabled } =
    usePullToRefresh(options);
  const [showIndicator, setShowIndicator] = useState(false);

  // Show/hide indicator based on state
  useEffect(() => {
    if (isPulling || isRefreshing) {
      setShowIndicator(true);
    } else {
      // Delay hiding to allow animation to complete
      const timeout = setTimeout(() => setShowIndicator(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isPulling, isRefreshing]);

  if (!isEnabled) {
    return <>{children}</>;
  }

  // Calculate progress and text based on pull distance
  const threshold = options.threshold || 80;
  const progress = Math.min(pullDistance / threshold, 1);

  // Determine text and icon based on state
  let text = 'Pull down to refresh...';
  let icon = 'down';

  if (isRefreshing) {
    text = 'Loading...';
    icon = 'loading';
  } else if (progress >= 1) {
    text = 'Release to refresh...';
    icon = 'up';
  }

  return (
    <div className="pull-to-refresh-container">
      {/* Pull-to-refresh indicator - positioned above content */}
      {showIndicator && (
        <div
          className="pull-to-refresh-indicator"
          style={{
            height: `${Math.max(pullDistance, 60)}px`,
            opacity: isRefreshing ? 1 : Math.min(progress * 2, 1),
          }}
        >
          <div className="pull-to-refresh-content">
            {/* Icon */}
            <div className="pull-to-refresh-icon">
              {icon === 'down' && (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              )}
              {icon === 'up' && (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="18,15 12,9 6,15" />
                </svg>
              )}
              {icon === 'loading' && (
                <div className="pull-to-refresh-loading-spinner">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                </div>
              )}
            </div>

            {/* Text */}
            <div className="pull-to-refresh-text">{text}</div>
          </div>
        </div>
      )}

      {/* Content - moves down when pulling */}
      <div
        className="pull-to-refresh-content-wrapper"
        style={{
          transform: `translateY(${showIndicator ? Math.max(pullDistance, 60) : 0}px)`,
          transition: showIndicator
            ? 'none'
            : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
