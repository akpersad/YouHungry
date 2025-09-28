import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '../collections/[id]/restaurants/route';
import {
  getRestaurantsByCollection,
  addRestaurantToCollection,
  removeRestaurantFromCollection,
} from '@/lib/collections';

// Mock dependencies
jest.mock('@/lib/collections', () => ({
  getRestaurantsByCollection: jest.fn(),
  addRestaurantToCollection: jest.fn(),
  removeRestaurantFromCollection: jest.fn(),
}));

const mockGetRestaurantsByCollection =
  getRestaurantsByCollection as jest.MockedFunction<
    typeof getRestaurantsByCollection
  >;
const mockAddRestaurantToCollection =
  addRestaurantToCollection as jest.MockedFunction<
    typeof addRestaurantToCollection
  >;
const mockRemoveRestaurantFromCollection =
  removeRestaurantFromCollection as jest.MockedFunction<
    typeof removeRestaurantFromCollection
  >;

describe('/api/collections/[id]/restaurants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mocks
    mockAddRestaurantToCollection.mockResolvedValue({
      collection: mockCollection,
      wasAdded: true,
    });
    mockRemoveRestaurantFromCollection.mockResolvedValue(mockCollection);
  });

  const mockRestaurants = [
    {
      _id: '507f1f77bcf86cd799439013',
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      name: 'Test Restaurant 1',
      address: '123 Test Street',
      coordinates: { lat: 40.7128, lng: -74.006 },
      cuisine: 'Italian',
      rating: 4.5,
      priceRange: '$$' as const,
      timeToPickUp: 25,
      photos: ['https://example.com/photo1.jpg'],
      cachedAt: '2024-01-01T00:00:00.000Z',
      lastUpdated: '2024-01-01T00:00:00.000Z',
    },
    {
      _id: '507f1f77bcf86cd799439014',
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY5',
      name: 'Test Restaurant 2',
      address: '456 Test Avenue',
      coordinates: { lat: 40.7589, lng: -73.9851 },
      cuisine: 'Mexican',
      rating: 4.2,
      priceRange: '$' as const,
      timeToPickUp: 20,
      photos: ['https://example.com/photo2.jpg'],
      cachedAt: '2024-01-01T00:00:00.000Z',
      lastUpdated: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockCollection = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Collection',
    restaurantIds: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
  };

  describe('GET', () => {
    it('should get restaurants by collection successfully', async () => {
      mockGetRestaurantsByCollection.mockResolvedValue(mockRestaurants);

      const request = new NextRequest(
        'http://localhost:3000/api/collections/507f1f77bcf86cd799439011/restaurants'
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.restaurants).toEqual(mockRestaurants);
      expect(data.count).toBe(2);
      expect(mockGetRestaurantsByCollection).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011'
      );
    });

    it('should return 400 when collection ID is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/collections//restaurants'
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: '' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Collection ID is required');
    });

    it('should handle internal server error', async () => {
      mockGetRestaurantsByCollection.mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/collections/507f1f77bcf86cd799439011/restaurants'
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST', () => {
    it('should add restaurant to collection successfully', async () => {
      mockAddRestaurantToCollection.mockResolvedValue({
        collection: mockCollection,
        wasAdded: true,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/collections/507f1f77bcf86cd799439011/restaurants',
        {
          method: 'POST',
          body: JSON.stringify({
            restaurantId: '507f1f77bcf86cd799439013',
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.collection).toEqual(mockCollection);
      expect(data.message).toBe('Restaurant added to collection successfully');
      expect(mockAddRestaurantToCollection).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439013'
      );
    });

    it('should return 400 when collection ID is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/collections//restaurants',
        {
          method: 'POST',
          body: JSON.stringify({ restaurantId: '507f1f77bcf86cd799439013' }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: '' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Collection ID is required');
    });

    it('should return 400 when restaurant ID is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/collections/507f1f77bcf86cd799439011/restaurants',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Restaurant ID is required');
    });

    it('should return 400 for invalid restaurant ID format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/collections/507f1f77bcf86cd799439011/restaurants',
        {
          method: 'POST',
          body: JSON.stringify({ restaurantId: 'invalid-id' }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid restaurant ID format');
    });

    it('should return 404 when collection not found', async () => {
      mockAddRestaurantToCollection.mockResolvedValue({
        collection: null,
        wasAdded: false,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/collections/507f1f77bcf86cd799439011/restaurants',
        {
          method: 'POST',
          body: JSON.stringify({ restaurantId: '507f1f77bcf86cd799439013' }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Collection not found');
    });

    it('should handle internal server error', async () => {
      mockAddRestaurantToCollection.mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/collections/507f1f77bcf86cd799439011/restaurants',
        {
          method: 'POST',
          body: JSON.stringify({ restaurantId: '507f1f77bcf86cd799439013' }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('DELETE', () => {
    it('should remove restaurant from collection successfully', async () => {
      mockRemoveRestaurantFromCollection.mockResolvedValue(mockCollection);

      const request = new NextRequest(
        'http://localhost:3000/api/collections/507f1f77bcf86cd799439011/restaurants?restaurantId=507f1f77bcf86cd799439013',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.collection).toEqual(mockCollection);
      expect(data.message).toBe(
        'Restaurant removed from collection successfully'
      );
      expect(mockRemoveRestaurantFromCollection).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439013'
      );
    });

    it('should return 400 when collection ID is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/collections//restaurants?restaurantId=507f1f77bcf86cd799439013',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: '' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Collection ID is required');
    });

    it('should return 400 when restaurant ID is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/collections/507f1f77bcf86cd799439011/restaurants',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Restaurant ID is required');
    });

    it('should return 400 for invalid restaurant ID format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/collections/507f1f77bcf86cd799439011/restaurants?restaurantId=invalid-id',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid restaurant ID format');
    });

    it('should return 404 when collection not found', async () => {
      mockRemoveRestaurantFromCollection.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/collections/507f1f77bcf86cd799439011/restaurants?restaurantId=507f1f77bcf86cd799439013',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Collection not found');
    });

    it('should handle internal server error', async () => {
      mockRemoveRestaurantFromCollection.mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/collections/507f1f77bcf86cd799439011/restaurants?restaurantId=507f1f77bcf86cd799439013',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });
});
