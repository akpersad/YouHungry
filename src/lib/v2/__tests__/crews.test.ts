import { ObjectId } from 'mongodb';
import {
  CREW_SUGGESTION_THRESHOLD,
  createCrew,
  getCrewForMember,
  getCrewSuggestionsForUser,
  getCrewView,
  memberKey,
  reforkCrew,
} from '../crews';
import { V2DomainError } from '../errors';
import type { CrewDoc } from '../schema';

jest.mock('../db', () => ({
  getV2Db: jest.fn(),
}));

jest.mock('../forks', () => ({
  createFork: jest.fn(),
  getSelectionHistory: jest.fn().mockResolvedValue([]),
}));

jest.mock('../places', () => ({
  getPlacesByIds: jest.fn().mockResolvedValue([]),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getV2Db } = require('../db');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createFork, getSelectionHistory } = require('../forks');

const ME = new ObjectId('a'.repeat(24));
const MARCO = new ObjectId('b'.repeat(24));
const MIA = new ObjectId('c'.repeat(24));
const CREW_ID = new ObjectId('d'.repeat(24));

function crewDoc(overrides: Partial<CrewDoc> = {}): CrewDoc {
  const now = new Date();
  return {
    _id: CREW_ID,
    name: 'The usual three',
    memberIds: [ME, MARCO, MIA],
    createdBy: ME,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function historyFork(participants: ObjectId[], daysAgo: number) {
  return {
    participantUserIds: participants,
    createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
  };
}

interface Stubs {
  forks: {
    find: jest.Mock;
    findOne: jest.Mock;
    updateMany: jest.Mock;
  };
  crews: {
    find: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    insertOne: jest.Mock;
  };
  users: { find: jest.Mock; countDocuments: jest.Mock };
}

function findCursor(docs: unknown[]) {
  return {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    project: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue(docs),
  };
}

function mockDb({
  historyForks = [] as unknown[],
  crews = [] as CrewDoc[],
  users = [
    { _id: ME, name: 'Olivia Chen' },
    { _id: MARCO, name: 'Marco Reyes' },
    { _id: MIA, name: 'Mia Novak' },
  ] as unknown[],
} = {}): Stubs {
  const stubs: Stubs = {
    forks: {
      find: jest.fn().mockReturnValue(findCursor(historyForks)),
      findOne: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    },
    crews: {
      find: jest.fn().mockReturnValue(findCursor(crews)),
      findOne: jest.fn().mockResolvedValue(null),
      findOneAndUpdate: jest.fn().mockResolvedValue(crewDoc()),
      insertOne: jest.fn().mockResolvedValue({}),
    },
    users: {
      find: jest.fn().mockReturnValue(findCursor(users)),
      countDocuments: jest.fn().mockResolvedValue(3),
    },
  };
  (getV2Db as jest.Mock).mockResolvedValue(stubs);
  return stubs;
}

beforeEach(() => {
  jest.clearAllMocks();
  (getSelectionHistory as jest.Mock).mockResolvedValue([]);
});

describe('memberKey', () => {
  it('is order-independent', () => {
    expect(memberKey([ME, MARCO, MIA])).toBe(memberKey([MIA, ME, MARCO]));
  });
});

describe('getCrewSuggestionsForUser', () => {
  it('suggests a group at the threshold, with names in member order', async () => {
    const trio = [ME, MARCO, MIA];
    mockDb({
      historyForks: [
        historyFork(trio, 2),
        historyFork([MIA, ME, MARCO], 9), // same set, different order
        historyFork(trio, 20),
        historyFork([ME, MARCO], 5), // pair only twice — no suggestion
        historyFork([ME, MARCO], 6),
      ],
    });

    const suggestions = await getCrewSuggestionsForUser(ME);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].forkCount).toBe(CREW_SUGGESTION_THRESHOLD);
    expect(suggestions[0].memberIds).toEqual(trio.map((id) => id.toString()));
    expect(suggestions[0].memberNames).toEqual(['Olivia', 'Marco', 'Mia']);
  });

  it('never re-suggests a set that already is a crew', async () => {
    const trio = [ME, MARCO, MIA];
    mockDb({
      historyForks: [
        historyFork(trio, 1),
        historyFork(trio, 2),
        historyFork(trio, 3),
      ],
      crews: [crewDoc({ memberIds: [MIA, MARCO, ME] })],
    });

    expect(await getCrewSuggestionsForUser(ME)).toEqual([]);
  });
});

describe('createCrew', () => {
  it('creates and back-attaches exactly-matching closed forks', async () => {
    const stubs = mockDb();

    const crew = await createCrew(ME, [ME, MARCO, MIA], 'The usual three');

    expect(stubs.crews.insertOne).toHaveBeenCalled();
    expect(crew.memberIds).toHaveLength(3);
    const [filter, update] = stubs.forks.updateMany.mock.calls[0];
    expect(filter).toMatchObject({
      status: 'closed',
      crewId: { $exists: false },
      participantUserIds: { $all: crew.memberIds, $size: 3 },
    });
    expect(update.$set.crewId).toBe(crew._id);
  });

  it('is idempotent on the member set', async () => {
    const existing = crewDoc();
    const stubs = mockDb({ crews: [existing] });

    const crew = await createCrew(ME, [MIA, ME, MARCO], 'Different name');

    expect(crew).toBe(existing);
    expect(stubs.crews.insertOne).not.toHaveBeenCalled();
    expect(stubs.forks.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a crew that excludes its creator, or is too small', async () => {
    mockDb();
    await expect(createCrew(ME, [MARCO, MIA], 'Not mine')).rejects.toThrow(
      V2DomainError
    );
    await expect(createCrew(ME, [ME], 'Just me')).rejects.toThrow(
      'at least two people'
    );
  });

  it('rejects members without accounts', async () => {
    const stubs = mockDb();
    stubs.users.countDocuments.mockResolvedValue(2);
    await expect(
      createCrew(ME, [ME, MARCO, MIA], 'Ghost crew')
    ).rejects.toThrow('does not have an account');
  });
});

describe('getCrewForMember', () => {
  it('gates on membership in the query itself', async () => {
    const stubs = mockDb();
    stubs.crews.findOne.mockResolvedValue(null);
    await expect(getCrewForMember(CREW_ID, ME)).rejects.toMatchObject({
      status: 404,
    });
    expect(stubs.crews.findOne).toHaveBeenCalledWith({
      _id: CREW_ID,
      memberIds: ME,
    });
  });
});

describe('getCrewView', () => {
  it('builds the shared weight board from crew history, lightest first', async () => {
    const sushi = new ObjectId('1'.repeat(24));
    const taco = new ObjectId('2'.repeat(24));
    const now = new Date('2026-07-02T12:00:00Z');
    const stubs = mockDb();
    stubs.crews.findOne.mockResolvedValue(crewDoc());
    stubs.forks.find.mockReturnValue(
      findCursor([
        {
          code: 'crewfork1',
          createdAt: now,
          options: [
            { placeId: sushi, name: 'Sushi Yama' },
            { placeId: taco, name: 'Taco Bravo' },
          ],
          result: { placeId: sushi, decidedAt: now, reasoning: '' },
        },
      ])
    );
    (getSelectionHistory as jest.Mock).mockResolvedValue([
      // Picked 2 days ago → heavily penalized; 40 days ago → fully back.
      {
        optionId: sushi.toString(),
        decidedAt: new Date('2026-06-30T12:00:00Z'),
      },
      {
        optionId: taco.toString(),
        decidedAt: new Date('2026-05-23T12:00:00Z'),
      },
    ]);

    const view = await getCrewView(CREW_ID, ME, now);

    expect(view.recentForks[0].winnerName).toBe('Sushi Yama');
    expect(view.weights.map((w) => w.name)).toEqual([
      'Sushi Yama',
      'Taco Bravo',
    ]);
    expect(view.weights[0].weight).toBeLessThan(0.2);
    expect(view.weights[1].weight).toBe(1);
  });
});

describe('reforkCrew', () => {
  const organizer = { userId: ME, displayName: 'Olivia' };

  it('needs at least one prior crew fork', async () => {
    const stubs = mockDb();
    stubs.crews.findOne.mockResolvedValue(crewDoc());
    stubs.forks.findOne.mockResolvedValue(null);
    await expect(reforkCrew(CREW_ID, organizer)).rejects.toThrow(
      'no forks to run back'
    );
  });

  it('re-runs the last ballot under the crew id', async () => {
    const stubs = mockDb();
    stubs.crews.findOne.mockResolvedValue(crewDoc());
    const options = [
      { placeId: new ObjectId(), googlePlaceId: 'dev-a', name: 'A' },
      { placeId: new ObjectId(), googlePlaceId: 'dev-b', name: 'B' },
    ];
    stubs.forks.findOne.mockResolvedValue({
      source: { kind: 'ad-hoc' },
      mode: 'vote',
      quorum: 3,
      options,
    });
    (createFork as jest.Mock).mockResolvedValue({ code: 'newfork' });

    await reforkCrew(CREW_ID, organizer, {
      mode: 'spin',
      now: new Date('2026-07-02T12:00:00Z'),
    });

    expect(createFork).toHaveBeenCalledWith(
      expect.objectContaining({
        crewId: CREW_ID,
        mode: 'spin', // caller override beats the copied mode
        options,
        closesAt: new Date('2026-07-02T12:30:00Z'),
      })
    );
  });
});
