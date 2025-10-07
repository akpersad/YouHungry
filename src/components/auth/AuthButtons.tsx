'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  SignInButton as ClerkSignInButton,
  SignUpButton as ClerkSignUpButton,
} from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';

interface AuthButtonsProps {
  className?: string;
  children?: React.ReactNode;
}

export function AuthButtons({ className, children }: AuthButtonsProps) {
  const [isDevelopment, setIsDevelopment] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsDevelopment(window.location.hostname === 'localhost');
  }, []);

  // Show loading state during hydration to prevent mismatch
  if (!isClient) {
    return (
      <div
        className={`flex flex-col sm:flex-row gap-4 justify-center ${className || ''}`}
      >
        <Button size="lg" className="w-full sm:w-auto" disabled>
          Get Started
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
          disabled
        >
          Sign In
        </Button>
      </div>
    );
  }

  if (isDevelopment) {
    // Development mode: Use Clerk's out-of-the-box modals
    if (children) {
      // If children provided, wrap them in Clerk SignUpButton
      return <ClerkSignUpButton mode="modal">{children}</ClerkSignUpButton>;
    }

    return (
      <div
        className={`flex flex-col sm:flex-row gap-4 justify-center ${className || ''}`}
      >
        <ClerkSignUpButton mode="modal">
          <Button size="lg" className="w-full sm:w-auto">
            Get Started
          </Button>
        </ClerkSignUpButton>
        <ClerkSignInButton mode="modal">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            Sign In
          </Button>
        </ClerkSignInButton>
      </div>
    );
  }

  // Production mode: Use custom auth pages
  if (children) {
    // If children provided, wrap them in a link to sign-up
    return <Link href="/sign-up">{children}</Link>;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 justify-center ${className || ''}`}
    >
      <Link href="/sign-up">
        <Button size="lg" className="w-full sm:w-auto">
          Get Started
        </Button>
      </Link>
      <Link href="/sign-in">
        <Button variant="outline" size="lg" className="w-full sm:w-auto">
          Sign In
        </Button>
      </Link>
    </div>
  );
}
