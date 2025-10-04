/**
 * Admin Database Stats API Tests
 *
 * Tests the /api/admin/database/stats endpoint
 */

import { GET } from '../database/stats/route';
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

describe('/api/admin/database/stats', () => {
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

  it('returns database statistics successfully', async () => {
    const mockAdminDb = {
      ping: jest.fn().mockResolvedValue(undefined),
    };

    const mockDb = {
      admin: jest.fn().mockReturnValue(mockAdminDb),
      collection: jest.fn().mockReturnThis(),
      countDocuments: jest.fn(),
      stats: jest.fn(),
      indexes: jest.fn(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    // Mock collection stats
    mockDb.countDocuments.mockResolvedValue(150);
    mockDb.stats.mockResolvedValue({
      storageSize: 1048576, // 1MB
      totalIndexSize: 262144, // 256KB
    });
    mockDb.indexes.mockResolvedValue([
      { name: '_id_' },
      { name: 'email_1' },
      { name: 'createdAt_1' },
    ]);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/database/stats'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.connection.status).toBe('connected');
    expect(data.data.connection.latency).toBeGreaterThanOrEqual(0);
    expect(data.data.overview.totalCollections).toBe(7); // 7 collections
    expect(data.data.collections).toHaveLength(7);
    expect(data.data.collections[0]).toMatchObject({
      name: 'users',
      count: 150,
      storageSize: 1048576,
      indexSize: 262144,
      indexes: 3,
    });
  });

  it('handles disconnected database status', async () => {
    const mockAdminDb = {
      ping: jest.fn().mockRejectedValue(new Error('Connection failed')),
    };

    const mockDb = {
      admin: jest.fn().mockReturnValue(mockAdminDb),
      collection: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockResolvedValue(0),
      stats: jest.fn().mockResolvedValue({ storageSize: 0, totalIndexSize: 0 }),
      indexes: jest.fn().mockResolvedValue([]),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    const request = new NextRequest(
      'http://localhost:3000/api/admin/database/stats'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.connection.status).toBe('disconnected');
  });

  it('handles collection errors gracefully', async () => {
    const mockAdminDb = {
      ping: jest.fn().mockResolvedValue(undefined),
    };

    const mockDb = {
      admin: jest.fn().mockReturnValue(mockAdminDb),
      collection: jest.fn().mockImplementation((name) => {
        if (name === 'users') {
          throw new Error('Collection not found');
        }
        return {
          countDocuments: jest.fn().mockResolvedValue(100),
          stats: jest.fn().mockResolvedValue({
            storageSize: 1048576,
            totalIndexSize: 262144,
          }),
          indexes: jest
            .fn()
            .mockResolvedValue([{ name: '_id_' }, { name: 'email_1' }]),
        };
      }),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    const request = new NextRequest(
      'http://localhost:3000/api/admin/database/stats'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Should have error collection with error message
    const errorCollection = data.data.collections.find(
      (col: { name: string; error?: string }) => col.name === 'users'
    );
    expect(errorCollection).toBeDefined();
    expect(errorCollection.error).toBe('Collection not found');
  });

  it('calculates storage optimization recommendations', async () => {
    const mockAdminDb = {
      ping: jest.fn().mockResolvedValue(undefined),
    };

    const mockDb = {
      admin: jest.fn().mockReturnValue(mockAdminDb),
      collection: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockResolvedValue(15000), // Large collection
      stats: jest.fn().mockResolvedValue({
        storageSize: 1048576,
        totalIndexSize: 524288, // High index size
      }),
      indexes: jest
        .fn()
        .mockResolvedValue([
          { name: '_id_' },
          { name: 'email_1' },
          { name: 'name_1' },
          { name: 'createdAt_1' },
          { name: 'updatedAt_1' },
          { name: 'status_1' },
        ]),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    const request = new NextRequest(
      'http://localhost:3000/api/admin/database/stats'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.recommendations).toBeDefined();
    expect(data.data.recommendations.length).toBeGreaterThan(0);
  });

  it('returns error when authentication fails', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/database/stats'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch database statistics');
  });

  it('returns error when database connection fails', async () => {
    mockConnectToDatabase.mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/admin/database/stats'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch database statistics');
  });

  it('calculates recent activity correctly', async () => {
    const mockAdminDb = {
      ping: jest.fn().mockResolvedValue(undefined),
    };

    const mockDb = {
      admin: jest.fn().mockReturnValue(mockAdminDb),
      collection: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockResolvedValue(0),
      stats: jest.fn().mockResolvedValue({ storageSize: 0, totalIndexSize: 0 }),
      indexes: jest.fn().mockResolvedValue([]),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    const request = new NextRequest(
      'http://localhost:3000/api/admin/database/stats'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.performance.recentActivity).toBeDefined();
    expect(data.data.performance.recentActivity).toHaveProperty('newUsers');
    expect(data.data.performance.recentActivity).toHaveProperty(
      'newCollections'
    );
    expect(data.data.performance.recentActivity).toHaveProperty('newGroups');
    expect(data.data.performance.recentActivity).toHaveProperty('newDecisions');
  });

  it('formats collection statistics correctly', async () => {
    const mockAdminDb = {
      ping: jest.fn().mockResolvedValue(undefined),
    };

    const mockDb = {
      admin: jest.fn().mockReturnValue(mockAdminDb),
      collection: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockResolvedValue(150),
      stats: jest.fn().mockResolvedValue({
        storageSize: 1048576, // 1MB
        totalIndexSize: 262144, // 256KB
      }),
      indexes: jest
        .fn()
        .mockResolvedValue([{ name: '_id_' }, { name: 'email_1' }]),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    const request = new NextRequest(
      'http://localhost:3000/api/admin/database/stats'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    const usersCollection = data.data.collections.find(
      (col: {
        name: string;
        count: number;
        storageSize: number;
        indexSize: number;
        indexes: number;
      }) => col.name === 'users'
    );
    expect(usersCollection).toBeDefined();
    expect(usersCollection.count).toBe(150);
    expect(usersCollection.storageSize).toBe(1048576);
    expect(usersCollection.indexSize).toBe(262144);
    expect(usersCollection.indexes).toBe(2);
  });
});
