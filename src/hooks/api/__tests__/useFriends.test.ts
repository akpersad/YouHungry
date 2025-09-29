import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFriends,
  useFriendRequests,
  useUserSearch,
  useSendFriendRequest,
  useUpdateFriendRequest,
  useRemoveFriend,
} from '../useFriends';

// Mock fetch
global.fetch = jest.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  );
};

describe('useFriends', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch friends successfully', async () => {
    const mockFriends = [
      {
        _id: 'user2',
        clerkId: 'clerk2',
        email: 'john@example.com',
        name: 'John Doe',
        profilePicture: 'pic1.jpg',
        city: 'New York',
        friendshipId: 'friendship1',
        addedAt: new Date('2023-01-01'),
      },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        friends: mockFriends,
      }),
    });

    const { result } = renderHook(() => useFriends('user1'), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockFriends);
    expect(fetch).toHaveBeenCalledWith('/api/friends?userId=user1');
  });

  it('should handle fetch error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Failed to fetch friends',
      }),
    });

    const { result } = renderHook(() => useFriends('user1'), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(
      expect.objectContaining({
        message: 'Failed to fetch friends',
      })
    );
  });

  it('should not fetch when userId is undefined', () => {
    const { result } = renderHook(() => useFriends(undefined), {
      wrapper: TestWrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('useFriendRequests', () => {
  it('should fetch friend requests successfully', async () => {
    const mockRequests = {
      sent: [],
      received: [
        {
          _id: 'request1',
          requester: {
            _id: 'user2',
            clerkId: 'clerk2',
            email: 'john@example.com',
            name: 'John Doe',
            profilePicture: 'pic1.jpg',
          },
          addressee: {
            _id: 'user1',
            clerkId: 'clerk1',
            email: 'jane@example.com',
            name: 'Jane Smith',
            profilePicture: 'pic2.jpg',
          },
          status: 'pending',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
      ],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        requests: mockRequests,
      }),
    });

    const { result } = renderHook(() => useFriendRequests('user1'), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockRequests);
    expect(fetch).toHaveBeenCalledWith('/api/friends/requests?userId=user1');
  });
});

describe('useUserSearch', () => {
  it('should search users successfully', async () => {
    const mockResults = [
      {
        _id: 'user2',
        clerkId: 'clerk2',
        email: 'john@example.com',
        name: 'John Doe',
        profilePicture: 'pic1.jpg',
        city: 'New York',
      },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        results: mockResults,
      }),
    });

    const { result } = renderHook(() => useUserSearch('john', 'user1'), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResults);
    expect(fetch).toHaveBeenCalledWith(
      '/api/friends/search?q=john&userId=user1'
    );
  });

  it('should not search when query is too short', () => {
    // Clear any previous fetch calls
    (fetch as jest.Mock).mockClear();

    const { result } = renderHook(() => useUserSearch('j', 'user1'), {
      wrapper: TestWrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should not search when userId is undefined', () => {
    // Clear any previous fetch calls
    (fetch as jest.Mock).mockClear();

    const { result } = renderHook(() => useUserSearch('john', undefined), {
      wrapper: TestWrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('useSendFriendRequest', () => {
  it('should send friend request successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        friendship: {
          _id: 'friendship1',
          requesterId: 'user1',
          addresseeId: 'user2',
          status: 'pending',
        },
      }),
    });

    const { result } = renderHook(() => useSendFriendRequest(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      result.current.mutate({
        requesterId: 'user1',
        addresseeId: 'user2',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith('/api/friends/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requesterId: 'user1',
        addresseeId: 'user2',
      }),
    });
  });

  it('should handle send friend request error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Friendship already exists',
      }),
    });

    const { result } = renderHook(() => useSendFriendRequest(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      result.current.mutate({
        requesterId: 'user1',
        addresseeId: 'user2',
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(
      expect.objectContaining({
        message: 'Friendship already exists',
      })
    );
  });
});

describe('useUpdateFriendRequest', () => {
  it('should accept friend request successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        friendship: {
          _id: 'friendship1',
          requesterId: 'user1',
          addresseeId: 'user2',
          status: 'accepted',
        },
      }),
    });

    const { result } = renderHook(() => useUpdateFriendRequest(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      result.current.mutate({
        friendshipId: 'friendship1',
        action: 'accept',
        userId: 'user2',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith('/api/friends/requests/friendship1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'accept',
        userId: 'user2',
      }),
    });
  });

  it('should decline friend request successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        friendship: {
          _id: 'friendship1',
          requesterId: 'user1',
          addresseeId: 'user2',
          status: 'declined',
        },
      }),
    });

    const { result } = renderHook(() => useUpdateFriendRequest(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      result.current.mutate({
        friendshipId: 'friendship1',
        action: 'decline',
        userId: 'user2',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith('/api/friends/requests/friendship1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'decline',
        userId: 'user2',
      }),
    });
  });
});

describe('useRemoveFriend', () => {
  it('should remove friend successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Friend removed successfully',
      }),
    });

    const { result } = renderHook(() => useRemoveFriend(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      result.current.mutate({
        friendshipId: 'friendship1',
        userId: 'user1',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/friends?friendshipId=friendship1&userId=user1',
      {
        method: 'DELETE',
      }
    );
  });

  it('should handle remove friend error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Friendship not found',
      }),
    });

    const { result } = renderHook(() => useRemoveFriend(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      result.current.mutate({
        friendshipId: 'friendship1',
        userId: 'user1',
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(
      expect.objectContaining({
        message: 'Friendship not found',
      })
    );
  });
});
