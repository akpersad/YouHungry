// Mock dependencies
jest.mock('../google-places');
jest.mock('../db', () => ({
  connectToDatabase: jest.fn(),
}));

import {
  searchRestaurants,
  searchRestaurantsByCoordinates,
  searchRestaurantsByAddress,
  getRestaurantDetails,
  searchRestaurantsWithFilters,
} from '../restaurants';
import * as googlePlaces from '../google-places';
import * as db from '../db';
import { mockRestaurant } from '@/test-utils/mockData';

const mockGooglePlaces = googlePlaces as jest.Mocked<typeof googlePlaces>;
const mockDb = db as jest.Mocked<typeof db>;

// Use centralized mock data
const mockGoogleRestaurant = {
  googlePlaceId: mockRestaurant.googlePlaceId,
  name: mockRestaurant.name,
  address: mockRestaurant.address,
  coordinates: mockRestaurant.coordinates,
  cuisine: mockRestaurant.cuisine,
  rating: mockRestaurant.rating,
  priceRange: mockRestaurant.priceRange,
  timeToPickUp: mockRestaurant.timeToPickUp,
  photos: mockRestaurant.photos,
  phoneNumber: mockRestaurant.phoneNumber,
  website: mockRestaurant.website,
  hours: mockRestaurant.hours,
};

describe('Restaurant API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchRestaurants', () => {
    it('should search restaurants using Google Places API successfully', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-id' }),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );
      mockGooglePlaces.searchRestaurantsWithGooglePlaces.mockResolvedValue([
        mockGoogleRestaurant as any,
      ]);

      const result = await searchRestaurants('pizza', 'New York');

      expect(
        mockGooglePlaces.searchRestaurantsWithGooglePlaces
      ).toHaveBeenCalledWith('pizza', 'New York');
      expect(result).toEqual([
        {
          ...mockGoogleRestaurant,
          _id: 'new-id',
          cachedAt: expect.any(Date),
          lastUpdated: expect.any(Date),
        },
      ]);
    });

    it('should not create restaurant if it already exists in database', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockRestaurant),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );
      mockGooglePlaces.searchRestaurantsWithGooglePlaces.mockResolvedValue([
        mockGoogleRestaurant as any,
      ]);

      const result = await searchRestaurants('pizza');

      expect(result).toEqual([mockRestaurant]);
    });

    it('should fallback to local search when Google Places API fails', async () => {
      const mockDbRestaurants = [mockRestaurant];
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockDbRestaurants),
            }),
          }),
        }),
      };

      mockGooglePlaces.searchRestaurantsWithGooglePlaces.mockRejectedValue(
        new Error('API Error')
      );
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await searchRestaurants('pizza');

      expect(mockDb.connectToDatabase).toHaveBeenCalled();
      expect(result).toEqual(mockDbRestaurants);
    });

    it('should handle errors when storing restaurants', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockRejectedValue(new Error('DB Error')),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );
      mockGooglePlaces.searchRestaurantsWithGooglePlaces.mockResolvedValue([
        mockGoogleRestaurant as any,
      ]);

      // Should not throw error, just log it
      const result = await searchRestaurants('pizza');

      expect(result).toEqual([mockGoogleRestaurant]);
    });
  });

  describe('searchRestaurantsByCoordinates', () => {
    it('should search restaurants by coordinates successfully', async () => {
      mockGooglePlaces.searchRestaurantsByLocationConsistent.mockResolvedValue([
        mockGoogleRestaurant as any,
      ]);

      const result = await searchRestaurantsByCoordinates(
        40.7128,
        -74.006,
        5000
      );

      expect(
        mockGooglePlaces.searchRestaurantsByLocationConsistent
      ).toHaveBeenCalledWith(40.7128, -74.006, 5000);
      expect(result).toEqual([mockGoogleRestaurant]);
    });

    it('should return empty array when search fails', async () => {
      mockGooglePlaces.searchRestaurantsByLocationConsistent.mockRejectedValue(
        new Error('Search failed')
      );

      const result = await searchRestaurantsByCoordinates(40.7128, -74.006);

      expect(result).toEqual([]);
    });
  });

  describe('getRestaurantDetails', () => {
    it('should return existing restaurant from database', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockRestaurant),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );

      const result = await getRestaurantDetails('ChIJN1t_tDeuEmsRUsoyG83frY4');

      expect(mockDb.connectToDatabase).toHaveBeenCalled();
      expect(result).toEqual(mockRestaurant);
    });

    it('should fetch from Google Places API when not in database', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-id' }),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );
      mockGooglePlaces.getPlaceDetails.mockResolvedValue(
        mockGoogleRestaurant as any
      );

      const result = await getRestaurantDetails('ChIJN1t_tDeuEmsRUsoyG83frY4');

      expect(mockGooglePlaces.getPlaceDetails).toHaveBeenCalledWith(
        'ChIJN1t_tDeuEmsRUsoyG83frY4'
      );
      expect(result).toEqual(mockGoogleRestaurant);
    });

    it('should return null when Google Places API fails', async () => {
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );
      mockGooglePlaces.getPlaceDetails.mockResolvedValue(null);

      const result = await getRestaurantDetails('invalid-id');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockDb.connectToDatabase.mockRejectedValue(new Error('DB Error'));

      const result = await getRestaurantDetails('ChIJN1t_tDeuEmsRUsoyG83frY4');

      expect(result).toBeNull();
    });
  });

  describe('searchRestaurantsWithFilters', () => {
    it('should filter restaurants by cuisine', async () => {
      const restaurants = [
        { ...mockRestaurant, cuisine: 'Italian' },
        {
          ...mockRestaurant,
          cuisine: 'Chinese',
          _id: '507f1f77bcf86cd799439012' as unknown as string,
        },
      ];

      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-id' }),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );
      mockGooglePlaces.searchRestaurantsWithGooglePlaces.mockResolvedValue(
        restaurants as any
      );

      const result = await searchRestaurantsWithFilters(
        'restaurant',
        undefined,
        {
          cuisine: 'Italian',
        }
      );

      expect(result).toHaveLength(1);
      expect(result[0].cuisine).toBe('Italian');
    });

    it('should filter restaurants by minimum rating', async () => {
      const restaurants = [
        { ...mockRestaurant, rating: 4.5 },
        {
          ...mockRestaurant,
          rating: 3.0,
          _id: '507f1f77bcf86cd799439012' as unknown as string,
        },
      ];

      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-id' }),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );
      mockGooglePlaces.searchRestaurantsWithGooglePlaces.mockResolvedValue(
        restaurants as any
      );

      const result = await searchRestaurantsWithFilters(
        'restaurant',
        undefined,
        {
          minRating: 4.0,
        }
      );

      expect(result).toHaveLength(1);
      expect(result[0].rating).toBe(4.5);
    });

    it('should filter restaurants by price range', async () => {
      const restaurants = [
        { ...mockRestaurant, priceRange: '$' as const },
        {
          ...mockRestaurant,
          priceRange: '$$' as const,
          _id: '507f1f77bcf86cd799439012' as unknown as string,
        },
        {
          ...mockRestaurant,
          priceRange: '$$$' as const,
          _id: '507f1f77bcf86cd799439013' as unknown as string,
        },
      ];

      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-id' }),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );
      mockGooglePlaces.searchRestaurantsWithGooglePlaces.mockResolvedValue(
        restaurants as any
      );

      const result = await searchRestaurantsWithFilters(
        'restaurant',
        undefined,
        {
          minPrice: 2,
          maxPrice: 2,
        }
      );

      expect(result).toHaveLength(1);
      expect(result[0].priceRange).toBe('$$');
    });

    it('should return all restaurants when no filters applied', async () => {
      const restaurants = [mockGoogleRestaurant];
      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-id' }),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );
      mockGooglePlaces.searchRestaurantsWithGooglePlaces.mockResolvedValue(
        restaurants as any
      );

      const result = await searchRestaurantsWithFilters('restaurant');

      expect(result).toEqual([
        {
          ...mockGoogleRestaurant,
          _id: 'new-id',
          cachedAt: expect.any(Date),
          lastUpdated: expect.any(Date),
        },
      ]);
    });

    it('should handle restaurants without price range', async () => {
      const restaurants = [
        { ...mockRestaurant, priceRange: undefined },
        {
          ...mockRestaurant,
          priceRange: '$$' as const,
          _id: '507f1f77bcf86cd799439012' as unknown as string,
        },
      ];

      const mockDbInstance = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-id' }),
        }),
      };
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );
      mockGooglePlaces.searchRestaurantsWithGooglePlaces.mockResolvedValue(
        restaurants as any
      );

      const result = await searchRestaurantsWithFilters(
        'restaurant',
        undefined,
        {
          minPrice: 1,
        }
      );

      expect(result).toHaveLength(1);
      expect(result[0].priceRange).toBe('$$');
    });
  });

  describe('searchRestaurantsByAddress (Hybrid Search)', () => {
    const mockDbInstance = {
      collection: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-id' }),
      }),
    };

    beforeEach(() => {
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );
    });

    it('should search restaurants by specific address', async () => {
      const addressRestaurants = [
        {
          ...mockGoogleRestaurant,
          name: 'Address Restaurant',
          googlePlaceId: 'address-place-1',
        },
      ];

      mockGooglePlaces.searchRestaurantsWithGooglePlaces
        .mockResolvedValueOnce(addressRestaurants as any)
        .mockResolvedValueOnce([] as any);

      const result = await searchRestaurantsByAddress(
        '123 Main St',
        40.7128,
        -74.006
      );

      expect(
        mockGooglePlaces.searchRestaurantsWithGooglePlaces
      ).toHaveBeenCalledTimes(2);
      expect(
        mockGooglePlaces.searchRestaurantsWithGooglePlaces
      ).toHaveBeenCalledWith(
        'restaurants near 123 Main St',
        '40.7128,-74.006',
        1000
      );
      expect(
        mockGooglePlaces.searchRestaurantsWithGooglePlaces
      ).toHaveBeenCalledWith('123 Main St', '40.7128,-74.006', 1000);
      expect(result).toHaveLength(1);
    });

    it('should combine and deduplicate results from both searches', async () => {
      const nearbyRestaurants = [
        {
          ...mockGoogleRestaurant,
          name: 'Nearby Restaurant',
          googlePlaceId: 'nearby-1',
        },
      ];

      const exactAddressRestaurants = [
        {
          ...mockGoogleRestaurant,
          name: 'Address Restaurant',
          googlePlaceId: 'address-1',
        },
        {
          ...mockGoogleRestaurant,
          name: 'Nearby Restaurant', // Duplicate
          googlePlaceId: 'nearby-1',
        },
      ];

      mockGooglePlaces.searchRestaurantsWithGooglePlaces
        .mockResolvedValueOnce(nearbyRestaurants as any)
        .mockResolvedValueOnce(exactAddressRestaurants as any);

      const result = await searchRestaurantsByAddress(
        '456 Elm St',
        40.7129,
        -74.007
      );

      expect(result).toHaveLength(2); // Deduplicated
      expect(result.some((r) => r.googlePlaceId === 'nearby-1')).toBe(true);
      expect(result.some((r) => r.googlePlaceId === 'address-1')).toBe(true);
    });

    it('should calculate distances for all restaurants', async () => {
      const restaurants = [
        {
          ...mockGoogleRestaurant,
          coordinates: { lat: 40.7128, lng: -74.006 },
        },
      ];

      mockGooglePlaces.searchRestaurantsWithGooglePlaces
        .mockResolvedValueOnce(restaurants as any)
        .mockResolvedValueOnce([] as any);

      const result = await searchRestaurantsByAddress(
        '789 Oak Ave',
        40.7128,
        -74.006
      );

      expect(result[0].distance).toBeDefined();
      expect(typeof result[0].distance).toBe('number');
    });

    it('should store new restaurants in database', async () => {
      const newRestaurant = {
        ...mockGoogleRestaurant,
        googlePlaceId: 'new-place-id',
      };

      mockGooglePlaces.searchRestaurantsWithGooglePlaces
        .mockResolvedValueOnce([newRestaurant] as any)
        .mockResolvedValueOnce([] as any);

      await searchRestaurantsByAddress('321 Pine St', 40.713, -74.008);

      expect(mockDbInstance.collection().findOne).toHaveBeenCalled();
      expect(mockDbInstance.collection().insertOne).toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      mockGooglePlaces.searchRestaurantsWithGooglePlaces.mockRejectedValue(
        new Error('API Error')
      );

      const result = await searchRestaurantsByAddress(
        'Invalid Address',
        40.7131,
        -74.009
      );

      expect(result).toEqual([]);
    });
  });

  describe('searchRestaurantsByCoordinates with query (Hybrid)', () => {
    const mockDbInstance = {
      collection: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-id' }),
      }),
    };

    beforeEach(() => {
      mockDb.connectToDatabase.mockResolvedValue(
        mockDbInstance as unknown as ReturnType<typeof db.connectToDatabase>
      );
      // Mock enrichRestaurantsWithAddresses
      jest.doMock('../optimized-google-places', () => ({
        enrichRestaurantsWithAddresses: jest.fn((restaurants) =>
          Promise.resolve(restaurants)
        ),
      }));
    });

    it('should use location-only cache when no query provided', async () => {
      const restaurants = [mockGoogleRestaurant];
      mockGooglePlaces.searchRestaurantsByLocationConsistent.mockResolvedValue(
        restaurants as any
      );

      const result = await searchRestaurantsByCoordinates(
        40.7128,
        -74.006,
        5000
      );

      expect(
        mockGooglePlaces.searchRestaurantsByLocationConsistent
      ).toHaveBeenCalledWith(40.7128, -74.006, 5000);
      expect(
        mockGooglePlaces.searchRestaurantsByLocationAndQuery
      ).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should use location+query cache when query provided', async () => {
      const restaurants = [mockGoogleRestaurant];
      mockGooglePlaces.searchRestaurantsByLocationAndQuery.mockResolvedValue(
        restaurants as any
      );

      const result = await searchRestaurantsByCoordinates(
        40.7128,
        -74.006,
        5000,
        'pizza'
      );

      expect(
        mockGooglePlaces.searchRestaurantsByLocationAndQuery
      ).toHaveBeenCalledWith(40.7128, -74.006, 'pizza', 5000);
      expect(
        mockGooglePlaces.searchRestaurantsByLocationConsistent
      ).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should preserve distance information from API', async () => {
      const restaurantWithDistance = {
        ...mockGoogleRestaurant,
        distance: 1.5,
      };
      mockGooglePlaces.searchRestaurantsByLocationConsistent.mockResolvedValue([
        restaurantWithDistance,
      ] as any);

      const result = await searchRestaurantsByCoordinates(40.7128, -74.006);

      expect(result[0].distance).toBe(1.5);
    });

    it('should return empty array on error', async () => {
      mockGooglePlaces.searchRestaurantsByLocationConsistent.mockRejectedValue(
        new Error('API Error')
      );

      const result = await searchRestaurantsByCoordinates(40.7128, -74.006);

      expect(result).toEqual([]);
    });
  });
});
