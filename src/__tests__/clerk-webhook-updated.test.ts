import { POST } from '@/app/api/webhooks/clerk/route';
import { createUser, updateUser, getUserByClerkId } from '@/lib/users';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/users');
jest.mock('@/lib/logger');
jest.mock('svix');
jest.mock('next/headers');

const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>;
const mockGetUserByClerkId = getUserByClerkId as jest.MockedFunction<
  typeof getUserByClerkId
>;
const mockLogger = logger as jest.Mocked<typeof logger>;

// Mock Svix Webhook
const mockVerify = jest.fn();
jest.mock('svix', () => ({
  Webhook: jest.fn().mockImplementation(() => ({
    verify: mockVerify,
  })),
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

describe('Clerk Webhook (Updated)', () => {
  const mockRequest = {
    json: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variable
    process.env.CLERK_WEBHOOK_SECRET = 'test-secret';

    // Mock headers
    const { headers } = require('next/headers');
    headers.mockResolvedValue({
      get: jest.fn((key: string) => {
        const headers: Record<string, string> = {
          'svix-id': 'test-id',
          'svix-timestamp': 'test-timestamp',
          'svix-signature': 'test-signature',
        };
        return headers[key];
      }),
    });
  });

  describe('user.created event', () => {
    it('creates user with new enhanced fields', async () => {
      const mockUserData = {
        id: 'user_123',
        email_addresses: [{ email_address: 'test@example.com' }],
        first_name: 'John',
        last_name: 'Doe',
        image_url: 'https://example.com/avatar.jpg',
        phone_numbers: [{ phone_number: '+1234567890' }],
      };

      mockRequest.json.mockResolvedValue({ data: mockUserData });
      mockVerify.mockReturnValue({
        type: 'user.created',
        data: mockUserData,
      });

      mockCreateUser.mockResolvedValue({
        _id: 'user_123',
        clerkId: 'user_123',
        email: 'test@example.com',
        name: 'John Doe',
        profilePicture: 'https://example.com/avatar.jpg',
        phoneNumber: '+1234567890',
        smsOptIn: false,
        preferences: {
          locationSettings: {
            city: undefined,
            state: undefined,
            country: undefined,
            timezone: undefined,
          },
          notificationSettings: {
            groupDecisions: {
              started: true,
              completed: true,
            },
            friendRequests: true,
            groupInvites: true,
            smsEnabled: false,
            emailEnabled: true,
            pushEnabled: true,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
      expect(mockCreateUser).toHaveBeenCalledWith({
        clerkId: 'user_123',
        email: 'test@example.com',
        name: 'John Doe',
        profilePicture: 'https://example.com/avatar.jpg',
        phoneNumber: '+1234567890',
        smsOptIn: false,
        preferences: {
          locationSettings: {
            city: undefined,
            state: undefined,
            country: undefined,
            timezone: undefined,
          },
          notificationSettings: {
            groupDecisions: {
              started: true,
              completed: true,
            },
            friendRequests: true,
            groupInvites: true,
            smsEnabled: false,
            emailEnabled: true,
            pushEnabled: true,
          },
        },
      });
    });

    it('handles user creation without phone number', async () => {
      const mockUserData = {
        id: 'user_123',
        email_addresses: [{ email_address: 'test@example.com' }],
        first_name: 'John',
        last_name: 'Doe',
        image_url: 'https://example.com/avatar.jpg',
        phone_numbers: [],
      };

      mockRequest.json.mockResolvedValue({ data: mockUserData });
      mockVerify.mockReturnValue({
        type: 'user.created',
        data: mockUserData,
      });

      mockCreateUser.mockResolvedValue({} as any);

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumber: undefined,
        })
      );
    });

    it('handles user creation with minimal data', async () => {
      const mockUserData = {
        id: 'user_123',
        email_addresses: [],
        first_name: '',
        last_name: '',
        image_url: null,
        phone_numbers: [],
      };

      mockRequest.json.mockResolvedValue({ data: mockUserData });
      mockVerify.mockReturnValue({
        type: 'user.created',
        data: mockUserData,
      });

      mockCreateUser.mockResolvedValue({} as any);

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: '',
          name: 'User',
          profilePicture: null,
          phoneNumber: undefined,
        })
      );
    });
  });

  describe('user.updated event', () => {
    it('updates user with new phone number field', async () => {
      const mockUserData = {
        id: 'user_123',
        email_addresses: [{ email_address: 'updated@example.com' }],
        first_name: 'John',
        last_name: 'Doe',
        image_url: 'https://example.com/new-avatar.jpg',
        phone_numbers: [{ phone_number: '+1987654321' }],
      };

      const mockExistingUser = {
        _id: 'user_123',
        clerkId: 'user_123',
        email: 'old@example.com',
        name: 'Old Name',
        profilePicture: 'https://example.com/old-avatar.jpg',
        phoneNumber: '+1234567890',
        smsOptIn: false,
        preferences: {
          locationSettings: {},
          notificationSettings: {
            groupDecisions: {
              started: true,
              completed: true,
            },
            friendRequests: true,
            groupInvites: true,
            smsEnabled: false,
            emailEnabled: true,
            pushEnabled: true,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.json.mockResolvedValue({ data: mockUserData });
      mockVerify.mockReturnValue({
        type: 'user.updated',
        data: mockUserData,
      });

      mockGetUserByClerkId.mockResolvedValue(mockExistingUser as any);
      mockUpdateUser.mockResolvedValue(mockExistingUser as any);

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
      expect(mockUpdateUser).toHaveBeenCalledWith('user_123', {
        email: 'updated@example.com',
        name: 'John Doe',
        profilePicture: 'https://example.com/new-avatar.jpg',
        phoneNumber: '+1987654321',
      });
    });

    it('handles user update when user not found', async () => {
      const mockUserData = {
        id: 'user_123',
        email_addresses: [{ email_address: 'test@example.com' }],
        first_name: 'John',
        last_name: 'Doe',
        image_url: 'https://example.com/avatar.jpg',
        phone_numbers: [{ phone_number: '+1234567890' }],
      };

      mockRequest.json.mockResolvedValue({ data: mockUserData });
      mockVerify.mockReturnValue({
        type: 'user.updated',
        data: mockUserData,
      });

      mockGetUserByClerkId.mockResolvedValue(null);

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles webhook verification errors', async () => {
      mockRequest.json.mockResolvedValue({});
      mockVerify.mockImplementation(() => {
        throw new Error('Verification failed');
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error verifying webhook:',
        expect.any(Error)
      );
    });

    it('handles user creation errors', async () => {
      const mockUserData = {
        id: 'user_123',
        email_addresses: [{ email_address: 'test@example.com' }],
        first_name: 'John',
        last_name: 'Doe',
        image_url: null,
        phone_numbers: [],
      };

      mockRequest.json.mockResolvedValue({ data: mockUserData });
      mockVerify.mockReturnValue({
        type: 'user.created',
        data: mockUserData,
      });

      mockCreateUser.mockRejectedValue(new Error('Database error'));

      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating user:',
        expect.any(Error)
      );
    });

    it('handles missing webhook secret', async () => {
      delete process.env.CLERK_WEBHOOK_SECRET;

      const response = await POST(mockRequest);

      expect(response.status).toBe(200); // Now returns 200 in development mode
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'CLERK_WEBHOOK_SECRET not set, running in development mode without verification'
      );
    });
  });
});
