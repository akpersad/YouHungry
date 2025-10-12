'use client';

/**
 * Error Boundary Component
 *
 * React Error Boundary that catches errors in child components,
 * logs them to our error tracking system, and displays a fallback UI.
 */

import { Component, ReactNode } from 'react';
import { logClientError } from '@/lib/error-tracking-client';
import { ErrorFallback } from './ErrorFallback';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'root' | 'route' | 'component';
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // Log error to tracking system
    logClientError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundaryLevel: this.props.level || 'component',
    });

    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          level={this.props.level || 'component'}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
