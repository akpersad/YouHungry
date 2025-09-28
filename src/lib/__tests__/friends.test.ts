import {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriends,
  getFriendRequests,
  areFriends,
  getFriendship,
} from '../friends';
import { connectToDatabase } from '../db';
import { ObjectId } from 'mongodb';

// Mock the database connection
jest.mock('../db', () => ({
  connectToDatabase: jest.fn(),
}));

const mockDb = {
  collection: jest.fn(),
};

const mockCollection = {
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn(),
  insertOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
  aggregate: jest.fn().mockReturnThis(),
  toArray: jest.fn(),
  project: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  lookup: jest.fn().mockReturnThis(),
  unwind: jest.fn().mockReturnThis(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (connectToDatabase as jest.Mock).mockResolvedValue(mockDb);
  mockDb.collection.mockReturnValue(mockCollection);
});

describe('searchUsers', () => {
  it('should return empty array for empty query', async () => {
    const result = await searchUsers('', 'user1');
    expect(result).toEqual([]);
    expect(mockCollection.find).not.toHaveBeenCalled();
  });

  it('should search users by email, name, and username', async () => {
    const mockUsers = [
      {
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        clerkId: 'clerk1',
        email: 'john@example.com',
        name: 'John Doe',
        username: 'johndoe',
        profilePicture: 'pic1.jpg',
        city: 'New York',
      },
      {
        _id: new ObjectId('507f1f77bcf86cd799439012'),
        clerkId: 'clerk2',
        email: 'jane@example.com',
        name: 'Jane Smith',
        username: 'janesmith',
        profilePicture: 'pic2.jpg',
        city: 'Los Angeles',
      },
    ];

    // Mock current user lookup
    mockCollection.findOne.mockResolvedValueOnce({ _id: 'user1' });
    // Mock users search
    mockCollection.toArray.mockResolvedValue(mockUsers);
    // Mock friendship lookups (none for this test)
    mockCollection.findOne.mockResolvedValue(null);

    const result = await searchUsers('john', 'user1');

    expect(mockCollection.findOne).toHaveBeenCalledWith({
      clerkId: 'user1',
    });
    expect(mockCollection.find).toHaveBeenCalledWith({
      clerkId: { $ne: 'user1' },
      $or: [{ email: /john/i }, { name: /john/i }, { username: /john/i }],
    });
    expect(mockCollection.project).toHaveBeenCalledWith({
      clerkId: 1,
      email: 1,
      name: 1,
      username: 1,
      profilePicture: 1,
      city: 1,
    });
    expect(mockCollection.limit).toHaveBeenCalledWith(10);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      _id: '507f1f77bcf86cd799439011',
      clerkId: 'clerk1',
      email: 'john@example.com',
      name: 'John Doe',
      username: 'johndoe',
      profilePicture: 'pic1.jpg',
      city: 'New York',
      relationshipStatus: 'none',
    });
  });
});

describe('sendFriendRequest', () => {
  it('should send a friend request successfully', async () => {
    const mockFriendship = {
      _id: new ObjectId('507f1f77bcf86cd799439013'),
      requesterId: new ObjectId('user1'),
      addresseeId: new ObjectId('user2'),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockCollection.findOne.mockResolvedValueOnce({ _id: 'user1' }); // Requester exists
    mockCollection.findOne.mockResolvedValueOnce({ _id: 'user2' }); // Addressee exists
    mockCollection.findOne.mockResolvedValueOnce(null); // No existing friendship
    mockCollection.insertOne.mockResolvedValue({
      insertedId: mockFriendship._id,
    });

    const result = await sendFriendRequest('user1', 'user2');

    expect(mockCollection.findOne).toHaveBeenCalledWith({
      clerkId: 'user1',
    });
    expect(mockCollection.findOne).toHaveBeenCalledWith({
      clerkId: 'user2',
    });
    expect(mockCollection.insertOne).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        requesterId: 'user1',
        addresseeId: 'user2',
        status: 'pending',
      })
    );
  });

  it('should throw error if friendship already exists', async () => {
    mockCollection.findOne.mockResolvedValueOnce({ _id: 'user1' }); // Requester exists
    mockCollection.findOne.mockResolvedValueOnce({ _id: 'user2' }); // Addressee exists
    mockCollection.findOne.mockResolvedValueOnce({
      _id: 'existing',
      status: 'pending',
    }); // Existing friendship

    await expect(sendFriendRequest('user1', 'user2')).rejects.toThrow(
      'Friend request already sent'
    );
  });

  it('should throw error if user not found', async () => {
    mockCollection.findOne.mockResolvedValueOnce(null); // Requester not found

    await expect(sendFriendRequest('user1', 'user2')).rejects.toThrow(
      'One or both users not found'
    );
  });
});

describe('acceptFriendRequest', () => {
  it('should accept a friend request successfully', async () => {
    const mockFriendship = {
      _id: new ObjectId('507f1f77bcf86cd799439013'),
      requesterId: new ObjectId('user1'),
      addresseeId: new ObjectId('user2'),
      status: 'accepted',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockCollection.findOne.mockResolvedValueOnce({ _id: 'user2' }); // User exists
    mockCollection.findOneAndUpdate.mockResolvedValue(mockFriendship);

    const result = await acceptFriendRequest('friendship1', 'user2');

    expect(mockCollection.findOne).toHaveBeenCalledWith({
      clerkId: 'user2',
    });
    expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: expect.any(Object),
        addresseeId: 'user2',
        status: 'pending',
      },
      {
        $set: {
          status: 'accepted',
          updatedAt: expect.any(Date),
        },
      },
      { returnDocument: 'after' }
    );
    expect(result).toEqual(mockFriendship);
  });

  it('should throw error if request not found', async () => {
    mockCollection.findOne.mockResolvedValueOnce({ _id: 'user2' }); // User exists
    mockCollection.findOneAndUpdate.mockResolvedValue(null);

    await expect(acceptFriendRequest('friendship1', 'user2')).rejects.toThrow(
      'Friend request not found or already processed'
    );
  });
});

describe('declineFriendRequest', () => {
  it('should decline a friend request successfully', async () => {
    const mockFriendship = {
      _id: new ObjectId('507f1f77bcf86cd799439013'),
      requesterId: new ObjectId('user1'),
      addresseeId: new ObjectId('user2'),
      status: 'declined',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockCollection.findOne.mockResolvedValueOnce({ _id: 'user2' }); // User exists
    mockCollection.findOneAndUpdate.mockResolvedValue(mockFriendship);

    const result = await declineFriendRequest('friendship1', 'user2');

    expect(mockCollection.findOne).toHaveBeenCalledWith({
      clerkId: 'user2',
    });
    expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: expect.any(Object),
        addresseeId: 'user2',
        status: 'pending',
      },
      {
        $set: {
          status: 'declined',
          updatedAt: expect.any(Date),
        },
      },
      { returnDocument: 'after' }
    );
    expect(result).toEqual(mockFriendship);
  });
});

describe('removeFriend', () => {
  it('should remove a friend successfully', async () => {
    const mockFriendship = {
      _id: new ObjectId('507f1f77bcf86cd799439013'),
      requesterId: new ObjectId('user1'),
      addresseeId: new ObjectId('user2'),
    };

    mockCollection.findOne.mockResolvedValueOnce({ _id: 'user1' }); // User exists
    mockCollection.findOne.mockResolvedValueOnce(mockFriendship); // Friendship exists
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const result = await removeFriend('friendship1', 'user1');

    expect(mockCollection.findOne).toHaveBeenCalledWith({
      clerkId: 'user1',
    });
    expect(mockCollection.deleteOne).toHaveBeenCalledWith({
      _id: expect.any(Object),
    });
    expect(result).toBe(true);
  });

  it('should throw error if friendship not found', async () => {
    mockCollection.findOne.mockResolvedValueOnce({ _id: 'user1' }); // User exists
    mockCollection.findOne.mockResolvedValueOnce(null); // Friendship not found

    await expect(removeFriend('friendship1', 'user1')).rejects.toThrow(
      'Friendship not found or access denied'
    );
  });
});

describe('getFriends', () => {
  it('should return friends list', async () => {
    const mockFriends = [
      {
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        clerkId: 'clerk1',
        email: 'john@example.com',
        name: 'John Doe',
        profilePicture: 'pic1.jpg',
        city: 'New York',
        friendshipId: new ObjectId('507f1f77bcf86cd799439013'),
        addedAt: new Date(),
      },
    ];

    mockCollection.findOne.mockResolvedValueOnce({ _id: 'user1' }); // User exists
    mockCollection.toArray.mockResolvedValue(mockFriends);

    const result = await getFriends('user1');

    expect(mockCollection.findOne).toHaveBeenCalledWith({
      clerkId: 'user1',
    });
    expect(mockCollection.aggregate).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      _id: '507f1f77bcf86cd799439011',
      clerkId: 'clerk1',
      email: 'john@example.com',
      name: 'John Doe',
      profilePicture: 'pic1.jpg',
      city: 'New York',
      friendshipId: '507f1f77bcf86cd799439013',
      addedAt: expect.any(Date),
    });
  });
});

describe('getFriendRequests', () => {
  it('should return sent and received requests', async () => {
    const mockSentRequests = [
      {
        _id: new ObjectId('507f1f77bcf86cd799439013'),
        requester: {
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          clerkId: 'clerk1',
          email: 'john@example.com',
          name: 'John Doe',
          profilePicture: 'pic1.jpg',
        },
        addressee: {
          _id: new ObjectId('507f1f77bcf86cd799439012'),
          clerkId: 'clerk2',
          email: 'jane@example.com',
          name: 'Jane Smith',
          profilePicture: 'pic2.jpg',
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockReceivedRequests = [];

    mockCollection.findOne.mockResolvedValueOnce({ _id: 'user1' }); // User exists
    mockCollection.toArray
      .mockResolvedValueOnce(mockSentRequests)
      .mockResolvedValueOnce(mockReceivedRequests);

    const result = await getFriendRequests('user1');

    expect(mockCollection.findOne).toHaveBeenCalledWith({
      clerkId: 'user1',
    });
    expect(result).toEqual({
      sent: [
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
          status: 'pending',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
      received: [],
    });
  });
});

describe('areFriends', () => {
  it('should return true if users are friends', async () => {
    mockCollection.findOne
      .mockResolvedValueOnce({ _id: 'user1' }) // User 1 exists
      .mockResolvedValueOnce({ _id: 'user2' }) // User 2 exists
      .mockResolvedValueOnce({ _id: 'friendship1' }); // Friendship exists

    const result = await areFriends('user1', 'user2');

    expect(result).toBe(true);
    expect(mockCollection.findOne).toHaveBeenCalledWith({
      clerkId: 'user1',
    });
    expect(mockCollection.findOne).toHaveBeenCalledWith({
      clerkId: 'user2',
    });
  });

  it('should return false if users are not friends', async () => {
    mockCollection.findOne
      .mockResolvedValueOnce({ _id: 'user1' }) // User 1 exists
      .mockResolvedValueOnce({ _id: 'user2' }) // User 2 exists
      .mockResolvedValueOnce(null); // No friendship

    const result = await areFriends('user1', 'user2');

    expect(result).toBe(false);
  });
});

describe('getFriendship', () => {
  it('should return friendship if it exists', async () => {
    const mockFriendship = {
      _id: new ObjectId('507f1f77bcf86cd799439013'),
      requesterId: new ObjectId('user1'),
      addresseeId: new ObjectId('user2'),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockCollection.findOne
      .mockResolvedValueOnce({ _id: 'user1' }) // User 1 exists
      .mockResolvedValueOnce({ _id: 'user2' }) // User 2 exists
      .mockResolvedValueOnce(mockFriendship); // Friendship exists

    const result = await getFriendship('user1', 'user2');

    expect(result).toEqual(mockFriendship);
  });

  it('should return null if friendship does not exist', async () => {
    mockCollection.findOne
      .mockResolvedValueOnce({ _id: 'user1' }) // User 1 exists
      .mockResolvedValueOnce({ _id: 'user2' }) // User 2 exists
      .mockResolvedValueOnce(null); // No friendship

    const result = await getFriendship('user1', 'user2');

    expect(result).toBeNull();
  });
});
