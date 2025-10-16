// Google Analytics 4 Type Definitions

export interface GtagEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: unknown;
}

// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set' | 'get',
      targetIdOrEventName: string,
      params?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

// Event parameter types for type safety
export interface AuthEventParams {
  method?: 'email' | 'phone' | 'social';
  provider?: string;
}

export interface SearchEventParams {
  search_term?: string;
  location?: string;
  filters?: string;
  results_count?: number;
  distance_miles?: number;
}

export interface RestaurantEventParams {
  restaurant_id?: string;
  restaurant_name?: string;
  cuisine_type?: string;
  price_level?: number;
  rating?: number;
  position?: number; // Position in search results
}

export interface CollectionEventParams {
  collection_id?: string;
  collection_name?: string;
  collection_type?: 'personal' | 'group';
  restaurant_count?: number;
}

export interface DecisionEventParams {
  decision_type?: 'random' | 'tiered' | 'manual';
  collection_id?: string;
  restaurant_count?: number;
  selected_restaurant_id?: string;
  vote_count?: number;
}

export interface SocialEventParams {
  group_id?: string;
  friend_id?: string;
  member_count?: number;
  action_type?: string;
}

export interface NotificationEventParams {
  notification_type?: string;
  notification_id?: string;
  action?: 'clicked' | 'dismissed' | 'viewed';
}

export interface UIEventParams {
  component?: string;
  location?: string;
  value?: string;
}

export interface ErrorEventParams {
  error_type?: string;
  error_message?: string;
  component?: string;
  page?: string;
  fatal?: boolean;
}

export interface AdminEventParams {
  dashboard?: string;
  action?: string;
  target?: string;
}

export interface PerformanceEventParams {
  metric_name?: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value?: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  page?: string;
}

export type EventParams =
  | AuthEventParams
  | SearchEventParams
  | RestaurantEventParams
  | CollectionEventParams
  | DecisionEventParams
  | SocialEventParams
  | NotificationEventParams
  | UIEventParams
  | ErrorEventParams
  | AdminEventParams
  | PerformanceEventParams;
