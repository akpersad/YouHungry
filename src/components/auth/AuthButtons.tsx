'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { trackSignupStart, trackEvent } from '@/lib/analytics';

interface AuthButtonsProps {
  className?: string;
  children?: React.ReactNode;
}

export function AuthButtons({ className, children }: AuthButtonsProps) {
  // If children provided, wrap them in a link to sign-up
  if (children) {
    return <Link href="/sign-up">{children}</Link>;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 justify-center ${className || ''}`}
    >
      <Link href="/sign-up" onClick={() => trackSignupStart()}>
        <Button size="lg" className="w-full sm:w-auto">
          Get Started
        </Button>
      </Link>
      <Link
        href="/sign-in"
        onClick={() => trackEvent('signin_button_click', { location: 'home' })}
      >
        <Button variant="outline" size="lg" className="w-full sm:w-auto">
          Sign In
        </Button>
      </Link>
    </div>
  );
}
