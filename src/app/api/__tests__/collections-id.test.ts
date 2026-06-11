/**
 * Auth and ownership tests for /api/collections/[id]
 * GET requires member-level access; PUT/DELETE require owner (personal)
 * or group admin (group).
 */
import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../collections/[id]/route';
import {
  verifyCollectionAccess,
  updateCollection,
  deleteCollection,
} from '@/lib/collections';
import { getCurrentUser } from '@/lib/auth';

jest.mock('@/lib/collections', () => ({
  verifyCollectionAccess: jest.fn(),
  updateCollection: jest.fn(),
  deleteCollection: jest.fn(),
}));
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

const mockVerifyCollectionAccess =
  verifyCollectionAccess as jest.MockedFunction<typeof verifyCollectionAccess>;
const mockUpdateCollection = updateCollection as jest.MockedFunction<
  typeof updateCollection
>;
const mockDeleteCollection = deleteCollection as jest.MockedFunction<
  typeof deleteCollection
>;
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;

const collectionId = '507f1f77bcf86cd799439011';

const mockUser = {
  _id: { toString: () => '507f1f77bcf86cd799439010' },
  clerkId: 'clerk_user_123',
} as any;

const mockCollection = {
  _id: collectionId,
  name: 'Test Collection',
  type: 'personal',
  ownerId: '507f1f77bcf86cd799439010',
  restaurantIds: [],
} as any;

const makeContext = (id: string = collectionId) => ({
  params: Promise.resolve({ id }),
});

describe('/api/collections/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockVerifyCollectionAccess.mockResolvedValue(mockCollection);
    mockUpdateCollection.mockResolvedValue(mockCollection);
    mockDeleteCollection.mockResolvedValue(true);
  });

  describe('GET', () => {
    it('returns the collection for an authorized user', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/collections/${collectionId}`
      );
      const response = await GET(request, makeContext());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.collection).toEqual(mockCollection);
      expect(mockVerifyCollectionAccess).toHaveBeenCalledWith(
        collectionId,
        mockUser,
        'member'
      );
    });

    it('returns 401 when unauthenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/collections/${collectionId}`
      );
      const response = await GET(request, makeContext());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockVerifyCollectionAccess).not.toHaveBeenCalled();
    });

    it('returns 404 when the collection does not belong to the caller', async () => {
      mockVerifyCollectionAccess.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/collections/${collectionId}`
      );
      const response = await GET(request, makeContext());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Collection not found');
    });
  });

  describe('PUT', () => {
    const makePutRequest = () =>
      new NextRequest(`http://localhost:3000/api/collections/${collectionId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Renamed Collection' }),
      });

    it('updates the collection for the owner / group admin', async () => {
      const response = await PUT(makePutRequest(), makeContext());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Renaming requires admin-level access
      expect(mockVerifyCollectionAccess).toHaveBeenCalledWith(
        collectionId,
        mockUser,
        'admin'
      );
      expect(mockUpdateCollection).toHaveBeenCalledWith(collectionId, {
        name: 'Renamed Collection',
        description: undefined,
      });
    });

    it('returns 401 when unauthenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const response = await PUT(makePutRequest(), makeContext());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockUpdateCollection).not.toHaveBeenCalled();
    });

    it('returns 404 when the caller lacks admin access', async () => {
      mockVerifyCollectionAccess.mockResolvedValue(null);

      const response = await PUT(makePutRequest(), makeContext());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Collection not found');
      expect(mockUpdateCollection).not.toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    const makeDeleteRequest = () =>
      new NextRequest(`http://localhost:3000/api/collections/${collectionId}`, {
        method: 'DELETE',
      });

    it('deletes the collection for the owner / group admin', async () => {
      const response = await DELETE(makeDeleteRequest(), makeContext());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Deleting requires admin-level access
      expect(mockVerifyCollectionAccess).toHaveBeenCalledWith(
        collectionId,
        mockUser,
        'admin'
      );
      expect(mockDeleteCollection).toHaveBeenCalledWith(collectionId);
    });

    it('returns 401 when unauthenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const response = await DELETE(makeDeleteRequest(), makeContext());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockDeleteCollection).not.toHaveBeenCalled();
    });

    it('returns 404 when the caller lacks admin access', async () => {
      mockVerifyCollectionAccess.mockResolvedValue(null);

      const response = await DELETE(makeDeleteRequest(), makeContext());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Collection not found');
      expect(mockDeleteCollection).not.toHaveBeenCalled();
    });
  });
});
