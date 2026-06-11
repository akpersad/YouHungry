import { NextRequest } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { GET as checkUsernameGET } from '@/app/api/auth/check-username/route';
import { POST as resendVerificationPOST } from '@/app/api/auth/resend-verification/route';
import { POST as verifyEmailPOST } from '@/app/api/auth/verify-email/route';
import { logger } from '@/lib/logger';

// Mock Clerk backend client
jest.mock('@clerk/nextjs/server', () => ({
  clerkClient: jest.fn(),
}));

// Mock Twilio so no real verification SMS is ever sent (register route)
jest.mock('twilio', () => {
  const verifications = { create: jest.fn() };
  const client = {
    verify: { v2: { services: jest.fn(() => ({ verifications })) } },
  };
  const twilioMock = Object.assign(
    jest.fn(() => client),
    {
      __verifications: verifications,
    }
  );
  return { __esModule: true, default: twilioMock };
});

// Mock MongoDB user creation (register route, dev mode)
jest.mock('@/lib/users', () => ({
  createUser: jest.fn().mockResolvedValue({}),
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

import { checkRateLimit } from '@/lib/rate-limit';

const mockClerkClient = clerkClient as unknown as jest.Mock;
const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<
  typeof checkRateLimit
>;
const mockLogger = logger as jest.Mocked<typeof logger>;

const mockGetUserList = jest.fn();
const mockCreateUser = jest.fn();

const CLIENT_IP = '198.51.100.5';

function makeJsonRequest(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `${CLIENT_IP}, 10.0.0.1`,
    },
  });
}

function clerkUserWithEmail(email: string, verified: boolean) {
  return {
    id: 'clerk-user-1',
    emailAddresses: [
      {
        emailAddress: email,
        verification: { status: verified ? 'verified' : 'unverified' },
      },
    ],
  };
}

const RATE_LIMITED = { allowed: false, remaining: 0, retryAfterSeconds: 900 };

describe('auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      retryAfterSeconds: 0,
    });
    mockClerkClient.mockResolvedValue({
      users: { getUserList: mockGetUserList, createUser: mockCreateUser },
    });
    // Production mode: MongoDB user creation is handled by the Clerk webhook
    process.env.CLERK_WEBHOOK_SECRET = 'whsec_test';
  });

  afterEach(() => {
    delete process.env.CLERK_WEBHOOK_SECRET;
  });

  describe('POST /api/auth/register', () => {
    const validBody = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'a-long-secure-password',
      firstName: 'New',
      lastName: 'User',
    };

    it('should return 429 per IP before touching Clerk or Twilio', async () => {
      mockCheckRateLimit.mockResolvedValue(RATE_LIMITED);

      const response = await registerPOST(
        makeJsonRequest('http://localhost:3000/api/auth/register', validBody)
      );
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('900');
      expect(data.error).toBe('Too many requests. Please try again later.');
      expect(mockCheckRateLimit).toHaveBeenCalledWith({
        key: `auth-register:ip:${CLIENT_IP}`,
        limit: 5,
        windowMs: 60 * 60 * 1000,
      });
      expect(mockClerkClient).not.toHaveBeenCalled();
    });

    it('should create the user when under the limit', async () => {
      mockCreateUser.mockResolvedValue({
        id: 'clerk-new-user',
        emailAddresses: [],
        imageUrl: 'http://img',
      });

      const response = await registerPOST(
        makeJsonRequest('http://localhost:3000/api/auth/register', validBody)
      );
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          emailAddress: ['new@example.com'],
          username: 'newuser',
        })
      );
    });
  });

  describe('GET /api/auth/check-username', () => {
    function makeGetRequest(username?: string) {
      const url = username
        ? `http://localhost:3000/api/auth/check-username?username=${username}`
        : 'http://localhost:3000/api/auth/check-username';
      return new NextRequest(url, {
        headers: { 'x-forwarded-for': `${CLIENT_IP}, 10.0.0.1` },
      });
    }

    it('should return 429 per IP before querying Clerk', async () => {
      mockCheckRateLimit.mockResolvedValue(RATE_LIMITED);

      const response = await checkUsernameGET(makeGetRequest('someuser'));

      expect(response.status).toBe(429);
      expect(mockCheckRateLimit).toHaveBeenCalledWith({
        key: `auth-check-username:ip:${CLIENT_IP}`,
        limit: 30,
        windowMs: 60 * 60 * 1000,
      });
      expect(mockClerkClient).not.toHaveBeenCalled();
    });

    it('should report an unused username as available', async () => {
      mockGetUserList.mockResolvedValue({ data: [] });

      const response = await checkUsernameGET(makeGetRequest('freename'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(true);
    });

    it('should report a taken username as unavailable', async () => {
      mockGetUserList.mockResolvedValue({ data: [{ id: 'clerk-user-1' }] });

      const response = await checkUsernameGET(makeGetRequest('takenname'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(false);
    });

    it('should return 400 when no username is given', async () => {
      const response = await checkUsernameGET(makeGetRequest());

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    function makeResendRequest(email: string) {
      return makeJsonRequest(
        'http://localhost:3000/api/auth/resend-verification',
        { email }
      );
    }

    it('should return 400 when email is missing', async () => {
      const response = await resendVerificationPOST(
        makeJsonRequest(
          'http://localhost:3000/api/auth/resend-verification',
          {}
        )
      );

      expect(response.status).toBe(400);
      expect(mockCheckRateLimit).not.toHaveBeenCalled();
    });

    it('should return 429 per IP+email before querying Clerk', async () => {
      mockCheckRateLimit.mockResolvedValue(RATE_LIMITED);

      const response = await resendVerificationPOST(
        makeResendRequest('Someone@Example.com')
      );

      expect(response.status).toBe(429);
      expect(mockCheckRateLimit).toHaveBeenCalledWith({
        key: `auth-resend-verification:ip:${CLIENT_IP}:email:someone@example.com`,
        limit: 3,
        windowMs: 60 * 60 * 1000,
      });
      expect(mockClerkClient).not.toHaveBeenCalled();
    });

    it('should return the generic 200 response for unknown emails (no enumeration)', async () => {
      mockGetUserList.mockResolvedValue({ data: [] });

      const response = await resendVerificationPOST(
        makeResendRequest('unknown@example.com')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(JSON.stringify(data)).not.toContain('not found');
    });

    it('should return the same generic 200 response for known unverified emails', async () => {
      mockGetUserList.mockResolvedValue({
        data: [clerkUserWithEmail('known@example.com', false)],
      });

      const response = await resendVerificationPOST(
        makeResendRequest('known@example.com')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // The "send" (logging; Clerk handles actual emails) only runs for known users
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Resend verification requested',
        expect.objectContaining({ email: 'known@example.com' })
      );
    });

    it('should return the same generic 200 response for already-verified emails', async () => {
      mockGetUserList.mockResolvedValue({
        data: [clerkUserWithEmail('verified@example.com', true)],
      });

      const response = await resendVerificationPOST(
        makeResendRequest('verified@example.com')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(JSON.stringify(data)).not.toContain('already verified');
    });

    it('should produce byte-identical bodies for known and unknown emails', async () => {
      mockGetUserList.mockResolvedValue({ data: [] });
      const unknown = await resendVerificationPOST(
        makeResendRequest('unknown@example.com')
      );
      const unknownBody = await unknown.text();

      mockGetUserList.mockResolvedValue({
        data: [clerkUserWithEmail('known@example.com', false)],
      });
      const known = await resendVerificationPOST(
        makeResendRequest('known@example.com')
      );
      const knownBody = await known.text();

      expect(unknown.status).toBe(known.status);
      expect(unknownBody).toBe(knownBody);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    function makeVerifyRequest(body: Record<string, unknown>) {
      return makeJsonRequest(
        'http://localhost:3000/api/auth/verify-email',
        body
      );
    }

    it('should return 429 per IP before querying Clerk', async () => {
      mockCheckRateLimit.mockResolvedValue(RATE_LIMITED);

      const response = await verifyEmailPOST(
        makeVerifyRequest({ email: 'a@example.com', code: '123456' })
      );

      expect(response.status).toBe(429);
      expect(mockCheckRateLimit).toHaveBeenCalledWith({
        key: `auth-verify-email:ip:${CLIENT_IP}`,
        limit: 10,
        windowMs: 60 * 60 * 1000,
      });
      expect(mockClerkClient).not.toHaveBeenCalled();
    });

    it('should return 400 when email or code is missing', async () => {
      const response = await verifyEmailPOST(
        makeVerifyRequest({ email: 'a@example.com' })
      );

      expect(response.status).toBe(400);
      expect(mockClerkClient).not.toHaveBeenCalled();
    });

    it('should not reveal whether an email exists (no 404)', async () => {
      mockGetUserList.mockResolvedValue({ data: [] });

      const response = await verifyEmailPOST(
        makeVerifyRequest({ email: 'unknown@example.com', code: '123456' })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(JSON.stringify(data)).not.toContain('not found');
    });

    it('should produce byte-identical responses for known and unknown emails', async () => {
      mockGetUserList.mockResolvedValue({ data: [] });
      const unknown = await verifyEmailPOST(
        makeVerifyRequest({ email: 'unknown@example.com', code: '123456' })
      );
      const unknownBody = await unknown.text();

      mockGetUserList.mockResolvedValue({
        data: [clerkUserWithEmail('known@example.com', false)],
      });
      const known = await verifyEmailPOST(
        makeVerifyRequest({ email: 'known@example.com', code: '123456' })
      );
      const knownBody = await known.text();

      expect(unknown.status).toBe(known.status);
      expect(unknownBody).toBe(knownBody);
    });
  });
});
