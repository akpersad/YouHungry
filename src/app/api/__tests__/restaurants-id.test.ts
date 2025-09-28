import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../restaurants/[id]/route';
import {
  getRestaurantDetails,
  updateRestaurant,
  deleteRestaurant,
} from '@/lib/restaurants';

// Mock dependencies
jest.mock('@/lib/restaurants');

const mockGetRestaurantDetails = getRestaurantDetails as jest.MockedFunction<
  typeof getRestaurantDetails
>;
const mockUpdateRestaurant = updateRestaurant as jest.MockedFunction<
  typeof updateRestaurant
>;
const mockDeleteRestaurant = deleteRestaurant as jest.MockedFunction<
  typeof deleteRestaurant
>;

describe('/api/restaurants/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRestaurant = {
    _id: '507f1f77bcf86cd799439013',
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
    cachedAt: '2024-01-01T00:00:00.000Z',
    lastUpdated: '2024-01-01T00:00:00.000Z',
  };

  describe('GET', () => {
    it('should get restaurant details successfully', async () => {
      mockGetRestaurantDetails.mockResolvedValue(mockRestaurant);

      const request = new NextRequest(
        'http://localhost:3000/api/restaurants/507f1f77bcf86cd799439013'
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.restaurant).toEqual(mockRestaurant);
      expect(mockGetRestaurantDetails).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013'
      );
    });

    it('should return 400 when ID is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/restaurants/');
      const response = await GET(request, {
        params: Promise.resolve({ id: '' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Restaurant ID is required');
    });

    it('should return 404 when restaurant not found', async () => {
      mockGetRestaurantDetails.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/restaurants/507f1f77bcf86cd799439013'
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Restaurant not found');
    });

    it('should handle internal server error', async () => {
      mockGetRestaurantDetails.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(
        'http://localhost:3000/api/restaurants/507f1f77bcf86cd799439013'
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('PUT', () => {
    it('should update restaurant successfully', async () => {
      const updatedRestaurant = {
        ...mockRestaurant,
        priceRange: '$$$' as const,
        timeToPickUp: 30,
      };
      mockUpdateRestaurant.mockResolvedValue(updatedRestaurant);

      const request = new NextRequest(
        'http://localhost:3000/api/restaurants/507f1f77bcf86cd799439013',
        {
          method: 'PUT',
          body: JSON.stringify({
            priceRange: '$$$',
            timeToPickUp: 30,
          }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.restaurant).toEqual(updatedRestaurant);
      expect(mockUpdateRestaurant).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        {
          priceRange: '$$$',
          timeToPickUp: 30,
        }
      );
    });

    it('should return 400 when ID is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/restaurants/',
        {
          method: 'PUT',
          body: JSON.stringify({ priceRange: '$$$' }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: '' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Restaurant ID is required');
    });

    it('should return 400 for invalid price range', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/restaurants/507f1f77bcf86cd799439013',
        {
          method: 'PUT',
          body: JSON.stringify({ priceRange: 'invalid' }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        'Invalid price range. Must be $, $$, $$$, or $$$$'
      );
    });

    it('should return 400 for invalid time to pick up', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/restaurants/507f1f77bcf86cd799439013',
        {
          method: 'PUT',
          body: JSON.stringify({ timeToPickUp: -5 }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Time to pick up must be a non-negative number');
    });

    it('should return 404 when restaurant not found', async () => {
      mockUpdateRestaurant.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/restaurants/507f1f77bcf86cd799439013',
        {
          method: 'PUT',
          body: JSON.stringify({ priceRange: '$$$' }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Restaurant not found');
    });

    it('should handle internal server error', async () => {
      mockUpdateRestaurant.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(
        'http://localhost:3000/api/restaurants/507f1f77bcf86cd799439013',
        {
          method: 'PUT',
          body: JSON.stringify({ priceRange: '$$$' }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('DELETE', () => {
    it('should delete restaurant successfully', async () => {
      mockDeleteRestaurant.mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/restaurants/507f1f77bcf86cd799439013?restaurantId=507f1f77bcf86cd799439013',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Restaurant deleted successfully');
      expect(mockDeleteRestaurant).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013'
      );
    });

    it('should return 400 when ID is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/restaurants/',
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
      expect(data.error).toBe('Restaurant ID is required');
    });

    it('should return 400 when restaurant ID is missing from params', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/restaurants/507f1f77bcf86cd799439013',
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
      expect(data.error).toBe('Restaurant ID is required');
    });

    it('should return 404 when restaurant not found', async () => {
      mockDeleteRestaurant.mockResolvedValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/restaurants/507f1f77bcf86cd799439013?restaurantId=507f1f77bcf86cd799439013',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Restaurant not found');
    });

    it('should handle internal server error', async () => {
      mockDeleteRestaurant.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(
        'http://localhost:3000/api/restaurants/507f1f77bcf86cd799439013?restaurantId=507f1f77bcf86cd799439013',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });
});
