'use client';

import { lazy, Suspense } from 'react';
import { Restaurant } from '@/types/database';
import { Skeleton } from '@/components/ui/Skeleton';

// Lazy load the MapView component
const MapView = lazy(() =>
  import('./MapView').then((module) => ({ default: module.MapView }))
);

interface LazyMapViewProps {
  restaurants: Restaurant[];
  onRestaurantSelect?: (restaurant: Restaurant) => void;
  onRestaurantDetails?: (restaurant: Restaurant) => void;
  selectedRestaurant?: Restaurant | null;
  className?: string;
  height?: string;
}

// Loading skeleton for map
function MapSkeleton({ height = '500px' }: { height?: string }) {
  return (
    <div className="w-full rounded-lg overflow-hidden" style={{ height }}>
      <Skeleton className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-text-light dark:text-text-light">
            Loading map...
          </p>
        </div>
      </div>
    </div>
  );
}

export function LazyMapView(props: LazyMapViewProps) {
  return (
    <Suspense fallback={<MapSkeleton height={props.height} />}>
      <MapView {...props} />
    </Suspense>
  );
}
