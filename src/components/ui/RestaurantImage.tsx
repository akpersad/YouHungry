'use client';

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
        className={`${className} bg-gray-200 flex items-center justify-center text-2xl`}
        title={alt}
      >
        {icon}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!imageLoaded && !imageError && (
        <div
          className={`absolute inset-0 bg-gray-200 flex items-center justify-center text-2xl animate-pulse`}
        >
          {icon}
        </div>
      )}
      {/* Using regular img tag for external Google Places API images with custom loading states */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${!imageLoaded || imageError ? 'hidden' : ''}`}
        onError={(e) => {
          console.error('Image failed to load:', src, e);
          setImageError(true);
        }}
        onLoad={() => {
          console.log('Image loaded successfully:', src);
          setImageLoaded(true);
        }}
        style={{ position: 'absolute', inset: 0 }}
        loading="lazy"
      />
    </div>
  );
}
