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
      <div className={cn('flex flex-col min-h-screen bg-primary', className)}>
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // For signed-in users (or loading state), show mobile layout
  // This prevents layout shift and FOUC
  return (
    <div className="flex flex-col min-h-screen bg-primary">
      {/* Header - visible on desktop, hidden on mobile */}
      <Header />

      {/* Mobile layout */}
      <MobileLayout className={className}>{children}</MobileLayout>
    </div>
  );
}
