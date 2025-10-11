'use client';

import { useState } from 'react';
import { X, Check, CheckCheck, Bell, BellOff } from 'lucide-react';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { InAppNotification } from '@/types/database';
import { cn } from '@/lib/utils';
import { ToastNotificationService } from '@/lib/toast-notifications';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

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

  const filteredNotifications = notifications.filter(
    (notification) => selectedTab === 'all' || !notification.read
  );

  const handleNotificationClick = (notification: InAppNotification) => {
    if (!notification.read) {
      markAsRead(notification._id.toString());
    }

    // Handle navigation based on notification type
    handleNotificationAction(notification);
  };

  const handleNotificationAction = (notification: InAppNotification) => {
    switch (notification.type) {
      case 'friend_request':
        // Navigate to friends page
        window.location.href = '/friends';
        break;
      case 'group_invitation':
        // Navigate to groups page
        window.location.href = '/groups';
        break;
      case 'group_decision':
        // Navigate to specific group
        if (notification.data?.groupId) {
          window.location.href = `/groups/${notification.data.groupId}`;
        }
        break;
      case 'decision_result':
        // Navigate to decision result
        if (notification.data?.groupId && notification.data?.decisionId) {
          window.location.href = `/groups/${notification.data.groupId}/decisions/${notification.data.decisionId}`;
        }
        break;
      default:
        ToastNotificationService.info('Notification clicked', {
          description: notification.title,
        });
    }
  };

  const getNotificationIcon = (type: InAppNotification['type']) => {
    switch (type) {
      case 'group_decision':
        return '🍽️';
      case 'friend_request':
        return '👋';
      case 'group_invitation':
        return '👥';
      case 'decision_result':
        return '🎯';
      case 'admin_alert':
        return '🚨';
      default:
        return '🔔';
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

  if (!isOpen) return null;

  return (
    <div className={cn('fixed inset-0 z-50 overflow-hidden', className)}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-text-light" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {stats.unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-1 text-xs text-white">
                {stats.unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {stats.unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={isMarkingAllAsRead}
                className="rounded-full p-1.5 text-text-light hover:bg-surface hover:text-text disabled:opacity-50"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-text-light hover:bg-surface hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex">
            <button
              onClick={() => setSelectedTab('all')}
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                selectedTab === 'all'
                  ? 'border-b-2 border-destructive text-destructive'
                  : 'text-text-light hover:text-text'
              )}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setSelectedTab('unread')}
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                selectedTab === 'unread'
                  ? 'border-b-2 border-destructive text-destructive'
                  : 'text-text-light hover:text-text'
              )}
            >
              Unread ({stats.unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-red-500" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <BellOff className="h-12 w-12 text-text-light" />
              <p className="mt-2 text-text-light">
                {selectedTab === 'unread'
                  ? 'No unread notifications'
                  : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <button
                  key={notification._id.toString()}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'w-full p-4 text-left transition-colors hover:bg-surface',
                    !notification.read && 'bg-primary/10'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3
                          className={cn(
                            'text-sm font-medium',
                            !notification.read ? 'text-text' : 'text-text'
                          )}
                        >
                          {notification.title}
                        </h3>

                        {!notification.read && (
                          <div className="ml-2 h-2 w-2 rounded-full bg-red-500" />
                        )}
                      </div>

                      <p className="mt-1 text-sm text-text-light line-clamp-2">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-xs text-text-light">
                        {getNotificationTimeAgo(notification.createdAt)}
                      </p>
                    </div>

                    {notification.read && (
                      <Check className="h-4 w-4 text-text-light" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
