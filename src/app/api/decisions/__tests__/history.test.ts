import { GET } from '../history/route';
import { getCurrentUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { NextRequest } from 'next/server';
import { Db } from 'mongodb';

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));
jest.mock('@/lib/db');

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<
  typeof connectToDatabase
>;

const mockUser = {
  _id: { toString: () => 'dbUser123' },
  clerkId: 'user123',
} as any;

describe('GET /api/decisions/history', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      collection: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      countDocuments: jest.fn(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
    };

    mockConnectToDatabase.mockResolvedValue(mockDb as any);
  });

  it('should return unauthorized if user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/history'
    );
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should fetch decision history with default filters', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const mockDecisions = [
      {
        _id: { toString: () => 'decision1' },
        type: 'personal',
        collectionId: { toString: () => 'collection1' },
        method: 'random',
        status: 'completed',
        participants: ['user123'],
        visitDate: new Date('2024-01-15'),
        result: {
          restaurantId: { toString: () => 'restaurant1' },
          selectedAt: new Date('2024-01-15'),
          reasoning: 'Weighted random selection',
        },
        createdAt: new Date('2024-01-15'),
      },
    ];

    const mockRestaurants = [
      {
        _id: { toString: () => 'restaurant1' },
        name: 'Test Restaurant',
        address: '123 Main St',
        cuisine: 'Italian',
        rating: 4.5,
      },
    ];

    const mockCollections = [
      {
        _id: { toString: () => 'collection1' },
        name: 'Favorites',
      },
    ];

    mockDb.countDocuments.mockResolvedValue(1);
    mockDb.toArray
      .mockResolvedValueOnce(mockDecisions)
      .mockResolvedValueOnce(mockRestaurants)
      .mockResolvedValueOnce(mockCollections)
      .mockResolvedValueOnce([]);

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/history'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.decisions).toHaveLength(1);
    expect(data.decisions[0].result.restaurant.name).toBe('Test Restaurant');
    expect(data.pagination.total).toBe(1);
  });

  it('should apply filters (type, date range, search)', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);

    // Test type filter
    mockDb.countDocuments.mockResolvedValue(0);
    mockDb.toArray
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const typeRequest = new NextRequest(
      'http://localhost:3000/api/decisions/history?type=group'
    );
    await GET(typeRequest);
    expect(mockDb.find).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'group',
        // Personal decisions store the Clerk ID in participants; group
        // decisions store Mongo ObjectId strings - both must match
        participants: { $in: ['user123', 'dbUser123'] },
      })
    );

    // Test date range filter
    jest.clearAllMocks();
    mockDb.countDocuments.mockResolvedValue(0);
    mockDb.toArray
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const startDate = '2024-01-01T00:00:00.000Z';
    const endDate = '2024-01-31T23:59:59.999Z';
    const dateRequest = new NextRequest(
      `http://localhost:3000/api/decisions/history?startDate=${startDate}&endDate=${endDate}`
    );
    await GET(dateRequest);
    expect(mockDb.find).toHaveBeenCalledWith(
      expect.objectContaining({
        visitDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      })
    );
  });

  it('should handle pagination correctly', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);

    mockDb.countDocuments.mockResolvedValue(150);
    mockDb.toArray
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/history?limit=50&offset=50'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.pagination.offset).toBe(50);
    expect(data.pagination.limit).toBe(50);
    expect(data.pagination.hasMore).toBe(true);
    expect(mockDb.skip).toHaveBeenCalledWith(50);
    expect(mockDb.limit).toHaveBeenCalledWith(50);
  });

  it('should return validation error for invalid query params', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/history?limit=1000'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid query parameters');
  });
});
