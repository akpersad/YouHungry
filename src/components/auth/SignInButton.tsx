'use client';

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
