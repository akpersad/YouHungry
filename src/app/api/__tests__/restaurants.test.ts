import { NextRequest } from 'next/server';
import { POST } from '../restaurants/route';
import { createRestaurant, getRestaurantDetails } from '@/lib/restaurants';
import { addRestaurantToCollection } from '@/lib/collections';

// Mock dependencies
jest.mock('@/lib/restaurants');
jest.mock('@/lib/collections');

const mockCreateRestaurant = createRestaurant as jest.MockedFunction<
  typeof createRestaurant
>;
const mockGetRestaurantDetails = getRestaurantDetails as jest.MockedFunction<
  typeof getRestaurantDetails
>;
const mockAddRestaurantToCollection =
  addRestaurantToCollection as jest.MockedFunction<
    typeof addRestaurantToCollection
  >;

describe('/api/restaurants POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRestaurantData = {
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
  };

  const mockRestaurant = {
    _id: '507f1f77bcf86cd799439013',
    ...mockRestaurantData,
    cachedAt: '2024-01-01T00:00:00.000Z',
    lastUpdated: '2024-01-01T00:00:00.000Z',
  };

  const mockCollection = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Collection',
    restaurantIds: ['507f1f77bcf86cd799439013'],
  };

  it('should add existing restaurant to collection', async () => {
    mockGetRestaurantDetails.mockResolvedValue(mockRestaurant);
    mockAddRestaurantToCollection.mockResolvedValue({
      collection: mockCollection,
      wasAdded: true,
    });

    const request = new NextRequest('http://localhost:3000/api/restaurants', {
      method: 'POST',
      body: JSON.stringify({
        restaurantData: mockRestaurantData,
        collectionId: '507f1f77bcf86cd799439011',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.restaurant).toEqual(mockRestaurant);
    expect(data.collection).toEqual(mockCollection);
    expect(mockGetRestaurantDetails).toHaveBeenCalledWith(
      mockRestaurantData.googlePlaceId
    );
    expect(mockGetRestaurantDetails).toHaveBeenCalledTimes(1);
    expect(mockAddRestaurantToCollection).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      mockRestaurant._id
    );
    expect(mockAddRestaurantToCollection).toHaveBeenCalledTimes(1);
  });

  it('should create new restaurant and add to collection', async () => {
    mockGetRestaurantDetails.mockResolvedValue(null);
    mockCreateRestaurant.mockResolvedValue(mockRestaurant);
    mockAddRestaurantToCollection.mockResolvedValue({
      collection: mockCollection,
      wasAdded: true,
    });

    const request = new NextRequest('http://localhost:3000/api/restaurants', {
      method: 'POST',
      body: JSON.stringify({
        restaurantData: mockRestaurantData,
        collectionId: '507f1f77bcf86cd799439011',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockCreateRestaurant).toHaveBeenCalledWith(mockRestaurantData);
    expect(mockAddRestaurantToCollection).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      mockRestaurant._id
    );
  });

  it('should return 400 when restaurant data is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/restaurants', {
      method: 'POST',
      body: JSON.stringify({
        collectionId: '507f1f77bcf86cd799439011',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Restaurant data is required');
  });

  it('should return 400 when collection ID is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/restaurants', {
      method: 'POST',
      body: JSON.stringify({
        restaurantData: mockRestaurantData,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Collection ID is required');
  });

  it('should return 400 when required restaurant fields are missing', async () => {
    const incompleteRestaurantData = {
      name: 'Test Restaurant',
      // Missing googlePlaceId, address, coordinates, cuisine, rating
    };

    const request = new NextRequest('http://localhost:3000/api/restaurants', {
      method: 'POST',
      body: JSON.stringify({
        restaurantData: incompleteRestaurantData,
        collectionId: '507f1f77bcf86cd799439011',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Missing required restaurant fields');
  });

  it('should return 500 when restaurant creation fails', async () => {
    mockGetRestaurantDetails.mockResolvedValue(null);
    mockCreateRestaurant.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/restaurants', {
      method: 'POST',
      body: JSON.stringify({
        restaurantData: mockRestaurantData,
        collectionId: '507f1f77bcf86cd799439011',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to create restaurant');
  });

  it('should return 500 when restaurant creation returns null', async () => {
    mockGetRestaurantDetails.mockResolvedValue(null);
    mockCreateRestaurant.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/restaurants', {
      method: 'POST',
      body: JSON.stringify({
        restaurantData: mockRestaurantData,
        collectionId: '507f1f77bcf86cd799439011',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to create or find restaurant');
  });

  it('should return 500 when add to collection fails', async () => {
    mockGetRestaurantDetails.mockResolvedValue(mockRestaurant);
    mockAddRestaurantToCollection.mockResolvedValue({
      collection: null,
      wasAdded: false,
    });

    const request = new NextRequest('http://localhost:3000/api/restaurants', {
      method: 'POST',
      body: JSON.stringify({
        restaurantData: mockRestaurantData,
        collectionId: '507f1f77bcf86cd799439011',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to add restaurant to collection');
  });

  it('should return 409 when restaurant already exists in collection', async () => {
    mockGetRestaurantDetails.mockResolvedValue(mockRestaurant);
    mockAddRestaurantToCollection.mockResolvedValue({
      collection: mockCollection,
      wasAdded: false,
    });

    const request = new NextRequest('http://localhost:3000/api/restaurants', {
      method: 'POST',
      body: JSON.stringify({
        restaurantData: mockRestaurantData,
        collectionId: '507f1f77bcf86cd799439011',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Restaurant is already in this collection');
    expect(data.alreadyExists).toBe(true);
  });

  it('should handle internal server error', async () => {
    mockGetRestaurantDetails.mockRejectedValue(new Error('Unexpected error'));

    const request = new NextRequest('http://localhost:3000/api/restaurants', {
      method: 'POST',
      body: JSON.stringify({
        restaurantData: mockRestaurantData,
        collectionId: '507f1f77bcf86cd799439011',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
  });
});
