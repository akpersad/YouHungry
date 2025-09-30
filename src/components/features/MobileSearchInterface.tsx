'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomSheet, QuickActionSheet } from '@/components/ui/BottomSheet';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { cn } from '@/lib/utils';

interface MobileSearchInterfaceProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  currentView: 'list' | 'map';
  onViewToggle: (view: 'list' | 'map') => void;
  filters?: {
    cuisine?: string[];
    priceRange?: string[];
    rating?: number;
    distance?: number;
  };
  onFiltersChange?: (filters: Record<string, unknown>) => void;
  isSearching?: boolean;
  className?: string;
}

export function MobileSearchInterface({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  currentView,
  onViewToggle,
  filters = {},
  onFiltersChange,
  isSearching = false,
  className,
}: MobileSearchInterfaceProps) {
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when it becomes visible
  useEffect(() => {
    if (showSearchBar && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchBar]);

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
    setShowSearchBar(false);
  };

  // Quick filter actions
  const quickFilterActions = [
    {
      id: 'pizza',
      label: 'Pizza',
      icon: <span className="text-lg">🍕</span>,
      onClick: () => {
        onFiltersChange?.({ ...filters, cuisine: ['pizza'] });
        setIsFilterSheetOpen(false);
      },
    },
    {
      id: 'asian',
      label: 'Asian',
      icon: <span className="text-lg">🍜</span>,
      onClick: () => {
        onFiltersChange?.({ ...filters, cuisine: ['asian'] });
        setIsFilterSheetOpen(false);
      },
    },
    {
      id: 'mexican',
      label: 'Mexican',
      icon: <span className="text-lg">🌮</span>,
      onClick: () => {
        onFiltersChange?.({ ...filters, cuisine: ['mexican'] });
        setIsFilterSheetOpen(false);
      },
    },
    {
      id: 'italian',
      label: 'Italian',
      icon: <span className="text-lg">🍝</span>,
      onClick: () => {
        onFiltersChange?.({ ...filters, cuisine: ['italian'] });
        setIsFilterSheetOpen(false);
      },
    },
    {
      id: 'american',
      label: 'American',
      icon: <span className="text-lg">🍔</span>,
      onClick: () => {
        onFiltersChange?.({ ...filters, cuisine: ['american'] });
        setIsFilterSheetOpen(false);
      },
    },
    {
      id: 'clear',
      label: 'Clear Filters',
      icon: <span className="text-lg">🗑️</span>,
      onClick: () => {
        onFiltersChange?.({});
        setIsFilterSheetOpen(false);
      },
      variant: 'destructive' as const,
    },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search restaurants..."
            className="pr-20 touch-target"
            onFocus={() => setShowSearchBar(true)}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFilterSheetOpen(true)}
              className="h-8 w-8 p-0 rounded-full"
              aria-label="Open filters"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                />
              </svg>
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSearching || !searchQuery.trim()}
              className="h-8 w-8 p-0 rounded-full"
              aria-label="Search"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </Button>
          </div>
        </form>

        {/* Quick Search Suggestions - Only show when focused and no query */}
        {showSearchBar && !searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-secondary border border-quaternary rounded-xl shadow-neumorphic-elevated z-10">
            <div className="p-2">
              <p className="text-xs text-tertiary mb-2 px-2">Quick searches:</p>
              <div className="space-y-1">
                {['Pizza near me', 'Sushi', 'Breakfast', 'Coffee'].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        onSearchChange(suggestion);
                        searchInputRef.current?.focus();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-tertiary text-sm text-primary transition-colors"
                    >
                      {suggestion}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {(filters.cuisine?.length ||
        filters.priceRange?.length ||
        filters.rating ||
        filters.distance) && (
        <div className="flex flex-wrap gap-2">
          {filters.cuisine?.map((cuisine) => (
            <span
              key={cuisine}
              className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full"
            >
              {cuisine}
              <button
                onClick={() => {
                  const newCuisine = filters.cuisine?.filter(
                    (c) => c !== cuisine
                  );
                  onFiltersChange?.({ ...filters, cuisine: newCuisine });
                }}
                className="ml-1 hover:bg-accent/20 rounded-full p-0.5"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          ))}
          {filters.priceRange?.map((price) => (
            <span
              key={price}
              className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full"
            >
              {price}
              <button
                onClick={() => {
                  const newPriceRange = filters.priceRange?.filter(
                    (p) => p !== price
                  );
                  onFiltersChange?.({ ...filters, priceRange: newPriceRange });
                }}
                className="ml-1 hover:bg-accent/20 rounded-full p-0.5"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          ))}
          {filters.rating && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
              ⭐ {filters.rating}+ stars
              <button
                onClick={() =>
                  onFiltersChange?.({ ...filters, rating: undefined })
                }
                className="ml-1 hover:bg-accent/20 rounded-full p-0.5"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}
          {filters.distance && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
              📍 {filters.distance} mi
              <button
                onClick={() =>
                  onFiltersChange?.({ ...filters, distance: undefined })
                }
                className="ml-1 hover:bg-accent/20 rounded-full p-0.5"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}

      {/* View Toggle - Positioned for mobile */}
      <div className="flex justify-center">
        <ViewToggle
          currentView={currentView}
          onToggle={onViewToggle}
          size="md"
          position="inline"
        />
      </div>

      {/* Filter Bottom Sheet */}
      <QuickActionSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        actions={quickFilterActions}
      />

      {/* Location Bottom Sheet */}
      <BottomSheet
        isOpen={isLocationSheetOpen}
        onClose={() => setIsLocationSheetOpen(false)}
        title="Set Location"
      >
        <div className="space-y-4">
          <p className="text-secondary text-sm">
            Allow location access to find restaurants near you, or enter a
            custom address.
          </p>
          <Button
            onClick={() => {
              // Handle location permission
              navigator.geolocation?.getCurrentPosition(
                (position) => {
                  // Handle successful location
                  console.log('Location:', position.coords);
                  setIsLocationSheetOpen(false);
                },
                (error) => {
                  console.error('Location error:', error);
                }
              );
            }}
            className="w-full touch-target"
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Use Current Location
            </div>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Handle custom address input
              const address = prompt('Enter your address:');
              if (address) {
                // Handle custom address
                console.log('Custom address:', address);
                setIsLocationSheetOpen(false);
              }
            }}
            className="w-full touch-target"
          >
            Enter Custom Address
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

// Touch gesture utilities
export const TouchGestures = {
  // Swipe detection
  useSwipeGesture: (
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void,
    onSwipeUp?: () => void,
    onSwipeDown?: () => void,
    threshold = 50
  ) => {
    const [touchStart, setTouchStart] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(
      null
    );

    const handleTouchStart = (e: React.TouchEvent) => {
      setTouchEnd(null);
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      });
    };

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;

      const deltaX = touchStart.x - touchEnd.x;
      const deltaY = touchStart.y - touchEnd.y;

      const isLeftSwipe = deltaX > threshold;
      const isRightSwipe = deltaX < -threshold;
      const isUpSwipe = deltaY > threshold;
      const isDownSwipe = deltaY < -threshold;

      if (isLeftSwipe) onSwipeLeft?.();
      if (isRightSwipe) onSwipeRight?.();
      if (isUpSwipe) onSwipeUp?.();
      if (isDownSwipe) onSwipeDown?.();
    };

    return {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    };
  },

  // Pull to refresh
  usePullToRefresh: (onRefresh: () => void, threshold = 100) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleTouchStart = (_e: React.TouchEvent) => {
      if (window.scrollY === 0) {
        setPullDistance(0);
      }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshing) {
        const distance = e.touches[0].clientY;
        setPullDistance(Math.max(0, distance));
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > threshold && !isRefreshing) {
        setIsRefreshing(true);
        onRefresh();
        setTimeout(() => setIsRefreshing(false), 1000);
      }
      setPullDistance(0);
    };

    return {
      pullDistance,
      isRefreshing,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    };
  },
};
