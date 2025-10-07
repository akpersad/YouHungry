'use client';

import { Restaurant } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RestaurantImage } from '@/components/ui/RestaurantImage';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { cardVariants } from '@/lib/animations';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onAddToCollection?: (restaurant: Restaurant) => void;
  onViewDetails?: (restaurant: Restaurant) => void;
  showAddButton?: boolean;
  showDetailsButton?: boolean;
  isInCollection?: boolean;
  variant?: 'default' | 'compact' | 'mobile-optimized';
}

export function RestaurantCard({
  restaurant,
  onAddToCollection,
  onViewDetails,
  showAddButton = true,
  showDetailsButton = true,
  isInCollection = false,
  variant = 'mobile-optimized',
}: RestaurantCardProps) {
  const formatPriceRange = (priceRange?: string) => {
    if (!priceRange) return 'Price N/A';
    return priceRange;
  };

  const formatRating = (rating: number) => {
    return rating > 0 ? rating.toFixed(1) : 'No rating';
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    return `${distance.toFixed(1)} mi`;
  };

  const formatTimeToPickUp = (timeToPickUp?: number) => {
    if (!timeToPickUp) return '';
    return `${timeToPickUp} min`;
  };

  // Mobile-optimized variant with hierarchy: Photo → Name → Price/Rating → Distance → Tags
  if (variant === 'mobile-optimized') {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        whileTap="tap"
        layout
      >
        <Card className="p-0 overflow-hidden touch-target hover:shadow-medium transition-all duration-200">
          {/* 1. PHOTO - Large, prominent image */}
          <div className="relative w-full h-48 overflow-hidden">
            <RestaurantImage
              src={restaurant.photos?.[0]}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              cuisine={restaurant.cuisine}
            />
            {/* Distance badge overlay */}
            {restaurant.distance && (
              <div className="absolute top-2 right-2 bg-secondary/90 backdrop-blur-sm text-primary text-xs font-medium px-2 py-1 rounded-lg shadow-neumorphic-light">
                📍 {formatDistance(restaurant.distance)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* 2. NAME - Clear, readable restaurant name */}
            <h3
              className="text-lg font-semibold text-primary leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {restaurant.name}
            </h3>

            {/* 3. PRICE/RATING - Quick reference info */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-accent font-medium">
                  ⭐ {formatRating(restaurant.rating)}
                </span>
                <span className="flex items-center gap-1 text-secondary">
                  💰 {formatPriceRange(restaurant.priceRange)}
                </span>
              </div>
              {restaurant.timeToPickUp && (
                <span className="flex items-center gap-1 text-tertiary text-xs">
                  ⏱️ {formatTimeToPickUp(restaurant.timeToPickUp)}
                </span>
              )}
            </div>

            {/* 4. DISTANCE - Practical info (if not shown in badge) */}
            {restaurant.distance && (
              <div className="text-sm text-tertiary">
                📍 {restaurant.address}
              </div>
            )}

            {/* 5. TAGS - Cuisine and additional info */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-tertiary text-secondary text-xs font-medium">
                {restaurant.cuisine}
              </span>
              {restaurant.phoneNumber && (
                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-tertiary text-secondary text-xs font-medium">
                  📞 Available
                </span>
              )}
              {restaurant.website && (
                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-tertiary text-secondary text-xs font-medium">
                  🌐 Website
                </span>
              )}
            </div>

            {/* Action Buttons - Touch optimized */}
            {(showAddButton || showDetailsButton) && (
              <div className="flex gap-2 pt-2">
                {showAddButton && onAddToCollection && (
                  <Button
                    variant={isInCollection ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => onAddToCollection(restaurant)}
                    className={cn(
                      'flex-1 touch-target',
                      isInCollection && 'text-success border-success'
                    )}
                  >
                    {isInCollection ? '✓ Added' : 'Add to Collection'}
                  </Button>
                )}
                {showDetailsButton && onViewDetails && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(restaurant)}
                    className="flex-1 touch-target"
                  >
                    Details
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  }

  // Compact variant for lists
  if (variant === 'compact') {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        whileTap="tap"
        layout
      >
        <Card className="p-3 touch-target hover:shadow-medium transition-all duration-200">
          <div className="flex items-center space-x-3">
            {/* Small photo */}
            <RestaurantImage
              src={restaurant.photos?.[0]}
              alt={restaurant.name}
              className="w-12 h-12 rounded-lg flex-shrink-0"
              cuisine={restaurant.cuisine}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3
                className="text-base font-medium text-primary truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {restaurant.name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-secondary mt-1">
                <span>⭐ {formatRating(restaurant.rating)}</span>
                <span>💰 {formatPriceRange(restaurant.priceRange)}</span>
                {restaurant.distance && (
                  <span>📍 {formatDistance(restaurant.distance)}</span>
                )}
              </div>
            </div>

            {/* Quick actions */}
            {showAddButton && onAddToCollection && (
              <Button
                variant={isInCollection ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => onAddToCollection(restaurant)}
                className="flex-shrink-0"
              >
                {isInCollection ? '✓' : '+'}
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    );
  }

  // Default variant (original design for desktop)
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      layout
    >
      <Card className="p-4 hover:shadow-lg transition-shadow">
        <div className="flex flex-col space-y-3">
          {/* Restaurant Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3
                className="text-lg font-semibold text-primary mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {restaurant.name}
              </h3>
              <p className="text-sm text-secondary mb-2">
                {restaurant.cuisine}
              </p>
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
            <p className="text-sm text-secondary">📍 {restaurant.address}</p>

            <div className="flex items-center space-x-4 text-sm text-secondary">
              <span className="flex items-center">
                ⭐ {formatRating(restaurant.rating)}
              </span>
              <span className="flex items-center">
                💰 {formatPriceRange(restaurant.priceRange)}
              </span>
              {restaurant.distance && (
                <span className="flex items-center">
                  📍 {formatDistance(restaurant.distance)}
                </span>
              )}
              {restaurant.timeToPickUp && (
                <span className="flex items-center">
                  ⏱️ {formatTimeToPickUp(restaurant.timeToPickUp)}
                </span>
              )}
            </div>

            {restaurant.phoneNumber && (
              <p className="text-sm text-secondary">
                📞 {restaurant.phoneNumber}
              </p>
            )}

            {restaurant.website && (
              <a
                href={restaurant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:opacity-80"
              >
                🌐 Visit Website
              </a>
            )}
          </div>

          {/* Hours */}
          {restaurant.hours && (
            <div className="text-sm">
              <p className="font-medium text-primary mb-1">Hours:</p>
              <div className="space-y-1">
                {Object.entries(restaurant.hours)
                  .slice(0, 3)
                  .map(([day, hours]) => (
                    <p key={day} className="text-secondary">
                      {day}: {hours}
                    </p>
                  ))}
                {Object.keys(restaurant.hours).length > 3 && (
                  <p className="text-tertiary text-xs">
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
                className={cn(
                  'flex-1',
                  isInCollection &&
                    'text-success border-success hover:bg-success/10'
                )}
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
    </motion.div>
  );
}
