import { ObjectId } from 'mongodb';
import { smsNotifications } from '@/lib/sms-notifications';
import { inAppNotifications } from '@/lib/in-app-notifications';
import { pushNotifications } from '@/lib/push-notifications';
import { ToastNotificationService } from '@/lib/toast-notifications';
import { logger } from '@/lib/logger';
import { User } from '@/types/database';

export interface NotificationOptions {
  userId: ObjectId | string;
  user?: User;
  smsEnabled?: boolean;
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
      pushEnabled,
      inAppEnabled,
      toastEnabled,
    } = options;

    try {
      // Determine which channels to use
      const shouldSendSMS =
        smsEnabled && user?.smsOptIn && user?.smsPhoneNumber;
      const shouldSendPush = pushEnabled !== false; // Default to true
      const shouldSendInApp = inAppEnabled !== false; // Default to true
      const shouldSendToast = toastEnabled !== false; // Default to true

      const promises: Promise<unknown>[] = [];

      // Send SMS notification
      if (shouldSendSMS && user?.smsPhoneNumber) {
        promises.push(
          smsNotifications
            .sendGroupDecisionNotification(
              user.smsPhoneNumber,
              data.groupName,
              data.decisionType,
              data.deadline
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

      // Send push notification (if supported and subscribed)
      if (shouldSendPush) {
        promises.push(
          pushNotifications
            .sendGroupDecisionNotification(
              data.groupName,
              data.decisionType,
              data.deadline
            )
            .catch((error) => {
              logger.error(
                'Failed to send push group decision notification:',
                error
              );
            })
        );
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
      pushEnabled,
      inAppEnabled,
      toastEnabled,
    } = options;

    try {
      const shouldSendSMS =
        smsEnabled && user?.smsOptIn && user?.smsPhoneNumber;
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

      // Send push notification
      if (shouldSendPush) {
        promises.push(
          pushNotifications
            .sendFriendRequestNotification(data.requesterName)
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
      pushEnabled,
      inAppEnabled,
      toastEnabled,
    } = options;

    try {
      const shouldSendSMS =
        smsEnabled && user?.smsOptIn && user?.smsPhoneNumber;
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

      // Send push notification
      if (shouldSendPush) {
        promises.push(
          pushNotifications
            .sendGroupInvitationNotification(data.groupName, data.inviterName)
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
    const { userId, pushEnabled, inAppEnabled, toastEnabled } = options;

    try {
      const shouldSendPush = pushEnabled !== false;
      const shouldSendInApp = inAppEnabled !== false;
      const shouldSendToast = toastEnabled !== false;

      const promises: Promise<unknown>[] = [];

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

      // Send push notification
      if (shouldSendPush) {
        promises.push(
          pushNotifications
            .sendDecisionResultNotification(data.groupName, data.restaurantName)
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
