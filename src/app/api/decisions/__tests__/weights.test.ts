import { GET, POST } from '../weights/route';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db';
import { getDecisionHistory } from '@/lib/decisions';
import { NextRequest } from 'next/server';
import { Db } from 'mongodb';
import { Decision } from '@/types/database';

jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/db');
jest.mock('@/lib/decisions');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<
  typeof connectToDatabase
>;
const mockGetDecisionHistory = getDecisionHistory as jest.MockedFunction<
  typeof getDecisionHistory
>;

describe('GET /api/decisions/weights', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      collection: jest.fn().mockReturnThis(),
      findOne: jest.fn(),
      find: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
    };

    mockConnectToDatabase.mockResolvedValue(mockDb as any);
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
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/weights?collectionId=collection1'
    );
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should return weights for all restaurants in collection', async () => {
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
    } as any);

    const mockCollection = {
      _id: { toString: () => 'collection1' },
      restaurantIds: [{ toString: () => 'restaurant1' }],
    };

    const mockDecisions = [
      {
        _id: { toString: () => 'decision1' },
        result: {
          restaurantId: { toString: () => 'restaurant1' },
          selectedAt: new Date('2024-01-01'),
        },
      },
    ];

    const mockRestaurants = [
      {
        _id: { toString: () => 'restaurant1' },
        name: 'Test Restaurant',
      },
    ];

    mockDb.findOne.mockResolvedValue(mockCollection);
    mockDb.toArray.mockResolvedValue(mockRestaurants);
    mockGetDecisionHistory.mockResolvedValue(mockDecisions as Decision[]);

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/weights?collectionId=collection1'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.weights).toHaveLength(1);
    expect(data.weights[0].name).toBe('Test Restaurant');
    expect(data.weights[0]).toHaveProperty('currentWeight');
    expect(data.weights[0]).toHaveProperty('daysUntilFullWeight');
  });

  it('should return 404 if collection not found', async () => {
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
    } as any);
    mockDb.findOne.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/weights?collectionId=collection1'
    );
    const response = await GET(request);

    expect(response.status).toBe(404);
  });
});

describe('POST /api/decisions/weights', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      collection: jest.fn().mockReturnThis(),
      findOne: jest.fn(),
      deleteMany: jest.fn(),
    };

    mockConnectToDatabase.mockResolvedValue(mockDb as any);
  });

  it('should reset all weights for a collection', async () => {
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
    } as any);

    const mockCollection = {
      _id: { toString: () => 'collection1' },
    };

    mockDb.findOne.mockResolvedValue(mockCollection);
    mockDb.deleteMany.mockResolvedValue({ deletedCount: 5 });

    const requestBody = {
      collectionId: 'collection1',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/weights',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.deletedDecisions).toBe(5);
    expect(data.message).toContain('All weights reset');
  });

  it('should reset weight for a specific restaurant', async () => {
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
    } as any);

    const mockCollection = {
      _id: { toString: () => 'collection1' },
    };

    mockDb.findOne.mockResolvedValue(mockCollection);
    mockDb.deleteMany.mockResolvedValue({ deletedCount: 2 });

    const requestBody = {
      collectionId: 'collection1',
      restaurantId: 'restaurant1',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/weights',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('Restaurant weight reset');
    expect(mockDb.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        'result.restaurantId': expect.anything(),
      })
    );
  });
});
