'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export function FloatingActionButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  position = 'bottom-right',
  className,
  disabled = false,
  'aria-label': ariaLabel,
}: FloatingActionButtonProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-24 left-4';
      case 'bottom-center':
        return 'bottom-24 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
      default:
        return 'bottom-24 right-4';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-12 h-12';
      case 'lg':
        return 'w-16 h-16';
      case 'md':
      default:
        return 'w-14 h-14';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-secondary text-primary shadow-neumorphic-elevated hover:shadow-neumorphic-elevated active:shadow-neumorphic-pressed';
      case 'accent':
        return 'bg-accent text-inverse shadow-neumorphic-elevated hover:shadow-neumorphic-elevated active:shadow-neumorphic-pressed';
      case 'primary':
      default:
        return 'bg-accent text-inverse shadow-neumorphic-elevated hover:shadow-neumorphic-elevated active:shadow-neumorphic-pressed';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'fixed z-40 rounded-full',
        'flex items-center justify-center',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'hover:scale-105 active:scale-95',
        getPositionClasses(),
        getSizeClasses(),
        getVariantClasses(),
        className
      )}
      style={
        {
          '--tw-ring-color': 'var(--accent-primary)',
          '--tw-ring-opacity': '0.3',
        } as React.CSSProperties
      }
    >
      {children}
    </button>
  );
}
