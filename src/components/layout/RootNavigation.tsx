'use client';

import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { QuickActionSheet } from '@/components/ui/BottomSheet';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';

export function RootNavigation() {
  const {
    navigationItems,
    handleNavigation,
    isMoreMenuOpen,
    setIsMoreMenuOpen,
    moreMenuActions,
  } = useMobileNavigation();

  return (
    <>
      {/* Bottom Navigation - rendered at root level for true fixed positioning */}
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
    </>
  );
}
