import {
  searchRestaurantsWithGooglePlaces,
  getPlaceDetails,
  searchRestaurantsByLocation,
  getCurrentLocation,
} from '../google-places';

// Mock fetch
global.fetch = jest.fn();

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
});
