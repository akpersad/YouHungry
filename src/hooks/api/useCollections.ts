import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Collection } from '@/types/database';

// Query keys for consistent cache management
export const collectionKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: (userId: string) => [...collectionKeys.lists(), userId] as const,
  details: () => [...collectionKeys.all, 'detail'] as const,
  detail: (id: string) => [...collectionKeys.details(), id] as const,
};

// API functions
const fetchCollections = async (userId: string): Promise<Collection[]> => {
  console.log('fetchCollections called with userId:', userId);
  const url = `/api/collections?userId=${userId}&type=personal`;
  console.log('Fetching from URL:', url);

  const response = await fetch(url);
  const data = await response.json();

  console.log('API response status:', response.status);
  console.log('API response data:', data);

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch collections');
  }

  return data.collections;
};

const fetchCollection = async (id: string): Promise<Collection> => {
  const response = await fetch(`/api/collections/${id}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch collection');
  }

  return data.collection;
};

const createCollection = async (collection: {
  name: string;
  description?: string;
  userId: string;
}): Promise<Collection> => {
  const response = await fetch('/api/collections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(collection),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create collection');
  }

  return data.collection;
};

const updateCollection = async ({
  id,
  ...updates
}: {
  id: string;
  name?: string;
  description?: string;
}): Promise<Collection> => {
  const response = await fetch(`/api/collections/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update collection');
  }

  return data.collection;
};

const deleteCollection = async (id: string): Promise<void> => {
  const response = await fetch(`/api/collections/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete collection');
  }
};

// React Query hooks
export function useCollections(userId?: string) {
  return useQuery({
    queryKey: userId ? collectionKeys.list(userId) : collectionKeys.lists(),
    queryFn: () =>
      userId
        ? fetchCollections(userId)
        : Promise.reject(new Error('User ID required')),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCollection(id: string) {
  return useQuery({
    queryKey: collectionKeys.detail(id),
    queryFn: () => fetchCollection(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCollection,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: collectionKeys.list(variables.userId),
      });

      // Snapshot previous value
      const previousCollections = queryClient.getQueryData(
        collectionKeys.list(variables.userId)
      );

      // Optimistically add the new collection
      const optimisticCollection: Collection = {
        _id: `temp-${Date.now()}` as unknown as Collection['_id'],
        name: variables.name,
        description: variables.description || '',
        type: 'personal' as const,
        ownerId: variables.userId as unknown as Collection['ownerId'],
        restaurantIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(
        collectionKeys.list(variables.userId),
        (old: Collection[] | undefined) => [
          optimisticCollection,
          ...(old || []),
        ]
      );

      return { previousCollections };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousCollections) {
        queryClient.setQueryData(
          collectionKeys.list(variables.userId),
          context.previousCollections
        );
      }
      console.error('Failed to create collection:', error);
    },
    onSuccess: (newCollection, variables) => {
      // Replace optimistic collection with real data
      queryClient.setQueryData(
        collectionKeys.list(variables.userId),
        (old: Collection[] | undefined) =>
          old?.map((collection: Collection) =>
            collection._id.toString().startsWith('temp-')
              ? newCollection
              : collection
          ) || [newCollection]
      );

      // Add the new collection to detail cache
      queryClient.setQueryData(
        collectionKeys.detail(newCollection._id.toString()),
        newCollection
      );
    },
    onSettled: (_, __, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: collectionKeys.list(variables.userId),
      });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCollection,
    onSuccess: (updatedCollection, variables) => {
      // Update the specific collection in cache
      queryClient.setQueryData(
        collectionKeys.detail(variables.id),
        updatedCollection
      );

      // Invalidate collections list to ensure consistency
      queryClient.invalidateQueries({
        queryKey: collectionKeys.lists(),
      });
    },
    onError: (error) => {
      console.error('Failed to update collection:', error);
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCollection,
    onMutate: async (collectionId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: collectionKeys.detail(collectionId),
      });
      await queryClient.cancelQueries({
        queryKey: collectionKeys.lists(),
      });

      // Snapshot previous values
      const previousCollection = queryClient.getQueryData(
        collectionKeys.detail(collectionId)
      );

      // Get all collection lists that might contain this collection
      const allCollectionQueries = queryClient.getQueriesData({
        queryKey: collectionKeys.lists(),
      });

      // Optimistically remove from all lists
      allCollectionQueries.forEach(([queryKey, data]) => {
        if (data) {
          queryClient.setQueryData(
            queryKey,
            (old: Collection[] | undefined) =>
              old?.filter(
                (c: Collection) => c._id.toString() !== collectionId
              ) || []
          );
        }
      });

      // Remove detail cache
      queryClient.removeQueries({
        queryKey: collectionKeys.detail(collectionId),
      });

      return { previousCollection, allCollectionQueries };
    },
    onError: (error, collectionId, context) => {
      // Rollback on error
      if (context?.previousCollection) {
        queryClient.setQueryData(
          collectionKeys.detail(collectionId),
          context.previousCollection
        );
      }

      // Rollback list changes
      if (context?.allCollectionQueries) {
        context.allCollectionQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      console.error('Failed to delete collection:', error);
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: collectionKeys.lists(),
      });
    },
  });
}
