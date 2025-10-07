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
          <p
            className="text-xs text-secondary break-words"
            style={{ color: 'var(--text-secondary)' }}
          >
            {restaurant.address}
          </p>
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

        {/* Action Buttons */}
        <div className="flex space-x-1 pt-2 border-t border-gray-100 dark:border-gray-700">
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(restaurant);
              }}
              className="flex-1 text-xs px-2 py-1"
            >
              View
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
              className="flex-1 text-xs px-2 py-1"
            >
              Manage
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
