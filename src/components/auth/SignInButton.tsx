'use client';

import { useRouter } from 'next/navigation';
import { SignInButton as ClerkSignInButton } from '@clerk/nextjs';

interface SignInButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function SignInButton({
  children = 'Sign In',
  className,
  variant = 'primary',
  size = 'md',
}: SignInButtonProps) {
  const router = useRouter();

  // Check if we're in development mode (no webhook secret means development)
  // We'll use a simple check for now - in production, this will be set
  const isDevelopment =
    typeof window !== 'undefined' && window.location.hostname === 'localhost';

  if (isDevelopment) {
    // Development mode: Use Clerk's out-of-the-box modal
    return (
      <ClerkSignInButton mode="modal">
        <button
          className={`btn-base btn-${variant} btn-${size} ${className || ''}`}
        >
          {children}
        </button>
      </ClerkSignInButton>
    );
  }

  // Production mode: Use custom sign-in page
  return (
    <button
      onClick={() => router.push('/sign-in')}
      className={`btn-base btn-${variant} btn-${size} ${className || ''}`}
    >
      {children}
    </button>
  );
}
