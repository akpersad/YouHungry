'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a new QueryClient instance for each user session
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Time before data is considered stale (5 minutes for most data)
            staleTime: 5 * 60 * 1000,
            // Time before unused data is garbage collected (10 minutes)
            gcTime: 10 * 60 * 1000,
            // Retry failed requests up to 3 times with exponential backoff
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors (client errors)
              if (
                error instanceof Error &&
                'status' in error &&
                typeof error.status === 'number'
              ) {
                if (error.status >= 400 && error.status < 500) {
                  return false;
                }
              }
              return failureCount < 3;
            },
            // Retry delay with exponential backoff
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus for critical data
            refetchOnWindowFocus: false,
            // Refetch on reconnect
            refetchOnReconnect: true,
            // Don't refetch in background to reduce API calls
            refetchIntervalInBackground: false,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
            // Retry delay for mutations
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
          position="bottom"
        />
      )}
    </QueryClientProvider>
  );
}
