/**
 * Centralized Mock Data for Tests
 *
 * This file contains all the mock data used across test files to ensure
 * consistency and reduce duplication. All mock data follows the actual
 * database schema and API response formats.
 */

import {
  Restaurant,
  Collection,
  User,
  Group,
  Decision,
  FriendRequest,
} from '@/types/database';

// ============================================================================
// RESTAURANT MOCK DATA
// ============================================================================

export const mockRestaurant: Restaurant = {
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
    Tuesday: '9:00 AM – 10:00 PM',
    Wednesday: '9:00 AM – 10:00 PM',
  },
  cachedAt: new Date('2024-01-01T00:00:00.000Z'),
  lastUpdated: new Date('2024-01-01T00:00:00.000Z'),
};

export const mockRestaurant2: Restaurant = {
  _id: '507f1f77bcf86cd799439012' as unknown as string,
  googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY5',
  name: 'Test Restaurant 2',
  address: '456 Test Avenue, Test City, TC 12345',
  coordinates: {
    lat: 40.7589,
    lng: -73.9851,
  },
  cuisine: 'Mexican',
  rating: 4.2,
  priceRange: '$' as const,
  timeToPickUp: 20,
  photos: ['https://example.com/photo2.jpg'],
  phoneNumber: '+1-555-0456',
  website: 'https://testrestaurant2.com',
  hours: {
    Monday: '10:00 AM – 9:00 PM',
    Tuesday: '10:00 AM – 9:00 PM',
  },
  cachedAt: new Date('2024-01-01T00:00:00.000Z'),
  lastUpdated: new Date('2024-01-01T00:00:00.000Z'),
};

export const mockRestaurants: Restaurant[] = [mockRestaurant, mockRestaurant2];

// ============================================================================
// USER MOCK DATA
// ============================================================================

export const mockUser: User = {
  _id: '507f1f77bcf86cd799439013' as unknown as string,
  clerkId: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
  profilePicture: 'https://example.com/avatar.jpg',
  city: 'Test City',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const mockUser2: User = {
  _id: '507f1f77bcf86cd799439014' as unknown as string,
  clerkId: 'user_456',
  email: 'test2@example.com',
  name: 'Test User 2',
  profilePicture: 'https://example.com/avatar2.jpg',
  city: 'Test City 2',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const mockUsers: User[] = [mockUser, mockUser2];

// ============================================================================
// COLLECTION MOCK DATA
// ============================================================================

export const mockCollection: Collection = {
  _id: '507f1f77bcf86cd799439015' as unknown as string,
  name: 'Test Collection',
  description: 'A test collection for restaurants',
  type: 'personal' as const,
  ownerId: mockUser._id,
  restaurantIds: [mockRestaurant._id, mockRestaurant2._id],
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const mockCollection2: Collection = {
  _id: '507f1f77bcf86cd799439016' as unknown as string,
  name: 'Test Collection 2',
  description: 'Another test collection',
  type: 'personal' as const,
  ownerId: mockUser._id,
  restaurantIds: [mockRestaurant._id],
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const mockCollections: Collection[] = [mockCollection, mockCollection2];

// ============================================================================
// GROUP MOCK DATA
// ============================================================================

export const mockGroup: Group = {
  _id: '507f1f77bcf86cd799439017' as unknown as string,
  name: 'Test Group',
  description: 'A test group for restaurant decisions',
  adminIds: [mockUser._id],
  memberIds: [mockUser._id, mockUser2._id],
  collectionIds: [mockCollection._id],
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const mockGroups: Group[] = [mockGroup];

// ============================================================================
// DECISION MOCK DATA
// ============================================================================

export const mockDecision: Decision = {
  _id: '507f1f77bcf86cd799439018' as unknown as string,
  type: 'personal' as const,
  collectionId: mockCollection._id,
  userId: mockUser._id,
  method: 'random' as const,
  status: 'completed' as const,
  deadline: new Date('2024-01-02T00:00:00.000Z'),
  visitDate: new Date('2024-01-01T19:00:00.000Z'),
  result: {
    restaurantId: mockRestaurant._id,
    selectedAt: new Date('2024-01-01T18:30:00.000Z'),
    reasoning: 'Selected using weighted random algorithm',
  },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T18:30:00.000Z'),
};

export const mockDecisions: Decision[] = [mockDecision];

// ============================================================================
// FRIEND REQUEST MOCK DATA
// ============================================================================

export const mockFriendRequest: FriendRequest = {
  _id: '507f1f77bcf86cd799439019' as unknown as string,
  requesterId: mockUser._id,
  addresseeId: mockUser2._id,
  status: 'pending' as const,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const mockFriendRequests: FriendRequest[] = [mockFriendRequest];

// ============================================================================
// GOOGLE PLACES API MOCK DATA
// ============================================================================

export const mockGooglePlaceResult = {
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
    weekday_text: ['Monday: 9:00 AM – 10:00 PM', 'Tuesday: 9:00 AM – 10:00 PM'],
  },
};

export const mockGooglePlacesResponse = {
  results: [mockGooglePlaceResult],
  status: 'OK',
};

// ============================================================================
// API RESPONSE MOCK DATA
// ============================================================================

export const mockApiSuccessResponse = {
  success: true,
  data: mockRestaurant,
};

export const mockApiErrorResponse = {
  success: false,
  error: 'Test error message',
};

// ============================================================================
// PERFORMANCE MOCK DATA
// ============================================================================

export const mockPerformanceMetrics = {
  date: '2024-01-01',
  environment: 'test',
  webVitals: {
    fcp: 1200,
    lcp: 2500,
    fid: 50,
    cls: 0.05,
    ttfb: 800,
  },
  bundleSize: {
    firstLoadJS: 245760,
    totalBundleSize: 512000,
    fileCount: 15,
  },
  buildTime: {
    buildTime: 45000,
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a mock ObjectId string
 */
export const createMockObjectId = (): string => {
  return (
    '507f1f77bcf86cd7994390' +
    Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')
  );
};

/**
 * Creates a mock date string
 */
export const createMockDate = (): string => {
  return new Date().toISOString();
};

/**
 * Creates a mock restaurant with custom properties
 */
export const createMockRestaurant = (
  overrides: Partial<Restaurant> = {}
): Restaurant => {
  return {
    ...mockRestaurant,
    _id: createMockObjectId() as unknown as string,
    ...overrides,
  };
};

/**
 * Creates a mock user with custom properties
 */
export const createMockUser = (overrides: Partial<User> = {}): User => {
  return {
    ...mockUser,
    _id: createMockObjectId() as unknown as string,
    ...overrides,
  };
};

/**
 * Creates a mock collection with custom properties
 */
export const createMockCollection = (
  overrides: Partial<Collection> = {}
): Collection => {
  return {
    ...mockCollection,
    _id: createMockObjectId() as unknown as string,
    ...overrides,
  };
};

/**
 * Creates a mock API response
 */
export const createMockApiResponse = <T>(data: T, success = true) => {
  return {
    success,
    ...(success ? { data } : { error: data }),
  };
};

/**
 * Creates a mock fetch response
 */
export const createMockFetchResponse = (
  data: unknown,
  ok = true,
  status = 200
) => {
  return {
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  };
};
