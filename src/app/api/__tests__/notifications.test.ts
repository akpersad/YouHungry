import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/notifications/route';
import { inAppNotifications } from '@/lib/in-app-notifications';

// Mock the in-app notification service
jest.mock('@/lib/in-app-notifications', () => ({
  inAppNotifications: {
    getNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  },
}));

// Mock auth helpers
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

// Mock the database connection
jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({}),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { getCurrentUser } from '@/lib/auth';
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockInAppNotifications = inAppNotifications as jest.Mocked<
  typeof inAppNotifications
>;

const mockUser = {
  _id: 'user-123',
  clerkId: 'clerk-123',
  email: 'test@example.com',
  name: 'Test User',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe('/api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/notifications'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockInAppNotifications.getNotifications).not.toHaveBeenCalled();
    });

    it('should return notifications scoped to the authenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockInAppNotifications.getNotifications.mockResolvedValue([] as any);
      mockInAppNotifications.getUnreadCount.mockResolvedValue(0);

      const request = new NextRequest(
        'http://localhost:3000/api/notifications'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.notifications).toEqual([]);
      expect(data.unreadCount).toBe(0);
      expect(mockInAppNotifications.getNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ userId: mockUser._id })
      );
      expect(mockInAppNotifications.getUnreadCount).toHaveBeenCalledWith(
        mockUser._id
      );
    });
  });

  describe('POST', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/notifications',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'mark_read',
            notificationId: 'notif-1',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockInAppNotifications.markAsRead).not.toHaveBeenCalled();
    });

    it('should scope mark_read to the authenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockInAppNotifications.markAsRead.mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/notifications',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'mark_read',
            notificationId: 'notif-1',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockInAppNotifications.markAsRead).toHaveBeenCalledWith(
        'notif-1',
        mockUser._id
      );
    });

    it('should mark all notifications as read for the authenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockInAppNotifications.markAllAsRead.mockResolvedValue(3);

      const request = new NextRequest(
        'http://localhost:3000/api/notifications',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'mark_all_read' }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.count).toBe(3);
      expect(mockInAppNotifications.markAllAsRead).toHaveBeenCalledWith(
        mockUser._id
      );
    });

    it('should return 400 for invalid action', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const request = new NextRequest(
        'http://localhost:3000/api/notifications',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'bogus' }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action');
    });
  });
});
