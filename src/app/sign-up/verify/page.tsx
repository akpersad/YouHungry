'use client';

import { Button } from '@/components/ui/Button';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const phoneVerification = searchParams.get('phoneVerification');

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'var(--color-success-light)',
            }}
          >
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Check Your Email</h1>
          <p className="text-sm">We&apos;ve sent a verification link to</p>
          {email && <p className="text-sm font-medium mt-1">{email}</p>}
        </div>

        {/* Instructions */}
        <div className="bg-surface rounded-lg p-6 border border-border space-y-4">
          <h3 className="font-semibold text-center">Next Steps:</h3>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start">
              <span className="font-bold mr-3 mt-0.5">1.</span>
              <span>
                Open the verification email from Clerk (check your spam folder
                if you don&apos;t see it)
              </span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-3 mt-0.5">2.</span>
              <span>Click the verification link in the email</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-3 mt-0.5">3.</span>
              <span>
                Once verified, return here and sign in with your credentials
              </span>
            </li>
          </ol>
        </div>

        {/* Phone Verification Info (if SMS opt-in) */}
        {phoneVerification === 'sent' && (
          <div className="bg-success/10 dark:bg-green-950/30 rounded-lg p-4 border border-success dark:border-green-800">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              📱 Phone Verification Sent
            </h3>
            <p className="text-sm text-green-900 dark:text-green-100">
              We&apos;ve also sent an SMS verification code to your phone
              number. You can verify your phone number after signing in by going
              to your profile settings.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-primary/10 dark:bg-blue-950/30 rounded-lg p-4 border border-primary dark:border-primary">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>💡 Tip:</strong> The verification link will expire after 24
            hours. If you need a new one, try signing in and we&apos;ll send
            another verification email.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            onClick={() => router.push('/sign-in')}
            className="w-full"
          >
            Go to Sign In
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full"
          >
            Back to Home
          </Button>
        </div>

        {/* Additional Help */}
        <div className="text-center">
          <p className="text-xs">
            Didn&apos;t receive the email?{' '}
            <button
              onClick={() => router.push('/sign-in')}
              className="font-medium underline"
            >
              Try signing in
            </button>{' '}
            to resend it
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
