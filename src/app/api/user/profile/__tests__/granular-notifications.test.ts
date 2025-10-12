import { PUT } from '../route';
import { updateUser } from '@/lib/users';
import { requireAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/users');
jest.mock('@/lib/auth');
jest.mock('@/lib/logger');

describe('Profile API - Granular Notification Settings', () => {
  const mockUser = {
    _id: { toString: () => 'user123' },
    clerkId: 'clerk_123',
    email: 'test@example.com',
    name: 'Test User',
    smsOptIn: false,
    preferences: {
      locationSettings: {
        city: 'New York',
        state: 'NY',
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue(mockUser);
    (updateUser as jest.Mock).mockResolvedValue({
      ...mockUser,
      updatedAt: new Date(),
    });
  });

  it('should handle granular groupDecisions settings', async () => {
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({
        preferences: {
          notificationSettings: {
            groupDecisions: {
              started: false,
              completed: true,
            },
          },
        },
      }),
    });

    await PUT(request);

    expect(updateUser).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        preferences: expect.objectContaining({
          notificationSettings: expect.objectContaining({
            groupDecisions: {
              started: false,
              completed: true,
            },
          }),
        }),
      })
    );
  });

  it('should convert boolean groupDecisions to object format for backward compatibility', async () => {
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({
        preferences: {
          notificationSettings: {
            groupDecisions: false, // Old boolean format
          },
        },
      }),
    });

    await PUT(request);

    expect(updateUser).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        preferences: expect.objectContaining({
          notificationSettings: expect.objectContaining({
            groupDecisions: {
              started: false,
              completed: false,
            },
          }),
        }),
      })
    );
  });

  it('should merge partial groupDecisions updates', async () => {
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({
        preferences: {
          notificationSettings: {
            groupDecisions: {
              started: false,
              // completed not specified, should keep existing value
            },
          },
        },
      }),
    });

    await PUT(request);

    expect(updateUser).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        preferences: expect.objectContaining({
          notificationSettings: expect.objectContaining({
            groupDecisions: {
              started: false,
              completed: true, // Should preserve existing value
            },
          }),
        }),
      })
    );
  });

  it('should handle user with old boolean format in database', async () => {
    const userWithOldFormat = {
      ...mockUser,
      preferences: {
        ...mockUser.preferences,
        notificationSettings: {
          ...mockUser.preferences.notificationSettings,
          groupDecisions: true as any, // Old boolean format in DB
        },
      },
    };

    (requireAuth as jest.Mock).mockResolvedValue(userWithOldFormat);

    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({
        preferences: {
          notificationSettings: {
            groupDecisions: {
              started: false,
              completed: true,
            },
          },
        },
      }),
    });

    await PUT(request);

    // Should convert old format to new format and apply updates
    expect(updateUser).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        preferences: expect.objectContaining({
          notificationSettings: expect.objectContaining({
            groupDecisions: {
              started: false,
              completed: true,
            },
          }),
        }),
      })
    );
  });

  it('should preserve other notification settings when updating groupDecisions', async () => {
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({
        preferences: {
          notificationSettings: {
            groupDecisions: {
              started: false,
              completed: false,
            },
          },
        },
      }),
    });

    await PUT(request);

    expect(updateUser).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        preferences: expect.objectContaining({
          notificationSettings: expect.objectContaining({
            friendRequests: true,
            groupInvites: true,
            smsEnabled: false,
            emailEnabled: true,
            pushEnabled: true,
          }),
        }),
      })
    );
  });
});
