'use client';

import { useState, type FormEvent } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button, Input } from '@/components/v2/ui';
import { clerkErrorMessage } from '@/components/v2/auth/clerk-errors';

/**
 * Email change, custom-flow style (the sign-up form's inline email_code
 * step, reused): add the new address via Clerk, verify it with a six-digit
 * code, make it primary, drop the old one. Clerk sends and checks the
 * code, so ownership of the new inbox is proven before anything switches.
 * A PATCH with an empty body mirrors the result into Mongo immediately
 * instead of waiting on the webhook.
 */
export function EmailSection({ initialEmail }: { initialEmail: string }) {
  const { isLoaded, user } = useUser();

  const [email, setEmail] = useState(initialEmail);
  const [step, setStep] = useState<'closed' | 'address' | 'verify'>('closed');
  const [newEmail, setNewEmail] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep('closed');
    setNewEmail('');
    setPendingId(null);
    setCode('');
    setError(null);
  };

  const handleAddress = async (event: FormEvent) => {
    event.preventDefault();
    if (!isLoaded || !user || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const created = await user.createEmailAddress({ email: newEmail });
      await created.prepareVerification({ strategy: 'email_code' });
      setPendingId(created.id);
      setStep('verify');
    } catch (err) {
      setError(
        clerkErrorMessage(err, 'Could not start the email change. Try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    if (!isLoaded || !user || submitting) return;
    const pending = user.emailAddresses.find((item) => item.id === pendingId);
    if (!pending) {
      setError('That change request expired. Start again.');
      setStep('address');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await pending.attemptVerification({ code });
      await user.update({ primaryEmailAddressId: pending.id });
      // The old address goes away so sign-in stays one identifier.
      await Promise.all(
        user.emailAddresses
          .filter((item) => item.id !== pending.id)
          .map((item) => item.destroy().catch(() => undefined))
      );
      // Mirror into Mongo now; the webhook confirms later.
      await fetch('/api/v2/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch(() => undefined);
      setEmail(pending.emailAddress);
      setSuccess('Email updated. Use it next time you sign in.');
      reset();
    } catch (err) {
      setError(clerkErrorMessage(err, 'That code did not verify. Try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Email</p>
          <p className="truncate text-ink-secondary">{email}</p>
        </div>
        {step === 'closed' && (
          <Button
            variant="quiet"
            size="sm"
            disabled={!isLoaded}
            onClick={() => {
              setSuccess(null);
              setStep('address');
            }}
          >
            Change email
          </Button>
        )}
      </div>

      {success && step === 'closed' && (
        <p role="status" className="text-sm text-ink">
          {success}
        </p>
      )}

      {step === 'address' && (
        <form onSubmit={handleAddress} className="flex flex-col gap-3">
          <Input
            label="New email"
            type="email"
            autoComplete="email"
            required
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            help="We send a six-digit code there first."
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
              Send the code
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>
              Never mind
            </Button>
          </div>
        </form>
      )}

      {step === 'verify' && (
        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          <Input
            label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            help={`Sent to ${newEmail}.`}
            className="font-mono"
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
              Verify and switch
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
