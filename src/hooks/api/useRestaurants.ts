import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Restaurant, Collection } from '@/types/database';

// Query keys for consistent cache management
export const restaurantKeys = {
  all: ['restaurants'] as const,
  lists: () => [...restaurantKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...restaurantKeys.lists(), filters] as const,
  details: () => [...restaurantKeys.all, 'detail'] as const,
  detail: (id: string) => [...restaurantKeys.details(), id] as const,
  search: () => [...restaurantKeys.all, 'search'] as const,
  searchQuery: (params: Record<string, unknown>) =>
    [...restaurantKeys.search(), params] as const,
};

// Search filters interface
export interface SearchFilters {
  location: string;
  q?: string;
  cuisine?: string;
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  distance?: number;
}

// API functions
const searchRestaurants = async (
  filters: SearchFilters
): Promise<Restaurant[]> => {
  const params = new URLSearchParams({
    location: filters.location,
    ...(filters.q && { q: filters.q }),
    ...(filters.cuisine && { cuisine: filters.cuisine }),
    ...(filters.minRating && { minRating: filters.minRating.toString() }),
    ...(filters.maxPrice && { maxPrice: filters.maxPrice.toString() }),
    ...(filters.minPrice && { minPrice: filters.minPrice.toString() }),
    ...(filters.distance && { distance: filters.distance.toString() }),
  });

  const response = await fetch(`/api/restaurants/search?${params}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to search restaurants');
  }

  return data.restaurants || [];
};

const fetchRestaurant = async (id: string): Promise<Restaurant> => {
  const response = await fetch(`/api/restaurants/${id}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch restaurant');
  }

  return data.restaurant;
};

const addRestaurantToCollection = async ({
  restaurantId,
  collectionId,
  priceRange,
  timeToPickUp,
}: {
  restaurantId: string;
  collectionId: string;
  priceRange?: string;
  timeToPickUp?: number;
}): Promise<void> => {
  const response = await fetch(`/api/collections/${collectionId}/restaurants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      restaurantId,
      priceRange,
      timeToPickUp,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to add restaurant to collection');
  }
};

const removeRestaurantFromCollection = async ({
  restaurantId,
  collectionId,
}: {
  restaurantId: string;
  collectionId: string;
}): Promise<void> => {
  const response = await fetch(
    `/api/collections/${collectionId}/restaurants/${restaurantId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(
      data.error || 'Failed to remove restaurant from collection'
    );
  }
};

// React Query hooks
export function useRestaurantSearch(filters: SearchFilters, enabled = true) {
  return useQuery({
    queryKey: restaurantKeys.searchQuery(
      filters as unknown as Record<string, unknown>
    ),
    queryFn: () => searchRestaurants(filters),
    enabled: enabled && !!filters.location,
    staleTime: 10 * 60 * 1000, // 10 minutes for search results
    gcTime: 30 * 60 * 1000, // 30 minutes cache time for search results
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: restaurantKeys.detail(id),
    queryFn: () => fetchRestaurant(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes for restaurant details
  });
}

export function useAddRestaurantToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addRestaurantToCollection,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['collections', 'detail', variables.collectionId],
      });

      // Snapshot previous value
      const previousCollection = queryClient.getQueryData([
        'collections',
        'detail',
        variables.collectionId,
      ]);

      // Optimistically update the collection
      if (previousCollection) {
        queryClient.setQueryData(
          ['collections', 'detail', variables.collectionId],
          (old: Collection | undefined) =>
            old
              ? {
                  ...old,
                  restaurantIds: [...old.restaurantIds, variables.restaurantId],
                }
              : undefined
        );
      }

      return { previousCollection };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousCollection) {
        queryClient.setQueryData(
          ['collections', 'detail', variables.collectionId],
          context.previousCollection
        );
      }
      console.error('Failed to add restaurant to collection:', error);
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['collections', 'detail', variables.collectionId],
      });

      queryClient.invalidateQueries({
        queryKey: ['collections', 'list'],
      });
    },
  });
}

export function useRemoveRestaurantFromCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeRestaurantFromCollection,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['collections', 'detail', variables.collectionId],
      });

      // Snapshot previous value
      const previousCollection = queryClient.getQueryData([
        'collections',
        'detail',
        variables.collectionId,
      ]);

      // Optimistically update the collection
      if (previousCollection) {
        queryClient.setQueryData(
          ['collections', 'detail', variables.collectionId],
          (old: Collection | undefined) =>
            old
              ? {
                  ...old,
                  restaurantIds: old.restaurantIds.filter(
                    (id) => id.toString() !== variables.restaurantId
                  ),
                }
              : undefined
        );
      }

      return { previousCollection };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousCollection) {
        queryClient.setQueryData(
          ['collections', 'detail', variables.collectionId],
          context.previousCollection
        );
      }
      console.error('Failed to remove restaurant from collection:', error);
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['collections', 'detail', variables.collectionId],
      });

      queryClient.invalidateQueries({
        queryKey: ['collections', 'list'],
      });
    },
  });
}

// Helper hook to check if restaurants are in collections
export function useRestaurantsInCollections(
  restaurants: Restaurant[],
  collections: Collection[]
) {
  return useQuery({
    queryKey: [
      'restaurants',
      'in-collections',
      restaurants.map((r) => r._id),
      collections.map((c) => c._id),
    ],
    queryFn: () => {
      // This is a synchronous operation, but we wrap it in useQuery for caching
      const restaurantInCollections = restaurants.map((restaurant) => {
        const inCollections = collections.filter((collection) =>
          collection.restaurantIds.some(
            (id) => id.toString() === restaurant._id.toString()
          )
        );
        return {
          restaurant,
          inCollections: inCollections.map((c) => c._id.toString()),
        };
      });

      return restaurantInCollections;
    },
    enabled: restaurants.length > 0 && collections.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
