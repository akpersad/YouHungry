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
import { safeNextPath } from './next-param';

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn.create({ identifier: email, password });
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

  return (
    <AuthCard title="Sign in" lede="Your history and lists live here.">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
        noValidate={false}
      >
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
        <Button type="submit" loading={submitting} className="mt-1">
          Sign in
        </Button>
      </form>
      <p className="text-sm text-ink-secondary">
        New here?{' '}
        <Link
          href={`/beta/sign-up?next=${encodeURIComponent(nextPath)}`}
          className="rounded font-semibold text-brass underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
        >
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
