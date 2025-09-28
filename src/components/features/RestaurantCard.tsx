'use client';

import { Restaurant } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RestaurantImage } from '@/components/ui/RestaurantImage';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onAddToCollection?: (restaurant: Restaurant) => void;
  onViewDetails?: (restaurant: Restaurant) => void;
  showAddButton?: boolean;
  showDetailsButton?: boolean;
  isInCollection?: boolean;
}

export function RestaurantCard({
  restaurant,
  onAddToCollection,
  onViewDetails,
  showAddButton = true,
  showDetailsButton = true,
  isInCollection = false,
}: RestaurantCardProps) {
  const formatPriceRange = (priceRange?: string) => {
    if (!priceRange) return 'Price not available';
    return priceRange;
  };

  const formatRating = (rating: number) => {
    return rating > 0 ? rating.toFixed(1) : 'No rating';
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex flex-col space-y-3">
        {/* Restaurant Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {restaurant.name}
            </h3>
            <p className="text-sm text-gray-600 mb-2">{restaurant.cuisine}</p>
          </div>
          <RestaurantImage
            src={restaurant.photos?.[0]}
            alt={restaurant.name}
            className="w-16 h-16 ml-3"
            cuisine={restaurant.cuisine}
          />
        </div>

        {/* Restaurant Details */}
        <div className="space-y-2">
          <p className="text-sm text-gray-700">📍 {restaurant.address}</p>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              ⭐ {formatRating(restaurant.rating)}
            </span>
            <span className="flex items-center">
              💰 {formatPriceRange(restaurant.priceRange)}
            </span>
            {restaurant.distance && (
              <span className="flex items-center">
                📍 {restaurant.distance.toFixed(1)} mi
              </span>
            )}
            {restaurant.timeToPickUp && (
              <span className="flex items-center">
                ⏱️ {restaurant.timeToPickUp} min
              </span>
            )}
          </div>

          {restaurant.phoneNumber && (
            <p className="text-sm text-gray-600">📞 {restaurant.phoneNumber}</p>
          )}

          {restaurant.website && (
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              🌐 Visit Website
            </a>
          )}
        </div>

        {/* Hours */}
        {restaurant.hours && (
          <div className="text-sm">
            <p className="font-medium text-gray-700 mb-1">Hours:</p>
            <div className="space-y-1">
              {Object.entries(restaurant.hours)
                .slice(0, 3)
                .map(([day, hours]) => (
                  <p key={day} className="text-gray-600">
                    {day}: {hours}
                  </p>
                ))}
              {Object.keys(restaurant.hours).length > 3 && (
                <p className="text-gray-500 text-xs">
                  +{Object.keys(restaurant.hours).length - 3} more days
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          {showAddButton && onAddToCollection && (
            <Button
              variant={isInCollection ? 'outline' : 'primary'}
              size="sm"
              onClick={() => onAddToCollection(restaurant)}
              className={`flex-1 ${isInCollection ? 'text-green-600 border-green-300 hover:bg-green-50' : ''}`}
            >
              {isInCollection ? '✓ In Collection' : 'Add to Collection'}
            </Button>
          )}
          {showDetailsButton && onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(restaurant)}
              className="flex-1"
            >
              View Details
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
