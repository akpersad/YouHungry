import { GET } from '../history/route';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db';
import { NextRequest } from 'next/server';
import { Db } from 'mongodb';

jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/db');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<
  typeof connectToDatabase
>;

describe('GET /api/decisions/history', () => {
  let mockDb: Partial<Db>;

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

    mockConnectToDatabase.mockResolvedValue(mockDb);
  });

  it('should return unauthorized if user is not authenticated', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
      sessionId: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      sessionClaims: null,
      orgPermissions: null,
      actor: null,
      factorVerificationAge: null,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/history'
    );
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should fetch decision history with default filters', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user123',
      sessionId: 'session123',
      orgId: null,
      orgRole: null,
      orgSlug: null,
      sessionClaims: {},
      orgPermissions: null,
      actor: null,
      factorVerificationAge: null,
    });

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

  it('should filter by decision type', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user123',
      sessionId: 'session123',
      orgId: null,
      orgRole: null,
      orgSlug: null,
      sessionClaims: {},
      orgPermissions: null,
      actor: null,
      factorVerificationAge: null,
    });

    mockDb.countDocuments.mockResolvedValue(0);
    mockDb.toArray
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/history?type=group'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(mockDb.find).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'group',
      })
    );
  });

  it('should filter by date range', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user123',
      sessionId: 'session123',
      orgId: null,
      orgRole: null,
      orgSlug: null,
      sessionClaims: {},
      orgPermissions: null,
      actor: null,
      factorVerificationAge: null,
    });

    mockDb.countDocuments.mockResolvedValue(0);
    mockDb.toArray
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const startDate = '2024-01-01T00:00:00.000Z';
    const endDate = '2024-01-31T23:59:59.999Z';

    const request = new NextRequest(
      `http://localhost:3000/api/decisions/history?startDate=${startDate}&endDate=${endDate}`
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockDb.find).toHaveBeenCalledWith(
      expect.objectContaining({
        visitDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      })
    );
  });

  it('should apply search filter', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user123',
      sessionId: 'session123',
      orgId: null,
      orgRole: null,
      orgSlug: null,
      sessionClaims: {},
      orgPermissions: null,
      actor: null,
      factorVerificationAge: null,
    });

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
        name: 'Pizza Palace',
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
      'http://localhost:3000/api/decisions/history?search=pizza'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.decisions).toHaveLength(1);
  });

  it('should handle pagination correctly', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user123',
      sessionId: 'session123',
      orgId: null,
      orgRole: null,
      orgSlug: null,
      sessionClaims: {},
      orgPermissions: null,
      actor: null,
      factorVerificationAge: null,
    });

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
    mockAuth.mockResolvedValue({
      userId: 'user123',
      sessionId: 'session123',
      orgId: null,
      orgRole: null,
      orgSlug: null,
      sessionClaims: {},
      orgPermissions: null,
      actor: null,
      factorVerificationAge: null,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/history?limit=1000'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid query parameters');
  });
});
