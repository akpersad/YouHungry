import { logger } from '@/lib/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Friend, FriendRequest, FriendSearchResult } from '@/lib/friends';

// Query keys for consistent cache management
export const friendKeys = {
  all: ['friends'] as const,
  lists: () => [...friendKeys.all, 'list'] as const,
  list: (userId: string) => [...friendKeys.lists(), userId] as const,
  requests: () => [...friendKeys.all, 'requests'] as const,
  requestsList: (userId: string) => [...friendKeys.requests(), userId] as const,
  search: () => [...friendKeys.all, 'search'] as const,
  searchQuery: (query: string, userId: string) =>
    [...friendKeys.search(), query, userId] as const,
};

// API functions
const fetchFriends = async (userId: string): Promise<Friend[]> => {
  const response = await fetch(`/api/friends?userId=${userId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch friends');
  }

  return data.friends;
};

const fetchFriendRequests = async (
  userId: string
): Promise<{
  sent: FriendRequest[];
  received: FriendRequest[];
}> => {
  const response = await fetch(`/api/friends/requests?userId=${userId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch friend requests');
  }

  return data.requests;
};

const searchUsers = async (
  query: string,
  userId: string
): Promise<FriendSearchResult[]> => {
  const response = await fetch(
    `/api/friends/search?q=${encodeURIComponent(query)}&userId=${userId}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to search users');
  }

  return data.results;
};

const sendFriendRequest = async ({
  requesterId,
  addresseeId,
}: {
  requesterId: string;
  addresseeId: string;
}): Promise<void> => {
  const response = await fetch('/api/friends/requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requesterId, addresseeId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to send friend request');
  }
};

const updateFriendRequest = async ({
  friendshipId,
  action,
  userId,
}: {
  friendshipId: string;
  action: 'accept' | 'decline';
  userId: string;
}): Promise<void> => {
  const response = await fetch(`/api/friends/requests/${friendshipId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, userId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update friend request');
  }
};

const removeFriend = async ({
  friendshipId,
  userId,
}: {
  friendshipId: string;
  userId: string;
}): Promise<void> => {
  const response = await fetch(
    `/api/friends?friendshipId=${friendshipId}&userId=${userId}`,
    {
      method: 'DELETE',
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to remove friend');
  }
};

// React Query hooks
export function useFriends(userId?: string) {
  return useQuery({
    queryKey: userId ? friendKeys.list(userId) : friendKeys.lists(),
    queryFn: () =>
      userId
        ? fetchFriends(userId)
        : Promise.reject(new Error('User ID required')),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useFriendRequests(userId?: string) {
  return useQuery({
    queryKey: userId ? friendKeys.requestsList(userId) : friendKeys.requests(),
    queryFn: () =>
      userId
        ? fetchFriendRequests(userId)
        : Promise.reject(new Error('User ID required')),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for requests)
  });
}

export function useUserSearch(query: string, userId?: string) {
  return useQuery({
    queryKey:
      query && userId
        ? friendKeys.searchQuery(query, userId)
        : friendKeys.search(),
    queryFn: () =>
      query && userId ? searchUsers(query, userId) : Promise.resolve([]),
    enabled: !!query && !!userId && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: (_, variables) => {
      // Invalidate friend requests for both users
      queryClient.invalidateQueries({
        queryKey: friendKeys.requestsList(variables.requesterId),
      });
      queryClient.invalidateQueries({
        queryKey: friendKeys.requestsList(variables.addresseeId),
      });
    },
    onError: (error) => {
      logger.error('Failed to send friend request:', error);
    },
  });
}

export function useUpdateFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFriendRequest,
    onSuccess: (_, variables) => {
      // Invalidate friend requests and friends list
      queryClient.invalidateQueries({
        queryKey: friendKeys.requestsList(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: friendKeys.list(variables.userId),
      });
    },
    onError: (error) => {
      logger.error('Failed to update friend request:', error);
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFriend,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: friendKeys.list(variables.userId),
      });

      // Snapshot previous value
      const previousFriends = queryClient.getQueryData(
        friendKeys.list(variables.userId)
      );

      // Optimistically remove the friend
      queryClient.setQueryData(
        friendKeys.list(variables.userId),
        (old: Friend[] | undefined) =>
          old?.filter(
            (friend) => friend.friendshipId !== variables.friendshipId
          ) || []
      );

      return { previousFriends };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousFriends) {
        queryClient.setQueryData(
          friendKeys.list(variables.userId),
          context.previousFriends
        );
      }
      logger.error('Failed to remove friend:', error);
    },
    onSettled: (_, __, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: friendKeys.list(variables.userId),
      });
    },
  });
}
