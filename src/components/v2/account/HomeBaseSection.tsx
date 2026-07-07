'use client';

import { useState, type FormEvent } from 'react';
import { Button, Input } from '@/components/v2/ui';

/**
 * The search anchor ("home base") form. Saving geocodes the typed address
 * server-side and stores only Google's normalized label + point; searches
 * then answer with the McDonald's near you instead of the famous one three
 * states away. Frame register like the rest of the account page.
 */
export function HomeBaseSection({
  initialLabel,
}: {
  initialLabel: string | null;
}) {
  const [savedLabel, setSavedLabel] = useState(initialLabel);
  const [address, setAddress] = useState(initialLabel ?? '');
  const [busy, setBusy] = useState<'save' | 'clear' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const patch = async (body: { address: string | null }) => {
    const response = await fetch('/api/v2/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error ?? 'save failed');
    return payload.account.searchAnchorLabel as string | null;
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = address.trim();
    if (busy || trimmed === '' || trimmed === savedLabel) return;
    setError(null);
    setSuccess(null);
    setBusy('save');
    try {
      const label = await patch({ address: trimmed });
      setSavedLabel(label);
      setAddress(label ?? '');
      setSuccess('Saved. Searches now start from here.');
    } catch (err) {
      setError(
        err instanceof Error && err.message !== 'save failed'
          ? err.message
          : 'Could not save that address. Try again.'
      );
    } finally {
      setBusy(null);
    }
  };

  const clear = async () => {
    if (busy) return;
    setError(null);
    setSuccess(null);
    setBusy('clear');
    try {
      await patch({ address: null });
      setSavedLabel(null);
      setAddress('');
      setSuccess('Cleared. Searches are unanchored now.');
    } catch {
      setError('Could not clear it. Try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <form
      onSubmit={save}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
    >
      <Input
        label="Home base"
        autoComplete="street-address"
        value={address}
        onChange={(event) => {
          setAddress(event.target.value);
          setSuccess(null);
        }}
        error={error ?? undefined}
        success={success ?? undefined}
        help="Anchors restaurant search near you. A city and state is enough; a street address is sharper."
      />
      <div className="flex gap-2">
        <Button
          variant="quiet"
          size="sm"
          type="submit"
          loading={busy === 'save'}
          disabled={
            busy !== null ||
            address.trim() === '' ||
            address.trim() === savedLabel
          }
        >
          Save home base
        </Button>
        {savedLabel !== null && (
          <Button
            variant="quiet"
            size="sm"
            type="button"
            loading={busy === 'clear'}
            disabled={busy !== null}
            onClick={clear}
          >
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}
