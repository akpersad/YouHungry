'use client';

import { useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'button' | 'switch' | 'dropdown';
}

export function ThemeToggle({
  className,
  size = 'md',
  showLabel = false,
  variant = 'button',
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme, setTheme, theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'lg':
        return 'w-12 h-12 text-lg';
      case 'md':
      default:
        return 'w-10 h-10 text-base';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      case 'md':
      default:
        return 'w-5 h-5';
    }
  };

  // Sun icon
  const SunIcon = () => (
    <svg
      className={getIconSize()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );

  // Moon icon
  const MoonIcon = () => (
    <svg
      className={getIconSize()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );

  // System icon
  const SystemIcon = () => (
    <svg
      className={getIconSize()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );

  const getCurrentIcon = () => {
    if (theme === 'system') return <SystemIcon />;
    return resolvedTheme === 'dark' ? <MoonIcon /> : <SunIcon />;
  };

  const getLabel = () => {
    if (showLabel) {
      if (theme === 'system') return 'System';
      return resolvedTheme === 'dark' ? 'Dark' : 'Light';
    }
    return '';
  };

  // Button variant
  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'inline-flex items-center justify-center rounded-xl',
          'bg-secondary text-primary shadow-neumorphic-light',
          'hover:shadow-neumorphic-elevated hover:scale-105',
          'active:shadow-neumorphic-pressed active:scale-95',
          'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
          'border border-quaternary',
          getSizeClasses(),
          className
        )}
        style={
          {
            '--tw-ring-color': 'var(--accent-primary)',
            '--tw-ring-opacity': '0.3',
          } as React.CSSProperties
        }
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {getCurrentIcon()}
        {showLabel && (
          <span className="ml-2 text-sm font-medium">{getLabel()}</span>
        )}
      </button>
    );
  }

  // Switch variant
  if (variant === 'switch') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'relative inline-flex items-center rounded-full transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'border border-quaternary',
          resolvedTheme === 'dark'
            ? 'bg-accent shadow-neumorphic-elevated'
            : 'bg-tertiary shadow-neumorphic-light',
          getSizeClasses(),
          className
        )}
        style={
          {
            '--tw-ring-color': 'var(--accent-primary)',
            '--tw-ring-opacity': '0.3',
          } as React.CSSProperties
        }
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <div
          className={cn(
            'absolute top-0.5 left-0.5 rounded-full transition-transform duration-200',
            'bg-secondary shadow-neumorphic-pressed flex items-center justify-center',
            resolvedTheme === 'dark' ? 'translate-x-5' : 'translate-x-0',
            size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9'
          )}
        >
          <div
            className={cn(
              'transition-opacity duration-200',
              resolvedTheme === 'dark' ? 'opacity-0' : 'opacity-100'
            )}
          >
            <SunIcon />
          </div>
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center transition-opacity duration-200',
              resolvedTheme === 'dark' ? 'opacity-100' : 'opacity-0'
            )}
          >
            <MoonIcon />
          </div>
        </div>
      </button>
    );
  }

  // Dropdown variant
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center justify-center rounded-xl',
          'bg-secondary text-primary shadow-neumorphic-light',
          'hover:shadow-neumorphic-elevated',
          'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
          'border border-quaternary',
          getSizeClasses(),
          className
        )}
        style={
          {
            '--tw-ring-color': 'var(--accent-primary)',
            '--tw-ring-opacity': '0.3',
          } as React.CSSProperties
        }
        aria-label="Theme options"
        aria-expanded={isOpen}
      >
        {getCurrentIcon()}
        {showLabel && (
          <span className="ml-2 text-sm font-medium">{getLabel()}</span>
        )}
      </button>

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
              'absolute right-0 top-full mt-2 z-50',
              'bg-secondary border border-quaternary rounded-xl shadow-neumorphic-elevated',
              'py-1 min-w-32'
            )}
          >
            <button
              onClick={() => {
                setTheme('light');
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
                'hover:bg-tertiary transition-colors duration-150',
                theme === 'light' ? 'text-accent font-medium' : 'text-secondary'
              )}
            >
              <SunIcon />
              Light
            </button>

            <button
              onClick={() => {
                setTheme('dark');
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
                'hover:bg-tertiary transition-colors duration-150',
                theme === 'dark' ? 'text-accent font-medium' : 'text-secondary'
              )}
            >
              <MoonIcon />
              Dark
            </button>

            <button
              onClick={() => {
                setTheme('system');
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
                'hover:bg-tertiary transition-colors duration-150',
                theme === 'system'
                  ? 'text-accent font-medium'
                  : 'text-secondary'
              )}
            >
              <SystemIcon />
              System
            </button>
          </div>
        </>
      )}
    </div>
  );
}
