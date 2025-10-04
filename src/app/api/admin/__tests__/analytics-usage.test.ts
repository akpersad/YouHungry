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

import { connectToDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<
  typeof connectToDatabase
>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe('/api/admin/analytics/usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authenticated user
    mockRequireAuth.mockResolvedValue({
      _id: 'user123',
      clerkId: 'clerk123',
      email: 'admin@example.com',
      name: 'Admin User',
    } as { _id: string; clerkId: string; email: string; name: string });
  });

  it('returns usage analytics for 7-day period', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      countDocuments: jest.fn(),
      aggregate: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    // Mock feature usage counts
    mockDb.countDocuments
      .mockResolvedValueOnce(450) // restaurant search
      .mockResolvedValueOnce(120) // group decisions
      .mockResolvedValueOnce(85) // collection creation
      .mockResolvedValueOnce(25) // group creation
      .mockResolvedValueOnce(60); // friend requests

    // Mock user behavior aggregation
    mockDb.aggregate.mockReturnThis();
    mockDb.toArray.mockResolvedValueOnce([
      {
        totalUsers: 150,
        avgCollectionsPerUser: 2.5,
        avgGroupsPerUser: 0.8,
        avgDecisionsPerUser: 3.2,
        activeUsers: 95,
      },
    ]);

    // Mock daily activity aggregation
    mockDb.toArray.mockResolvedValueOnce([
      { _id: '2024-01-08', decisions: 15, uniqueUsers: ['user1', 'user2'] },
      { _id: '2024-01-09', decisions: 22, uniqueUsers: ['user1', 'user3'] },
      { _id: '2024-01-10', decisions: 18, uniqueUsers: ['user2', 'user4'] },
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
    expect(data.userBehavior.engagementRate).toBe(63.3);
    expect(data.data.trends.dailyActivity).toHaveLength(3);
  });

  it('returns usage analytics for 30-day period', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
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
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    // Mock user behavior with specific values
    mockDb.toArray.mockResolvedValueOnce([
      {
        totalUsers: 100,
        avgCollectionsPerUser: 2.0,
        avgGroupsPerUser: 1.0,
        avgDecisionsPerUser: 3.0,
        activeUsers: 75,
      },
    ]);

    mockDb.toArray.mockResolvedValueOnce([]); // dailyActivity

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/usage?period=7d'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.userBehavior.engagementRate).toBe(75.0); // 75/100 * 100
  });

  it('handles zero users correctly', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
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
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    mockDb.toArray.mockResolvedValueOnce([]); // userBehavior

    // Mock daily activity
    mockDb.toArray.mockResolvedValueOnce([
      {
        _id: '2024-01-08',
        decisions: 15,
        uniqueUsers: ['user1', 'user2', 'user3'],
      },
      {
        _id: '2024-01-09',
        decisions: 22,
        uniqueUsers: ['user1', 'user4', 'user5', 'user6'],
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
