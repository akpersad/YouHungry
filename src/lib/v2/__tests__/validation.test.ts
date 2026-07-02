import {
  createForkSchema,
  lockInSchema,
  quickSpinSchema,
  searchQuerySchema,
  voteSchema,
} from '../validation';

const oid = (n: number) => n.toString(16).padStart(24, '0');

describe('quickSpinSchema', () => {
  it('accepts coordinates with optional vibe and radius', () => {
    expect(
      quickSpinSchema.parse({ lat: 40.76, lng: -73.92, vibe: 'cheap' })
    ).toEqual({ lat: 40.76, lng: -73.92, vibe: 'cheap' });
  });

  it('rejects out-of-range coordinates, unknown vibes, and silly radii', () => {
    expect(quickSpinSchema.safeParse({ lat: 91, lng: 0 }).success).toBe(false);
    expect(quickSpinSchema.safeParse({ lat: 0, lng: -181 }).success).toBe(
      false
    );
    expect(
      quickSpinSchema.safeParse({ lat: 0, lng: 0, vibe: 'purple' }).success
    ).toBe(false);
    expect(
      quickSpinSchema.safeParse({ lat: 0, lng: 0, radiusM: 50 }).success
    ).toBe(false);
    expect(
      quickSpinSchema.safeParse({ lat: 0, lng: 0, radiusM: 99999 }).success
    ).toBe(false);
  });
});

describe('lockInSchema', () => {
  it('requires the wheel and the winner', () => {
    const parsed = lockInSchema.parse({
      lat: 40.76,
      lng: -73.92,
      optionPlaceIds: [oid(1), oid(2)],
      winnerPlaceId: oid(2),
    });
    expect(parsed.winnerPlaceId).toBe(oid(2));
  });

  it('rejects malformed ids', () => {
    expect(
      lockInSchema.safeParse({
        lat: 0,
        lng: 0,
        optionPlaceIds: ['nope'],
        winnerPlaceId: oid(1),
      }).success
    ).toBe(false);
  });
});

describe('createForkSchema', () => {
  it('defaults the lifespan to 30 minutes', () => {
    const parsed = createForkSchema.parse({
      mode: 'vote',
      source: { kind: 'ad-hoc' },
      optionPlaceIds: [oid(1), oid(2)],
    });
    expect(parsed.lifespanMinutes).toBe(30);
    expect(parsed.quorum).toBeUndefined();
  });

  it('accepts each source kind with its own fields', () => {
    expect(
      createForkSchema.safeParse({
        mode: 'spin',
        source: { kind: 'near-me', lat: 40.7, lng: -73.9, vibe: 'top' },
        optionPlaceIds: [oid(1), oid(2)],
      }).success
    ).toBe(true);
    expect(
      createForkSchema.safeParse({
        mode: 'vote',
        source: { kind: 'list', listId: oid(9) },
        optionPlaceIds: [oid(1), oid(2)],
        quorum: 3,
      }).success
    ).toBe(true);
  });

  it('enforces a real decision: at least two options', () => {
    expect(
      createForkSchema.safeParse({
        mode: 'spin',
        source: { kind: 'ad-hoc' },
        optionPlaceIds: [oid(1)],
      }).success
    ).toBe(false);
  });

  it('bounds lifespan and quorum', () => {
    const base = {
      mode: 'vote' as const,
      source: { kind: 'ad-hoc' as const },
      optionPlaceIds: [oid(1), oid(2)],
    };
    expect(
      createForkSchema.safeParse({ ...base, lifespanMinutes: 2 }).success
    ).toBe(false);
    expect(
      createForkSchema.safeParse({ ...base, lifespanMinutes: 2000 }).success
    ).toBe(false);
    expect(createForkSchema.safeParse({ ...base, quorum: 1 }).success).toBe(
      false
    );
  });
});

describe('voteSchema', () => {
  it('accepts one to three distinct rankings', () => {
    expect(voteSchema.safeParse({ rankings: [oid(1)] }).success).toBe(true);
    expect(
      voteSchema.safeParse({ rankings: [oid(1), oid(2), oid(3)] }).success
    ).toBe(true);
  });

  it('rejects empties, duplicates, and more than three', () => {
    expect(voteSchema.safeParse({ rankings: [] }).success).toBe(false);
    expect(voteSchema.safeParse({ rankings: [oid(1), oid(1)] }).success).toBe(
      false
    );
    expect(
      voteSchema.safeParse({
        rankings: [oid(1), oid(2), oid(3), oid(4)],
      }).success
    ).toBe(false);
  });
});

describe('searchQuerySchema', () => {
  it('trims and bounds the query', () => {
    expect(searchQuerySchema.parse({ q: '  pho  ' })).toEqual({ q: 'pho' });
    expect(searchQuerySchema.safeParse({ q: '   ' }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: 'x'.repeat(81) }).success).toBe(
      false
    );
  });
});
