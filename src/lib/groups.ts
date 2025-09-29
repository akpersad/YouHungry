import { ObjectId } from 'mongodb';
import { connectToDatabase } from './db';
import { Group, User, GroupInvitation } from '../types/database';

/**
 * Get all groups that a user is a member of (as admin or member)
 */
export async function getGroupsByUserId(userId: string): Promise<Group[]> {
  const db = await connectToDatabase();
  const groupsCollection = db.collection<Group>('groups');

  const groups = await groupsCollection
    .find({
      $or: [
        { adminIds: new ObjectId(userId) },
        { memberIds: new ObjectId(userId) },
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();

  return groups;
}

/**
 * Get a group by its ID
 */
export async function getGroupById(groupId: string): Promise<Group | null> {
  const db = await connectToDatabase();
  const groupsCollection = db.collection<Group>('groups');

  const group = await groupsCollection.findOne({ _id: new ObjectId(groupId) });
  return group;
}

/**
 * Create a new group
 */
export async function createGroup(
  name: string,
  description: string | undefined,
  adminId: string
): Promise<Group> {
  const db = await connectToDatabase();
  const groupsCollection = db.collection<Group>('groups');

  const now = new Date();
  const group: Omit<Group, '_id'> = {
    name: name.trim(),
    description: description?.trim() || undefined,
    adminIds: [new ObjectId(adminId)],
    memberIds: [new ObjectId(adminId)], // Admin is also a member
    collectionIds: [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await groupsCollection.insertOne(group as Group);

  return {
    _id: result.insertedId,
    ...group,
  };
}

/**
 * Update a group (name, description)
 */
export async function updateGroup(
  groupId: string,
  updates: { name?: string; description?: string },
  adminId: string
): Promise<Group | null> {
  const db = await connectToDatabase();
  const groupsCollection = db.collection<Group>('groups');

  // Verify user is admin
  const group = await groupsCollection.findOne({
    _id: new ObjectId(groupId),
    adminIds: new ObjectId(adminId),
  });

  if (!group) {
    throw new Error('Group not found or user is not an admin');
  }

  const updateData: Partial<Group> = {
    updatedAt: new Date(),
  };

  if (updates.name !== undefined) {
    updateData.name = updates.name.trim();
  }

  if (updates.description !== undefined) {
    updateData.description = updates.description.trim() || undefined;
  }

  const result = await groupsCollection.findOneAndUpdate(
    { _id: new ObjectId(groupId) },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  return result || null;
}

/**
 * Delete a group (only admins can delete)
 */
export async function deleteGroup(
  groupId: string,
  adminId: string
): Promise<boolean> {
  const db = await connectToDatabase();
  const groupsCollection = db.collection<Group>('groups');

  // Verify user is admin
  const group = await groupsCollection.findOne({
    _id: new ObjectId(groupId),
    adminIds: new ObjectId(adminId),
  });

  if (!group) {
    throw new Error('Group not found or user is not an admin');
  }

  const result = await groupsCollection.deleteOne({
    _id: new ObjectId(groupId),
  });
  return result.deletedCount > 0;
}

/**
 * Invite a user to join a group
 */
export async function inviteUserToGroup(
  groupId: string,
  userId: string,
  adminId: string
): Promise<boolean> {
  const db = await connectToDatabase();
  const groupsCollection = db.collection<Group>('groups');
  const invitationsCollection =
    db.collection<GroupInvitation>('groupInvitations');

  // Verify admin permissions
  const group = await groupsCollection.findOne({
    _id: new ObjectId(groupId),
    adminIds: new ObjectId(adminId),
  });

  if (!group) {
    throw new Error('Group not found or user is not an admin');
  }

  // Check if user is already a member
  const userIdObj = new ObjectId(userId);
  if (group.memberIds.some((id) => id.toString() === userIdObj.toString())) {
    throw new Error('User is already a member of this group');
  }

  // Check if there's already a pending invitation
  const existingInvitation = await invitationsCollection.findOne({
    groupId: new ObjectId(groupId),
    inviteeId: userIdObj,
    status: 'pending',
  });

  if (existingInvitation) {
    throw new Error('User already has a pending invitation to this group');
  }

  // Create invitation
  const invitation: Omit<GroupInvitation, '_id'> = {
    groupId: new ObjectId(groupId),
    inviterId: new ObjectId(adminId),
    inviteeId: userIdObj,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await invitationsCollection.insertOne(
    invitation as GroupInvitation
  );

  return result.insertedId !== null;
}

/**
 * Accept a group invitation
 */
export async function acceptGroupInvitation(
  invitationId: string,
  userId: string
): Promise<boolean> {
  const db = await connectToDatabase();
  const invitationsCollection =
    db.collection<GroupInvitation>('groupInvitations');
  const groupsCollection = db.collection<Group>('groups');

  // Find the invitation
  const invitation = await invitationsCollection.findOne({
    _id: new ObjectId(invitationId),
    inviteeId: new ObjectId(userId),
    status: 'pending',
  });

  if (!invitation) {
    throw new Error('Invitation not found or already processed');
  }

  // Add user to group
  const groupResult = await groupsCollection.updateOne(
    { _id: invitation.groupId },
    {
      $addToSet: { memberIds: invitation.inviteeId },
      $set: { updatedAt: new Date() },
    }
  );

  if (groupResult.modifiedCount === 0) {
    throw new Error('Failed to add user to group');
  }

  // Update invitation status
  await invitationsCollection.updateOne(
    { _id: new ObjectId(invitationId) },
    {
      $set: {
        status: 'accepted',
        updatedAt: new Date(),
      },
    }
  );

  return true;
}

/**
 * Decline a group invitation
 */
export async function declineGroupInvitation(
  invitationId: string,
  userId: string
): Promise<boolean> {
  const db = await connectToDatabase();
  const invitationsCollection =
    db.collection<GroupInvitation>('groupInvitations');

  // Find the invitation
  const invitation = await invitationsCollection.findOne({
    _id: new ObjectId(invitationId),
    inviteeId: new ObjectId(userId),
    status: 'pending',
  });

  if (!invitation) {
    throw new Error('Invitation not found or already processed');
  }

  // Update invitation status
  const result = await invitationsCollection.updateOne(
    { _id: new ObjectId(invitationId) },
    {
      $set: {
        status: 'declined',
        updatedAt: new Date(),
      },
    }
  );

  return result.modifiedCount > 0;
}

/**
 * Get group invitations for a user
 */
export async function getGroupInvitationsForUser(
  userId: string
): Promise<GroupInvitation[]> {
  const db = await connectToDatabase();
  const invitationsCollection =
    db.collection<GroupInvitation>('groupInvitations');

  const invitations = await invitationsCollection
    .find({
      inviteeId: new ObjectId(userId),
      status: 'pending',
    })
    .toArray();

  return invitations;
}

/**
 * Remove a user from a group
 */
export async function removeUserFromGroup(
  groupId: string,
  userId: string,
  adminId: string
): Promise<boolean> {
  const db = await connectToDatabase();
  const groupsCollection = db.collection<Group>('groups');

  // Verify admin permissions
  const group = await groupsCollection.findOne({
    _id: new ObjectId(groupId),
    adminIds: new ObjectId(adminId),
  });

  if (!group) {
    throw new Error('Group not found or user is not an admin');
  }

  const userIdObj = new ObjectId(userId);

  // Prevent removing the last admin
  if (
    group.adminIds.length === 1 &&
    group.adminIds[0].toString() === userIdObj.toString()
  ) {
    throw new Error('Cannot remove the last admin from the group');
  }

  // Remove user from both adminIds and memberIds
  const result = await groupsCollection.updateOne(
    { _id: new ObjectId(groupId) },
    {
      $pull: {
        adminIds: userIdObj,
        memberIds: userIdObj,
      },
      $set: { updatedAt: new Date() },
    }
  );

  return result.modifiedCount > 0;
}

/**
 * Promote a member to admin
 */
export async function promoteToAdmin(
  groupId: string,
  userId: string,
  adminId: string
): Promise<boolean> {
  const db = await connectToDatabase();
  const groupsCollection = db.collection<Group>('groups');

  // Verify admin permissions
  const group = await groupsCollection.findOne({
    _id: new ObjectId(groupId),
    adminIds: new ObjectId(adminId),
  });

  if (!group) {
    throw new Error('Group not found or user is not an admin');
  }

  const userIdObj = new ObjectId(userId);

  // Check if user is a member
  if (!group.memberIds.some((id) => id.toString() === userIdObj.toString())) {
    throw new Error('User is not a member of this group');
  }

  // Check if user is already an admin
  if (group.adminIds.some((id) => id.toString() === userIdObj.toString())) {
    throw new Error('User is already an admin');
  }

  // Add user to adminIds
  const result = await groupsCollection.updateOne(
    { _id: new ObjectId(groupId) },
    {
      $addToSet: { adminIds: userIdObj },
      $set: { updatedAt: new Date() },
    }
  );

  return result.modifiedCount > 0;
}

/**
 * Leave a group (members can leave, admins can leave if there are other admins)
 */
export async function leaveGroup(
  groupId: string,
  userId: string
): Promise<boolean> {
  const db = await connectToDatabase();
  const groupsCollection = db.collection<Group>('groups');

  const group = await groupsCollection.findOne({ _id: new ObjectId(groupId) });

  if (!group) {
    throw new Error('Group not found');
  }

  const userIdObj = new ObjectId(userId);

  // Check if user is a member
  if (!group.memberIds.some((id) => id.toString() === userIdObj.toString())) {
    throw new Error('User is not a member of this group');
  }

  // If user is an admin and it's the last admin, prevent leaving
  if (
    group.adminIds.length === 1 &&
    group.adminIds[0].toString() === userIdObj.toString()
  ) {
    throw new Error(
      'Cannot leave group as the last admin. Promote another member to admin first.'
    );
  }

  // Remove user from both adminIds and memberIds
  const result = await groupsCollection.updateOne(
    { _id: new ObjectId(groupId) },
    {
      $pull: {
        adminIds: userIdObj,
        memberIds: userIdObj,
      },
      $set: { updatedAt: new Date() },
    }
  );

  return result.modifiedCount > 0;
}

/**
 * Get group members with user details
 */
export async function getGroupMembers(groupId: string): Promise<User[]> {
  const db = await connectToDatabase();
  const groupsCollection = db.collection<Group>('groups');
  const usersCollection = db.collection<User>('users');

  const group = await groupsCollection.findOne({ _id: new ObjectId(groupId) });

  if (!group) {
    throw new Error('Group not found');
  }

  const members = await usersCollection
    .find({ _id: { $in: group.memberIds } })
    .toArray();

  return members;
}

/**
 * Check if user is a member of a group
 */
export async function isGroupMember(
  groupId: string,
  userId: string
): Promise<boolean> {
  const db = await connectToDatabase();
  const groupsCollection = db.collection<Group>('groups');

  const group = await groupsCollection.findOne({
    _id: new ObjectId(groupId),
    memberIds: new ObjectId(userId),
  });

  return group !== null;
}

/**
 * Check if user is an admin of a group
 */
export async function isGroupAdmin(
  groupId: string,
  userId: string
): Promise<boolean> {
  const db = await connectToDatabase();
  const groupsCollection = db.collection<Group>('groups');

  const group = await groupsCollection.findOne({
    _id: new ObjectId(groupId),
    adminIds: new ObjectId(userId),
  });

  return group !== null;
}
