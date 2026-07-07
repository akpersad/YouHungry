import { ObjectId } from 'mongodb';
import { notifyForkClosed, notifyForkStarted } from '../notifications';
import type { ForkDoc } from '../schema';

jest.mock('../db', () => ({
  getV2Db: jest.fn(),
}));

jest.mock('../../notification-suppression', () => ({
  isExternalSendAllowed: jest.fn().mockReturnValue(false),
  warnSuppressed: jest.fn(),
}));

jest.mock('../../push-service', () => ({
  pushService: { sendNotification: jest.fn().mockResolvedValue(true) },
}));

jest.mock('../../api-usage-tracker', () => ({
  trackAPIUsage: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getV2Db } = require('../db');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  isExternalSendAllowed,
  warnSuppressed,
} = require('../../notification-suppression');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pushService } = require('../../push-service');

const ORGANIZER = new ObjectId('a'.repeat(24));
const MEMBER = new ObjectId('b'.repeat(24));
const WINNER = new ObjectId('1'.repeat(24));

function closedFork(overrides: Partial<ForkDoc> = {}): ForkDoc {
  const now = new Date();
  return {
    _id: new ObjectId(),
    code: 'testfork22',
    organizer: { userId: ORGANIZER, displayName: 'Olivia' },
    source: { kind: 'ad-hoc' },
    mode: 'vote',
    options: [
      { placeId: WINNER, googlePlaceId: 'dev-sushi', name: 'Sushi Yama' },
    ],
    status: 'closed',
    closesAt: now,
    votes: [],
    result: {
      placeId: WINNER,
      decidedAt: now,
      reasoning: '',
      weights: {},
    },
    participantUserIds: [ORGANIZER, MEMBER],
    participantGuestIds: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

interface UserRow {
  _id: ObjectId;
  email?: string;
  pushSubscriptions?: Array<{
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }>;
  preferences?: {
    notificationSettings?: { pushEnabled?: boolean; emailEnabled?: boolean };
  };
}

function mockUsers(rows: UserRow[]) {
  const updateOne = jest.fn().mockResolvedValue({});
  const collection = {
    find: jest.fn().mockReturnValue({
      project: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue(rows),
    }),
    updateOne,
  };
  (getV2Db as jest.Mock).mockResolvedValue({
    db: { collection: jest.fn().mockReturnValue(collection) },
  });
  return { updateOne };
}

const SUB = {
  endpoint: 'https://push.example/1',
  keys: { p256dh: 'p', auth: 'a' },
};

beforeEach(() => {
  jest.clearAllMocks();
  (isExternalSendAllowed as jest.Mock).mockReturnValue(false);
  (pushService.sendNotification as jest.Mock).mockResolvedValue(true);
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
});

describe('notifyForkClosed', () => {
  it('stays quiet for solo decisions and guest-only-reachable forks', async () => {
    mockUsers([]);
    // Solo: one account, no guests.
    await notifyForkClosed(
      closedFork({ participantUserIds: [ORGANIZER], participantGuestIds: [] })
    );
    // No accounts at all.
    await notifyForkClosed(
      closedFork({ participantUserIds: [], participantGuestIds: ['g1', 'g2'] })
    );
    expect(getV2Db).not.toHaveBeenCalled();
  });

  it('a lone account-holder among guests still gets the result', async () => {
    mockUsers([{ _id: ORGANIZER, email: 'olivia@example.com' }]);
    await notifyForkClosed(
      closedFork({
        participantUserIds: [ORGANIZER],
        participantGuestIds: ['g1'],
      })
    );
    expect(getV2Db).toHaveBeenCalled();
  });

  it('pushes to every subscription and suppresses email outside production', async () => {
    mockUsers([
      { _id: ORGANIZER, email: 'olivia@example.com', pushSubscriptions: [SUB] },
      { _id: MEMBER, email: 'marco@example.com' },
    ]);

    await notifyForkClosed(closedFork());

    expect(pushService.sendNotification).toHaveBeenCalledTimes(1);
    const [, payload] = (pushService.sendNotification as jest.Mock).mock
      .calls[0];
    expect(payload.title).toBe("We're going here.");
    expect(payload.body).toContain('Sushi Yama');
    // Email gated by the seam: suppressed → no Resend call, one warn each.
    expect(global.fetch).not.toHaveBeenCalled();
    expect(warnSuppressed).toHaveBeenCalledWith('email', expect.anything());
  });

  it('sends real email when the seam allows and honors explicit opt-outs', async () => {
    (isExternalSendAllowed as jest.Mock).mockReturnValue(true);
    process.env.RESEND_API_KEY = 'test-key';
    mockUsers([
      { _id: ORGANIZER, email: 'olivia@example.com' },
      {
        _id: MEMBER,
        email: 'marco@example.com',
        pushSubscriptions: [SUB],
        preferences: {
          notificationSettings: { emailEnabled: false, pushEnabled: false },
        },
      },
    ]);

    await notifyForkClosed(closedFork());

    // Marco opted out of both; only Olivia's email goes out.
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.to).toEqual(['olivia@example.com']);
    expect(pushService.sendNotification).not.toHaveBeenCalled();
    // The one-tap opt-out travels with every send: a signed link in the
    // footer plus the RFC 8058 one-click headers for mail clients.
    expect(body.html).toContain('/unsubscribe?token=');
    expect(body.html).toContain('Turn off result emails');
    expect(body.headers['List-Unsubscribe']).toContain('/unsubscribe?token=');
    expect(body.headers['List-Unsubscribe-Post']).toBe(
      'List-Unsubscribe=One-Click'
    );
    delete process.env.RESEND_API_KEY;
  });

  it('prunes expired push subscriptions', async () => {
    (pushService.sendNotification as jest.Mock).mockResolvedValue('expired');
    const { updateOne } = mockUsers([
      { _id: ORGANIZER, pushSubscriptions: [SUB] },
      { _id: MEMBER },
    ]);

    await notifyForkClosed(closedFork());

    expect(updateOne).toHaveBeenCalledWith(
      { _id: ORGANIZER },
      { $pull: { pushSubscriptions: { endpoint: SUB.endpoint } } }
    );
  });

  it('never throws, even when everything is broken', async () => {
    (getV2Db as jest.Mock).mockRejectedValue(new Error('atlas down'));
    await expect(notifyForkClosed(closedFork())).resolves.toBeUndefined();
  });
});

const CREW = new ObjectId('c'.repeat(24));
const THIRD = new ObjectId('d'.repeat(24));

function openCrewFork(overrides: Partial<ForkDoc> = {}): ForkDoc {
  return closedFork({
    status: 'open',
    result: undefined,
    crewId: CREW,
    votes: [],
    participantUserIds: [ORGANIZER],
    ...overrides,
  });
}

/** db.collection routes by name: crews get findOne, users get the cursor. */
function mockCrewAndUsers(
  crew: { _id: ObjectId; name: string; memberIds: ObjectId[] } | null,
  rows: UserRow[]
) {
  const users = {
    find: jest.fn().mockReturnValue({
      project: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue(rows),
    }),
    updateOne: jest.fn().mockResolvedValue({}),
  };
  const crews = { findOne: jest.fn().mockResolvedValue(crew) };
  (getV2Db as jest.Mock).mockResolvedValue({
    db: {
      collection: jest
        .fn()
        .mockImplementation((name: string) =>
          name === 'crews' ? crews : users
        ),
    },
  });
  return { users, crews };
}

describe('notifyForkStarted', () => {
  it('stays quiet for forks without a crew', async () => {
    mockCrewAndUsers(null, []);
    await notifyForkStarted(openCrewFork({ crewId: undefined }));
    expect(getV2Db).not.toHaveBeenCalled();
  });

  it('pushes to crew members except the organizer, honoring opt-outs', async () => {
    const { users } = mockCrewAndUsers(
      { _id: CREW, name: 'Date Night', memberIds: [ORGANIZER, MEMBER, THIRD] },
      [
        { _id: MEMBER, pushSubscriptions: [SUB] },
        {
          _id: THIRD,
          pushSubscriptions: [SUB],
          preferences: { notificationSettings: { pushEnabled: false } },
        },
      ]
    );

    await notifyForkStarted(openCrewFork());

    // The audience query excludes the organizer up front.
    const filter = users.find.mock.calls[0][0];
    expect(filter._id.$in.map(String)).toEqual([
      MEMBER.toString(),
      THIRD.toString(),
    ]);
    // THIRD opted out of push; only MEMBER gets the send.
    expect(pushService.sendNotification).toHaveBeenCalledTimes(1);
    const [, payload] = (pushService.sendNotification as jest.Mock).mock
      .calls[0];
    expect(payload.title).toBe('Where are we going?');
    expect(payload.body).toBe(
      'Olivia started a fork for Date Night. Tap to vote.'
    );
    // Same tag as the result push: the result replaces the invite in-tray.
    expect(payload.tag).toBe('fork-testfork22');
    expect(payload.data.url).toContain('/f/testfork22');
  });

  it('speaks spin for spin forks and never emails anyone', async () => {
    (isExternalSendAllowed as jest.Mock).mockReturnValue(true);
    mockCrewAndUsers(
      { _id: CREW, name: 'Date Night', memberIds: [ORGANIZER, MEMBER] },
      [{ _id: MEMBER, email: 'marco@example.com', pushSubscriptions: [SUB] }]
    );

    await notifyForkStarted(openCrewFork({ mode: 'spin' }));

    const [, payload] = (pushService.sendNotification as jest.Mock).mock
      .calls[0];
    expect(payload.body).toBe(
      'Olivia started a spin for Date Night. Tap to watch.'
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('stays quiet when the crew is gone or the organizer is its only member', async () => {
    mockCrewAndUsers(null, []);
    await notifyForkStarted(openCrewFork());
    expect(pushService.sendNotification).not.toHaveBeenCalled();

    mockCrewAndUsers({ _id: CREW, name: 'Solo', memberIds: [ORGANIZER] }, []);
    await notifyForkStarted(openCrewFork());
    expect(pushService.sendNotification).not.toHaveBeenCalled();
  });

  it('never throws, even when everything is broken', async () => {
    (getV2Db as jest.Mock).mockRejectedValue(new Error('atlas down'));
    await expect(notifyForkStarted(openCrewFork())).resolves.toBeUndefined();
  });
});
