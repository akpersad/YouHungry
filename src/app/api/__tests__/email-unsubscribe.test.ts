import { NextRequest } from 'next/server';
import { GET } from '@/app/api/email/unsubscribe/route';
import { connectToDatabase } from '@/lib/db';

// Mock the database connection
jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the rate limiter (keep the real key helpers + 429 response builder)
jest.mock('@/lib/rate-limit', () => {
  const actual = jest.requireActual('@/lib/rate-limit');
  return { ...actual, checkRateLimit: jest.fn() };
});

import { checkRateLimit } from '@/lib/rate-limit';
const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<
  typeof checkRateLimit
>;

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<
  typeof connectToDatabase
>;
import { logger } from '@/lib/logger';
const mockLogger = logger as jest.Mocked<typeof logger>;

function mockDbWithUpdateResult(matchedCount: number) {
  const mockCollection = {
    findOne: jest.fn(),
    updateOne: jest
      .fn()
      .mockResolvedValue({ acknowledged: true, matchedCount }),
  };

  const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockConnectToDatabase.mockResolvedValue(mockDb as any);

  return mockCollection;
}

describe('/api/email/unsubscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 9,
      retryAfterSeconds: 0,
    });
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  describe('GET', () => {
    it('should return 429 when the per-IP rate limit is exceeded', async () => {
      const mockCollection = mockDbWithUpdateResult(1);
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 3600,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/unsubscribe?email=test@example.com',
        { headers: { 'x-forwarded-for': '203.0.113.7' } }
      );

      const response = await GET(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('3600');
      expect(mockCheckRateLimit).toHaveBeenCalledWith({
        key: 'email-unsubscribe:ip:203.0.113.7',
        limit: 10,
        windowMs: 60 * 60 * 1000,
      });
      expect(mockCollection.updateOne).not.toHaveBeenCalled();
    });

    it('should unsubscribe an existing user by email', async () => {
      const mockCollection = mockDbWithUpdateResult(1);

      const request = new NextRequest(
        'http://localhost:3000/api/email/unsubscribe?email=test@example.com'
      );

      const response = await GET(request);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(html).toContain('Unsubscribe Request Processed');
      expect(html).toContain(
        'If this address was subscribed to Fork In The Road email notifications, it has been unsubscribed'
      );

      // No lookup that could distinguish existing from unknown emails
      expect(mockCollection.findOne).not.toHaveBeenCalled();
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        {
          $set: {
            'preferences.notificationSettings.emailEnabled': false,
            updatedAt: expect.any(Date),
          },
        }
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Email unsubscribe attempt processed',
        { email: 'test@example.com', matched: true }
      );
    });

    it('should return an identical response when the email does not exist (no enumeration)', async () => {
      const mockCollection = mockDbWithUpdateResult(0);

      const request = new NextRequest(
        'http://localhost:3000/api/email/unsubscribe?email=nonexistent@example.com'
      );

      const response = await GET(request);
      const html = await response.text();

      // Same status and message as the existing-user case so the endpoint
      // cannot be used to discover registered email addresses
      expect(response.status).toBe(200);
      expect(html).toContain('Unsubscribe Request Processed');
      expect(html).toContain(
        'If this address was subscribed to Fork In The Road email notifications, it has been unsubscribed'
      );
      expect(html).not.toContain('User not found');

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { email: 'nonexistent@example.com' },
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Email unsubscribe attempt processed',
        { email: 'nonexistent@example.com', matched: false }
      );
    });

    it('should produce byte-identical pages for known and unknown emails', async () => {
      mockDbWithUpdateResult(1);
      const knownResponse = await GET(
        new NextRequest(
          'http://localhost:3000/api/email/unsubscribe?email=test@example.com'
        )
      );
      const knownHtml = await knownResponse.text();

      mockDbWithUpdateResult(0);
      const unknownResponse = await GET(
        new NextRequest(
          'http://localhost:3000/api/email/unsubscribe?email=unknown@example.com'
        )
      );
      const unknownHtml = await unknownResponse.text();

      expect(knownResponse.status).toBe(unknownResponse.status);
      expect(knownHtml).toBe(unknownHtml);
    });

    it('should handle token-based unsubscribe (not implemented)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/email/unsubscribe?token=some-token'
      );

      const response = await GET(request);
      const html = await response.text();

      expect(response.status).toBe(501);
      expect(html).toContain('Token-based unsubscribe is not yet implemented');
      expect(mockConnectToDatabase).not.toHaveBeenCalled();
    });

    it('should handle missing parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/email/unsubscribe'
      );

      const response = await GET(request);
      const html = await response.text();

      expect(response.status).toBe(400);
      expect(html).toContain('Invalid unsubscribe link');
    });

    it('should handle database errors', async () => {
      mockConnectToDatabase.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/email/unsubscribe?email=test@example.com'
      );

      const response = await GET(request);
      const html = await response.text();

      expect(response.status).toBe(500);
      expect(html).toContain(
        'An error occurred while processing your unsubscribe request'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unsubscribe error:',
        expect.any(Error)
      );
    });

    it('should include proper HTML structure', async () => {
      mockDbWithUpdateResult(1);

      const request = new NextRequest(
        'http://localhost:3000/api/email/unsubscribe?email=test@example.com'
      );

      const response = await GET(request);
      const html = await response.text();

      expect(response.headers.get('Content-Type')).toBe('text/html');
      expect(html).toContain('<html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<title>Unsubscribed - Fork In The Road</title>');
      expect(html).toContain('<body style=');
      expect(html).toContain('Return to Fork In The Road');
      expect(html).toContain('http://localhost:3000');
    });
  });
});
