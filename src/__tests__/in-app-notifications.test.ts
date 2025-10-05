import { inAppNotifications } from '@/lib/in-app-notifications';
import { ObjectId } from 'mongodb';
import { db } from '@/lib/db';

// Mock database
jest.mock('@/lib/db', () => {
  const mockCollection = {
    insertOne: jest.fn(),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            toArray: jest.fn(),
          }),
        }),
      }),
    }),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    countDocuments: jest.fn(),
    deleteMany: jest.fn(),
  };

  return {
    db: {
      collection: jest.fn().mockReturnValue(mockCollection),
    },
    mockCollection,
  };
});

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('In-App Notifications', () => {
  const mockUserId = new ObjectId();
  const mockGroupId = new ObjectId();
  const mockDecisionId = new ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the collection cache in the service
    (inAppNotifications as any).collection = undefined;
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const mockInsertOne = jest.fn().mockResolvedValue({
        insertedId: new ObjectId(),
      });
      (db.collection as jest.Mock).mockReturnValue({
        insertOne: mockInsertOne,
      });

      const result = await inAppNotifications.createNotification({
        userId: mockUserId,
        type: 'group_decision',
        title: 'Test Notification',
        message: 'This is a test notification',
        data: { groupId: mockGroupId },
      });

      expect(mockInsertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          type: 'group_decision',
          title: 'Test Notification',
          message: 'This is a test notification',
          data: { groupId: mockGroupId },
          read: false,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );

      expect(result).toMatchObject({
        userId: mockUserId,
        type: 'group_decision',
        title: 'Test Notification',
        message: 'This is a test notification',
        data: { groupId: mockGroupId },
        read: false,
      });
    });
  });

  describe('getNotifications', () => {
    it('should get notifications with filters', async () => {
      const mockNotifications = [
        {
          _id: new ObjectId(),
          userId: mockUserId,
          type: 'group_decision',
          title: 'Test Notification',
          message: 'This is a test notification',
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockToArray = jest.fn().mockResolvedValue(mockNotifications);
      const mockLimit = jest.fn().mockReturnValue({ toArray: mockToArray });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockFind = jest.fn().mockReturnValue({ sort: mockSort });

      (db.collection as jest.Mock).mockReturnValue({
        insertOne: jest.fn(),
        find: mockFind,
        updateOne: jest.fn(),
        updateMany: jest.fn(),
        countDocuments: jest.fn(),
        deleteMany: jest.fn(),
      });

      const result = await inAppNotifications.getNotifications({
        userId: mockUserId,
        type: 'group_decision',
        limit: 10,
        offset: 0,
      });

      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          type: 'group_decision',
        })
      );
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockSkip).toHaveBeenCalledWith(0);
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
      (db.collection as jest.Mock).mockReturnValue({
        insertOne: jest.fn(),
        find: jest.fn(),
        updateOne: mockUpdateOne,
        updateMany: jest.fn(),
        countDocuments: jest.fn(),
        deleteMany: jest.fn(),
      });

      const notificationId = new ObjectId();
      const result = await inAppNotifications.markAsRead(notificationId);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: notificationId },
        expect.objectContaining({
          $set: expect.objectContaining({
            read: true,
            updatedAt: expect.any(Date),
          }),
        })
      );
      expect(result).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      const mockUpdateMany = jest.fn().mockResolvedValue({ modifiedCount: 3 });
      (db.collection as jest.Mock).mockReturnValue({
        insertOne: jest.fn(),
        find: jest.fn(),
        updateOne: jest.fn(),
        updateMany: mockUpdateMany,
        countDocuments: jest.fn(),
        deleteMany: jest.fn(),
      });

      const result = await inAppNotifications.markAllAsRead(mockUserId);

      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          read: false,
        }),
        expect.objectContaining({
          $set: expect.objectContaining({
            read: true,
            updatedAt: expect.any(Date),
          }),
        })
      );
      expect(result).toBe(3);
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread notification count', async () => {
      const mockCountDocuments = jest.fn().mockResolvedValue(5);
      (db.collection as jest.Mock).mockReturnValue({
        insertOne: jest.fn(),
        find: jest.fn(),
        updateOne: jest.fn(),
        updateMany: jest.fn(),
        countDocuments: mockCountDocuments,
        deleteMany: jest.fn(),
      });

      const result = await inAppNotifications.getUnreadCount(mockUserId);

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          read: false,
        })
      );
      expect(result).toBe(5);
    });
  });

  describe('Predefined notification creators', () => {
    beforeEach(() => {
      const mockInsertOne = jest.fn().mockResolvedValue({
        insertedId: new ObjectId(),
      });

      (db.collection as jest.Mock).mockReturnValue({
        insertOne: mockInsertOne,
        find: jest.fn(),
        updateOne: jest.fn(),
        updateMany: jest.fn(),
        countDocuments: jest.fn(),
        deleteMany: jest.fn(),
      });
    });

    it('should create group decision notification', async () => {
      const result = await inAppNotifications.createGroupDecisionNotification(
        mockUserId,
        'Test Group',
        'tiered',
        mockGroupId,
        mockDecisionId
      );

      expect(result).toMatchObject({
        userId: mockUserId,
        type: 'group_decision',
        title: 'Test Group Decision Started',
        data: {
          groupId: mockGroupId,
          decisionId: mockDecisionId,
        },
      });
    });

    it('should create friend request notification', async () => {
      const requesterId = new ObjectId();
      const result = await inAppNotifications.createFriendRequestNotification(
        mockUserId,
        'John Doe',
        requesterId
      );

      expect(result).toMatchObject({
        userId: mockUserId,
        type: 'friend_request',
        title: 'New Friend Request',
        message: 'John Doe sent you a friend request',
        data: {
          requesterId,
        },
      });
    });

    it('should create group invitation notification', async () => {
      const inviterId = new ObjectId();
      const result = await inAppNotifications.createGroupInvitationNotification(
        mockUserId,
        'Food Lovers',
        'Jane Smith',
        mockGroupId,
        inviterId
      );

      expect(result).toMatchObject({
        userId: mockUserId,
        type: 'group_invitation',
        title: 'Group Invitation',
        message: 'Jane Smith invited you to join "Food Lovers"',
        data: {
          groupId: mockGroupId,
          inviterId,
        },
      });
    });

    it('should create decision result notification', async () => {
      const restaurantId = new ObjectId();
      const result = await inAppNotifications.createDecisionResultNotification(
        mockUserId,
        'Test Group',
        'Pizza Palace',
        mockGroupId,
        mockDecisionId,
        restaurantId
      );

      expect(result).toMatchObject({
        userId: mockUserId,
        type: 'decision_result',
        title: 'Test Group Decision Complete',
        message: 'The group has decided on Pizza Palace!',
        data: {
          groupId: mockGroupId,
          decisionId: mockDecisionId,
          restaurantId,
        },
      });
    });

    it('should create admin alert notification', async () => {
      const result = await inAppNotifications.createAdminAlertNotification(
        mockUserId,
        'cost_spike',
        'Daily costs exceeded threshold',
        { amount: 100 }
      );

      expect(result).toMatchObject({
        userId: mockUserId,
        type: 'admin_alert',
        title: 'System Alert',
        message: 'Daily costs exceeded threshold',
        data: {
          alertType: 'cost_spike',
          amount: 100,
        },
      });
    });
  });
});
