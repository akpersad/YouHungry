'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/v2/ui';

/**
 * The one action on the invite landing page. An explicit tap, not an
 * auto-join on load: joining changes what other people see on their list,
 * so the person says so. Success goes straight to the list.
 */
export function JoinList({ token }: { token: string }) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    if (joining) return;
    setJoining(true);
    setError(null);
    try {
      const response = await fetch('/api/v2/lists/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? 'join failed');
      }
      router.push(`/places/l/${payload.list.id}`);
      router.refresh();
    } catch (err) {
      setJoining(false);
      setError(
        err instanceof Error && err.message !== 'join failed'
          ? err.message
          : 'Could not join the list. Try again.'
      );
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div>
        <Button loading={joining} onClick={join}>
          Join this list
        </Button>
      </div>
    </div>
  );
}
