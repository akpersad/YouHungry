import { useQuery } from '@tanstack/react-query';

export interface PersonalAnalytics {
  overview: {
    totalDecisions: number;
    personalDecisions: number;
    groupDecisions: number;
    uniqueRestaurants: number;
  };
  popularRestaurants: Array<{
    id: string;
    name: string;
    address: string;
    cuisine: string;
    rating: number;
    priceRange?: string;
    selectionCount: number;
  }>;
  trends: Array<{
    month: string;
    personal: number;
    group: number;
    total: number;
  }>;
  collections: {
    total: number;
    personal: number;
    group: number;
    avgRestaurantsPerCollection: number;
  };
  groups: {
    totalGroups: number;
    activeGroups: number;
    adminGroups: number;
  };
  favoriteCuisines: Array<{
    cuisine: string;
    count: number;
  }>;
}

// Query Keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  personal: () => [...analyticsKeys.all, 'personal'] as const,
};

// Fetch personal analytics
async function fetchPersonalAnalytics(): Promise<PersonalAnalytics> {
  const response = await fetch('/api/analytics/personal');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch analytics');
  }

  const data = await response.json();
  return data.analytics;
}

// Hooks
export function usePersonalAnalytics(enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.personal(),
    queryFn: fetchPersonalAnalytics,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
