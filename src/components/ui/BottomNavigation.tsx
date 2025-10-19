'use client';

import { ReactNode, useRef, useEffect } from 'react';
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
  ariaLabel?: string;
}

export function BottomNavigation({
  items,
  className,
  ariaLabel = 'Main navigation',
}: BottomNavigationProps) {
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Update slider position when active tab changes
  useEffect(() => {
    if (activeTabRef.current && sliderRef.current) {
      const activeTab = activeTabRef.current;
      const slider = sliderRef.current;

      const tabRect = activeTab.getBoundingClientRect();
      const containerRect = activeTab.parentElement?.getBoundingClientRect();

      if (containerRect) {
        const left = tabRect.left - containerRect.left;
        const width = tabRect.width;

        slider.style.transform = `translateX(${left}px)`;
        slider.style.width = `${width}px`;
      }
    }
  }, [items]);

  const activeItem = items.find((item) => item.isActive);

  return (
    <nav
      className={cn(
        'bottom-nav-fixed',
        'px-6 pt-4 pb-safe-bottom',
        'md:hidden', // Hide on desktop and tablet
        className
      )}
      role="navigation"
      aria-label={ariaLabel}
    >
      {/* Floating tab bar container with neumorphic styling */}
      <div
        className={cn(
          'relative bg-secondary/80 backdrop-blur-xl',
          'rounded-2xl mx-auto max-w-sm',
          'shadow-neumorphic-elevated',
          'border border-quaternary/20',
          'px-2 py-2'
        )}
        style={{
          borderColor: 'var(--bg-quaternary)',
        }}
      >
        {/* Sliding background for active tab */}
        <div
          ref={sliderRef}
          className={cn(
            'absolute top-2 bottom-2 rounded-xl',
            'bg-accent shadow-neumorphic-pressed',
            'transition-all duration-300 ease-out',
            'opacity-0'
          )}
          style={{
            opacity: activeItem ? 1 : 0,
          }}
        />

        {/* Tab items */}
        <div className="relative flex justify-around items-center">
          {items.map((item) => (
            <button
              key={item.id}
              ref={item.isActive ? activeTabRef : null}
              onClick={item.onClick}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'min-w-0 flex-1 py-3 px-4 rounded-xl',
                'transition-all duration-200 touch-target',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent',
                'active:scale-95',
                {
                  'text-inverse': item.isActive,
                  'text-secondary hover:text-primary hover:scale-105':
                    !item.isActive,
                }
              )}
              style={{
                minHeight: '60px',
                minWidth: '60px',
              }}
              aria-label={item.label}
              aria-current={item.isActive ? 'page' : undefined}
            >
              <div
                className="flex items-center justify-center mb-1 transition-transform duration-200"
                aria-hidden="true"
              >
                {item.icon}
              </div>
              <span className="text-xs font-medium truncate w-full text-center">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// Export types for use in other components
export type { NavigationItem, BottomNavigationProps };
