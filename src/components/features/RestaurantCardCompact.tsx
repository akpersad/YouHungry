'use client';

import { Restaurant } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface RestaurantCardCompactProps {
  restaurant: Restaurant;
  onViewDetails?: (restaurant: Restaurant) => void;
  onManageRestaurant?: (restaurant: Restaurant) => void;
}

export function RestaurantCardCompact({
  restaurant,
  onViewDetails,
  onManageRestaurant,
}: RestaurantCardCompactProps) {
  const formatPriceRange = (priceRange?: string) => {
    if (!priceRange) return 'N/A';
    return priceRange;
  };

  const formatRating = (rating: number) => {
    return rating > 0 ? rating.toFixed(1) : 'N/A';
  };

  return (
    <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex flex-col h-full">
        {/* Restaurant Basic Info */}
        <div className="mb-3">
          <h3
            className="text-sm font-semibold text-primary truncate mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {restaurant.name}
          </h3>
          <div className="h-8">
            <p
              className="text-xs text-secondary line-clamp-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {restaurant.address}
            </p>
          </div>
        </div>

        {/* Key Details */}
        <div className="space-y-1 mb-3 flex-1">
          <div
            className="flex items-center justify-between text-xs text-secondary"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="flex items-center">
              ⭐ {formatRating(restaurant.rating)}
            </span>
            <span className="flex items-center">
              💰 {formatPriceRange(restaurant.priceRange)}
            </span>
          </div>

          {restaurant.distance && (
            <p
              className="text-xs text-tertiary truncate"
              style={{ color: 'var(--text-tertiary)' }}
            >
              📍 {restaurant.distance.toFixed(1)} mi
            </p>
          )}

          {restaurant.timeToPickUp && (
            <p
              className="text-xs text-tertiary"
              style={{ color: 'var(--text-tertiary)' }}
            >
              ⏱️ {restaurant.timeToPickUp} min
            </p>
          )}
        </div>

        {/* Action Buttons - Responsive: icons on mobile, text on desktop */}
        <div className="flex gap-1 pt-2 border-t border-border dark:border-border">
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(restaurant);
              }}
              className="flex-1 p-1 sm:p-2 touch-target"
              aria-label="View restaurant details"
            >
              {/* Mobile: Icon only */}
              <svg
                className="w-3.5 h-3.5 sm:hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {/* Desktop: Text */}
              <span className="hidden sm:inline text-xs">View</span>
            </Button>
          )}
          {onManageRestaurant && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onManageRestaurant(restaurant);
              }}
              className="flex-1 p-1 sm:p-2 touch-target"
              aria-label="Manage restaurant"
            >
              {/* Mobile: Icon only */}
              <svg
                className="w-3.5 h-3.5 sm:hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              {/* Desktop: Text */}
              <span className="hidden sm:inline text-xs">Manage</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
