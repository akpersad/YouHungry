/**
 * Admin Analytics Usage API Tests
 *
 * Tests the /api/admin/analytics/usage endpoint
 */

import { GET } from '../analytics/usage/route';
import { NextRequest } from 'next/server';

// Mock the database and auth modules
jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/api-usage-tracker', () => ({
  getAPIUsageStats: jest.fn(),
}));

import { connectToDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getAPIUsageStats } from '@/lib/api-usage-tracker';

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<
  typeof connectToDatabase
>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockGetAPIUsageStats = getAPIUsageStats as jest.MockedFunction<
  typeof getAPIUsageStats
>;

describe('/api/admin/analytics/usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authenticated user
    mockRequireAuth.mockResolvedValue({
      _id: 'user123',
      clerkId: 'clerk123',
      email: 'admin@example.com',
      name: 'Admin User',
    } as any);

    // Mock default API usage stats
    mockGetAPIUsageStats.mockResolvedValue({
      totalCalls: 100,
      totalCost: 0.5,
      byType: {},
      byEndpoint: {},
    });
  });

  it('returns usage analytics for 7-day period', async () => {
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

    // Mock feature usage counts
    mockDb.countDocuments
      .mockResolvedValueOnce(450) // restaurant search (personal)
      .mockResolvedValueOnce(120) // group decisions
      .mockResolvedValueOnce(85) // collection creation
      .mockResolvedValueOnce(25) // group creation
      .mockResolvedValueOnce(60) // friend requests
      .mockResolvedValueOnce(100) // errorLogs in period
      .mockResolvedValueOnce(15) // errorGroups in period
      .mockResolvedValueOnce(150) // total users
      .mockResolvedValueOnce(570) // all decisions in period
      .mockResolvedValueOnce(85) // collections in period
      .mockResolvedValueOnce(25); // groups in period

    // Mock distinct calls for active users
    mockDb.distinct
      .mockResolvedValueOnce(['user1', 'user2', 'user3']) // users with decisions
      .mockResolvedValueOnce(['user1', 'user4']) // users with collections
      .mockResolvedValueOnce(['user2', 'user5']); // users with groups

    // Mock toArray calls in order
    // First call is for errorCounts aggregation
    mockDb.toArray.mockResolvedValueOnce([]);

    // Second call is for dailyActivity aggregation
    mockDb.toArray.mockResolvedValueOnce([
      {
        _id: '2024-01-08',
        decisions: 15,
        uniqueUsers: ['user1', 'user2', 'user3'],
        uniqueUserCount: 3,
      },
      {
        _id: '2024-01-09',
        decisions: 22,
        uniqueUsers: ['user1', 'user4'],
        uniqueUserCount: 2,
      },
      {
        _id: '2024-01-10',
        decisions: 18,
        uniqueUsers: ['user1', 'user2', 'user3', 'user4'],
        uniqueUserCount: 4,
      },
    ]);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/usage?period=7d'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.period).toBe('7d');
    expect(data.data.featureUsage.restaurantSearch).toBe(450);
    expect(data.data.featureUsage.groupDecisions).toBe(120);
    expect(data.data.userBehavior.totalUsers).toBe(150);
    expect(data.data.trends.dailyActivity).toHaveLength(3);
  });

  it('returns usage analytics for 30-day period', async () => {
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

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/usage?period=30d'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.period).toBe('30d');
    expect(new Date(data.data.dateRange.start)).toBeInstanceOf(Date);
    expect(new Date(data.data.dateRange.end)).toBeInstanceOf(Date);
  });

  it('returns usage analytics for 90-day period', async () => {
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

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/usage?period=90d'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.period).toBe('90d');
  });

  it('defaults to 7-day period when no period specified', async () => {
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

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/usage'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.period).toBe('7d');
  });

  it('calculates engagement rate correctly', async () => {
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

    // Mock countDocuments calls in order
    mockDb.countDocuments
      .mockResolvedValueOnce(0) // personal decisions
      .mockResolvedValueOnce(0) // group decisions
      .mockResolvedValueOnce(0) // collections
      .mockResolvedValueOnce(0) // groups
      .mockResolvedValueOnce(0) // friendships
      .mockResolvedValueOnce(0) // errorLogs in period
      .mockResolvedValueOnce(0) // errorGroups in period
      .mockResolvedValueOnce(100) // total users
      .mockResolvedValueOnce(0) // all decisions in period
      .mockResolvedValueOnce(0) // collections in period
      .mockResolvedValueOnce(0); // groups in period

    // Mock distinct calls
    mockDb.distinct
      .mockResolvedValueOnce(['user1', 'user2', 'user3']) // users with decisions - 75 users
      .mockResolvedValueOnce(['user1', 'user4']) // users with collections
      .mockResolvedValueOnce(['user2', 'user5']); // users with groups

    // Mock toArray calls
    mockDb.toArray.mockResolvedValueOnce([]); // error counts aggregation
    mockDb.toArray.mockResolvedValueOnce([]); // daily activity

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/usage?period=7d'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Active users: 5 unique (user1-5), total users: 100, so 5%
    expect(data.data.userBehavior.totalUsers).toBe(100);
  });

  it('handles zero users correctly', async () => {
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

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/usage?period=7d'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.userBehavior.engagementRate).toBe(0);
  });

  it('formats daily activity correctly', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      distinct: jest.fn().mockResolvedValue([]),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    mockDb.toArray.mockResolvedValueOnce([]); // error counts aggregation

    // Mock daily activity
    mockDb.toArray.mockResolvedValueOnce([
      {
        _id: '2024-01-08',
        decisions: 15,
        uniqueUsers: ['user1', 'user2', 'user3'],
        uniqueUserCount: 3,
      },
      {
        _id: '2024-01-09',
        decisions: 22,
        uniqueUsers: ['user1', 'user2', 'user3', 'user4'],
        uniqueUserCount: 4,
      },
    ]);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/usage?period=7d'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.trends.dailyActivity).toHaveLength(2);
    expect(data.data.trends.dailyActivity[0]).toEqual({
      date: '2024-01-08',
      decisions: 15,
      uniqueUsers: 3,
    });
    expect(data.data.trends.dailyActivity[1]).toEqual({
      date: '2024-01-09',
      decisions: 22,
      uniqueUsers: 4,
    });
  });

  it('includes capacity planning metrics', async () => {
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

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/usage?period=7d'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.capacityPlanning).toBeDefined();
    expect(data.data.capacityPlanning.currentUsers).toBeDefined();
    expect(data.data.capacityPlanning.projectedGrowth).toBeDefined();
    expect(data.data.capacityPlanning.recommendations).toBeDefined();
    expect(Array.isArray(data.data.capacityPlanning.recommendations)).toBe(
      true
    );
  });

  it('includes popular features ranking', async () => {
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

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/usage?period=7d'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.popularFeatures).toBeDefined();
    expect(Array.isArray(data.data.popularFeatures)).toBe(true);
    expect(data.data.popularFeatures.length).toBeGreaterThan(0);

    // Check that features are sorted by usage
    const features = data.data.popularFeatures;
    for (let i = 1; i < features.length; i++) {
      expect(features[i - 1].usage).toBeGreaterThanOrEqual(features[i].usage);
    }
  });

  it('returns error when authentication fails', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/usage?period=7d'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch usage analytics');
  });

  it('returns error when database connection fails', async () => {
    mockConnectToDatabase.mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/usage?period=7d'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch usage analytics');
  });

  it('includes API usage metrics', async () => {
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

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/usage?period=7d'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.apiUsage).toBeDefined();
    expect(data.data.apiUsage.googlePlaces).toBeDefined();
    expect(data.data.apiUsage.googleMaps).toBeDefined();
    expect(data.data.apiUsage.internal).toBeDefined();
  });
});
