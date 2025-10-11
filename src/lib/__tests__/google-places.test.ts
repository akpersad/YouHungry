import {
  searchRestaurantsWithGooglePlaces,
  getPlaceDetails,
  searchRestaurantsByLocation,
  getCurrentLocation,
  searchRestaurantsByLocationConsistent,
  searchRestaurantsByLocationAndQuery,
  clearLocationCache,
  getLocationCacheStats,
} from '../google-places';
import { connectToDatabase } from '../db';

// Mock fetch
global.fetch = jest.fn();

// Mock database
jest.mock('../db', () => ({
  connectToDatabase: jest.fn(),
}));

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock environment variables
process.env.GOOGLE_PLACES_API_KEY = 'test-api-key';

describe('Google Places API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('searchRestaurantsWithGooglePlaces', () => {
    it('should search restaurants successfully', async () => {
      const mockResponse = {
        results: [
          {
            place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
            name: 'Test Restaurant',
            formatted_address: '123 Test Street, Test City, TC 12345',
            geometry: {
              location: {
                lat: 40.7128,
                lng: -74.006,
              },
            },
            types: ['restaurant', 'food', 'establishment'],
            rating: 4.5,
            price_level: 2,
            photos: [
              {
                photo_reference: 'test-photo-ref',
                height: 400,
                width: 400,
              },
            ],
            formatted_phone_number: '+1-555-0123',
            website: 'https://testrestaurant.com',
            opening_hours: {
              weekday_text: [
                'Monday: 9:00 AM – 10:00 PM',
                'Tuesday: 9:00 AM – 10:00 PM',
              ],
            },
          },
        ],
        status: 'OK',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchRestaurantsWithGooglePlaces(
        'pizza',
        'New York'
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://maps.googleapis.com/maps/api/place/textsearch/json'
        )
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('query=pizza')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('location=New+York')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('key=test-api-key')
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        name: 'Test Restaurant',
        address: '123 Test Street, Test City, TC 12345',
        coordinates: {
          lat: 40.7128,
          lng: -74.006,
        },
        cuisine: 'Restaurant',
        rating: 4.5,
        priceRange: '$$$',
        photos: [
          'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=test-photo-ref&key=test-api-key',
        ],
        phoneNumber: '+1-555-0123',
        website: 'https://testrestaurant.com',
        hours: {
          Monday: 'Monday: 9:00 AM – 10:00 PM',
          Tuesday: 'Tuesday: 9:00 AM – 10:00 PM',
        },
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(searchRestaurantsWithGooglePlaces('pizza')).rejects.toThrow(
        'Google Places API error: 400'
      );
    });

    it('should handle API response errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'INVALID_REQUEST',
        }),
      });

      await expect(searchRestaurantsWithGooglePlaces('pizza')).rejects.toThrow(
        'Google Places API error: INVALID_REQUEST'
      );
    });

    it('should throw error when API key is not configured', async () => {
      delete process.env.GOOGLE_PLACES_API_KEY;

      await expect(searchRestaurantsWithGooglePlaces('pizza')).rejects.toThrow(
        'Google Places API key not configured'
      );

      // Restore API key
      process.env.GOOGLE_PLACES_API_KEY = 'test-api-key';
    });

    it('should handle ZERO_RESULTS status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          status: 'ZERO_RESULTS',
        }),
      });

      const result = await searchRestaurantsWithGooglePlaces('nonexistent');

      expect(result).toHaveLength(0);
    });
  });

  describe('getPlaceDetails', () => {
    it('should get place details successfully', async () => {
      const mockResponse = {
        result: {
          place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
          name: 'Test Restaurant',
          formatted_address: '123 Test Street, Test City, TC 12345',
          geometry: {
            location: {
              lat: 40.7128,
              lng: -74.006,
            },
          },
          types: ['restaurant', 'food', 'establishment'],
          rating: 4.5,
          price_level: 2,
          photos: [
            {
              photo_reference: 'test-photo-ref',
              height: 400,
              width: 400,
            },
          ],
          formatted_phone_number: '+1-555-0123',
          website: 'https://testrestaurant.com',
          opening_hours: {
            weekday_text: ['Monday: 9:00 AM – 10:00 PM'],
          },
        },
        status: 'OK',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getPlaceDetails('ChIJN1t_tDeuEmsRUsoyG83frY4');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://maps.googleapis.com/maps/api/place/details/json'
        )
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('place_id=ChIJN1t_tDeuEmsRUsoyG83frY4')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('key=test-api-key')
      );

      expect(result).toMatchObject({
        googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        name: 'Test Restaurant',
        address: '123 Test Street, Test City, TC 12345',
        coordinates: {
          lat: 40.7128,
          lng: -74.006,
        },
        cuisine: 'Restaurant',
        rating: 4.5,
        priceRange: '$$$',
      });
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getPlaceDetails('invalid-id')).rejects.toThrow(
        'Google Places API error: 500'
      );
    });
  });

  describe('searchRestaurantsByLocation', () => {
    it('should search restaurants by location successfully', async () => {
      const mockResponse = {
        results: [
          {
            place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
            name: 'Test Restaurant',
            formatted_address: '123 Test Street, Test City, TC 12345',
            geometry: {
              location: {
                lat: 40.7128,
                lng: -74.006,
              },
            },
            types: ['restaurant', 'food', 'establishment'],
            rating: 4.5,
            price_level: 2,
          },
        ],
        status: 'OK',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchRestaurantsByLocation(40.7128, -74.006, 1000);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
        )
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('location=40.7128%2C-74.006')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('radius=1000')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=restaurant')
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        name: 'Test Restaurant',
        address: '123 Test Street, Test City, TC 12345',
        coordinates: {
          lat: 40.7128,
          lng: -74.006,
        },
        cuisine: 'Restaurant',
        rating: 4.5,
        priceRange: '$$$',
      });
    });

    it('should handle errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await searchRestaurantsByLocation(40.7128, -74.006);

      expect(result).toHaveLength(0);
    });
  });

  describe('getCurrentLocation', () => {
    it('should get current location successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const result = await getCurrentLocation();

      expect(result).toEqual({
        lat: 40.7128,
        lng: -74.006,
      });
    });

    it('should handle geolocation errors', async () => {
      const mockError = new Error('Geolocation error');
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success, error) => {
          error(mockError);
        }
      );

      await expect(getCurrentLocation()).rejects.toThrow('Geolocation error');
    });

    it('should handle geolocation not supported', async () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      await expect(getCurrentLocation()).rejects.toThrow(
        'Geolocation is not supported by this browser'
      );

      // Restore geolocation
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      });
    });
  });

  describe('convertGooglePlaceToRestaurant', () => {
    it('should convert Google Place result to Restaurant format correctly', async () => {
      const mockResponse = {
        results: [
          {
            place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
            name: 'Italian Restaurant',
            formatted_address: '123 Test Street, Test City, TC 12345',
            geometry: {
              location: {
                lat: 40.7128,
                lng: -74.006,
              },
            },
            types: ['italian_restaurant', 'food', 'establishment'],
            rating: 4.5,
            price_level: 3,
            photos: [
              {
                photo_reference: 'test-photo-ref',
                height: 400,
                width: 400,
              },
            ],
            formatted_phone_number: '+1-555-0123',
            website: 'https://testrestaurant.com',
            opening_hours: {
              weekday_text: [
                'Monday: 9:00 AM – 10:00 PM',
                'Tuesday: 9:00 AM – 10:00 PM',
                'Wednesday: 9:00 AM – 10:00 PM',
                'Thursday: 9:00 AM – 10:00 PM',
                'Friday: 9:00 AM – 10:00 PM',
                'Saturday: 9:00 AM – 10:00 PM',
                'Sunday: 9:00 AM – 10:00 PM',
              ],
            },
          },
        ],
        status: 'OK',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchRestaurantsWithGooglePlaces('italian');

      expect(result[0].cuisine).toBe('Italian');
      expect(result[0].priceRange).toBe('$$$$');
      expect(result[0].hours).toHaveProperty('Monday');
      expect(result[0].hours).toHaveProperty('Tuesday');
      expect(result[0].hours).toHaveProperty('Wednesday');
    });
  });

  describe('Location Caching', () => {
    const mockDb = {
      collection: jest.fn(),
    };

    const mockCollection = {
      findOne: jest.fn(),
      replaceOne: jest.fn(),
      deleteMany: jest.fn(),
      countDocuments: jest.fn(),
      find: jest.fn(),
    };

    beforeEach(() => {
      (connectToDatabase as jest.Mock).mockResolvedValue(mockDb);
      mockDb.collection.mockReturnValue(mockCollection);
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([]),
          }),
        }),
        toArray: jest.fn().mockResolvedValue([]),
      });
    });

    describe('searchRestaurantsByLocationConsistent', () => {
      it('should use cached results when available', async () => {
        const cachedRestaurants = [
          {
            googlePlaceId: 'cached1',
            name: 'Cached Restaurant',
            address: '123 Cache St',
            coordinates: { lat: 40.7128, lng: -74.006 },
            cuisine: 'Italian',
            rating: 4.5,
          },
        ];

        mockCollection.findOne.mockResolvedValue({
          locationKey: '40.7128,-74.0060',
          restaurants: cachedRestaurants,
          cachedAt: new Date(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        });

        const result = await searchRestaurantsByLocationConsistent(
          40.7128,
          -74.006,
          5000
        );

        expect(mockCollection.findOne).toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          name: 'Cached Restaurant',
          distance: expect.any(Number),
        });
      });

      it('should fetch from API and cache when no cached results', async () => {
        mockCollection.findOne.mockResolvedValue(null);

        const mockApiResponse = {
          results: [
            {
              place_id: 'place1',
              name: 'Fresh Restaurant',
              formatted_address: '456 Fresh St',
              geometry: { location: { lat: 40.7129, lng: -74.007 } },
              types: ['restaurant'],
              rating: 4.7,
            },
          ],
          status: 'OK',
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockApiResponse,
        });

        const result = await searchRestaurantsByLocationConsistent(
          40.7128,
          -74.006,
          5000
        );

        expect(mockCollection.findOne).toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalled();
        expect(mockCollection.replaceOne).toHaveBeenCalled();
        expect(result).toHaveLength(1);
      });

      it('should always fetch 25 miles regardless of requested radius', async () => {
        mockCollection.findOne.mockResolvedValue(null);

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => ({ results: [], status: 'OK' }),
        });

        await searchRestaurantsByLocationConsistent(40.7128, -74.006, 5000);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('radius=40234')
        );
      });
    });

    describe('searchRestaurantsByLocationAndQuery', () => {
      it('should cache results with query in key', async () => {
        mockCollection.findOne.mockResolvedValue(null);

        const mockApiResponse = {
          results: [
            {
              place_id: 'place1',
              name: 'Pizza Place',
              formatted_address: '789 Pizza Ave',
              geometry: { location: { lat: 40.713, lng: -74.008 } },
              types: ['restaurant'],
              rating: 4.8,
            },
          ],
          status: 'OK',
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockApiResponse,
        });

        await searchRestaurantsByLocationAndQuery(40.7128, -74.006, 'pizza');

        expect(mockCollection.replaceOne).toHaveBeenCalledWith(
          { locationKey: expect.stringContaining(':pizza') },
          expect.objectContaining({
            query: 'pizza',
            restaurants: expect.any(Array),
          }),
          { upsert: true }
        );
      });

      it('should use cached results for location+query combination', async () => {
        const cachedRestaurants = [
          {
            googlePlaceId: 'pizza1',
            name: 'Cached Pizza',
            address: '123 Pizza St',
            coordinates: { lat: 40.7128, lng: -74.006 },
            cuisine: 'Italian',
            rating: 4.5,
          },
        ];

        mockCollection.findOne.mockResolvedValue({
          locationKey: '40.7128,-74.0060:pizza',
          query: 'pizza',
          restaurants: cachedRestaurants,
          cachedAt: new Date(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        });

        const result = await searchRestaurantsByLocationAndQuery(
          40.7128,
          -74.006,
          'pizza'
        );

        expect(mockCollection.findOne).toHaveBeenCalledWith({
          locationKey: expect.stringContaining(':pizza'),
          expiresAt: { $gt: expect.any(Date) },
        });
        expect(global.fetch).not.toHaveBeenCalled();
        expect(result).toHaveLength(1);
      });
    });

    describe('clearLocationCache', () => {
      it('should clear all caches when no coordinates provided', async () => {
        mockCollection.deleteMany.mockResolvedValue({ deletedCount: 25 });

        const count = await clearLocationCache();

        expect(mockCollection.deleteMany).toHaveBeenCalledWith({});
        expect(count).toBe(25);
      });

      it('should clear specific location cache when coordinates provided', async () => {
        mockCollection.deleteMany.mockResolvedValue({ deletedCount: 5 });

        const count = await clearLocationCache(40.7128, -74.006);

        expect(mockCollection.deleteMany).toHaveBeenCalledWith({
          locationKey: { $regex: expect.stringContaining('40.7128,-74.0060') },
        });
        expect(count).toBe(5);
      });

      it('should clear both location-only and location+query caches', async () => {
        mockCollection.deleteMany.mockResolvedValue({ deletedCount: 10 });

        await clearLocationCache(40.7128, -74.006);

        const regex =
          mockCollection.deleteMany.mock.calls[0][0].locationKey.$regex;
        expect(regex).toContain('40.7128,-74.0060');
      });
    });

    describe('getLocationCacheStats', () => {
      it('should return cache statistics', async () => {
        mockCollection.countDocuments
          .mockResolvedValueOnce(15) // total
          .mockResolvedValueOnce(10) // location-only
          .mockResolvedValueOnce(5); // location+query

        mockCollection.find.mockReturnValueOnce({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          toArray: jest
            .fn()
            .mockResolvedValue([{ cachedAt: new Date('2024-01-01') }]),
        });

        mockCollection.find.mockReturnValueOnce({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          toArray: jest
            .fn()
            .mockResolvedValue([{ cachedAt: new Date('2024-01-15') }]),
        });

        mockCollection.find.mockReturnValueOnce({
          toArray: jest.fn().mockResolvedValue([
            { restaurants: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, // 9 restaurants
            { restaurants: [1, 2, 3, 4, 5, 6] }, // 6 restaurants
            {
              restaurants: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            }, // 15 restaurants
          ]),
        });

        const stats = await getLocationCacheStats();

        expect(stats.totalEntries).toBe(15);
        expect(stats.locationOnlyEntries).toBe(10);
        expect(stats.locationQueryEntries).toBe(5);
        // (9+6+15)/15 = 2 restaurants per entry on average
        expect(stats.averageRestaurantsPerEntry).toBe(2);
        expect(stats.estimatedSizeKB).toBe(60); // 30 restaurants * 2KB
      });

      it('should handle empty cache gracefully', async () => {
        mockCollection.countDocuments.mockResolvedValue(0);
        mockCollection.find.mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          toArray: jest.fn().mockResolvedValue([]),
        });

        const stats = await getLocationCacheStats();

        expect(stats.totalEntries).toBe(0);
        expect(stats.averageRestaurantsPerEntry).toBe(0);
        expect(stats.estimatedSizeKB).toBe(0);
      });

      it('should handle errors gracefully', async () => {
        mockCollection.countDocuments.mockRejectedValue(new Error('DB Error'));

        const stats = await getLocationCacheStats();

        expect(stats.totalEntries).toBe(0);
        expect(stats.locationOnlyEntries).toBe(0);
        expect(stats.locationQueryEntries).toBe(0);
      });
    });
  });
});
