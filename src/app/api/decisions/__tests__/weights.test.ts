import { GET, POST } from '../weights/route';
import { getCurrentUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import {
  getUserDecisionHistory,
  getGroupDecisionHistory,
} from '@/lib/decisions';
import { verifyCollectionAccess } from '@/lib/collections';
import { NextRequest } from 'next/server';
import { Decision } from '@/types/database';

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));
jest.mock('@/lib/db');
jest.mock('@/lib/decisions');
jest.mock('@/lib/collections', () => ({
  verifyCollectionAccess: jest.fn(),
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<
  typeof connectToDatabase
>;
const mockGetUserDecisionHistory =
  getUserDecisionHistory as jest.MockedFunction<typeof getUserDecisionHistory>;
const mockGetGroupDecisionHistory =
  getGroupDecisionHistory as jest.MockedFunction<
    typeof getGroupDecisionHistory
  >;
const mockVerifyCollectionAccess =
  verifyCollectionAccess as jest.MockedFunction<typeof verifyCollectionAccess>;

const mockUser = {
  _id: { toString: () => 'dbUser123' },
  clerkId: 'user123',
} as any;

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
    mockGetCurrentUser.mockResolvedValue(mockUser);
  });

  it('should return unauthorized if user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/weights?collectionId=collection1'
    );
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should return weights for all restaurants in collection', async () => {
    const mockCollection = {
      _id: { toString: () => 'collection1' },
      restaurantIds: [{ toString: () => 'restaurant1' }],
      type: 'personal',
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

    mockVerifyCollectionAccess.mockResolvedValue(mockCollection as any);
    mockDb.toArray.mockResolvedValue(mockRestaurants);
    mockGetUserDecisionHistory.mockResolvedValue(mockDecisions as Decision[]);

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
    // Personal decision history is looked up by the caller's Clerk ID
    expect(mockGetUserDecisionHistory).toHaveBeenCalledWith('user123');
  });

  it('should return 404 if collection not found or not accessible', async () => {
    mockVerifyCollectionAccess.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/weights?collectionId=collection1'
    );
    const response = await GET(request);

    expect(response.status).toBe(404);
    expect(mockGetUserDecisionHistory).not.toHaveBeenCalled();
    expect(mockGetGroupDecisionHistory).not.toHaveBeenCalled();
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
    mockGetCurrentUser.mockResolvedValue(mockUser);
  });

  it('should reset all weights for a personal collection', async () => {
    const mockCollection = {
      _id: { toString: () => 'collection1' },
      type: 'personal',
      ownerId: 'user123',
    };

    mockVerifyCollectionAccess.mockResolvedValue(mockCollection as any);
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
    // Personal resets are scoped to the caller's own decisions (Clerk ID)
    expect(mockDb.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'personal',
        participants: 'user123',
      })
    );
  });

  it('should reset weight for a specific restaurant', async () => {
    const mockCollection = {
      _id: { toString: () => 'collection1' },
      type: 'personal',
      ownerId: 'user123',
    };

    mockVerifyCollectionAccess.mockResolvedValue(mockCollection as any);
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

  it('should scope group collection resets to the owning group', async () => {
    const mockCollection = {
      _id: { toString: () => 'collection1' },
      type: 'group',
      // Group collections store the owning group's id in ownerId
      ownerId: { toString: () => '507f1f77bcf86cd799439099' },
    };

    mockVerifyCollectionAccess.mockResolvedValue(mockCollection as any);
    mockDb.deleteMany.mockResolvedValue({ deletedCount: 3 });

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/weights',
      {
        method: 'POST',
        body: JSON.stringify({ collectionId: 'collection1' }),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockDb.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'group',
        groupId: expect.anything(),
      })
    );
    // Must NOT fall back to deleting the caller's personal history
    const filter = mockDb.deleteMany.mock.calls[0][0];
    expect(filter.participants).toBeUndefined();
  });

  it('should return 404 when the collection does not belong to the caller', async () => {
    mockVerifyCollectionAccess.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/weights',
      {
        method: 'POST',
        body: JSON.stringify({ collectionId: 'collection1' }),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(404);
    expect(mockDb.deleteMany).not.toHaveBeenCalled();
  });

  it('should return unauthorized if user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/weights',
      {
        method: 'POST',
        body: JSON.stringify({ collectionId: 'collection1' }),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(mockDb.deleteMany).not.toHaveBeenCalled();
  });
});
