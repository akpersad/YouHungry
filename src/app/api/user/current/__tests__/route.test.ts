// import { NextRequest } from 'next/server';
import { GET } from '../route';
import { requireAuth } from '@/lib/auth';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe('/api/user/current', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variable for admin check
    process.env.ADMIN_USER_IDS = '507f1f77bcf86cd799439011';
  });

  it('returns current user data successfully', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      clerkId: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      profilePicture: 'https://example.com/avatar.jpg',
      city: 'New York',
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-15'),
      smsOptIn: false,
      preferences: {
        notificationSettings: {
          groupDecisions: true,
          friendRequests: true,
          groupInvites: true,
        },
      },
    };

    mockRequireAuth.mockResolvedValue(mockUser as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      user: {
        _id: '507f1f77bcf86cd799439011',
        clerkId: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        profilePicture: 'https://example.com/avatar.jpg',
        city: 'New York',
        isAdmin: true, // This user is in the admin list
      },
    });
  });

  it('handles auth errors', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to fetch current user',
    });
  });

  it('handles unexpected errors', async () => {
    mockRequireAuth.mockRejectedValue('Unexpected error');

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to fetch current user',
    });
  });
});
