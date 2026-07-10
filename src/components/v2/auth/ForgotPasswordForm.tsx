'use client';

import { useState, type FormEvent } from 'react';
// Clerk 7 moved the resource-shape hooks to the legacy entry point; the
// signals API migration is tracked repo-wide (see CustomRegistrationForm).
import { useSignIn } from '@clerk/nextjs/legacy';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/v2/ui';
import { AuthCard } from './AuthCard';
import { clerkErrorMessage } from './clerk-errors';

/**
 * Signed-out password reset, custom-flow style: Clerk emails a six-digit
 * code to the account's address, then code + new password land on one
 * card (two steps total, not three). A successful reset IS a sign-in —
 * the session activates and the ?next= round-trip completes as usual.
 * Other sessions are revoked: a reset usually means the old password is
 * no longer trusted.
 */
export function ForgotPasswordForm({
  nextPath,
  initialIdentifier,
  onBack,
}: {
  nextPath: string;
  initialIdentifier: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!isLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier,
      });
      setStep('reset');
    } catch (err) {
      setError(
        clerkErrorMessage(err, 'Could not start the reset. Check the address.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (event: FormEvent) => {
    event.preventDefault();
    if (!isLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const attempted = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      });
      if (attempted.status !== 'needs_new_password') {
        setError('That code did not verify. Check it and try again.');
        return;
      }
      const result = await signIn.resetPassword({
        password,
        signOutOfOtherSessions: true,
      });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push(nextPath);
        return; // keep the button busy through the redirect
      }
      setError('The reset needs another step this form does not support.');
    } catch (err) {
      setError(
        clerkErrorMessage(err, 'Could not reset the password. Try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'reset') {
    return (
      <AuthCard
        title="Check your email"
        lede="Enter the six-digit code and pick a new password."
      >
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <Input
            label="Reset code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="font-mono"
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            help="At least 8 characters. Other devices get signed out."
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" loading={submitting} className="mt-1">
            Reset and sign in
          </Button>
        </form>
        <button
          type="button"
          onClick={() => {
            setStep('email');
            setCode('');
            setPassword('');
            setError(null);
          }}
          className="tap-target self-start rounded text-sm font-semibold text-brass underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
        >
          Use a different email
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      lede="We email a six-digit code to the address on the account."
    >
      <form onSubmit={handleSend} className="flex flex-col gap-4">
        <Input
          label="Email or username"
          type="text"
          autoComplete="username"
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {/* Until Clerk hydrates, handleSend would silently drop the
            intent — disabled is the honest state for that brief window. */}
        <Button
          type="submit"
          loading={submitting}
          disabled={!isLoaded}
          className="mt-1"
        >
          Send the code
        </Button>
      </form>
      <button
        type="button"
        onClick={onBack}
        className="tap-target self-start rounded text-sm font-semibold text-brass underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
      >
        Back to sign in
      </button>
    </AuthCard>
  );
}
