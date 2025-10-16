import type { EventParams } from '@/types/analytics';

/**
 * Hash a user ID using SHA-256 for privacy-preserving analytics
 * @param userId - Clerk user ID to hash
 * @returns Hashed user ID
 */
export async function hashUserId(userId: string): Promise<string> {
  // Use Web Crypto API for hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(userId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

/**
 * Check if analytics is available and enabled
 */
export function isAnalyticsAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function' &&
    process.env.NODE_ENV === 'production' &&
    !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  );
}

/**
 * Set user ID for analytics (hashed for privacy)
 * @param userId - Clerk user ID
 */
export async function setAnalyticsUserId(userId: string | null) {
  if (!isAnalyticsAvailable() || !userId) return;

  try {
    const hashedUserId = await hashUserId(userId);
    window.gtag?.('set', 'user_properties', {
      user_id: hashedUserId,
    });
    window.gtag?.('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      user_id: hashedUserId,
    });
  } catch (error) {
    console.error('Failed to set analytics user ID:', error);
  }
}

/**
 * Track a custom event
 * @param eventName - Name of the event
 * @param params - Event parameters
 */
export function trackEvent(eventName: string, params?: EventParams) {
  if (!isAnalyticsAvailable()) {
    // Log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, params);
    }
    return;
  }

  try {
    window.gtag?.('event', eventName, {
      ...params,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

/**
 * Track page view
 * @param url - Page URL
 * @param title - Page title
 */
export function trackPageView(url: string, title?: string) {
  if (!isAnalyticsAvailable()) return;

  try {
    window.gtag?.('event', 'page_view', {
      page_path: url,
      page_title: title || document.title,
      page_location: window.location.href,
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

// ============================================================================
// Authentication Events
// ============================================================================

export function trackSignupStart(method?: 'email' | 'phone' | 'social') {
  trackEvent('user_signup_start', { method });
}

export function trackSignupComplete(method?: 'email' | 'phone' | 'social') {
  trackEvent('user_signup_complete', { method });
}

export function trackSignIn(method?: 'email' | 'phone' | 'social') {
  trackEvent('user_signin', { method });
}

export function trackSignOut() {
  trackEvent('user_logout');
}

export function trackProfileUpdate(updateType?: string) {
  trackEvent('profile_update', { update_type: updateType });
}

export function trackNotificationPreferencesChanged(
  channel: string,
  enabled: boolean
) {
  trackEvent('notification_preferences_changed', {
    channel,
    enabled: enabled.toString(),
  });
}

// ============================================================================
// Restaurant Search & Discovery Events
// ============================================================================

export function trackRestaurantSearch(params: {
  location?: string;
  searchTerm?: string;
  filters?: Record<string, unknown>;
  resultsCount?: number;
}) {
  trackEvent('restaurant_search', {
    search_term: params.searchTerm,
    location: params.location,
    filters: params.filters ? JSON.stringify(params.filters) : undefined,
    results_count: params.resultsCount,
  });
}

export function trackRestaurantView(params: {
  restaurantId?: string;
  restaurantName?: string;
  cuisineType?: string;
  priceLevel?: number;
  rating?: number;
  position?: number;
}) {
  trackEvent('restaurant_view', {
    restaurant_id: params.restaurantId,
    restaurant_name: params.restaurantName,
    cuisine_type: params.cuisineType,
    price_level: params.priceLevel,
    rating: params.rating,
    position: params.position,
  });
}

export function trackSearchFilterApplied(
  filterType: string,
  filterValue: string
) {
  trackEvent('search_filter_applied', {
    filter_type: filterType,
    filter_value: filterValue,
  });
}

export function trackSearchSortChanged(sortBy: string) {
  trackEvent('search_sort_changed', { sort_by: sortBy });
}

export function trackRestaurantExternalLinkClick(
  restaurantName: string,
  linkType: string
) {
  trackEvent('restaurant_external_link_click', {
    restaurant_name: restaurantName,
    link_type: linkType,
  });
}

export function trackMapMarkerClick(
  restaurantId: string,
  restaurantName: string
) {
  trackEvent('map_marker_click', {
    restaurant_id: restaurantId,
    restaurant_name: restaurantName,
  });
}

// ============================================================================
// Collection Events
// ============================================================================

export function trackCollectionCreate(params: {
  collectionType: 'personal' | 'group';
  collectionName?: string;
}) {
  trackEvent('collection_create', {
    collection_type: params.collectionType,
    collection_name: params.collectionName,
  });
}

export function trackCollectionView(params: {
  collectionId: string;
  collectionType?: 'personal' | 'group';
  restaurantCount?: number;
}) {
  trackEvent('collection_view', {
    collection_id: params.collectionId,
    collection_type: params.collectionType,
    restaurant_count: params.restaurantCount,
  });
}

export function trackCollectionDelete(collectionId: string) {
  trackEvent('collection_delete', { collection_id: collectionId });
}

export function trackRestaurantAddToCollection(params: {
  restaurantId: string;
  restaurantName?: string;
  collectionId: string;
}) {
  trackEvent('restaurant_add_to_collection', {
    restaurant_id: params.restaurantId,
    restaurant_name: params.restaurantName,
    collection_id: params.collectionId,
  });
}

export function trackRestaurantRemoveFromCollection(params: {
  restaurantId: string;
  collectionId: string;
}) {
  trackEvent('restaurant_remove_from_collection', {
    restaurant_id: params.restaurantId,
    collection_id: params.collectionId,
  });
}

export function trackCollectionTabChanged(
  tabName: string,
  collectionId: string
) {
  trackEvent('collection_tab_changed', {
    tab_name: tabName,
    collection_id: collectionId,
  });
}

// ============================================================================
// Social Features Events
// ============================================================================

export function trackFriendSearch(searchTerm: string) {
  trackEvent('friend_search', { search_term: searchTerm });
}

export function trackFriendRequestSent(friendId?: string) {
  trackEvent('friend_request_sent', { friend_id: friendId });
}

export function trackFriendRequestAccepted(friendId?: string) {
  trackEvent('friend_request_accepted', { friend_id: friendId });
}

export function trackFriendRequestRejected(friendId?: string) {
  trackEvent('friend_request_rejected', { friend_id: friendId });
}

export function trackFriendRemoved(friendId?: string) {
  trackEvent('friend_removed', { friend_id: friendId });
}

export function trackGroupCreated(params: {
  groupId?: string;
  memberCount?: number;
}) {
  trackEvent('group_created', {
    group_id: params.groupId,
    member_count: params.memberCount,
  });
}

export function trackGroupViewed(params: {
  groupId: string;
  memberCount?: number;
}) {
  trackEvent('group_viewed', {
    group_id: params.groupId,
    member_count: params.memberCount,
  });
}

export function trackGroupInvitationSent(groupId: string) {
  trackEvent('group_invitation_sent', { group_id: groupId });
}

export function trackGroupInvitationAccepted(groupId: string) {
  trackEvent('group_invitation_accepted', { group_id: groupId });
}

export function trackGroupLeft(groupId: string) {
  trackEvent('group_left', { group_id: groupId });
}

// ============================================================================
// Decision Making Events
// ============================================================================

export function trackDecisionRandomStart(params: {
  collectionId: string;
  restaurantCount: number;
}) {
  trackEvent('decision_random_start', {
    collection_id: params.collectionId,
    restaurant_count: params.restaurantCount,
    decision_type: 'random',
  });
}

export function trackDecisionRandomComplete(params: {
  collectionId: string;
  selectedRestaurantId?: string;
  selectedRestaurantName?: string;
}) {
  trackEvent('decision_random_complete', {
    collection_id: params.collectionId,
    selected_restaurant_id: params.selectedRestaurantId,
    selected_restaurant_name: params.selectedRestaurantName,
    decision_type: 'random',
  });
}

export function trackDecisionGroupStart(params: {
  groupId: string;
  collectionId: string;
  decisionType: 'random' | 'tiered';
  restaurantCount: number;
}) {
  trackEvent('decision_group_start', {
    group_id: params.groupId,
    collection_id: params.collectionId,
    decision_type: params.decisionType,
    restaurant_count: params.restaurantCount,
  });
}

export function trackDecisionVoteSubmitted(params: {
  groupId: string;
  decisionId: string;
  rankingPositions?: number;
}) {
  trackEvent('decision_vote_submitted', {
    group_id: params.groupId,
    decision_id: params.decisionId,
    ranking_positions: params.rankingPositions,
  });
}

export function trackDecisionGroupComplete(params: {
  groupId: string;
  decisionId: string;
  decisionType: 'random' | 'tiered';
  voteCount?: number;
  selectedRestaurantId?: string;
}) {
  trackEvent('decision_group_complete', {
    group_id: params.groupId,
    decision_id: params.decisionId,
    decision_type: params.decisionType,
    vote_count: params.voteCount,
    selected_restaurant_id: params.selectedRestaurantId,
  });
}

export function trackDecisionManualEntry(params: {
  restaurantId?: string;
  restaurantName?: string;
  collectionId?: string;
}) {
  trackEvent('decision_manual_entry', {
    restaurant_id: params.restaurantId,
    restaurant_name: params.restaurantName,
    collection_id: params.collectionId,
    decision_type: 'manual',
  });
}

export function trackDecisionResultViewed(params: {
  decisionType: 'random' | 'tiered' | 'manual';
  restaurantId?: string;
}) {
  trackEvent('decision_result_viewed', {
    decision_type: params.decisionType,
    restaurant_id: params.restaurantId,
  });
}

export function trackDecisionStatisticsViewed(collectionId: string) {
  trackEvent('decision_statistics_viewed', { collection_id: collectionId });
}

// ============================================================================
// Notification Events
// ============================================================================

export function trackNotificationBellClick() {
  trackEvent('notification_bell_click');
}

export function trackNotificationViewed(params: {
  notificationId?: string;
  notificationType?: string;
}) {
  trackEvent('notification_viewed', {
    notification_id: params.notificationId,
    notification_type: params.notificationType,
  });
}

export function trackNotificationClicked(params: {
  notificationId?: string;
  notificationType?: string;
}) {
  trackEvent('notification_clicked', {
    notification_id: params.notificationId,
    notification_type: params.notificationType,
  });
}

export function trackNotificationDismissed(params: {
  notificationId?: string;
  notificationType?: string;
}) {
  trackEvent('notification_dismissed', {
    notification_id: params.notificationId,
    notification_type: params.notificationType,
  });
}

// ============================================================================
// UI/UX Events
// ============================================================================

export function trackThemeToggle(theme: 'light' | 'dark') {
  trackEvent('theme_toggle', { theme });
}

export function trackNavigationClick(destination: string, location: string) {
  trackEvent('navigation_click', {
    destination,
    location,
  });
}

export function trackPWAInstallPromptShown() {
  trackEvent('pwa_install_prompt_shown');
}

export function trackPWAInstalled() {
  trackEvent('pwa_installed');
}

export function trackError(params: {
  errorType: string;
  errorMessage?: string;
  component?: string;
  page?: string;
  fatal?: boolean;
}) {
  trackEvent('error_occurred', {
    error_type: params.errorType,
    error_message: params.errorMessage,
    component: params.component,
    page: params.page,
    fatal: params.fatal?.toString(),
  });
}

// ============================================================================
// Admin Events
// ============================================================================

export function trackAdminDashboardViewed(dashboard: string) {
  trackEvent('admin_dashboard_viewed', { dashboard });
}

export function trackAdminAction(action: string, target?: string) {
  trackEvent('admin_action', {
    action,
    target,
  });
}

// ============================================================================
// Performance Events
// ============================================================================

export function trackWebVital(params: {
  metricName: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  page?: string;
}) {
  trackEvent('web_vital_metric', {
    metric_name: params.metricName,
    value: params.value,
    rating: params.rating,
    page: params.page || window.location.pathname,
  });
}
