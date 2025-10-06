'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useUnreadNotificationCount } from '@/hooks/useInAppNotifications';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function NotificationBell({
  className,
  size = 'md',
  onClick,
}: NotificationBellProps) {
  const { unreadCount, isLoading } = useUnreadNotificationCount();
  const [isAnimating, setIsAnimating] = useState(false);
  const prevCountRef = useRef(0);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const badgeSizeClasses = {
    sm: 'h-2 w-2 text-xs',
    md: 'h-3 w-3 text-xs',
    lg: 'h-4 w-4 text-sm',
  };

  // Animate when count changes
  useEffect(() => {
    if (unreadCount > prevCountRef.current && unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
        className
      )}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      {unreadCount > 0 ? (
        <BellRing
          className={cn(
            sizeClasses[size],
            'text-red-500',
            isAnimating && 'animate-pulse'
          )}
        />
      ) : (
        <Bell className={cn(sizeClasses[size], 'text-gray-600')} />
      )}

      {unreadCount > 0 && (
        <span
          className={cn(
            'absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-500 text-white font-medium',
            badgeSizeClasses[size],
            isAnimating && 'animate-bounce'
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {isLoading && (
        <span className="absolute -top-1 -right-1 h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-red-500" />
      )}
    </button>
  );
}
