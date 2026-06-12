'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function HistoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} surface="history" />;
}
