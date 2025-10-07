import { NextRequest } from 'next/server';
import { POST, DELETE } from '../route';
import { requireAuth } from '@/lib/auth';
import { updateUser } from '@/lib/users';
import { put } from '@vercel/blob';
import { User } from '@/types/database';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/users');
jest.mock('@vercel/blob');
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>;
const mockPut = put as jest.MockedFunction<typeof put>;

describe('/api/user/profile/picture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should upload profile picture successfully', async () => {
      const mockUser = {
        _id: { toString: () => 'user123' },
        clerkId: 'clerk123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        city: 'Test City',
        state: 'Test State',
        profilePicture: 'https://example.com/old-pic.jpg',
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

      const mockBlob = {
        url: 'https://blob.vercel-storage.com/profile-pictures/user123-1234567890.jpg',
        downloadUrl:
          'https://blob.vercel-storage.com/profile-pictures/user123-1234567890.jpg',
        pathname: 'profile-pictures/user123-1234567890.jpg',
        contentType: 'image/jpeg',
        contentDisposition: 'inline; filename="user123-1234567890.jpg"',
        size: 1024,
        uploadedAt: new Date('2023-01-01'),
      };

      const updatedUser = {
        ...mockUser,
        profilePicture: mockBlob.url,
      };

      mockRequireAuth.mockResolvedValue(mockUser as unknown as User);
      mockPut.mockResolvedValue(mockBlob);
      mockUpdateUser.mockResolvedValue(updatedUser as unknown as User);

      // Create a mock file
      const file = new File(['test image content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      const formData = new FormData();
      formData.append('file', file);

      const request = new NextRequest(
        'http://localhost:3000/api/user/profile/picture',
        {
          method: 'POST',
          body: formData,
        }
      );

      // Mock the formData method to return our FormData
      request.formData = jest.fn().mockResolvedValue(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profilePicture).toBe(mockBlob.url);
      expect(mockPut).toHaveBeenCalledWith(
        expect.stringMatching(/^profile-pictures\/user123-\d+\.jpg$/),
        file,
        {
          access: 'public',
          contentType: 'image/jpeg',
        }
      );
      expect(mockUpdateUser).toHaveBeenCalledWith('user123', {
        profilePicture: mockBlob.url,
      });
    });

    it('should reject files that are too large', async () => {
      const mockUser = {
        _id: { toString: () => 'user123' },
        clerkId: 'clerk123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        city: 'Test City',
        state: 'Test State',
        profilePicture: 'https://example.com/old-pic.jpg',
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

      // Create a mock file that's too large (6MB)
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const formData = new FormData();
      formData.append('file', largeFile);

      const request = new NextRequest(
        'http://localhost:3000/api/user/profile/picture',
        {
          method: 'POST',
          body: formData,
        }
      );

      // Mock the formData method to return our FormData
      request.formData = jest.fn().mockResolvedValue(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('File too large. Maximum size is 5MB.');
    });

    it('should reject invalid file types', async () => {
      const mockUser = {
        _id: { toString: () => 'user123' },
        clerkId: 'clerk123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        city: 'Test City',
        state: 'Test State',
        profilePicture: 'https://example.com/old-pic.jpg',
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

      // Create a mock file with invalid type
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });
      const formData = new FormData();
      formData.append('file', file);

      const request = new NextRequest(
        'http://localhost:3000/api/user/profile/picture',
        {
          method: 'POST',
          body: formData,
        }
      );

      // Mock the formData method to return our FormData
      request.formData = jest.fn().mockResolvedValue(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
      );
    });

    it('should handle missing file', async () => {
      const mockUser = {
        _id: { toString: () => 'user123' },
        clerkId: 'clerk123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        city: 'Test City',
        state: 'Test State',
        profilePicture: 'https://example.com/old-pic.jpg',
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

      const formData = new FormData();
      // No file appended

      const request = new NextRequest(
        'http://localhost:3000/api/user/profile/picture',
        {
          method: 'POST',
          body: formData,
        }
      );

      // Mock the formData method to return our FormData
      request.formData = jest.fn().mockResolvedValue(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No file provided');
    });

    it('should handle update user errors', async () => {
      const mockUser = {
        _id: { toString: () => 'user123' },
        clerkId: 'clerk123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        city: 'Test City',
        state: 'Test State',
        profilePicture: 'https://example.com/old-pic.jpg',
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

      const mockBlob = {
        url: 'https://blob.vercel-storage.com/profile-pictures/user123-1234567890.jpg',
        downloadUrl:
          'https://blob.vercel-storage.com/profile-pictures/user123-1234567890.jpg',
        pathname: 'profile-pictures/user123-1234567890.jpg',
        contentType: 'image/jpeg',
        contentDisposition: 'inline; filename="user123-1234567890.jpg"',
        size: 1024,
        uploadedAt: new Date('2023-01-01'),
      };

      mockRequireAuth.mockResolvedValue(mockUser as unknown as User);
      mockPut.mockResolvedValue(mockBlob);
      mockUpdateUser.mockResolvedValue(null);

      const file = new File(['test image content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      const formData = new FormData();
      formData.append('file', file);

      const request = new NextRequest(
        'http://localhost:3000/api/user/profile/picture',
        {
          method: 'POST',
          body: formData,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to upload profile picture');
    });
  });

  describe('DELETE', () => {
    it('should remove profile picture successfully', async () => {
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
        profilePicture: undefined,
      };

      mockRequireAuth.mockResolvedValue(mockUser as unknown as User);
      mockUpdateUser.mockResolvedValue(updatedUser as unknown as User);

      const request = new NextRequest(
        'http://localhost:3000/api/user/profile/picture',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Profile picture removed successfully');
      expect(mockUpdateUser).toHaveBeenCalledWith('user123', {
        profilePicture: undefined,
      });
    });

    it('should handle remove picture errors', async () => {
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
        'http://localhost:3000/api/user/profile/picture',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to remove profile picture');
    });
  });
});
