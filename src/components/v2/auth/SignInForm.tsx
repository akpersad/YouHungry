'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
// Clerk 7 moved the resource-shape hooks to the legacy entry point; the
// signals API migration is tracked repo-wide (see CustomRegistrationForm).
import { useSignIn } from '@clerk/nextjs/legacy';
import { Button, Input } from '@/components/v2/ui';
import { AuthCard } from './AuthCard';
import { clerkErrorMessage } from './clerk-errors';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { safeNextPath } from './next-param';

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const { isLoaded, signIn, setActive } = useSignIn();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      // Clerk resolves the identifier as email OR username — same account,
      // same password. v1 accounts carry usernames, so don't gate the
      // field to type=email.
      const result = await signIn.create({ identifier, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push(nextPath);
        return; // keep the button busy through the redirect
      }
      // Email/password is the only enabled factor; any other status means
      // the instance wants something this form doesn't collect.
      setError('Sign-in needs another step this form does not support.');
    } catch (err) {
      setError(
        clerkErrorMessage(err, 'Could not sign you in. Check your details.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (resetting) {
    return (
      <ForgotPasswordForm
        nextPath={nextPath}
        initialIdentifier={identifier}
        onBack={() => setResetting(false)}
      />
    );
  }

  return (
    <AuthCard title="Sign in" lede="Your history and lists live here.">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
        noValidate={false}
      >
        <Input
          label="Email or username"
          type="text"
          name="identifier"
          autoComplete="username"
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {/* Until Clerk hydrates, handleSubmit would silently drop the
            intent — disabled is the honest state for that brief window. */}
        <Button
          type="submit"
          loading={submitting}
          disabled={!isLoaded}
          className="mt-1"
        >
          Sign in
        </Button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setResetting(true);
          }}
          className="self-start rounded text-sm font-semibold text-brass underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
        >
          Forgot your password?
        </button>
      </form>
      <p className="text-sm text-ink-secondary">
        New here?{' '}
        <Link
          href={`/sign-up?next=${encodeURIComponent(nextPath)}`}
          className="rounded font-semibold text-brass underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
        >
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
