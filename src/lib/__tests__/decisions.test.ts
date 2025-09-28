import { ObjectId } from 'mongodb';
import {
  calculateRestaurantWeight,
  getDecisionHistory,
  createPersonalDecision,
  performRandomSelection,
  getDecisionStatistics,
} from '../decisions';
import { Decision, Restaurant } from '@/types/database';

// Mock the database connection
jest.mock('../db', () => ({
  connectToDatabase: jest.fn(),
}));

// Mock the collections module
jest.mock('../collections', () => ({
  getRestaurantsByCollection: jest.fn(),
}));

describe('Decision System', () => {
  const mockDb = {
    collection: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { connectToDatabase } = require('../db');
    (connectToDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('calculateRestaurantWeight', () => {
    const restaurantId = new ObjectId();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    it('should return full weight for restaurant never selected', () => {
      const decisionHistory: Decision[] = [];
      const weight = calculateRestaurantWeight(restaurantId, decisionHistory);
      expect(weight).toBe(1.0);
    });

    it('should return full weight for restaurant not selected in last 30 days', () => {
      const oldDecision: Decision = {
        _id: new ObjectId(),
        type: 'personal',
        collectionId: new ObjectId(),
        participants: [new ObjectId()],
        method: 'random',
        status: 'completed',
        deadline: new Date(),
        visitDate: new Date(),
        result: {
          restaurantId,
          selectedAt: new Date(thirtyDaysAgo.getTime() - 24 * 60 * 60 * 1000), // 31 days ago
          reasoning: 'Test',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const decisionHistory: Decision[] = [oldDecision];
      const weight = calculateRestaurantWeight(restaurantId, decisionHistory);
      expect(weight).toBe(1.0);
    });

    it('should return reduced weight for recently selected restaurant', () => {
      const recentDecision: Decision = {
        _id: new ObjectId(),
        type: 'personal',
        collectionId: new ObjectId(),
        participants: [new ObjectId()],
        method: 'random',
        status: 'completed',
        deadline: new Date(),
        visitDate: new Date(),
        result: {
          restaurantId,
          selectedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          reasoning: 'Test',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const decisionHistory: Decision[] = [recentDecision];
      const weight = calculateRestaurantWeight(restaurantId, decisionHistory);

      // Should be less than 1.0 but more than 0.1
      expect(weight).toBeLessThan(1.0);
      expect(weight).toBeGreaterThan(0.1);
    });

    it('should return minimum weight for very recently selected restaurant', () => {
      const veryRecentDecision: Decision = {
        _id: new ObjectId(),
        type: 'personal',
        collectionId: new ObjectId(),
        participants: [new ObjectId()],
        method: 'random',
        status: 'completed',
        deadline: new Date(),
        visitDate: new Date(),
        result: {
          restaurantId,
          selectedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
          reasoning: 'Test',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const decisionHistory: Decision[] = [veryRecentDecision];
      const weight = calculateRestaurantWeight(restaurantId, decisionHistory);

      // Should be close to minimum weight (0.1)
      expect(weight).toBeCloseTo(0.1, 1);
    });

    it('should use most recent selection when multiple exist', () => {
      const oldDecision: Decision = {
        _id: new ObjectId(),
        type: 'personal',
        collectionId: new ObjectId(),
        participants: [new ObjectId()],
        method: 'random',
        status: 'completed',
        deadline: new Date(),
        visitDate: new Date(),
        result: {
          restaurantId,
          selectedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
          reasoning: 'Test',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const recentDecision: Decision = {
        _id: new ObjectId(),
        type: 'personal',
        collectionId: new ObjectId(),
        participants: [new ObjectId()],
        method: 'random',
        status: 'completed',
        deadline: new Date(),
        visitDate: new Date(),
        result: {
          restaurantId,
          selectedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          reasoning: 'Test',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const decisionHistory: Decision[] = [oldDecision, recentDecision];
      const weight = calculateRestaurantWeight(restaurantId, decisionHistory);

      // Should be based on the more recent selection (2 days ago)
      expect(weight).toBeLessThan(1.0);
      expect(weight).toBeGreaterThan(0.1);
    });
  });

  describe('getDecisionHistory', () => {
    it('should fetch decision history from database', async () => {
      const collectionId = new ObjectId().toString();
      const mockDecisions = [
        {
          _id: new ObjectId(),
          type: 'personal',
          collectionId: new ObjectId(collectionId),
          participants: [new ObjectId()],
          method: 'random',
          status: 'completed',
          deadline: new Date(),
          visitDate: new Date(),
          result: {
            restaurantId: new ObjectId(),
            selectedAt: new Date(),
            reasoning: 'Test',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockCollection = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockDecisions),
            }),
          }),
        }),
      };

      mockDb.collection.mockReturnValue(mockCollection);

      const result = await getDecisionHistory(collectionId, 50);

      expect(mockDb.collection).toHaveBeenCalledWith('decisions');
      expect(result).toEqual(mockDecisions);
    });
  });

  describe('createPersonalDecision', () => {
    it('should create a new personal decision', async () => {
      const collectionId = new ObjectId().toString();
      const userId = new ObjectId().toString();
      const method = 'random';
      const visitDate = new Date();

      const mockInsertOne = jest.fn().mockResolvedValue({
        insertedId: new ObjectId(),
      });

      const mockCollection = {
        insertOne: mockInsertOne,
      };

      mockDb.collection.mockReturnValue(mockCollection);

      const result = await createPersonalDecision(
        collectionId,
        userId,
        method,
        visitDate
      );

      expect(mockInsertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'personal',
          collectionId: new ObjectId(collectionId),
          participants: [new ObjectId(userId)],
          method: 'random',
          status: 'active',
          visitDate,
        })
      );

      expect(result).toMatchObject({
        type: 'personal',
        collectionId: new ObjectId(collectionId),
        participants: [new ObjectId(userId)],
        method: 'random',
        status: 'active',
        visitDate,
      });
    });
  });

  describe('performRandomSelection', () => {
    const mockRestaurants: Restaurant[] = [
      {
        _id: new ObjectId(),
        googlePlaceId: 'test1',
        name: 'Restaurant 1',
        address: '123 Main St',
        coordinates: { lat: 40.7128, lng: -74.006 },
        cuisine: 'Italian',
        rating: 4.5,
        priceRange: '$$',
        timeToPickUp: 30,
        photos: [],
        phoneNumber: '555-1234',
        website: 'https://restaurant1.com',
        hours: {},
        cachedAt: new Date(),
        lastUpdated: new Date(),
      },
      {
        _id: new ObjectId(),
        googlePlaceId: 'test2',
        name: 'Restaurant 2',
        address: '456 Oak Ave',
        coordinates: { lat: 40.7589, lng: -73.9851 },
        cuisine: 'Mexican',
        rating: 4.2,
        priceRange: '$',
        timeToPickUp: 25,
        photos: [],
        phoneNumber: '555-5678',
        website: 'https://restaurant2.com',
        hours: {},
        cachedAt: new Date(),
        lastUpdated: new Date(),
      },
    ];

    beforeEach(() => {
      // Mock getRestaurantsByCollection
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getRestaurantsByCollection } = require('../collections');
      (getRestaurantsByCollection as jest.Mock).mockResolvedValue(
        mockRestaurants
      );
    });

    it('should perform weighted random selection', async () => {
      const collectionId = new ObjectId().toString();
      const userId = new ObjectId().toString();
      const visitDate = new Date();

      const mockCollection = {
        findOne: jest.fn().mockResolvedValue({
          _id: new ObjectId(collectionId),
          restaurantIds: mockRestaurants.map((r) => r._id),
        }),
      };

      const mockDecisionsCollection = {
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      };

      mockDb.collection
        .mockReturnValueOnce(mockCollection) // collections collection
        .mockReturnValueOnce(mockDecisionsCollection); // decisions collection

      const result = await performRandomSelection(
        collectionId,
        userId,
        visitDate
      );

      expect(result).toMatchObject({
        restaurantId: expect.any(ObjectId),
        selectedAt: expect.any(Date),
        reasoning: expect.stringContaining(
          'Selected using weighted random algorithm'
        ),
        weights: expect.any(Object),
      });

      expect(Object.keys(result.weights)).toHaveLength(2);
      expect(mockDecisionsCollection.updateOne).toHaveBeenCalled();
    });

    it('should throw error if collection not found', async () => {
      const collectionId = new ObjectId().toString();
      const userId = new ObjectId().toString();
      const visitDate = new Date();

      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      mockDb.collection.mockReturnValue(mockCollection);

      await expect(
        performRandomSelection(collectionId, userId, visitDate)
      ).rejects.toThrow('Collection not found');
    });

    it('should throw error if no restaurants in collection', async () => {
      const collectionId = new ObjectId().toString();
      const userId = new ObjectId().toString();
      const visitDate = new Date();

      const mockCollection = {
        findOne: jest.fn().mockResolvedValue({
          _id: new ObjectId(collectionId),
          restaurantIds: [],
        }),
      };

      mockDb.collection.mockReturnValue(mockCollection);

      // Mock empty restaurants array
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getRestaurantsByCollection } = require('../collections');
      (getRestaurantsByCollection as jest.Mock).mockResolvedValueOnce([]);

      await expect(
        performRandomSelection(collectionId, userId, visitDate)
      ).rejects.toThrow('No restaurants in collection');
    });
  });

  describe('getDecisionStatistics', () => {
    it('should return decision statistics for collection', async () => {
      const collectionId = new ObjectId().toString();
      const mockRestaurants: Restaurant[] = [
        {
          _id: new ObjectId(),
          googlePlaceId: 'test1',
          name: 'Restaurant 1',
          address: '123 Main St',
          coordinates: { lat: 40.7128, lng: -74.006 },
          cuisine: 'Italian',
          rating: 4.5,
          priceRange: '$$',
          timeToPickUp: 30,
          photos: [],
          phoneNumber: '555-1234',
          website: 'https://restaurant1.com',
          hours: {},
          cachedAt: new Date(),
          lastUpdated: new Date(),
        },
      ];

      const mockDecisions: Decision[] = [
        {
          _id: new ObjectId(),
          type: 'personal',
          collectionId: new ObjectId(collectionId),
          participants: [new ObjectId()],
          method: 'random',
          status: 'completed',
          deadline: new Date(),
          visitDate: new Date(),
          result: {
            restaurantId: mockRestaurants[0]._id,
            selectedAt: new Date(),
            reasoning: 'Test',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock getRestaurantsByCollection
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getRestaurantsByCollection } = require('../collections');
      (getRestaurantsByCollection as jest.Mock).mockResolvedValue(
        mockRestaurants
      );

      // Mock getDecisionHistory
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const decisionsModule = require('../decisions');
      jest
        .spyOn(decisionsModule, 'getDecisionHistory')
        .mockResolvedValue(mockDecisions);

      const result = await getDecisionStatistics(collectionId);

      expect(result).toMatchObject({
        totalDecisions: 1,
        restaurantStats: [
          {
            restaurantId: mockRestaurants[0]._id,
            name: 'Restaurant 1',
            selectionCount: 1,
            lastSelected: expect.any(Date),
            currentWeight: expect.any(Number),
          },
        ],
      });
    });
  });
});
