import { ObjectId } from 'mongodb';
import { getV2User, participantFromUser, requireV2User } from '../auth';
import type { V2UserDoc } from '../schema';

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}));

jest.mock('../db', () => ({
  getV2Db: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { auth, currentUser } = require('@clerk/nextjs/server');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getV2Db } = require('../db');

function userDoc(overrides: Partial<V2UserDoc> = {}): V2UserDoc {
  return {
    _id: new ObjectId(),
    clerkId: 'user_clerk1',
    email: 'olivia@example.com',
    name: 'Olivia Organizer',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

interface UsersStub {
  findOne: jest.Mock;
  findOneAndUpdate: jest.Mock;
}

function mockUsers(overrides: Partial<UsersStub> = {}): UsersStub {
  const users: UsersStub = {
    findOne: jest.fn().mockResolvedValue(null),
    findOneAndUpdate: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
  (getV2Db as jest.Mock).mockResolvedValue({ users });
  return users;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getV2User', () => {
  it('returns null with no Clerk session', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: null });
    expect(await getV2User()).toBeNull();
  });

  it('returns the existing user doc', async () => {
    const doc = userDoc();
    (auth as jest.Mock).mockResolvedValue({ userId: doc.clerkId });
    const users = mockUsers({ findOne: jest.fn().mockResolvedValue(doc) });

    expect(await getV2User()).toBe(doc);
    expect(users.findOneAndUpdate).not.toHaveBeenCalled();
    expect(currentUser).not.toHaveBeenCalled();
  });

  it('auto-creates from the real Clerk profile when the webhook has not fired', async () => {
    const doc = userDoc();
    (auth as jest.Mock).mockResolvedValue({ userId: doc.clerkId });
    (currentUser as jest.Mock).mockResolvedValue({
      primaryEmailAddress: { emailAddress: doc.email },
      firstName: 'Olivia',
      lastName: 'Organizer',
    });
    const users = mockUsers({
      findOneAndUpdate: jest.fn().mockResolvedValue(doc),
    });

    expect(await getV2User()).toBe(doc);
    expect(users.findOneAndUpdate).toHaveBeenCalledWith(
      { clerkId: doc.clerkId },
      expect.objectContaining({
        $set: expect.objectContaining({
          email: doc.email,
          name: 'Olivia Organizer',
        }),
      }),
      { upsert: true, returnDocument: 'after' }
    );
  });

  it('never fabricates an email — defers to the webhook instead', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_noemail' });
    (currentUser as jest.Mock).mockResolvedValue({ emailAddresses: [] });
    const users = mockUsers();

    expect(await getV2User()).toBeNull();
    expect(users.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('propagates DB errors — an outage must never masquerade as signed-out', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_x' });
    (getV2Db as jest.Mock).mockRejectedValue(new Error('atlas down'));
    await expect(getV2User()).rejects.toThrow('atlas down');
  });
});

describe('requireV2User', () => {
  it('throws Unauthorized when signed out', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: null });
    await expect(requireV2User()).rejects.toThrow('Unauthorized');
  });

  it('returns the user when signed in', async () => {
    const doc = userDoc();
    (auth as jest.Mock).mockResolvedValue({ userId: doc.clerkId });
    mockUsers({ findOne: jest.fn().mockResolvedValue(doc) });
    expect(await requireV2User()).toBe(doc);
  });
});

describe('participantFromUser', () => {
  it('uses the first name as the fork-facing display name', () => {
    const doc = userDoc({ name: 'Olivia Organizer' });
    expect(participantFromUser(doc)).toEqual({
      userId: doc._id,
      displayName: 'Olivia',
    });
  });

  it('falls back to the full name field when it has no spaces', () => {
    const doc = userDoc({ name: 'cher' });
    expect(participantFromUser(doc).displayName).toBe('cher');
  });
});
