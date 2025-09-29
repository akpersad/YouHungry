import { connectToDatabase } from './db';
import { Friendship } from '@/types/database';
import { ObjectId } from 'mongodb';

export interface FriendSearchResult {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  username?: string;
  profilePicture?: string;
  city?: string;
  relationshipStatus?:
    | 'none'
    | 'pending_sent'
    | 'pending_received'
    | 'accepted'
    | 'declined';
}

export interface FriendRequest {
  _id: string;
  requester: {
    _id: string;
    clerkId: string;
    email: string;
    name: string;
    profilePicture?: string;
  };
  addressee: {
    _id: string;
    clerkId: string;
    email: string;
    name: string;
    profilePicture?: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

export interface Friend {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  username?: string;
  profilePicture?: string;
  city?: string;
  friendshipId: string;
  addedAt: Date;
}

/**
 * Search for users by email or name (excluding current user)
 */
export async function searchUsers(
  query: string,
  currentUserId: string
): Promise<FriendSearchResult[]> {
  const db = await connectToDatabase();

  if (!query.trim()) {
    return [];
  }

  const searchRegex = new RegExp(query.trim(), 'i');

  // First find the current user to get their MongoDB ObjectId
  const currentUser = await db
    .collection('users')
    .findOne({ clerkId: currentUserId });
  if (!currentUser) {
    return [];
  }

  const users = await db
    .collection('users')
    .find({
      clerkId: { $ne: currentUserId },
      $or: [
        { email: searchRegex },
        { name: searchRegex },
        { username: searchRegex },
      ],
    })
    .project({
      clerkId: 1,
      email: 1,
      name: 1,
      username: 1,
      profilePicture: 1,
      city: 1,
    })
    .limit(10)
    .toArray();

  // Check relationship status for each user
  const usersWithStatus = await Promise.all(
    users.map(async (user) => {
      const friendship = await db.collection('friendships').findOne(
        {
          $or: [
            {
              requesterId: currentUser._id,
              addresseeId: user._id,
            },
            {
              requesterId: user._id,
              addresseeId: currentUser._id,
            },
          ],
        },
        { sort: { createdAt: -1 } } // Get the most recent friendship
      );

      let relationshipStatus:
        | 'none'
        | 'pending_sent'
        | 'pending_received'
        | 'accepted'
        | 'declined' = 'none';

      if (friendship) {
        if (friendship.status === 'accepted') {
          relationshipStatus = 'accepted';
        } else if (friendship.status === 'pending') {
          if (
            friendship.requesterId.toString() === currentUser._id.toString()
          ) {
            relationshipStatus = 'pending_sent';
          } else {
            relationshipStatus = 'pending_received';
          }
        } else if (friendship.status === 'declined') {
          relationshipStatus = 'declined';
        }
      }

      return {
        _id: user._id.toString(),
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        username: user.username,
        profilePicture: user.profilePicture,
        city: user.city,
        relationshipStatus,
      };
    })
  );

  return usersWithStatus;
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<Friendship> {
  const db = await connectToDatabase();

  if (requesterId === addresseeId) {
    throw new Error('Cannot send friend request to yourself');
  }

  // Check if both users exist and get their MongoDB ObjectIds
  const [requester, addressee] = await Promise.all([
    db.collection('users').findOne({ clerkId: requesterId }),
    db.collection('users').findOne({ clerkId: addresseeId }),
  ]);

  if (!requester || !addressee) {
    throw new Error('One or both users not found');
  }

  // Check if friendship already exists (only block if pending or accepted)
  const existingFriendship = await db.collection('friendships').findOne({
    $or: [
      {
        requesterId: requester._id,
        addresseeId: addressee._id,
      },
      {
        requesterId: addressee._id,
        addresseeId: requester._id,
      },
    ],
    status: { $in: ['pending', 'accepted'] },
  });

  if (existingFriendship) {
    if (existingFriendship.status === 'accepted') {
      throw new Error('You are already friends with this user');
    } else {
      throw new Error('Friend request already sent');
    }
  }

  const now = new Date();
  const friendship: Omit<Friendship, '_id'> = {
    requesterId: requester._id,
    addresseeId: addressee._id,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection('friendships').insertOne(friendship);
  return { ...friendship, _id: result.insertedId } as Friendship;
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(
  friendshipId: string,
  userId: string
): Promise<Friendship> {
  const db = await connectToDatabase();

  // First find the user by their Clerk ID to get their MongoDB ObjectId
  const user = await db.collection('users').findOne({ clerkId: userId });
  if (!user) {
    throw new Error('User not found');
  }

  const result = await db.collection('friendships').findOneAndUpdate(
    {
      _id: new ObjectId(friendshipId),
      addresseeId: user._id,
      status: 'pending',
    },
    {
      $set: {
        status: 'accepted',
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  if (!result) {
    throw new Error('Friend request not found or already processed');
  }

  return result as Friendship;
}

/**
 * Decline a friend request
 */
export async function declineFriendRequest(
  friendshipId: string,
  userId: string
): Promise<Friendship> {
  const db = await connectToDatabase();

  // First find the user by their Clerk ID to get their MongoDB ObjectId
  const user = await db.collection('users').findOne({ clerkId: userId });
  if (!user) {
    throw new Error('User not found');
  }

  const result = await db.collection('friendships').findOneAndUpdate(
    {
      _id: new ObjectId(friendshipId),
      addresseeId: user._id,
      status: 'pending',
    },
    {
      $set: {
        status: 'declined',
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  if (!result) {
    throw new Error('Friend request not found or already processed');
  }

  return result as Friendship;
}

/**
 * Remove a friend (delete friendship)
 */
export async function removeFriend(
  friendshipId: string,
  userId: string
): Promise<boolean> {
  const db = await connectToDatabase();

  // First find the user by their Clerk ID to get their MongoDB ObjectId
  const user = await db.collection('users').findOne({ clerkId: userId });
  if (!user) {
    throw new Error('User not found');
  }

  // Verify the user is part of this friendship
  const friendship = await db.collection('friendships').findOne({
    _id: new ObjectId(friendshipId),
    $or: [{ requesterId: user._id }, { addresseeId: user._id }],
  });

  if (!friendship) {
    throw new Error('Friendship not found or access denied');
  }

  const result = await db.collection('friendships').deleteOne({
    _id: new ObjectId(friendshipId),
  });

  return result.deletedCount > 0;
}

/**
 * Get all friends for a user
 */
export async function getFriends(userId: string): Promise<Friend[]> {
  const db = await connectToDatabase();

  // First find the user by their Clerk ID to get their MongoDB ObjectId
  const user = await db.collection('users').findOne({ clerkId: userId });
  if (!user) {
    // Return empty array if user doesn't exist yet
    return [];
  }

  const friendships = await db
    .collection('friendships')
    .aggregate([
      {
        $match: {
          $or: [{ requesterId: user._id }, { addresseeId: user._id }],
          status: 'accepted',
        },
      },
      {
        $lookup: {
          from: 'users',
          let: {
            friendId: {
              $cond: [
                { $eq: ['$requesterId', user._id] },
                '$addresseeId',
                '$requesterId',
              ],
            },
          },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$friendId'] } } },
            {
              $project: {
                clerkId: 1,
                email: 1,
                name: 1,
                username: 1,
                profilePicture: 1,
                city: 1,
              },
            },
          ],
          as: 'friend',
        },
      },
      {
        $unwind: '$friend',
      },
      {
        $project: {
          _id: '$friend._id',
          clerkId: '$friend.clerkId',
          email: '$friend.email',
          name: '$friend.name',
          username: '$friend.username',
          profilePicture: '$friend.profilePicture',
          city: '$friend.city',
          friendshipId: '$_id',
          addedAt: '$createdAt',
        },
      },
    ])
    .toArray();

  return friendships.map((friend) => ({
    _id: friend._id.toString(),
    clerkId: friend.clerkId,
    email: friend.email,
    name: friend.name,
    username: friend.username,
    profilePicture: friend.profilePicture,
    city: friend.city,
    friendshipId: friend.friendshipId.toString(),
    addedAt: friend.addedAt,
  }));
}

/**
 * Get pending friend requests for a user (both sent and received)
 */
export async function getFriendRequests(userId: string): Promise<{
  sent: FriendRequest[];
  received: FriendRequest[];
}> {
  const db = await connectToDatabase();

  // First find the user by their Clerk ID to get their MongoDB ObjectId
  const user = await db.collection('users').findOne({ clerkId: userId });
  if (!user) {
    // Return empty arrays if user doesn't exist yet
    return { sent: [], received: [] };
  }

  const [sentRequests, receivedRequests] = await Promise.all([
    // Sent requests
    db
      .collection('friendships')
      .aggregate([
        {
          $match: {
            requesterId: user._id,
            status: 'pending',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'requesterId',
            foreignField: '_id',
            as: 'requester',
            pipeline: [
              {
                $project: { clerkId: 1, email: 1, name: 1, profilePicture: 1 },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'addresseeId',
            foreignField: '_id',
            as: 'addressee',
            pipeline: [
              {
                $project: { clerkId: 1, email: 1, name: 1, profilePicture: 1 },
              },
            ],
          },
        },
        {
          $unwind: '$requester',
        },
        {
          $unwind: '$addressee',
        },
        {
          $project: {
            _id: '$_id',
            requester: '$requester',
            addressee: '$addressee',
            status: '$status',
            createdAt: '$createdAt',
            updatedAt: '$updatedAt',
          },
        },
      ])
      .toArray(),

    // Received requests
    db
      .collection('friendships')
      .aggregate([
        {
          $match: {
            addresseeId: user._id,
            status: 'pending',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'requesterId',
            foreignField: '_id',
            as: 'requester',
            pipeline: [
              {
                $project: { clerkId: 1, email: 1, name: 1, profilePicture: 1 },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'addresseeId',
            foreignField: '_id',
            as: 'addressee',
            pipeline: [
              {
                $project: { clerkId: 1, email: 1, name: 1, profilePicture: 1 },
              },
            ],
          },
        },
        {
          $unwind: '$requester',
        },
        {
          $unwind: '$addressee',
        },
        {
          $project: {
            _id: '$_id',
            requester: '$requester',
            addressee: '$addressee',
            status: '$status',
            createdAt: '$createdAt',
            updatedAt: '$updatedAt',
          },
        },
      ])
      .toArray(),
  ]);

  return {
    sent: sentRequests.map((req) => ({
      _id: req._id.toString(),
      requester: {
        _id: req.requester._id.toString(),
        clerkId: req.requester.clerkId,
        email: req.requester.email,
        name: req.requester.name,
        profilePicture: req.requester.profilePicture,
      },
      addressee: {
        _id: req.addressee._id.toString(),
        clerkId: req.addressee.clerkId,
        email: req.addressee.email,
        name: req.addressee.name,
        profilePicture: req.addressee.profilePicture,
      },
      status: req.status,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
    })),
    received: receivedRequests.map((req) => ({
      _id: req._id.toString(),
      requester: {
        _id: req.requester._id.toString(),
        clerkId: req.requester.clerkId,
        email: req.requester.email,
        name: req.requester.name,
        profilePicture: req.requester.profilePicture,
      },
      addressee: {
        _id: req.addressee._id.toString(),
        clerkId: req.addressee.clerkId,
        email: req.addressee.email,
        name: req.addressee.name,
        profilePicture: req.addressee.profilePicture,
      },
      status: req.status,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
    })),
  };
}

/**
 * Check if two users are friends
 */
export async function areFriends(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const db = await connectToDatabase();

  // Find both users by their Clerk IDs to get their MongoDB ObjectIds
  const [user1, user2] = await Promise.all([
    db.collection('users').findOne({ clerkId: userId1 }),
    db.collection('users').findOne({ clerkId: userId2 }),
  ]);

  if (!user1 || !user2) {
    return false;
  }

  const friendship = await db.collection('friendships').findOne({
    $or: [
      {
        requesterId: user1._id,
        addresseeId: user2._id,
      },
      {
        requesterId: user2._id,
        addresseeId: user1._id,
      },
    ],
    status: 'accepted',
  });

  return !!friendship;
}

/**
 * Get friendship between two users
 */
export async function getFriendship(
  userId1: string,
  userId2: string
): Promise<Friendship | null> {
  const db = await connectToDatabase();

  // Find both users by their Clerk IDs to get their MongoDB ObjectIds
  const [user1, user2] = await Promise.all([
    db.collection('users').findOne({ clerkId: userId1 }),
    db.collection('users').findOne({ clerkId: userId2 }),
  ]);

  if (!user1 || !user2) {
    return null;
  }

  const friendship = await db.collection('friendships').findOne({
    $or: [
      {
        requesterId: user1._id,
        addresseeId: user2._id,
      },
      {
        requesterId: user2._id,
        addresseeId: user1._id,
      },
    ],
  });

  return friendship as Friendship | null;
}
