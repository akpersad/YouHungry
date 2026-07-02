'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCheck, Bell } from 'lucide-react';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { InAppNotification } from '@/types/database';
import { cn } from '@/lib/utils';
import { ToastNotificationService } from '@/lib/toast-notifications';
import { trackNotificationClicked } from '@/lib/analytics';
import { EASING, ANIMATION_DURATION } from '@/lib/animations';
import { EmptyState } from './EmptyState';
import { Skeleton, SkeletonGroup } from './Skeleton';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// Warm tinted chip per notification type — replaces the raw floating emoji.
// `chip` pairs a tint background with its accent foreground (design tokens
// registered as Tailwind colors in globals.css).
const NOTIFICATION_STYLES: Record<
  InAppNotification['type'] | 'default',
  { emoji: string; chip: string }
> = {
  group_decision: { emoji: '🍽️', chip: 'bg-tomato-tint text-tomato' },
  friend_request: { emoji: '👋', chip: 'bg-saffron-tint text-saffron' },
  group_invitation: { emoji: '👥', chip: 'bg-olive-tint text-olive' },
  decision_result: { emoji: '🎯', chip: 'bg-tomato-tint text-tomato' },
  admin_alert: { emoji: '🚨', chip: 'bg-tomato-tint text-tomato' },
  default: { emoji: '🔔', chip: 'bg-saffron-tint text-saffron' },
};

export function NotificationPanel({
  isOpen,
  onClose,
  className,
}: NotificationPanelProps) {
  const {
    notifications,
    stats,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
  } = useInAppNotifications({ limit: 20 });

  const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>('all');
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const filteredNotifications = notifications.filter(
    (notification) => selectedTab === 'all' || !notification.read
  );

  // Escape to close, lock body scroll, and move focus into the drawer.
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  const handleNotificationClick = (notification: InAppNotification) => {
    trackNotificationClicked({
      notificationId: notification._id.toString(),
      notificationType: notification.type,
    });

    if (!notification.read) {
      markAsRead(notification._id.toString());
    }

    handleNotificationAction(notification);
  };

  const handleNotificationAction = (notification: InAppNotification) => {
    switch (notification.type) {
      case 'friend_request':
        window.location.assign('/friends');
        break;
      case 'group_invitation':
        window.location.assign('/groups');
        break;
      case 'group_decision':
        if (notification.data?.groupId) {
          window.location.assign(`/groups/${notification.data.groupId}`);
        }
        break;
      case 'decision_result':
        if (notification.data?.groupId && notification.data?.decisionId) {
          window.location.assign(
            `/groups/${notification.data.groupId}/decisions/${notification.data.decisionId}`
          );
        }
        break;
      default:
        ToastNotificationService.info('Notification clicked', {
          description: notification.title,
        });
    }
  };

  const getNotificationTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const drawerTransition = {
    duration: ANIMATION_DURATION.normal,
    ease: EASING.easeOut,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn('fixed inset-0 overflow-hidden', className)}
          style={{ zIndex: 'var(--z-modal)' }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: ANIMATION_DURATION.fast }}
          />

          {/* Drawer */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-medium"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={drawerTransition}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <h2
                  id={titleId}
                  className="font-display text-xl font-semibold text-ink"
                >
                  Notifications
                </h2>
                {stats.unreadCount > 0 && (
                  <span className="rounded-full bg-tomato-tint px-2 py-0.5 text-xs font-medium tabular-nums text-tomato">
                    {stats.unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {stats.unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={isMarkingAllAsRead}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-sunken hover:text-ink disabled:opacity-50"
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Mark all read</span>
                  </button>
                )}

                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="rounded-full p-2 text-ink-secondary transition-colors hover:bg-surface-sunken hover:text-ink focus:outline-none focus:ring-2 focus:ring-tomato focus:ring-offset-2"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div
              className="flex border-b border-border px-2"
              role="tablist"
              aria-label="Filter notifications"
            >
              {(['all', 'unread'] as const).map((tab) => {
                const isSelected = selectedTab === tab;
                const count = tab === 'all' ? stats.total : stats.unreadCount;
                return (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedTab(tab)}
                    className={cn(
                      'relative flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors',
                      isSelected
                        ? 'text-ink'
                        : 'text-ink-secondary hover:text-ink'
                    )}
                  >
                    {tab} ({count})
                    {isSelected && (
                      <motion.span
                        layoutId="notification-tab-underline"
                        className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-tomato"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <SkeletonGroup label="Loading notifications">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 border-b border-border p-4"
                    >
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </SkeletonGroup>
              ) : filteredNotifications.length === 0 ? (
                <EmptyState
                  icon={<Bell className="h-6 w-6" />}
                  title={
                    selectedTab === 'unread'
                      ? "You're all caught up"
                      : 'No notifications yet'
                  }
                  description={
                    selectedTab === 'unread'
                      ? 'Nothing unread right now — check back after your next decision.'
                      : "When friends invite you or a group settles on a spot, you'll see it here."
                  }
                />
              ) : (
                <ul>
                  {filteredNotifications.map((notification) => {
                    const style =
                      NOTIFICATION_STYLES[notification.type] ??
                      NOTIFICATION_STYLES.default;
                    return (
                      <li
                        key={notification._id.toString()}
                        className="border-b border-border"
                      >
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            'w-full p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-tomato',
                            notification.read
                              ? 'hover:bg-surface-sunken'
                              : 'bg-tomato-tint'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={cn(
                                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg',
                                style.chip
                              )}
                              aria-hidden="true"
                            >
                              {style.emoji}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-semibold text-ink">
                                  {notification.title}
                                </h3>
                                {!notification.read && (
                                  <span
                                    className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-tomato"
                                    aria-label="Unread"
                                  />
                                )}
                              </div>

                              <p className="mt-1 line-clamp-2 text-sm text-ink-secondary">
                                {notification.message}
                              </p>

                              <p className="mt-2 text-xs text-ink-muted tabular-nums">
                                {getNotificationTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
