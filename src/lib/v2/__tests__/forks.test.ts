import { ObjectId } from 'mongodb';
import {
  createFork,
  getForkByCode,
  getSelectionHistory,
  spinFork,
} from '../forks';
import type { ForkDoc, ForkOption, Participant } from '../schema';

jest.mock('../notifications', () => ({
  notifyForkClosed: jest.fn().mockResolvedValue(undefined),
  notifyForkStarted: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../db', () => ({
  getV2Db: jest.fn(),
}));

// These suites exercise fork logic for plain users/guests — no claims. The
// claim-pointer behavior has its own suite (fork-guests.test.ts).
jest.mock('../guests', () => ({
  getClaimedGuestIds: jest.fn().mockResolvedValue([]),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getV2Db } = require('../db');

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-07-02T12:00:00.000Z');

// The shared mongodb mock stringifies every no-arg ObjectId identically, so
// mint unique 24-hex ids explicitly wherever identity matters.
let idCounter = 0;
function uniqueId(): ObjectId {
  return new ObjectId((++idCounter).toString(16).padStart(24, '0'));
}

const organizer: Participant = {
  userId: uniqueId(),
  displayName: 'Organizer',
};

function option(name: string): ForkOption {
  return {
    placeId: uniqueId(),
    googlePlaceId: `gp-${name}`,
    name,
  };
}

interface ForksStub {
  insertOne: jest.Mock;
  findOne: jest.Mock;
  find: jest.Mock;
  updateOne: jest.Mock;
}

function mockForksCollection(overrides: Partial<ForksStub> = {}): ForksStub {
  const forks: ForksStub = {
    insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    }),
    updateOne: jest
      .fn()
      .mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
    ...overrides,
  };
  (getV2Db as jest.Mock).mockResolvedValue({ forks });
  return forks;
}

function historyReturning(docs: Partial<ForkDoc>[]) {
  return jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue(docs),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createFork', () => {
  it('inserts an open fork with a code, defaults, and flat participant ids', async () => {
    const forks = mockForksCollection();
    const options = [option('Sushi'), option('Tacos')];

    const fork = await createFork({
      organizer,
      source: { kind: 'ad-hoc' },
      mode: 'spin',
      options,
    });

    expect(fork.status).toBe('open');
    expect(fork.code).toMatch(/^[abcdefghjkmnpqrstuvwxyz23456789]{10}$/);
    expect(fork.votes).toEqual([]);
    expect(fork.participantUserIds).toEqual([organizer.userId]);
    expect(fork.participantGuestIds).toEqual([]);
    // default lifespan ~30 minutes from creation
    expect(fork.closesAt.getTime() - fork.createdAt.getTime()).toBe(
      30 * 60 * 1000
    );
    expect(forks.insertOne).toHaveBeenCalledTimes(1);
  });

  it('tracks guest organizers in participantGuestIds', async () => {
    mockForksCollection();
    const fork = await createFork({
      organizer: { guestId: 'guest-1', displayName: 'Guest' },
      source: { kind: 'ad-hoc' },
      mode: 'vote',
      options: [option('Pizza')],
    });
    expect(fork.participantUserIds).toEqual([]);
    expect(fork.participantGuestIds).toEqual(['guest-1']);
  });

  it('re-mints the code on a duplicate-key collision', async () => {
    const duplicate = Object.assign(new Error('E11000 duplicate key'), {
      code: 11000,
    });

    const forks = mockForksCollection({
      insertOne: jest
        .fn()
        .mockRejectedValueOnce(duplicate)
        .mockResolvedValueOnce({ insertedId: new ObjectId() }),
    });

    const fork = await createFork({
      organizer,
      source: { kind: 'ad-hoc' },
      mode: 'spin',
      options: [option('Ramen')],
    });

    expect(forks.insertOne).toHaveBeenCalledTimes(2);
    const firstCode = forks.insertOne.mock.calls[0][0].code;
    expect(fork.code).not.toBe(firstCode);
  });

  it('rethrows non-duplicate insert errors', async () => {
    mockForksCollection({
      insertOne: jest.fn().mockRejectedValue(new Error('network down')),
    });
    await expect(
      createFork({
        organizer,
        source: { kind: 'ad-hoc' },
        mode: 'spin',
        options: [option('Thai')],
      })
    ).rejects.toThrow('network down');
  });
});

describe('getForkByCode', () => {
  it('looks up by code', async () => {
    const forks = mockForksCollection();
    await getForkByCode('abc123defg');
    expect(forks.findOne).toHaveBeenCalledWith({ code: 'abc123defg' });
  });
});

describe('getSelectionHistory', () => {
  it('maps closed forks with results to selection events', async () => {
    const placeId = new ObjectId();
    const decidedAt = new Date(NOW.getTime() - 3 * DAY_MS);
    const forks = mockForksCollection({
      find: historyReturning([
        { result: { placeId, decidedAt, reasoning: '', weights: {} } },
      ]),
    });

    const history = await getSelectionHistory({ participant: organizer });

    expect(history).toEqual([{ optionId: placeId.toString(), decidedAt }]);
    expect(forks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        participantUserIds: organizer.userId,
        status: 'closed',
      })
    );
  });

  it('scopes crew history by crewId', async () => {
    const crewId = new ObjectId();
    const forks = mockForksCollection();
    await getSelectionHistory({ crewId });
    expect(forks.find).toHaveBeenCalledWith(
      expect.objectContaining({ crewId, status: 'closed' })
    );
  });

  it('scopes guest history by guestId', async () => {
    const forks = mockForksCollection();
    await getSelectionHistory({
      participant: { guestId: 'guest-9', displayName: 'G' },
    });
    expect(forks.find).toHaveBeenCalledWith(
      expect.objectContaining({ participantGuestIds: 'guest-9' })
    );
  });
});

describe('spinFork', () => {
  function openSpinFork(options: ForkOption[]): ForkDoc {
    return {
      _id: new ObjectId(),
      code: 'testcode22',
      organizer,
      source: { kind: 'ad-hoc' },
      mode: 'spin',
      options,
      status: 'open',
      closesAt: new Date(NOW.getTime() + 10 * 60 * 1000),
      votes: [],
      participantUserIds: [organizer.userId!],
      participantGuestIds: [],
      createdAt: NOW,
      updatedAt: NOW,
    };
  }

  it('spins, persists the result, and closes the fork', async () => {
    const options = [option('Sushi'), option('Tacos')];
    const fork = openSpinFork(options);
    const forks = mockForksCollection({
      findOne: jest.fn().mockResolvedValue(fork),
    });

    const result = await spinFork(fork._id, { now: NOW, rng: () => 0 });

    // rng 0 → first option; no history → equal weights of 1.
    expect(result.placeId.toString()).toBe(options[0].placeId.toString());
    expect(result.weights).toEqual({
      [options[0].placeId.toString()]: 1,
      [options[1].placeId.toString()]: 1,
    });
    expect(result.decidedAt).toBe(NOW);
    expect(forks.updateOne).toHaveBeenCalledWith(
      { _id: fork._id, status: 'open' },
      {
        $set: expect.objectContaining({ status: 'closed', result }),
      }
    );
  });

  it('down-weights a recently picked option using participant history', async () => {
    const options = [option('Sushi'), option('Tacos')];
    const fork = openSpinFork(options);
    // Sushi was picked yesterday → weight ≈ 0.1 + 0.9/30.
    const forks = mockForksCollection({
      findOne: jest.fn().mockResolvedValue(fork),
      find: historyReturning([
        {
          result: {
            placeId: options[0].placeId,
            decidedAt: new Date(NOW.getTime() - DAY_MS),
            reasoning: '',
            weights: {},
          },
        },
      ]),
    });

    const result = await spinFork(fork._id, { now: NOW, rng: () => 0.999 });

    const sushiWeight = result.weights[options[0].placeId.toString()];
    expect(sushiWeight).toBeCloseTo(0.1 + 0.9 * (1 / 30));
    expect(result.weights[options[1].placeId.toString()]).toBe(1);
    // High rng lands in the heavier (fresh) bucket.
    expect(result.placeId.toString()).toBe(options[1].placeId.toString());
    expect(forks.find).toHaveBeenCalledWith(
      expect.objectContaining({ participantUserIds: organizer.userId })
    );
  });

  it('uses crew-scoped history when the fork has a crewId', async () => {
    const crewId = new ObjectId();
    const fork = { ...openSpinFork([option('Pho')]), crewId };
    const forks = mockForksCollection({
      findOne: jest.fn().mockResolvedValue(fork),
    });

    await spinFork(fork._id, { now: NOW, rng: () => 0 });

    expect(forks.find).toHaveBeenCalledWith(
      expect.objectContaining({ crewId })
    );
  });

  it('rejects a missing fork', async () => {
    mockForksCollection();
    await expect(spinFork(new ObjectId())).rejects.toThrow('Fork not found');
  });

  it('rejects a vote-mode fork', async () => {
    const fork = { ...openSpinFork([option('Pho')]), mode: 'vote' as const };
    mockForksCollection({ findOne: jest.fn().mockResolvedValue(fork) });
    await expect(spinFork(fork._id)).rejects.toThrow('not in spin mode');
  });

  it('rejects a closed fork', async () => {
    const fork = {
      ...openSpinFork([option('Pho')]),
      status: 'closed' as const,
    };
    mockForksCollection({ findOne: jest.fn().mockResolvedValue(fork) });
    await expect(spinFork(fork._id)).rejects.toThrow('no longer open');
  });

  it('rejects a fork with no options', async () => {
    const fork = openSpinFork([]);
    mockForksCollection({ findOne: jest.fn().mockResolvedValue(fork) });
    await expect(spinFork(fork._id)).rejects.toThrow('no options');
  });
});
