import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

// Mock Twilio so no real verification SMS is ever sent. Inner mocks are
// exposed on the default export so tests can assert against them.
jest.mock('twilio', () => {
  const verifications = { create: jest.fn() };
  const verificationChecks = { create: jest.fn() };
  const client = {
    verify: {
      v2: {
        services: jest.fn(() => ({ verifications, verificationChecks })),
      },
    },
  };
  const twilioMock = Object.assign(
    jest.fn(() => client),
    {
      __verifications: verifications,
      __verificationChecks: verificationChecks,
    }
  );
  return { __esModule: true, default: twilioMock };
});

// Mock the database connection
jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn(),
}));

// Mock API usage tracking
jest.mock('@/lib/api-usage-tracker', () => ({
  trackAPIUsage: jest.fn().mockResolvedValue(undefined),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the rate limiter (keep the real key helpers + 429 response builder)
jest.mock('@/lib/rate-limit', () => {
  const actual = jest.requireActual('@/lib/rate-limit');
  return { ...actual, checkRateLimit: jest.fn() };
});

import twilio from 'twilio';
import { checkRateLimit } from '@/lib/rate-limit';

// The route captures TWILIO_VERIFY_SERVICE_SID at module load, so set the env
// var before requiring the handler.
process.env.TWILIO_VERIFY_SERVICE_SID = 'VA_test_service_sid';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { POST, PUT } = require('@/app/api/user/verify-phone/route');

const mockAuth = auth as unknown as jest.Mock;
const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<
  typeof checkRateLimit
>;
const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<
  typeof connectToDatabase
>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockVerifications = (twilio as any).__verifications as {
  create: jest.Mock;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockVerificationChecks = (twilio as any).__verificationChecks as {
  create: jest.Mock;
};

function makeRequest(method: 'POST' | 'PUT', body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/user/verify-phone', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/user/verify-phone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'clerk-user-123' });
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 2,
      retryAfterSeconds: 0,
    });
  });

  describe('POST (send verification SMS)', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const response = await POST(
        makeRequest('POST', { phoneNumber: '5551234567' })
      );

      expect(response.status).toBe(401);
      expect(mockCheckRateLimit).not.toHaveBeenCalled();
      expect(mockVerifications.create).not.toHaveBeenCalled();
    });

    it('should return 429 when the per-user send limit is exceeded', async () => {
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 1200,
      });

      const response = await POST(
        makeRequest('POST', { phoneNumber: '5551234567' })
      );
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('1200');
      expect(data.error).toBe('Too many requests. Please try again later.');
      expect(mockCheckRateLimit).toHaveBeenCalledWith({
        key: 'verify-phone-send:user:clerk-user-123',
        limit: 3,
        windowMs: 60 * 60 * 1000,
      });
      // No Twilio SMS is sent when rate limited
      expect(mockVerifications.create).not.toHaveBeenCalled();
    });

    it('should send a verification SMS when under the limit', async () => {
      mockVerifications.create.mockResolvedValue({
        sid: 'VE123',
        status: 'pending',
      });

      const response = await POST(
        makeRequest('POST', { phoneNumber: '5551234567' })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockVerifications.create).toHaveBeenCalledWith({
        to: '+15551234567',
        channel: 'sms',
      });
    });
  });

  describe('PUT (check verification code)', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const response = await PUT(
        makeRequest('PUT', {
          phoneNumber: '5551234567',
          verificationCode: '123456',
        })
      );

      expect(response.status).toBe(401);
      expect(mockCheckRateLimit).not.toHaveBeenCalled();
    });

    it('should return 429 when the per-user check limit is exceeded (brute-force guard)', async () => {
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 300,
      });

      const response = await PUT(
        makeRequest('PUT', {
          phoneNumber: '5551234567',
          verificationCode: '123456',
        })
      );

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('300');
      expect(mockCheckRateLimit).toHaveBeenCalledWith({
        key: 'verify-phone-check:user:clerk-user-123',
        limit: 10,
        windowMs: 15 * 60 * 1000,
      });
      expect(mockVerificationChecks.create).not.toHaveBeenCalled();
    });

    it('should verify the code and persist the phone number when approved', async () => {
      mockVerificationChecks.create.mockResolvedValue({
        status: 'approved',
        valid: true,
      });
      const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
      mockConnectToDatabase.mockResolvedValue({
        collection: jest.fn().mockReturnValue({ updateOne: mockUpdateOne }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const response = await PUT(
        makeRequest('PUT', {
          phoneNumber: '5551234567',
          verificationCode: '123456',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { clerkId: 'clerk-user-123' },
        {
          $set: expect.objectContaining({
            phoneNumber: '+15551234567',
            phoneVerified: true,
          }),
        }
      );
    });

    it('should return 400 for an invalid code', async () => {
      mockVerificationChecks.create.mockResolvedValue({
        status: 'pending',
        valid: false,
      });

      const response = await PUT(
        makeRequest('PUT', {
          phoneNumber: '5551234567',
          verificationCode: '000000',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid or expired verification code');
    });
  });
});
