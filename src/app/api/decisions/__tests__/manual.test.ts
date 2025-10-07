import { POST } from '../manual/route';
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

describe('POST /api/decisions/manual', () => {
  let mockDb: Partial<Db>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      collection: jest.fn().mockReturnThis(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
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
      'http://localhost:3000/api/decisions/manual',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should create a manual personal decision', async () => {
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

    const mockCollection = {
      _id: { toString: () => 'collection1' },
      type: 'personal',
      ownerId: 'user123',
    };

    const mockRestaurant = {
      _id: { toString: () => 'restaurant1' },
      name: 'Test Restaurant',
    };

    mockDb.findOne
      .mockResolvedValueOnce(mockCollection)
      .mockResolvedValueOnce(mockRestaurant);

    mockDb.insertOne.mockResolvedValue({
      insertedId: { toString: () => 'decision1' },
    });

    const requestBody = {
      collectionId: 'collection1',
      restaurantId: 'restaurant1',
      visitDate: '2024-01-15T18:00:00.000Z',
      type: 'personal',
      notes: 'Great dinner!',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/manual',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.decision.id).toBe('decision1');
    expect(data.decision.notes).toBe('Great dinner!');
    expect(mockDb.insertOne).toHaveBeenCalled();
  });

  it('should create a manual group decision', async () => {
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

    const mockUser = {
      _id: { toString: () => 'userObjectId1' },
      clerkId: 'user123',
    };

    const mockCollection = {
      _id: { toString: () => 'collection1' },
      type: 'group',
    };

    const mockRestaurant = {
      _id: { toString: () => 'restaurant1' },
      name: 'Test Restaurant',
    };

    const mockGroup = {
      _id: { toString: () => 'group1' },
      memberIds: [mockUser._id],
    };

    mockDb.findOne
      .mockResolvedValueOnce(mockCollection)
      .mockResolvedValueOnce(mockRestaurant)
      .mockResolvedValueOnce(mockGroup)
      .mockResolvedValueOnce(mockUser);

    mockDb.insertOne.mockResolvedValue({
      insertedId: { toString: () => 'decision1' },
    });

    const requestBody = {
      collectionId: 'collection1',
      restaurantId: 'restaurant1',
      visitDate: '2024-01-15T18:00:00.000Z',
      type: 'group',
      groupId: 'group1',
      notes: 'Group outing',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/manual',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
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
    });

    mockDb.findOne.mockResolvedValueOnce(null);

    const requestBody = {
      collectionId: 'collection1',
      restaurantId: 'restaurant1',
      visitDate: '2024-01-15T18:00:00.000Z',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/manual',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Collection not found');
  });

  it('should return 404 if restaurant not found', async () => {
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

    const mockCollection = {
      _id: { toString: () => 'collection1' },
    };

    mockDb.findOne
      .mockResolvedValueOnce(mockCollection)
      .mockResolvedValueOnce(null);

    const requestBody = {
      collectionId: 'collection1',
      restaurantId: 'restaurant1',
      visitDate: '2024-01-15T18:00:00.000Z',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/manual',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Restaurant not found');
  });

  it('should return validation error for invalid input', async () => {
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

    const requestBody = {
      collectionId: '',
      restaurantId: 'restaurant1',
      visitDate: 'invalid-date',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/manual',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid input');
  });
});
