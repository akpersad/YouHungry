import { ObjectId } from 'mongodb';
import {
  DEFAULT_RADIUS_M,
  MAX_NEARBY_OPTIONS,
  VIBES,
  findNearbyPlaces,
  getFreshPlacesByIds,
  getPlacesByIds,
  placeToOption,
  searchPlaces,
  toPlaceSummary,
  vibeFilter,
} from '../places';
import type { PlaceDoc } from '../schema';

jest.mock('../db', () => ({
  getV2Db: jest.fn(),
}));

jest.mock('../google-places', () => ({
  ...jest.requireActual('../google-places'),
  isGooglePlacesEnabled: jest.fn().mockReturnValue(false),
  fetchNearbyFromGoogle: jest.fn(),
  fetchTextSearchFromGoogle: jest.fn(),
  fetchPlaceDetailsFromGoogle: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getV2Db } = require('../db');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleClient = require('../google-places');

let idCounter = 0;
function uniqueId(): ObjectId {
  return new ObjectId((++idCounter).toString(16).padStart(24, '0'));
}

function place(name: string): PlaceDoc {
  const now = new Date();
  return {
    _id: uniqueId(),
    googlePlaceId: `dev-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    address: 'Fixture Ave',
    location: { type: 'Point', coordinates: [-73.92, 40.76] },
    categories: ['test'],
    cachedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

interface PlacesStub {
  find: jest.Mock;
  bulkWrite: jest.Mock;
}

interface PlaceQueriesStub {
  findOne: jest.Mock;
  updateOne: jest.Mock;
}

interface DbStubs {
  places: PlacesStub;
  placeQueries: PlaceQueriesStub;
}

function mockDb(docs: PlaceDoc[] = [], marker: unknown = null): DbStubs {
  const places: PlacesStub = {
    find: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue(docs),
    }),
    bulkWrite: jest.fn().mockResolvedValue({}),
  };
  const placeQueries: PlaceQueriesStub = {
    findOne: jest.fn().mockResolvedValue(marker),
    updateOne: jest.fn().mockResolvedValue({}),
  };
  (getV2Db as jest.Mock).mockResolvedValue({ places, placeQueries });
  return { places, placeQueries };
}

function mockPlaces(docs: PlaceDoc[] = []): PlacesStub {
  return mockDb(docs).places;
}

beforeEach(() => {
  jest.clearAllMocks();
  (googleClient.isGooglePlacesEnabled as jest.Mock).mockReturnValue(false);
});

describe('vibeFilter', () => {
  it('maps every declared vibe to a filter and unknowns to none', () => {
    for (const vibe of VIBES) {
      expect(vibeFilter(vibe.key)).toBe(vibe.filter);
    }
    expect(vibeFilter(undefined)).toEqual({});
    expect(vibeFilter('nonsense')).toEqual({});
  });
});

describe('findNearbyPlaces', () => {
  it('queries the 2dsphere index closest-first with defaults', async () => {
    const places = mockPlaces();

    await findNearbyPlaces({ lat: 40.76, lng: -73.92 });

    expect(places.find).toHaveBeenCalledWith({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [-73.92, 40.76] },
          $maxDistance: DEFAULT_RADIUS_M,
        },
      },
    });
    expect(places.find.mock.results[0].value.limit).toHaveBeenCalledWith(
      MAX_NEARBY_OPTIONS
    );
  });

  it('applies the vibe filter and custom radius', async () => {
    const places = mockPlaces();

    await findNearbyPlaces(
      { lat: 40.76, lng: -73.92 },
      { vibe: 'cheap', radiusM: 800 }
    );

    expect(places.find).toHaveBeenCalledWith(
      expect.objectContaining({
        priceLevel: { $lte: 1 },
        location: expect.objectContaining({
          $near: expect.objectContaining({ $maxDistance: 800 }),
        }),
      })
    );
  });
});

describe('searchPlaces', () => {
  it('escapes regex metacharacters in the query', async () => {
    const places = mockPlaces();

    await searchPlaces('taco (bravo)');

    expect(places.find).toHaveBeenCalledWith({
      name: { $regex: 'taco \\(bravo\\)', $options: 'i' },
    });
  });

  it('returns nothing for a blank query without hitting the DB', async () => {
    const places = mockPlaces();
    expect(await searchPlaces('   ')).toEqual([]);
    expect(places.find).not.toHaveBeenCalled();
  });
});

describe('getPlacesByIds', () => {
  it('preserves caller order and drops missing ids', async () => {
    const a = place('Alpha');
    const b = place('Beta');
    const missing = uniqueId();
    mockPlaces([a, b]); // DB returns index order

    const result = await getPlacesByIds([b._id, missing, a._id]);

    expect(result.map((p) => p.name)).toEqual(['Beta', 'Alpha']);
  });

  it('skips the DB entirely for an empty id list', async () => {
    const places = mockPlaces();
    expect(await getPlacesByIds([])).toEqual([]);
    expect(places.find).not.toHaveBeenCalled();
  });
});

describe('placeToOption', () => {
  it('carries the denormalized fields a fork needs', () => {
    const doc = place('Sushi Yama');
    expect(placeToOption(doc)).toEqual({
      placeId: doc._id,
      googlePlaceId: doc.googlePlaceId,
      name: 'Sushi Yama',
    });
  });
});

describe('toPlaceSummary', () => {
  it('serializes only the wire fields and drops absent optionals', () => {
    const doc = place('Sushi Yama');
    expect(toPlaceSummary(doc)).toEqual({
      id: doc._id.toString(),
      name: 'Sushi Yama',
      address: 'Fixture Ave',
      categories: ['test'],
    });
    expect(
      toPlaceSummary({ ...doc, priceLevel: 2, rating: 4.4 })
    ).toMatchObject({ priceLevel: 2, rating: 4.4 });
  });
});

describe('Google backfill (Phase 5 seam)', () => {
  const googleResult = {
    place_id: 'gp-1',
    name: 'Kanoyama',
    formatted_address: '175 2nd Ave, New York',
    geometry: { location: { lat: 40.73, lng: -73.98 } },
    types: ['restaurant', 'japanese_restaurant'],
    rating: 4.6,
    price_level: 3,
  };

  it('never calls Google when disabled (dev/CI stay cache-only)', async () => {
    mockDb();
    await findNearbyPlaces({ lat: 40.76, lng: -73.92 });
    await searchPlaces('sushi');
    expect(googleClient.fetchNearbyFromGoogle).not.toHaveBeenCalled();
    expect(googleClient.fetchTextSearchFromGoogle).not.toHaveBeenCalled();
  });

  it('skips the fetch when a fresh area marker exists', async () => {
    (googleClient.isGooglePlacesEnabled as jest.Mock).mockReturnValue(true);
    mockDb([], {
      key: 'nearby:40.760:-73.920:2000',
      googlePlaceIds: ['gp-1'],
      fetchedAt: new Date(),
    });
    await findNearbyPlaces({ lat: 40.76, lng: -73.92 });
    expect(googleClient.fetchNearbyFromGoogle).not.toHaveBeenCalled();
  });

  it('fetches, upserts, and writes the marker on a cold area', async () => {
    (googleClient.isGooglePlacesEnabled as jest.Mock).mockReturnValue(true);
    (googleClient.fetchNearbyFromGoogle as jest.Mock).mockResolvedValue([
      googleResult,
    ]);
    const { places, placeQueries } = mockDb();

    await findNearbyPlaces({ lat: 40.76, lng: -73.92 }, { radiusM: 800 });

    expect(googleClient.fetchNearbyFromGoogle).toHaveBeenCalledWith(
      { lat: 40.76, lng: -73.92 },
      800
    );
    expect(places.bulkWrite).toHaveBeenCalledTimes(1);
    const ops = places.bulkWrite.mock.calls[0][0];
    expect(ops[0].updateOne.filter).toEqual({ googlePlaceId: 'gp-1' });
    expect(ops[0].updateOne.update.$set).toMatchObject({
      name: 'Kanoyama',
      location: { type: 'Point', coordinates: [-73.98, 40.73] },
    });
    expect(placeQueries.updateOne).toHaveBeenCalledWith(
      { key: 'nearby:40.760:-73.920:800' },
      expect.objectContaining({
        $set: expect.objectContaining({ googlePlaceIds: ['gp-1'] }),
      }),
      { upsert: true }
    );
  });

  it('caches a genuine ZERO_RESULTS but not a failed call', async () => {
    (googleClient.isGooglePlacesEnabled as jest.Mock).mockReturnValue(true);

    (googleClient.fetchNearbyFromGoogle as jest.Mock).mockResolvedValue([]);
    let stubs = mockDb();
    await findNearbyPlaces({ lat: 40.76, lng: -73.92 });
    expect(stubs.placeQueries.updateOne).toHaveBeenCalled();

    (googleClient.fetchNearbyFromGoogle as jest.Mock).mockResolvedValue(null);
    stubs = mockDb();
    await findNearbyPlaces({ lat: 40.76, lng: -73.92 });
    expect(stubs.placeQueries.updateOne).not.toHaveBeenCalled();
  });

  it('serves text results in marker (relevance) order, not cache order', async () => {
    (googleClient.isGooglePlacesEnabled as jest.Mock).mockReturnValue(true);
    const first = { ...place('Beta House'), googlePlaceId: 'gp-b' };
    const second = { ...place('Alpha House'), googlePlaceId: 'gp-a' };
    mockDb([second, first], {
      key: 'text:sushi',
      googlePlaceIds: ['gp-b', 'gp-a'],
      fetchedAt: new Date(),
    });

    const results = await searchPlaces('Sushi');

    expect(results.map((p) => p.googlePlaceId)).toEqual(['gp-b', 'gp-a']);
    expect(googleClient.fetchTextSearchFromGoogle).not.toHaveBeenCalled();
  });
});

describe('getFreshPlacesByIds', () => {
  it('returns cached docs untouched when Google is disabled', async () => {
    const doc = place('Sushi Yama');
    mockDb([doc]);
    const result = await getFreshPlacesByIds([doc._id]);
    expect(result).toEqual([doc]);
    expect(googleClient.fetchPlaceDetailsFromGoogle).not.toHaveBeenCalled();
  });

  it('refreshes only stale non-fixture docs', async () => {
    (googleClient.isGooglePlacesEnabled as jest.Mock).mockReturnValue(true);
    const staleAge = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const fixture = { ...place('Fixture'), cachedAt: staleAge };
    const staleReal = {
      ...place('Real Stale'),
      googlePlaceId: 'gp-stale',
      cachedAt: staleAge,
    };
    const freshReal = { ...place('Real Fresh'), googlePlaceId: 'gp-fresh' };
    (googleClient.fetchPlaceDetailsFromGoogle as jest.Mock).mockResolvedValue(
      null
    );
    mockDb([fixture, staleReal, freshReal]);

    await getFreshPlacesByIds([fixture._id, staleReal._id, freshReal._id]);

    expect(googleClient.fetchPlaceDetailsFromGoogle).toHaveBeenCalledTimes(1);
    expect(googleClient.fetchPlaceDetailsFromGoogle).toHaveBeenCalledWith(
      'gp-stale'
    );
  });
});
