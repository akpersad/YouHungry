'use client';

import { logger } from '@/lib/logger';
import { useState } from 'react';

interface RestaurantImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackIcon?: string;
  cuisine?: string;
}

export function RestaurantImage({
  src,
  alt,
  className = 'w-16 h-16 object-cover rounded-lg',
  fallbackIcon,
  cuisine,
}: RestaurantImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get cuisine-specific icon
  const getCuisineIcon = (cuisineType?: string) => {
    if (!cuisineType) return '🍽️';

    const cuisine = cuisineType.toLowerCase();
    if (cuisine.includes('italian') || cuisine.includes('pizza')) return '🍕';
    if (cuisine.includes('chinese') || cuisine.includes('asian')) return '🥢';
    if (cuisine.includes('mexican') || cuisine.includes('taco')) return '🌮';
    if (cuisine.includes('japanese') || cuisine.includes('sushi')) return '🍣';
    if (cuisine.includes('indian')) return '🍛';
    if (cuisine.includes('thai')) return '🍜';
    if (cuisine.includes('american') || cuisine.includes('burger')) return '🍔';
    if (cuisine.includes('french')) return '🥐';
    if (cuisine.includes('greek')) return '🥙';
    if (cuisine.includes('seafood') || cuisine.includes('fish')) return '🐟';
    if (cuisine.includes('coffee') || cuisine.includes('cafe')) return '☕';
    if (cuisine.includes('dessert') || cuisine.includes('ice cream'))
      return '🍰';
    return '🍽️';
  };

  const icon = fallbackIcon || getCuisineIcon(cuisine);

  // If no src or image failed to load, show placeholder
  if (!src || imageError) {
    return (
      <div
        className={`${className} bg-surface flex items-center justify-center text-2xl`}
        title={alt}
      >
        {icon}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Show placeholder icon while loading or on error */}
      {!imageLoaded && !imageError && (
        <div
          className={`absolute inset-0 bg-surface flex items-center justify-center text-2xl animate-pulse z-10`}
        >
          {icon}
        </div>
      )}
      {/* Always render the image so onLoad can fire, but control visibility with opacity */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          imageLoaded && !imageError ? 'opacity-100' : 'opacity-0'
        }`}
        onError={(e) => {
          logger.error('Image failed to load:', src, e);
          setImageError(true);
        }}
        onLoad={() => {
          logger.debug('Image loaded successfully:', src);
          setImageLoaded(true);
        }}
        style={{ position: 'absolute', inset: 0 }}
        loading="lazy"
      />
    </div>
  );
}
