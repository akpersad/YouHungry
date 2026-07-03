import { ObjectId } from 'mongodb';
import {
  MAX_BALLOTS,
  getSelectionHistory,
  serializeFork,
  submitVote,
} from '../forks';
import type { ForkDoc, ForkOption, ForkVote, Participant } from '../schema';

/**
 * Phase 4 fork behavior: the claim pointer (guest history follows the user
 * who claimed it), single-ballot continuity across a claim, and the ballot
 * cap abuse control.
 */

jest.mock('../db', () => ({
  getV2Db: jest.fn(),
}));

jest.mock('../guests', () => ({
  getClaimedGuestIds: jest.fn().mockResolvedValue([]),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getV2Db } = require('../db');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getClaimedGuestIds } = require('../guests');

const NOW = new Date('2026-07-02T12:00:00.000Z');
const LATER = new Date(NOW.getTime() + 10 * 60 * 1000);

let idCounter = 0;
function uniqueId(): ObjectId {
  return new ObjectId((++idCounter).toString(16).padStart(24, '0'));
}

const organizer: Participant = { userId: uniqueId(), displayName: 'Olivia' };
const user: Participant = { userId: uniqueId(), displayName: 'Marco' };

function option(name: string): ForkOption {
  return { placeId: uniqueId(), googlePlaceId: `gp-${name}`, name };
}

function vote(voter: Participant, rankings: ObjectId[]): ForkVote {
  return { voter, rankings, submittedAt: NOW };
}

function voteFork(overrides: Partial<ForkDoc> = {}): ForkDoc {
  const options = overrides.options ?? [option('Sushi'), option('Tacos')];
  return {
    _id: uniqueId(),
    code: 'testcode42',
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

interface ForksStub {
  findOne: jest.Mock;
  find: jest.Mock;
  updateOne: jest.Mock;
  findOneAndUpdate: jest.Mock;
}

function mockForks(overrides: Partial<ForksStub> = {}): ForksStub {
  const forks: ForksStub = {
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    }),
    updateOne: jest
      .fn()
      .mockResolvedValue({ matchedCount: 0, modifiedCount: 0 }),
    findOneAndUpdate: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
  (getV2Db as jest.Mock).mockResolvedValue({ forks });
  return forks;
}

beforeEach(() => {
  jest.clearAllMocks();
  (getClaimedGuestIds as jest.Mock).mockResolvedValue([]);
});

describe('getSelectionHistory follows the claim pointer', () => {
  it('includes forks joined under claimed guest identities', async () => {
    (getClaimedGuestIds as jest.Mock).mockResolvedValue(['g-old']);
    const forks = mockForks();

    await getSelectionHistory({ participant: user });

    const filter = forks.find.mock.calls[0][0];
    expect(filter.$or).toEqual([
      { participantUserIds: user.userId },
      { participantGuestIds: { $in: ['g-old'] } },
    ]);
    expect(getClaimedGuestIds).toHaveBeenCalledWith(user.userId);
  });

  it('keeps the plain filter when the user has no claims', async () => {
    const forks = mockForks();
    await getSelectionHistory({ participant: user });
    const filter = forks.find.mock.calls[0][0];
    expect(filter.$or).toBeUndefined();
    expect(filter.participantUserIds).toBe(user.userId);
  });

  it('never queries claims for guest participants', async () => {
    mockForks();
    await getSelectionHistory({
      participant: { guestId: 'g-1', displayName: 'Sam' },
    });
    expect(getClaimedGuestIds).not.toHaveBeenCalled();
  });
});

describe('submitVote claim continuity', () => {
  it('replaces a claimed guest ballot instead of adding a user ballot', async () => {
    const options = [option('Sushi'), option('Tacos')];
    const guestBallot = vote({ guestId: 'g-old', displayName: 'Sam' }, [
      options[0].placeId,
    ]);
    const fork = voteFork({ options, votes: [guestBallot] });
    const forks = mockForks({
      findOne: jest.fn().mockResolvedValue(fork),
      updateOne: jest
        .fn()
        .mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
    });

    await submitVote(fork.code, user, [options[1].placeId], {
      now: NOW,
      claimedGuestIds: ['g-old'],
    });

    const [filter, update] = forks.updateOne.mock.calls[0];
    // The write targets the guest's existing array element…
    expect(filter['votes.voter.guestId']).toBe('g-old');
    // …and the stored ballot keeps the guest identity (one person, one
    // ballot) while adopting the account's display name.
    expect(update.$set['votes.$'].voter).toEqual({
      guestId: 'g-old',
      displayName: 'Marco',
    });
  });

  it('votes as the user when none of their claims balloted this fork', async () => {
    const fork = voteFork();
    const forks = mockForks({
      findOne: jest.fn().mockResolvedValue(fork),
      updateOne: jest
        .fn()
        .mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
    });

    await submitVote(fork.code, user, [fork.options[0].placeId], {
      now: NOW,
      claimedGuestIds: ['g-unrelated'],
    });

    const [filter] = forks.updateOne.mock.calls[0];
    expect(filter['votes.voter.userId']).toBe(user.userId);
  });
});

describe('submitVote ballot cap', () => {
  it('guards first ballots on the cap slot being empty', async () => {
    const fork = voteFork();
    const forks = mockForks({
      findOne: jest.fn().mockResolvedValue(fork),
      updateOne: jest
        .fn()
        // replace path misses (new voter), push path lands
        .mockResolvedValueOnce({ matchedCount: 0, modifiedCount: 0 })
        .mockResolvedValueOnce({ matchedCount: 1, modifiedCount: 1 }),
    });

    await submitVote(fork.code, user, [fork.options[0].placeId], { now: NOW });

    const pushFilter = forks.updateOne.mock.calls[1][0];
    expect(pushFilter[`votes.${MAX_BALLOTS - 1}`]).toEqual({ $exists: false });
  });

  it('rejects a new voter on a fork at the cap with an honest message', async () => {
    const options = [option('Sushi'), option('Tacos')];
    const votes = Array.from({ length: MAX_BALLOTS }, (_, i) =>
      vote({ guestId: `g-${i}`, displayName: `Guest ${i}` }, [
        options[0].placeId,
      ])
    );
    const fork = voteFork({ options, votes });
    mockForks({ findOne: jest.fn().mockResolvedValue(fork) });

    await expect(
      submitVote(fork.code, user, [options[1].placeId], { now: NOW })
    ).rejects.toMatchObject({
      name: 'V2DomainError',
      message: 'This fork already has the maximum number of votes',
    });
  });

  it('still lets an existing voter revote at the cap', async () => {
    const options = [option('Sushi'), option('Tacos')];
    const votes = Array.from({ length: MAX_BALLOTS }, (_, i) =>
      vote({ guestId: `g-${i}`, displayName: `Guest ${i}` }, [
        options[0].placeId,
      ])
    );
    const fork = voteFork({ options, votes });
    const forks = mockForks({
      findOne: jest.fn().mockResolvedValue(fork),
      updateOne: jest
        .fn()
        .mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
    });

    await submitVote(
      fork.code,
      { guestId: 'g-3', displayName: 'Guest 3' },
      [options[1].placeId],
      { now: NOW }
    );

    // In-place replace, no push attempted.
    expect(forks.updateOne).toHaveBeenCalledTimes(1);
  });
});

describe('serializeFork with claimed identities', () => {
  it('surfaces the ballot a viewer cast as a since-claimed guest', () => {
    const options = [option('Sushi'), option('Tacos')];
    const guestBallot = vote({ guestId: 'g-old', displayName: 'Sam' }, [
      options[1].placeId,
      options[0].placeId,
    ]);
    const fork = voteFork({ options, votes: [guestBallot] });

    const withoutClaims = serializeFork(fork, user);
    expect(withoutClaims.myRankings).toBeNull();

    const withClaims = serializeFork(fork, user, ['g-old']);
    expect(withClaims.myRankings).toEqual([
      options[1].placeId.toString(),
      options[0].placeId.toString(),
    ]);
  });

  it('recognizes the organizer through a claimed guest identity', () => {
    const guestOrganizer: Participant = {
      guestId: 'g-org',
      displayName: 'Sam',
    };
    const fork = voteFork({
      organizer: guestOrganizer,
      participantUserIds: [],
      participantGuestIds: ['g-org'],
    });

    expect(serializeFork(fork, user).isOrganizer).toBe(false);
    expect(serializeFork(fork, user, ['g-org']).isOrganizer).toBe(true);
  });
});
