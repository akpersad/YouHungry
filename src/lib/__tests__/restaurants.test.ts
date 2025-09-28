// Mock dependencies
jest.mock('../google-places');
jest.mock('../db', () => ({
  connectToDatabase: jest.fn(),
}));

import {
  searchRestaurants,
  searchRestaurantsByCoordinates,
  getRestaurantDetails,
  searchRestaurantsWithFilters,
} from '../restaurants';
import * as googlePlaces from '../google-places';
import * as db from '../db';

const mockGooglePlaces = googlePlaces as jest.Mocked<typeof googlePlaces>;
const mockDb = db as jest.Mocked<typeof db>;

// Mock restaurant data
const mockRestaurant = {
  _id: '507f1f77bcf86cd799439011' as unknown as string,
  googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  name: 'Test Restaurant',
  address: '123 Test Street, Test City, TC 12345',
  coordinates: {
    lat: 40.7128,
    lng: -74.006,
  },
  cuisine: 'Italian',
  rating: 4.5,
  priceRange: '$$' as const,
  timeToPickUp: 25,
  photos: ['https://example.com/photo1.jpg'],
  phoneNumber: '+1-555-0123',
  website: 'https://testrestaurant.com',
  hours: {
    Monday: '9:00 AM – 10:00 PM',
  },
  cachedAt: new Date('2024-01-01'),
  lastUpdated: new Date('2024-01-01'),
};

const mockGoogleRestaurant = {
  googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  name: 'Test Restaurant',
  address: '123 Test Street, Test City, TC 12345',
  coordinates: {
    lat: 40.7128,
    lng: -74.006,
  },
  cuisine: 'Italian',
  rating: 4.5,
  priceRange: '$$' as const,
  timeToPickUp: 25,
  photos: ['https://example.com/photo1.jpg'],
  phoneNumber: '+1-555-0123',
  website: 'https://testrestaurant.com',
  hours: {
    Monday: '9:00 AM – 10:00 PM',
  },
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
        mockGoogleRestaurant,
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
        mockGoogleRestaurant,
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
        mockGoogleRestaurant,
      ]);

      // Should not throw error, just log it
      const result = await searchRestaurants('pizza');

      expect(result).toEqual([mockGoogleRestaurant]);
    });
  });

  describe('searchRestaurantsByCoordinates', () => {
    it('should search restaurants by coordinates successfully', async () => {
      mockGooglePlaces.searchRestaurantsByLocationConsistent.mockResolvedValue([
        mockGoogleRestaurant,
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
      mockGooglePlaces.getPlaceDetails.mockResolvedValue(mockGoogleRestaurant);

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
        restaurants
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
        restaurants
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
        restaurants
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
        restaurants
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
        restaurants
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
});
