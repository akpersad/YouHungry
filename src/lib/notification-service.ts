import { ObjectId } from 'mongodb';
import { smsNotifications } from '@/lib/sms-notifications';
import { inAppNotifications } from '@/lib/in-app-notifications';
import { pushService } from '@/lib/push-service';
import { ToastNotificationService } from '@/lib/toast-notifications';
import { userEmailNotificationService } from '@/lib/user-email-notifications';
import { logger } from '@/lib/logger';
import { User, PushSubscription } from '@/types/database';

export interface NotificationOptions {
  userId: ObjectId | string;
  user?: User;
  smsEnabled?: boolean;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
  toastEnabled?: boolean;
}

export interface GroupDecisionNotificationData {
  groupName: string;
  groupId: ObjectId | string;
  decisionId: ObjectId | string;
  decisionType: 'tiered' | 'random';
  deadline: Date;
  collectionName?: string;
  collectionUrl?: string;
  shortUrl?: string;
  createdByName?: string;
}

export interface FriendRequestNotificationData {
  requesterName: string;
  requesterId: ObjectId | string;
}

export interface GroupInvitationNotificationData {
  groupName: string;
  groupId: ObjectId | string;
  inviterName: string;
  inviterId: ObjectId | string;
}

export interface DecisionResultNotificationData {
  groupName: string;
  groupId: ObjectId | string;
  decisionId: ObjectId | string;
  restaurantName: string;
  restaurantId: ObjectId | string;
  collectionName?: string;
  collectionUrl?: string;
  shortUrl?: string;
  decisionType?: 'tiered' | 'random';
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Send group decision notification through all enabled channels
   */
  async sendGroupDecisionNotification(
    data: GroupDecisionNotificationData,
    options: NotificationOptions
  ): Promise<void> {
    const {
      userId,
      user,
      smsEnabled,
      emailEnabled,
      pushEnabled,
      inAppEnabled,
      toastEnabled,
    } = options;

    try {
      // Determine which channels to use
      const shouldSendSMS =
        smsEnabled &&
        user?.smsOptIn &&
        user?.smsPhoneNumber &&
        user?.phoneVerified;
      const shouldSendEmail =
        emailEnabled &&
        user?.preferences?.notificationSettings?.emailEnabled &&
        user?.email;
      const shouldSendPush = pushEnabled !== false; // Default to true
      const shouldSendInApp = inAppEnabled !== false; // Default to true
      const shouldSendToast = toastEnabled !== false; // Default to true

      const promises: Promise<unknown>[] = [];

      // Send SMS notification
      if (shouldSendSMS && user?.smsPhoneNumber) {
        // Determine phone number based on environment
        const phoneNumber =
          process.env.NODE_ENV === 'development' &&
          process.env.TWILIO_TO_PHONE_NUMBER
            ? process.env.TWILIO_TO_PHONE_NUMBER
            : user.smsPhoneNumber;

        promises.push(
          smsNotifications
            .sendGroupDecisionNotification(
              phoneNumber,
              data.groupName,
              data.decisionType,
              data.deadline,
              data.groupId?.toString(),
              data.shortUrl
            )
            .catch((error) => {
              logger.error(
                'Failed to send SMS group decision notification:',
                error
              );
              if (shouldSendToast && typeof window !== 'undefined') {
                ToastNotificationService.smsNotificationFailed(error);
              }
            })
        );
      }

      // Send email notification
      if (shouldSendEmail && user?.email) {
        promises.push(
          userEmailNotificationService
            .sendUserNotification({
              type: 'group_decision',
              recipientEmail: user.email,
              recipientName: user.name,
              groupName: data.groupName,
              groupId: data.groupId.toString(),
              decisionId: data.decisionId.toString(),
              decisionType: data.decisionType,
              deadline: data.deadline,
              collectionName: data.collectionName,
              collectionUrl: data.collectionUrl,
              createdByName: data.createdByName,
            })
            .catch((error) => {
              logger.error(
                'Failed to send email group decision notification:',
                error
              );
            })
        );
      }

      // Send in-app notification
      if (shouldSendInApp) {
        promises.push(
          inAppNotifications
            .createGroupDecisionNotification(
              userId,
              data.groupName,
              data.decisionType,
              data.groupId,
              data.decisionId
            )
            .catch((error) => {
              logger.error(
                'Failed to create in-app group decision notification:',
                error
              );
            })
        );
      }

      // Send push notification (server-side, works when app is closed)
      logger.info('🔔 Push notification check', {
        shouldSendPush,
        hasPushSubscriptions: !!user?.pushSubscriptions,
        subscriptionCount: user?.pushSubscriptions?.length || 0,
        userId: userId.toString(),
      });

      if (
        shouldSendPush &&
        user?.pushSubscriptions &&
        user.pushSubscriptions.length > 0
      ) {
        logger.info('🚀 Sending push notification for group decision', {
          groupName: data.groupName,
          subscriptionCount: user.pushSubscriptions.length,
          userId: userId.toString(),
        });

        promises.push(
          pushService
            .sendGroupDecisionNotification(
              user.pushSubscriptions as PushSubscription[],
              data.groupName,
              data.decisionType,
              data.deadline,
              data.collectionUrl
            )
            .then(() => {
              logger.info(
                '✅ Push notification sent successfully for group decision',
                {
                  groupName: data.groupName,
                  userId: userId.toString(),
                }
              );
            })
            .catch((error) => {
              logger.error(
                '❌ Failed to send push group decision notification:',
                error
              );
            })
        );
      } else {
        logger.warn('⚠️ Skipping push notification', {
          reason: !shouldSendPush
            ? 'Push disabled'
            : !user?.pushSubscriptions
              ? 'No push subscriptions'
              : 'No subscriptions available',
          userId: userId.toString(),
        });
      }

      // Send toast notification (client-side only)
      if (shouldSendToast && typeof window !== 'undefined') {
        ToastNotificationService.groupDecisionStarted(
          data.groupName,
          data.decisionType
        );
      }

      // Wait for all notifications to complete
      await Promise.allSettled(promises);

      logger.info(
        `Group decision notifications sent for group ${data.groupName}`
      );
    } catch (error) {
      logger.error('Failed to send group decision notifications:', error);
      throw error;
    }
  }

  /**
   * Send friend request notification through all enabled channels
   */
  async sendFriendRequestNotification(
    data: FriendRequestNotificationData,
    options: NotificationOptions
  ): Promise<void> {
    const {
      userId,
      user,
      smsEnabled,
      emailEnabled,
      pushEnabled,
      inAppEnabled,
      toastEnabled,
    } = options;

    try {
      const shouldSendSMS =
        smsEnabled &&
        user?.smsOptIn &&
        user?.smsPhoneNumber &&
        user?.phoneVerified;
      const shouldSendEmail =
        emailEnabled &&
        user?.preferences?.notificationSettings?.emailEnabled &&
        user?.email;
      const shouldSendPush = pushEnabled !== false;
      const shouldSendInApp = inAppEnabled !== false;
      const shouldSendToast = toastEnabled !== false;

      const promises: Promise<unknown>[] = [];

      // Send SMS notification
      if (shouldSendSMS && user?.smsPhoneNumber) {
        promises.push(
          smsNotifications
            .sendFriendRequestNotification(
              user.smsPhoneNumber,
              data.requesterName
            )
            .catch((error) => {
              logger.error(
                'Failed to send SMS friend request notification:',
                error
              );
              if (shouldSendToast && typeof window !== 'undefined') {
                ToastNotificationService.smsNotificationFailed(error);
              }
            })
        );
      }

      // Send email notification
      if (shouldSendEmail && user?.email) {
        promises.push(
          userEmailNotificationService
            .sendUserNotification({
              type: 'friend_request',
              recipientEmail: user.email,
              recipientName: user.name,
              requesterName: data.requesterName,
              requesterId: data.requesterId.toString(),
            })
            .catch((error) => {
              logger.error(
                'Failed to send email friend request notification:',
                error
              );
            })
        );
      }

      // Send in-app notification
      if (shouldSendInApp) {
        promises.push(
          inAppNotifications
            .createFriendRequestNotification(
              userId,
              data.requesterName,
              data.requesterId
            )
            .catch((error) => {
              logger.error(
                'Failed to create in-app friend request notification:',
                error
              );
            })
        );
      }

      // Send push notification (server-side)
      if (
        shouldSendPush &&
        user?.pushSubscriptions &&
        user.pushSubscriptions.length > 0
      ) {
        promises.push(
          pushService
            .sendFriendRequestNotification(
              user.pushSubscriptions[0] as PushSubscription,
              data.requesterName
            )
            .catch((error) => {
              logger.error(
                'Failed to send push friend request notification:',
                error
              );
            })
        );
      }

      // Send toast notification (client-side only)
      if (shouldSendToast && typeof window !== 'undefined') {
        ToastNotificationService.friendRequestSent(data.requesterName);
      }

      await Promise.allSettled(promises);

      logger.info(
        `Friend request notifications sent for ${data.requesterName}`
      );
    } catch (error) {
      logger.error('Failed to send friend request notifications:', error);
      throw error;
    }
  }

  /**
   * Send group invitation notification through all enabled channels
   */
  async sendGroupInvitationNotification(
    data: GroupInvitationNotificationData,
    options: NotificationOptions
  ): Promise<void> {
    const {
      userId,
      user,
      smsEnabled,
      emailEnabled,
      pushEnabled,
      inAppEnabled,
      toastEnabled,
    } = options;

    try {
      const shouldSendSMS =
        smsEnabled &&
        user?.smsOptIn &&
        user?.smsPhoneNumber &&
        user?.phoneVerified;
      const shouldSendEmail =
        emailEnabled &&
        user?.preferences?.notificationSettings?.emailEnabled &&
        user?.email;
      const shouldSendPush = pushEnabled !== false;
      const shouldSendInApp = inAppEnabled !== false;
      const shouldSendToast = toastEnabled !== false;

      const promises: Promise<unknown>[] = [];

      // Send SMS notification
      if (shouldSendSMS && user?.smsPhoneNumber) {
        promises.push(
          smsNotifications
            .sendGroupInvitationNotification(
              user.smsPhoneNumber,
              data.groupName,
              data.inviterName
            )
            .catch((error) => {
              logger.error(
                'Failed to send SMS group invitation notification:',
                error
              );
              if (shouldSendToast && typeof window !== 'undefined') {
                ToastNotificationService.smsNotificationFailed(error);
              }
            })
        );
      }

      // Send email notification
      if (shouldSendEmail && user?.email) {
        promises.push(
          userEmailNotificationService
            .sendUserNotification({
              type: 'group_invitation',
              recipientEmail: user.email,
              recipientName: user.name,
              groupName: data.groupName,
              groupId: data.groupId.toString(),
              inviterName: data.inviterName,
              inviterId: data.inviterId.toString(),
            })
            .catch((error) => {
              logger.error(
                'Failed to send email group invitation notification:',
                error
              );
            })
        );
      }

      // Send in-app notification
      if (shouldSendInApp) {
        promises.push(
          inAppNotifications
            .createGroupInvitationNotification(
              userId,
              data.groupName,
              data.inviterName,
              data.groupId,
              data.inviterId
            )
            .catch((error) => {
              logger.error(
                'Failed to create in-app group invitation notification:',
                error
              );
            })
        );
      }

      // Send push notification (server-side)
      if (
        shouldSendPush &&
        user?.pushSubscriptions &&
        user.pushSubscriptions.length > 0
      ) {
        promises.push(
          pushService
            .sendGroupInvitationNotification(
              user.pushSubscriptions[0] as PushSubscription,
              data.groupName,
              data.inviterName
            )
            .catch((error) => {
              logger.error(
                'Failed to send push group invitation notification:',
                error
              );
            })
        );
      }

      // Send toast notification (client-side only)
      if (shouldSendToast && typeof window !== 'undefined') {
        ToastNotificationService.info('Group invitation sent', {
          description: `Invitation sent to join ${data.groupName}`,
        });
      }

      await Promise.allSettled(promises);

      logger.info(`Group invitation notifications sent for ${data.groupName}`);
    } catch (error) {
      logger.error('Failed to send group invitation notifications:', error);
      throw error;
    }
  }

  /**
   * Send decision result notification through all enabled channels
   */
  async sendDecisionResultNotification(
    data: DecisionResultNotificationData,
    options: NotificationOptions
  ): Promise<void> {
    const {
      userId,
      user,
      smsEnabled,
      emailEnabled,
      pushEnabled,
      inAppEnabled,
      toastEnabled,
    } = options;

    try {
      const shouldSendSMS =
        smsEnabled &&
        user?.smsOptIn &&
        user?.smsPhoneNumber &&
        user?.phoneVerified;
      const shouldSendEmail =
        emailEnabled &&
        user?.preferences?.notificationSettings?.emailEnabled &&
        user?.email;
      const shouldSendPush = pushEnabled !== false;
      const shouldSendInApp = inAppEnabled !== false;
      const shouldSendToast = toastEnabled !== false;

      const promises: Promise<unknown>[] = [];

      // Send SMS notification
      if (shouldSendSMS && user?.smsPhoneNumber) {
        // Determine phone number based on environment
        const phoneNumber =
          process.env.NODE_ENV === 'development' &&
          process.env.TWILIO_TO_PHONE_NUMBER
            ? process.env.TWILIO_TO_PHONE_NUMBER
            : user.smsPhoneNumber;

        promises.push(
          smsNotifications
            .sendDecisionResultNotification(
              phoneNumber,
              data.groupName,
              data.restaurantName,
              data.decisionType || 'tiered',
              data.shortUrl
            )
            .catch((error) => {
              logger.error(
                'Failed to send SMS decision result notification:',
                error
              );
              if (shouldSendToast && typeof window !== 'undefined') {
                ToastNotificationService.smsNotificationFailed(error);
              }
            })
        );
      }

      // Send email notification
      if (shouldSendEmail && user?.email) {
        promises.push(
          userEmailNotificationService
            .sendUserNotification({
              type: 'decision_result',
              recipientEmail: user.email,
              recipientName: user.name,
              groupName: data.groupName,
              groupId: data.groupId.toString(),
              decisionId: data.decisionId.toString(),
              restaurantName: data.restaurantName,
              restaurantId: data.restaurantId.toString(),
              collectionName: data.collectionName,
              collectionUrl: data.collectionUrl,
              decisionType: data.decisionType,
            })
            .catch((error) => {
              logger.error(
                'Failed to send email decision result notification:',
                error
              );
            })
        );
      }

      // Send in-app notification
      if (shouldSendInApp) {
        promises.push(
          inAppNotifications
            .createDecisionResultNotification(
              userId,
              data.groupName,
              data.restaurantName,
              data.groupId,
              data.decisionId,
              data.restaurantId
            )
            .catch((error) => {
              logger.error(
                'Failed to create in-app decision result notification:',
                error
              );
            })
        );
      }

      // Send push notification (server-side)
      if (
        shouldSendPush &&
        user?.pushSubscriptions &&
        user.pushSubscriptions.length > 0
      ) {
        promises.push(
          pushService
            .sendDecisionResultNotification(
              user.pushSubscriptions as PushSubscription[],
              data.groupName,
              data.restaurantName
            )
            .catch((error) => {
              logger.error(
                'Failed to send push decision result notification:',
                error
              );
            })
        );
      }

      // Send toast notification (client-side only)
      if (shouldSendToast && typeof window !== 'undefined') {
        ToastNotificationService.success(
          `${data.groupName} Decision Complete`,
          {
            description: `The group decided on ${data.restaurantName}!`,
          }
        );
      }

      await Promise.allSettled(promises);

      logger.info(`Decision result notifications sent for ${data.groupName}`);
    } catch (error) {
      logger.error('Failed to send decision result notifications:', error);
      throw error;
    }
  }

  /**
   * Send admin alert notification
   */
  async sendAdminAlert(
    userId: ObjectId | string,
    alertType: 'cost_spike' | 'system_failure' | 'circuit_breaker',
    message: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      // Send SMS to admin (development number)
      await smsNotifications.sendAdminAlert('+18777804236', alertType, message);

      // Create in-app notification
      await inAppNotifications.createAdminAlertNotification(
        userId,
        alertType,
        message,
        details
      );

      // Send toast notification (client-side only)
      if (typeof window !== 'undefined') {
        ToastNotificationService.error('System Alert', {
          description: message,
        });
      }

      logger.info(`Admin alert sent: ${alertType}`);
    } catch (error) {
      logger.error('Failed to send admin alert:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
