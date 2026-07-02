import { ObjectId } from 'mongodb';
import {
  calculateRestaurantWeight,
  createGroupDecision,
  performRandomSelection,
  performGroupRandomSelection,
  getDecisionStatistics,
  submitGroupVote,
  calculateTieredConsensus,
  closeGroupDecision,
  completeTieredGroupDecision,
  getGroupDecision,
  getAllGroupDecisions,
  getActiveGroupDecisions,
} from '../decisions';
import { connectToDatabase } from '../db';
import { Decision, Restaurant } from '@/types/database';

// Mock the database connection
jest.mock('../db', () => ({
  connectToDatabase: jest.fn(),
}));

// 24-char hex strings: the mongodb mock's ObjectId returns the passed id
// from toString(), giving us deterministic, unique ids.
const HEX_A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const HEX_B = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const HEX_C = 'cccccccccccccccccccccccc';
const HEX_D = 'dddddddddddddddddddddddd';
const HEX_GROUP = '999999999999999999999999';
const HEX_COLLECTION = '888888888888888888888888';

function makeRestaurant(idHex: string, name: string): Restaurant {
  return {
    _id: new ObjectId(idHex),
    googlePlaceId: `place-${idHex}`,
    name,
    address: '123 Test St',
    coordinates: { lat: 40.7128, lng: -74.006 },
    cuisine: 'Test',
    rating: 4.0,
    priceRange: '$$',
    timeToPickUp: 20,
    photos: [],
    phoneNumber: '555-0000',
    website: 'https://example.com',
    hours: {},
    cachedAt: new Date(),
    lastUpdated: new Date(),
  } as Restaurant;
}

function makeCompletedDecision(
  restaurantIdHex: string,
  selectedAt: Date,
  overrides: Partial<Decision> = {}
): Decision {
  return {
    _id: new ObjectId(),
    type: 'personal',
    collectionId: new ObjectId(HEX_COLLECTION),
    participants: ['user_1'],
    method: 'random',
    status: 'completed',
    deadline: new Date(),
    visitDate: new Date(),
    result: {
      restaurantId: new ObjectId(restaurantIdHex),
      selectedAt,
      reasoning: 'Test',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Decision;
}

describe('Decision System edge cases', () => {
  let mockDb: {
    collection: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      collection: jest.fn(),
    };

    (connectToDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('calculateRestaurantWeight edges', () => {
    it('should apply the exact 10% floor for a same-day selection', () => {
      const history = [makeCompletedDecision(HEX_A, new Date())];
      const weight = calculateRestaurantWeight(new ObjectId(HEX_A), history);
      expect(weight).toBe(0.1);
    });

    it('should ignore decisions that have no result', () => {
      const noResultDecision = makeCompletedDecision(HEX_A, new Date());
      delete (noResultDecision as Partial<Decision>).result;

      const weight = calculateRestaurantWeight(new ObjectId(HEX_A), [
        noResultDecision,
      ]);
      expect(weight).toBe(1.0);
    });

    it('should ignore selections of other restaurants', () => {
      const history = [makeCompletedDecision(HEX_B, new Date())];
      const weight = calculateRestaurantWeight(new ObjectId(HEX_A), history);
      expect(weight).toBe(1.0);
    });

    it('should scale the floor and decay by the provided base weight', () => {
      const sameDayHistory = [makeCompletedDecision(HEX_A, new Date())];
      expect(
        calculateRestaurantWeight(new ObjectId(HEX_A), sameDayHistory, 2.0)
      ).toBe(0.2);
      expect(calculateRestaurantWeight(new ObjectId(HEX_A), [], 2.0)).toBe(2.0);
    });

    it('should scale weight linearly with days since selection', () => {
      const fifteenDaysAgo = new Date(
        Date.now() - 15 * 24 * 60 * 60 * 1000 - 60 * 1000
      );
      const history = [makeCompletedDecision(HEX_A, fifteenDaysAgo)];
      const weight = calculateRestaurantWeight(new ObjectId(HEX_A), history);
      // 0.1 + 0.9 * (15 / 30) = 0.55
      expect(weight).toBeCloseTo(0.55, 5);
    });
  });

  describe('createGroupDecision', () => {
    it('should create a group decision with createdBy and a custom deadline', async () => {
      const insertedId = new ObjectId();
      const mockInsertOne = jest.fn().mockResolvedValue({ insertedId });
      mockDb.collection.mockReturnValue({ insertOne: mockInsertOne });

      const visitDate = new Date();
      const result = await createGroupDecision(
        HEX_COLLECTION,
        HEX_GROUP,
        ['user_1', 'user_2'],
        'tiered',
        visitDate,
        48,
        HEX_A
      );

      expect(mockDb.collection).toHaveBeenCalledWith('decisions');
      const inserted = mockInsertOne.mock.calls[0][0];
      expect(inserted).toMatchObject({
        type: 'group',
        participants: ['user_1', 'user_2'],
        method: 'tiered',
        status: 'active',
        visitDate,
      });
      expect(inserted.groupId.toString()).toBe(HEX_GROUP);
      expect(inserted.createdBy.toString()).toBe(HEX_A);
      // Deadline must be exactly deadlineHours after createdAt
      expect(inserted.deadline.getTime() - inserted.createdAt.getTime()).toBe(
        48 * 60 * 60 * 1000
      );
      expect(result._id).toBe(insertedId);
    });

    it('should leave createdBy undefined when not provided and default to 24h deadline', async () => {
      const mockInsertOne = jest
        .fn()
        .mockResolvedValue({ insertedId: new ObjectId() });
      mockDb.collection.mockReturnValue({ insertOne: mockInsertOne });

      await createGroupDecision(
        HEX_COLLECTION,
        HEX_GROUP,
        ['user_1'],
        'random',
        new Date()
      );

      const inserted = mockInsertOne.mock.calls[0][0];
      expect(inserted.createdBy).toBeUndefined();
      expect(inserted.method).toBe('random');
      expect(inserted.deadline.getTime() - inserted.createdAt.getTime()).toBe(
        24 * 60 * 60 * 1000
      );
    });
  });

  describe('performRandomSelection edges', () => {
    function setupSelectionMocks(
      restaurants: Restaurant[],
      decisionHistory: Decision[],
      restaurantIds?: unknown[]
    ) {
      const mockCollectionsCollection = {
        findOne: jest.fn().mockResolvedValue({
          _id: new ObjectId(HEX_COLLECTION),
          restaurantIds:
            restaurantIds ?? restaurants.map((r) => r.googlePlaceId),
        }),
      };
      const mockRestaurantsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(restaurants),
        }),
      };
      const mockDecisionsCollection = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(decisionHistory),
        insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      };

      mockDb.collection.mockImplementation((name: string) => {
        if (name === 'collections') return mockCollectionsCollection;
        if (name === 'restaurants') return mockRestaurantsCollection;
        if (name === 'decisions') return mockDecisionsCollection;
        return {};
      });

      return {
        mockCollectionsCollection,
        mockRestaurantsCollection,
        mockDecisionsCollection,
      };
    }

    it('should deterministically select the first restaurant when Math.random is 0', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0);
      const restaurants = [
        makeRestaurant(HEX_A, 'Alpha'),
        makeRestaurant(HEX_B, 'Beta'),
      ];
      // Restaurant A was selected today -> penalized to 0.1, B keeps 1.0
      const history = [makeCompletedDecision(HEX_A, new Date())];
      const { mockDecisionsCollection } = setupSelectionMocks(
        restaurants,
        history
      );

      const result = await performRandomSelection(
        HEX_COLLECTION,
        'user_1',
        new Date()
      );

      expect(result.restaurantId.toString()).toBe(HEX_A);
      expect(result.weights[HEX_A]).toBe(0.1);
      expect(result.weights[HEX_B]).toBe(1.0);
      expect(result.reasoning).toContain('Weight: 0.10');
      expect(result.reasoning).toContain('Previous selections: 1');

      const inserted = mockDecisionsCollection.insertOne.mock.calls[0][0];
      expect(inserted.status).toBe('completed');
      expect(inserted.method).toBe('random');
      expect(inserted.result.restaurantId.toString()).toBe(HEX_A);
    });

    it('should fall back to the last restaurant when floating-point drift exhausts the loop', async () => {
      // 3 same-day weights of 0.1 sum to 0.30000000000000004; with
      // Math.random() === 1 the loop never reaches <= 0 and the fallback fires.
      jest.spyOn(Math, 'random').mockReturnValue(1);
      const restaurants = [
        makeRestaurant(HEX_A, 'Alpha'),
        makeRestaurant(HEX_B, 'Beta'),
        makeRestaurant(HEX_C, 'Gamma'),
      ];
      const history = [
        makeCompletedDecision(HEX_A, new Date()),
        makeCompletedDecision(HEX_B, new Date()),
        makeCompletedDecision(HEX_C, new Date()),
      ];
      setupSelectionMocks(restaurants, history);

      const result = await performRandomSelection(
        HEX_COLLECTION,
        'user_1',
        new Date()
      );

      expect(result.restaurantId.toString()).toBe(HEX_C);
      expect(result.weights[HEX_C]).toBe(0.1);
    });

    it('should resolve mixed restaurantIds formats and drop unrecognized entries', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0);
      const restaurants = [makeRestaurant(HEX_A, 'Alpha')];
      const embeddedId = new ObjectId(HEX_B);
      const { mockRestaurantsCollection } = setupSelectionMocks(
        restaurants,
        [],
        [
          'google-place-string', // plain string
          { _id: embeddedId, googlePlaceId: 'embedded' }, // { _id } object
          { googlePlaceId: 'place-only' }, // { googlePlaceId } object
          { unexpected: 'shape' }, // unrecognized -> filtered out
        ]
      );

      const result = await performRandomSelection(
        HEX_COLLECTION,
        'user_1',
        new Date()
      );

      expect(result.restaurantId.toString()).toBe(HEX_A);
      const query = mockRestaurantsCollection.find.mock.calls[0][0];
      expect(query.$or[1].googlePlaceId.$in).toEqual([
        'google-place-string',
        'place-only',
      ]);
    });

    it('should throw when every restaurantIds entry is unrecognized', async () => {
      setupSelectionMocks([], [], [{ unexpected: 'shape' }]);

      await expect(
        performRandomSelection(HEX_COLLECTION, 'user_1', new Date())
      ).rejects.toThrow('No restaurants in collection');
    });

    it('should treat a collection that disappears mid-selection as empty', async () => {
      // First findOne (existence check) succeeds, second (inside
      // getRestaurantsByCollection) returns null.
      const mockCollectionsCollection = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce({
            _id: new ObjectId(HEX_COLLECTION),
            restaurantIds: ['place-1'],
          })
          .mockResolvedValueOnce(null),
      };
      mockDb.collection.mockImplementation((name: string) => {
        if (name === 'collections') return mockCollectionsCollection;
        return {};
      });

      await expect(
        performRandomSelection(HEX_COLLECTION, 'user_1', new Date())
      ).rejects.toThrow('No restaurants in collection');
    });
  });

  describe('getDecisionStatistics edges', () => {
    it('should throw when the collection is not found', async () => {
      mockDb.collection.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });

      await expect(getDecisionStatistics(HEX_COLLECTION)).rejects.toThrow(
        'Collection not found'
      );
    });

    it('should use group decision history for group collections and report never-selected restaurants', async () => {
      const restaurants = [
        makeRestaurant(HEX_A, 'Picked'),
        makeRestaurant(HEX_B, 'Never Picked'),
      ];
      const groupDecisions = [
        makeCompletedDecision(HEX_A, new Date(), {
          type: 'group',
          groupId: new ObjectId(HEX_GROUP),
        }),
        // Decision without a result must be ignored by the stats filter
        makeCompletedDecision(HEX_C, new Date(), {
          type: 'group',
          groupId: new ObjectId(HEX_GROUP),
          result: undefined,
        }),
      ];

      const mockCollectionsCollection = {
        findOne: jest.fn().mockResolvedValue({
          _id: new ObjectId(HEX_COLLECTION),
          type: 'group',
          ownerId: new ObjectId(HEX_GROUP),
          restaurantIds: restaurants.map((r) => r.googlePlaceId),
        }),
      };
      const mockRestaurantsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(restaurants),
        }),
      };
      const mockDecisionsCollection = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(groupDecisions),
      };
      mockDb.collection.mockImplementation((name: string) => {
        if (name === 'collections') return mockCollectionsCollection;
        if (name === 'restaurants') return mockRestaurantsCollection;
        if (name === 'decisions') return mockDecisionsCollection;
        return {};
      });

      const stats = await getDecisionStatistics(HEX_COLLECTION);

      // Group branch queries the group decision history, not the personal one
      const findQuery = mockDecisionsCollection.find.mock.calls[0][0];
      expect(findQuery.type).toBe('group');
      expect(findQuery.groupId.toString()).toBe(HEX_GROUP);

      expect(stats.totalDecisions).toBe(2);
      expect(stats.restaurantStats[0]).toMatchObject({
        name: 'Picked',
        selectionCount: 1,
        currentWeight: 0.1,
      });
      expect(stats.restaurantStats[1]).toMatchObject({
        name: 'Never Picked',
        selectionCount: 0,
        lastSelected: undefined,
        currentWeight: 1.0,
      });
    });
  });

  describe('submitGroupVote', () => {
    const decisionId = HEX_D;

    function setupVoteMocks(decision: Record<string, unknown> | null) {
      const mockDecisionsCollection = {
        findOne: jest.fn().mockResolvedValue(decision),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      };
      mockDb.collection.mockReturnValue(mockDecisionsCollection);
      return mockDecisionsCollection;
    }

    function activeGroupDecision(overrides: Record<string, unknown> = {}) {
      return {
        _id: new ObjectId(decisionId),
        type: 'group',
        participants: ['user_1', 'user_2'],
        status: 'active',
        deadline: new Date(Date.now() + 60 * 60 * 1000),
        votes: [],
        ...overrides,
      };
    }

    it('should throw when the decision does not exist', async () => {
      setupVoteMocks(null);
      await expect(
        submitGroupVote(decisionId, 'user_1', [HEX_A])
      ).rejects.toThrow('Decision not found');
    });

    it('should reject personal decisions', async () => {
      setupVoteMocks(activeGroupDecision({ type: 'personal' }));
      await expect(
        submitGroupVote(decisionId, 'user_1', [HEX_A])
      ).rejects.toThrow('This is not a group decision');
    });

    it('should reject votes from non-participants', async () => {
      setupVoteMocks(activeGroupDecision());
      await expect(
        submitGroupVote(decisionId, 'user_3', [HEX_A])
      ).rejects.toThrow('User is not a participant in this decision');
    });

    it('should reject votes on non-active decisions', async () => {
      setupVoteMocks(activeGroupDecision({ status: 'completed' }));
      await expect(
        submitGroupVote(decisionId, 'user_1', [HEX_A])
      ).rejects.toThrow('Decision is no longer active');
    });

    it('should reject votes after the deadline', async () => {
      setupVoteMocks(
        activeGroupDecision({ deadline: new Date(Date.now() - 1000) })
      );
      await expect(
        submitGroupVote(decisionId, 'user_1', [HEX_A])
      ).rejects.toThrow('Decision deadline has passed');
    });

    it('should push a new vote when the user has not voted yet', async () => {
      const mockDecisionsCollection = setupVoteMocks(activeGroupDecision());

      const result = await submitGroupVote(decisionId, 'user_1', [
        HEX_A,
        HEX_B,
      ]);

      expect(result).toEqual({
        success: true,
        message: 'Vote submitted successfully',
      });
      const [filter, update] = mockDecisionsCollection.updateOne.mock
        .calls[0] as [
        Record<string, unknown>,
        {
          $push: {
            votes: { userId: string; rankings: ObjectId[] };
          };
        },
      ];
      expect(filter._id?.toString()).toBe(decisionId);
      expect(update.$push.votes.userId).toBe('user_1');
      expect(
        update.$push.votes.rankings.map((r: ObjectId) => r.toString())
      ).toEqual([HEX_A, HEX_B]);
    });

    it('should update the existing vote when the user already voted', async () => {
      const mockDecisionsCollection = setupVoteMocks(
        activeGroupDecision({
          votes: [
            {
              userId: 'user_1',
              rankings: [new ObjectId(HEX_B)],
              submittedAt: new Date(),
            },
          ],
        })
      );

      const result = await submitGroupVote(decisionId, 'user_1', [HEX_A]);

      expect(result.success).toBe(true);
      const [filter, update] = mockDecisionsCollection.updateOne.mock
        .calls[0] as [
        Record<string, unknown>,
        { $set: Record<string, unknown> },
      ];
      expect(filter['votes.userId']).toBe('user_1');
      expect(
        (update.$set['votes.$.rankings'] as ObjectId[]).map((r) => r.toString())
      ).toEqual([HEX_A]);
    });
  });

  describe('calculateTieredConsensus', () => {
    const restaurants = [
      makeRestaurant(HEX_A, 'Alpha'),
      makeRestaurant(HEX_B, 'Beta'),
      makeRestaurant(HEX_C, 'Gamma'),
    ];

    function vote(userId: string, rankingHexes: string[]) {
      return {
        userId,
        rankings: rankingHexes.map((h) => new ObjectId(h)),
        submittedAt: new Date(),
      };
    }

    it('should return no winner when there are no votes', () => {
      const result = calculateTieredConsensus([], restaurants);
      expect(result).toEqual({
        winner: null,
        reasoning: 'No votes submitted',
        voteBreakdown: {},
      });
    });

    it('should score rankings 3/2/1 and pick a clear winner', () => {
      const result = calculateTieredConsensus(
        [
          vote('user_1', [HEX_A, HEX_B, HEX_C]),
          vote('user_2', [HEX_A, HEX_C, HEX_B]),
        ],
        restaurants
      );

      expect(result.winner?.name).toBe('Alpha');
      expect(result.reasoning).toBe(
        'Clear winner with 6 points (2 votes total)'
      );
      expect(result.voteBreakdown[HEX_A]).toEqual({
        first: 2,
        second: 0,
        third: 0,
        total: 6,
      });
      expect(result.voteBreakdown[HEX_B]).toEqual({
        first: 0,
        second: 1,
        third: 1,
        total: 3,
      });
      expect(result.voteBreakdown[HEX_C]).toEqual({
        first: 0,
        second: 1,
        third: 1,
        total: 3,
      });
    });

    it('should break ties randomly using Math.random', () => {
      // user_1: A=3, B=2; user_2: B=3, A=2 -> both 5 points
      const tiedVotes = [
        vote('user_1', [HEX_A, HEX_B]),
        vote('user_2', [HEX_B, HEX_A]),
      ];
      const twoRestaurants = restaurants.slice(0, 2);

      jest.spyOn(Math, 'random').mockReturnValue(0);
      const first = calculateTieredConsensus(tiedVotes, twoRestaurants);
      expect(first.winner?.name).toBe('Alpha');
      expect(first.reasoning).toContain(
        'Tie between 2 restaurants with 5 points each'
      );
      expect(first.reasoning).toContain('Selected Alpha randomly');

      (Math.random as jest.Mock).mockReturnValue(0.99);
      const second = calculateTieredConsensus(tiedVotes, twoRestaurants);
      expect(second.winner?.name).toBe('Beta');
    });

    it('should ignore rankings beyond third place in both score and breakdown', () => {
      const fourRestaurants = [...restaurants, makeRestaurant(HEX_D, 'Delta')];
      const result = calculateTieredConsensus(
        [
          vote('user_1', [HEX_A, HEX_B, HEX_C, HEX_D]),
          vote('user_2', [HEX_A, HEX_B, HEX_C, HEX_D]),
        ],
        fourRestaurants
      );

      expect(result.winner?.name).toBe('Alpha');
      // Only the top three ranks score (3/2/1); a 4th-ranked restaurant earns
      // nothing, so the score can never diverge from the visible breakdown.
      expect(result.voteBreakdown[HEX_D]).toEqual({
        first: 0,
        second: 0,
        third: 0,
        total: 0,
      });
      expect(result.reasoning).toBe(
        'Clear winner with 6 points (2 votes total)'
      );
      expect(result.voteBreakdown[HEX_C].total).toBe(2);
    });

    it('should skip ranked restaurants that have left the collection instead of crashing', () => {
      // user voted for A, B, C but B was removed from the collection before
      // the decision completed — previously a TypeError/NaN.
      const remaining = [restaurants[0], restaurants[2]];
      const result = calculateTieredConsensus(
        [vote('user_1', [HEX_A, HEX_B, HEX_C])],
        remaining
      );

      expect(result.winner?.name).toBe('Alpha');
      expect(result.voteBreakdown[HEX_B]).toBeUndefined();
      expect(result.voteBreakdown[HEX_A]).toEqual({
        first: 1,
        second: 0,
        third: 0,
        total: 3,
      });
      // C keeps its third-place slot (ranks are positional, not re-packed)
      expect(result.voteBreakdown[HEX_C]).toEqual({
        first: 0,
        second: 0,
        third: 1,
        total: 1,
      });
    });

    it('should return no winner when every restaurant has left the collection', () => {
      const result = calculateTieredConsensus(
        [vote('user_1', [HEX_A, HEX_B])],
        []
      );
      expect(result.winner).toBeNull();
      expect(result.reasoning).toBe('No restaurants available to choose from');
    });
  });

  describe('closeGroupDecision', () => {
    function setupCloseMocks(
      decision: Record<string, unknown> | null,
      group: Record<string, unknown> | null
    ) {
      const mockDecisionsCollection = {
        findOne: jest.fn().mockResolvedValue(decision),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      };
      const mockGroupsCollection = {
        findOne: jest.fn().mockResolvedValue(group),
      };
      mockDb.collection.mockImplementation((name: string) => {
        if (name === 'decisions') return mockDecisionsCollection;
        if (name === 'groups') return mockGroupsCollection;
        return {};
      });
      return { mockDecisionsCollection, mockGroupsCollection };
    }

    const activeDecision = () => ({
      _id: new ObjectId(HEX_D),
      type: 'group',
      status: 'active',
      groupId: new ObjectId(HEX_GROUP),
    });

    it('should throw when the decision does not exist', async () => {
      setupCloseMocks(null, null);
      await expect(closeGroupDecision(HEX_D, 'user_1')).rejects.toThrow(
        'Decision not found'
      );
    });

    it('should reject non-group decisions', async () => {
      setupCloseMocks({ ...activeDecision(), type: 'personal' }, null);
      await expect(closeGroupDecision(HEX_D, 'user_1')).rejects.toThrow(
        'This is not a group decision'
      );
    });

    it('should reject decisions that are not active', async () => {
      setupCloseMocks({ ...activeDecision(), status: 'completed' }, null);
      await expect(closeGroupDecision(HEX_D, 'user_1')).rejects.toThrow(
        'Decision is not active'
      );
    });

    it('should throw when the group does not exist', async () => {
      setupCloseMocks(activeDecision(), null);
      await expect(closeGroupDecision(HEX_D, 'user_1')).rejects.toThrow(
        'Group not found'
      );
    });

    it('should reject non-admin users', async () => {
      setupCloseMocks(activeDecision(), {
        adminIds: [new ObjectId(HEX_A)],
      });
      await expect(closeGroupDecision(HEX_D, 'user_1')).rejects.toThrow(
        'Only group admins can close decisions'
      );
    });

    it('should close the decision when the user is a group admin', async () => {
      const { mockDecisionsCollection } = setupCloseMocks(activeDecision(), {
        adminIds: [new ObjectId(HEX_A), new ObjectId('user_1')],
      });

      const result = await closeGroupDecision(HEX_D, 'user_1');

      expect(result).toEqual({
        success: true,
        message: 'Decision closed successfully',
      });
      const [, update] = mockDecisionsCollection.updateOne.mock.calls[0] as [
        Record<string, unknown>,
        { $set: { status: string } },
      ];
      expect(update.$set.status).toBe('closed');
    });
  });

  describe('completeTieredGroupDecision', () => {
    function tieredDecision(overrides: Record<string, unknown> = {}) {
      return {
        _id: new ObjectId(HEX_D),
        type: 'group',
        method: 'tiered',
        collectionId: new ObjectId(HEX_COLLECTION),
        votes: [
          {
            userId: 'user_1',
            rankings: [new ObjectId(HEX_A), new ObjectId(HEX_B)],
            submittedAt: new Date(),
          },
        ],
        ...overrides,
      };
    }

    function setupCompleteMocks(
      decision: Record<string, unknown> | null,
      restaurants: Restaurant[]
    ) {
      const mockDecisionsCollection = {
        findOne: jest.fn().mockResolvedValue(decision),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      };
      const mockCollectionsCollection = {
        findOne: jest.fn().mockResolvedValue({
          _id: new ObjectId(HEX_COLLECTION),
          restaurantIds: restaurants.map((r) => r.googlePlaceId),
        }),
      };
      const mockRestaurantsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(restaurants),
        }),
      };
      mockDb.collection.mockImplementation((name: string) => {
        if (name === 'decisions') return mockDecisionsCollection;
        if (name === 'collections') return mockCollectionsCollection;
        if (name === 'restaurants') return mockRestaurantsCollection;
        return {};
      });
      return { mockDecisionsCollection };
    }

    it('should throw when the decision does not exist', async () => {
      setupCompleteMocks(null, []);
      await expect(completeTieredGroupDecision(HEX_D)).rejects.toThrow(
        'Decision not found'
      );
    });

    it('should reject non-group decisions', async () => {
      setupCompleteMocks(tieredDecision({ type: 'personal' }), []);
      await expect(completeTieredGroupDecision(HEX_D)).rejects.toThrow(
        'This is not a group decision'
      );
    });

    it('should reject non-tiered decisions', async () => {
      setupCompleteMocks(tieredDecision({ method: 'random' }), []);
      await expect(completeTieredGroupDecision(HEX_D)).rejects.toThrow(
        'This is not a tiered decision'
      );
    });

    it('should reject decisions with no votes (missing or empty)', async () => {
      setupCompleteMocks(tieredDecision({ votes: undefined }), []);
      await expect(completeTieredGroupDecision(HEX_D)).rejects.toThrow(
        'No votes submitted'
      );

      setupCompleteMocks(tieredDecision({ votes: [] }), []);
      await expect(completeTieredGroupDecision(HEX_D)).rejects.toThrow(
        'No votes submitted'
      );
    });

    it('should reject decisions whose collection has no restaurants', async () => {
      setupCompleteMocks(tieredDecision(), []);
      await expect(completeTieredGroupDecision(HEX_D)).rejects.toThrow(
        'No restaurants in collection'
      );
    });

    it('should complete the decision with the consensus winner and breakdown weights', async () => {
      const restaurants = [
        makeRestaurant(HEX_A, 'Alpha'),
        makeRestaurant(HEX_B, 'Beta'),
      ];
      const { mockDecisionsCollection } = setupCompleteMocks(
        tieredDecision(),
        restaurants
      );

      const result = await completeTieredGroupDecision(HEX_D);

      expect(result.restaurantId.toString()).toBe(HEX_A);
      expect(result.reasoning).toBe(
        'Clear winner with 3 points (1 votes total)'
      );
      expect(result.weights).toEqual({ [HEX_A]: 3, [HEX_B]: 2 });

      const [, update] = mockDecisionsCollection.updateOne.mock.calls[0] as [
        Record<string, unknown>,
        {
          $set: { status: string; result: { restaurantId: ObjectId } };
        },
      ];
      expect(update.$set.status).toBe('completed');
      expect(update.$set.result.restaurantId.toString()).toBe(HEX_A);
    });
  });

  describe('performGroupRandomSelection', () => {
    function setupGroupSelectionMocks(
      restaurants: Restaurant[],
      groupHistory: Decision[]
    ) {
      const mockCollectionsCollection = {
        findOne: jest.fn().mockResolvedValue({
          _id: new ObjectId(HEX_COLLECTION),
          restaurantIds: restaurants.map((r) => r.googlePlaceId),
        }),
      };
      const mockRestaurantsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(restaurants),
        }),
      };
      const mockDecisionsCollection = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(groupHistory),
        insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      };
      mockDb.collection.mockImplementation((name: string) => {
        if (name === 'collections') return mockCollectionsCollection;
        if (name === 'restaurants') return mockRestaurantsCollection;
        if (name === 'decisions') return mockDecisionsCollection;
        return {};
      });
      return { mockDecisionsCollection };
    }

    it('should throw when the collection is not found', async () => {
      mockDb.collection.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });

      await expect(
        performGroupRandomSelection(
          HEX_COLLECTION,
          HEX_GROUP,
          ['user_1'],
          new Date()
        )
      ).rejects.toThrow('Collection not found');
    });

    it('should throw when there are no restaurants', async () => {
      setupGroupSelectionMocks([], []);

      await expect(
        performGroupRandomSelection(
          HEX_COLLECTION,
          HEX_GROUP,
          ['user_1'],
          new Date()
        )
      ).rejects.toThrow('No restaurants in collection');
    });

    it('should fall back to the last restaurant when floating-point drift exhausts the loop', async () => {
      // Same floating-point edge as the personal selection: three 0.1
      // weights sum to slightly more than 0.3, so Math.random() === 1
      // leaves randomValue > 0 after the loop.
      jest.spyOn(Math, 'random').mockReturnValue(1);
      const restaurants = [
        makeRestaurant(HEX_A, 'Alpha'),
        makeRestaurant(HEX_B, 'Beta'),
        makeRestaurant(HEX_C, 'Gamma'),
      ];
      const groupHistory = [
        makeCompletedDecision(HEX_A, new Date(), { type: 'group' }),
        makeCompletedDecision(HEX_B, new Date(), { type: 'group' }),
        makeCompletedDecision(HEX_C, new Date(), { type: 'group' }),
      ];
      setupGroupSelectionMocks(restaurants, groupHistory);

      const result = await performGroupRandomSelection(
        HEX_COLLECTION,
        HEX_GROUP,
        ['user_1'],
        new Date()
      );

      expect(result.restaurantId.toString()).toBe(HEX_C);
      expect(result.weights[HEX_C]).toBe(0.1);
    });

    it('should weight selection by shared group history and persist a completed decision', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0);
      const restaurants = [
        makeRestaurant(HEX_A, 'Alpha'),
        makeRestaurant(HEX_B, 'Beta'),
      ];
      // Restaurant A was picked today in ANOTHER collection of this group;
      // the shared group history must still penalize it here.
      const groupHistory = [
        makeCompletedDecision(HEX_A, new Date(), {
          type: 'group',
          groupId: new ObjectId(HEX_GROUP),
        }),
      ];
      const { mockDecisionsCollection } = setupGroupSelectionMocks(
        restaurants,
        groupHistory
      );

      const result = await performGroupRandomSelection(
        HEX_COLLECTION,
        HEX_GROUP,
        ['user_1', 'user_2'],
        new Date(),
        HEX_A
      );

      expect(result.weights[HEX_A]).toBe(0.1);
      expect(result.weights[HEX_B]).toBe(1.0);
      expect(result.reasoning).toContain('weighted random algorithm for group');

      // Group history is queried by groupId
      const findQuery = mockDecisionsCollection.find.mock.calls[0][0];
      expect(findQuery.groupId.toString()).toBe(HEX_GROUP);
      expect(findQuery.type).toBe('group');

      // A group decision document is created, then completed with the result
      const inserted = mockDecisionsCollection.insertOne.mock.calls[0][0];
      expect(inserted.type).toBe('group');
      expect(inserted.method).toBe('random');
      expect(inserted.participants).toEqual(['user_1', 'user_2']);
      expect(inserted.createdBy.toString()).toBe(HEX_A);

      const [, update] = mockDecisionsCollection.updateOne.mock.calls[0] as [
        Record<string, unknown>,
        { $set: { status: string; result: { restaurantId: ObjectId } } },
      ];
      expect(update.$set.status).toBe('completed');
      expect(update.$set.result.restaurantId.toString()).toBe(
        result.restaurantId.toString()
      );
    });
  });

  describe('group decision queries', () => {
    it('getGroupDecision should return the decision when found', async () => {
      const decision = { _id: new ObjectId(HEX_D), type: 'group' };
      mockDb.collection.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(decision),
      });

      const result = await getGroupDecision(HEX_D);
      expect(result).toEqual(decision);
    });

    it('getGroupDecision should return null when not found', async () => {
      mockDb.collection.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });

      const result = await getGroupDecision(HEX_D);
      expect(result).toBeNull();
    });

    it('getAllGroupDecisions should query all statuses for the group', async () => {
      const decisions = [
        { _id: new ObjectId(), status: 'active' },
        { _id: new ObjectId(), status: 'completed' },
      ];
      const mockDecisionsCollection = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(decisions),
      };
      mockDb.collection.mockReturnValue(mockDecisionsCollection);

      const result = await getAllGroupDecisions(HEX_GROUP);

      const query = mockDecisionsCollection.find.mock.calls[0][0];
      expect(query.groupId.toString()).toBe(HEX_GROUP);
      expect(query.type).toBe('group');
      expect(query.status).toBeUndefined();
      expect(result).toHaveLength(2);
    });

    it('getActiveGroupDecisions should only query active decisions', async () => {
      const mockDecisionsCollection = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([]),
      };
      mockDb.collection.mockReturnValue(mockDecisionsCollection);

      const result = await getActiveGroupDecisions(HEX_GROUP);

      const query = mockDecisionsCollection.find.mock.calls[0][0];
      expect(query.status).toBe('active');
      expect(query.type).toBe('group');
      expect(result).toEqual([]);
    });
  });
});
