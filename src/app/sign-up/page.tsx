import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SignUpForm } from '@/components/v2/auth/SignUpForm';

export const metadata: Metadata = {
  title: 'Create an account · Fork In The Road',
};

// Suspense boundary: the form reads useSearchParams (?next=).
export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}
