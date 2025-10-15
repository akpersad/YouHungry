import { NextRequest } from 'next/server';
import { POST, GET } from '../decisions/route';
import {
  POST as randomSelectPOST,
  GET as randomSelectGET,
} from '../decisions/random-select/route';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

// Mock the decisions library
jest.mock('@/lib/decisions', () => ({
  createPersonalDecision: jest.fn(),
  getDecisionHistory: jest.fn(),
  performRandomSelection: jest.fn(),
  getDecisionStatistics: jest.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import {
  createPersonalDecision,
  getDecisionHistory,
  performRandomSelection,
  getDecisionStatistics,
} from '@/lib/decisions';

describe('/api/decisions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/decisions', () => {
    it('should create a personal decision successfully', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'user123' });
      (createPersonalDecision as jest.Mock).mockResolvedValue({
        _id: 'decision123',
        type: 'personal',
        collectionId: 'collection123',
        method: 'random',
        status: 'active',
        deadline: new Date('2024-01-02T00:00:00Z'),
        visitDate: new Date('2024-01-01T19:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });

      const request = new NextRequest('http://localhost:3000/api/decisions', {
        method: 'POST',
        body: JSON.stringify({
          collectionId: 'collection123',
          method: 'random',
          visitDate: '2024-01-01T19:00:00Z',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.decision).toMatchObject({
        id: 'decision123',
        type: 'personal',
        collectionId: 'collection123',
        method: 'random',
        status: 'active',
      });
      expect(createPersonalDecision).toHaveBeenCalledWith(
        'collection123',
        'user123',
        'random',
        new Date('2024-01-01T19:00:00Z')
      );
    });

    it('should return 401 if user not authenticated', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/decisions', {
        method: 'POST',
        body: JSON.stringify({
          collectionId: 'collection123',
          method: 'random',
          visitDate: '2024-01-01T19:00:00Z',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for invalid input', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'user123' });

      const request = new NextRequest('http://localhost:3000/api/decisions', {
        method: 'POST',
        body: JSON.stringify({
          collectionId: '', // Invalid empty string
          method: 'invalid', // Invalid method
          visitDate: 'invalid-date', // Invalid date
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
      expect(data.details).toBeDefined();
    });
  });

  describe('GET /api/decisions', () => {
    it('should return decision history and validate required params', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'user123' });

      // Test missing collectionId
      const invalidRequest = new NextRequest(
        'http://localhost:3000/api/decisions'
      );
      const invalidResponse = await GET(invalidRequest);
      const invalidData = await invalidResponse.json();

      expect(invalidResponse.status).toBe(400);
      expect(invalidData.error).toBe('Collection ID is required');

      // Test successful history retrieval
      (getDecisionHistory as jest.Mock).mockResolvedValue([
        {
          _id: 'decision123',
          type: 'personal',
          collectionId: 'collection123',
          method: 'random',
          status: 'completed',
          deadline: new Date('2024-01-02T00:00:00Z'),
          visitDate: new Date('2024-01-01T19:00:00Z'),
          result: {
            restaurantId: 'restaurant123',
            selectedAt: new Date('2024-01-01T18:30:00Z'),
            reasoning: 'Selected using weighted random algorithm',
          },
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-01T18:30:00Z'),
        },
      ]);

      const validRequest = new NextRequest(
        'http://localhost:3000/api/decisions?collectionId=collection123&limit=50'
      );
      const response = await GET(validRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.decisions).toHaveLength(1);
      expect(data.decisions[0]).toMatchObject({
        id: 'decision123',
        type: 'personal',
        collectionId: 'collection123',
        method: 'random',
        status: 'completed',
        result: {
          restaurantId: 'restaurant123',
          selectedAt: '2024-01-01T18:30:00.000Z',
          reasoning: 'Selected using weighted random algorithm',
        },
      });
      expect(getDecisionHistory).toHaveBeenCalledWith('collection123', 50);
    });
  });
});

describe('/api/decisions/random-select', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/decisions/random-select', () => {
    it('should perform random selection successfully', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'user123' });
      (performRandomSelection as jest.Mock).mockResolvedValue({
        restaurantId: 'restaurant123',
        selectedAt: new Date('2024-01-01T18:30:00Z'),
        reasoning:
          'Selected using weighted random algorithm. Weight: 0.85, Previous selections: 2',
        weights: {
          restaurant123: 0.85,
          restaurant456: 0.95,
        },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/decisions/random-select',
        {
          method: 'POST',
          body: JSON.stringify({
            collectionId: 'collection123',
            visitDate: '2024-01-01T19:00:00Z',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await randomSelectPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result).toMatchObject({
        restaurantId: 'restaurant123',
        selectedAt: '2024-01-01T18:30:00.000Z',
        reasoning:
          'Selected using weighted random algorithm. Weight: 0.85, Previous selections: 2',
        weights: {
          restaurant123: 0.85,
          restaurant456: 0.95,
        },
      });
      expect(performRandomSelection).toHaveBeenCalledWith(
        'collection123',
        'user123',
        new Date('2024-01-01T19:00:00Z')
      );
    });

    it('should return 400 for invalid input', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'user123' });

      const request = new NextRequest(
        'http://localhost:3000/api/decisions/random-select',
        {
          method: 'POST',
          body: JSON.stringify({
            collectionId: '', // Invalid empty string
            visitDate: 'invalid-date', // Invalid date
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await randomSelectPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should handle decision errors', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'user123' });
      (performRandomSelection as jest.Mock).mockRejectedValue(
        new Error('No restaurants in collection')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/decisions/random-select',
        {
          method: 'POST',
          body: JSON.stringify({
            collectionId: 'collection123',
            visitDate: '2024-01-01T19:00:00Z',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await randomSelectPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No restaurants in collection');
    });
  });

  describe('GET /api/decisions/random-select', () => {
    it('should return statistics and validate required params', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'user123' });

      // Test missing collectionId
      const invalidRequest = new NextRequest(
        'http://localhost:3000/api/decisions/random-select'
      );
      const invalidResponse = await randomSelectGET(invalidRequest);
      const invalidData = await invalidResponse.json();

      expect(invalidResponse.status).toBe(400);
      expect(invalidData.error).toBe('Collection ID is required');

      // Test successful statistics retrieval
      (getDecisionStatistics as jest.Mock).mockResolvedValue({
        totalDecisions: 5,
        restaurantStats: [
          {
            restaurantId: 'restaurant123',
            name: 'Restaurant 1',
            selectionCount: 3,
            lastSelected: new Date('2024-01-01T18:30:00Z'),
            currentWeight: 0.85,
          },
          {
            restaurantId: 'restaurant456',
            name: 'Restaurant 2',
            selectionCount: 2,
            lastSelected: new Date('2023-12-15T12:00:00Z'),
            currentWeight: 0.95,
          },
        ],
      });

      const validRequest = new NextRequest(
        'http://localhost:3000/api/decisions/random-select?collectionId=collection123'
      );
      const response = await randomSelectGET(validRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.statistics).toMatchObject({
        totalDecisions: 5,
        restaurantStats: [
          {
            restaurantId: 'restaurant123',
            name: 'Restaurant 1',
            selectionCount: 3,
            lastSelected: '2024-01-01T18:30:00.000Z',
            currentWeight: 0.85,
          },
          {
            restaurantId: 'restaurant456',
            name: 'Restaurant 2',
            selectionCount: 2,
            lastSelected: '2023-12-15T12:00:00.000Z',
            currentWeight: 0.95,
          },
        ],
      });
      expect(getDecisionStatistics).toHaveBeenCalledWith('collection123');
    });
  });
});
