'use client';

import { ReactNode } from 'react';
import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { QuickActionSheet } from '@/components/ui/BottomSheet';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
}

export function MobileLayout({ children, className }: MobileLayoutProps) {
  const {
    navigationItems,
    handleNavigation,
    isMoreMenuOpen,
    setIsMoreMenuOpen,
    moreMenuActions,
    isSignedIn,
    isLoaded,
    user,
  } = useMobileNavigation();

  return (
    <div className={cn('min-h-screen bg-primary', className)}>
      {/* Mobile Header - only visible on mobile */}
      <div className="md:hidden bg-secondary border-b border-quaternary px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-accent">You Hungry?</h1>
          {isLoaded && (
            <div className="flex items-center gap-2">
              {isSignedIn ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-inverse text-sm font-medium">
                      {user?.firstName?.charAt(0) ||
                        user?.emailAddresses[0]?.emailAddress?.charAt(0) ||
                        'U'}
                    </span>
                  </div>
                  <span className="text-sm text-primary hidden sm:block">
                    {user?.firstName || 'User'}
                  </span>
                </div>
              ) : (
                <div className="w-8 h-8 bg-quaternary rounded-full flex items-center justify-center">
                  <span className="text-secondary text-sm">?</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content with bottom padding for navigation */}
      <main className="pb-24 md:pb-28">{children}</main>

      {/* Bottom Navigation */}
      <BottomNavigation
        items={navigationItems.map((item) => ({
          id: item.id,
          label: item.label,
          icon: item.isActive ? item.activeIcon : item.icon,
          onClick: () => handleNavigation(item),
          isActive: item.isActive,
        }))}
      />

      {/* More Menu Bottom Sheet */}
      <QuickActionSheet
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        actions={moreMenuActions}
      />
    </div>
  );
}
