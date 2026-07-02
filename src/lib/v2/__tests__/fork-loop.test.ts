import { ObjectId } from 'mongodb';
import {
  closeForkWithConsensus,
  getSettledForkByCode,
  lockInQuickSpin,
  participantKey,
  quickSpin,
  serializeFork,
  settleFork,
  submitVote,
} from '../forks';
import type { ForkDoc, ForkOption, ForkVote, Participant } from '../schema';

jest.mock('../db', () => ({
  getV2Db: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getV2Db } = require('../db');

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-07-02T12:00:00.000Z');
const LATER = new Date(NOW.getTime() + 10 * 60 * 1000);
const OVERDUE = new Date(NOW.getTime() - 60 * 1000);

let idCounter = 0;
function uniqueId(): ObjectId {
  return new ObjectId((++idCounter).toString(16).padStart(24, '0'));
}

const organizer: Participant = { userId: uniqueId(), displayName: 'Olivia' };
const voter1: Participant = { userId: uniqueId(), displayName: 'Marco' };
const voter2: Participant = { userId: uniqueId(), displayName: 'Mia' };

function option(name: string): ForkOption {
  return { placeId: uniqueId(), googlePlaceId: `gp-${name}`, name };
}

function vote(voter: Participant, rankings: ObjectId[]): ForkVote {
  return { voter, rankings, submittedAt: NOW };
}

interface ForksStub {
  insertOne: jest.Mock;
  findOne: jest.Mock;
  find: jest.Mock;
  updateOne: jest.Mock;
  findOneAndUpdate: jest.Mock;
}

function mockForks(overrides: Partial<ForksStub> = {}): ForksStub {
  const forks: ForksStub = {
    insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    findOneAndUpdate: jest.fn().mockResolvedValue(null),
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

function voteFork(overrides: Partial<ForkDoc> = {}): ForkDoc {
  const options = overrides.options ?? [
    option('Sushi Yama'),
    option('Taco Bravo'),
    option('Pho Lantern'),
  ];
  return {
    _id: uniqueId(),
    code: 'votecode22',
    organizer,
    source: { kind: 'ad-hoc' },
    mode: 'vote',
    options,
    status: 'open',
    closesAt: LATER,
    votes: [],
    participantUserIds: [organizer.userId!],
    participantGuestIds: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------

describe('participantKey', () => {
  it('distinguishes users from guests and is stable', () => {
    const userId = uniqueId();
    expect(participantKey({ userId, displayName: 'A' })).toBe(
      `u:${userId.toString()}`
    );
    expect(participantKey({ guestId: 'gg', displayName: 'B' })).toBe('g:gg');
    expect(participantKey({ userId, displayName: 'renamed' })).toBe(
      participantKey({ userId, displayName: 'A' })
    );
  });
});

describe('quickSpin', () => {
  it('spins without writing anything', async () => {
    const forks = mockForks();
    const options = [option('Sushi'), option('Tacos')];

    const outcome = await quickSpin(options, organizer, {
      now: NOW,
      rng: () => 0,
    });

    expect(outcome.winnerPlaceId).toBe(options[0].placeId.toString());
    expect(forks.insertOne).not.toHaveBeenCalled();
    expect(forks.updateOne).not.toHaveBeenCalled();
  });

  it('uses base weights (no history read) for signed-out spinners', async () => {
    const forks = mockForks();
    const options = [option('Sushi'), option('Tacos')];

    const outcome = await quickSpin(options, null, { now: NOW, rng: () => 0 });

    expect(forks.find).not.toHaveBeenCalled();
    expect(Object.values(outcome.weights)).toEqual([1, 1]);
  });

  it('decay-weights against the participant history when signed in', async () => {
    const options = [option('Sushi'), option('Tacos')];
    mockForks({
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

    const outcome = await quickSpin(options, organizer, {
      now: NOW,
      rng: () => 0.999,
    });

    expect(outcome.weights[options[0].placeId.toString()]).toBeCloseTo(
      0.1 + 0.9 / 30
    );
    expect(outcome.winnerPlaceId).toBe(options[1].placeId.toString());
  });

  it('throws on an empty option set', async () => {
    mockForks();
    await expect(quickSpin([], organizer)).rejects.toThrow('No options');
  });
});

describe('lockInQuickSpin', () => {
  it('persists a closed fork with a server-recomputed result', async () => {
    const forks = mockForks();
    const options = [option('Sushi'), option('Tacos')];

    const fork = await lockInQuickSpin({
      organizer,
      source: {
        kind: 'near-me',
        center: { type: 'Point', coordinates: [-73.92, 40.76] },
        radiusM: 2000,
      },
      options,
      winnerPlaceId: options[1].placeId,
      now: NOW,
    });

    expect(fork.status).toBe('closed');
    expect(fork.mode).toBe('spin');
    expect(fork.result?.placeId.toString()).toBe(options[1].placeId.toString());
    expect(fork.result?.weights).toEqual({
      [options[0].placeId.toString()]: 1,
      [options[1].placeId.toString()]: 1,
    });
    expect(fork.participantUserIds).toEqual([organizer.userId]);
    expect(forks.insertOne).toHaveBeenCalledTimes(1);
  });

  it('rejects a winner that was not on the wheel', async () => {
    mockForks();
    await expect(
      lockInQuickSpin({
        organizer,
        source: { kind: 'ad-hoc' },
        options: [option('Sushi')],
        winnerPlaceId: uniqueId(),
      })
    ).rejects.toThrow('not one of the options');
  });
});

describe('settleFork', () => {
  it('returns non-open and not-yet-due forks untouched', async () => {
    const forks = mockForks();
    const openFork = voteFork();
    const closedFork = voteFork({ status: 'closed' });

    expect(await settleFork(openFork, { now: NOW })).toBe(openFork);
    expect(await settleFork(closedFork, { now: NOW })).toBe(closedFork);
    expect(forks.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('expires an overdue fork with no ballots', async () => {
    const fork = voteFork({ closesAt: OVERDUE });
    const expired = { ...fork, status: 'expired' as const };
    const forks = mockForks({
      findOneAndUpdate: jest.fn().mockResolvedValue(expired),
    });

    const settled = await settleFork(fork, { now: NOW });

    expect(settled.status).toBe('expired');
    expect(forks.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: fork._id, status: 'open' },
      { $set: { status: 'expired', updatedAt: NOW } },
      { returnDocument: 'after' }
    );
  });

  it('closes an overdue vote fork with ballots via consensus', async () => {
    const fork = voteFork({ closesAt: OVERDUE });
    fork.votes = [vote(voter1, [fork.options[1].placeId])];
    const forks = mockForks({
      findOneAndUpdate: jest
        .fn()
        .mockImplementation((_filter, update) =>
          Promise.resolve({ ...fork, ...update.$set })
        ),
    });

    const settled = await settleFork(fork, { now: NOW, rng: () => 0 });

    expect(settled.status).toBe('closed');
    expect(settled.result?.placeId.toString()).toBe(
      fork.options[1].placeId.toString()
    );
    expect(forks.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: fork._id, status: 'open' },
      expect.objectContaining({
        $set: expect.objectContaining({ status: 'closed' }),
      }),
      { returnDocument: 'after' }
    );
  });

  it('expires an overdue spin fork', async () => {
    const fork = voteFork({ mode: 'spin', closesAt: OVERDUE });
    const forks = mockForks({
      findOneAndUpdate: jest
        .fn()
        .mockResolvedValue({ ...fork, status: 'expired' }),
    });
    const settled = await settleFork(fork, { now: NOW });
    expect(settled.status).toBe('expired');
    expect(forks.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  it('re-reads when it loses the close race', async () => {
    const fork = voteFork({ closesAt: OVERDUE });
    const alreadyExpired = { ...fork, status: 'expired' as const };
    const forks = mockForks({
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
      findOne: jest.fn().mockResolvedValue(alreadyExpired),
    });

    const settled = await settleFork(fork, { now: NOW });

    expect(settled.status).toBe('expired');
    expect(forks.findOne).toHaveBeenCalledWith({ _id: fork._id });
  });
});

describe('getSettledForkByCode', () => {
  it('returns null for an unknown code', async () => {
    mockForks();
    expect(await getSettledForkByCode('nope')).toBeNull();
  });

  it('settles an overdue fork on read', async () => {
    const fork = voteFork({ closesAt: OVERDUE });
    const forks = mockForks({
      findOne: jest.fn().mockResolvedValue(fork),
      findOneAndUpdate: jest
        .fn()
        .mockResolvedValue({ ...fork, status: 'expired' }),
    });

    const settled = await getSettledForkByCode(fork.code, { now: NOW });

    expect(settled?.status).toBe('expired');
    expect(forks.findOne).toHaveBeenCalledWith({ code: fork.code });
  });
});

describe('closeForkWithConsensus', () => {
  it('refuses to close with zero ballots', async () => {
    mockForks();
    await expect(closeForkWithConsensus(voteFork())).rejects.toThrow(
      'no ballots'
    );
  });

  it('persists the 3/2/1 winner as the result', async () => {
    const fork = voteFork();
    const [a, b] = fork.options;
    fork.votes = [
      vote(voter1, [a.placeId, b.placeId]),
      vote(voter2, [a.placeId]),
    ];
    const forks = mockForks({
      findOneAndUpdate: jest
        .fn()
        .mockImplementation((_filter, update) =>
          Promise.resolve({ ...fork, ...update.$set })
        ),
    });

    const closed = await closeForkWithConsensus(fork, { now: NOW });

    expect(closed.result?.placeId.toString()).toBe(a.placeId.toString());
    // Scores land in result.weights — the "why this pick" data for votes.
    expect(closed.result?.weights[a.placeId.toString()]).toBe(6);
    expect(closed.result?.weights[b.placeId.toString()]).toBe(2);
    expect(forks.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: fork._id, status: 'open' },
      expect.anything(),
      { returnDocument: 'after' }
    );
  });
});

describe('submitVote', () => {
  function mockVoteFlow(fork: ForkDoc, afterPush: ForkDoc) {
    return mockForks({
      // 1st findOne: getSettledForkByCode; 2nd: the re-read after $push.
      findOne: jest
        .fn()
        .mockResolvedValueOnce(fork)
        .mockResolvedValue(afterPush),
    });
  }

  it('rejects votes on spin forks, closed forks, and unknown codes', async () => {
    const spin = voteFork({ mode: 'spin' });
    mockForks({ findOne: jest.fn().mockResolvedValue(spin) });
    await expect(
      submitVote(spin.code, voter1, [spin.options[0].placeId], { now: NOW })
    ).rejects.toThrow('not in vote mode');

    const closed = voteFork({ status: 'closed' });
    mockForks({ findOne: jest.fn().mockResolvedValue(closed) });
    await expect(
      submitVote(closed.code, voter1, [closed.options[0].placeId], {
        now: NOW,
      })
    ).rejects.toThrow('no longer open');

    mockForks();
    await expect(
      submitVote('missing123', voter1, [uniqueId()], { now: NOW })
    ).rejects.toThrow('Fork not found');
  });

  it('validates rankings: 1–3, distinct, on the ballot', async () => {
    const fork = voteFork();
    const [a, b, c] = fork.options.map((o) => o.placeId);

    mockForks({ findOne: jest.fn().mockResolvedValue(fork) });
    await expect(
      submitVote(fork.code, voter1, [], { now: NOW })
    ).rejects.toThrow('between one and three');

    mockForks({ findOne: jest.fn().mockResolvedValue(fork) });
    await expect(
      submitVote(fork.code, voter1, [a, b, c, a], { now: NOW })
    ).rejects.toThrow('between one and three');

    mockForks({ findOne: jest.fn().mockResolvedValue(fork) });
    await expect(
      submitVote(fork.code, voter1, [a, a], { now: NOW })
    ).rejects.toThrow('distinct');

    mockForks({ findOne: jest.fn().mockResolvedValue(fork) });
    await expect(
      submitVote(fork.code, voter1, [uniqueId()], { now: NOW })
    ).rejects.toThrow('not on this fork');
  });

  it('upserts the ballot ($pull then $push) and tracks the participant', async () => {
    const fork = voteFork();
    const ranking = [fork.options[0].placeId];
    const afterPush = { ...fork, votes: [vote(voter1, ranking)] };
    const forks = mockVoteFlow(fork, afterPush);

    const updated = await submitVote(fork.code, voter1, ranking, { now: NOW });

    expect(updated.votes).toHaveLength(1);
    expect(forks.updateOne).toHaveBeenNthCalledWith(
      1,
      { _id: fork._id, status: 'open' },
      { $pull: { votes: { 'voter.userId': voter1.userId } } }
    );
    expect(forks.updateOne).toHaveBeenNthCalledWith(
      2,
      { _id: fork._id, status: 'open' },
      expect.objectContaining({
        $push: {
          votes: { voter: voter1, rankings: ranking, submittedAt: NOW },
        },
        $addToSet: { participantUserIds: voter1.userId },
      })
    );
    // No quorum on this fork → no close.
    expect(forks.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('closes with consensus the moment quorum is reached', async () => {
    const fork = voteFork({ quorum: 2 });
    const [a, b] = fork.options;
    const afterPush = {
      ...fork,
      votes: [vote(voter1, [a.placeId]), vote(voter2, [a.placeId, b.placeId])],
    };
    const forks = mockVoteFlow(fork, afterPush);
    forks.findOneAndUpdate.mockImplementation((_filter, update) =>
      Promise.resolve({ ...afterPush, ...update.$set })
    );

    const updated = await submitVote(
      fork.code,
      voter2,
      [a.placeId, b.placeId],
      {
        now: NOW,
        rng: () => 0,
      }
    );

    expect(updated.status).toBe('closed');
    expect(updated.result?.placeId.toString()).toBe(a.placeId.toString());
  });

  it('fails cleanly when the push loses a race with a closer', async () => {
    const fork = voteFork();
    const forks = mockForks({
      findOne: jest.fn().mockResolvedValue(fork),
    });
    forks.updateOne
      .mockResolvedValueOnce({ modifiedCount: 1 }) // $pull
      .mockResolvedValueOnce({ modifiedCount: 0 }); // $push blocked

    await expect(
      submitVote(fork.code, voter1, [fork.options[0].placeId], { now: NOW })
    ).rejects.toThrow('no longer open');
  });
});

describe('serializeFork', () => {
  it('exposes aggregates and the viewer ballot, never other ballots', () => {
    const fork = voteFork();
    const [a, b] = fork.options;
    fork.votes = [
      vote(voter1, [a.placeId, b.placeId]),
      vote(voter2, [b.placeId]),
    ];

    const view = serializeFork(fork, voter1);

    expect(view.voteCount).toBe(2);
    expect(view.voterNames).toEqual(['Marco', 'Mia']);
    expect(view.myRankings).toEqual([
      a.placeId.toString(),
      b.placeId.toString(),
    ]);
    expect(view.result).toBeNull();
    expect(view.breakdown).toBeNull(); // tally is private until close
    expect(JSON.stringify(view)).not.toContain('"rankings"');
  });

  it('marks the organizer and handles signed-out viewers', () => {
    const fork = voteFork();
    expect(serializeFork(fork, organizer).isOrganizer).toBe(true);
    const anonymous = serializeFork(fork, null);
    expect(anonymous.isOrganizer).toBe(false);
    expect(anonymous.myRankings).toBeNull();
  });

  it('exposes result + breakdown once closed', () => {
    const fork = voteFork();
    const [a, b] = fork.options;
    fork.votes = [
      vote(voter1, [a.placeId, b.placeId]),
      vote(voter2, [a.placeId]),
    ];
    fork.status = 'closed';
    fork.result = {
      placeId: a.placeId,
      decidedAt: NOW,
      reasoning: 'Clear winner with 6 points (2 votes total)',
      weights: { [a.placeId.toString()]: 6, [b.placeId.toString()]: 2 },
    };

    const view = serializeFork(fork, voter2);

    expect(view.result?.name).toBe(a.name);
    expect(view.breakdown?.[a.placeId.toString()]).toEqual({
      first: 2,
      second: 0,
      third: 0,
      total: 6,
    });
    expect(view.breakdown?.[b.placeId.toString()]).toEqual({
      first: 0,
      second: 1,
      third: 0,
      total: 2,
    });
  });

  it('surfaces the near-me vibe', () => {
    const fork = voteFork({
      source: {
        kind: 'near-me',
        center: { type: 'Point', coordinates: [-73.92, 40.76] },
        radiusM: 2000,
        vibe: 'cheap',
      },
    });
    const view = serializeFork(fork, null);
    expect(view.sourceKind).toBe('near-me');
    expect(view.vibe).toBe('cheap');
  });
});
