'use client';

import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { QuickActionSheet } from '@/components/ui/BottomSheet';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { usePathname } from 'next/navigation';

export function RootNavigation() {
  const {
    navigationItems,
    handleNavigation,
    isMoreMenuOpen,
    setIsMoreMenuOpen,
    moreMenuActions,
  } = useMobileNavigation();

  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <>
      {/* Bottom Navigation - rendered at root level for true fixed positioning */}
      {/* Hidden on mobile for home page (/) since it's only accessible when unauthenticated */}
      <BottomNavigation
        items={navigationItems.map((item) => ({
          id: item.id,
          label: item.label,
          icon: item.isActive ? item.activeIcon : item.icon,
          onClick: () => handleNavigation(item),
          isActive: item.isActive,
        }))}
        className={isHomePage ? 'hidden' : ''}
      />

      {/* More Menu Bottom Sheet */}
      <QuickActionSheet
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        actions={moreMenuActions}
      />
    </>
  );
}
