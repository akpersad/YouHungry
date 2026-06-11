/**
 * Group membership / participant authorization tests for the group decision
 * routes:
 * - POST/GET /api/decisions/group
 * - POST /api/decisions/group/random-select
 * - POST/PUT /api/decisions/group/vote
 * - GET /api/decisions/group/subscribe (SSE)
 */
import { NextRequest } from 'next/server';
import { POST as groupPOST, GET as groupGET } from '../decisions/group/route';
import { POST as randomSelectPOST } from '../decisions/group/random-select/route';
import {
  POST as votePOST,
  PUT as votePUT,
} from '../decisions/group/vote/route';
import { GET as subscribeGET } from '../decisions/group/subscribe/route';

jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
  getCurrentUser: jest.fn(),
}));
jest.mock('@/lib/decisions', () => ({
  createGroupDecision: jest.fn(),
  getActiveGroupDecisions: jest.fn(),
  getAllGroupDecisions: jest.fn(),
  performGroupRandomSelection: jest.fn(),
  submitGroupVote: jest.fn(),
  completeTieredGroupDecision: jest.fn(),
  closeGroupDecision: jest.fn(),
  getGroupDecision: jest.fn(),
}));
jest.mock('@/lib/groups', () => ({
  getGroupById: jest.fn(),
  isGroupMemberOrAdmin: jest.fn(),
}));
jest.mock('@/lib/decision-notifications', () => ({
  sendDecisionStartedNotifications: jest.fn(),
  sendDecisionCompletedNotifications: jest.fn(),
}));
jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn(),
}));
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { requireAuth, getCurrentUser } from '@/lib/auth';
import {
  createGroupDecision,
  getAllGroupDecisions,
  performGroupRandomSelection,
  submitGroupVote,
  completeTieredGroupDecision,
  getGroupDecision,
} from '@/lib/decisions';
import { getGroupById, isGroupMemberOrAdmin } from '@/lib/groups';
import { connectToDatabase } from '@/lib/db';

const MEMBER_ID = '507f1f77bcf86cd799439010';
const OUTSIDER_ID = '507f1f77bcf86cd799439055';
const GROUP_ID = '507f1f77bcf86cd799439099';
const COLLECTION_ID = '507f1f77bcf86cd799439011';

const memberUser = {
  _id: { toString: () => MEMBER_ID },
  clerkId: 'clerk_member_123',
} as any;

const outsiderUser = {
  _id: { toString: () => OUTSIDER_ID },
  clerkId: 'clerk_outsider_456',
} as any;

const mockGroup = {
  _id: { toString: () => GROUP_ID },
  adminIds: [{ toString: () => MEMBER_ID }],
  memberIds: [{ toString: () => MEMBER_ID }],
} as any;

const mockDecision = {
  _id: { toString: () => 'decision123' },
  type: 'group',
  collectionId: { toString: () => COLLECTION_ID },
  groupId: { toString: () => GROUP_ID },
  method: 'tiered',
  status: 'active',
  deadline: new Date('2024-01-02T00:00:00Z'),
  visitDate: new Date('2024-01-01T19:00:00Z'),
  participants: [MEMBER_ID],
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
} as any;

describe('group decision route authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue(memberUser);
    (getCurrentUser as jest.Mock).mockResolvedValue(memberUser);
    (getGroupById as jest.Mock).mockResolvedValue(mockGroup);
    (isGroupMemberOrAdmin as jest.Mock).mockResolvedValue(true);
    (connectToDatabase as jest.Mock).mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      }),
    });
  });

  describe('POST /api/decisions/group', () => {
    const makeRequest = () =>
      new NextRequest('http://localhost:3000/api/decisions/group', {
        method: 'POST',
        body: JSON.stringify({
          collectionId: COLLECTION_ID,
          groupId: GROUP_ID,
          method: 'tiered',
          visitDate: '2024-01-01T19:00:00Z',
        }),
      });

    it('allows a group member to start a decision', async () => {
      (createGroupDecision as jest.Mock).mockResolvedValue(mockDecision);

      const response = await groupPOST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(createGroupDecision).toHaveBeenCalled();
    });

    it('returns 403 when the caller is not a group member', async () => {
      (requireAuth as jest.Mock).mockResolvedValue(outsiderUser);
      (getCurrentUser as jest.Mock).mockResolvedValue(outsiderUser);

      const response = await groupPOST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You are not a member of this group');
      expect(createGroupDecision).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/decisions/group', () => {
    it('returns the decisions for a group member', async () => {
      (getAllGroupDecisions as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost:3000/api/decisions/group?groupId=${GROUP_ID}`
      );
      const response = await groupGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(isGroupMemberOrAdmin).toHaveBeenCalledWith(GROUP_ID, MEMBER_ID);
    });

    it('returns 403 when the caller is not a group member', async () => {
      (isGroupMemberOrAdmin as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest(
        `http://localhost:3000/api/decisions/group?groupId=${GROUP_ID}`
      );
      const response = await groupGET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You are not a member of this group');
      expect(getAllGroupDecisions).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/decisions/group/random-select', () => {
    const makeRequest = () =>
      new NextRequest(
        'http://localhost:3000/api/decisions/group/random-select',
        {
          method: 'POST',
          body: JSON.stringify({
            collectionId: COLLECTION_ID,
            groupId: GROUP_ID,
            visitDate: '2024-01-01T19:00:00Z',
          }),
        }
      );

    it('allows a group member to run a random selection', async () => {
      (performGroupRandomSelection as jest.Mock).mockResolvedValue({
        restaurantId: { toString: () => 'restaurant123' },
        selectedAt: new Date('2024-01-01T18:30:00Z'),
        reasoning: 'Selected using weighted random algorithm for group.',
        weights: {},
      });

      const response = await randomSelectPOST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(performGroupRandomSelection).toHaveBeenCalled();
    });

    it('returns 403 when the caller is not a group member', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(outsiderUser);

      const response = await randomSelectPOST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You are not a member of this group');
      expect(performGroupRandomSelection).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/decisions/group/vote', () => {
    it('passes the caller Mongo id to submitGroupVote (which enforces participation)', async () => {
      (submitGroupVote as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Vote submitted successfully',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/decisions/group/vote',
        {
          method: 'POST',
          body: JSON.stringify({
            decisionId: 'decision123',
            rankings: ['restaurant1'],
          }),
        }
      );
      const response = await votePOST(request);

      expect(response.status).toBe(200);
      // Group decision participants are Mongo ObjectId strings
      expect(submitGroupVote).toHaveBeenCalledWith('decision123', MEMBER_ID, [
        'restaurant1',
      ]);
    });

    it('maps a non-participant rejection from submitGroupVote to an error response', async () => {
      (submitGroupVote as jest.Mock).mockRejectedValue(
        new Error('User is not a participant in this decision')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/decisions/group/vote',
        {
          method: 'POST',
          body: JSON.stringify({
            decisionId: 'decision123',
            rankings: ['restaurant1'],
          }),
        }
      );
      const response = await votePOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User is not a participant in this decision');
    });
  });

  describe('PUT /api/decisions/group/vote (complete decision)', () => {
    const makeRequest = () =>
      new NextRequest('http://localhost:3000/api/decisions/group/vote', {
        method: 'PUT',
        body: JSON.stringify({ decisionId: 'decision123' }),
      });

    it('allows a participant to complete the decision', async () => {
      (getGroupDecision as jest.Mock).mockResolvedValue(mockDecision);
      (completeTieredGroupDecision as jest.Mock).mockResolvedValue({
        restaurantId: { toString: () => 'restaurant123' },
        selectedAt: new Date('2024-01-01T18:30:00Z'),
        reasoning: 'Clear winner',
        weights: {},
      });

      const response = await votePUT(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(completeTieredGroupDecision).toHaveBeenCalledWith('decision123');
    });

    it('returns 404 when the decision does not exist', async () => {
      (getGroupDecision as jest.Mock).mockResolvedValue(null);

      const response = await votePUT(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Decision not found');
      expect(completeTieredGroupDecision).not.toHaveBeenCalled();
    });

    it('returns 403 when the caller is not a participant', async () => {
      (requireAuth as jest.Mock).mockResolvedValue(outsiderUser);
      (getGroupDecision as jest.Mock).mockResolvedValue(mockDecision);

      const response = await votePUT(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You are not a participant in this decision');
      expect(completeTieredGroupDecision).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/decisions/group/subscribe (SSE)', () => {
    it('returns 401 when unauthenticated', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/decisions/group/subscribe?groupId=${GROUP_ID}`
      );
      const response = await subscribeGET(request);

      expect(response.status).toBe(401);
    });

    it('returns 403 when the caller is not a member of the group', async () => {
      (isGroupMemberOrAdmin as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest(
        `http://localhost:3000/api/decisions/group/subscribe?groupId=${GROUP_ID}`
      );
      const response = await subscribeGET(request);

      expect(response.status).toBe(403);
      expect(isGroupMemberOrAdmin).toHaveBeenCalledWith(GROUP_ID, MEMBER_ID);
    });

    it('returns 404 when subscribing to a missing decision', async () => {
      (getGroupDecision as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/decisions/group/subscribe?decisionId=decision123'
      );
      const response = await subscribeGET(request);

      expect(response.status).toBe(404);
    });

    it('returns 403 when subscribing to a foreign decision', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(outsiderUser);
      (getGroupDecision as jest.Mock).mockResolvedValue(mockDecision);
      (isGroupMemberOrAdmin as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/decisions/group/subscribe?decisionId=decision123'
      );
      const response = await subscribeGET(request);

      expect(response.status).toBe(403);
    });
  });
});
