// Google Maps API global declarations
declare global {
  interface Window {
    google: typeof google;
    selectRestaurant: (id: string) => void;
    viewRestaurantDetails: (id: string) => void;
  }
}

export {};
