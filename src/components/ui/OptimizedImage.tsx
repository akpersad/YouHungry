'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fallbackSrc?: string;
  sizes?: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  fallbackSrc = '/placeholder-restaurant.jpg',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  loading = 'lazy',
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current && loading === 'lazy') {
      observer.observe(imgRef.current);
    } else {
      setIsInView(true);
    }

    return () => observer.disconnect();
  }, [loading]);

  const handleError = () => {
    setHasError(true);
    setImageSrc(fallbackSrc);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Generate blur placeholder
  const generateBlurDataURL = (width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, width, height);

      // Add a subtle gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f0f0f0');
      gradient.addColorStop(1, '#e0e0e0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    return canvas.toDataURL();
  };

  const defaultBlurDataURL =
    blurDataURL ||
    (width && height ? generateBlurDataURL(width, height) : undefined);

  if (!isInView && loading === 'lazy') {
    return (
      <div
        ref={imgRef}
        className={cn('bg-tertiary animate-pulse', className)}
        style={{ width, height }}
      />
    );
  }

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden', className)}>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 bg-tertiary flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full h-full"
      >
        <Image
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={defaultBlurDataURL}
          sizes={sizes}
          quality={quality}
          onError={handleError}
          onLoad={handleLoad}
        />
      </motion.div>

      {hasError && (
        <motion.div
          className="absolute inset-0 bg-tertiary flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">🍽️</div>
            <p className="text-xs text-secondary">Image unavailable</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Restaurant image component with optimized loading
interface RestaurantImageProps {
  src?: string;
  alt: string;
  className?: string;
  cuisine?: string;
  priority?: boolean;
}

export function RestaurantImage({
  src,
  alt,
  className,
  cuisine,
  priority = false,
}: RestaurantImageProps) {
  // Generate cuisine-specific placeholder
  const getCuisineEmoji = (cuisine?: string) => {
    const cuisineEmojis: Record<string, string> = {
      pizza: '🍕',
      italian: '🍝',
      chinese: '🥢',
      japanese: '🍣',
      mexican: '🌮',
      indian: '🍛',
      thai: '🍜',
      korean: '🍲',
      american: '🍔',
      french: '🥐',
      mediterranean: '🥗',
      seafood: '🦐',
      vegetarian: '🥕',
      vegan: '🌱',
      fast_food: '🍟',
      bakery: '🥖',
      cafe: '☕',
      bar: '🍺',
      dessert: '🍰',
      breakfast: '🥞',
    };

    return cuisineEmojis[cuisine?.toLowerCase() || ''] || '🍽️';
  };

  const placeholderEmoji = getCuisineEmoji(cuisine);

  if (!src) {
    return (
      <div
        className={cn(
          'bg-tertiary flex items-center justify-center text-4xl',
          className
        )}
      >
        {placeholderEmoji}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      priority={priority}
      placeholder="blur"
      fallbackSrc={`data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#f0f0f0"/>
          <text x="100" y="100" text-anchor="middle" dy=".3em" font-size="48">
            ${placeholderEmoji}
          </text>
        </svg>
      `)}`}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}

// Avatar image component
interface AvatarImageProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarImage({
  src,
  alt,
  size = 'md',
  className,
}: AvatarImageProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const sizePixels = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  if (!src) {
    return (
      <div
        className={cn(
          'bg-tertiary flex items-center justify-center text-secondary font-medium',
          sizeClasses[size],
          className
        )}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={sizePixels[size]}
      height={sizePixels[size]}
      className={cn('rounded-full', sizeClasses[size], className)}
      priority
      placeholder="blur"
      fallbackSrc={`data:image/svg+xml;base64,${btoa(`
        <svg width="${sizePixels[size]}" height="${sizePixels[size]}" viewBox="0 0 ${sizePixels[size]} ${sizePixels[size]}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${sizePixels[size]}" height="${sizePixels[size]}" fill="#f0f0f0"/>
          <text x="${sizePixels[size] / 2}" y="${sizePixels[size] / 2}" text-anchor="middle" dy=".3em" font-size="${sizePixels[size] / 2}" fill="#999">
            ${alt.charAt(0).toUpperCase()}
          </text>
        </svg>
      `)}`}
    />
  );
}
