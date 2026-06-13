import {
  formatRelativeDate,
  normalizeRestaurantId,
  restaurantIdentityKeys,
  restaurantIdsMatch,
} from '@/lib/utils';

const DAY = 24 * 60 * 60 * 1000;

describe('restaurant id helpers', () => {
  describe('restaurantIdentityKeys', () => {
    it('returns an empty array for null/undefined/empty', () => {
      expect(restaurantIdentityKeys(null)).toEqual([]);
      expect(restaurantIdentityKeys(undefined)).toEqual([]);
      expect(restaurantIdentityKeys('')).toEqual([]);
    });

    it('treats a bare string as a single key (legacy ObjectId string)', () => {
      expect(restaurantIdentityKeys('507f1f77bcf86cd799439011')).toEqual([
        '507f1f77bcf86cd799439011',
      ]);
    });

    it('derives a key from an ObjectId-like value via toString', () => {
      const objectIdLike = { toString: () => '507f1f77bcf86cd799439011' };
      expect(restaurantIdentityKeys(objectIdLike)).toEqual([
        '507f1f77bcf86cd799439011',
      ]);
    });

    it('prefers googlePlaceId then _id for new-format entries', () => {
      expect(
        restaurantIdentityKeys({ _id: 'abc123', googlePlaceId: 'gp_xyz' })
      ).toEqual(['gp_xyz', 'abc123']);
    });

    it('handles a googlePlaceId-only entry', () => {
      expect(restaurantIdentityKeys({ googlePlaceId: 'gp_only' })).toEqual([
        'gp_only',
      ]);
    });

    it('handles a Restaurant-shaped object (both ids present)', () => {
      const restaurant = { _id: 'mongo1', googlePlaceId: 'gp1', name: 'A' };
      expect(restaurantIdentityKeys(restaurant)).toEqual(['gp1', 'mongo1']);
    });

    it('ignores plain objects with no usable identity', () => {
      expect(restaurantIdentityKeys({ name: 'no ids' })).toEqual([]);
    });
  });

  describe('normalizeRestaurantId', () => {
    it('returns the canonical googlePlaceId when available', () => {
      expect(
        normalizeRestaurantId({ _id: 'abc', googlePlaceId: 'gp_canonical' })
      ).toBe('gp_canonical');
    });

    it('falls back to _id when no googlePlaceId', () => {
      expect(normalizeRestaurantId({ _id: 'mongoOnly' })).toBe('mongoOnly');
    });

    it('returns null when there is no identity', () => {
      expect(normalizeRestaurantId(null)).toBeNull();
      expect(normalizeRestaurantId({ name: 'x' })).toBeNull();
    });
  });

  describe('restaurantIdsMatch', () => {
    it('matches new-format entries by shared googlePlaceId', () => {
      const stored = { _id: 'storedMongo', googlePlaceId: 'gp_shared' };
      const result = { _id: 'resultMongo', googlePlaceId: 'gp_shared' };
      expect(restaurantIdsMatch(stored, result)).toBe(true);
    });

    it('matches a legacy ObjectId entry against a saved result by _id', () => {
      const legacyEntry = { toString: () => 'mongo_legacy' };
      const savedResult = { _id: 'mongo_legacy', googlePlaceId: 'gp_new' };
      expect(restaurantIdsMatch(legacyEntry, savedResult)).toBe(true);
    });

    it('does not match unrelated restaurants', () => {
      expect(
        restaurantIdsMatch({ googlePlaceId: 'gp_a' }, { googlePlaceId: 'gp_b' })
      ).toBe(false);
    });

    it('returns false when either side has no identity', () => {
      expect(restaurantIdsMatch(null, { googlePlaceId: 'gp' })).toBe(false);
      expect(restaurantIdsMatch({ googlePlaceId: 'gp' }, {})).toBe(false);
    });
  });
});

describe('formatRelativeDate', () => {
  it('returns null for empty/invalid input', () => {
    expect(formatRelativeDate(null)).toBeNull();
    expect(formatRelativeDate(undefined)).toBeNull();
    expect(formatRelativeDate('not-a-date')).toBeNull();
  });

  it('labels today and yesterday', () => {
    expect(formatRelativeDate(new Date(Date.now() - 2 * 60 * 60 * 1000))).toBe(
      'Today'
    );
    expect(formatRelativeDate(new Date(Date.now() - 1 * DAY))).toBe(
      'Yesterday'
    );
  });

  it('labels days, weeks, and months', () => {
    expect(formatRelativeDate(new Date(Date.now() - 3 * DAY))).toBe(
      '3 days ago'
    );
    expect(formatRelativeDate(new Date(Date.now() - 14 * DAY))).toBe(
      '2 weeks ago'
    );
    expect(formatRelativeDate(new Date(Date.now() - 60 * DAY))).toBe(
      '2 months ago'
    );
  });

  it('falls back to an absolute date for >1 year and accepts ISO strings', () => {
    const old = new Date(Date.now() - 400 * DAY);
    expect(formatRelativeDate(old.toISOString())).toMatch(/\d{4}/);
  });
});
