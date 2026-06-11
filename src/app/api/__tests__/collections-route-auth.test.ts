/**
 * Auth tests for /api/collections
 * - GET must scope results to the authenticated user and ignore a foreign
 *   ?userId= query param (enumeration protection).
 * - POST for group collections relies on createGroupCollection's membership
 *   check; the route must map that failure to 403.
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '../collections/route';
import {
  getCollectionsByUserId,
  getGroupCollectionsByUserId,
  getAllCollectionsByUserId,
  createCollection,
  createGroupCollection,
} from '@/lib/collections';
import { requireAuth } from '@/lib/auth';

jest.mock('@/lib/collections', () => ({
  getCollectionsByUserId: jest.fn(),
  getGroupCollectionsByUserId: jest.fn(),
  getAllCollectionsByUserId: jest.fn(),
  createCollection: jest.fn(),
  createGroupCollection: jest.fn(),
}));
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockGetCollectionsByUserId =
  getCollectionsByUserId as jest.MockedFunction<typeof getCollectionsByUserId>;
const mockGetGroupCollectionsByUserId =
  getGroupCollectionsByUserId as jest.MockedFunction<
    typeof getGroupCollectionsByUserId
  >;
const mockGetAllCollectionsByUserId =
  getAllCollectionsByUserId as jest.MockedFunction<
    typeof getAllCollectionsByUserId
  >;
const mockCreateCollection = createCollection as jest.MockedFunction<
  typeof createCollection
>;
const mockCreateGroupCollection = createGroupCollection as jest.MockedFunction<
  typeof createGroupCollection
>;

const mockUser = {
  _id: { toString: () => '507f1f77bcf86cd799439010' },
  clerkId: 'clerk_user_123',
} as any;

describe('/api/collections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue(mockUser);
    mockGetCollectionsByUserId.mockResolvedValue([]);
    mockGetGroupCollectionsByUserId.mockResolvedValue([]);
    mockGetAllCollectionsByUserId.mockResolvedValue({
      personal: [],
      group: [],
    });
  });

  describe('GET', () => {
    it('ignores a foreign userId param and scopes personal collections to the caller', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/collections?type=personal&userId=clerk_someone_else'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetCollectionsByUserId).toHaveBeenCalledWith('clerk_user_123');
      expect(mockGetCollectionsByUserId).not.toHaveBeenCalledWith(
        'clerk_someone_else'
      );
    });

    it("ignores a foreign userId param for type 'all'", async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/collections?type=all&userId=clerk_someone_else'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetAllCollectionsByUserId).toHaveBeenCalledWith(
        'clerk_user_123'
      );
      expect(mockGetAllCollectionsByUserId).not.toHaveBeenCalledWith(
        'clerk_someone_else'
      );
    });

    it('scopes the caller-supplied own userId to the caller anyway', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/collections?type=personal&userId=clerk_user_123'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetCollectionsByUserId).toHaveBeenCalledWith('clerk_user_123');
    });
  });

  describe('POST', () => {
    it('returns 403 when the caller is not a member of the target group', async () => {
      mockCreateGroupCollection.mockRejectedValue(
        new Error('Group not found or user is not a member')
      );

      const request = new NextRequest('http://localhost:3000/api/collections', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Group Eats',
          type: 'group',
          groupId: '507f1f77bcf86cd799439099',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You are not a member of this group');
      // Membership is enforced inside createGroupCollection with the
      // authenticated user's id
      expect(mockCreateGroupCollection).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439099',
        'Group Eats',
        undefined,
        '507f1f77bcf86cd799439010'
      );
    });

    it('creates a group collection for a group member', async () => {
      const createdCollection = {
        _id: 'newCollection',
        name: 'Group Eats',
        type: 'group',
      };
      mockCreateGroupCollection.mockResolvedValue(createdCollection as any);

      const request = new NextRequest('http://localhost:3000/api/collections', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Group Eats',
          type: 'group',
          groupId: '507f1f77bcf86cd799439099',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.collection).toEqual(createdCollection);
    });

    it('creates a personal collection owned by the caller', async () => {
      const createdCollection = {
        _id: 'newCollection',
        name: 'My Eats',
        type: 'personal',
      };
      mockCreateCollection.mockResolvedValue(createdCollection as any);

      const request = new NextRequest('http://localhost:3000/api/collections', {
        method: 'POST',
        body: JSON.stringify({ name: 'My Eats' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(mockCreateCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'personal',
          ownerId: mockUser._id,
        })
      );
    });
  });
});
