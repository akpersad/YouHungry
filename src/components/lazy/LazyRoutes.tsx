'use client';

import { lazy, Suspense } from 'react';
// import { useRouter } from 'next/navigation'; // Reserved for future route preloading

// Lazy load page components
const LazyDashboard = lazy(() => import('@/app/dashboard/page'));
const LazyRestaurants = lazy(() => import('@/app/restaurants/page'));
const LazyGroups = lazy(() => import('@/app/groups/page'));
const LazyFriends = lazy(() => import('@/app/friends/page'));
const LazyCollections = lazy(() => import('@/app/collections/[id]/page'));

// Loading components for different page types
function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-8 bg-tertiary rounded-lg w-1/3" />
      <div className="space-y-3">
        <div className="h-4 bg-tertiary rounded w-2/3" />
        <div className="h-4 bg-tertiary rounded w-1/2" />
        <div className="h-4 bg-tertiary rounded w-3/4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-tertiary rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function CollectionSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-8 bg-tertiary rounded-lg w-1/4" />
      <div className="h-6 bg-tertiary rounded w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-tertiary rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Lazy route wrapper component
interface LazyRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyRoute({
  children,
  fallback = <PageSkeleton />,
}: LazyRouteProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

// Specific lazy route components
export function LazyDashboardRoute() {
  return (
    <LazyRoute>
      <LazyDashboard />
    </LazyRoute>
  );
}

export function LazyRestaurantsRoute() {
  return (
    <LazyRoute>
      <LazyRestaurants />
    </LazyRoute>
  );
}

export function LazyGroupsRoute() {
  return (
    <LazyRoute>
      <LazyGroups />
    </LazyRoute>
  );
}

export function LazyFriendsRoute() {
  return (
    <LazyRoute>
      <LazyFriends />
    </LazyRoute>
  );
}

export function LazyCollectionRoute() {
  return (
    <LazyRoute fallback={<CollectionSkeleton />}>
      <LazyCollections />
    </LazyRoute>
  );
}

// Hook for preloading routes
export function useRoutePreloader() {
  // const router = useRouter(); // Reserved for future route preloading

  const preloadRoute = (route: string) => {
    // Preload the route component
    switch (route) {
      case '/dashboard':
        import('@/app/dashboard/page');
        break;
      case '/restaurants':
        import('@/app/restaurants/page');
        break;
      case '/groups':
        import('@/app/groups/page');
        break;
      case '/friends':
        import('@/app/friends/page');
        break;
      default:
        if (route.startsWith('/collections/')) {
          import('@/app/collections/[id]/page');
        }
        break;
    }
  };

  const preloadOnHover = (route: string) => {
    // Preload route when user hovers over navigation link
    const timeoutId = setTimeout(() => {
      preloadRoute(route);
    }, 200); // 200ms delay to avoid unnecessary preloading

    return () => clearTimeout(timeoutId);
  };

  return { preloadRoute, preloadOnHover };
}

// Route preloader component for navigation
interface RoutePreloaderProps {
  route: string;
  children: React.ReactNode;
}

export function RoutePreloader({ route, children }: RoutePreloaderProps) {
  const { preloadOnHover } = useRoutePreloader();

  const handleMouseEnter = () => {
    preloadOnHover(route);
  };

  return <div onMouseEnter={handleMouseEnter}>{children}</div>;
}

// Dynamic route loader for collections
interface DynamicCollectionLoaderProps {
  collectionId: string;
  children: React.ReactNode;
}

export function DynamicCollectionLoader({
  children,
}: DynamicCollectionLoaderProps) {
  return <LazyRoute fallback={<CollectionSkeleton />}>{children}</LazyRoute>;
}

// Export all lazy route components
export {
  LazyDashboard,
  LazyRestaurants,
  LazyGroups,
  LazyFriends,
  LazyCollections,
};
