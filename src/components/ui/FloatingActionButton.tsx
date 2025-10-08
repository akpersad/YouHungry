'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
  ariaLabel?: string;
}

export function FloatingActionButton({
  icon,
  onClick,
  href,
  variant = 'primary',
  size = 'md',
  position = 'bottom-right',
  className,
  ariaLabel = 'Floating action button',
}: FloatingActionButtonProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const positionClasses = {
    'bottom-right': 'bottom-24 right-6',
    'bottom-left': 'bottom-24 left-6',
    'bottom-center': 'bottom-24 left-1/2 transform -translate-x-1/2',
  };

  const variantClasses = {
    primary:
      'bg-accent text-inverse shadow-neumorphic-elevated hover:shadow-neumorphic-pressed',
    secondary:
      'bg-secondary text-primary shadow-neumorphic-elevated hover:shadow-neumorphic-pressed border border-quaternary',
  };

  const buttonContent = (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-40 rounded-full',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent',
        'active:scale-95 hover:scale-105',
        'flex items-center justify-center',
        'touch-target',
        sizeClasses[size],
        positionClasses[position],
        variantClasses[variant],
        className
      )}
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-center">{icon}</div>
    </button>
  );

  if (href) {
    return (
      <a href={href} className="inline-block">
        {buttonContent}
      </a>
    );
  }

  return buttonContent;
}

// Export type for use in other components
export type { FloatingActionButtonProps };
