'use client';

import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InAppNotification } from '@/types/database';

export interface NotificationFilters {
  type?: InAppNotification['type'];
  read?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  unreadCount: number;
  total: number;
}

export function useInAppNotifications(filters: NotificationFilters = {}) {
  const queryClient = useQueryClient();

  // Get notifications
  const {
    data: notificationData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.type) params.append('type', filters.type);
      if (filters.read !== undefined)
        params.append('read', filters.read.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`/api/notifications?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      return response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes (reduced from 30s)
    refetchIntervalInBackground: false, // Don't poll when tab is inactive
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_read',
          notificationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_all_read',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications: InAppNotification[] =
    notificationData?.notifications || [];
  const stats: NotificationStats = {
    unreadCount: notificationData?.unreadCount || 0,
    total: notificationData?.total || 0,
  };

  const markAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutation.mutate(notificationId);
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  // Auto-refresh when window becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch]);

  return {
    notifications,
    stats,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
}

// Hook for unread count only (lighter weight)
export function useUnreadNotificationCount() {
  const { stats, isLoading, error } = useInAppNotifications({ limit: 1 });

  return {
    unreadCount: stats.unreadCount,
    isLoading,
    error,
  };
}
