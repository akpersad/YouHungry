'use client';

import { logger } from '@/lib/logger';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RestaurantSearchPage } from '@/components/features/RestaurantSearchPage';
import { Button } from '@/components/ui/Button';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function RestaurantsPage() {
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshCache = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/cache/clear-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Clear all
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Cache cleared: ${data.deletedCount} entries removed`);
        // Invalidate the query to force re-fetch
        queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      } else {
        toast.error('Failed to clear cache');
      }
    } catch (error) {
      logger.error('Error clearing cache:', error);
      toast.error('Error clearing cache');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto py-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-text">Restaurant Search</h1>
            {isAdmin && (
              <Button
                onClick={handleRefreshCache}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="text-sm"
              >
                {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh Cache (Admin)'}
              </Button>
            )}
          </div>
          <p className="text-text-light">
            Discover and explore restaurants in your area or search by name.
          </p>
        </div>

        <RestaurantSearchPage />
      </div>
    </ProtectedRoute>
  );
}
