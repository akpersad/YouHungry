/**
 * Tests for the multi-channel notification orchestration facade.
 *
 * SAFETY: every channel implementation (SMS/Twilio, email/Resend, web push,
 * in-app/Mongo, toast) and the database are replaced with factory mocks below
 * so the real modules never load and no real send can ever happen.
 */

// Mock Twilio defensively (the sms-notifications factory mock below means it
// should never load, but this guarantees no real client even if mocks change)
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

// Channel implementations — factory mocks so the real modules (which construct
// live Twilio/Resend/web-push clients at import time) are never executed
jest.mock('@/lib/sms-notifications', () => ({
  smsNotifications: {
    sendGroupDecisionNotification: jest.fn(),
    sendDecisionResultNotification: jest.fn(),
    sendFriendRequestNotification: jest.fn(),
    sendGroupInvitationNotification: jest.fn(),
    sendAdminAlert: jest.fn(),
  },
}));
jest.mock('@/lib/in-app-notifications', () => ({
  inAppNotifications: {
    createGroupDecisionNotification: jest.fn(),
    createFriendRequestNotification: jest.fn(),
    createGroupInvitationNotification: jest.fn(),
    createDecisionResultNotification: jest.fn(),
    createAdminAlertNotification: jest.fn(),
  },
}));
jest.mock('@/lib/push-service', () => ({
  pushService: {
    sendGroupDecisionNotification: jest.fn(),
    sendFriendRequestNotification: jest.fn(),
    sendGroupInvitationNotification: jest.fn(),
    sendDecisionResultNotification: jest.fn(),
  },
}));
jest.mock('@/lib/toast-notifications', () => ({
  ToastNotificationService: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    groupDecisionStarted: jest.fn(),
    friendRequestSent: jest.fn(),
    smsNotificationFailed: jest.fn(),
  },
}));
jest.mock('@/lib/user-email-notifications', () => ({
  userEmailNotificationService: {
    sendUserNotification: jest.fn(),
  },
}));
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn(),
}));

import { ObjectId } from 'mongodb';
import { notificationService } from '@/lib/notification-service';
import { smsNotifications } from '@/lib/sms-notifications';
import { inAppNotifications } from '@/lib/in-app-notifications';
import { pushService } from '@/lib/push-service';
import { ToastNotificationService } from '@/lib/toast-notifications';
import { userEmailNotificationService } from '@/lib/user-email-notifications';
import { logger } from '@/lib/logger';

const asMock = (fn: unknown): jest.Mock => fn as jest.Mock;

describe('Notification Service', () => {
  const mockUserId = new ObjectId();
  const mockUser = {
    _id: mockUserId,
    clerkId: 'user_123',
    email: 'test@example.com',
    name: 'Test User',
    smsOptIn: true,
    smsPhoneNumber: '+18777804236',
    phoneVerified: true,
    pushSubscriptions: [
      {
        endpoint: 'https://example.com/push',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key',
        },
        subscribedAt: new Date(),
      },
    ],
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

  const allChannelsEnabled = {
    smsEnabled: true,
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    toastEnabled: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Deterministic happy-path defaults; individual tests override to simulate failures
    asMock(smsNotifications.sendGroupDecisionNotification).mockResolvedValue({
      success: true,
    });
    asMock(smsNotifications.sendDecisionResultNotification).mockResolvedValue({
      success: true,
    });
    asMock(smsNotifications.sendFriendRequestNotification).mockResolvedValue({
      success: true,
    });
    asMock(smsNotifications.sendGroupInvitationNotification).mockResolvedValue({
      success: true,
    });
    asMock(smsNotifications.sendAdminAlert).mockResolvedValue({
      success: true,
    });
    asMock(
      inAppNotifications.createGroupDecisionNotification
    ).mockResolvedValue({});
    asMock(
      inAppNotifications.createFriendRequestNotification
    ).mockResolvedValue({});
    asMock(
      inAppNotifications.createGroupInvitationNotification
    ).mockResolvedValue({});
    asMock(
      inAppNotifications.createDecisionResultNotification
    ).mockResolvedValue({});
    asMock(inAppNotifications.createAdminAlertNotification).mockResolvedValue(
      {}
    );
    asMock(pushService.sendGroupDecisionNotification).mockResolvedValue({
      sent: 1,
      failed: 0,
    });
    asMock(pushService.sendFriendRequestNotification).mockResolvedValue(true);
    asMock(pushService.sendGroupInvitationNotification).mockResolvedValue(true);
    asMock(pushService.sendDecisionResultNotification).mockResolvedValue({
      sent: 1,
      failed: 0,
    });
    asMock(userEmailNotificationService.sendUserNotification).mockResolvedValue(
      { success: true }
    );
  });

  describe('sendGroupDecisionNotification', () => {
    const data = {
      groupName: 'Test Group',
      groupId: new ObjectId(),
      decisionId: new ObjectId(),
      decisionType: 'tiered' as const,
      deadline: new Date('2025-10-15T18:00:00Z'),
      collectionName: 'Downtown Favorites',
      collectionUrl: 'https://example.com/collections/abc',
      shortUrl: 'https://short.url/abc123',
      createdByName: 'John Doe',
    };

    it('should send notifications through all enabled channels', async () => {
      await notificationService.sendGroupDecisionNotification(data, {
        userId: mockUserId,
        user: mockUser,
        ...allChannelsEnabled,
      });

      expect(
        smsNotifications.sendGroupDecisionNotification
      ).toHaveBeenCalledWith(
        mockUser.smsPhoneNumber,
        data.groupName,
        data.decisionType,
        data.deadline,
        data.groupId.toString(),
        data.shortUrl
      );

      expect(
        userEmailNotificationService.sendUserNotification
      ).toHaveBeenCalledWith({
        type: 'group_decision',
        recipientEmail: mockUser.email,
        recipientName: mockUser.name,
        groupName: data.groupName,
        groupId: data.groupId.toString(),
        decisionId: data.decisionId.toString(),
        decisionType: data.decisionType,
        deadline: data.deadline,
        collectionName: data.collectionName,
        collectionUrl: data.collectionUrl,
        createdByName: data.createdByName,
      });

      expect(
        inAppNotifications.createGroupDecisionNotification
      ).toHaveBeenCalledWith(
        mockUserId,
        data.groupName,
        data.decisionType,
        data.groupId,
        data.decisionId
      );

      expect(pushService.sendGroupDecisionNotification).toHaveBeenCalledWith(
        [mockUser.pushSubscriptions[0]],
        data.groupName,
        data.decisionType,
        data.deadline,
        data.collectionUrl
      );

      expect(
        ToastNotificationService.groupDecisionStarted
      ).toHaveBeenCalledWith(data.groupName, data.decisionType);

      // Push success path logs confirmation
      expect(logger.info).toHaveBeenCalledWith(
        '✅ Push notification sent successfully for group decision',
        expect.objectContaining({ groupName: data.groupName })
      );
    });

    it('should skip SMS when user has not opted in', async () => {
      await notificationService.sendGroupDecisionNotification(data, {
        userId: mockUserId,
        user: { ...mockUser, smsOptIn: false },
        ...allChannelsEnabled,
      });

      expect(
        smsNotifications.sendGroupDecisionNotification
      ).not.toHaveBeenCalled();
      expect(
        inAppNotifications.createGroupDecisionNotification
      ).toHaveBeenCalled();
      expect(pushService.sendGroupDecisionNotification).toHaveBeenCalled();
      expect(ToastNotificationService.groupDecisionStarted).toHaveBeenCalled();
    });

    it('should skip SMS when phone is not verified', async () => {
      await notificationService.sendGroupDecisionNotification(data, {
        userId: mockUserId,
        user: { ...mockUser, phoneVerified: false },
        ...allChannelsEnabled,
      });

      expect(
        smsNotifications.sendGroupDecisionNotification
      ).not.toHaveBeenCalled();
    });

    it('should skip email when the user preference disables it even if the option enables it', async () => {
      const userWithEmailOff = {
        ...mockUser,
        preferences: {
          ...mockUser.preferences,
          notificationSettings: {
            ...mockUser.preferences.notificationSettings,
            emailEnabled: false,
          },
        },
      };

      await notificationService.sendGroupDecisionNotification(data, {
        userId: mockUserId,
        user: userWithEmailOff,
        ...allChannelsEnabled,
      });

      expect(
        userEmailNotificationService.sendUserNotification
      ).not.toHaveBeenCalled();
    });

    it('should skip email when the emailEnabled option is not set', async () => {
      await notificationService.sendGroupDecisionNotification(data, {
        userId: mockUserId,
        user: mockUser,
        smsEnabled: false,
        pushEnabled: true,
        inAppEnabled: true,
        toastEnabled: true,
      });

      expect(
        userEmailNotificationService.sendUserNotification
      ).not.toHaveBeenCalled();
    });

    it('should redirect SMS to TWILIO_TO_PHONE_NUMBER in development', async () => {
      const nodeEnv = jest.replaceProperty(
        process.env as { NODE_ENV?: string },
        'NODE_ENV',
        'development'
      );
      const originalTwilioTo = process.env.TWILIO_TO_PHONE_NUMBER;
      process.env.TWILIO_TO_PHONE_NUMBER = '+15550001111';

      try {
        await notificationService.sendGroupDecisionNotification(data, {
          userId: mockUserId,
          user: mockUser,
          ...allChannelsEnabled,
        });

        expect(
          smsNotifications.sendGroupDecisionNotification
        ).toHaveBeenCalledWith(
          '+15550001111',
          data.groupName,
          data.decisionType,
          data.deadline,
          data.groupId.toString(),
          data.shortUrl
        );
      } finally {
        nodeEnv.restore();
        if (originalTwilioTo === undefined) {
          delete process.env.TWILIO_TO_PHONE_NUMBER;
        } else {
          process.env.TWILIO_TO_PHONE_NUMBER = originalTwilioTo;
        }
      }
    });

    it('should skip push and warn when pushEnabled is false', async () => {
      await notificationService.sendGroupDecisionNotification(data, {
        userId: mockUserId,
        user: mockUser,
        ...allChannelsEnabled,
        pushEnabled: false,
      });

      expect(pushService.sendGroupDecisionNotification).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        '⚠️ Skipping push notification',
        expect.objectContaining({ reason: 'Push disabled' })
      );
    });

    it('should skip push and warn when the user has no push subscriptions', async () => {
      const { pushSubscriptions: _unused, ...userWithoutPush } = mockUser;

      await notificationService.sendGroupDecisionNotification(data, {
        userId: mockUserId,
        user: userWithoutPush as typeof mockUser,
        ...allChannelsEnabled,
      });

      expect(pushService.sendGroupDecisionNotification).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        '⚠️ Skipping push notification',
        expect.objectContaining({ reason: 'No push subscriptions' })
      );
    });

    it('should skip push and warn when the subscription list is empty', async () => {
      await notificationService.sendGroupDecisionNotification(data, {
        userId: mockUserId,
        user: { ...mockUser, pushSubscriptions: [] },
        ...allChannelsEnabled,
      });

      expect(pushService.sendGroupDecisionNotification).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        '⚠️ Skipping push notification',
        expect.objectContaining({ reason: 'No subscriptions available' })
      );
    });

    it('should skip in-app when inAppEnabled is false', async () => {
      await notificationService.sendGroupDecisionNotification(data, {
        userId: mockUserId,
        user: mockUser,
        ...allChannelsEnabled,
        inAppEnabled: false,
      });

      expect(
        inAppNotifications.createGroupDecisionNotification
      ).not.toHaveBeenCalled();
    });

    it('should skip toast when toastEnabled is false', async () => {
      await notificationService.sendGroupDecisionNotification(data, {
        userId: mockUserId,
        user: mockUser,
        ...allChannelsEnabled,
        toastEnabled: false,
      });

      expect(
        ToastNotificationService.groupDecisionStarted
      ).not.toHaveBeenCalled();
    });

    it('should still attempt other channels when SMS fails and show a failure toast', async () => {
      asMock(smsNotifications.sendGroupDecisionNotification).mockRejectedValue(
        new Error('SMS failed')
      );

      await expect(
        notificationService.sendGroupDecisionNotification(data, {
          userId: mockUserId,
          user: mockUser,
          ...allChannelsEnabled,
        })
      ).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send SMS group decision notification:',
        expect.any(Error)
      );
      expect(ToastNotificationService.smsNotificationFailed).toHaveBeenCalled();
      expect(
        userEmailNotificationService.sendUserNotification
      ).toHaveBeenCalled();
      expect(
        inAppNotifications.createGroupDecisionNotification
      ).toHaveBeenCalled();
      expect(pushService.sendGroupDecisionNotification).toHaveBeenCalled();
    });

    it('should not show a failure toast for SMS errors when toast is disabled', async () => {
      asMock(smsNotifications.sendGroupDecisionNotification).mockRejectedValue(
        new Error('SMS failed')
      );

      await notificationService.sendGroupDecisionNotification(data, {
        userId: mockUserId,
        user: mockUser,
        ...allChannelsEnabled,
        toastEnabled: false,
      });

      expect(
        ToastNotificationService.smsNotificationFailed
      ).not.toHaveBeenCalled();
    });

    it('should resolve and log each error when every async channel fails', async () => {
      asMock(smsNotifications.sendGroupDecisionNotification).mockRejectedValue(
        new Error('SMS down')
      );
      asMock(
        userEmailNotificationService.sendUserNotification
      ).mockRejectedValue(new Error('Email down'));
      asMock(
        inAppNotifications.createGroupDecisionNotification
      ).mockRejectedValue(new Error('DB down'));
      asMock(pushService.sendGroupDecisionNotification).mockRejectedValue(
        new Error('Push down')
      );

      await expect(
        notificationService.sendGroupDecisionNotification(data, {
          userId: mockUserId,
          user: mockUser,
          ...allChannelsEnabled,
        })
      ).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send SMS group decision notification:',
        expect.any(Error)
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send email group decision notification:',
        expect.any(Error)
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create in-app group decision notification:',
        expect.any(Error)
      );
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to send push group decision notification:',
        expect.any(Error)
      );
      // Every channel was still attempted despite failures
      expect(smsNotifications.sendGroupDecisionNotification).toHaveBeenCalled();
      expect(
        userEmailNotificationService.sendUserNotification
      ).toHaveBeenCalled();
      expect(
        inAppNotifications.createGroupDecisionNotification
      ).toHaveBeenCalled();
      expect(pushService.sendGroupDecisionNotification).toHaveBeenCalled();
    });

    it('should rethrow when a synchronous step (toast) throws', async () => {
      asMock(ToastNotificationService.groupDecisionStarted).mockImplementation(
        () => {
          throw new Error('toast crashed');
        }
      );

      await expect(
        notificationService.sendGroupDecisionNotification(data, {
          userId: mockUserId,
          user: mockUser,
          ...allChannelsEnabled,
        })
      ).rejects.toThrow('toast crashed');

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send group decision notifications:',
        expect.any(Error)
      );
    });
  });

  describe('sendFriendRequestNotification', () => {
    const data = {
      requesterName: 'John Doe',
      requesterId: new ObjectId(),
    };

    it('should send friend request notifications through all channels', async () => {
      await notificationService.sendFriendRequestNotification(data, {
        userId: mockUserId,
        user: mockUser,
        ...allChannelsEnabled,
      });

      expect(
        smsNotifications.sendFriendRequestNotification
      ).toHaveBeenCalledWith(mockUser.smsPhoneNumber, data.requesterName);

      expect(
        userEmailNotificationService.sendUserNotification
      ).toHaveBeenCalledWith({
        type: 'friend_request',
        recipientEmail: mockUser.email,
        recipientName: mockUser.name,
        requesterName: data.requesterName,
        requesterId: data.requesterId.toString(),
      });

      expect(
        inAppNotifications.createFriendRequestNotification
      ).toHaveBeenCalledWith(mockUserId, data.requesterName, data.requesterId);

      expect(pushService.sendFriendRequestNotification).toHaveBeenCalledWith(
        mockUser.pushSubscriptions[0],
        data.requesterName
      );

      expect(ToastNotificationService.friendRequestSent).toHaveBeenCalledWith(
        data.requesterName
      );
    });

    it('should skip push when the user has no subscriptions', async () => {
      await notificationService.sendFriendRequestNotification(data, {
        userId: mockUserId,
        user: { ...mockUser, pushSubscriptions: [] },
        ...allChannelsEnabled,
      });

      expect(pushService.sendFriendRequestNotification).not.toHaveBeenCalled();
    });

    it('should resolve and log each error when every async channel fails', async () => {
      asMock(smsNotifications.sendFriendRequestNotification).mockRejectedValue(
        new Error('SMS down')
      );
      asMock(
        userEmailNotificationService.sendUserNotification
      ).mockRejectedValue(new Error('Email down'));
      asMock(
        inAppNotifications.createFriendRequestNotification
      ).mockRejectedValue(new Error('DB down'));
      asMock(pushService.sendFriendRequestNotification).mockRejectedValue(
        new Error('Push down')
      );

      await expect(
        notificationService.sendFriendRequestNotification(data, {
          userId: mockUserId,
          user: mockUser,
          ...allChannelsEnabled,
        })
      ).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send SMS friend request notification:',
        expect.any(Error)
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send email friend request notification:',
        expect.any(Error)
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create in-app friend request notification:',
        expect.any(Error)
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send push friend request notification:',
        expect.any(Error)
      );
      expect(ToastNotificationService.smsNotificationFailed).toHaveBeenCalled();
      // Toast success message still fires; failures degrade per-channel
      expect(ToastNotificationService.friendRequestSent).toHaveBeenCalled();
    });

    it('should rethrow when a synchronous step (toast) throws', async () => {
      asMock(ToastNotificationService.friendRequestSent).mockImplementation(
        () => {
          throw new Error('toast crashed');
        }
      );

      await expect(
        notificationService.sendFriendRequestNotification(data, {
          userId: mockUserId,
          user: mockUser,
          ...allChannelsEnabled,
        })
      ).rejects.toThrow('toast crashed');

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send friend request notifications:',
        expect.any(Error)
      );
    });
  });

  describe('sendGroupInvitationNotification', () => {
    const data = {
      groupName: 'Food Lovers',
      groupId: new ObjectId(),
      inviterName: 'Jane Smith',
      inviterId: new ObjectId(),
    };

    it('should send group invitation notifications through all channels', async () => {
      await notificationService.sendGroupInvitationNotification(data, {
        userId: mockUserId,
        user: mockUser,
        ...allChannelsEnabled,
      });

      expect(
        smsNotifications.sendGroupInvitationNotification
      ).toHaveBeenCalledWith(
        mockUser.smsPhoneNumber,
        data.groupName,
        data.inviterName
      );

      expect(
        userEmailNotificationService.sendUserNotification
      ).toHaveBeenCalledWith({
        type: 'group_invitation',
        recipientEmail: mockUser.email,
        recipientName: mockUser.name,
        groupName: data.groupName,
        groupId: data.groupId.toString(),
        inviterName: data.inviterName,
        inviterId: data.inviterId.toString(),
      });

      expect(
        inAppNotifications.createGroupInvitationNotification
      ).toHaveBeenCalledWith(
        mockUserId,
        data.groupName,
        data.inviterName,
        data.groupId,
        data.inviterId
      );

      expect(pushService.sendGroupInvitationNotification).toHaveBeenCalledWith(
        mockUser.pushSubscriptions[0],
        data.groupName,
        data.inviterName
      );

      expect(ToastNotificationService.info).toHaveBeenCalledWith(
        'Group invitation sent',
        expect.objectContaining({
          description: `Invitation sent to join ${data.groupName}`,
        })
      );
    });

    it('should resolve and log each error when every async channel fails', async () => {
      asMock(
        smsNotifications.sendGroupInvitationNotification
      ).mockRejectedValue(new Error('SMS down'));
      asMock(
        userEmailNotificationService.sendUserNotification
      ).mockRejectedValue(new Error('Email down'));
      asMock(
        inAppNotifications.createGroupInvitationNotification
      ).mockRejectedValue(new Error('DB down'));
      asMock(pushService.sendGroupInvitationNotification).mockRejectedValue(
        new Error('Push down')
      );

      await expect(
        notificationService.sendGroupInvitationNotification(data, {
          userId: mockUserId,
          user: mockUser,
          ...allChannelsEnabled,
        })
      ).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send SMS group invitation notification:',
        expect.any(Error)
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send email group invitation notification:',
        expect.any(Error)
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create in-app group invitation notification:',
        expect.any(Error)
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send push group invitation notification:',
        expect.any(Error)
      );
    });

    it('should rethrow when a synchronous step (toast) throws', async () => {
      asMock(ToastNotificationService.info).mockImplementation(() => {
        throw new Error('toast crashed');
      });

      await expect(
        notificationService.sendGroupInvitationNotification(data, {
          userId: mockUserId,
          user: mockUser,
          ...allChannelsEnabled,
        })
      ).rejects.toThrow('toast crashed');

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send group invitation notifications:',
        expect.any(Error)
      );
    });
  });

  describe('sendDecisionResultNotification', () => {
    const data = {
      groupName: 'Test Group',
      groupId: new ObjectId(),
      decisionId: new ObjectId(),
      restaurantName: 'Pizza Palace',
      restaurantId: new ObjectId(),
      collectionName: 'Downtown Favorites',
      collectionUrl: 'https://example.com/collections/abc',
      shortUrl: 'https://short.url/xyz789',
      decisionType: 'random' as const,
    };

    it('should send decision result notifications through all enabled channels', async () => {
      await notificationService.sendDecisionResultNotification(data, {
        userId: mockUserId,
        user: mockUser,
        ...allChannelsEnabled,
      });

      expect(
        smsNotifications.sendDecisionResultNotification
      ).toHaveBeenCalledWith(
        mockUser.smsPhoneNumber,
        data.groupName,
        data.restaurantName,
        'random',
        data.shortUrl
      );

      expect(
        userEmailNotificationService.sendUserNotification
      ).toHaveBeenCalledWith({
        type: 'decision_result',
        recipientEmail: mockUser.email,
        recipientName: mockUser.name,
        groupName: data.groupName,
        groupId: data.groupId.toString(),
        decisionId: data.decisionId.toString(),
        restaurantName: data.restaurantName,
        restaurantId: data.restaurantId.toString(),
        collectionName: data.collectionName,
        collectionUrl: data.collectionUrl,
        decisionType: data.decisionType,
      });

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

      expect(pushService.sendDecisionResultNotification).toHaveBeenCalledWith(
        mockUser.pushSubscriptions,
        data.groupName,
        data.restaurantName
      );

      expect(ToastNotificationService.success).toHaveBeenCalledWith(
        `${data.groupName} Decision Complete`,
        expect.objectContaining({
          description: `The group decided on ${data.restaurantName}!`,
        })
      );
    });

    it('should default the SMS decision type to tiered when not provided', async () => {
      const { decisionType: _unused, ...dataWithoutType } = data;

      await notificationService.sendDecisionResultNotification(
        dataWithoutType,
        {
          userId: mockUserId,
          user: mockUser,
          ...allChannelsEnabled,
        }
      );

      expect(
        smsNotifications.sendDecisionResultNotification
      ).toHaveBeenCalledWith(
        mockUser.smsPhoneNumber,
        data.groupName,
        data.restaurantName,
        'tiered',
        data.shortUrl
      );
    });

    it('should only use defaulted channels when no channel flags are provided', async () => {
      await notificationService.sendDecisionResultNotification(data, {
        userId: mockUserId,
        user: mockUser,
      });

      // SMS and email require explicit opt-in flags
      expect(
        smsNotifications.sendDecisionResultNotification
      ).not.toHaveBeenCalled();
      expect(
        userEmailNotificationService.sendUserNotification
      ).not.toHaveBeenCalled();
      // Push, in-app, and toast default to enabled
      expect(
        inAppNotifications.createDecisionResultNotification
      ).toHaveBeenCalled();
      expect(pushService.sendDecisionResultNotification).toHaveBeenCalled();
      expect(ToastNotificationService.success).toHaveBeenCalled();
    });

    it('should resolve and log each error when every async channel fails', async () => {
      asMock(smsNotifications.sendDecisionResultNotification).mockRejectedValue(
        new Error('SMS down')
      );
      asMock(
        userEmailNotificationService.sendUserNotification
      ).mockRejectedValue(new Error('Email down'));
      asMock(
        inAppNotifications.createDecisionResultNotification
      ).mockRejectedValue(new Error('DB down'));
      asMock(pushService.sendDecisionResultNotification).mockRejectedValue(
        new Error('Push down')
      );

      await expect(
        notificationService.sendDecisionResultNotification(data, {
          userId: mockUserId,
          user: mockUser,
          ...allChannelsEnabled,
        })
      ).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send SMS decision result notification:',
        expect.any(Error)
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send email decision result notification:',
        expect.any(Error)
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create in-app decision result notification:',
        expect.any(Error)
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send push decision result notification:',
        expect.any(Error)
      );
    });

    it('should rethrow when a synchronous step (toast) throws', async () => {
      asMock(ToastNotificationService.success).mockImplementation(() => {
        throw new Error('toast crashed');
      });

      await expect(
        notificationService.sendDecisionResultNotification(data, {
          userId: mockUserId,
          user: mockUser,
          ...allChannelsEnabled,
        })
      ).rejects.toThrow('toast crashed');

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send decision result notifications:',
        expect.any(Error)
      );
    });
  });

  describe('sendAdminAlert', () => {
    const alertType = 'cost_spike' as const;
    const message = 'Daily costs exceeded threshold';
    const details = { amount: 100 };
    const adminPhone = '+15550001111';

    beforeEach(() => {
      process.env.ADMIN_ALERT_PHONE = adminPhone;
    });

    afterEach(() => {
      delete process.env.ADMIN_ALERT_PHONE;
    });

    it('should send admin alert through multiple channels', async () => {
      await notificationService.sendAdminAlert(
        mockUserId,
        alertType,
        message,
        details
      );

      expect(smsNotifications.sendAdminAlert).toHaveBeenCalledWith(
        adminPhone, // From ADMIN_ALERT_PHONE
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

    it('should skip the SMS channel with a warning when ADMIN_ALERT_PHONE is unset', async () => {
      delete process.env.ADMIN_ALERT_PHONE;

      await notificationService.sendAdminAlert(
        mockUserId,
        alertType,
        message,
        details
      );

      expect(smsNotifications.sendAdminAlert).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('ADMIN_ALERT_PHONE is not set')
      );
      expect(
        inAppNotifications.createAdminAlertNotification
      ).toHaveBeenCalledWith(mockUserId, alertType, message, details);
    });

    it('should throw and skip in-app when the admin SMS fails', async () => {
      asMock(smsNotifications.sendAdminAlert).mockRejectedValue(
        new Error('Twilio down')
      );

      await expect(
        notificationService.sendAdminAlert(mockUserId, alertType, message)
      ).rejects.toThrow('Twilio down');

      expect(
        inAppNotifications.createAdminAlertNotification
      ).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send admin alert:',
        expect.any(Error)
      );
    });

    it('should throw when the in-app notification fails', async () => {
      asMock(inAppNotifications.createAdminAlertNotification).mockRejectedValue(
        new Error('DB down')
      );

      await expect(
        notificationService.sendAdminAlert(mockUserId, alertType, message)
      ).rejects.toThrow('DB down');

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send admin alert:',
        expect.any(Error)
      );
    });
  });
});
