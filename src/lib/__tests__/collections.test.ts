// Mock dependencies
jest.mock('../db', () => ({
  connectToDatabase: jest.fn(),
}));

import {
  getCollectionsByUserId,
  getCollectionById,
  createCollection,
  updateCollection,
  isRestaurantInCollection,
  addRestaurantToCollection,
  removeRestaurantFromCollection,
  deleteCollection,
  getRestaurantsByCollection,
} from '../collections';
import * as db from '../db';
import { ObjectId } from 'mongodb';

const mockDb = db as jest.Mocked<typeof db>;

// Mock collection data
const mockCollection = {
  _id: new ObjectId('507f1f77bcf86cd799439011'),
  name: 'Test Collection',
  description: 'A test collection',
  type: 'personal' as const,
  ownerId: new ObjectId('507f1f77bcf86cd799439012'),
  restaurantIds: [
    new ObjectId('507f1f77bcf86cd799439013'),
    new ObjectId('507f1f77bcf86cd799439014'),
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockCollectionWithMixedIds = {
  ...mockCollection,
  restaurantIds: [
    new ObjectId('507f1f77bcf86cd799439013'),
    {
      _id: new ObjectId('507f1f77bcf86cd799439014'),
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    },
    {
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY5',
    },
  ],
};

const mockRestaurant = {
  _id: new ObjectId('507f1f77bcf86cd799439013'),
  googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  name: 'Test Restaurant',
  address: '123 Test Street',
  coordinates: { lat: 40.7128, lng: -74.006 },
  cuisine: 'Italian',
  rating: 4.5,
  priceRange: '$$' as const,
  timeToPickUp: 25,
  photos: ['https://example.com/photo.jpg'],
  phoneNumber: '+1-555-0123',
  website: 'https://testrestaurant.com',
  hours: { Monday: '9:00 AM – 10:00 PM' },
  cachedAt: new Date('2024-01-01'),
  lastUpdated: new Date('2024-01-01'),
};

describe('Collections API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCollectionsByUserId', () => {
    it('should get collections by user ID (ObjectId)', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockImplementation((collectionName) => {
          if (collectionName === 'users') {
            return {
              findOne: jest.fn().mockResolvedValue({
                _id: new ObjectId('507f1f77bcf86cd799439012'),
                clerkId: '507f1f77bcf86cd799439012',
                email: 'test@example.com',
                name: 'Test User',
              }),
            };
          }
          return {
            find: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue([mockCollection]),
              }),
            }),
          };
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await getCollectionsByUserId('507f1f77bcf86cd799439012');

      expect(mockDb.connectToDatabase).toHaveBeenCalled();
      expect(result).toEqual([mockCollection]);
    });

    it('should get collections by user ID (string)', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockImplementation((collectionName) => {
          if (collectionName === 'users') {
            return {
              findOne: jest.fn().mockResolvedValue(null), // User not found by Clerk ID
            };
          }
          return {
            find: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue([mockCollection]),
              }),
            }),
          };
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await getCollectionsByUserId('invalid-objectid');

      expect(mockDb.connectToDatabase).toHaveBeenCalled();
      expect(result).toEqual([mockCollection]);
    });
  });

  describe('getCollectionById', () => {
    it('should get collection by ID', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockCollection),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await getCollectionById('507f1f77bcf86cd799439011');

      expect(mockDb.connectToDatabase).toHaveBeenCalled();
      expect(result).toEqual(mockCollection);
    });

    it('should return null when collection not found', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await getCollectionById('507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });
  });

  describe('createCollection', () => {
    it('should create collection with ObjectId ownerId', async () => {
      const collectionData = {
        name: 'New Collection',
        description: 'A new collection',
        type: 'personal' as const,
        ownerId: new ObjectId('507f1f77bcf86cd799439012'),
      };

      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          insertOne: jest.fn().mockResolvedValue({
            insertedId: new ObjectId('507f1f77bcf86cd799439011'),
          }),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await createCollection(collectionData);

      expect(mockDb.connectToDatabase).toHaveBeenCalled();
      expect(result).toMatchObject({
        ...collectionData,
        restaurantIds: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should create collection with string ownerId', async () => {
      const collectionData = {
        name: 'New Collection',
        description: 'A new collection',
        type: 'personal' as const,
        ownerId: 'invalid-objectid',
      };

      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          insertOne: jest.fn().mockResolvedValue({
            insertedId: new ObjectId('507f1f77bcf86cd799439011'),
          }),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await createCollection(collectionData);

      expect(result.ownerId.toString()).toBe('invalid-objectid');
    });
  });

  describe('updateCollection', () => {
    it('should update collection', async () => {
      const updates = { name: 'Updated Collection' };
      const updatedCollection = { ...mockCollection, ...updates };

      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOneAndUpdate: jest.fn().mockResolvedValue(updatedCollection),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await updateCollection(
        '507f1f77bcf86cd799439011',
        updates
      );

      expect(mockDb.connectToDatabase).toHaveBeenCalled();
      expect(result).toEqual(updatedCollection);
    });
  });

  describe('isRestaurantInCollection', () => {
    it('should return true when restaurant exists by _id', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockCollection),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await isRestaurantInCollection(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439013'
      );

      expect(result).toBe(true);
    });

    it('should return true when restaurant exists by googlePlaceId', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockCollectionWithMixedIds),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await isRestaurantInCollection(
        '507f1f77bcf86cd799439011',
        'ChIJN1t_tDeuEmsRUsoyG83frY4'
      );

      expect(result).toBe(true);
    });

    it('should return false when restaurant does not exist', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await isRestaurantInCollection(
        '507f1f77bcf86cd799439011',
        'nonexistent-id'
      );

      expect(result).toBe(false);
    });
  });

  describe('addRestaurantToCollection', () => {
    it('should add restaurant with Google Place ID', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest
            .fn()
            .mockResolvedValueOnce(null) // isRestaurantInCollection check
            .mockResolvedValueOnce(mockRestaurant), // find restaurant by googlePlaceId
          findOneAndUpdate: jest.fn().mockResolvedValue({
            ...mockCollection,
            restaurantIds: [
              ...mockCollection.restaurantIds,
              {
                _id: mockRestaurant._id,
                googlePlaceId: mockRestaurant.googlePlaceId,
              },
            ],
          }),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await addRestaurantToCollection(
        '507f1f77bcf86cd799439011',
        'ChIJN1t_tDeuEmsRUsoyG83frY4'
      );

      expect(result.wasAdded).toBe(true);
      expect(result.collection).toBeDefined();
    });

    it('should add restaurant with database ID', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest
            .fn()
            .mockResolvedValueOnce(null) // isRestaurantInCollection check
            .mockResolvedValueOnce(mockRestaurant), // find restaurant by _id
          findOneAndUpdate: jest.fn().mockResolvedValue({
            ...mockCollection,
            restaurantIds: [
              ...mockCollection.restaurantIds,
              {
                _id: mockRestaurant._id,
                googlePlaceId: mockRestaurant.googlePlaceId,
              },
            ],
          }),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await addRestaurantToCollection(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439013'
      );

      expect(result.wasAdded).toBe(true);
      expect(result.collection).toBeDefined();
    });

    it('should not add restaurant if already exists', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockCollection), // isRestaurantInCollection check
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await addRestaurantToCollection(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439013'
      );

      expect(result.wasAdded).toBe(false);
      expect(result.collection).toBeDefined();
    });

    it('should handle restaurant not found in database', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest
            .fn()
            .mockResolvedValueOnce(null) // isRestaurantInCollection check
            .mockResolvedValueOnce(null), // find restaurant by googlePlaceId
          findOneAndUpdate: jest.fn().mockResolvedValue({
            ...mockCollection,
            restaurantIds: [
              ...mockCollection.restaurantIds,
              { googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' },
            ],
          }),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await addRestaurantToCollection(
        '507f1f77bcf86cd799439011',
        'ChIJN1t_tDeuEmsRUsoyG83frY4'
      );

      expect(result.wasAdded).toBe(true);
      expect(result.collection).toBeDefined();
    });
  });

  describe('removeRestaurantFromCollection', () => {
    it('should remove restaurant from collection', async () => {
      const updatedCollection = {
        ...mockCollection,
        restaurantIds: [mockCollection.restaurantIds[0]], // Remove one restaurant
      };

      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOneAndUpdate: jest.fn().mockResolvedValue(updatedCollection),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await removeRestaurantFromCollection(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439013'
      );

      expect(result).toEqual(updatedCollection);
    });
  });

  describe('deleteCollection', () => {
    it('should delete collection', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await deleteCollection('507f1f77bcf86cd799439011');

      expect(result).toBe(true);
    });

    it('should return false when collection not found', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          deleteOne: jest.fn().mockResolvedValue({ deletedCount: 0 }),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await deleteCollection('507f1f77bcf86cd799439011');

      expect(result).toBe(false);
    });
  });

  describe('getRestaurantsByCollection', () => {
    it('should get restaurants with mixed ID format', async () => {
      const mockRestaurants = [mockRestaurant];

      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockCollectionWithMixedIds),
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockRestaurants),
          }),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await getRestaurantsByCollection(
        '507f1f77bcf86cd799439011'
      );

      expect(result).toEqual(mockRestaurants);
    });

    it('should handle legacy ObjectId format', async () => {
      const mockRestaurants = [mockRestaurant];

      const mockDbInstance = {
        collection: jest.fn().mockImplementation((collectionName) => {
          if (collectionName === 'collections') {
            return {
              findOne: jest.fn().mockResolvedValue(mockCollection),
            };
          } else if (collectionName === 'restaurants') {
            return {
              find: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue(mockRestaurants),
              }),
            };
          }
          return {};
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await getRestaurantsByCollection(
        '507f1f77bcf86cd799439011'
      );

      expect(result).toEqual(mockRestaurants);
    });

    it('should return empty array when collection not found', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await getRestaurantsByCollection(
        '507f1f77bcf86cd799439011'
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when no restaurants', async () => {
      const emptyCollection = { ...mockCollection, restaurantIds: [] };

      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(emptyCollection),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await getRestaurantsByCollection(
        '507f1f77bcf86cd799439011'
      );

      expect(result).toEqual([]);
    });

    it('should filter out invalid restaurant IDs', async () => {
      const collectionWithInvalidIds = {
        ...mockCollection,
        restaurantIds: [
          new ObjectId('507f1f77bcf86cd799439013'),
          { invalid: 'data' }, // Invalid format
          null, // Null value
        ],
      };

      const mockRestaurants = [mockRestaurant];

      const mockDbInstance = {
        collection: jest.fn().mockImplementation((collectionName) => {
          if (collectionName === 'collections') {
            return {
              findOne: jest.fn().mockResolvedValue(collectionWithInvalidIds),
            };
          } else if (collectionName === 'restaurants') {
            return {
              find: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue(mockRestaurants),
              }),
            };
          }
          return {};
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await getRestaurantsByCollection(
        '507f1f77bcf86cd799439011'
      );

      expect(result).toEqual(mockRestaurants);
    });
  });
});
