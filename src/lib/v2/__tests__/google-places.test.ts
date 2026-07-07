import {
  fetchNearbyFromGoogle,
  fetchPlaceDetailsFromGoogle,
  fetchTextSearchFromGoogle,
  geocodeAddress,
  isGooglePlacesEnabled,
  toPlaceFields,
  type FetchLike,
  type GooglePlaceResult,
} from '../google-places';

jest.mock('../../api-usage-tracker', () => ({
  trackAPIUsage: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { trackAPIUsage } = require('../../api-usage-tracker');

const ORIGINAL_ENV = { ...process.env };

function setEnv(overrides: Record<string, string | undefined>): void {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.GOOGLE_PLACES_API_KEY;
  delete process.env.ALLOW_GOOGLE_PLACES;
  delete process.env.VERCEL_ENV;
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) process.env[key] = value;
  }
}

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

beforeEach(() => {
  jest.clearAllMocks();
  setEnv({ GOOGLE_PLACES_API_KEY: 'test-key', ALLOW_GOOGLE_PLACES: 'true' });
});

function fetchReturning(body: unknown, ok = true, status = 200): FetchLike {
  return jest.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

const RESULT: GooglePlaceResult = {
  place_id: 'gp-1',
  name: 'Kanoyama',
  formatted_address: '175 2nd Ave, New York',
  geometry: { location: { lat: 40.73, lng: -73.98 } },
  types: ['japanese_restaurant', 'restaurant', 'food', 'establishment'],
  rating: 4.6,
  price_level: 3,
  photos: [{ photo_reference: 'ref-abc' }],
};

describe('isGooglePlacesEnabled', () => {
  it('is default-closed: key alone is not enough outside production', () => {
    setEnv({ GOOGLE_PLACES_API_KEY: 'test-key' });
    expect(isGooglePlacesEnabled()).toBe(false);
  });

  it('requires a key even in production', () => {
    setEnv({ VERCEL_ENV: 'production' });
    expect(isGooglePlacesEnabled()).toBe(false);
  });

  it('opens in production or with the explicit override', () => {
    setEnv({ GOOGLE_PLACES_API_KEY: 'k', VERCEL_ENV: 'production' });
    expect(isGooglePlacesEnabled()).toBe(true);
    setEnv({ GOOGLE_PLACES_API_KEY: 'k', ALLOW_GOOGLE_PLACES: 'true' });
    expect(isGooglePlacesEnabled()).toBe(true);
  });
});

describe('toPlaceFields', () => {
  it('maps a legacy result onto PlaceDoc cache fields', () => {
    expect(toPlaceFields(RESULT)).toEqual({
      googlePlaceId: 'gp-1',
      name: 'Kanoyama',
      address: '175 2nd Ave, New York',
      location: { type: 'Point', coordinates: [-73.98, 40.73] },
      categories: ['japanese restaurant'],
      priceLevel: 3,
      rating: 4.6,
      photoRef: 'ref-abc',
    });
  });

  it('falls back to vicinity for nearby results and drops absent optionals', () => {
    const nearby: GooglePlaceResult = {
      place_id: 'gp-2',
      name: 'Taco Bravo',
      vicinity: '31st Ave, Astoria',
      geometry: { location: { lat: 40.76, lng: -73.92 } },
    };
    expect(toPlaceFields(nearby)).toEqual({
      googlePlaceId: 'gp-2',
      name: 'Taco Bravo',
      address: '31st Ave, Astoria',
      location: { type: 'Point', coordinates: [-73.92, 40.76] },
      categories: [],
    });
  });

  it('rejects skeleton rows missing id, name, or coordinates', () => {
    expect(toPlaceFields({ ...RESULT, place_id: '' })).toBeNull();
    expect(toPlaceFields({ ...RESULT, name: '' })).toBeNull();
    expect(toPlaceFields({ ...RESULT, geometry: {} })).toBeNull();
  });

  it('keeps a free place (price_level 0) instead of dropping falsy values', () => {
    expect(toPlaceFields({ ...RESULT, price_level: 0 })).toMatchObject({
      priceLevel: 0,
    });
  });
});

describe('search fetchers', () => {
  it('nearby: builds the legacy URL and tracks one real call', async () => {
    const fetchImpl = fetchReturning({ status: 'OK', results: [RESULT] });

    const results = await fetchNearbyFromGoogle(
      { lat: 40.76, lng: -73.92 },
      800,
      fetchImpl
    );

    expect(results).toEqual([RESULT]);
    const url = (fetchImpl as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/nearbysearch/json?');
    expect(url).toContain('location=40.76%2C-73.92');
    expect(url).toContain('radius=800');
    expect(url).toContain('type=restaurant');
    expect(trackAPIUsage).toHaveBeenCalledWith(
      'google_places_nearby_search',
      false
    );
  });

  it('text: distinguishes ZERO_RESULTS ([]) from failure (null)', async () => {
    expect(
      await fetchTextSearchFromGoogle(
        'sushi',
        undefined,
        fetchReturning({ status: 'ZERO_RESULTS' })
      )
    ).toEqual([]);
    expect(
      await fetchTextSearchFromGoogle(
        'sushi',
        undefined,
        fetchReturning({ status: 'OVER_QUERY_LIMIT' })
      )
    ).toBeNull();
    expect(
      await fetchTextSearchFromGoogle(
        'sushi',
        undefined,
        fetchReturning({}, false, 500)
      )
    ).toBeNull();
    expect(
      await fetchTextSearchFromGoogle(
        'sushi',
        undefined,
        jest.fn().mockRejectedValue(new Error('network down'))
      )
    ).toBeNull();
  });

  it('returns null without fetching when the key is absent', async () => {
    setEnv({});
    const fetchImpl = fetchReturning({ status: 'OK', results: [] });
    expect(
      await fetchNearbyFromGoogle({ lat: 0, lng: 0 }, 800, fetchImpl)
    ).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(trackAPIUsage).not.toHaveBeenCalled();
  });
});

describe('geocodeAddress', () => {
  const CANDIDATE = {
    formatted_address: '123 Main St, Astoria, NY 11103, USA',
    geometry: { location: { lat: 40.761, lng: -73.925 } },
  };

  it('resolves a typed address to a label and point via Find Place', async () => {
    const fetchImpl = fetchReturning({ status: 'OK', candidates: [CANDIDATE] });

    const result = await geocodeAddress('123 main st astoria', fetchImpl);

    expect(result).toEqual({
      label: '123 Main St, Astoria, NY 11103, USA',
      lat: 40.761,
      lng: -73.925,
    });
    const url = (fetchImpl as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/findplacefromtext/json?');
    expect(url).toContain('inputtype=textquery');
    expect(trackAPIUsage).toHaveBeenCalledWith(
      'google_places_find_place',
      false
    );
  });

  it('returns null when the gate is closed, without fetching', async () => {
    setEnv({ GOOGLE_PLACES_API_KEY: 'test-key' }); // key but no override
    const fetchImpl = fetchReturning({ status: 'OK', candidates: [CANDIDATE] });

    expect(await geocodeAddress('123 main st', fetchImpl)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns null when Google has no candidate or no coordinates', async () => {
    expect(
      await geocodeAddress(
        'nowhere',
        fetchReturning({ status: 'ZERO_RESULTS', candidates: [] })
      )
    ).toBeNull();
    expect(
      await geocodeAddress(
        'nowhere',
        fetchReturning({
          status: 'OK',
          candidates: [{ formatted_address: 'x', geometry: {} }],
        })
      )
    ).toBeNull();
  });
});

describe('fetchPlaceDetailsFromGoogle', () => {
  it('requests the PlaceDoc field set and unwraps result', async () => {
    const fetchImpl = fetchReturning({ status: 'OK', result: RESULT });

    const result = await fetchPlaceDetailsFromGoogle('gp-1', fetchImpl);

    expect(result).toEqual(RESULT);
    const url = (fetchImpl as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/details/json?');
    expect(url).toContain('place_id=gp-1');
    expect(trackAPIUsage).toHaveBeenCalledWith('google_places_details', false);
  });

  it('returns null on failure', async () => {
    expect(
      await fetchPlaceDetailsFromGoogle(
        'gp-1',
        fetchReturning({ status: 'NOT_FOUND' })
      )
    ).toBeNull();
  });
});
