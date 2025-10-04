'use client';

import { SignUp } from '@clerk/nextjs';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: 'var(--color-text)' }}
            >
              Join You Hungry?
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>
              Create your account to start discovering amazing restaurants
            </p>
          </div>

          {/* Benefits Section */}
          <div className="bg-surface rounded-lg p-4 border border-border">
            <h3
              className="font-semibold mb-3"
              style={{ color: 'var(--color-text)' }}
            >
              What you&apos;ll get:
            </h3>
            <ul
              className="space-y-2 text-sm"
              style={{ color: 'var(--color-text-light)' }}
            >
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                Create personal restaurant collections
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                Make group decisions with friends
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                Get smart recommendations
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                Never argue about where to eat again
              </li>
            </ul>
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

          {/* Clerk Sign Up Component */}
          <div className="flex justify-center">
            <SignUp
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
                  formFieldSuccessText: 'text-sm text-green-600',
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
              signInUrl="/sign-in"
            />
          </div>

          {/* SMS Benefits Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
              📱 SMS Notifications (Optional)
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Enable SMS to get notified about group decisions, friend requests,
              and group invites. You can always change this later in your
              profile settings.
            </p>
          </div>

          {/* Additional Info */}
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              By creating an account, you agree to our Terms of Service and
              Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
