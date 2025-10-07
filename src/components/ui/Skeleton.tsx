'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { skeletonVariants } from '@/lib/animations';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
  srText?: string;
}

export function Skeleton({
  className,
  children,
  srText = 'Loading...',
}: SkeletonProps) {
  return (
    <motion.div
      className={cn('bg-tertiary rounded', className)}
      variants={skeletonVariants}
      animate="animate"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={srText}
    >
      <span className="sr-only">{srText}</span>
      {children}
    </motion.div>
  );
}

// Restaurant Card Skeleton
export function RestaurantCardSkeleton() {
  return (
    <div className="p-0 overflow-hidden" data-testid="restaurant-card-skeleton">
      {/* Photo skeleton */}
      <Skeleton className="w-full h-48" />

      <div className="p-4 space-y-3">
        {/* Name skeleton */}
        <Skeleton className="h-6 w-3/4" />

        {/* Price/Rating skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>

        {/* Address skeleton */}
        <Skeleton className="h-4 w-full" />

        {/* Tags skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Collection Card Skeleton
export function CollectionCardSkeleton() {
  return (
    <div className="p-4" data-testid="collection-card-skeleton">
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>

        {/* Restaurant count skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// List Item Skeleton
export function ListItemSkeleton() {
  return (
    <div className="p-3">
      <div className="flex items-center space-x-3">
        {/* Small photo skeleton */}
        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>

        {/* Action button skeleton */}
        <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
      </div>
    </div>
  );
}

// Form Skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Form fields skeleton */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>

      {/* Form buttons skeleton */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        <Skeleton className="h-10 w-full sm:w-auto rounded-lg" />
        <Skeleton className="h-10 w-full sm:w-auto rounded-lg" />
      </div>
    </div>
  );
}

// Search Results Skeleton
export function SearchResultsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <RestaurantCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

// Collection List Skeleton
export function CollectionListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      {/* Collection cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <CollectionCardSkeleton />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Decision Interface Skeleton
export function DecisionInterfaceSkeleton() {
  return (
    <div className="space-y-6" data-testid="decision-interface-skeleton">
      {/* Progress header skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="w-full h-2 rounded-full" />
      </div>

      {/* Restaurant card skeleton */}
      <RestaurantCardSkeleton />

      {/* Swipe instructions skeleton */}
      <div className="text-center space-y-2">
        <Skeleton className="h-4 w-32 mx-auto" />
        <div className="flex justify-center gap-6">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

// Page Loading Skeleton
export function PageLoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
