'use client';

import { SignIn } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center py-12 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--color-text)' }}
          >
            Welcome Back
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>
            Sign in to continue to You Hungry?
          </p>
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
            fallbackRedirectUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
