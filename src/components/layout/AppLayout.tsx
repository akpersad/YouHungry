'use client';

import { ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { Header } from './Header';
import { MobileLayout } from './MobileLayout';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const { isSignedIn, isLoaded } = useUser();

  // For unauthenticated users, show regular layout with header
  if (isLoaded && !isSignedIn) {
    return (
      <div className={cn('min-h-screen bg-primary', className)}>
        <Header />
        <main className="min-h-screen">{children}</main>
      </div>
    );
  }

  // For signed-in users (or loading state), show mobile layout
  // This prevents layout shift and FOUC
  return (
    <div className="min-h-screen bg-primary">
      {/* Header - visible on desktop, hidden on mobile */}
      <Header />

      {/* Mobile layout with bottom navigation */}
      <MobileLayout className={className}>{children}</MobileLayout>
    </div>
  );
}
