/**
 * Admin Users Stats API Tests
 *
 * Tests the /api/admin/users/stats endpoint
 */

import { GET } from '../users/stats/route';

// Mock the database and auth modules
jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// Mock MongoDB ObjectId
jest.mock('mongodb', () => ({
  ObjectId: jest.fn((id) => ({ toString: () => id })),
}));

import { connectToDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<
  typeof connectToDatabase
>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe('/api/admin/users/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authenticated user
    mockRequireAuth.mockResolvedValue({
      _id: 'user123',
      clerkId: 'clerk123',
      email: 'admin@example.com',
      name: 'Admin User',
    } as any);
  });

  it('returns user statistics successfully', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      countDocuments: jest.fn(),
      aggregate: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      distinct: jest.fn(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    // Mock database responses
    mockDb.countDocuments
      .mockResolvedValueOnce(150) // totalUsers
      .mockResolvedValueOnce(25) // recentUsers
      .mockResolvedValueOnce(8) // weeklyUsers
      .mockResolvedValueOnce(200) // totalFriendRequests
      .mockResolvedValueOnce(15) // pendingFriendRequests
      .mockResolvedValueOnce(50) // totalGroupInvitations
      .mockResolvedValueOnce(8); // pendingGroupInvitations

    mockDb.distinct
      .mockResolvedValueOnce(['user1', 'user2', 'user3']) // usersWithCollections
      .mockResolvedValueOnce(['user1', 'user2']); // usersWithDecisions

    mockDb.aggregate.mockReturnThis();
    mockDb.toArray
      .mockResolvedValueOnce([
        // dailyRegistrations
        { _id: '2024-01-01', count: 5 },
        { _id: '2024-01-02', count: 3 },
      ])
      .mockResolvedValueOnce([
        // usersWithGroups
        { _id: 'user1' },
        { _id: 'user2' },
      ])
      .mockResolvedValueOnce([
        // usersWithDecisions
        { _id: 'user1' },
        { _id: 'user2' },
      ])
      .mockResolvedValueOnce([
        // topActiveUsers
        {
          _id: 'user1',
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: '2024-01-01T00:00:00Z',
          collectionCount: 10,
          groupCount: 5,
        },
      ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.overview.totalUsers).toBe(150);
    expect(data.data.overview.recentUsers).toBe(25);
    expect(data.data.overview.weeklyUsers).toBe(8);
    expect(data.data.overview.usersWithCollections).toBe(3);
    expect(data.data.overview.usersWithGroups).toBe(2);
    expect(data.data.overview.usersWithDecisions).toBe(2);
    expect(data.data.social.totalFriendRequests).toBe(200);
    expect(data.data.social.pendingFriendRequests).toBe(15);
    expect(data.data.topActiveUsers).toHaveLength(1);
  });

  it('returns error when authentication fails', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch user statistics');
  });

  it('returns error when database connection fails', async () => {
    mockConnectToDatabase.mockRejectedValue(
      new Error('Database connection failed')
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch user statistics');
  });

  it('handles empty database results', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
      distinct: jest.fn().mockResolvedValue([]),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.overview.totalUsers).toBe(0);
    expect(data.data.topActiveUsers).toHaveLength(0);
  });

  it('calculates daily registrations correctly', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      countDocuments: jest.fn(),
      aggregate: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      distinct: jest.fn(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    // Mock countDocuments calls (all 7 of them)
    mockDb.countDocuments
      .mockResolvedValueOnce(100) // totalUsers
      .mockResolvedValueOnce(10) // recentUsers
      .mockResolvedValueOnce(5) // weeklyUsers
      .mockResolvedValueOnce(50) // totalFriendRequests
      .mockResolvedValueOnce(10) // pendingFriendRequests
      .mockResolvedValueOnce(20) // totalGroupInvitations
      .mockResolvedValueOnce(5); // pendingGroupInvitations

    // Mock distinct calls
    mockDb.distinct
      .mockResolvedValueOnce(['user1', 'user2']) // usersWithCollections
      .mockResolvedValueOnce(['user3']); // For distinct in decisions

    // Mock toArray calls in correct order
    mockDb.toArray.mockResolvedValueOnce([
      { _id: '2024-01-01', count: 5 },
      { _id: '2024-01-02', count: 3 },
      { _id: '2024-01-03', count: 7 },
    ]); // dailyRegistrations

    mockDb.toArray.mockResolvedValueOnce([]); // usersWithGroups
    mockDb.toArray.mockResolvedValueOnce([]); // usersWithDecisions
    mockDb.toArray.mockResolvedValueOnce([]); // topActiveUsers

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.trends.dailyRegistrations).toHaveLength(3);
    expect(data.data.trends.dailyRegistrations[0]).toEqual({
      date: '2024-01-01',
      count: 5,
    });
  });

  it('formats top active users correctly', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      countDocuments: jest.fn(),
      aggregate: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      distinct: jest.fn(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    // Mock countDocuments calls
    mockDb.countDocuments
      .mockResolvedValueOnce(100) // totalUsers
      .mockResolvedValueOnce(10) // recentUsers
      .mockResolvedValueOnce(5) // weeklyUsers
      .mockResolvedValueOnce(50) // totalFriendRequests
      .mockResolvedValueOnce(10) // pendingFriendRequests
      .mockResolvedValueOnce(20) // totalGroupInvitations
      .mockResolvedValueOnce(5); // pendingGroupInvitations

    // Mock distinct calls
    mockDb.distinct
      .mockResolvedValueOnce(['user1', 'user2']) // usersWithCollections
      .mockResolvedValueOnce(['user3']); // For distinct in decisions

    // Mock toArray calls in order
    mockDb.toArray.mockResolvedValueOnce([]); // dailyRegistrations
    mockDb.toArray.mockResolvedValueOnce([]); // usersWithGroups
    mockDb.toArray.mockResolvedValueOnce([]); // usersWithDecisions

    // Mock top active users
    mockDb.toArray.mockResolvedValueOnce([
      {
        _id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        collectionCount: 10,
        groupCount: 5,
      },
      {
        _id: 'user2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        createdAt: '2024-01-02T00:00:00Z',
        collectionCount: 8,
        groupCount: 3,
      },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.topActiveUsers).toHaveLength(2);
    expect(data.data.topActiveUsers[0]).toEqual({
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: '2024-01-01T00:00:00Z',
      collectionCount: 10,
      groupCount: 5,
    });
  });
});
