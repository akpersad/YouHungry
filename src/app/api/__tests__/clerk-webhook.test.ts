/**
 * Clerk Webhook Security Tests
 *
 * Verifies that the webhook fails closed in production when
 * CLERK_WEBHOOK_SECRET is not configured, only allows the unverified
 * fallback outside production, and rejects payloads that fail svix
 * verification.
 */

import { NextRequest } from 'next/server';
import { POST as clerkWebhook } from '../webhooks/clerk/route';
import { createUser } from '@/lib/users';

// Mock the users library
jest.mock('@/lib/users', () => ({
  createUser: jest.fn(),
  updateUser: jest.fn(),
  getUserByClerkId: jest.fn(),
}));

// Mock svix verification (verify delegates to mockSvixVerify at call time)
jest.mock('svix', () => ({
  Webhook: jest.fn().mockImplementation(() => ({
    verify: (...args: unknown[]) => mockSvixVerify(...args),
  })),
}));
const mockSvixVerify = jest.fn();

// Mock next/headers to provide svix headers
const mockHeaderStore = new Map<string, string>();
jest.mock('next/headers', () => ({
  headers: jest.fn(() =>
    Promise.resolve({
      get: (name: string) => mockHeaderStore.get(name) ?? null,
    })
  ),
}));

const userCreatedPayload = {
  type: 'user.created',
  data: {
    id: 'user_webhook_test',
    email_addresses: [{ email_address: 'webhook@example.com' }],
    username: 'webhookuser',
    first_name: 'Webhook',
    last_name: 'Test',
    image_url: '',
    phone_numbers: [],
    public_metadata: {},
    unsafe_metadata: {},
  },
};

const buildRequest = (payload: unknown = userCreatedPayload) =>
  new NextRequest('http://localhost:3000/api/webhooks/clerk', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

const setNodeEnv = (value: string) => {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value,
    configurable: true,
  });
};

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

describe('POST /api/webhooks/clerk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaderStore.clear();
    mockHeaderStore.set('svix-id', 'msg_test');
    mockHeaderStore.set('svix-timestamp', '1234567890');
    mockHeaderStore.set('svix-signature', 'v1,signature');
    delete process.env.CLERK_WEBHOOK_SECRET;
  });

  afterEach(() => {
    setNodeEnv(ORIGINAL_NODE_ENV as string);
    if (ORIGINAL_WEBHOOK_SECRET === undefined) {
      delete process.env.CLERK_WEBHOOK_SECRET;
    } else {
      process.env.CLERK_WEBHOOK_SECRET = ORIGINAL_WEBHOOK_SECRET;
    }
  });

  it('returns 400 when svix headers are missing', async () => {
    mockHeaderStore.clear();

    const response = await clerkWebhook(buildRequest());

    expect(response.status).toBe(400);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('fails closed with 500 in production when CLERK_WEBHOOK_SECRET is not set', async () => {
    setNodeEnv('production');

    const response = await clerkWebhook(buildRequest());

    expect(response.status).toBe(500);
    expect(createUser).not.toHaveBeenCalled();
    expect(mockSvixVerify).not.toHaveBeenCalled();
  });

  it('processes unverified payloads outside production when no secret is set (dev fallback)', async () => {
    (createUser as jest.Mock).mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
    });

    const response = await clerkWebhook(buildRequest());

    expect(response.status).toBe(200);
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ clerkId: 'user_webhook_test' })
    );
    expect(mockSvixVerify).not.toHaveBeenCalled();
  });

  it('returns 400 when svix verification fails', async () => {
    process.env.CLERK_WEBHOOK_SECRET = 'whsec_test';
    mockSvixVerify.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const response = await clerkWebhook(buildRequest());

    expect(response.status).toBe(400);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('processes the event when svix verification succeeds', async () => {
    process.env.CLERK_WEBHOOK_SECRET = 'whsec_test';
    mockSvixVerify.mockReturnValue(userCreatedPayload);
    (createUser as jest.Mock).mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
    });

    const response = await clerkWebhook(buildRequest());

    expect(response.status).toBe(200);
    expect(mockSvixVerify).toHaveBeenCalled();
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ clerkId: 'user_webhook_test' })
    );
  });
});
