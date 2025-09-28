'use client';

import { Restaurant } from '@/types/database';
import { RestaurantImage } from '@/components/ui/RestaurantImage';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface RestaurantDetailsViewProps {
  restaurant: Restaurant;
  onManage?: () => void;
  onAddToCollection?: () => void;
  showManageButton?: boolean;
  showAddButton?: boolean;
}

export function RestaurantDetailsView({
  restaurant,
  onManage,
  onAddToCollection,
  showManageButton = false,
  showAddButton = false,
}: RestaurantDetailsViewProps) {
  const formatHours = (hours: Record<string, string>) => {
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return days.map((day) => {
      const hoursForDay = hours[day];
      return (
        <div key={day} className="flex justify-between">
          <span className="font-medium">{day}:</span>
          <span>{hoursForDay || 'Closed'}</span>
        </div>
      );
    });
  };

  const getPriceRangeText = (priceRange?: string) => {
    switch (priceRange) {
      case '$':
        return 'Inexpensive';
      case '$$':
        return 'Moderate';
      case '$$$':
        return 'Expensive';
      case '$$$$':
        return 'Very Expensive';
      default:
        return 'Not specified';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header with Image and Basic Info */}
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <RestaurantImage
              src={restaurant.photos?.[0]}
              alt={restaurant.name}
              cuisine={restaurant.cuisine}
              className="w-24 h-24 rounded-lg object-cover"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {restaurant.name}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="flex items-center gap-1">
                <span className="text-yellow-500">⭐</span>
                {restaurant.rating}
              </span>
              <span>{restaurant.cuisine}</span>
              {restaurant.priceRange && (
                <span>
                  {restaurant.priceRange} (
                  {getPriceRangeText(restaurant.priceRange)})
                </span>
              )}
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              {restaurant.address}
            </p>
          </div>
        </div>

        {/* Custom Fields */}
        {(restaurant.priceRange || restaurant.timeToPickUp) && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Custom Information
            </h3>
            <div className="space-y-2">
              {restaurant.priceRange && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Price Range:
                  </span>
                  <span className="font-medium">
                    {restaurant.priceRange} (
                    {getPriceRangeText(restaurant.priceRange)})
                  </span>
                </div>
              )}
              {restaurant.timeToPickUp && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Time to Pick Up:
                  </span>
                  <span className="font-medium">
                    {restaurant.timeToPickUp} minutes
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Information */}
        {(restaurant.phoneNumber || restaurant.website) && (
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Contact Information
            </h3>
            <div className="space-y-2">
              {restaurant.phoneNumber && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Phone:
                  </span>
                  <a
                    href={`tel:${restaurant.phoneNumber}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {restaurant.phoneNumber}
                  </a>
                </div>
              )}
              {restaurant.website && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Website:
                  </span>
                  <a
                    href={restaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hours */}
        {restaurant.hours && (
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Hours
            </h3>
            <div className="space-y-1 text-sm">
              {formatHours(restaurant.hours)}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(showManageButton || showAddButton) && (
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {showManageButton && onManage && (
              <Button onClick={onManage} className="flex-1">
                Manage Restaurant
              </Button>
            )}
            {showAddButton && onAddToCollection && (
              <Button
                onClick={onAddToCollection}
                variant="outline"
                className="flex-1"
              >
                Add to Collection
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
