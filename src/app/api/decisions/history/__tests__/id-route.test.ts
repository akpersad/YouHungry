/**
 * Unit tests for the /api/decisions/history/[id] route
 * Tests PATCH (update amount spent) and DELETE (delete decision) functionality
 */

import { PATCH, DELETE } from '../[id]/route';
import { getCurrentUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';

// Mock external dependencies
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));
jest.mock('@/lib/db');
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('PATCH /api/decisions/history/[id] - Update Amount Spent', () => {
  let mockDb: any;
  let mockDecisionsCollection: any;
  const mockAuth = getCurrentUser as unknown as jest.Mock;
  const mockConnectToDatabase = connectToDatabase as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDecisionsCollection = {
      findOne: jest.fn(),
      updateOne: jest.fn(),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockDecisionsCollection),
    };

    mockConnectToDatabase.mockResolvedValue(mockDb);
  });

  it('should update amount spent successfully', async () => {
    const userId = 'user_123';
    const decisionId = new ObjectId('507f1f77bcf86cd799439011');

    mockAuth.mockResolvedValue({
      _id: { toString: () => 'dbUser123' },
      clerkId: userId,
    });
    mockDecisionsCollection.findOne.mockResolvedValue({
      _id: decisionId,
      participants: [userId],
      status: 'completed',
    });
    mockDecisionsCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const request = new NextRequest(
      `http://localhost/api/decisions/history/${decisionId.toString()}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ amountSpent: 45.99 }),
      }
    );

    const context = { params: Promise.resolve({ id: decisionId.toString() }) };
    const response = await PATCH(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.amountSpent).toBe(45.99);
    // Personal decisions store the Clerk ID in participants; group decisions
    // store Mongo ObjectId strings - the lookup must match both
    expect(mockDecisionsCollection.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        participants: { $in: [userId, 'dbUser123'] },
      })
    );
  });

  it('should return 404 when the caller is not a participant', async () => {
    const userId = 'user_123';
    const decisionId = new ObjectId('507f1f77bcf86cd799439021');

    mockAuth.mockResolvedValue({
      _id: { toString: () => 'dbUser123' },
      clerkId: userId,
    });
    // The participant-scoped query returns nothing for foreign decisions
    mockDecisionsCollection.findOne.mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost/api/decisions/history/${decisionId.toString()}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ amountSpent: 45.99 }),
      }
    );

    const context = { params: Promise.resolve({ id: decisionId.toString() }) };
    const response = await PATCH(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Decision not found or unauthorized');
    expect(mockDecisionsCollection.updateOne).not.toHaveBeenCalled();
  });

  it('should reject negative amounts', async () => {
    const userId = 'user_123';
    const decisionId = new ObjectId('507f1f77bcf86cd799439012');

    mockAuth.mockResolvedValue({
      _id: { toString: () => 'dbUser123' },
      clerkId: userId,
    });

    const request = new NextRequest(
      `http://localhost/api/decisions/history/${decisionId.toString()}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ amountSpent: -10 }),
      }
    );

    const context = { params: Promise.resolve({ id: decisionId.toString() }) };
    const response = await PATCH(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request data');
  });

  it('should require authentication', async () => {
    const decisionId = new ObjectId('507f1f77bcf86cd799439013');

    mockAuth.mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost/api/decisions/history/${decisionId.toString()}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ amountSpent: 50 }),
      }
    );

    const context = { params: Promise.resolve({ id: decisionId.toString() }) };
    const response = await PATCH(request, context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should validate ObjectId', async () => {
    const userId = 'user_123';

    mockAuth.mockResolvedValue({
      _id: { toString: () => 'dbUser123' },
      clerkId: userId,
    });

    const request = new NextRequest(
      `http://localhost/api/decisions/history/invalid-id`,
      {
        method: 'PATCH',
        body: JSON.stringify({ amountSpent: 50 }),
      }
    );

    const context = { params: Promise.resolve({ id: 'invalid-id' }) };
    const response = await PATCH(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid decision ID');
  });
});

describe('DELETE /api/decisions/history/[id] - Delete Decision', () => {
  let mockDb: any;
  let mockDecisionsCollection: any;
  const mockAuth = getCurrentUser as unknown as jest.Mock;
  const mockConnectToDatabase = connectToDatabase as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDecisionsCollection = {
      findOne: jest.fn(),
      deleteOne: jest.fn(),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockDecisionsCollection),
    };

    mockConnectToDatabase.mockResolvedValue(mockDb);
  });

  it('should delete decision successfully', async () => {
    const userId = 'user_123';
    const decisionId = new ObjectId('507f1f77bcf86cd799439014');

    mockAuth.mockResolvedValue({
      _id: { toString: () => 'dbUser123' },
      clerkId: userId,
    });
    mockDecisionsCollection.findOne.mockResolvedValue({
      _id: decisionId,
      participants: [userId],
    });
    mockDecisionsCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const request = new NextRequest(
      `http://localhost/api/decisions/history/${decisionId.toString()}`,
      {
        method: 'DELETE',
      }
    );

    const context = { params: Promise.resolve({ id: decisionId.toString() }) };
    const response = await DELETE(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockDecisionsCollection.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        participants: { $in: [userId, 'dbUser123'] },
      })
    );
  });

  it('should require authentication', async () => {
    const decisionId = new ObjectId('507f1f77bcf86cd799439015');

    mockAuth.mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost/api/decisions/history/${decisionId.toString()}`,
      {
        method: 'DELETE',
      }
    );

    const context = { params: Promise.resolve({ id: decisionId.toString() }) };
    const response = await DELETE(request, context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should validate ObjectId', async () => {
    const userId = 'user_123';

    mockAuth.mockResolvedValue({
      _id: { toString: () => 'dbUser123' },
      clerkId: userId,
    });

    const request = new NextRequest(
      `http://localhost/api/decisions/history/invalid-id`,
      {
        method: 'DELETE',
      }
    );

    const context = { params: Promise.resolve({ id: 'invalid-id' }) };
    const response = await DELETE(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid decision ID');
  });

  it('should return 404 if decision not found', async () => {
    const userId = 'user_123';
    const decisionId = new ObjectId('507f1f77bcf86cd799439016');

    mockAuth.mockResolvedValue({
      _id: { toString: () => 'dbUser123' },
      clerkId: userId,
    });
    mockDecisionsCollection.findOne.mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost/api/decisions/history/${decisionId.toString()}`,
      {
        method: 'DELETE',
      }
    );

    const context = { params: Promise.resolve({ id: decisionId.toString() }) };
    const response = await DELETE(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Decision not found or unauthorized');
  });
});
