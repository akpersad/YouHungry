'use client';

import { ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { SignInButton } from '@/components/auth/SignInButton';
import { UserProfile } from '@/components/auth/UserProfile';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface HeaderProps {
  children?: ReactNode;
}

export function Header({ children }: HeaderProps) {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <header
      className="border-b shadow-neumorphic-light bg-secondary"
      style={{
        borderColor: 'var(--bg-quaternary)',
      }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard">
              <h1 className="text-xl font-bold hover:opacity-80 transition-opacity text-accent">
                You Hungry?
              </h1>
            </Link>
            {isLoaded && isSignedIn && (
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium hover:opacity-80 transition-opacity text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  href="/restaurants"
                  className="text-sm font-medium hover:opacity-80 transition-opacity text-primary"
                >
                  Search Restaurants
                </Link>
                <Link
                  href="/groups"
                  className="text-sm font-medium hover:opacity-80 transition-opacity text-primary"
                >
                  Groups
                </Link>
              </nav>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {children}
            <ThemeToggle variant="button" size="md" />
            {isLoaded && (isSignedIn ? <UserProfile /> : <SignInButton />)}
          </div>
        </div>
      </div>
    </header>
  );
}
