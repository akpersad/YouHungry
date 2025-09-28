import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a test query client with different defaults for testing
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
        gcTime: 0, // Don't cache in tests
        staleTime: 0, // Always stale in tests
      },
      mutations: {
        retry: false, // Don't retry in tests
      },
    },
  });
}

// Wrapper component for testing components that use TanStack Query
export function TestQueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Helper to render components with TanStack Query provider
import { render } from '@testing-library/react';

export function renderWithQueryClient(ui: React.ReactElement) {
  return {
    ...render(ui, {
      wrapper: TestQueryProvider,
    }),
  };
}
