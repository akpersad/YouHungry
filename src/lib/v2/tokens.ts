import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Guest-identity + fork-token design (CHARTER: "guest identity persists via
 * a signed cookie; rate limiting and signed tokens keep it honest").
 *
 * Two primitives, both HMAC-SHA256 under `V2_TOKEN_SECRET`:
 *
 * 1. **Guest cookie** — `fitr_guest`, httpOnly + SameSite=Lax, value
 *    `<guestId>.<sig>`. The guestId is 128 bits of randomness minted
 *    server-side on first contact with a fork link; the signature stops a
 *    client fabricating ids (and thus voting N times by editing a cookie).
 *    No PII: the id maps to a GuestDoc holding only a display name.
 *
 * 2. **Fork token** — issued when a public fork page is served, required on
 *    every guest vote POST. Value `<payloadB64url>.<sig>` where the payload
 *    binds the fork code and an expiry. Votes for fork X can't be replayed
 *    against fork Y, tokens die with the fork's lifespan, and forged/expired
 *    tokens are rejected before any DB read. Per-IP + per-fork rate limits
 *    (Phase 4) sit on top of, not instead of, these checks.
 *
 * Everything here is pure given the secret, so the suite can pin vectors.
 */

const SEPARATOR = '.';

function getSecret(explicit?: string): string {
  const secret = explicit ?? process.env.V2_TOKEN_SECRET;
  if (!secret) {
    throw new Error('V2_TOKEN_SECRET environment variable is not set');
  }
  return secret;
}

function hmac(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

/** Constant-time string comparison (length leak is fine — sigs are fixed). */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// ---------------------------------------------------------------------------
// Guest identity
// ---------------------------------------------------------------------------

export function mintGuestId(): string {
  return randomBytes(16).toString('base64url');
}

/** Serialize a guestId into the signed `fitr_guest` cookie value. */
export function signGuestCookie(guestId: string, secret?: string): string {
  return `${guestId}${SEPARATOR}${hmac(guestId, getSecret(secret))}`;
}

/** Returns the guestId if the cookie is authentic, null otherwise. */
export function verifyGuestCookie(
  cookieValue: string,
  secret?: string
): string | null {
  const idx = cookieValue.lastIndexOf(SEPARATOR);
  if (idx <= 0) return null;
  const guestId = cookieValue.slice(0, idx);
  const sig = cookieValue.slice(idx + 1);
  return safeEqual(sig, hmac(guestId, getSecret(secret))) ? guestId : null;
}

// ---------------------------------------------------------------------------
// Fork tokens
// ---------------------------------------------------------------------------

interface ForkTokenPayload {
  /** Fork share code the token is bound to. */
  f: string;
  /** Unix ms expiry — aligned to the fork's closesAt (plus a small grace). */
  exp: number;
}

/**
 * Issued tokens outlive `closesAt` by this much so a ballot in flight at
 * close is rejected for the honest reason (fork closed), not a stale token.
 */
export const FORK_TOKEN_GRACE_MS = 2 * 60 * 1000;

/** The token issued alongside a fork view (GET response, page render). */
export function forkTokenFor(
  forkCode: string,
  closesAt: Date,
  secret?: string
): string {
  return signForkToken(
    forkCode,
    new Date(closesAt.getTime() + FORK_TOKEN_GRACE_MS),
    secret
  );
}

export function signForkToken(
  forkCode: string,
  expiresAt: Date,
  secret?: string
): string {
  const payload: ForkTokenPayload = { f: forkCode, exp: expiresAt.getTime() };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}${SEPARATOR}${hmac(encoded, getSecret(secret))}`;
}

/**
 * Verify a fork token against the fork it claims to belong to. Returns true
 * only if the signature is authentic, the code matches, and it is unexpired.
 */
export function verifyForkToken(
  token: string,
  forkCode: string,
  now: Date = new Date(),
  secret?: string
): boolean {
  const idx = token.lastIndexOf(SEPARATOR);
  if (idx <= 0) return false;
  const encoded = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!safeEqual(sig, hmac(encoded, getSecret(secret)))) return false;

  let payload: ForkTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return false;
  }
  return payload.f === forkCode && now.getTime() < payload.exp;
}

// ---------------------------------------------------------------------------
// Email unsubscribe tokens
// ---------------------------------------------------------------------------

interface UnsubscribeTokenPayload {
  /** users._id hex string the link acts for. */
  u: string;
  /** Unix ms expiry. */
  exp: number;
}

/**
 * A result email's unsubscribe link must keep working long after the send
 * without a sign-in (the whole point is one tap out), so the token itself
 * is the authorization: it names the user, is signed, and lives half a
 * year — far past any compliance floor, short enough that a leaked old
 * email eventually goes inert.
 */
export const UNSUBSCRIBE_TOKEN_TTL_MS = 180 * 24 * 60 * 60 * 1000;

export function signUnsubscribeToken(
  userId: string,
  now: Date = new Date(),
  secret?: string
): string {
  const payload: UnsubscribeTokenPayload = {
    u: userId,
    exp: now.getTime() + UNSUBSCRIBE_TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}${SEPARATOR}${hmac(`unsub:${encoded}`, getSecret(secret))}`;
}

/** Returns the userId hex the token was signed for, or null. */
export function verifyUnsubscribeToken(
  token: string,
  now: Date = new Date(),
  secret?: string
): string | null {
  const idx = token.lastIndexOf(SEPARATOR);
  if (idx <= 0) return null;
  const encoded = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!safeEqual(sig, hmac(`unsub:${encoded}`, getSecret(secret)))) return null;

  let payload: UnsubscribeTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof payload.u !== 'string' || !/^[0-9a-f]{24}$/i.test(payload.u)) {
    return null;
  }
  return now.getTime() < payload.exp ? payload.u : null;
}

// ---------------------------------------------------------------------------
// List invite tokens
// ---------------------------------------------------------------------------

interface ListInviteTokenPayload {
  /** lists._id hex string the invite grants collaboration on. */
  l: string;
  /** Unix ms expiry. */
  exp: number;
}

/**
 * A shared-list invite is a capability URL, same DNA as a fork link: the
 * owner mints it, and holding it (signed in) is the authorization. A week
 * covers "sent in the group chat, opened on the weekend" while keeping a
 * leaked old link short-lived. Domain-separated from every other token by
 * the `listinv:` HMAC prefix.
 */
export const LIST_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function signListInviteToken(
  listId: string,
  now: Date = new Date(),
  secret?: string
): string {
  const payload: ListInviteTokenPayload = {
    l: listId,
    exp: now.getTime() + LIST_INVITE_TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}${SEPARATOR}${hmac(`listinv:${encoded}`, getSecret(secret))}`;
}

/** Returns the list id hex the token was signed for, or null. */
export function verifyListInviteToken(
  token: string,
  now: Date = new Date(),
  secret?: string
): string | null {
  const idx = token.lastIndexOf(SEPARATOR);
  if (idx <= 0) return null;
  const encoded = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!safeEqual(sig, hmac(`listinv:${encoded}`, getSecret(secret)))) {
    return null;
  }

  let payload: ListInviteTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof payload.l !== 'string' || !/^[0-9a-f]{24}$/i.test(payload.l)) {
    return null;
  }
  return now.getTime() < payload.exp ? payload.l : null;
}

// ---------------------------------------------------------------------------
// Fork share codes
// ---------------------------------------------------------------------------

/** Unambiguous base32-ish alphabet (no 0/O/1/l/I) for hand-typed codes. */
const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/**
 * Mint a short share code for /f/[code]. 10 chars over a 31-char alphabet is
 * ~49 bits — unguessable in practice while staying group-chat friendly.
 * Uniqueness is enforced by the `forks.code` unique index; callers retry on
 * the (astronomically rare) duplicate-key error.
 */
export function mintForkCode(length: number = 10): string {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}
