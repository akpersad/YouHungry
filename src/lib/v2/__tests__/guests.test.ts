import { ObjectId } from 'mongodb';
import { verifyGuestCookie, signGuestCookie } from '../tokens';
import {
  claimGuest,
  createGuest,
  findGuestByCookie,
  getClaimedGuestIds,
  participantFromGuest,
  touchGuest,
} from '../guests';
import { V2DomainError } from '../errors';
import type { GuestDoc } from '../schema';

jest.mock('../db', () => ({
  getV2Db: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getV2Db } = require('../db');

const SECRET = 'guests-test-secret';
let originalSecret: string | undefined;

beforeAll(() => {
  originalSecret = process.env.V2_TOKEN_SECRET;
  process.env.V2_TOKEN_SECRET = SECRET;
});

afterAll(() => {
  if (originalSecret !== undefined) {
    process.env.V2_TOKEN_SECRET = originalSecret;
  } else {
    delete process.env.V2_TOKEN_SECRET;
  }
});

let idCounter = 0;
function uniqueId(): ObjectId {
  return new ObjectId((++idCounter).toString(16).padStart(24, '0'));
}

function guestDoc(overrides: Partial<GuestDoc> = {}): GuestDoc {
  return {
    _id: uniqueId(),
    guestId: 'guest-abc',
    displayName: 'Sam',
    createdAt: new Date('2026-07-01T12:00:00.000Z'),
    lastSeenAt: new Date('2026-07-01T12:00:00.000Z'),
    ...overrides,
  };
}

interface GuestsStub {
  findOne: jest.Mock;
  insertOne: jest.Mock;
  findOneAndUpdate: jest.Mock;
  find: jest.Mock;
}

function mockGuests(overrides: Partial<GuestsStub> = {}): GuestsStub {
  const guests: GuestsStub = {
    findOne: jest.fn().mockResolvedValue(null),
    insertOne: jest.fn().mockResolvedValue({ insertedId: uniqueId() }),
    findOneAndUpdate: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    }),
    ...overrides,
  };
  (getV2Db as jest.Mock).mockResolvedValue({ guests });
  return guests;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findGuestByCookie', () => {
  it('returns null for a missing cookie without touching the database', async () => {
    const guests = mockGuests();
    expect(await findGuestByCookie(undefined)).toBeNull();
    expect(await findGuestByCookie(null)).toBeNull();
    expect(await findGuestByCookie('')).toBeNull();
    expect(guests.findOne).not.toHaveBeenCalled();
  });

  it('returns null for a forged cookie without touching the database', async () => {
    const guests = mockGuests();
    const forged = signGuestCookie('guest-abc', 'some-other-secret');
    expect(await findGuestByCookie(forged)).toBeNull();
    expect(guests.findOne).not.toHaveBeenCalled();
  });

  it('resolves an authentic cookie to its guest doc', async () => {
    const doc = guestDoc();
    const guests = mockGuests({ findOne: jest.fn().mockResolvedValue(doc) });
    const found = await findGuestByCookie(signGuestCookie(doc.guestId));
    expect(found).toBe(doc);
    expect(guests.findOne).toHaveBeenCalledWith({ guestId: doc.guestId });
  });

  it('returns null when the cookie is authentic but the guest is unknown', async () => {
    mockGuests();
    expect(await findGuestByCookie(signGuestCookie('vanished'))).toBeNull();
  });
});

describe('createGuest', () => {
  it('inserts a trimmed guest and returns a verifiable signed cookie', async () => {
    const guests = mockGuests();
    const { guest, cookieValue } = await createGuest('  Sam  ');

    expect(guest.displayName).toBe('Sam');
    expect(guest.guestId).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(guest.createdAt).toBeInstanceOf(Date);
    expect(guests.insertOne).toHaveBeenCalledTimes(1);
    expect(verifyGuestCookie(cookieValue)).toBe(guest.guestId);
  });

  it('mints a fresh guestId per guest', async () => {
    mockGuests();
    const first = await createGuest('A');
    const second = await createGuest('B');
    expect(first.guest.guestId).not.toBe(second.guest.guestId);
  });
});

describe('touchGuest', () => {
  it('bumps lastSeenAt and renames when a name is given', async () => {
    const guests = mockGuests({
      findOneAndUpdate: jest.fn().mockResolvedValue(guestDoc()),
    });
    await touchGuest('guest-abc', '  Sammy  ');
    const [filter, update] = guests.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ guestId: 'guest-abc' });
    expect(update.$set.displayName).toBe('Sammy');
    expect(update.$set.lastSeenAt).toBeInstanceOf(Date);
  });

  it('leaves the name alone when none is given', async () => {
    const guests = mockGuests({
      findOneAndUpdate: jest.fn().mockResolvedValue(guestDoc()),
    });
    await touchGuest('guest-abc');
    const [, update] = guests.findOneAndUpdate.mock.calls[0];
    expect(update.$set.displayName).toBeUndefined();
  });
});

describe('participantFromGuest', () => {
  it('builds a guest participant (guestId XOR userId rule)', () => {
    const participant = participantFromGuest(guestDoc());
    expect(participant).toEqual({ guestId: 'guest-abc', displayName: 'Sam' });
  });
});

describe('claimGuest', () => {
  const userId = uniqueId();

  it('claims an unclaimed guest', async () => {
    const claimed = guestDoc({ claimedByUserId: userId });
    const guests = mockGuests({
      findOneAndUpdate: jest.fn().mockResolvedValue(claimed),
    });

    expect(await claimGuest('guest-abc', userId)).toBe(claimed);
    const [filter, update] = guests.findOneAndUpdate.mock.calls[0];
    expect(filter.guestId).toBe('guest-abc');
    // The guard: only unclaimed, or already claimed by this same user.
    expect(filter.$or).toEqual([
      { claimedByUserId: { $exists: false } },
      { claimedByUserId: userId },
    ]);
    expect(update.$set.claimedByUserId).toBe(userId);
  });

  it('is a 409 when another account already claimed the guest', async () => {
    mockGuests({
      findOne: jest
        .fn()
        .mockResolvedValue(guestDoc({ claimedByUserId: uniqueId() })),
    });

    await expect(claimGuest('guest-abc', userId)).rejects.toMatchObject({
      name: 'V2DomainError',
      status: 409,
    });
  });

  it('is a 404 for an unknown guest', async () => {
    mockGuests();
    await expect(claimGuest('vanished', userId)).rejects.toMatchObject({
      name: 'V2DomainError',
      status: 404,
    });
  });

  it('is idempotent for the claiming user', async () => {
    const claimed = guestDoc({ claimedByUserId: userId });
    mockGuests({
      findOneAndUpdate: jest.fn().mockResolvedValue(claimed),
    });
    expect(await claimGuest('guest-abc', userId)).toBe(claimed);
  });
});

describe('getClaimedGuestIds', () => {
  it('returns the guestIds claimed by the user', async () => {
    const userId = uniqueId();
    const guests = mockGuests({
      find: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        toArray: jest
          .fn()
          .mockResolvedValue([
            guestDoc({ guestId: 'g-1' }),
            guestDoc({ guestId: 'g-2' }),
          ]),
      }),
    });

    expect(await getClaimedGuestIds(userId)).toEqual(['g-1', 'g-2']);
    expect(guests.find).toHaveBeenCalledWith({ claimedByUserId: userId });
  });
});

describe('error taxonomy', () => {
  it('claim rejections are domain errors, not infrastructure failures', async () => {
    mockGuests({
      findOne: jest
        .fn()
        .mockResolvedValue(guestDoc({ claimedByUserId: uniqueId() })),
    });
    await expect(claimGuest('guest-abc', uniqueId())).rejects.toBeInstanceOf(
      V2DomainError
    );
  });
});
