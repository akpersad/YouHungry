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
      className="hidden md:block border-b shadow-neumorphic-light bg-secondary"
      style={{
        borderColor: 'var(--bg-quaternary)',
      }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 96 96"
                className="w-8 h-8 text-accent group-hover:opacity-80 transition-opacity"
                role="img"
                aria-label="Fork In The Road logo"
              >
                <defs>
                  <mask id="fork-cutout-header-clear">
                    <rect width="100%" height="100%" fill="white" />
                    <g transform="translate(34,20)">
                      <rect
                        x="0"
                        y="0"
                        width="4"
                        height="18"
                        rx="2"
                        fill="black"
                      />
                      <rect
                        x="7"
                        y="0"
                        width="4"
                        height="18"
                        rx="2"
                        fill="black"
                      />
                      <rect
                        x="14"
                        y="0"
                        width="4"
                        height="18"
                        rx="2"
                        fill="black"
                      />
                      <rect
                        x="21"
                        y="0"
                        width="4"
                        height="18"
                        rx="2"
                        fill="black"
                      />
                      <rect
                        x="3.5"
                        y="20"
                        width="18"
                        height="4"
                        rx="2"
                        fill="black"
                      />
                    </g>
                  </mask>
                </defs>
                <path
                  fill="currentColor"
                  mask="url(#fork-cutout-header-clear)"
                  d="M48 8c-16.6 0-30 13.1-30 29.2 0 8.8 4.1 15.8 9.3 22.6 4.5 6 9.8 11.7 14.7 18.8 2.5 3.6 4.7 7.6 6 11.4 1.3-3.8 3.5-7.8 6-11.4 4.8-7.1 10.1-12.8 14.7-18.8 5.2-6.9 9.3-13.8 9.3-22.6C78 19.1 64.6 8 48 8z"
                />
                <path
                  fill="currentColor"
                  stroke="none"
                  d="M30 76 Q45 70 62 76 Q45 72 30 76"
                />
                <path
                  fill="currentColor"
                  stroke="none"
                  d="M30 86 Q45 80 62 86 Q45 82 30 86"
                />
              </svg>
              <h1 className="text-xl font-bold group-hover:opacity-80 transition-opacity text-accent">
                Fork In The Road
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
                <Link
                  href="/friends"
                  className="text-sm font-medium hover:opacity-80 transition-opacity text-primary"
                >
                  Friends
                </Link>
                <Link
                  href="/history"
                  className="text-sm font-medium hover:opacity-80 transition-opacity text-primary"
                >
                  History
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
