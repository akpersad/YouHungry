import {
  mintGuestId,
  signGuestCookie,
  verifyGuestCookie,
  signForkToken,
  verifyForkToken,
  mintForkCode,
  signUnsubscribeToken,
  verifyUnsubscribeToken,
  UNSUBSCRIBE_TOKEN_TTL_MS,
} from '../tokens';

const SECRET = 'test-secret-do-not-use';
const NOW = new Date('2026-07-02T12:00:00.000Z');

describe('guest cookies', () => {
  it('round-trips a minted guest id', () => {
    const guestId = mintGuestId();
    const cookie = signGuestCookie(guestId, SECRET);
    expect(verifyGuestCookie(cookie, SECRET)).toBe(guestId);
  });

  it('mints unique, url-safe guest ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => mintGuestId()));
    expect(ids.size).toBe(100);
    for (const id of ids) {
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it('rejects a tampered guest id', () => {
    const cookie = signGuestCookie('honest-guest', SECRET);
    const forged = cookie.replace('honest-guest', 'someone-else');
    expect(verifyGuestCookie(forged, SECRET)).toBeNull();
  });

  it('rejects a tampered signature', () => {
    const cookie = signGuestCookie('guest', SECRET);
    expect(verifyGuestCookie(cookie.slice(0, -2) + 'xx', SECRET)).toBeNull();
  });

  it('rejects a cookie signed under a different secret', () => {
    const cookie = signGuestCookie('guest', 'other-secret');
    expect(verifyGuestCookie(cookie, SECRET)).toBeNull();
  });

  it('rejects malformed values', () => {
    expect(verifyGuestCookie('', SECRET)).toBeNull();
    expect(verifyGuestCookie('no-separator', SECRET)).toBeNull();
    expect(verifyGuestCookie('.sig-only', SECRET)).toBeNull();
  });

  it('throws when no secret is configured', () => {
    const original = process.env.V2_TOKEN_SECRET;
    delete process.env.V2_TOKEN_SECRET;
    try {
      expect(() => signGuestCookie('guest')).toThrow('V2_TOKEN_SECRET');
    } finally {
      if (original !== undefined) process.env.V2_TOKEN_SECRET = original;
    }
  });
});

describe('fork tokens', () => {
  const EXPIRY = new Date(NOW.getTime() + 30 * 60 * 1000);

  it('verifies an authentic, unexpired token for the right fork', () => {
    const token = signForkToken('abc123', EXPIRY, SECRET);
    expect(verifyForkToken(token, 'abc123', NOW, SECRET)).toBe(true);
  });

  it('rejects a token presented against a different fork', () => {
    const token = signForkToken('abc123', EXPIRY, SECRET);
    expect(verifyForkToken(token, 'xyz789', NOW, SECRET)).toBe(false);
  });

  it('rejects an expired token', () => {
    const token = signForkToken('abc123', EXPIRY, SECRET);
    const afterExpiry = new Date(EXPIRY.getTime() + 1);
    expect(verifyForkToken(token, 'abc123', afterExpiry, SECRET)).toBe(false);
  });

  it('expires at exactly the boundary (exp is exclusive)', () => {
    const token = signForkToken('abc123', EXPIRY, SECRET);
    expect(verifyForkToken(token, 'abc123', EXPIRY, SECRET)).toBe(false);
  });

  it('rejects a payload-tampered token', () => {
    const otherFork = signForkToken('xyz789', EXPIRY, SECRET);
    const [payload] = signForkToken('abc123', EXPIRY, SECRET).split('.');
    const [, otherSig] = otherFork.split('.');
    expect(
      verifyForkToken(`${payload}.${otherSig}`, 'abc123', NOW, SECRET)
    ).toBe(false);
  });

  it('rejects garbage input without throwing', () => {
    expect(verifyForkToken('', 'abc123', NOW, SECRET)).toBe(false);
    expect(verifyForkToken('not-a-token', 'abc123', NOW, SECRET)).toBe(false);
    expect(verifyForkToken('a.b.c', 'abc123', NOW, SECRET)).toBe(false);
    // valid signature over a non-JSON payload
    const sig = signForkToken('x', EXPIRY, SECRET).split('.')[1];
    expect(verifyForkToken(`!!!.${sig}`, 'abc123', NOW, SECRET)).toBe(false);
  });
});

describe('unsubscribe tokens', () => {
  const USER_ID = 'a1b2c3d4e5f6a1b2c3d4e5f6';

  it('round-trips a user id', () => {
    const token = signUnsubscribeToken(USER_ID, NOW, SECRET);
    expect(verifyUnsubscribeToken(token, NOW, SECRET)).toBe(USER_ID);
  });

  it('expires after the TTL (exp is exclusive)', () => {
    const token = signUnsubscribeToken(USER_ID, NOW, SECRET);
    const atExpiry = new Date(NOW.getTime() + UNSUBSCRIBE_TOKEN_TTL_MS);
    const justBefore = new Date(atExpiry.getTime() - 1);
    expect(verifyUnsubscribeToken(token, justBefore, SECRET)).toBe(USER_ID);
    expect(verifyUnsubscribeToken(token, atExpiry, SECRET)).toBeNull();
  });

  it('rejects tampered payloads, wrong secrets, and garbage', () => {
    const token = signUnsubscribeToken(USER_ID, NOW, SECRET);
    expect(
      verifyUnsubscribeToken(token.slice(0, -2) + 'xx', NOW, SECRET)
    ).toBeNull();
    expect(verifyUnsubscribeToken(token, NOW, 'other-secret')).toBeNull();
    expect(verifyUnsubscribeToken('', NOW, SECRET)).toBeNull();
    expect(verifyUnsubscribeToken('not-a-token', NOW, SECRET)).toBeNull();
  });

  it('is not interchangeable with a fork token (domain-separated)', () => {
    // A fork token whose payload happens to parse must never pass as an
    // unsubscribe token: the HMAC input is prefixed per purpose.
    const forkToken = signForkToken(
      USER_ID,
      new Date(NOW.getTime() + 1000),
      SECRET
    );
    expect(verifyUnsubscribeToken(forkToken, NOW, SECRET)).toBeNull();
  });

  it('rejects a payload whose user id is not a Mongo id shape', () => {
    const forged = signUnsubscribeToken('not-an-object-id', NOW, SECRET);
    expect(verifyUnsubscribeToken(forged, NOW, SECRET)).toBeNull();
  });
});

describe('mintForkCode', () => {
  it('produces codes of the requested length from the safe alphabet', () => {
    const code = mintForkCode();
    expect(code).toHaveLength(10);
    expect(code).toMatch(/^[abcdefghjkmnpqrstuvwxyz23456789]+$/);
    expect(mintForkCode(6)).toHaveLength(6);
  });

  it('does not repeat across a small sample', () => {
    const codes = new Set(Array.from({ length: 200 }, () => mintForkCode()));
    expect(codes.size).toBe(200);
  });
});
