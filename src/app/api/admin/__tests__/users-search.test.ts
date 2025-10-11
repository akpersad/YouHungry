/**
 * Admin Users Search API Tests
 *
 * Tests the /api/admin/users/search endpoint
 */

import { GET } from '../users/search/route';
import { NextRequest } from 'next/server';

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

describe('/api/admin/users/search', () => {
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

  it('returns paginated user results successfully', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn().mockReturnThis(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    // Mock user search results
    mockDb.toArray.mockResolvedValueOnce([
      {
        _id: 'user1',
        clerkId: 'clerk1',
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        createdAt: new Date('2024-01-01'),
        lastActiveAt: new Date('2024-01-10'),
      },
      {
        _id: 'user2',
        clerkId: 'clerk2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        username: 'janesmith',
        createdAt: new Date('2024-01-02'),
        lastActiveAt: new Date('2024-01-11'),
      },
    ]);

    // Mock total count
    mockDb.countDocuments.mockResolvedValue(25);

    // Mock aggregations for collections, groups, decisions
    mockDb.toArray
      .mockResolvedValueOnce([
        { _id: 'user1', count: 5 },
        { _id: 'user2', count: 3 },
      ]) // collections
      .mockResolvedValueOnce([
        { _id: 'user1', count: 2 },
        { _id: 'user2', count: 1 },
      ]) // groups
      .mockResolvedValueOnce([
        { _id: 'clerk1', count: 10 },
        { _id: 'clerk2', count: 7 },
      ]); // decisions

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/search?page=1&limit=20'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.users).toHaveLength(2);
    expect(data.data.users[0].id).toBe('user1');
    expect(data.data.users[0].name).toBe('John Doe');
    expect(data.data.users[0].collectionCount).toBe(5);
    expect(data.data.users[0].groupCount).toBe(2);
    expect(data.data.users[0].decisionCount).toBe(10);
    expect(data.data.pagination.totalCount).toBe(25);
    expect(data.data.pagination.totalPages).toBe(2);
  });

  it('filters users by search query', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn().mockReturnThis(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    mockDb.toArray.mockResolvedValueOnce([
      {
        _id: 'user1',
        clerkId: 'clerk1',
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        createdAt: new Date('2024-01-01'),
        lastActiveAt: new Date('2024-01-10'),
      },
    ]);

    mockDb.countDocuments.mockResolvedValue(1);
    mockDb.toArray.mockResolvedValueOnce([]); // collections
    mockDb.toArray.mockResolvedValueOnce([]); // groups
    mockDb.toArray.mockResolvedValueOnce([]); // decisions

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/search?q=john'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.users).toHaveLength(1);
    expect(data.data.users[0].name).toBe('John Doe');

    // Verify search filter was applied
    expect(mockDb.find).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: expect.arrayContaining([
          { name: { $regex: 'john', $options: 'i' } },
          { email: { $regex: 'john', $options: 'i' } },
          { username: { $regex: 'john', $options: 'i' } },
        ]),
      })
    );
  });

  it('supports custom page size', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockReturnThis(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    mockDb.toArray.mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/search?page=2&limit=10'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockDb.skip).toHaveBeenCalledWith(10); // (page-1) * limit = (2-1) * 10
    expect(mockDb.limit).toHaveBeenCalledWith(10);
  });

  it('supports sorting by different fields', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockReturnThis(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    mockDb.toArray.mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/search?sortBy=name&sortOrder=asc'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockDb.sort).toHaveBeenCalledWith(['name', 1]); // 1 for ascending
  });

  it('supports descending sort order', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockReturnThis(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    mockDb.toArray.mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/search?sortBy=createdAt&sortOrder=desc'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockDb.sort).toHaveBeenCalledWith(['createdAt', -1]); // -1 for descending
  });

  it('defaults to createdAt desc when no sort specified', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockReturnThis(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    mockDb.toArray.mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/search'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockDb.sort).toHaveBeenCalledWith(['createdAt', -1]);
  });

  it('handles users with no collections, groups, or decisions', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn().mockReturnThis(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    mockDb.toArray.mockResolvedValueOnce([
      {
        _id: 'user1',
        clerkId: 'clerk1',
        name: 'New User',
        email: 'new@example.com',
        username: 'newuser',
        createdAt: new Date('2024-01-15'),
        lastActiveAt: new Date('2024-01-15'),
      },
    ]);

    mockDb.countDocuments.mockResolvedValue(1);
    mockDb.toArray.mockResolvedValueOnce([]); // collections
    mockDb.toArray.mockResolvedValueOnce([]); // groups
    mockDb.toArray.mockResolvedValueOnce([]); // decisions

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/search'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.users).toHaveLength(1);
    expect(data.data.users[0].collectionCount).toBe(0);
    expect(data.data.users[0].groupCount).toBe(0);
    expect(data.data.users[0].decisionCount).toBe(0);
  });

  it('returns empty results when no users match query', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockReturnThis(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    mockDb.toArray.mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/search?q=nonexistent'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.users).toHaveLength(0);
    expect(data.data.pagination.totalCount).toBe(0);
    expect(data.data.pagination.totalPages).toBe(0);
  });

  it('calculates pagination correctly', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockResolvedValue(47),
      aggregate: jest.fn().mockReturnThis(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    mockDb.toArray.mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/search?page=2&limit=10'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.pagination.totalCount).toBe(47);
    expect(data.data.pagination.totalPages).toBe(5); // Math.ceil(47/10)
    expect(data.data.pagination.page).toBe(2);
    expect(data.data.pagination.limit).toBe(10);
  });

  it('returns error when authentication fails', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/search'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to search users');
  });

  it('returns error when database connection fails', async () => {
    mockConnectToDatabase.mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/search'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to search users');
  });

  it('formats user data correctly', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn().mockReturnThis(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    const testDate = new Date('2024-01-01T10:00:00Z');

    mockDb.toArray.mockResolvedValueOnce([
      {
        _id: 'testuser123',
        clerkId: 'clerk123',
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        createdAt: testDate,
        lastActiveAt: testDate,
      },
    ]);

    mockDb.countDocuments.mockResolvedValue(1);
    mockDb.toArray.mockResolvedValueOnce([{ _id: 'testuser123', count: 7 }]); // collections
    mockDb.toArray.mockResolvedValueOnce([{ _id: 'testuser123', count: 3 }]); // groups
    mockDb.toArray.mockResolvedValueOnce([{ _id: 'clerk123', count: 15 }]); // decisions

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/search'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.users[0]).toEqual({
      id: 'testuser123',
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: testDate.toISOString(),
      lastActiveAt: testDate.toISOString(),
      collectionCount: 7,
      groupCount: 3,
      decisionCount: 15,
    });
  });

  it('should properly serialize date fields', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn().mockReturnThis(),
    };

    mockConnectToDatabase.mockResolvedValue(
      mockDb as unknown as ReturnType<typeof connectToDatabase>
    );

    const testDate = new Date('2024-01-01T10:00:00Z');

    mockDb.toArray.mockResolvedValueOnce([
      {
        _id: 'user1',
        clerkId: 'clerk1',
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        createdAt: testDate,
        lastActiveAt: testDate,
      },
    ]);

    mockDb.countDocuments.mockResolvedValue(1);
    mockDb.toArray.mockResolvedValueOnce([]);
    mockDb.toArray.mockResolvedValueOnce([]);
    mockDb.toArray.mockResolvedValueOnce([]);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/search'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Date fields should be serialized as ISO strings
    expect(typeof data.data.users[0].createdAt).toBe('string');
    expect(typeof data.data.users[0].lastActiveAt).toBe('string');
  });
});
