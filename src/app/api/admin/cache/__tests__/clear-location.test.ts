import { NextRequest } from 'next/server';
import { POST } from '../clear-location/route';
import { clearLocationCache } from '@/lib/google-places';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/users';
import { ObjectId } from 'mongodb';

// Mock dependencies
jest.mock('@/lib/google-places');
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/users');
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockClearLocationCache = clearLocationCache as jest.MockedFunction<
  typeof clearLocationCache
>;
const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockGetUserByClerkId = getUserByClerkId as jest.MockedFunction<
  typeof getUserByClerkId
>;

describe('POST /api/admin/cache/clear-location', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variable for admin user IDs
    process.env.ADMIN_USER_IDS =
      '68d9b010a25dec569c34c111,68d9ae3528a9bab6c334d9f9';
  });

  it('should clear all location cache when no coordinates provided', async () => {
    // Mock admin user
    mockAuth.mockResolvedValue({ userId: 'clerk_user_123' } as any);
    mockGetUserByClerkId.mockResolvedValue({
      _id: new ObjectId('68d9b010a25dec569c34c111'),
      clerkId: 'clerk_user_123',
      name: 'Admin User',
      email: 'admin@example.com',
    } as any);

    // Mock cache clearing
    mockClearLocationCache.mockResolvedValue(25);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/cache/clear-location',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.deletedCount).toBe(25);
    expect(data.message).toContain('Cleared all 25 cache entries');
    expect(mockClearLocationCache).toHaveBeenCalledWith();
  });

  it('should clear specific location cache when coordinates provided', async () => {
    // Mock admin user
    mockAuth.mockResolvedValue({ userId: 'clerk_user_123' } as any);
    mockGetUserByClerkId.mockResolvedValue({
      _id: new ObjectId('68d9b010a25dec569c34c111'),
      clerkId: 'clerk_user_123',
      name: 'Admin User',
      email: 'admin@example.com',
    } as any);

    // Mock cache clearing
    mockClearLocationCache.mockResolvedValue(5);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/cache/clear-location',
      {
        method: 'POST',
        body: JSON.stringify({ lat: 40.7128, lng: -74.006 }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.deletedCount).toBe(5);
    expect(data.message).toContain(
      'Cleared 5 cache entries for location (40.7128, -74.006)'
    );
    expect(mockClearLocationCache).toHaveBeenCalledWith(40.7128, -74.006);
  });

  it('should return 401 if user not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/cache/clear-location',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(mockClearLocationCache).not.toHaveBeenCalled();
  });

  it('should return 403 if user is not admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_user_456' } as any);
    mockGetUserByClerkId.mockResolvedValue({
      _id: new ObjectId('507f1f77bcf86cd799439011'), // Non-admin ID
      clerkId: 'clerk_user_456',
      name: 'Regular User',
      email: 'user@example.com',
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/cache/clear-location',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden - Admin access required');
    expect(mockClearLocationCache).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_user_123' } as any);
    mockGetUserByClerkId.mockResolvedValue({
      _id: new ObjectId('68d9b010a25dec569c34c111'),
      clerkId: 'clerk_user_123',
      name: 'Admin User',
      email: 'admin@example.com',
    } as any);

    // Mock error
    mockClearLocationCache.mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/admin/cache/clear-location',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to clear cache');
    expect(data.details).toBe('Database connection failed');
  });

  it('should handle invalid request body gracefully', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_user_123' } as any);
    mockGetUserByClerkId.mockResolvedValue({
      _id: new ObjectId('68d9b010a25dec569c34c111'),
      clerkId: 'clerk_user_123',
      name: 'Admin User',
      email: 'admin@example.com',
    } as any);

    mockClearLocationCache.mockResolvedValue(0);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/cache/clear-location',
      {
        method: 'POST',
        body: 'invalid json',
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Should treat as empty body and clear all
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockClearLocationCache).toHaveBeenCalledWith();
  });
});
