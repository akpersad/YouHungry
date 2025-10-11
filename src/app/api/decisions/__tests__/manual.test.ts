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
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      collection: jest.fn().mockReturnThis(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
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
    } as any);

    const mockUser = {
      _id: { toString: () => 'userObjectId1' },
      clerkId: 'user123',
    };

    const mockCollection = {
      _id: { toString: () => 'collection1' },
      type: 'personal',
      ownerId: 'user123',
      restaurantIds: ['restaurant1'],
    };

    const mockRestaurant = {
      _id: { toString: () => 'restaurant1' },
      name: 'Test Restaurant',
    };

    // Mock toArray for personal collections query
    const mockToArray = jest.fn().mockResolvedValue([mockCollection]);
    const mockFind = jest.fn().mockReturnValue({
      toArray: mockToArray,
    });

    mockDb.find = mockFind;

    mockDb.findOne
      .mockResolvedValueOnce(mockUser) // First call: find user
      .mockResolvedValueOnce(mockRestaurant) // Second call: find restaurant
      .mockResolvedValueOnce(mockCollection); // Third call: find collection containing restaurant

    mockDb.insertOne.mockResolvedValue({
      insertedId: { toString: () => 'decision1' },
    });

    const requestBody = {
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
    } as any);

    const mockUser = {
      _id: { toString: () => 'userObjectId1' },
      clerkId: 'user123',
    };

    const mockGroup = {
      _id: { toString: () => 'group1' },
      memberIds: [mockUser._id],
    };

    const mockCollection = {
      _id: { toString: () => 'collection1' },
      type: 'group',
      groupId: mockGroup._id,
      restaurantIds: ['restaurant1'],
    };

    const mockRestaurant = {
      _id: { toString: () => 'restaurant1' },
      name: 'Test Restaurant',
    };

    mockDb.findOne
      .mockResolvedValueOnce(mockUser) // First call: find user
      .mockResolvedValueOnce(mockRestaurant) // Second call: find restaurant
      .mockResolvedValueOnce(mockGroup) // Third call: find group
      .mockResolvedValueOnce(mockCollection); // Fourth call: find group collection containing restaurant

    mockDb.insertOne.mockResolvedValue({
      insertedId: { toString: () => 'decision1' },
    });

    const requestBody = {
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

  it('should return 404 if user not found', async () => {
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

    mockDb.findOne.mockResolvedValueOnce(null); // User not found

    const requestBody = {
      restaurantId: 'restaurant1',
      visitDate: '2024-01-15T18:00:00.000Z',
      type: 'personal',
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
    expect(data.error).toBe('User not found');
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
    } as any);

    const mockUser = {
      _id: { toString: () => 'userObjectId1' },
      clerkId: 'user123',
    };

    mockDb.findOne
      .mockResolvedValueOnce(mockUser) // First call: find user
      .mockResolvedValueOnce(null); // Second call: restaurant not found

    const requestBody = {
      restaurantId: 'restaurant1',
      visitDate: '2024-01-15T18:00:00.000Z',
      type: 'personal',
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
    } as any);

    const requestBody = {
      restaurantId: '',
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

  it('should return 403 if user is not a member of the group', async () => {
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

    const mockUser = {
      _id: { toString: () => 'userObjectId1' },
      clerkId: 'user123',
    };

    const mockRestaurant = {
      _id: { toString: () => 'restaurant1' },
      name: 'Test Restaurant',
    };

    const mockGroup = {
      _id: { toString: () => 'group1' },
      memberIds: [{ toString: () => 'differentUser' }], // User is not a member
    };

    mockDb.findOne
      .mockResolvedValueOnce(mockUser) // First call: find user
      .mockResolvedValueOnce(mockRestaurant) // Second call: find restaurant
      .mockResolvedValueOnce(mockGroup); // Third call: find group

    const requestBody = {
      restaurantId: 'restaurant1',
      visitDate: '2024-01-15T18:00:00.000Z',
      type: 'group',
      groupId: 'group1',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/decisions/manual',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('User is not a member of this group');
  });

  it('should return 404 if restaurant not found in personal collection', async () => {
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

    const mockUser = {
      _id: { toString: () => 'userObjectId1' },
      clerkId: 'user123',
    };

    const mockRestaurant = {
      _id: { toString: () => 'restaurant1' },
      name: 'Test Restaurant',
    };

    // Mock toArray for personal collections query
    const mockToArray = jest.fn().mockResolvedValue([
      {
        _id: { toString: () => 'collection1' },
        name: 'Test Collection',
        ownerId: 'user123',
        restaurantIds: [],
      },
    ]);

    const mockFind = jest.fn().mockReturnValue({
      toArray: mockToArray,
    });

    mockDb.findOne
      .mockResolvedValueOnce(mockUser) // First call: find user
      .mockResolvedValueOnce(mockRestaurant) // Second call: find restaurant
      .mockResolvedValueOnce(null); // Third call: collection with restaurant not found

    mockDb.find = mockFind;

    const requestBody = {
      restaurantId: 'restaurant1',
      visitDate: '2024-01-15T18:00:00.000Z',
      type: 'personal',
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
    expect(data.error).toBe('Restaurant not found in any personal collection');
  });

  it('should return 404 if restaurant not found in group collection', async () => {
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

    const mockUser = {
      _id: { toString: () => 'userObjectId1' },
      clerkId: 'user123',
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
      .mockResolvedValueOnce(mockUser) // First call: find user
      .mockResolvedValueOnce(mockRestaurant) // Second call: find restaurant
      .mockResolvedValueOnce(mockGroup) // Third call: find group
      .mockResolvedValueOnce(null); // Fourth call: group collection with restaurant not found

    const requestBody = {
      restaurantId: 'restaurant1',
      visitDate: '2024-01-15T18:00:00.000Z',
      type: 'group',
      groupId: 'group1',
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
    expect(data.error).toBe('Restaurant not found in any group collection');
  });

  it('should return 404 if group not found', async () => {
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

    const mockUser = {
      _id: { toString: () => 'userObjectId1' },
      clerkId: 'user123',
    };

    const mockRestaurant = {
      _id: { toString: () => 'restaurant1' },
      name: 'Test Restaurant',
    };

    mockDb.findOne
      .mockResolvedValueOnce(mockUser) // First call: find user
      .mockResolvedValueOnce(mockRestaurant) // Second call: find restaurant
      .mockResolvedValueOnce(null); // Third call: group not found

    const requestBody = {
      restaurantId: 'restaurant1',
      visitDate: '2024-01-15T18:00:00.000Z',
      type: 'group',
      groupId: 'group1',
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
    expect(data.error).toBe('Group not found');
  });
});
