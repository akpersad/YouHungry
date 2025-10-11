import { NextRequest } from 'next/server';
import { GET as searchUsers } from '../friends/search/route';
import {
  GET as getFriendRequests,
  POST as sendFriendRequest,
} from '../friends/requests/route';
import { PUT as updateFriendRequest } from '../friends/requests/[id]/route';
import { GET as getFriends, DELETE as removeFriend } from '../friends/route';
import * as friendsLib from '@/lib/friends';

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

describe('/api/friends/search', () => {
  it('should search users successfully', async () => {
    const mockResults = [
      {
        _id: '507f1f77bcf86cd799439011',
        clerkId: 'clerk1',
        email: 'john@example.com',
        name: 'John Doe',
        profilePicture: 'pic1.jpg',
        city: 'New York',
      },
    ];

    mockFriendsLib.searchUsers.mockResolvedValue(mockResults);

    const request = new NextRequest(
      'http://localhost:3000/api/friends/search?q=john&userId=user1'
    );
    const response = await searchUsers(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.results).toEqual(mockResults);
    expect(data.count).toBe(1);
    expect(mockFriendsLib.searchUsers).toHaveBeenCalledWith('john', 'user1');
  });

  it('should return 400 if query is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/friends/search?userId=user1'
    );
    const response = await searchUsers(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Search query is required');
  });

  it('should return 400 if userId is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/friends/search?q=john'
    );
    const response = await searchUsers(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('User ID is required');
  });

  it('should handle errors gracefully', async () => {
    mockFriendsLib.searchUsers.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest(
      'http://localhost:3000/api/friends/search?q=john&userId=user1'
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
    it('should get friend requests successfully', async () => {
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

      const request = new NextRequest(
        'http://localhost:3000/api/friends/requests?userId=user1'
      );
      const response = await getFriendRequests(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.requests).toEqual(mockRequests);
      expect(mockFriendsLib.getFriendRequests).toHaveBeenCalledWith('user1');
    });

    it('should return 400 if userId is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/friends/requests'
      );
      const response = await getFriendRequests(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User ID is required');
    });
  });

  describe('POST', () => {
    it('should send friend request successfully', async () => {
      const mockFriendship = {
        _id: '507f1f77bcf86cd799439013',
        requesterId: 'user1',
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
            requesterId: 'user1',
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
        'user1',
        'user2'
      );
    });

    it('should return 400 if requesterId is missing', async () => {
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
      expect(data.error).toBe('Requester ID and addressee ID are required');
    });

    it('should return 400 if addresseeId is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/friends/requests',
        {
          method: 'POST',
          body: JSON.stringify({
            requesterId: 'user1',
          }),
        }
      );
      const response = await sendFriendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Requester ID and addressee ID are required');
    });

    it('should return 400 if trying to send request to self', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/friends/requests',
        {
          method: 'POST',
          body: JSON.stringify({
            requesterId: 'user1',
            addresseeId: 'user1',
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
            requesterId: 'user1',
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
  it('should accept friend request successfully', async () => {
    const mockFriendship = {
      _id: '507f1f77bcf86cd799439013',
      requesterId: 'user1',
      addresseeId: 'user2',
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
          userId: 'user2',
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
      'user2'
    );
  });

  it('should decline friend request successfully', async () => {
    const mockFriendship = {
      _id: '507f1f77bcf86cd799439013',
      requesterId: 'user1',
      addresseeId: 'user2',
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
          userId: 'user2',
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
      'user2'
    );
  });

  it('should return 400 if action is invalid', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/friends/requests/507f1f77bcf86cd799439013',
      {
        method: 'PUT',
        body: JSON.stringify({
          action: 'invalid',
          userId: 'user2',
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

  it('should return 400 if userId is missing', async () => {
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

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Action and user ID are required');
  });
});

describe('/api/friends', () => {
  describe('GET', () => {
    it('should get friends successfully', async () => {
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

      const request = new NextRequest(
        'http://localhost:3000/api/friends?userId=user1'
      );
      const response = await getFriends(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.friends).toEqual(mockFriends);
      expect(data.count).toBe(1);
      expect(mockFriendsLib.getFriends).toHaveBeenCalledWith('user1');
    });

    it('should return 400 if userId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/friends');
      const response = await getFriends(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User ID is required');
    });
  });

  describe('DELETE', () => {
    it('should remove friend successfully', async () => {
      mockFriendsLib.removeFriend.mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/friends?friendshipId=507f1f77bcf86cd799439013&userId=user1'
      );
      const response = await removeFriend(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Friend removed successfully');
      expect(mockFriendsLib.removeFriend).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        'user1'
      );
    });

    it('should return 400 if friendshipId is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/friends?userId=user1'
      );
      const response = await removeFriend(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Friendship ID and user ID are required');
    });

    it('should return 400 if userId is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/friends?friendshipId=507f1f77bcf86cd799439013'
      );
      const response = await removeFriend(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Friendship ID and user ID are required');
    });

    it('should handle friendship not found error', async () => {
      mockFriendsLib.removeFriend.mockRejectedValue(
        new Error('Friendship not found or access denied')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/friends?friendshipId=507f1f77bcf86cd799439013&userId=user1'
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
        'http://localhost:3000/api/friends?friendshipId=507f1f77bcf86cd799439013&userId=user1'
      );
      const response = await removeFriend(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to remove friend');
    });
  });
});
