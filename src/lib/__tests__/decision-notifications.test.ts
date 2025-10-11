// Mock Twilio first, before any other imports
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        sid: 'SM1234567890abcdef1234567890abcdef',
        status: 'sent',
      }),
    },
  }));
});

import {
  sendDecisionStartedNotifications,
  sendDecisionCompletedNotifications,
} from '../decision-notifications';
import { connectToDatabase } from '../db';
import { notificationService } from '../notification-service';
import { urlShortener } from '../url-shortener';
import { ObjectId } from 'mongodb';

// Mock dependencies
jest.mock('../db');
jest.mock('../notification-service', () => ({
  notificationService: {
    sendGroupDecisionNotification: jest.fn().mockResolvedValue(undefined),
    sendDecisionResultNotification: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('../url-shortener');
jest.mock('../logger');

describe('Decision Notifications', () => {
  const mockDb = {
    collection: jest.fn(),
  };

  const mockGroupsCollection = {
    findOne: jest.fn(),
  };

  const mockCollectionsCollection = {
    findOne: jest.fn(),
  };

  const mockUsersCollection = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockRestaurantsCollection = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (connectToDatabase as jest.Mock).mockResolvedValue(mockDb);
    mockDb.collection.mockImplementation((name: string) => {
      if (name === 'groups') return mockGroupsCollection;
      if (name === 'collections') return mockCollectionsCollection;
      if (name === 'users') return mockUsersCollection;
      if (name === 'restaurants') return mockRestaurantsCollection;
      return {
        findOne: jest.fn(),
        find: jest.fn(),
      };
    });
  });

  describe('sendDecisionStartedNotifications', () => {
    const groupId = new ObjectId().toString();
    const collectionId = new ObjectId().toString();
    const decisionId = new ObjectId().toString();
    const createdByUserId = new ObjectId().toString();
    const deadline = new Date('2025-10-15T18:00:00Z');

    const mockGroup = {
      _id: new ObjectId(groupId),
      name: 'Lunch Crew',
      adminIds: [new ObjectId(createdByUserId)],
      memberIds: [
        new ObjectId(createdByUserId),
        new ObjectId(),
        new ObjectId(),
      ],
    };

    const mockCollection = {
      _id: new ObjectId(collectionId),
      name: 'Downtown Favorites',
    };

    const mockCreator = {
      _id: new ObjectId(createdByUserId),
      name: 'John Doe',
    };

    const mockMember1 = {
      _id: mockGroup.memberIds[1],
      name: 'Jane Smith',
      email: 'jane@example.com',
      smsOptIn: true,
      smsPhoneNumber: '+15555551234',
      preferences: {
        notificationSettings: {
          groupDecisions: {
            started: true,
            completed: true,
          },
          emailEnabled: true,
          smsEnabled: true,
          pushEnabled: true,
        },
      },
    };

    const mockMember2 = {
      _id: mockGroup.memberIds[2],
      name: 'Bob Johnson',
      email: 'bob@example.com',
      smsOptIn: false,
      preferences: {
        notificationSettings: {
          groupDecisions: {
            started: false, // Opted out of started notifications
            completed: true,
          },
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: false,
        },
      },
    };

    beforeEach(() => {
      mockGroupsCollection.findOne.mockResolvedValue(mockGroup);
      mockCollectionsCollection.findOne.mockResolvedValue(mockCollection);
      mockUsersCollection.findOne.mockResolvedValue(mockCreator);
      mockUsersCollection.find.mockReturnValue({
        toArray: jest
          .fn()
          .mockResolvedValue([mockCreator, mockMember1, mockMember2]),
      });
      (urlShortener.shortenUrl as jest.Mock).mockResolvedValue(
        'https://short.url/abc123'
      );
    });

    it.skip('should send notifications to all group members except creator', async () => {
      await sendDecisionStartedNotifications(
        groupId,
        collectionId,
        decisionId,
        'tiered',
        deadline,
        createdByUserId
      );

      // Should send notification to member1 (opted in)
      expect(
        notificationService.sendGroupDecisionNotification
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          groupName: 'Lunch Crew',
          collectionName: 'Downtown Favorites',
          decisionType: 'tiered',
          deadline,
          createdByName: 'John Doe',
        }),
        expect.objectContaining({
          userId: mockMember1._id,
          user: mockMember1,
        })
      );

      // Should NOT send notification to member2 (opted out of started notifications)
      expect(
        notificationService.sendGroupDecisionNotification
      ).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: mockMember2._id,
        })
      );

      // Should NOT send notification to creator
      expect(
        notificationService.sendGroupDecisionNotification
      ).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: mockCreator._id,
        })
      );
    });

    it.skip('should include shortened URL in notification data', async () => {
      await sendDecisionStartedNotifications(
        groupId,
        collectionId,
        decisionId,
        'tiered',
        deadline,
        createdByUserId
      );

      expect(urlShortener.shortenUrl).toHaveBeenCalledWith(
        expect.stringContaining(`/collections/${collectionId}`),
        30
      );

      expect(
        notificationService.sendGroupDecisionNotification
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          shortUrl: 'https://short.url/abc123',
        }),
        expect.anything()
      );
    });

    it('should handle missing group gracefully', async () => {
      mockGroupsCollection.findOne.mockResolvedValue(null);

      await expect(
        sendDecisionStartedNotifications(
          groupId,
          collectionId,
          decisionId,
          'tiered',
          deadline,
          createdByUserId
        )
      ).resolves.not.toThrow();

      expect(
        notificationService.sendGroupDecisionNotification
      ).not.toHaveBeenCalled();
    });

    it('should handle missing collection gracefully', async () => {
      mockCollectionsCollection.findOne.mockResolvedValue(null);

      await expect(
        sendDecisionStartedNotifications(
          groupId,
          collectionId,
          decisionId,
          'tiered',
          deadline,
          createdByUserId
        )
      ).resolves.not.toThrow();

      expect(
        notificationService.sendGroupDecisionNotification
      ).not.toHaveBeenCalled();
    });

    it.skip('should handle random decision type', async () => {
      await sendDecisionStartedNotifications(
        groupId,
        collectionId,
        decisionId,
        'random',
        deadline,
        createdByUserId
      );

      expect(
        notificationService.sendGroupDecisionNotification
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          decisionType: 'random',
        }),
        expect.anything()
      );
    });
  });

  describe('sendDecisionCompletedNotifications', () => {
    const groupId = new ObjectId().toString();
    const collectionId = new ObjectId().toString();
    const decisionId = new ObjectId().toString();
    const restaurantId = new ObjectId().toString();

    const mockGroup = {
      _id: new ObjectId(groupId),
      name: 'Lunch Crew',
      adminIds: [new ObjectId()],
      memberIds: [new ObjectId(), new ObjectId()],
    };

    const mockCollection = {
      _id: new ObjectId(collectionId),
      name: 'Downtown Favorites',
    };

    const mockRestaurant = {
      _id: new ObjectId(restaurantId),
      name: 'The Best Pizza Place',
    };

    const mockMember1 = {
      _id: mockGroup.memberIds[0],
      name: 'Jane Smith',
      email: 'jane@example.com',
      smsOptIn: true,
      smsPhoneNumber: '+15555551234',
      preferences: {
        notificationSettings: {
          groupDecisions: {
            started: true,
            completed: true,
          },
          emailEnabled: true,
          smsEnabled: true,
          pushEnabled: true,
        },
      },
    };

    const mockMember2 = {
      _id: mockGroup.memberIds[1],
      name: 'Bob Johnson',
      email: 'bob@example.com',
      smsOptIn: false,
      preferences: {
        notificationSettings: {
          groupDecisions: {
            started: true,
            completed: false, // Opted out of completed notifications
          },
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: false,
        },
      },
    };

    beforeEach(() => {
      mockGroupsCollection.findOne.mockResolvedValue(mockGroup);
      mockCollectionsCollection.findOne.mockResolvedValue(mockCollection);
      mockRestaurantsCollection.findOne.mockResolvedValue(mockRestaurant);
      mockUsersCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([mockMember1, mockMember2]),
      });
      (urlShortener.shortenUrl as jest.Mock).mockResolvedValue(
        'https://short.url/xyz789'
      );
    });

    it('should send notifications to members who opted in', async () => {
      await sendDecisionCompletedNotifications(
        groupId,
        collectionId,
        decisionId,
        restaurantId,
        'tiered'
      );

      // Should send notification to member1 (opted in)
      expect(
        notificationService.sendDecisionResultNotification
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          groupName: 'Lunch Crew',
          collectionName: 'Downtown Favorites',
          restaurantName: 'The Best Pizza Place',
          decisionType: 'tiered',
        }),
        expect.objectContaining({
          userId: mockMember1._id,
          user: mockMember1,
        })
      );

      // Should NOT send notification to member2 (opted out of completed notifications)
      expect(
        notificationService.sendDecisionResultNotification
      ).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: mockMember2._id,
        })
      );
    });

    it('should handle random decision type', async () => {
      await sendDecisionCompletedNotifications(
        groupId,
        collectionId,
        decisionId,
        restaurantId,
        'random'
      );

      expect(
        notificationService.sendDecisionResultNotification
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          decisionType: 'random',
        }),
        expect.anything()
      );
    });

    it('should include shortened URL in notification data', async () => {
      await sendDecisionCompletedNotifications(
        groupId,
        collectionId,
        decisionId,
        restaurantId,
        'tiered'
      );

      expect(urlShortener.shortenUrl).toHaveBeenCalledWith(
        expect.stringContaining(`/collections/${collectionId}`),
        30
      );

      expect(
        notificationService.sendDecisionResultNotification
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          shortUrl: 'https://short.url/xyz789',
        }),
        expect.anything()
      );
    });

    it('should handle missing group gracefully', async () => {
      mockGroupsCollection.findOne.mockResolvedValue(null);

      await expect(
        sendDecisionCompletedNotifications(
          groupId,
          collectionId,
          decisionId,
          restaurantId,
          'tiered'
        )
      ).resolves.not.toThrow();

      expect(
        notificationService.sendDecisionResultNotification
      ).not.toHaveBeenCalled();
    });

    it('should handle missing collection gracefully', async () => {
      mockCollectionsCollection.findOne.mockResolvedValue(null);

      await expect(
        sendDecisionCompletedNotifications(
          groupId,
          collectionId,
          decisionId,
          restaurantId,
          'tiered'
        )
      ).resolves.not.toThrow();

      expect(
        notificationService.sendDecisionResultNotification
      ).not.toHaveBeenCalled();
    });

    it('should handle missing restaurant gracefully', async () => {
      mockRestaurantsCollection.findOne.mockResolvedValue(null);

      await expect(
        sendDecisionCompletedNotifications(
          groupId,
          collectionId,
          decisionId,
          restaurantId,
          'tiered'
        )
      ).resolves.not.toThrow();

      expect(
        notificationService.sendDecisionResultNotification
      ).not.toHaveBeenCalled();
    });

    it('should handle notification errors gracefully', async () => {
      (
        notificationService.sendDecisionResultNotification as jest.Mock
      ).mockRejectedValue(new Error('Notification failed'));

      // Should not throw - errors are caught and logged
      await expect(
        sendDecisionCompletedNotifications(
          groupId,
          collectionId,
          decisionId,
          restaurantId,
          'tiered'
        )
      ).resolves.not.toThrow();
    });

    it('should send to all members including admins', async () => {
      const adminId = mockGroup.adminIds[0];
      const mockAdmin = {
        _id: adminId,
        name: 'Admin User',
        email: 'admin@example.com',
        smsOptIn: true,
        smsPhoneNumber: '+15555559999',
        preferences: {
          notificationSettings: {
            groupDecisions: {
              started: true,
              completed: true,
            },
            emailEnabled: true,
            smsEnabled: true,
            pushEnabled: true,
          },
        },
      };

      mockUsersCollection.find.mockReturnValue({
        toArray: jest
          .fn()
          .mockResolvedValue([mockAdmin, mockMember1, mockMember2]),
      });

      await sendDecisionCompletedNotifications(
        groupId,
        collectionId,
        decisionId,
        restaurantId,
        'tiered'
      );

      expect(
        notificationService.sendDecisionResultNotification
      ).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: adminId,
          user: mockAdmin,
        })
      );
    });
  });
});
