'use client';

import { SignIn } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  // Get the redirect URL from query params (Clerk passes this automatically)
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Registration Success Message */}
        {registered && (
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--color-success-light)',
              borderColor: 'var(--color-success)',
            }}
          >
            <p className="text-sm font-medium">
              ✓ Account created successfully! Please sign in with your new
              credentials.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-sm">Sign in to continue to Fork In The Road</p>
        </div>

        {/* Back to Home Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="mb-6"
          >
            ← Back to Home
          </Button>
        </div>

        {/* Clerk Sign In Component */}
        <div className="flex justify-center">
          <SignIn
            path="/sign-in"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none border-0 bg-transparent',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'btn-base btn-outline',
                socialButtonsBlockButtonText: 'text-sm',
                formButtonPrimary: 'btn-base btn-primary',
                footerActionLink: 'text-primary hover:text-primary/80',
                identityPreviewText: 'text-sm',
                formFieldInput: 'input-base',
                formFieldLabel: 'text-sm font-medium',
                dividerLine: 'bg-border',
                dividerText: 'text-sm text-muted-foreground',
                formFieldErrorText: 'text-sm text-destructive',
                footerActionText: 'text-sm text-muted-foreground',
              },
              variables: {
                colorPrimary: 'var(--color-primary)',
                colorBackground: 'var(--color-background)',
                colorInputBackground: 'var(--color-surface)',
                colorInputText: 'var(--color-text)',
                colorText: 'var(--color-text)',
                colorTextSecondary: 'var(--color-text-light)',
                borderRadius: '0.5rem',
              },
            }}
            forceRedirectUrl={redirectUrl}
            fallbackRedirectUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
