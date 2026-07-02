'use client';

import { ReactNode } from 'react';
import { QuickActionSheet } from '@/components/ui/BottomSheet';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
}

export function MobileLayout({ children, className }: MobileLayoutProps) {
  const { isMoreMenuOpen, setIsMoreMenuOpen, moreMenuActions } =
    useMobileNavigation();

  return (
    <div className={cn('flex flex-col flex-1 bg-bg', className)}>
      {/* Mobile Header - hidden since we use bottom navigation */}
      {/* <div className="md:hidden bg-surface border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-tomato">Fork In The Road</h1>
          {isLoaded && (
            <div className="flex items-center gap-2">
              {isSignedIn ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-tomato rounded-full flex items-center justify-center">
                    <span className="text-ink-inverse text-sm font-medium">
                      {user?.firstName?.charAt(0) ||
                        user?.emailAddresses[0]?.emailAddress?.charAt(0) ||
                        'U'}
                    </span>
                  </div>
                  <span className="text-sm text-ink hidden sm:block">
                    {user?.firstName || 'User'}
                  </span>
                </div>
              ) : (
                <div className="w-8 h-8 bg-border rounded-full flex items-center justify-center">
                  <span className="text-ink-secondary text-sm">?</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div> */}

      {/* Main content with padding matching bottom navigation */}
      <main className="flex-1 px-6 pb-32 md:pb-0 pt-8 md:pt-16">
        {children}
      </main>

      {/* Desktop Footer */}
      <footer className="hidden md:block border-t border-border bg-bg mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center text-sm text-ink-muted">
            <p>
              © {new Date().getFullYear()} Fork In The Road - Making food
              decisions easier
            </p>
          </div>
        </div>
      </footer>

      {/* More Menu Bottom Sheet */}
      <QuickActionSheet
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        actions={moreMenuActions}
      />
    </div>
  );
}
