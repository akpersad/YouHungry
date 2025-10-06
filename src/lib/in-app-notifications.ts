import { ObjectId, Collection } from 'mongodb';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { InAppNotification } from '@/types/database';

export interface CreateNotificationData {
  userId: ObjectId | string;
  type: InAppNotification['type'];
  title: string;
  message: string;
  data?: InAppNotification['data'];
}

export interface NotificationFilters {
  userId?: ObjectId | string;
  type?: InAppNotification['type'];
  read?: boolean;
  limit?: number;
  offset?: number;
}

export class InAppNotificationService {
  private static instance: InAppNotificationService;
  private collection: Collection<InAppNotification> | undefined;

  private constructor() {
    // Don't initialize collection here - do it lazily
  }

  private async getCollection(): Promise<Collection<InAppNotification>> {
    if (!this.collection) {
      if (!db) {
        throw new Error(
          'Database not initialized. Call connectToDatabase() first.'
        );
      }
      this.collection = db.collection<InAppNotification>('notifications');
    }
    return this.collection;
  }

  public static getInstance(): InAppNotificationService {
    if (!InAppNotificationService.instance) {
      InAppNotificationService.instance = new InAppNotificationService();
    }
    return InAppNotificationService.instance;
  }

  /**
   * Create a new notification
   */
  async createNotification(
    data: CreateNotificationData
  ): Promise<InAppNotification> {
    try {
      const collection = await this.getCollection();
      const notification: Omit<InAppNotification, '_id'> = {
        userId: new ObjectId(data.userId),
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await collection.insertOne(notification as any);

      const createdNotification = {
        ...notification,
        _id: result.insertedId,
      };

      logger.info(`Created notification: ${data.type} for user ${data.userId}`);
      return createdNotification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    filters: NotificationFilters = {}
  ): Promise<InAppNotification[]> {
    try {
      const collection = await this.getCollection();
      const query: Partial<InAppNotification> = {};

      if (filters.userId) {
        query.userId = new ObjectId(filters.userId);
      }

      if (filters.type) {
        query.type = filters.type;
      }

      if (filters.read !== undefined) {
        query.read = filters.read;
      }

      const cursor = collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(filters.offset || 0)
        .limit(filters.limit || 50);

      return await cursor.toArray();
    } catch (error) {
      logger.error('Failed to get notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: ObjectId | string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { _id: new ObjectId(notificationId) },
        {
          $set: {
            read: true,
            updatedAt: new Date(),
          },
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: ObjectId | string): Promise<number> {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateMany(
        {
          userId: new ObjectId(userId),
          read: false,
        },
        {
          $set: {
            read: true,
            updatedAt: new Date(),
          },
        }
      );

      logger.info(
        `Marked ${result.modifiedCount} notifications as read for user ${userId}`
      );
      return result.modifiedCount;
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: ObjectId | string): Promise<number> {
    try {
      const collection = await this.getCollection();
      return await collection.countDocuments({
        userId: new ObjectId(userId),
        read: false,
      });
    } catch (error) {
      logger.error('Failed to get unread count:', error);
      throw error;
    }
  }

  /**
   * Delete old notifications (cleanup)
   */
  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const collection = await this.getCollection();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await collection.deleteMany({
        createdAt: { $lt: cutoffDate },
        read: true,
      });

      logger.info(`Deleted ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Failed to delete old notifications:', error);
      throw error;
    }
  }

  // Predefined notification creators

  /**
   * Create group decision notification
   */
  async createGroupDecisionNotification(
    userId: ObjectId | string,
    groupName: string,
    decisionType: 'tiered' | 'random',
    groupId: ObjectId | string,
    decisionId: ObjectId | string
  ): Promise<InAppNotification> {
    const typeText = decisionType === 'tiered' ? 'voting' : 'random selection';

    return this.createNotification({
      userId,
      type: 'group_decision',
      title: `${groupName} Decision Started`,
      message: `A group ${typeText} has started. ${decisionType === 'tiered' ? 'Cast your vote!' : 'The selection will be made automatically.'}`,
      data: {
        groupId: new ObjectId(groupId),
        decisionId: new ObjectId(decisionId),
      },
    });
  }

  /**
   * Create friend request notification
   */
  async createFriendRequestNotification(
    userId: ObjectId | string,
    requesterName: string,
    requesterId: ObjectId | string
  ): Promise<InAppNotification> {
    return this.createNotification({
      userId,
      type: 'friend_request',
      title: 'New Friend Request',
      message: `${requesterName} sent you a friend request`,
      data: {
        requesterId: new ObjectId(requesterId),
      },
    });
  }

  /**
   * Create group invitation notification
   */
  async createGroupInvitationNotification(
    userId: ObjectId | string,
    groupName: string,
    inviterName: string,
    groupId: ObjectId | string,
    inviterId: ObjectId | string
  ): Promise<InAppNotification> {
    return this.createNotification({
      userId,
      type: 'group_invitation',
      title: 'Group Invitation',
      message: `${inviterName} invited you to join "${groupName}"`,
      data: {
        groupId: new ObjectId(groupId),
        inviterId: new ObjectId(inviterId),
      },
    });
  }

  /**
   * Create decision result notification
   */
  async createDecisionResultNotification(
    userId: ObjectId | string,
    groupName: string,
    restaurantName: string,
    groupId: ObjectId | string,
    decisionId: ObjectId | string,
    restaurantId: ObjectId | string
  ): Promise<InAppNotification> {
    return this.createNotification({
      userId,
      type: 'decision_result',
      title: `${groupName} Decision Complete`,
      message: `The group has decided on ${restaurantName}!`,
      data: {
        groupId: new ObjectId(groupId),
        decisionId: new ObjectId(decisionId),
        restaurantId: new ObjectId(restaurantId),
      },
    });
  }

  /**
   * Create admin alert notification
   */
  async createAdminAlertNotification(
    userId: ObjectId | string,
    alertType: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<InAppNotification> {
    return this.createNotification({
      userId,
      type: 'admin_alert',
      title: 'System Alert',
      message,
      data: {
        alertType,
        ...data,
      },
    });
  }
}

// Export singleton instance
export const inAppNotifications = InAppNotificationService.getInstance();
