import { ObjectId } from 'mongodb';
import {
  DEFAULT_RADIUS_M,
  MAX_NEARBY_OPTIONS,
  VIBES,
  findNearbyPlaces,
  getPlacesByIds,
  placeToOption,
  searchPlaces,
  vibeFilter,
} from '../places';
import type { PlaceDoc } from '../schema';

jest.mock('../db', () => ({
  getV2Db: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getV2Db } = require('../db');

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
}

function mockPlaces(docs: PlaceDoc[] = []): PlacesStub {
  const places: PlacesStub = {
    find: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue(docs),
    }),
  };
  (getV2Db as jest.Mock).mockResolvedValue({ places });
  return places;
}

beforeEach(() => {
  jest.clearAllMocks();
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
