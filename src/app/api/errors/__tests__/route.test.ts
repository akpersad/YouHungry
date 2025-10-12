/**
 * Error Logging API Tests
 */

import { POST } from '../route';
import { auth } from '@clerk/nextjs/server';
import { logError } from '@/lib/error-tracking';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/error-tracking');

describe('POST /api/errors', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockLogError = logError as jest.MockedFunction<typeof logError>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log error successfully for authenticated user', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
      sessionClaims: {
        email: 'test@example.com',
        name: 'Test User',
      },
    } as any);

    mockLogError.mockResolvedValue();

    const request = new NextRequest('http://localhost:3000/api/errors', {
      method: 'POST',
      body: JSON.stringify({
        error: {
          message: 'Test error',
          stack: 'Error stack trace',
        },
        url: 'http://localhost:3000/test',
        userAgent: 'Mozilla/5.0',
        screenSize: '1920x1080',
        additionalData: { test: 'data' },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        mongoUserId: undefined, // Will be undefined since getUserByClerkId is not mocked
        userEmail: 'test@example.com',
        userName: 'Test User',
        url: 'http://localhost:3000/test',
      })
    );
  });

  it('should log error for anonymous user', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
      sessionClaims: null,
    } as any);

    mockLogError.mockResolvedValue();

    const request = new NextRequest('http://localhost:3000/api/errors', {
      method: 'POST',
      body: JSON.stringify({
        error: {
          message: 'Test error',
        },
        url: 'http://localhost:3000/test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        mongoUserId: undefined,
        url: 'http://localhost:3000/test',
      })
    );
  });

  it('should handle errors gracefully', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
      sessionClaims: { email: 'test@example.com' },
    } as any);

    mockLogError.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/errors', {
      method: 'POST',
      body: JSON.stringify({
        error: { message: 'Test error' },
        url: 'http://localhost:3000/test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to log error');
  });
});
