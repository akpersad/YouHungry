'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
// Clerk 7 moved the resource-shape hooks to the legacy entry point; the
// signals API migration is tracked repo-wide (see CustomRegistrationForm).
import { useSignUp } from '@clerk/nextjs/legacy';
import { Button, Input } from '@/components/v2/ui';
import { AuthCard } from './AuthCard';
import {
  clerkErrorMentionsParam,
  clerkErrorMessage,
  deriveUsername,
} from './clerk-errors';
import { safeNextPath } from './next-param';

/**
 * v2 sign-up: email + password, nothing else (owner decision 2026-07-02 —
 * no phone, no username ceremony, no social). Clerk email verification is
 * the one extra step: a six-digit code entered on the same card.
 */
export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const { isLoaded, signUp, setActive } = useSignUp();

  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleDetails = async (event: FormEvent) => {
    event.preventDefault();
    if (!isLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      try {
        await signUp.create({ emailAddress: email, password });
      } catch (err) {
        // Some instances (the v1-era dev instance) still require a
        // username. Derive one silently — the form stays two fields.
        if (!clerkErrorMentionsParam(err, 'username')) throw err;
        await signUp.create({
          emailAddress: email,
          password,
          username: deriveUsername(email),
        });
      }
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });
      setStep('verify');
    } catch (err) {
      setError(
        clerkErrorMessage(err, 'Could not create your account. Try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    if (!isLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push(nextPath);
        return;
      }
      setError('That code did not verify. Check it and try again.');
    } catch (err) {
      setError(clerkErrorMessage(err, 'That code did not verify. Try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'verify') {
    return (
      <AuthCard
        title="Check your email"
        lede={`We sent a six-digit code to ${email}.`}
      >
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <Input
            label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="font-mono"
          />
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" loading={submitting} className="mt-1">
            Verify and start forking
          </Button>
        </form>
        <button
          type="button"
          onClick={() => {
            setStep('details');
            setCode('');
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
      title="Create an account"
      lede="Two fields. Your spins start counting toward history."
    >
      <form onSubmit={handleDetails} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          help="At least 8 characters."
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {/* Until Clerk hydrates, handleDetails would silently drop the
            intent — disabled is the honest state for that brief window. */}
        <Button
          type="submit"
          loading={submitting}
          disabled={!isLoaded}
          className="mt-1"
        >
          Create account
        </Button>
        {/* Clerk smart CAPTCHA mounts here when the instance enables it. */}
        <div id="clerk-captcha" />
      </form>
      <p className="text-sm text-ink-secondary">
        Already have one?{' '}
        <Link
          href={`/sign-in?next=${encodeURIComponent(nextPath)}`}
          className="tap-target inline-block rounded font-semibold text-brass underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
