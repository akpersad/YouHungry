'use client';

import { CustomRegistrationForm } from '@/components/forms/CustomRegistrationForm';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Join Fork In The Road</h1>
          <p className="text-sm">
            Create your account to start discovering amazing restaurants
          </p>
        </div>

        {/* Benefits Section */}
        <div className="bg-surface rounded-lg p-4 border border-border">
          <h3 className="font-semibold mb-3">What you&apos;ll get</h3>
          <ul className="space-y-2 text-sm">
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
              Never argue about where to eat
            </li>
          </ul>
        </div>

        {/* Back to Home Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="mb-2"
          >
            ← Back to Home
          </Button>
        </div>

        {/* Custom Registration Form */}
        <div className="bg-surface rounded-lg p-6 border border-border">
          <CustomRegistrationForm />
        </div>

        {/* SMS Benefits Info */}
        <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 border border-primary dark:border-primary">
          <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
            📱 SMS Notifications
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Enable SMS to get notified about group decisions, friend requests,
            and group invites. You can verify your phone number later in your
            profile settings.
          </p>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs">
            By creating an account, you agree to our{' '}
            <a
              href="/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
            >
              Terms of Service
            </a>
            {' and '}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
