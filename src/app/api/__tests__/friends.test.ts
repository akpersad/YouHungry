import { NextRequest } from 'next/server';
import { GET as searchUsers } from '../friends/search/route';
import {
  GET as getFriendRequests,
  POST as sendFriendRequest,
} from '../friends/requests/route';
import { PUT as updateFriendRequest } from '../friends/requests/[id]/route';
import { GET as getFriends, DELETE as removeFriend } from '../friends/route';
import { getCurrentUser } from '@/lib/auth';
import * as friendsLib from '@/lib/friends';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

// Mock the friends library
jest.mock('@/lib/friends', () => ({
  searchUsers: jest.fn(),
  getFriendRequests: jest.fn(),
  sendFriendRequest: jest.fn(),
  acceptFriendRequest: jest.fn(),
  declineFriendRequest: jest.fn(),
  getFriends: jest.fn(),
  removeFriend: jest.fn(),
}));

const mockFriendsLib = friendsLib as jest.Mocked<typeof friendsLib>;

const mockSessionUser = {
  _id: '507f1f77bcf86cd799439099',
  clerkId: 'clerk_session_user',
  email: 'me@example.com',
  name: 'Session User',
};

beforeEach(() => {
  jest.clearAllMocks();
  (getCurrentUser as jest.Mock).mockResolvedValue(mockSessionUser);
});

describe('/api/friends/search', () => {
  it('should search users as the session user and mask non-friend emails', async () => {
    const mockResults = [
      {
        _id: '507f1f77bcf86cd799439011',
        clerkId: 'clerk1',
        email: 'john@example.com',
        name: 'John Doe',
        profilePicture: 'pic1.jpg',
        city: 'New York',
        relationshipStatus: 'none' as const,
      },
      {
        _id: '507f1f77bcf86cd799439012',
        clerkId: 'clerk2',
        email: 'jane@example.com',
        name: 'Jane Smith',
        profilePicture: 'pic2.jpg',
        city: 'Boston',
        relationshipStatus: 'accepted' as const,
      },
    ];

    mockFriendsLib.searchUsers.mockResolvedValue(mockResults);

    const request = new NextRequest(
      'http://localhost:3000/api/friends/search?q=john'
    );
    const response = await searchUsers(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(2);
    // Non-friend email is masked
    expect(data.results[0].email).toBe('j***@example.com');
    // Accepted friend keeps full email
    expect(data.results[1].email).toBe('jane@example.com');
    expect(mockFriendsLib.searchUsers).toHaveBeenCalledWith(
      'john',
      mockSessionUser.clerkId
    );
  });

  it('should ignore a caller-supplied userId and use the session user', async () => {
    mockFriendsLib.searchUsers.mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost:3000/api/friends/search?q=john&userId=someone_else'
    );
    const response = await searchUsers(request);

    expect(response.status).toBe(200);
    expect(mockFriendsLib.searchUsers).toHaveBeenCalledWith(
      'john',
      mockSessionUser.clerkId
    );
  });

  it('should return 401 if not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/friends/search?q=john'
    );
    const response = await searchUsers(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
    expect(mockFriendsLib.searchUsers).not.toHaveBeenCalled();
  });

  it('should return 400 if query is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/friends/search');
    const response = await searchUsers(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Search query is required');
  });

  it('should handle errors gracefully', async () => {
    mockFriendsLib.searchUsers.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest(
      'http://localhost:3000/api/friends/search?q=john'
    );
    const response = await searchUsers(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
  });
});

describe('/api/friends/requests', () => {
  describe('GET', () => {
    it('should get friend requests for the session user', async () => {
      const mockRequests = {
        sent: [],
        received: [
          {
            _id: '507f1f77bcf86cd799439013',
            requester: {
              _id: '507f1f77bcf86cd799439011',
              clerkId: 'clerk1',
              email: 'john@example.com',
              name: 'John Doe',
              profilePicture: 'pic1.jpg',
            },
            addressee: {
              _id: '507f1f77bcf86cd799439012',
              clerkId: 'clerk2',
              email: 'jane@example.com',
              name: 'Jane Smith',
              profilePicture: 'pic2.jpg',
            },
            status: 'pending' as const,
            createdAt: '2025-09-28T21:31:59.423Z',
            updatedAt: '2025-09-28T21:31:59.423Z',
          },
        ],
      };

      (mockFriendsLib.getFriendRequests as jest.Mock).mockResolvedValue(
        mockRequests
      );

      const response = await getFriendRequests();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.requests).toEqual(mockRequests);
      expect(mockFriendsLib.getFriendRequests).toHaveBeenCalledWith(
        mockSessionUser.clerkId
      );
    });

    it('should return 401 if not authenticated', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      const response = await getFriendRequests();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
      expect(mockFriendsLib.getFriendRequests).not.toHaveBeenCalled();
    });
  });

  describe('POST', () => {
    it('should send friend request from the session user', async () => {
      const mockFriendship = {
        _id: '507f1f77bcf86cd799439013',
        requesterId: mockSessionUser.clerkId,
        addresseeId: 'user2',
        status: 'pending',
        createdAt: '2025-09-28T21:31:59.427Z',
        updatedAt: '2025-09-28T21:31:59.427Z',
      };

      mockFriendsLib.sendFriendRequest.mockResolvedValue(
        mockFriendship as unknown as ReturnType<
          typeof mockFriendsLib.sendFriendRequest
        >
      );

      const request = new NextRequest(
        'http://localhost:3000/api/friends/requests',
        {
          method: 'POST',
          body: JSON.stringify({
            addresseeId: 'user2',
          }),
        }
      );
      const response = await sendFriendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.friendship).toEqual(mockFriendship);
      expect(mockFriendsLib.sendFriendRequest).toHaveBeenCalledWith(
        mockSessionUser.clerkId,
        'user2'
      );
    });

    it('should ignore a caller-supplied requesterId (no acting as someone else)', async () => {
      mockFriendsLib.sendFriendRequest.mockResolvedValue(
        {} as unknown as ReturnType<typeof mockFriendsLib.sendFriendRequest>
      );

      const request = new NextRequest(
        'http://localhost:3000/api/friends/requests',
        {
          method: 'POST',
          body: JSON.stringify({
            requesterId: 'someone_else',
            addresseeId: 'user2',
          }),
        }
      );
      const response = await sendFriendRequest(request);

      expect(response.status).toBe(201);
      expect(mockFriendsLib.sendFriendRequest).toHaveBeenCalledWith(
        mockSessionUser.clerkId,
        'user2'
      );
    });

    it('should return 401 if not authenticated', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/friends/requests',
        {
          method: 'POST',
          body: JSON.stringify({
            addresseeId: 'user2',
          }),
        }
      );
      const response = await sendFriendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
      expect(mockFriendsLib.sendFriendRequest).not.toHaveBeenCalled();
    });

    it('should return 400 if addresseeId is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/friends/requests',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );
      const response = await sendFriendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Addressee ID is required');
    });

    it('should return 400 if trying to send request to self', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/friends/requests',
        {
          method: 'POST',
          body: JSON.stringify({
            addresseeId: mockSessionUser.clerkId,
          }),
        }
      );
      const response = await sendFriendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Cannot send friend request to yourself');
    });

    it('should handle friendship already exists error', async () => {
      mockFriendsLib.sendFriendRequest.mockRejectedValue(
        new Error('Friendship already exists or request already sent')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/friends/requests',
        {
          method: 'POST',
          body: JSON.stringify({
            addresseeId: 'user2',
          }),
        }
      );
      const response = await sendFriendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        'Friendship already exists or request already sent'
      );
    });
  });
});

describe('/api/friends/requests/[id]', () => {
  it('should accept friend request as the session user', async () => {
    const mockFriendship = {
      _id: '507f1f77bcf86cd799439013',
      requesterId: 'user1',
      addresseeId: mockSessionUser.clerkId,
      status: 'accepted',
      createdAt: '2025-09-28T21:31:59.430Z',
      updatedAt: '2025-09-28T21:31:59.430Z',
    };

    mockFriendsLib.acceptFriendRequest.mockResolvedValue(
      mockFriendship as unknown as ReturnType<
        typeof mockFriendsLib.acceptFriendRequest
      >
    );

    const request = new NextRequest(
      'http://localhost:3000/api/friends/requests/507f1f77bcf86cd799439013',
      {
        method: 'PUT',
        body: JSON.stringify({
          action: 'accept',
        }),
      }
    );
    const response = await updateFriendRequest(request, {
      params: { id: '507f1f77bcf86cd799439013' },
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.friendship).toEqual(mockFriendship);
    expect(mockFriendsLib.acceptFriendRequest).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439013',
      mockSessionUser.clerkId
    );
  });

  it('should decline friend request as the session user', async () => {
    const mockFriendship = {
      _id: '507f1f77bcf86cd799439013',
      requesterId: 'user1',
      addresseeId: mockSessionUser.clerkId,
      status: 'declined',
      createdAt: '2025-09-28T21:31:59.430Z',
      updatedAt: '2025-09-28T21:31:59.430Z',
    };

    mockFriendsLib.declineFriendRequest.mockResolvedValue(
      mockFriendship as unknown as ReturnType<
        typeof mockFriendsLib.declineFriendRequest
      >
    );

    const request = new NextRequest(
      'http://localhost:3000/api/friends/requests/507f1f77bcf86cd799439013',
      {
        method: 'PUT',
        body: JSON.stringify({
          action: 'decline',
        }),
      }
    );
    const response = await updateFriendRequest(request, {
      params: { id: '507f1f77bcf86cd799439013' },
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.friendship).toEqual(mockFriendship);
    expect(mockFriendsLib.declineFriendRequest).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439013',
      mockSessionUser.clerkId
    );
  });

  it('should ignore a caller-supplied userId (no acting as someone else)', async () => {
    mockFriendsLib.acceptFriendRequest.mockResolvedValue(
      {} as unknown as ReturnType<typeof mockFriendsLib.acceptFriendRequest>
    );

    const request = new NextRequest(
      'http://localhost:3000/api/friends/requests/507f1f77bcf86cd799439013',
      {
        method: 'PUT',
        body: JSON.stringify({
          action: 'accept',
          userId: 'someone_else',
        }),
      }
    );
    const response = await updateFriendRequest(request, {
      params: { id: '507f1f77bcf86cd799439013' },
    } as any);

    expect(response.status).toBe(200);
    expect(mockFriendsLib.acceptFriendRequest).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439013',
      mockSessionUser.clerkId
    );
  });

  it('should return 401 if not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/friends/requests/507f1f77bcf86cd799439013',
      {
        method: 'PUT',
        body: JSON.stringify({
          action: 'accept',
        }),
      }
    );
    const response = await updateFriendRequest(request, {
      params: { id: '507f1f77bcf86cd799439013' },
    } as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
    expect(mockFriendsLib.acceptFriendRequest).not.toHaveBeenCalled();
  });

  it('should return 400 if action is invalid', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/friends/requests/507f1f77bcf86cd799439013',
      {
        method: 'PUT',
        body: JSON.stringify({
          action: 'invalid',
        }),
      }
    );
    const response = await updateFriendRequest(request, {
      params: { id: '507f1f77bcf86cd799439013' },
    } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Action must be either "accept" or "decline"');
  });

  it('should return 400 if action is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/friends/requests/507f1f77bcf86cd799439013',
      {
        method: 'PUT',
        body: JSON.stringify({}),
      }
    );
    const response = await updateFriendRequest(request, {
      params: { id: '507f1f77bcf86cd799439013' },
    } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Action is required');
  });
});

describe('/api/friends', () => {
  describe('GET', () => {
    it('should get friends for the session user', async () => {
      const mockFriends = [
        {
          _id: '507f1f77bcf86cd799439011',
          clerkId: 'clerk1',
          email: 'john@example.com',
          name: 'John Doe',
          profilePicture: 'pic1.jpg',
          city: 'New York',
          friendshipId: '507f1f77bcf86cd799439013',
          addedAt: '2025-09-28T21:31:59.432Z',
        },
      ];

      mockFriendsLib.getFriends.mockResolvedValue(
        mockFriends as unknown as ReturnType<typeof mockFriendsLib.getFriends>
      );

      const response = await getFriends();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.friends).toEqual(mockFriends);
      expect(data.count).toBe(1);
      expect(mockFriendsLib.getFriends).toHaveBeenCalledWith(
        mockSessionUser.clerkId
      );
    });

    it('should return 401 if not authenticated', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      const response = await getFriends();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
      expect(mockFriendsLib.getFriends).not.toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    it('should remove friend as the session user', async () => {
      mockFriendsLib.removeFriend.mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/friends?friendshipId=507f1f77bcf86cd799439013'
      );
      const response = await removeFriend(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Friend removed successfully');
      expect(mockFriendsLib.removeFriend).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        mockSessionUser.clerkId
      );
    });

    it('should ignore a caller-supplied userId and use the session user', async () => {
      mockFriendsLib.removeFriend.mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/friends?friendshipId=507f1f77bcf86cd799439013&userId=someone_else'
      );
      const response = await removeFriend(request);

      expect(response.status).toBe(200);
      expect(mockFriendsLib.removeFriend).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        mockSessionUser.clerkId
      );
    });

    it('should return 401 if not authenticated', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/friends?friendshipId=507f1f77bcf86cd799439013'
      );
      const response = await removeFriend(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
      expect(mockFriendsLib.removeFriend).not.toHaveBeenCalled();
    });

    it('should return 400 if friendshipId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/friends', {
        method: 'DELETE',
      });
      const response = await removeFriend(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Friendship ID is required');
    });

    it('should handle friendship not found error', async () => {
      mockFriendsLib.removeFriend.mockRejectedValue(
        new Error('Friendship not found or access denied')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/friends?friendshipId=507f1f77bcf86cd799439013'
      );
      const response = await removeFriend(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Friendship not found or access denied');
    });

    it('should return 400 if removal fails', async () => {
      mockFriendsLib.removeFriend.mockResolvedValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/friends?friendshipId=507f1f77bcf86cd799439013'
      );
      const response = await removeFriend(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to remove friend');
    });
  });
});
