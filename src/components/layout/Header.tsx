'use client';

import { ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { SignInButton } from '@/components/auth/SignInButton';
import { UserProfile } from '@/components/auth/UserProfile';

interface HeaderProps {
  children?: ReactNode;
}

export function Header({ children }: HeaderProps) {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <header
      className="border-b shadow-sm"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard">
              <h1
                className="text-xl font-bold hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-primary)' }}
              >
                You Hungry?
              </h1>
            </Link>
            {isLoaded && isSignedIn && (
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-text)' }}
                >
                  Dashboard
                </Link>
                <Link
                  href="/restaurants"
                  className="text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-text)' }}
                >
                  Search Restaurants
                </Link>
              </nav>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {children}
            {isLoaded && (isSignedIn ? <UserProfile /> : <SignInButton />)}
          </div>
        </div>
      </div>
    </header>
  );
}
