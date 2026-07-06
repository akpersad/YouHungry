import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SignInForm } from '@/components/v2/auth/SignInForm';

export const metadata: Metadata = { title: 'Sign in · Fork In The Road' };

// Suspense boundary: the form reads useSearchParams (?next=).
export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
