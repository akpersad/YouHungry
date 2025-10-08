// Google Maps API global declarations
/// <reference types="@types/google.maps" />

declare global {
  interface Window {
    google: typeof google;
    selectRestaurant: (id: string) => void;
    viewRestaurantDetails: (id: string) => void;
  }
}

export {};
