import { NextRequest } from 'next/server';
import { GET, POST } from '../groups/route';
import { GET as GET_BY_ID, PUT, DELETE } from '../groups/[id]/route';
import { POST as INVITE } from '../groups/[id]/invite/route';
import { POST as LEAVE } from '../groups/[id]/leave/route';
// import { POST as PROMOTE } from '../groups/[id]/promote/route';
// import { POST as REMOVE } from '../groups/[id]/remove/route';
import { requireAuth } from '@/lib/auth';
import * as groupsLib from '@/lib/groups';
import * as dbLib from '@/lib/db';
import * as validationLib from '@/lib/validation';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// Mock the groups library
jest.mock('@/lib/groups', () => ({
  getGroupsByUserId: jest.fn(),
  getGroupById: jest.fn(),
  createGroup: jest.fn(),
  updateGroup: jest.fn(),
  deleteGroup: jest.fn(),
  inviteUserToGroup: jest.fn(),
  removeUserFromGroup: jest.fn(),
  promoteToAdmin: jest.fn(),
  leaveGroup: jest.fn(),
  getGroupMembers: jest.fn(),
}));

// Mock the validation module
jest.mock('@/lib/validation', () => ({
  validateData: jest.fn(),
  groupSchema: {},
}));

// Mock the database
jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn(),
}));

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  clerkId: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
};

const mockGroup = {
  _id: '507f1f77bcf86cd799439012',
  name: 'Test Group',
  description: 'A test group',
  adminIds: ['507f1f77bcf86cd799439011'],
  memberIds: ['507f1f77bcf86cd799439011'],
  collectionIds: [],
  createdAt: new Date('2025-09-29T03:58:07.936Z'),
  updatedAt: new Date('2025-09-29T03:58:07.936Z'),
};

const mockMembers = [
  {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
  },
];

describe('Groups API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue(mockUser);
  });

  describe('GET /api/groups', () => {
    it('should return user groups', async () => {
      const { getGroupsByUserId } = groupsLib;
      (getGroupsByUserId as jest.Mock).mockResolvedValue([mockGroup]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.groups).toEqual([
        {
          ...mockGroup,
          createdAt: mockGroup.createdAt.toISOString(),
          updatedAt: mockGroup.updatedAt.toISOString(),
        },
      ]);
      expect(getGroupsByUserId).toHaveBeenCalledWith(mockUser._id);
    });

    it('should handle errors', async () => {
      const { getGroupsByUserId } = groupsLib;
      (getGroupsByUserId as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch groups');
    });
  });

  describe('POST /api/groups', () => {
    it('should create a new group', async () => {
      const { createGroup } = groupsLib;
      const { validateData } = validationLib;

      (validateData as jest.Mock).mockReturnValue({
        success: true,
        data: { name: 'Test Group', description: 'A test group' },
      });
      (createGroup as jest.Mock).mockResolvedValue(mockGroup);

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Group',
          description: 'A test group',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.group).toEqual({
        ...mockGroup,
        createdAt: mockGroup.createdAt.toISOString(),
        updatedAt: mockGroup.updatedAt.toISOString(),
      });
      expect(createGroup).toHaveBeenCalledWith(
        'Test Group',
        'A test group',
        mockUser._id
      );
    });

    it('should handle validation errors', async () => {
      const { validateData } = validationLib;

      (validateData as jest.Mock).mockReturnValue({
        success: false,
        error: 'Name is required',
      });

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: '',
          description: 'A test group',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name is required');
    });

    it('should handle creation errors', async () => {
      const { createGroup } = groupsLib;
      const { validateData } = validationLib;

      (validateData as jest.Mock).mockReturnValue({
        success: true,
        data: { name: 'Test Group', description: 'A test group' },
      });
      (createGroup as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Group',
          description: 'A test group',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create group');
    });
  });

  describe('GET /api/groups/[id]', () => {
    it('should return group with members', async () => {
      const { getGroupById, getGroupMembers } = groupsLib;

      (getGroupById as jest.Mock).mockResolvedValue(mockGroup);
      (getGroupMembers as jest.Mock).mockResolvedValue(mockMembers);

      const request = new NextRequest(
        'http://localhost:3000/api/groups/507f1f77bcf86cd799439012'
      );
      const response = await GET_BY_ID(request, {
        params: { id: '507f1f77bcf86cd799439012' },
      } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.group).toEqual({
        ...mockGroup,
        members: mockMembers,
        createdAt: mockGroup.createdAt.toISOString(),
        updatedAt: mockGroup.updatedAt.toISOString(),
      });
    });

    it('should return 404 if group not found', async () => {
      const { getGroupById } = groupsLib;

      (getGroupById as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/groups/507f1f77bcf86cd799439012'
      );
      const response = await GET_BY_ID(request, {
        params: { id: '507f1f77bcf86cd799439012' },
      } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Group not found');
    });
  });

  describe('PUT /api/groups/[id]', () => {
    it('should update group if user is admin', async () => {
      const { updateGroup } = groupsLib;
      const { validateData } = validationLib;

      (validateData as jest.Mock).mockReturnValue({
        success: true,
        data: { name: 'Updated Group', description: 'Updated description' },
      });
      (updateGroup as jest.Mock).mockResolvedValue({
        ...mockGroup,
        name: 'Updated Group',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/groups/507f1f77bcf86cd799439012',
        {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Updated Group',
            description: 'Updated description',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await PUT(request, {
        params: { id: '507f1f77bcf86cd799439012' },
      } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.group.name).toBe('Updated Group');
    });

    it('should return 403 if user is not admin', async () => {
      const { updateGroup } = groupsLib;
      const { validateData } = validationLib;

      (validateData as jest.Mock).mockReturnValue({
        success: true,
        data: { name: 'Updated Group' },
      });
      (updateGroup as jest.Mock).mockRejectedValue(
        new Error('Group not found or user is not an admin')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/groups/507f1f77bcf86cd799439012',
        {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Updated Group',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await PUT(request, {
        params: { id: '507f1f77bcf86cd799439012' },
      } as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Group not found or user is not an admin');
    });
  });

  describe('DELETE /api/groups/[id]', () => {
    it('should delete group if user is admin', async () => {
      const { deleteGroup } = groupsLib;

      (deleteGroup as jest.Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/groups/507f1f77bcf86cd799439012',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: { id: '507f1f77bcf86cd799439012' },
      } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 403 if user is not admin', async () => {
      const { deleteGroup } = groupsLib;

      (deleteGroup as jest.Mock).mockRejectedValue(
        new Error('Group not found or user is not an admin')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/groups/507f1f77bcf86cd799439012',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: { id: '507f1f77bcf86cd799439012' },
      } as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Group not found or user is not an admin');
    });
  });

  describe('POST /api/groups/[id]/invite', () => {
    it('should invite user to group', async () => {
      const { inviteUserToGroup } = groupsLib;
      const { connectToDatabase } = dbLib;

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue({
            _id: '507f1f77bcf86cd799439013',
            email: 'friend@example.com',
            name: 'Friend User',
          }),
        }),
      };
      (connectToDatabase as jest.Mock).mockResolvedValue(mockDb);
      (inviteUserToGroup as jest.Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/groups/507f1f77bcf86cd799439012/invite',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'friend@example.com',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await INVITE(request, {
        params: { id: '507f1f77bcf86cd799439012' },
      } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Successfully invited');
    });

    it('should return 404 if user not found', async () => {
      const { connectToDatabase } = dbLib;

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        }),
      };
      (connectToDatabase as jest.Mock).mockResolvedValue(mockDb);

      const request = new NextRequest(
        'http://localhost:3000/api/groups/507f1f77bcf86cd799439012/invite',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'nonexistent@example.com',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await INVITE(request, {
        params: { id: '507f1f77bcf86cd799439012' },
      } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });

  describe('POST /api/groups/[id]/leave', () => {
    it('should allow user to leave group', async () => {
      const { leaveGroup } = groupsLib;

      (leaveGroup as jest.Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/groups/507f1f77bcf86cd799439012/leave',
        {
          method: 'POST',
        }
      );

      const response = await LEAVE(request, {
        params: { id: '507f1f77bcf86cd799439012' },
      } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Successfully left the group');
    });

    it('should handle last admin error', async () => {
      const { leaveGroup } = groupsLib;

      (leaveGroup as jest.Mock).mockRejectedValue(
        new Error('Cannot leave group as the last admin')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/groups/507f1f77bcf86cd799439012/leave',
        {
          method: 'POST',
        }
      );

      const response = await LEAVE(request, {
        params: { id: '507f1f77bcf86cd799439012' },
      } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Cannot leave group as the last admin. Promote another member to admin first.'
      );
    });
  });
});
