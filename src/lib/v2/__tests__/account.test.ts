import { ObjectId } from 'mongodb';
import {
  MAX_PUSH_SUBSCRIPTIONS,
  addPushSubscription,
  changePassword,
  removePushSubscription,
  setFirstName,
  setNotificationSettings,
  setSearchAnchor,
  syncAccountFromClerk,
  toAccountView,
  unsubscribeEmailByToken,
} from '../account';
import { signUnsubscribeToken } from '../tokens';
import { V2DomainError } from '../errors';
import type { V2UserDoc } from '../schema';

jest.mock('@clerk/nextjs/server', () => ({
  clerkClient: jest.fn(),
  currentUser: jest.fn(),
}));

jest.mock('../db', () => ({
  getV2Db: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../google-places', () => ({
  isGooglePlacesEnabled: jest.fn().mockReturnValue(true),
  geocodeAddress: jest.fn(),
  geocodePlaceId: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  isGooglePlacesEnabled,
  geocodeAddress,
  geocodePlaceId,
} = require('../google-places');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { clerkClient, currentUser } = require('@clerk/nextjs/server');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getV2Db } = require('../db');

const USER_ID = new ObjectId('c'.repeat(24));

function userDoc(overrides: Partial<V2UserDoc> = {}): V2UserDoc {
  return {
    _id: USER_ID,
    clerkId: 'user_clerk1',
    email: 'olivia@example.com',
    name: 'Olivia Organizer',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

interface UsersStub {
  findOneAndUpdate: jest.Mock;
  updateOne: jest.Mock;
}

function mockUsers(overrides: Partial<UsersStub> = {}): UsersStub {
  const users: UsersStub = {
    findOneAndUpdate: jest.fn().mockResolvedValue(null),
    updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }),
    ...overrides,
  };
  (getV2Db as jest.Mock).mockResolvedValue({ users });
  return users;
}

interface ClerkStub {
  users: {
    updateUser: jest.Mock;
    verifyPassword: jest.Mock;
  };
  sessions: {
    getSessionList: jest.Mock;
    revokeSession: jest.Mock;
  };
}

function mockClerk(overrides: Partial<ClerkStub['users']> = {}): ClerkStub {
  const client: ClerkStub = {
    users: {
      updateUser: jest
        .fn()
        .mockResolvedValue({ firstName: 'Olivia', lastName: 'Organizer' }),
      verifyPassword: jest.fn().mockResolvedValue({ verified: true }),
      ...overrides,
    },
    sessions: {
      getSessionList: jest.fn().mockResolvedValue({ data: [] }),
      revokeSession: jest.fn().mockResolvedValue({}),
    },
  };
  (clerkClient as jest.Mock).mockResolvedValue(client);
  return client;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('toAccountView', () => {
  it('defaults absent notification flags to on', () => {
    const view = toAccountView(userDoc());
    expect(view.notifications).toEqual({
      pushEnabled: true,
      emailEnabled: true,
    });
    expect(view.firstName).toBe('Olivia');
    expect(view.pushEndpoints).toEqual([]);
  });

  it('reads explicit opt-outs and registered endpoints', () => {
    const view = toAccountView(
      userDoc({
        preferences: { notificationSettings: { emailEnabled: false } },
        pushSubscriptions: [
          {
            endpoint: 'https://push.example/1',
            keys: { p256dh: 'p', auth: 'a' },
          },
        ],
      })
    );
    expect(view.notifications).toEqual({
      pushEnabled: true,
      emailEnabled: false,
    });
    expect(view.pushEndpoints).toEqual(['https://push.example/1']);
  });
});

describe('setFirstName', () => {
  it('updates Clerk first, then mirrors the joined name into Mongo', async () => {
    const clerk = mockClerk({
      updateUser: jest
        .fn()
        .mockResolvedValue({ firstName: 'Liv', lastName: 'Organizer' }),
    });
    const users = mockUsers({
      findOneAndUpdate: jest
        .fn()
        .mockResolvedValue(userDoc({ name: 'Liv Organizer' })),
    });

    const view = await setFirstName(userDoc(), 'Liv');

    expect(clerk.users.updateUser).toHaveBeenCalledWith('user_clerk1', {
      firstName: 'Liv',
    });
    expect(users.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: USER_ID },
      { $set: expect.objectContaining({ name: 'Liv Organizer' }) },
      { returnDocument: 'after' }
    );
    expect(view.firstName).toBe('Liv');
  });

  it('surfaces the Clerk rejection as a domain error and skips Mongo', async () => {
    mockClerk({
      updateUser: jest.fn().mockRejectedValue({
        errors: [{ longMessage: 'First name is too long.' }],
      }),
    });
    const users = mockUsers();

    await expect(setFirstName(userDoc(), 'Liv')).rejects.toThrow(
      'First name is too long.'
    );
    expect(users.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

describe('syncAccountFromClerk', () => {
  it('mirrors the primary email and name from the Clerk profile', async () => {
    (currentUser as jest.Mock).mockResolvedValue({
      firstName: 'Olivia',
      lastName: 'Organizer',
      primaryEmailAddress: { emailAddress: 'new@example.com' },
      emailAddresses: [{ emailAddress: 'new@example.com' }],
    });
    const users = mockUsers({
      findOneAndUpdate: jest
        .fn()
        .mockResolvedValue(userDoc({ email: 'new@example.com' })),
    });

    const view = await syncAccountFromClerk(userDoc());

    expect(users.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: USER_ID },
      {
        $set: expect.objectContaining({
          email: 'new@example.com',
          name: 'Olivia Organizer',
        }),
      },
      { returnDocument: 'after' }
    );
    expect(view.email).toBe('new@example.com');
  });

  it('keeps the stored email when Clerk has none to offer', async () => {
    (currentUser as jest.Mock).mockResolvedValue(null);
    const users = mockUsers();

    await syncAccountFromClerk(userDoc());

    expect(users.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: USER_ID },
      { $set: expect.objectContaining({ email: 'olivia@example.com' }) },
      { returnDocument: 'after' }
    );
  });
});

describe('changePassword', () => {
  const input = {
    currentPassword: 'old-password',
    newPassword: 'new-password-123',
    currentSessionId: 'sess_current',
  };

  it('verifies the current password before setting the new one', async () => {
    const clerk = mockClerk();
    await changePassword(userDoc(), input);

    expect(clerk.users.verifyPassword).toHaveBeenCalledWith({
      userId: 'user_clerk1',
      password: 'old-password',
    });
    expect(clerk.users.updateUser).toHaveBeenCalledWith('user_clerk1', {
      password: 'new-password-123',
    });
  });

  it('rejects a wrong current password without touching the new one', async () => {
    const clerk = mockClerk({
      verifyPassword: jest.fn().mockRejectedValue(new Error('nope')),
    });

    await expect(changePassword(userDoc(), input)).rejects.toThrow(
      V2DomainError
    );
    expect(clerk.users.updateUser).not.toHaveBeenCalled();
  });

  it('revokes every other session but keeps the current one', async () => {
    const clerk = mockClerk();
    clerk.sessions.getSessionList.mockResolvedValue({
      data: [{ id: 'sess_current' }, { id: 'sess_other' }],
    });

    await changePassword(userDoc(), input);

    expect(clerk.sessions.revokeSession).toHaveBeenCalledTimes(1);
    expect(clerk.sessions.revokeSession).toHaveBeenCalledWith('sess_other');
  });

  it('reports success even when session revocation fails', async () => {
    const clerk = mockClerk();
    clerk.sessions.getSessionList.mockRejectedValue(new Error('clerk down'));

    await expect(changePassword(userDoc(), input)).resolves.toBeUndefined();
  });

  it('surfaces Clerk password-rule rejections verbatim', async () => {
    mockClerk({
      updateUser: jest.fn().mockRejectedValue({
        errors: [{ longMessage: 'Password found in a data breach.' }],
      }),
    });

    await expect(changePassword(userDoc(), input)).rejects.toThrow(
      'Password found in a data breach.'
    );
  });
});

describe('setSearchAnchor', () => {
  beforeEach(() => {
    (isGooglePlacesEnabled as jest.Mock).mockReturnValue(true);
  });

  it('geocodes once and stores label + GeoJSON point', async () => {
    (geocodeAddress as jest.Mock).mockResolvedValue({
      label: '123 Main St, Astoria, NY 11103, USA',
      lat: 40.761,
      lng: -73.925,
    });
    const users = mockUsers();

    await setSearchAnchor(userDoc(), '123 main st astoria');

    expect(geocodeAddress).toHaveBeenCalledWith('123 main st astoria');
    const [filter, update] = users.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ _id: USER_ID });
    expect(update.$set.searchAnchor).toEqual({
      label: '123 Main St, Astoria, NY 11103, USA',
      location: { type: 'Point', coordinates: [-73.925, 40.761] },
    });
  });

  it('null clears the anchor and reports a null label', async () => {
    const users = mockUsers();

    const view = await setSearchAnchor(
      userDoc({
        searchAnchor: {
          label: 'Old Address',
          location: { type: 'Point', coordinates: [-73.9, 40.7] },
        },
      }),
      null
    );

    const [, update] = users.findOneAndUpdate.mock.calls[0];
    expect(update.$unset).toEqual({ searchAnchor: '' });
    expect(geocodeAddress).not.toHaveBeenCalled();
    expect(view.searchAnchorLabel).toBeNull();
  });

  it('a type-ahead pick resolves by place id and closes its session', async () => {
    (geocodePlaceId as jest.Mock).mockResolvedValue({
      label: '123 Main St, Astoria, NY 11103, USA',
      lat: 40.761,
      lng: -73.925,
    });
    const users = mockUsers();

    await setSearchAnchor(userDoc(), '123 Main St, Astoria, NY, USA', {
      placeId: 'addr-1',
      sessionToken: 'session-abc-123',
    });

    expect(geocodePlaceId).toHaveBeenCalledWith('addr-1', 'session-abc-123');
    expect(geocodeAddress).not.toHaveBeenCalled();
    const [, update] = users.findOneAndUpdate.mock.calls[0];
    expect(update.$set.searchAnchor.location.coordinates).toEqual([
      -73.925, 40.761,
    ]);
  });

  it('is honest when the billing gate is closed (dev/CI)', async () => {
    (isGooglePlacesEnabled as jest.Mock).mockReturnValue(false);
    mockUsers();
    await expect(setSearchAnchor(userDoc(), '123 main st')).rejects.toThrow(
      V2DomainError
    );
    expect(geocodeAddress).not.toHaveBeenCalled();
  });

  it('is honest when Google cannot resolve the text', async () => {
    (geocodeAddress as jest.Mock).mockResolvedValue(null);
    mockUsers();
    await expect(
      setSearchAnchor(userDoc(), 'complete nonsense')
    ).rejects.toThrow('Could not find that address');
  });
});

describe('setNotificationSettings', () => {
  it('writes only the provided flags', async () => {
    const users = mockUsers({
      findOneAndUpdate: jest.fn().mockResolvedValue(
        userDoc({
          preferences: { notificationSettings: { pushEnabled: false } },
        })
      ),
    });

    const view = await setNotificationSettings(USER_ID, {
      pushEnabled: false,
    });

    const [, update] = users.findOneAndUpdate.mock.calls[0];
    // Bracket access: these are literal dotted $set keys, not paths.
    expect(update.$set['preferences.notificationSettings.pushEnabled']).toBe(
      false
    );
    expect(update.$set).not.toHaveProperty([
      'preferences.notificationSettings.emailEnabled',
    ]);
    expect(view).toEqual({ pushEnabled: false, emailEnabled: true });
  });
});

describe('push subscriptions', () => {
  const SUB = {
    endpoint: 'https://push.example/1',
    keys: { p256dh: 'p', auth: 'a' },
  };

  it('replaces a re-registered endpoint and bounds the list', async () => {
    const users = mockUsers();
    await addPushSubscription(USER_ID, SUB);

    expect(users.updateOne).toHaveBeenNthCalledWith(
      1,
      { _id: USER_ID },
      { $pull: { pushSubscriptions: { endpoint: SUB.endpoint } } }
    );
    const [, push] = users.updateOne.mock.calls[1];
    expect(push.$push.pushSubscriptions).toEqual({
      $each: [SUB],
      $slice: -MAX_PUSH_SUBSCRIPTIONS,
    });
  });

  it('removes by endpoint', async () => {
    const users = mockUsers();
    await removePushSubscription(USER_ID, SUB.endpoint);

    const [, update] = users.updateOne.mock.calls[0];
    expect(update.$pull).toEqual({
      pushSubscriptions: { endpoint: SUB.endpoint },
    });
  });
});

describe('unsubscribeEmailByToken', () => {
  it('flips emailEnabled off for a valid token', async () => {
    const users = mockUsers();
    const token = signUnsubscribeToken(USER_ID.toString());

    expect(await unsubscribeEmailByToken(token)).toBe(true);
    const [filter, update] = users.updateOne.mock.calls[0];
    expect(filter._id.toString()).toBe(USER_ID.toString());
    expect(update.$set['preferences.notificationSettings.emailEnabled']).toBe(
      false
    );
  });

  it('rejects a forged token without touching the database', async () => {
    const users = mockUsers();
    expect(await unsubscribeEmailByToken('forged.token')).toBe(false);
    expect(users.updateOne).not.toHaveBeenCalled();
  });

  it('reports false when the user no longer exists', async () => {
    mockUsers({
      updateOne: jest.fn().mockResolvedValue({ matchedCount: 0 }),
    });
    const token = signUnsubscribeToken(USER_ID.toString());
    expect(await unsubscribeEmailByToken(token)).toBe(false);
  });
});
