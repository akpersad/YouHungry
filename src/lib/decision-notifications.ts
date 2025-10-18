import { ObjectId } from 'mongodb';
import { connectToDatabase } from './db';
import { User, Group, Collection, Restaurant } from '@/types/database';
import { notificationService } from './notification-service';
import { urlShortener } from './url-shortener';
import { logger } from './logger';

/**
 * Send notifications to all group members when a decision is started
 */
export async function sendDecisionStartedNotifications(
  groupId: string,
  collectionId: string,
  decisionId: string,
  decisionType: 'tiered' | 'random',
  deadline: Date,
  createdByUserId?: string
): Promise<void> {
  try {
    const db = await connectToDatabase();

    // Get group details
    const group = await db
      .collection<Group>('groups')
      .findOne({ _id: new ObjectId(groupId) });

    if (!group) {
      logger.error('Group not found for decision started notification');
      return;
    }

    // Get collection details
    const collection = await db
      .collection<Collection>('collections')
      .findOne({ _id: new ObjectId(collectionId) });

    if (!collection) {
      logger.error('Collection not found for decision started notification');
      return;
    }

    // Get creator details if provided
    let creatorName = 'Someone';
    if (createdByUserId) {
      const creator = await db
        .collection<User>('users')
        .findOne({ _id: new ObjectId(createdByUserId) });
      if (creator) {
        creatorName = creator.name;
      }
    }

    // Get all group members (combine admin and member IDs, removing duplicates)
    const allMemberIds = [
      ...new Set([
        ...group.adminIds.map((id) => id.toString()),
        ...group.memberIds.map((id) => id.toString()),
      ]),
    ];

    // Fetch all members with their preferences
    const members = await db
      .collection<User>('users')
      .find({ _id: { $in: allMemberIds.map((id) => new ObjectId(id)) } })
      .toArray();

    // Create the collection URL for the notification
    const collectionUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/collections/${collectionId}`;

    // Shorten the URL for SMS
    const shortUrl = await urlShortener.shortenUrl(collectionUrl, 30); // 30 days expiry

    // Send notifications to each member (except the creator)
    logger.info('📣 Sending decision started notifications', {
      groupName: group.name,
      totalMembers: members.length,
      filteredMembers: members.filter(
        (m) => m._id.toString() !== createdByUserId
      ).length,
      createdByUserId,
    });

    const notificationPromises = members
      .filter((member) => member._id.toString() !== createdByUserId)
      .map(async (member) => {
        // Check if user wants to receive decision started notifications
        const wantsNotification =
          member.preferences?.notificationSettings?.groupDecisions?.started ??
          true;

        logger.info('👤 Processing member notification', {
          memberId: member._id.toString(),
          memberName: member.name,
          wantsNotification,
          hasPushSubscriptions: !!member.pushSubscriptions,
          pushSubscriptionCount: member.pushSubscriptions?.length || 0,
        });

        if (!wantsNotification) {
          logger.info(
            `User ${member._id} has disabled decision started notifications, skipping`
          );
          return;
        }

        // Send notification through all enabled channels
        await notificationService.sendGroupDecisionNotification(
          {
            groupName: group.name,
            groupId: new ObjectId(groupId),
            decisionId: new ObjectId(decisionId),
            decisionType,
            deadline,
            collectionName: collection.name,
            collectionUrl,
            shortUrl,
            createdByName: creatorName,
          },
          {
            userId: member._id,
            user: member,
            emailEnabled:
              member.preferences?.notificationSettings?.emailEnabled ?? true,
            smsEnabled:
              member.preferences?.notificationSettings?.smsEnabled ?? false,
            pushEnabled:
              member.preferences?.notificationSettings?.pushEnabled ?? true,
            inAppEnabled: true,
            toastEnabled: false, // Don't show toast for other users
          }
        );
      });

    await Promise.allSettled(notificationPromises);

    logger.info(
      `Decision started notifications sent for group ${group.name}, decision ${decisionId}`
    );
  } catch (error) {
    logger.error('Error sending decision started notifications:', error);
    throw error;
  }
}

/**
 * Send notifications to all group members when a decision is completed
 */
export async function sendDecisionCompletedNotifications(
  groupId: string,
  collectionId: string,
  decisionId: string,
  restaurantId: string,
  decisionType: 'tiered' | 'random'
): Promise<void> {
  try {
    const db = await connectToDatabase();

    // Get group details
    const group = await db
      .collection<Group>('groups')
      .findOne({ _id: new ObjectId(groupId) });

    if (!group) {
      logger.error('Group not found for decision completed notification');
      return;
    }

    // Get collection details
    const collection = await db
      .collection<Collection>('collections')
      .findOne({ _id: new ObjectId(collectionId) });

    if (!collection) {
      logger.error('Collection not found for decision completed notification');
      return;
    }

    // Get restaurant details
    const restaurant = await db
      .collection<Restaurant>('restaurants')
      .findOne({ _id: new ObjectId(restaurantId) });

    if (!restaurant) {
      logger.error('Restaurant not found for decision completed notification');
      return;
    }

    // Get all group members (combine admin and member IDs, removing duplicates)
    const allMemberIds = [
      ...new Set([
        ...group.adminIds.map((id) => id.toString()),
        ...group.memberIds.map((id) => id.toString()),
      ]),
    ];

    // Fetch all members with their preferences
    const members = await db
      .collection<User>('users')
      .find({ _id: { $in: allMemberIds.map((id) => new ObjectId(id)) } })
      .toArray();

    // Create the collection URL for the notification
    const collectionUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/collections/${collectionId}`;

    // Shorten the URL for SMS
    const shortUrl = await urlShortener.shortenUrl(collectionUrl, 30); // 30 days expiry

    // Send notifications to each member
    const notificationPromises = members.map(async (member) => {
      // Check if user wants to receive decision completed notifications
      const wantsNotification =
        member.preferences?.notificationSettings?.groupDecisions?.completed ??
        true;

      if (!wantsNotification) {
        logger.info(
          `User ${member._id} has disabled decision completed notifications, skipping`
        );
        return;
      }

      // Send notification through all enabled channels
      await notificationService.sendDecisionResultNotification(
        {
          groupName: group.name,
          groupId: new ObjectId(groupId),
          decisionId: new ObjectId(decisionId),
          restaurantName: restaurant.name,
          restaurantId: new ObjectId(restaurantId),
          collectionName: collection.name,
          collectionUrl,
          shortUrl,
          decisionType,
        },
        {
          userId: member._id,
          user: member,
          emailEnabled:
            member.preferences?.notificationSettings?.emailEnabled ?? true,
          smsEnabled:
            member.preferences?.notificationSettings?.smsEnabled ?? false,
          pushEnabled:
            member.preferences?.notificationSettings?.pushEnabled ?? true,
          inAppEnabled: true,
          toastEnabled: false, // Don't show toast for other users
        }
      );
    });

    await Promise.allSettled(notificationPromises);

    logger.info(
      `Decision completed notifications sent for group ${group.name}, decision ${decisionId}, restaurant ${restaurant.name}`
    );
  } catch (error) {
    logger.error('Error sending decision completed notifications:', error);
    throw error;
  }
}
