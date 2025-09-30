'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface BottomNavigationProps {
  items: NavigationItem[];
  className?: string;
}

export function BottomNavigation({ items, className }: BottomNavigationProps) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-secondary shadow-neumorphic-elevated',
        'border-t border-quaternary rounded-t-3xl mx-2 mb-2',
        'px-4 py-3',
        className
      )}
      style={{
        borderColor: 'var(--bg-quaternary)',
        borderRadius: 'var(--radius-3xl) var(--radius-3xl) 0 0',
      }}
    >
      <div className="flex justify-around items-center">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              'flex flex-col items-center justify-center',
              'min-w-0 flex-1 py-2 px-3 rounded-xl',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              {
                'bg-accent text-inverse shadow-neumorphic-pressed':
                  item.isActive,
                'text-secondary hover:bg-tertiary hover:text-primary':
                  !item.isActive,
              }
            )}
            style={{
              minHeight: '44px', // Touch target size
            }}
          >
            <div className="flex items-center justify-center mb-1">
              {item.icon}
            </div>
            <span className="text-xs font-medium truncate w-full text-center">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// Export types for use in other components
export type { NavigationItem, BottomNavigationProps };
