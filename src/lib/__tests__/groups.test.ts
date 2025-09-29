import { ObjectId } from 'mongodb';
import {
  createGroup,
  getGroupsByUserId,
  getGroupById,
  updateGroup,
  deleteGroup,
  inviteUserToGroup,
  removeUserFromGroup,
  promoteToAdmin,
  leaveGroup,
  getGroupMembers,
  isGroupMember,
  isGroupAdmin,
} from '../groups';

// Mock the database
jest.mock('../db', () => ({
  connectToDatabase: jest.fn(),
}));

const mockDb = {
  collection: jest.fn(),
};

const mockCollection = {
  find: jest.fn(),
  findOne: jest.fn(),
  insertOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
};

const mockUsersCollection = {
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockGroupsCollection = {
  find: jest.fn(),
  findOne: jest.fn(),
  insertOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();

  // Setup default mocks
  mockDb.collection.mockImplementation((name) => {
    if (name === 'groups') return mockGroupsCollection;
    if (name === 'users') return mockUsersCollection;
    return mockCollection;
  });

  (
    jest.requireActual('../db').connectToDatabase as jest.Mock
  ).mockResolvedValue(mockDb);
});

describe('Groups Library', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockGroupId = '507f1f77bcf86cd799439012';
  const mockGroup = {
    _id: new ObjectId(mockGroupId),
    name: 'Test Group',
    description: 'A test group',
    adminIds: [new ObjectId(mockUserId)],
    memberIds: [new ObjectId(mockUserId)],
    collectionIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createGroup', () => {
    it('should create a new group', async () => {
      const mockInsertResult = { insertedId: new ObjectId(mockGroupId) };
      mockGroupsCollection.insertOne.mockResolvedValue(mockInsertResult);

      const result = await createGroup(
        'Test Group',
        'A test group',
        mockUserId
      );

      expect(mockGroupsCollection.insertOne).toHaveBeenCalledWith({
        name: 'Test Group',
        description: 'A test group',
        adminIds: [new ObjectId(mockUserId)],
        memberIds: [new ObjectId(mockUserId)],
        collectionIds: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(result).toEqual({
        _id: new ObjectId(mockGroupId),
        name: 'Test Group',
        description: 'A test group',
        adminIds: [new ObjectId(mockUserId)],
        memberIds: [new ObjectId(mockUserId)],
        collectionIds: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should trim whitespace from name and description', async () => {
      const mockInsertResult = { insertedId: new ObjectId(mockGroupId) };
      mockGroupsCollection.insertOne.mockResolvedValue(mockInsertResult);

      await createGroup('  Test Group  ', '  A test group  ', mockUserId);

      expect(mockGroupsCollection.insertOne).toHaveBeenCalledWith({
        name: 'Test Group',
        description: 'A test group',
        adminIds: [new ObjectId(mockUserId)],
        memberIds: [new ObjectId(mockUserId)],
        collectionIds: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should handle undefined description', async () => {
      const mockInsertResult = { insertedId: new ObjectId(mockGroupId) };
      mockGroupsCollection.insertOne.mockResolvedValue(mockInsertResult);

      await createGroup('Test Group', undefined, mockUserId);

      expect(mockGroupsCollection.insertOne).toHaveBeenCalledWith({
        name: 'Test Group',
        description: undefined,
        adminIds: [new ObjectId(mockUserId)],
        memberIds: [new ObjectId(mockUserId)],
        collectionIds: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('getGroupsByUserId', () => {
    it('should return groups where user is admin or member', async () => {
      mockGroupsCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockGroup]),
        }),
      });

      const result = await getGroupsByUserId(mockUserId);

      expect(mockGroupsCollection.find).toHaveBeenCalledWith({
        $or: [
          { adminIds: new ObjectId(mockUserId) },
          { memberIds: new ObjectId(mockUserId) },
        ],
      });
      expect(result).toEqual([mockGroup]);
    });
  });

  describe('getGroupById', () => {
    it('should return group by ID', async () => {
      mockGroupsCollection.findOne.mockResolvedValue(mockGroup);

      const result = await getGroupById(mockGroupId);

      expect(mockGroupsCollection.findOne).toHaveBeenCalledWith({
        _id: new ObjectId(mockGroupId),
      });
      expect(result).toEqual(mockGroup);
    });

    it('should return null if group not found', async () => {
      mockGroupsCollection.findOne.mockResolvedValue(null);

      const result = await getGroupById(mockGroupId);

      expect(result).toBeNull();
    });
  });

  describe('updateGroup', () => {
    it('should update group if user is admin', async () => {
      const updatedGroup = { ...mockGroup, name: 'Updated Group' };
      mockGroupsCollection.findOne.mockResolvedValue(mockGroup);
      mockGroupsCollection.findOneAndUpdate.mockResolvedValue(updatedGroup);

      const result = await updateGroup(
        mockGroupId,
        { name: 'Updated Group' },
        mockUserId
      );

      expect(mockGroupsCollection.findOne).toHaveBeenCalledWith({
        _id: new ObjectId(mockGroupId),
        adminIds: new ObjectId(mockUserId),
      });
      expect(result).toEqual(updatedGroup);
    });

    it('should throw error if user is not admin', async () => {
      mockGroupsCollection.findOne.mockResolvedValue(null);

      await expect(
        updateGroup(mockGroupId, { name: 'Updated Group' }, mockUserId)
      ).rejects.toThrow('Group not found or user is not an admin');
    });
  });

  describe('deleteGroup', () => {
    it('should delete group if user is admin', async () => {
      mockGroupsCollection.findOne.mockResolvedValue(mockGroup);
      mockGroupsCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await deleteGroup(mockGroupId, mockUserId);

      expect(result).toBe(true);
    });

    it('should throw error if user is not admin', async () => {
      mockGroupsCollection.findOne.mockResolvedValue(null);

      await expect(deleteGroup(mockGroupId, mockUserId)).rejects.toThrow(
        'Group not found or user is not an admin'
      );
    });
  });

  describe('inviteUserToGroup', () => {
    it('should invite user to group', async () => {
      const targetUserId = '507f1f77bcf86cd799439013';
      mockGroupsCollection.findOne.mockResolvedValue(mockGroup);
      mockGroupsCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await inviteUserToGroup(
        mockGroupId,
        targetUserId,
        mockUserId
      );

      expect(mockGroupsCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(mockGroupId) },
        {
          $addToSet: { memberIds: new ObjectId(targetUserId) },
          $set: { updatedAt: expect.any(Date) },
        }
      );
      expect(result).toBe(true);
    });

    it('should throw error if user is already a member', async () => {
      const targetUserId = mockUserId; // Same as admin
      mockGroupsCollection.findOne.mockResolvedValue(mockGroup);

      await expect(
        inviteUserToGroup(mockGroupId, targetUserId, mockUserId)
      ).rejects.toThrow('User is already a member of this group');
    });
  });

  describe('removeUserFromGroup', () => {
    it('should remove user from group', async () => {
      const targetUserId = '507f1f77bcf86cd799439013';
      const groupWithMultipleAdmins = {
        ...mockGroup,
        adminIds: [new ObjectId(mockUserId), new ObjectId(targetUserId)],
      };
      mockGroupsCollection.findOne.mockResolvedValue(groupWithMultipleAdmins);
      mockGroupsCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await removeUserFromGroup(
        mockGroupId,
        targetUserId,
        mockUserId
      );

      expect(result).toBe(true);
    });

    it('should throw error if trying to remove last admin', async () => {
      const targetUserId = mockUserId; // Same as admin
      mockGroupsCollection.findOne.mockResolvedValue(mockGroup);

      await expect(
        removeUserFromGroup(mockGroupId, targetUserId, mockUserId)
      ).rejects.toThrow('Cannot remove the last admin from the group');
    });
  });

  describe('promoteToAdmin', () => {
    it('should promote user to admin', async () => {
      const targetUserId = '507f1f77bcf86cd799439013';
      const groupWithMember = {
        ...mockGroup,
        memberIds: [new ObjectId(mockUserId), new ObjectId(targetUserId)],
      };
      mockGroupsCollection.findOne.mockResolvedValue(groupWithMember);
      mockGroupsCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await promoteToAdmin(
        mockGroupId,
        targetUserId,
        mockUserId
      );

      expect(result).toBe(true);
    });

    it('should throw error if user is not a member', async () => {
      const targetUserId = '507f1f77bcf86cd799439013';
      mockGroupsCollection.findOne.mockResolvedValue(mockGroup);

      await expect(
        promoteToAdmin(mockGroupId, targetUserId, mockUserId)
      ).rejects.toThrow('User is not a member of this group');
    });
  });

  describe('leaveGroup', () => {
    it('should allow member to leave group', async () => {
      const memberUserId = '507f1f77bcf86cd799439013';
      const groupWithMultipleAdmins = {
        ...mockGroup,
        adminIds: [new ObjectId(mockUserId), new ObjectId(memberUserId)],
        memberIds: [new ObjectId(mockUserId), new ObjectId(memberUserId)],
      };
      mockGroupsCollection.findOne.mockResolvedValue(groupWithMultipleAdmins);
      mockGroupsCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await leaveGroup(mockGroupId, memberUserId);

      expect(result).toBe(true);
    });

    it('should throw error if trying to leave as last admin', async () => {
      mockGroupsCollection.findOne.mockResolvedValue(mockGroup);

      await expect(leaveGroup(mockGroupId, mockUserId)).rejects.toThrow(
        'Cannot leave group as the last admin'
      );
    });
  });

  describe('getGroupMembers', () => {
    it('should return group members', async () => {
      const mockMembers = [
        {
          _id: new ObjectId(mockUserId),
          name: 'Test User',
          email: 'test@example.com',
        },
      ];
      mockGroupsCollection.findOne.mockResolvedValue(mockGroup);
      mockUsersCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockMembers),
      });

      const result = await getGroupMembers(mockGroupId);

      expect(result).toEqual(mockMembers);
    });
  });

  describe('isGroupMember', () => {
    it('should return true if user is a member', async () => {
      mockGroupsCollection.findOne.mockResolvedValue(mockGroup);

      const result = await isGroupMember(mockGroupId, mockUserId);

      expect(result).toBe(true);
    });

    it('should return false if user is not a member', async () => {
      mockGroupsCollection.findOne.mockResolvedValue(null);

      const result = await isGroupMember(
        mockGroupId,
        '507f1f77bcf86cd799439013'
      );

      expect(result).toBe(false);
    });
  });

  describe('isGroupAdmin', () => {
    it('should return true if user is an admin', async () => {
      mockGroupsCollection.findOne.mockResolvedValue(mockGroup);

      const result = await isGroupAdmin(mockGroupId, mockUserId);

      expect(result).toBe(true);
    });

    it('should return false if user is not an admin', async () => {
      mockGroupsCollection.findOne.mockResolvedValue(null);

      const result = await isGroupAdmin(
        mockGroupId,
        '507f1f77bcf86cd799439013'
      );

      expect(result).toBe(false);
    });
  });
});
