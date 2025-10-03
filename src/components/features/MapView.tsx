'use client';

import { useEffect, useRef, useState } from 'react';
import { Restaurant } from '@/types/database';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

interface MapViewProps {
  restaurants: Restaurant[];
  onRestaurantSelect?: (restaurant: Restaurant) => void;
  onRestaurantDetails?: (restaurant: Restaurant) => void;
  selectedRestaurant?: Restaurant | null;
  className?: string;
  height?: string;
}

interface MapComponentProps {
  restaurants: Restaurant[];
  onRestaurantSelect?: (restaurant: Restaurant) => void;
  onRestaurantDetails?: (restaurant: Restaurant) => void;
  selectedRestaurant?: Restaurant | null;
}

// Custom marker class for restaurant markers
class RestaurantMarker {
  public restaurant: Restaurant;
  public infoWindow: google.maps.InfoWindow;
  public marker: google.maps.Marker;

  constructor(
    restaurant: Restaurant,
    map: google.maps.Map,
    onSelect?: (restaurant: Restaurant) => void,
    onDetails?: (restaurant: Restaurant) => void
  ) {
    const position = {
      lat: restaurant.coordinates.lat,
      lng: restaurant.coordinates.lng,
    };

    this.restaurant = restaurant;
    this.marker = new google.maps.Marker({
      position,
      map,
      title: restaurant.name,
      icon: {
        url:
          'data:image/svg+xml;charset=UTF-8,' +
          encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
            <path d="M16 8c-2.2 0-4 1.8-4 4 0 3.2 4 8 4 8s4-4.8 4-8c0-2.2-1.8-4-4-4z" fill="#ffffff"/>
            <circle cx="16" cy="12" r="2" fill="#ef4444"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 32),
      },
    });

    this.infoWindow = new google.maps.InfoWindow({
      content: this.createInfoWindowContent(),
    });

    // Add click listener to marker
    this.marker.addListener('click', () => {
      onSelect?.(restaurant);
      this.infoWindow.open(map, this.marker);
    });

    // Add double-click listener for details
    this.marker.addListener('dblclick', () => {
      onDetails?.(restaurant);
    });
  }

  private createInfoWindowContent(): string {
    const { restaurant } = this;
    const photoUrl = restaurant.photos?.[0] || '/icons/icon-96x96.svg';
    const rating = restaurant.rating || 0;
    const priceRange = restaurant.priceRange || 'N/A';
    const priceText = priceRange;

    return `
      <div class="p-3 max-w-xs">
        <div class="flex items-start gap-3">
          <img 
            src="${photoUrl}" 
            alt="${restaurant.name}" 
            class="w-16 h-16 object-cover rounded-lg"
            onerror="this.src='/icons/icon-96x96.svg'"
          />
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 text-sm leading-tight mb-1">
              ${restaurant.name}
            </h3>
            <div class="flex items-center gap-2 mb-2">
              <div class="flex items-center">
                <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span class="text-sm text-gray-600 ml-1">${rating.toFixed(1)}</span>
              </div>
              <span class="text-sm text-gray-500">${priceText}</span>
            </div>
            <p class="text-xs text-gray-500 mb-2 line-clamp-2">
              ${restaurant.address || 'Address not available'}
            </p>
            <div class="flex gap-1">
              <button 
                onclick="window.selectRestaurant('${restaurant._id}')"
                class="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                Select
              </button>
              <button 
                onclick="window.viewRestaurantDetails('${restaurant._id}')"
                class="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
              >
                Details
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  public updateInfoWindow(): void {
    this.infoWindow.setContent(this.createInfoWindowContent());
  }

  public setSelected(selected: boolean): void {
    if (selected) {
      this.marker.setIcon({
        url:
          'data:image/svg+xml;charset=UTF-8,' +
          encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#3b82f6" stroke="#ffffff" stroke-width="3"/>
            <path d="M20 10c-2.2 0-4 1.8-4 4 0 3.2 4 8 4 8s4-4.8 4-8c0-2.2-1.8-4-4-4z" fill="#ffffff"/>
            <circle cx="20" cy="14" r="2.5" fill="#3b82f6"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 40),
      });
    } else {
      this.marker.setIcon({
        url:
          'data:image/svg+xml;charset=UTF-8,' +
          encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
            <path d="M16 8c-2.2 0-4 1.8-4 4 0 3.2 4 8 4 8s4-4.8 4-8c0-2.2-1.8-4-4-4z" fill="#ffffff"/>
            <circle cx="16" cy="12" r="2" fill="#ef4444"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 32),
      });
    }
  }

  public getPosition(): google.maps.LatLng | null {
    return this.marker.getPosition() || null;
  }

  public setMap(map: google.maps.Map | null): void {
    this.marker.setMap(map);
  }

  public getVisible(): boolean {
    return this.marker.getVisible();
  }

  public setVisible(visible: boolean): void {
    this.marker.setVisible(visible);
  }

  public getMap(): google.maps.Map | google.maps.StreetViewPanorama | null {
    return this.marker.getMap();
  }
}

// Map component that renders the actual Google Map
function MapComponent({
  restaurants,
  onRestaurantSelect,
  onRestaurantDetails,
  selectedRestaurant,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<RestaurantMarker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'greedy', // Mobile-optimized touch gestures
      clickableIcons: false, // Disable POI clicks for better UX
      disableDefaultUI: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    mapInstanceRef.current = map;
    setMapLoaded(true);

    // Add map loaded listener
    map.addListener('tilesloaded', () => {
      logger.debug('Google Map tiles loaded');
    });

    return () => {
      // Cleanup markers and clusterer
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
    };
  }, []);

  // Track if this is the first time markers are being created
  const isInitialLoadRef = useRef(true);

  // Update markers when restaurants change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const map = mapInstanceRef.current;

    // Clear existing markers and clusterer
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }

    if (restaurants.length === 0) return;

    // Create new markers
    const newMarkers = restaurants
      .filter(
        (restaurant) =>
          restaurant.coordinates?.lat && restaurant.coordinates?.lng
      )
      .map((restaurant) => {
        const marker = new RestaurantMarker(
          restaurant,
          map,
          onRestaurantSelect,
          onRestaurantDetails
        );

        // Add a subtle drop animation only on initial load
        if (isInitialLoadRef.current) {
          setTimeout(() => {
            marker.marker.setAnimation(google.maps.Animation.DROP);
            // Stop animation after it completes
            setTimeout(() => {
              marker.marker.setAnimation(null);
            }, 1000);
          }, 100);
        }

        return marker;
      });

    // Mark that initial load is complete
    isInitialLoadRef.current = false;

    markersRef.current = newMarkers;

    // Create marker clusterer
    if (newMarkers.length > 0) {
      clustererRef.current = new MarkerClusterer({
        map,
        markers: newMarkers.map((marker) => marker.marker),
        renderer: {
          render: ({ count, position }) => {
            const color =
              count > 10 ? '#ef4444' : count > 5 ? '#f59e0b' : '#10b981';
            return new google.maps.Marker({
              position,
              icon: {
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                  <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="${color}" stroke="#ffffff" stroke-width="3"/>
                    <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${count}</text>
                  </svg>
                `)}`,
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 20),
              },
              label: {
                text: count.toString(),
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
              },
              zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
            });
          },
        },
      });

      // Set up global functions for info window buttons
      (
        window as unknown as { selectRestaurant: (id: string) => void }
      ).selectRestaurant = (restaurantId: string) => {
        const restaurant = restaurants.find(
          (r) => r._id.toString() === restaurantId
        );
        if (restaurant) {
          onRestaurantSelect?.(restaurant);
        }
      };

      (
        window as unknown as { viewRestaurantDetails: (id: string) => void }
      ).viewRestaurantDetails = (restaurantId: string) => {
        const restaurant = restaurants.find(
          (r) => r._id.toString() === restaurantId
        );
        if (restaurant) {
          onRestaurantDetails?.(restaurant);
        }
      };

      // Fit map to show all markers
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach((marker) => {
        bounds.extend(marker.getPosition()!);
      });
      map.fitBounds(bounds);

      // If only one marker, set a reasonable zoom level
      if (newMarkers.length === 1) {
        map.setZoom(15);
      }
    }

    logger.debug(
      `Created ${newMarkers.length} markers for restaurants with clustering`
    );
  }, [restaurants, mapLoaded, onRestaurantSelect, onRestaurantDetails]);

  // Update selected marker
  useEffect(() => {
    markersRef.current.forEach((marker) => {
      const isSelected =
        selectedRestaurant?._id.toString() === marker.restaurant._id.toString();
      marker.setSelected(isSelected);
    });
  }, [selectedRestaurant]);

  return <div ref={mapRef} className="w-full h-full" />;
}

// Loading component
function MapLoading() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
        <Skeleton className="w-32 h-4 mx-auto mb-2" />
        <Skeleton className="w-24 h-3 mx-auto" />
      </div>
    </div>
  );
}

// Error component
function MapError({ retry }: { retry: () => void }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg">
      <div className="text-center p-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Map Loading Failed
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Unable to load the map. Please check your internet connection and try
          again.
        </p>
        <Button onClick={retry} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    </div>
  );
}

// Main MapView component
export function MapView({
  restaurants,
  onRestaurantSelect,
  onRestaurantDetails,
  selectedRestaurant,
  className = '',
  height = '500px',
}: MapViewProps) {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check if Google Maps API is loaded
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (
        typeof window !== 'undefined' &&
        window.google &&
        window.google.maps
      ) {
        setIsGoogleMapsLoaded(true);
        setHasError(false);
        logger.debug('Google Maps API loaded successfully');
      } else {
        // Retry after a short delay
        setTimeout(checkGoogleMaps, 100);
      }
    };

    // Start checking after component mounts
    const timeout = setTimeout(checkGoogleMaps, 100);

    // Set a maximum timeout to show error if Google Maps doesn't load
    const maxTimeout = setTimeout(() => {
      if (!isGoogleMapsLoaded) {
        setHasError(true);
        logger.error('Google Maps API failed to load within timeout');
      }
    }, 10000); // 10 second timeout

    return () => {
      clearTimeout(timeout);
      clearTimeout(maxTimeout);
    };
  }, [isGoogleMapsLoaded, retryCount]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Google Maps API Key Required
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please configure NEXT_PUBLIC_GOOGLE_PLACES_API_KEY in your
            environment variables.
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return <MapError retry={() => setRetryCount((prev) => prev + 1)} />;
  }

  if (!isGoogleMapsLoaded) {
    return <MapLoading />;
  }

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <MapComponent
        restaurants={restaurants}
        onRestaurantSelect={onRestaurantSelect}
        onRestaurantDetails={onRestaurantDetails}
        selectedRestaurant={selectedRestaurant}
      />
    </div>
  );
}
