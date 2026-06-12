// Mock dependencies
jest.mock('../users', () => ({
  getUserByClerkId: jest.fn(),
  createUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { auth } from '@clerk/nextjs/server';
import { ObjectId } from 'mongodb';
import {
  getCurrentUser,
  requireAuth,
  requireAdminAuth,
  isAdminUser,
} from '../auth';
import { getUserByClerkId, createUser } from '../users';
import { logger } from '@/lib/logger';
import type { User } from '@/types/database';

const mockAuth = auth as unknown as jest.Mock;
const mockGetUserByClerkId = getUserByClerkId as jest.Mock;
const mockCreateUser = createUser as jest.Mock;

const userObjectId = new ObjectId('507f1f77bcf86cd799439012');

const mockUser = {
  _id: userObjectId,
  clerkId: 'clerk_user_123',
  email: 'existing@example.com',
  name: 'Existing User',
} as unknown as User;

describe('auth', () => {
  const originalAdminUserIds = process.env.ADMIN_USER_IDS;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ADMIN_USER_IDS;
    mockAuth.mockResolvedValue({ userId: 'clerk_user_123' });
  });

  afterAll(() => {
    if (originalAdminUserIds === undefined) {
      delete process.env.ADMIN_USER_IDS;
    } else {
      process.env.ADMIN_USER_IDS = originalAdminUserIds;
    }
  });

  describe('getCurrentUser', () => {
    it('returns the existing DB user for the Clerk session', async () => {
      mockGetUserByClerkId.mockResolvedValue(mockUser);

      const result = await getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(mockGetUserByClerkId).toHaveBeenCalledWith('clerk_user_123');
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('returns null when there is no Clerk session', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const result = await getCurrentUser();

      expect(result).toBeNull();
      expect(mockGetUserByClerkId).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('auto-creates a placeholder DB user when none exists', async () => {
      const createdUser = { ...mockUser, email: 'user@example.com' };
      mockGetUserByClerkId.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue(createdUser);

      const result = await getCurrentUser();

      expect(result).toEqual(createdUser);
      expect(mockCreateUser).toHaveBeenCalledTimes(1);
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          clerkId: 'clerk_user_123',
          email: 'user@example.com',
          name: 'User',
          smsOptIn: false,
          preferences: expect.objectContaining({
            notificationSettings: expect.objectContaining({
              pushEnabled: false,
            }),
          }),
        })
      );
    });

    it('returns null and logs when the user lookup throws', async () => {
      mockGetUserByClerkId.mockRejectedValue(new Error('db down'));

      const result = await getCurrentUser();

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Error getting current user:',
        expect.any(Error)
      );
    });
  });

  describe('requireAuth', () => {
    it('returns the user when authenticated', async () => {
      mockGetUserByClerkId.mockResolvedValue(mockUser);

      await expect(requireAuth()).resolves.toEqual(mockUser);
    });

    it('throws when unauthenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      await expect(requireAuth()).rejects.toThrow('Authentication required');
    });
  });

  describe('requireAdminAuth', () => {
    it('returns the user when their DB id is listed in ADMIN_USER_IDS', async () => {
      process.env.ADMIN_USER_IDS = `someone-else, ${userObjectId.toString()}`;
      mockGetUserByClerkId.mockResolvedValue(mockUser);

      await expect(requireAdminAuth()).resolves.toEqual(mockUser);
    });

    it('throws when the user id is not in ADMIN_USER_IDS', async () => {
      process.env.ADMIN_USER_IDS = 'someone-else,another-admin';
      mockGetUserByClerkId.mockResolvedValue(mockUser);

      await expect(requireAdminAuth()).rejects.toThrow('Admin access required');
    });

    it('throws when ADMIN_USER_IDS is unset', async () => {
      mockGetUserByClerkId.mockResolvedValue(mockUser);

      await expect(requireAdminAuth()).rejects.toThrow('Admin access required');
    });

    it('throws Authentication required when there is no session', async () => {
      process.env.ADMIN_USER_IDS = userObjectId.toString();
      mockAuth.mockResolvedValue({ userId: null });

      await expect(requireAdminAuth()).rejects.toThrow(
        'Authentication required'
      );
    });
  });

  describe('isAdminUser', () => {
    it('returns true when the user id is listed', () => {
      process.env.ADMIN_USER_IDS = userObjectId.toString();

      expect(isAdminUser(mockUser)).toBe(true);
    });

    it('returns false when the user id is absent', () => {
      process.env.ADMIN_USER_IDS = 'someone-else';

      expect(isAdminUser(mockUser)).toBe(false);
    });

    it('returns false when ADMIN_USER_IDS is unset', () => {
      expect(isAdminUser(mockUser)).toBe(false);
    });
  });
});
