import { NextRequest } from 'next/server';
import { GET } from '../search/route';
import {
  searchRestaurantsByCoordinates,
  searchRestaurantsByAddress,
} from '@/lib/restaurants';
import { geocodeAddressOptimized } from '@/lib/optimized-google-places';

// Mock dependencies
jest.mock('@/lib/restaurants');
jest.mock('@/lib/optimized-google-places', () => ({
  geocodeAddressOptimized: jest.fn(),
  enrichRestaurantsWithAddresses: jest.fn((restaurants) =>
    Promise.resolve(restaurants)
  ),
}));
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockSearchRestaurantsByCoordinates =
  searchRestaurantsByCoordinates as jest.MockedFunction<
    typeof searchRestaurantsByCoordinates
  >;
const mockSearchRestaurantsByAddress =
  searchRestaurantsByAddress as jest.MockedFunction<
    typeof searchRestaurantsByAddress
  >;
const mockGeocodeAddressOptimized =
  geocodeAddressOptimized as jest.MockedFunction<
    typeof geocodeAddressOptimized
  >;

describe('GET /api/restaurants/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockRestaurants = [
    {
      _id: '507f1f77bcf86cd799439011',
      googlePlaceId: 'place1',
      name: 'Restaurant A',
      address: '123 Main St',
      coordinates: { lat: 40.7128, lng: -74.006 },
      cuisine: 'Italian',
      rating: 4.5,
      distance: 0.5,
    },
    {
      _id: '507f1f77bcf86cd799439012',
      googlePlaceId: 'place2',
      name: 'Restaurant B',
      address: '456 Elm St',
      coordinates: { lat: 40.7129, lng: -74.007 },
      cuisine: 'Japanese',
      rating: 4.7,
      distance: 1.2,
    },
  ];

  describe('Coordinate-based search', () => {
    it('should search by coordinates when lat and lng provided', async () => {
      mockSearchRestaurantsByCoordinates.mockResolvedValue(
        mockRestaurants as any
      );

      const url =
        'http://localhost:3000/api/restaurants/search?lat=40.7128&lng=-74.006';
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.restaurants).toEqual(mockRestaurants);
      expect(data.count).toBe(2);
      expect(data.searchCoordinates).toEqual({ lat: 40.7128, lng: -74.006 });
      expect(mockSearchRestaurantsByCoordinates).toHaveBeenCalledWith(
        40.7128,
        -74.006,
        40234, // 25 miles in meters
        undefined
      );
    });

    it('should pass query parameter for hybrid search', async () => {
      mockSearchRestaurantsByCoordinates.mockResolvedValue(
        mockRestaurants as any
      );

      const url =
        'http://localhost:3000/api/restaurants/search?lat=40.7128&lng=-74.006&q=pizza';
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSearchRestaurantsByCoordinates).toHaveBeenCalledWith(
        40.7128,
        -74.006,
        40234,
        'pizza'
      );
    });

    it('should return 400 for invalid coordinates', async () => {
      const url =
        'http://localhost:3000/api/restaurants/search?lat=invalid&lng=also-invalid';
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid coordinates');
    });
  });

  describe('Location-based search with geocoding', () => {
    it('should geocode address and search restaurants', async () => {
      mockGeocodeAddressOptimized.mockResolvedValue({
        lat: 40.7128,
        lng: -74.006,
      });
      mockSearchRestaurantsByCoordinates.mockResolvedValue(
        mockRestaurants as any
      );
      mockSearchRestaurantsByAddress.mockResolvedValue([] as any); // Mock address search

      const url =
        'http://localhost:3000/api/restaurants/search?location=New+York,+NY';
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.restaurants).toEqual(mockRestaurants);
      expect(mockGeocodeAddressOptimized).toHaveBeenCalledWith('New York, NY');
      expect(mockSearchRestaurantsByCoordinates).toHaveBeenCalledWith(
        40.7128,
        -74.006,
        40234,
        undefined
      );
    });

    it('should handle coordinate-format location strings', async () => {
      mockSearchRestaurantsByCoordinates.mockResolvedValue(
        mockRestaurants as any
      );

      const url =
        'http://localhost:3000/api/restaurants/search?location=40.7128,-74.006';
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockGeocodeAddressOptimized).not.toHaveBeenCalled();
      expect(mockSearchRestaurantsByCoordinates).toHaveBeenCalledWith(
        40.7128,
        -74.006,
        40234,
        undefined
      );
    });

    it('should perform hybrid search with both location and query', async () => {
      mockGeocodeAddressOptimized.mockResolvedValue({
        lat: 40.7128,
        lng: -74.006,
      });
      mockSearchRestaurantsByCoordinates.mockResolvedValue(
        mockRestaurants as any
      );
      mockSearchRestaurantsByAddress.mockResolvedValue([]);

      const url =
        'http://localhost:3000/api/restaurants/search?location=New+York,+NY&q=italian';
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSearchRestaurantsByCoordinates).toHaveBeenCalledWith(
        40.7128,
        -74.006,
        40234,
        'italian'
      );
      expect(mockSearchRestaurantsByAddress).toHaveBeenCalledWith(
        'New York, NY',
        40.7128,
        -74.006
      );
    });

    it('should combine results from coordinate and address search', async () => {
      const coordinateResults = [mockRestaurants[0]];
      const addressResults = [mockRestaurants[1]];

      mockGeocodeAddressOptimized.mockResolvedValue({
        lat: 40.7128,
        lng: -74.006,
      });
      mockSearchRestaurantsByCoordinates.mockResolvedValue(
        coordinateResults as any
      );
      mockSearchRestaurantsByAddress.mockResolvedValue(addressResults as any);

      const url =
        'http://localhost:3000/api/restaurants/search?location=123+Main+St';
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.restaurants).toHaveLength(2);
      expect(data.restaurants).toContainEqual(mockRestaurants[0]);
      expect(data.restaurants).toContainEqual(mockRestaurants[1]);
    });

    it('should deduplicate restaurants by googlePlaceId', async () => {
      const duplicateRestaurant = { ...mockRestaurants[0] };
      const coordinateResults = [mockRestaurants[0]];
      const addressResults = [duplicateRestaurant]; // Same restaurant

      mockGeocodeAddressOptimized.mockResolvedValue({
        lat: 40.7128,
        lng: -74.006,
      });
      mockSearchRestaurantsByCoordinates.mockResolvedValue(
        coordinateResults as any
      );
      mockSearchRestaurantsByAddress.mockResolvedValue(addressResults as any);

      const url =
        'http://localhost:3000/api/restaurants/search?location=123+Main+St';
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.restaurants).toHaveLength(1); // Deduplicated
    });

    it('should return 400 when geocoding fails', async () => {
      mockGeocodeAddressOptimized.mockResolvedValue(null);

      const url =
        'http://localhost:3000/api/restaurants/search?location=invalid-address';
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Could not find coordinates for the provided address'
      );
    });

    it('should handle REQUEST_DENIED geocoding error', async () => {
      mockGeocodeAddressOptimized.mockRejectedValue(
        new Error('REQUEST_DENIED: API key issue')
      );

      const url =
        'http://localhost:3000/api/restaurants/search?location=New+York';
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Google Geocoding API access denied');
      expect(data.details).toContain('API key');
    });
  });

  describe('Error handling', () => {
    it('should return 400 when location parameter is missing', async () => {
      const url = 'http://localhost:3000/api/restaurants/search';
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Location parameter is required');
    });

    it('should handle internal server errors', async () => {
      mockGeocodeAddressOptimized.mockRejectedValue(
        new Error('Database connection failed')
      );
      mockSearchRestaurantsByAddress.mockResolvedValue([] as any);

      const url =
        'http://localhost:3000/api/restaurants/search?location=New+York';
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to geocode address');
    });

    it('should handle search errors gracefully', async () => {
      mockSearchRestaurantsByCoordinates.mockRejectedValue(
        new Error('Search service unavailable')
      );

      const url =
        'http://localhost:3000/api/restaurants/search?lat=40.7128&lng=-74.006';
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Debug logging', () => {
    it('should log search details', async () => {
      mockGeocodeAddressOptimized.mockResolvedValue({
        lat: 40.7128,
        lng: -74.006,
      });
      mockSearchRestaurantsByCoordinates.mockResolvedValue(
        mockRestaurants as any
      );
      mockSearchRestaurantsByAddress.mockResolvedValue([]);

      const consoleSpy = jest.spyOn(console, 'log');

      const url =
        'http://localhost:3000/api/restaurants/search?location=New+York&q=pizza';
      const request = new NextRequest(url);

      await GET(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        '\n=== RESTAURANT SEARCH DEBUG ==='
      );
      expect(consoleSpy).toHaveBeenCalledWith('Search Address:', 'New York');
      expect(consoleSpy).toHaveBeenCalledWith('Query:', 'pizza');
      expect(consoleSpy).toHaveBeenCalledWith('Total Results:', 2);
    });
  });
});
