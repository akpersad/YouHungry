import { NextRequest } from 'next/server';
import { GET, PUT } from '../route';
import { requireAuth } from '@/lib/auth';
import { updateUser } from '@/lib/users';
import { User } from '@/types/database';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/users');
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>;

describe('/api/user/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return user profile data', async () => {
      const mockUser = {
        _id: { toString: () => 'user123' },
        clerkId: 'clerk123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        city: 'Test City',
        state: 'Test State',
        profilePicture: 'https://example.com/pic.jpg',
        smsOptIn: true,
        smsPhoneNumber: '+1234567890',
        phoneNumber: '+1234567890',
        preferences: {
          defaultLocation: 'Test Location',
          locationSettings: {
            city: 'Test City',
            state: 'Test State',
            country: 'US',
            timezone: 'America/New_York',
          },
          notificationSettings: {
            groupDecisions: true,
            friendRequests: true,
            groupInvites: true,
            smsEnabled: true,
            emailEnabled: true,
            pushEnabled: true,
          },
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      };

      mockRequireAuth.mockResolvedValue(mockUser as unknown as User);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        _id: 'user123',
        clerkId: 'clerk123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        city: 'Test City',
        state: 'Test State',
        profilePicture: 'https://example.com/pic.jpg',
        smsOptIn: true,
        smsPhoneNumber: '+1234567890',
        phoneNumber: '+1234567890',
        preferences: mockUser.preferences,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z',
      });
    });

    it('should handle authentication errors', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch user profile');
    });
  });

  describe('PUT', () => {
    it('should update user profile successfully', async () => {
      const mockUser = {
        _id: { toString: () => 'user123' },
        clerkId: 'clerk123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        city: 'Test City',
        state: 'Test State',
        profilePicture: 'https://example.com/pic.jpg',
        smsOptIn: true,
        smsPhoneNumber: '+1234567890',
        phoneNumber: '+1234567890',
        preferences: {
          defaultLocation: 'Test Location',
          locationSettings: {
            city: 'Test City',
            state: 'Test State',
            country: 'US',
            timezone: 'America/New_York',
          },
          notificationSettings: {
            groupDecisions: true,
            friendRequests: true,
            groupInvites: true,
            smsEnabled: true,
            emailEnabled: true,
            pushEnabled: true,
          },
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      };

      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
        city: 'Updated City',
      };

      mockRequireAuth.mockResolvedValue(mockUser as unknown as User);
      mockUpdateUser.mockResolvedValue(updatedUser as unknown as User);

      const request = new NextRequest(
        'http://localhost:3000/api/user/profile',
        {
          method: 'PUT',
          body: JSON.stringify({
            city: 'Updated City',
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.city).toBe('Updated City');
      expect(mockUpdateUser).toHaveBeenCalledWith('user123', {
        city: 'Updated City',
      });
    });

    it('should validate profile data', async () => {
      const mockUser = {
        _id: { toString: () => 'user123' },
        clerkId: 'clerk123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        city: 'Test City',
        state: 'Test State',
        profilePicture: 'https://example.com/pic.jpg',
        smsOptIn: true,
        smsPhoneNumber: '+1234567890',
        phoneNumber: '+1234567890',
        preferences: {
          defaultLocation: 'Test Location',
          locationSettings: {
            city: 'Test City',
            state: 'Test State',
            country: 'US',
            timezone: 'America/New_York',
          },
          notificationSettings: {
            groupDecisions: true,
            friendRequests: true,
            groupInvites: true,
            smsEnabled: true,
            emailEnabled: true,
            pushEnabled: true,
          },
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      };

      mockRequireAuth.mockResolvedValue(mockUser as unknown as User);

      const request = new NextRequest(
        'http://localhost:3000/api/user/profile',
        {
          method: 'PUT',
          body: JSON.stringify({
            username: 'ab', // Invalid: too short
            smsPhoneNumber: 'invalid-phone', // Invalid: wrong format
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid profile data');
      expect(data.details).toHaveLength(2);
      expect(data.details[0].field).toBe('username');
      expect(data.details[1].field).toBe('smsPhoneNumber');
    });

    it('should handle update errors', async () => {
      const mockUser = {
        _id: { toString: () => 'user123' },
        clerkId: 'clerk123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        city: 'Test City',
        state: 'Test State',
        profilePicture: 'https://example.com/pic.jpg',
        smsOptIn: true,
        smsPhoneNumber: '+1234567890',
        phoneNumber: '+1234567890',
        preferences: {
          defaultLocation: 'Test Location',
          locationSettings: {
            city: 'Test City',
            state: 'Test State',
            country: 'US',
            timezone: 'America/New_York',
          },
          notificationSettings: {
            groupDecisions: true,
            friendRequests: true,
            groupInvites: true,
            smsEnabled: true,
            emailEnabled: true,
            pushEnabled: true,
          },
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      };

      mockRequireAuth.mockResolvedValue(mockUser as unknown as User);
      mockUpdateUser.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/user/profile',
        {
          method: 'PUT',
          body: JSON.stringify({
            city: 'Updated City',
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update profile');
    });
  });
});
