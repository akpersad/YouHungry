import { notificationService } from '@/lib/notification-service';
import { ObjectId } from 'mongodb';

// Mock Twilio first
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

// Mock dependencies
jest.mock('@/lib/sms-notifications');
jest.mock('@/lib/in-app-notifications');
jest.mock('@/lib/push-notifications');
jest.mock('@/lib/toast-notifications');
jest.mock('@/lib/logger');

describe('Notification Service', () => {
  const mockUserId = new ObjectId();
  const mockUser = {
    _id: mockUserId,
    clerkId: 'user_123',
    email: 'test@example.com',
    name: 'Test User',
    smsOptIn: true,
    smsPhoneNumber: '+18777804236',
    preferences: {
      locationSettings: {
        city: 'Test City',
        state: 'Test State',
        country: 'US',
        timezone: 'America/New_York',
      },
      notificationSettings: {
        groupDecisions: {
          started: true,
          completed: true,
        },
        friendRequests: true,
        groupInvites: true,
        smsEnabled: true,
        emailEnabled: true,
        pushEnabled: true,
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendGroupDecisionNotification', () => {
    it('should send notifications through all enabled channels', async () => {
      const { smsNotifications } = require('@/lib/sms-notifications');
      const { inAppNotifications } = require('@/lib/in-app-notifications');
      const { pushNotifications } = require('@/lib/push-notifications');
      const { ToastNotificationService } = require('@/lib/toast-notifications');

      // Mock successful responses
      smsNotifications.sendGroupDecisionNotification.mockResolvedValue({
        success: true,
      });
      inAppNotifications.createGroupDecisionNotification.mockResolvedValue({});
      pushNotifications.sendGroupDecisionNotification.mockResolvedValue(
        undefined
      );
      ToastNotificationService.groupDecisionStarted = jest.fn();

      const data = {
        groupName: 'Test Group',
        groupId: new ObjectId(),
        decisionId: new ObjectId(),
        decisionType: 'tiered' as const,
        deadline: new Date(),
      };

      const options = {
        userId: mockUserId,
        user: mockUser,
        smsEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        toastEnabled: true,
      };

      await notificationService.sendGroupDecisionNotification(data, options);

      expect(
        smsNotifications.sendGroupDecisionNotification
      ).toHaveBeenCalledWith(
        mockUser.smsPhoneNumber,
        data.groupName,
        data.decisionType,
        data.deadline,
        data.groupId.toString(),
        undefined // shortUrl
      );

      expect(
        inAppNotifications.createGroupDecisionNotification
      ).toHaveBeenCalledWith(
        mockUserId,
        data.groupName,
        data.decisionType,
        data.groupId,
        data.decisionId
      );

      expect(
        pushNotifications.sendGroupDecisionNotification
      ).toHaveBeenCalledWith(data.groupName, data.decisionType, data.deadline);

      expect(
        ToastNotificationService.groupDecisionStarted
      ).toHaveBeenCalledWith(data.groupName, data.decisionType);
    });

    it('should skip SMS when user has not opted in', async () => {
      const { smsNotifications } = require('@/lib/sms-notifications');
      const { inAppNotifications } = require('@/lib/in-app-notifications');
      const { pushNotifications } = require('@/lib/push-notifications');
      const { ToastNotificationService } = require('@/lib/toast-notifications');

      // Mock successful responses
      inAppNotifications.createGroupDecisionNotification.mockResolvedValue({});
      pushNotifications.sendGroupDecisionNotification.mockResolvedValue(
        undefined
      );
      ToastNotificationService.groupDecisionStarted = jest.fn();

      const userWithoutSMS = {
        ...mockUser,
        smsOptIn: false,
      };

      const data = {
        groupName: 'Test Group',
        groupId: new ObjectId(),
        decisionId: new ObjectId(),
        decisionType: 'tiered' as const,
        deadline: new Date(),
      };

      const options = {
        userId: mockUserId,
        user: userWithoutSMS,
        smsEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        toastEnabled: true,
      };

      await notificationService.sendGroupDecisionNotification(data, options);

      expect(
        smsNotifications.sendGroupDecisionNotification
      ).not.toHaveBeenCalled();
      expect(
        inAppNotifications.createGroupDecisionNotification
      ).toHaveBeenCalled();
      expect(
        pushNotifications.sendGroupDecisionNotification
      ).toHaveBeenCalled();
      expect(ToastNotificationService.groupDecisionStarted).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const { smsNotifications } = require('@/lib/sms-notifications');
      const { inAppNotifications } = require('@/lib/in-app-notifications');
      const { pushNotifications } = require('@/lib/push-notifications');
      const { ToastNotificationService } = require('@/lib/toast-notifications');

      // Mock SMS failure
      smsNotifications.sendGroupDecisionNotification.mockRejectedValue(
        new Error('SMS failed')
      );
      inAppNotifications.createGroupDecisionNotification.mockResolvedValue({});
      pushNotifications.sendGroupDecisionNotification.mockResolvedValue(
        undefined
      );
      ToastNotificationService.groupDecisionStarted = jest.fn();
      ToastNotificationService.smsNotificationFailed = jest.fn();

      const data = {
        groupName: 'Test Group',
        groupId: new ObjectId(),
        decisionId: new ObjectId(),
        decisionType: 'tiered' as const,
        deadline: new Date(),
      };

      const options = {
        userId: mockUserId,
        user: mockUser,
        smsEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        toastEnabled: true,
      };

      // Should not throw error
      await expect(
        notificationService.sendGroupDecisionNotification(data, options)
      ).resolves.not.toThrow();

      expect(ToastNotificationService.smsNotificationFailed).toHaveBeenCalled();
    });
  });

  describe('sendFriendRequestNotification', () => {
    it('should send friend request notifications through all channels', async () => {
      const { smsNotifications } = require('@/lib/sms-notifications');
      const { inAppNotifications } = require('@/lib/in-app-notifications');
      const { pushNotifications } = require('@/lib/push-notifications');
      const { ToastNotificationService } = require('@/lib/toast-notifications');

      // Mock successful responses
      smsNotifications.sendFriendRequestNotification.mockResolvedValue({
        success: true,
      });
      inAppNotifications.createFriendRequestNotification.mockResolvedValue({});
      pushNotifications.sendFriendRequestNotification.mockResolvedValue(
        undefined
      );
      ToastNotificationService.friendRequestSent = jest.fn();

      const data = {
        requesterName: 'John Doe',
        requesterId: new ObjectId(),
      };

      const options = {
        userId: mockUserId,
        user: mockUser,
        smsEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        toastEnabled: true,
      };

      await notificationService.sendFriendRequestNotification(data, options);

      expect(
        smsNotifications.sendFriendRequestNotification
      ).toHaveBeenCalledWith(mockUser.smsPhoneNumber, data.requesterName);

      expect(
        inAppNotifications.createFriendRequestNotification
      ).toHaveBeenCalledWith(mockUserId, data.requesterName, data.requesterId);

      expect(
        pushNotifications.sendFriendRequestNotification
      ).toHaveBeenCalledWith(data.requesterName);

      expect(ToastNotificationService.friendRequestSent).toHaveBeenCalledWith(
        data.requesterName
      );
    });
  });

  describe('sendGroupInvitationNotification', () => {
    it('should send group invitation notifications through all channels', async () => {
      const { smsNotifications } = require('@/lib/sms-notifications');
      const { inAppNotifications } = require('@/lib/in-app-notifications');
      const { pushNotifications } = require('@/lib/push-notifications');
      const { ToastNotificationService } = require('@/lib/toast-notifications');

      // Mock successful responses
      smsNotifications.sendGroupInvitationNotification.mockResolvedValue({
        success: true,
      });
      inAppNotifications.createGroupInvitationNotification.mockResolvedValue(
        {}
      );
      pushNotifications.sendGroupInvitationNotification.mockResolvedValue(
        undefined
      );
      ToastNotificationService.info = jest.fn();

      const data = {
        groupName: 'Food Lovers',
        groupId: new ObjectId(),
        inviterName: 'Jane Smith',
        inviterId: new ObjectId(),
      };

      const options = {
        userId: mockUserId,
        user: mockUser,
        smsEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        toastEnabled: true,
      };

      await notificationService.sendGroupInvitationNotification(data, options);

      expect(
        smsNotifications.sendGroupInvitationNotification
      ).toHaveBeenCalledWith(
        mockUser.smsPhoneNumber,
        data.groupName,
        data.inviterName
      );

      expect(
        inAppNotifications.createGroupInvitationNotification
      ).toHaveBeenCalledWith(
        mockUserId,
        data.groupName,
        data.inviterName,
        data.groupId,
        data.inviterId
      );

      expect(
        pushNotifications.sendGroupInvitationNotification
      ).toHaveBeenCalledWith(data.groupName, data.inviterName);

      expect(ToastNotificationService.info).toHaveBeenCalledWith(
        'Group invitation sent',
        expect.objectContaining({
          description: `Invitation sent to join ${data.groupName}`,
        })
      );
    });
  });

  describe('sendDecisionResultNotification', () => {
    it('should send decision result notifications through enabled channels', async () => {
      const { inAppNotifications } = require('@/lib/in-app-notifications');
      const { pushNotifications } = require('@/lib/push-notifications');
      const { ToastNotificationService } = require('@/lib/toast-notifications');

      // Mock successful responses
      inAppNotifications.createDecisionResultNotification.mockResolvedValue({});
      pushNotifications.sendDecisionResultNotification.mockResolvedValue(
        undefined
      );
      ToastNotificationService.success = jest.fn();

      const data = {
        groupName: 'Test Group',
        groupId: new ObjectId(),
        decisionId: new ObjectId(),
        restaurantName: 'Pizza Palace',
        restaurantId: new ObjectId(),
      };

      const options = {
        userId: mockUserId,
        user: mockUser,
      };

      await notificationService.sendDecisionResultNotification(data, options);

      expect(
        inAppNotifications.createDecisionResultNotification
      ).toHaveBeenCalledWith(
        mockUserId,
        data.groupName,
        data.restaurantName,
        data.groupId,
        data.decisionId,
        data.restaurantId
      );

      expect(
        pushNotifications.sendDecisionResultNotification
      ).toHaveBeenCalledWith(data.groupName, data.restaurantName);

      expect(ToastNotificationService.success).toHaveBeenCalledWith(
        `${data.groupName} Decision Complete`,
        expect.objectContaining({
          description: `The group decided on ${data.restaurantName}!`,
        })
      );
    });
  });

  describe('sendAdminAlert', () => {
    it('should send admin alert through multiple channels', async () => {
      const { smsNotifications } = require('@/lib/sms-notifications');
      const { inAppNotifications } = require('@/lib/in-app-notifications');
      const { ToastNotificationService } = require('@/lib/toast-notifications');

      // Mock successful responses
      smsNotifications.sendAdminAlert.mockResolvedValue({ success: true });
      inAppNotifications.createAdminAlertNotification.mockResolvedValue({});
      ToastNotificationService.error = jest.fn();

      const alertType = 'cost_spike' as const;
      const message = 'Daily costs exceeded threshold';
      const details = { amount: 100 };

      await notificationService.sendAdminAlert(
        mockUserId,
        alertType,
        message,
        details
      );

      expect(smsNotifications.sendAdminAlert).toHaveBeenCalledWith(
        '+18777804236', // Development number
        alertType,
        message
      );

      expect(
        inAppNotifications.createAdminAlertNotification
      ).toHaveBeenCalledWith(mockUserId, alertType, message, details);

      expect(ToastNotificationService.error).toHaveBeenCalledWith(
        'System Alert',
        expect.objectContaining({
          description: message,
        })
      );
    });
  });
});
