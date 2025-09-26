'use client';

import { SignOutButton as ClerkSignOutButton } from '@clerk/nextjs';

interface SignOutButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function SignOutButton({
  children = 'Sign Out',
  className,
  variant = 'outline',
  size = 'md',
}: SignOutButtonProps) {
  return (
    <ClerkSignOutButton>
      <button
        className={`btn-base btn-${variant} btn-${size} ${className || ''}`}
      >
        {children}
      </button>
    </ClerkSignOutButton>
  );
}
