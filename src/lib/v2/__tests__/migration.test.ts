import { ObjectId } from 'mongodb';
import {
  buildPlaceIndex,
  collectionToList,
  decisionToFork,
  groupToCrew,
  isSkip,
  priceRangeToLevel,
  resolveRestaurantRef,
  restaurantToPlace,
  type V1Collection,
  type V1Decision,
  type V1Group,
  type V1Restaurant,
  type V1UserLean,
} from '../migration';
import type { PlaceDoc } from '../schema';

const NOW = new Date('2026-07-03T12:00:00Z');

// The mongodb Jest mock makes argless ObjectIds stringify identically —
// mint unique hex ids the way the other v2 suites do.
let idCounter = 0;
function oid(): ObjectId {
  return new ObjectId((++idCounter).toString(16).padStart(24, '0'));
}

function makeRestaurant(overrides: Partial<V1Restaurant> = {}): V1Restaurant {
  return {
    _id: oid(),
    googlePlaceId: `gp-${Math.random().toString(36).slice(2)}`,
    name: 'Sushi Yama',
    address: '1 Main St',
    coordinates: { lat: 40.76, lng: -73.92 },
    cuisine: 'Japanese',
    rating: 4.4,
    priceRange: '$$',
    cachedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function makeUser(overrides: Partial<V1UserLean> = {}): V1UserLean {
  return {
    _id: oid(),
    clerkId: `user_${Math.random().toString(36).slice(2)}`,
    name: 'Alex',
    ...overrides,
  };
}

function placeOf(restaurant: V1Restaurant): PlaceDoc {
  const mapped = restaurantToPlace(restaurant, NOW);
  if (isSkip(mapped)) throw new Error('fixture restaurant should map');
  return mapped;
}

describe('priceRangeToLevel', () => {
  it('maps every v1 tier and passes undefined through', () => {
    expect(priceRangeToLevel('$')).toBe(1);
    expect(priceRangeToLevel('$$')).toBe(2);
    expect(priceRangeToLevel('$$$')).toBe(3);
    expect(priceRangeToLevel('$$$$')).toBe(4);
    expect(priceRangeToLevel(undefined)).toBeUndefined();
  });
});

describe('restaurantToPlace', () => {
  it('reuses the v1 _id and converts coordinates to GeoJSON [lng, lat]', () => {
    const restaurant = makeRestaurant();
    const place = placeOf(restaurant);
    expect(place._id).toBe(restaurant._id);
    expect(place.googlePlaceId).toBe(restaurant.googlePlaceId);
    expect(place.location).toEqual({
      type: 'Point',
      coordinates: [-73.92, 40.76],
    });
    expect(place.categories).toEqual(['Japanese']);
    expect(place.priceLevel).toBe(2);
    expect(place.cachedAt).toEqual(new Date('2026-01-01T00:00:00Z'));
  });

  it('skips restaurants without googlePlaceId or usable coordinates', () => {
    expect(
      isSkip(restaurantToPlace(makeRestaurant({ googlePlaceId: '' }), NOW))
    ).toBe(true);
    expect(
      isSkip(
        restaurantToPlace(
          makeRestaurant({
            coordinates: { lat: NaN, lng: 0 },
          }),
          NOW
        )
      )
    ).toBe(true);
    expect(
      isSkip(
        restaurantToPlace(
          makeRestaurant({
            coordinates: undefined as unknown as V1Restaurant['coordinates'],
          }),
          NOW
        )
      )
    ).toBe(true);
  });

  it('drops v1 photo URLs (v2 renders no photos)', () => {
    const place = placeOf(
      makeRestaurant({ photos: ['https://example.com/p.jpg?key=SECRET'] })
    );
    expect(JSON.stringify(place)).not.toContain('SECRET');
    expect(place.photoRef).toBeUndefined();
  });
});

describe('resolveRestaurantRef (the three-shape union)', () => {
  const restaurant = makeRestaurant();
  const index = buildPlaceIndex([placeOf(restaurant)]);

  it('resolves a bare ObjectId', () => {
    expect(resolveRestaurantRef(restaurant._id, index)?._id).toBe(
      restaurant._id
    );
  });

  it('resolves an embedded {_id, googlePlaceId} doc', () => {
    expect(
      resolveRestaurantRef(
        { _id: restaurant._id, googlePlaceId: restaurant.googlePlaceId },
        index
      )?._id
    ).toBe(restaurant._id);
  });

  it('resolves a {googlePlaceId}-only doc', () => {
    expect(
      resolveRestaurantRef({ googlePlaceId: restaurant.googlePlaceId }, index)
        ?._id
    ).toBe(restaurant._id);
  });

  it('falls back to googlePlaceId when the embedded _id is stale', () => {
    expect(
      resolveRestaurantRef(
        { _id: oid(), googlePlaceId: restaurant.googlePlaceId },
        index
      )?._id
    ).toBe(restaurant._id);
  });

  it('returns null for unresolvable refs', () => {
    expect(resolveRestaurantRef(oid(), index)).toBeNull();
  });
});

describe('collectionToList', () => {
  const owner = makeUser();
  const restaurantA = makeRestaurant();
  const restaurantB = makeRestaurant();
  const index = buildPlaceIndex([placeOf(restaurantA), placeOf(restaurantB)]);
  const usersById = new Map([[owner._id.toString(), owner]]);

  it('maps a personal collection, deduping and dropping dead refs', () => {
    const collection: V1Collection = {
      _id: oid(),
      name: 'Date night',
      type: 'personal',
      ownerId: owner._id,
      restaurantIds: [
        restaurantA._id,
        restaurantA._id, // duplicate
        { googlePlaceId: restaurantB.googlePlaceId },
        oid(), // dead ref
      ],
    };
    const mapped = collectionToList(
      collection,
      { index, groupsById: new Map(), usersById },
      NOW
    );
    if (isSkip(mapped)) throw new Error('expected a list');
    expect(mapped.list._id).toBe(collection._id);
    expect(mapped.list.ownerId).toBe(owner._id);
    expect(mapped.list.placeIds).toEqual([restaurantA._id, restaurantB._id]);
    expect(mapped.droppedPlaceRefs).toBe(1);
  });

  it('assigns group collections to the first resolvable admin and keeps group context in the name', () => {
    const group: V1Group = {
      _id: oid(),
      name: 'Lunch crew',
      adminIds: [oid(), owner._id], // first admin no longer exists
      memberIds: [],
    };
    const collection: V1Collection = {
      _id: oid(),
      name: 'Favorites',
      type: 'group',
      ownerId: group._id,
      restaurantIds: [restaurantA._id],
    };
    const mapped = collectionToList(
      collection,
      {
        index,
        groupsById: new Map([[group._id.toString(), group]]),
        usersById,
      },
      NOW
    );
    if (isSkip(mapped)) throw new Error('expected a list');
    expect(mapped.list.ownerId).toBe(owner._id);
    expect(mapped.list.name).toBe('Favorites (Lunch crew)');
  });

  it('skips collections whose owner cannot be resolved', () => {
    const orphaned: V1Collection = {
      _id: oid(),
      name: 'Orphaned',
      type: 'personal',
      ownerId: oid(),
      restaurantIds: [],
    };
    expect(
      isSkip(
        collectionToList(
          orphaned,
          { index, groupsById: new Map(), usersById },
          NOW
        )
      )
    ).toBe(true);
  });
});

describe('groupToCrew', () => {
  const userA = makeUser();
  const userB = makeUser();
  const usersById = new Map([
    [userA._id.toString(), userA],
    [userB._id.toString(), userB],
  ]);

  it('reuses the group _id and merges admins + members without duplicates', () => {
    const group: V1Group = {
      _id: oid(),
      name: 'Lunch crew',
      adminIds: [userA._id],
      memberIds: [userA._id, userB._id],
    };
    const crew = groupToCrew(group, usersById, NOW);
    if (isSkip(crew)) throw new Error('expected a crew');
    expect(crew._id).toBe(group._id);
    expect(crew.memberIds).toEqual([userA._id, userB._id]);
    expect(crew.createdBy).toBe(userA._id);
  });

  it('skips groups with fewer than two resolvable members', () => {
    const group: V1Group = {
      _id: oid(),
      name: 'Ghost town',
      adminIds: [oid()],
      memberIds: [userA._id],
    };
    expect(isSkip(groupToCrew(group, usersById, NOW))).toBe(true);
  });
});

describe('decisionToFork', () => {
  const organizer = makeUser({ name: 'Sam' });
  const voter = makeUser({ name: 'Riley' });
  const restaurantA = makeRestaurant({ name: 'Winner' });
  const restaurantB = makeRestaurant({ name: 'Runner-up' });
  const index = buildPlaceIndex([placeOf(restaurantA), placeOf(restaurantB)]);
  const ctx = {
    index,
    usersByClerkId: new Map([
      [organizer.clerkId, organizer],
      [voter.clerkId, voter],
    ]),
    usersById: new Map([
      [organizer._id.toString(), organizer],
      [voter._id.toString(), voter],
    ]),
    listsByCollectionId: new Map(),
    crewsByGroupId: new Map(),
  };

  const selectedAt = new Date('2026-06-20T18:00:00Z');

  function makeDecision(overrides: Partial<V1Decision> = {}): V1Decision {
    return {
      _id: oid(),
      type: 'personal',
      collectionId: oid(),
      createdBy: organizer._id,
      participants: [organizer.clerkId],
      method: 'random',
      status: 'completed',
      result: {
        restaurantId: restaurantA._id,
        selectedAt,
        reasoning: 'The wheel decided.',
        weights: {
          [restaurantA._id.toString()]: 1,
          [restaurantB._id.toString()]: 0.4,
        },
      },
      createdAt: new Date('2026-06-20T17:00:00Z'),
      updatedAt: new Date('2026-06-20T18:00:00Z'),
      ...overrides,
    };
  }

  it('maps a completed spin: closed fork, decidedAt preserved, weights re-keyed to place ids', () => {
    const decision = makeDecision();
    const mapped = decisionToFork(decision, ctx, NOW);
    if (isSkip(mapped)) throw new Error('expected a fork');
    const { fork } = mapped;
    expect(fork._id).toBe(decision._id);
    expect(fork.status).toBe('closed');
    expect(fork.mode).toBe('spin');
    expect(fork.result?.decidedAt).toEqual(selectedAt);
    expect(fork.result?.placeId).toBe(restaurantA._id);
    expect(fork.result?.weights).toEqual({
      [restaurantA._id.toString()]: 1,
      [restaurantB._id.toString()]: 0.4,
    });
    expect(fork.options.map((o) => o.name).sort()).toEqual([
      'Runner-up',
      'Winner',
    ]);
    expect(fork.organizer).toEqual({
      userId: organizer._id,
      displayName: 'Sam',
    });
    expect(fork.participantUserIds).toEqual([organizer._id]);
    expect(fork.participantGuestIds).toEqual([]);
  });

  it('maps tiered decisions to vote mode with Clerk-id voters resolved to Participants', () => {
    const decision = makeDecision({
      type: 'group',
      method: 'tiered',
      participants: [organizer.clerkId, voter.clerkId],
      votes: [
        {
          userId: voter.clerkId,
          rankings: [restaurantB._id, restaurantA._id],
          submittedAt: new Date('2026-06-20T17:30:00Z'),
        },
        {
          userId: 'user_gone', // unresolvable → dropped, reported
          rankings: [restaurantA._id],
          submittedAt: new Date('2026-06-20T17:31:00Z'),
        },
      ],
    });
    const mapped = decisionToFork(decision, ctx, NOW);
    if (isSkip(mapped)) throw new Error('expected a fork');
    expect(mapped.fork.mode).toBe('vote');
    expect(mapped.fork.votes).toHaveLength(1);
    expect(mapped.fork.votes[0].voter).toEqual({
      userId: voter._id,
      displayName: 'Riley',
    });
    expect(mapped.fork.votes[0].rankings).toEqual([
      restaurantB._id,
      restaurantA._id,
    ]);
    expect(mapped.droppedVotes).toBe(1);
    expect(mapped.fork.participantUserIds).toEqual([organizer._id, voter._id]);
  });

  it('attaches the migrated crew so shared weights survive', () => {
    const groupId = oid();
    const crewId = groupId;
    const decision = makeDecision({ type: 'group', groupId });
    const mapped = decisionToFork(
      decision,
      {
        ...ctx,
        crewsByGroupId: new Map([
          [
            groupId.toString(),
            {
              _id: crewId,
              name: 'Lunch crew',
              memberIds: [organizer._id, voter._id],
              createdBy: organizer._id,
              createdAt: NOW,
              updatedAt: NOW,
            },
          ],
        ]),
      },
      NOW
    );
    if (isSkip(mapped)) throw new Error('expected a fork');
    expect(mapped.fork.crewId).toBe(crewId);
  });

  it('points the source at the migrated list when the collection migrated', () => {
    const collectionId = oid();
    const decision = makeDecision({ collectionId });
    const mapped = decisionToFork(
      decision,
      {
        ...ctx,
        listsByCollectionId: new Map([
          [
            collectionId.toString(),
            {
              _id: collectionId,
              ownerId: organizer._id,
              name: 'Date night',
              placeIds: [restaurantA._id],
              createdAt: NOW,
              updatedAt: NOW,
            },
          ],
        ]),
      },
      NOW
    );
    if (isSkip(mapped)) throw new Error('expected a fork');
    expect(mapped.fork.source).toEqual({
      kind: 'list',
      listId: collectionId,
    });
  });

  it('labels manual entries honestly when they carry no notes', () => {
    const decision = makeDecision({ method: 'manual' });
    decision.result!.reasoning = '';
    const mapped = decisionToFork(decision, ctx, NOW);
    if (isSkip(mapped)) throw new Error('expected a fork');
    expect(mapped.fork.mode).toBe('spin');
    expect(mapped.fork.result?.reasoning).toBe('Logged from a past visit.');
  });

  it('skips non-completed decisions and unmigratable winners', () => {
    expect(
      isSkip(decisionToFork(makeDecision({ status: 'active' }), ctx, NOW))
    ).toBe(true);
    const badWinner = makeDecision();
    badWinner.result!.restaurantId = oid();
    expect(isSkip(decisionToFork(badWinner, ctx, NOW))).toBe(true);
  });

  it('falls back to the first resolvable participant as organizer', () => {
    const decision = makeDecision({
      createdBy: undefined,
      participants: ['user_gone', voter.clerkId],
    });
    const mapped = decisionToFork(decision, ctx, NOW);
    if (isSkip(mapped)) throw new Error('expected a fork');
    expect(mapped.fork.organizer.userId).toBe(voter._id);
  });

  it('skips decisions with nobody resolvable to own them', () => {
    const decision = makeDecision({
      createdBy: oid(),
      participants: ['user_gone'],
    });
    expect(isSkip(decisionToFork(decision, ctx, NOW))).toBe(true);
  });
});
