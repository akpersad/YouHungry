'use client';

import { useState, type FormEvent } from 'react';
import { Button, Input } from '@/components/v2/ui';

/**
 * Password change through the server (Clerk verifies the current password
 * there, then swaps it and revokes other sessions). Collapsed by default:
 * an open password form on every visit reads like a nag.
 */
export function PasswordSection() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/v2/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? 'change failed');
      }
      setSuccess('Password updated. Other devices are signed out.');
      reset();
    } catch (err) {
      setError(
        err instanceof Error && err.message !== 'change failed'
          ? err.message
          : 'Could not update your password. Try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Password</p>
          <p className="text-ink-secondary">••••••••</p>
        </div>
        {!open && (
          <Button
            variant="quiet"
            size="sm"
            onClick={() => {
              setSuccess(null);
              setOpen(true);
            }}
          >
            Change password
          </Button>
        )}
      </div>

      {success && !open && (
        <p role="status" className="text-sm text-ink">
          {success}
        </p>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            help="At least 8 characters."
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="quiet"
              size="sm"
              type="submit"
              loading={submitting}
            >
              Update password
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>
              Never mind
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
