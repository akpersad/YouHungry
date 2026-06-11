import { NextRequest } from 'next/server';
import {
  checkRateLimit,
  getClientIp,
  ipRateLimitKey,
  rateLimitResponse,
  userRateLimitKey,
} from '@/lib/rate-limit';
import { connectToDatabase } from '@/lib/db';
import { logger } from '@/lib/logger';

// Mock the database connection
jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<
  typeof connectToDatabase
>;
const mockLogger = logger as jest.Mocked<typeof logger>;

interface MockCollection {
  createIndex: jest.Mock;
  findOneAndUpdate: jest.Mock;
}

function mockDb(): MockCollection {
  const collection: MockCollection = {
    createIndex: jest.fn().mockResolvedValue('ok'),
    findOneAndUpdate: jest.fn(),
  };

  mockConnectToDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue(collection),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  return collection;
}

// In-memory store emulating the atomic $inc upsert so window rollover and
// per-key isolation behave like real Mongo documents.
function mockDbWithStore(): {
  collection: MockCollection;
  store: Map<string, number>;
} {
  const collection = mockDb();
  const store = new Map<string, number>();

  collection.findOneAndUpdate.mockImplementation(
    async (filter: { key: string }) => {
      const count = (store.get(filter.key) ?? 0) + 1;
      store.set(filter.key, count);
      return { key: filter.key, count, expiresAt: new Date() };
    }
  );

  return { collection, store };
}

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

describe('checkRateLimit', () => {
  let dateNowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Fixed point in time, 10 minutes into an hourly window
    dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(WINDOW_MS * 1000 + 10 * 60 * 1000);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it('allows requests under the limit and reports remaining', async () => {
    mockDbWithStore();

    const first = await checkRateLimit({
      key: 'test',
      limit: 3,
      windowMs: WINDOW_MS,
    });
    const second = await checkRateLimit({
      key: 'test',
      limit: 3,
      windowMs: WINDOW_MS,
    });

    expect(first).toEqual({
      allowed: true,
      remaining: 2,
      retryAfterSeconds: 0,
    });
    expect(second).toEqual({
      allowed: true,
      remaining: 1,
      retryAfterSeconds: 0,
    });
  });

  it('blocks requests over the limit with a retry-after for the window end', async () => {
    mockDbWithStore();

    const limit = { key: 'test', limit: 2, windowMs: WINDOW_MS };
    await checkRateLimit(limit);
    await checkRateLimit(limit);
    const third = await checkRateLimit(limit);

    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
    // 50 minutes remain in the hourly window
    expect(third.retryAfterSeconds).toBe(50 * 60);
  });

  it('starts a fresh count when the window rolls over', async () => {
    const { store } = mockDbWithStore();

    const limit = { key: 'test', limit: 1, windowMs: WINDOW_MS };
    await checkRateLimit(limit);
    const blocked = await checkRateLimit(limit);
    expect(blocked.allowed).toBe(false);

    // Advance into the next window
    dateNowSpy.mockReturnValue(WINDOW_MS * 1001 + 1000);
    const afterRollover = await checkRateLimit(limit);

    expect(afterRollover.allowed).toBe(true);
    // Old and new windows live in separate documents
    expect(store.size).toBe(2);
  });

  it('tracks keys independently', async () => {
    mockDbWithStore();

    const a = { key: 'user:a', limit: 1, windowMs: WINDOW_MS };
    const b = { key: 'user:b', limit: 1, windowMs: WINDOW_MS };

    await checkRateLimit(a);
    const aBlocked = await checkRateLimit(a);
    const bAllowed = await checkRateLimit(b);

    expect(aBlocked.allowed).toBe(false);
    expect(bAllowed.allowed).toBe(true);
  });

  it('fails open and logs a warning when the database is unreachable', async () => {
    mockConnectToDatabase.mockRejectedValue(new Error('db down'));

    const result = await checkRateLimit({
      key: 'test',
      limit: 5,
      windowMs: WINDOW_MS,
    });

    expect(result).toEqual({
      allowed: true,
      remaining: 5,
      retryAfterSeconds: 0,
    });
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Rate limit check failed; allowing request (fail open)',
      expect.objectContaining({ key: 'test' })
    );
  });

  it('fails open when the upsert itself errors', async () => {
    const collection = mockDb();
    collection.findOneAndUpdate.mockRejectedValue(new Error('write failed'));

    const result = await checkRateLimit({
      key: 'test',
      limit: 5,
      windowMs: WINDOW_MS,
    });

    expect(result.allowed).toBe(true);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('retries once when a concurrent upsert hits the unique index', async () => {
    const collection = mockDb();
    const duplicateKeyError = Object.assign(new Error('E11000'), {
      code: 11000,
    });
    collection.findOneAndUpdate
      .mockRejectedValueOnce(duplicateKeyError)
      .mockResolvedValueOnce({ key: 'k', count: 2, expiresAt: new Date() });

    const result = await checkRateLimit({
      key: 'test',
      limit: 5,
      windowMs: WINDOW_MS,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3);
    expect(collection.findOneAndUpdate).toHaveBeenCalledTimes(2);
  });
});

describe('getClientIp', () => {
  it('returns the first x-forwarded-for entry', () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
    });

    expect(getClientIp(request)).toBe('203.0.113.7');
  });

  it('falls back to "unknown" when no forwarding header is present', () => {
    const request = new NextRequest('http://localhost:3000/api/test');

    expect(getClientIp(request)).toBe('unknown');
  });
});

describe('key helpers', () => {
  it('builds user-scoped keys', () => {
    expect(userRateLimitKey('sms-send', 'user-123')).toBe(
      'sms-send:user:user-123'
    );
  });

  it('builds ip-scoped keys from the request', () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '203.0.113.7' },
    });

    expect(ipRateLimitKey('auth-register', request)).toBe(
      'auth-register:ip:203.0.113.7'
    );
  });
});

describe('rateLimitResponse', () => {
  it('returns a 429 with a Retry-After header', async () => {
    const response = rateLimitResponse(120);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('120');
    expect(data.error).toBe('Too many requests. Please try again later.');
  });

  it('clamps Retry-After to at least one second', () => {
    expect(rateLimitResponse(0).headers.get('Retry-After')).toBe('1');
  });
});
