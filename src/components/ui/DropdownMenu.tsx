'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

interface DropdownMenuItemProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  className?: string;
}

export function DropdownMenu({
  trigger,
  children,
  className,
  align = 'right',
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            className={cn(
              'absolute top-full mt-2 z-50',
              'bg-secondary border border-quaternary rounded-xl shadow-neumorphic-elevated',
              'py-1 min-w-48',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  onClick,
  children,
  variant = 'default',
  disabled = false,
  className,
}: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
        'hover:bg-tertiary transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-accent/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'destructive'
          ? 'text-error hover:bg-error/10'
          : 'text-primary hover:bg-tertiary',
        className
      )}
    >
      {children}
    </button>
  );
}
