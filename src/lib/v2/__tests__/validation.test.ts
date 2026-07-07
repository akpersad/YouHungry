import {
  changePasswordSchema,
  createForkSchema,
  guestDisplayName,
  guestVoteSchema,
  lockInSchema,
  notificationSettingsSchema,
  pushSubscriptionSchema,
  quickSpinSchema,
  searchQuerySchema,
  updateAccountSchema,
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

  it('rejects duplicate options — one place twice is not a choice', () => {
    expect(
      createForkSchema.safeParse({
        mode: 'vote',
        source: { kind: 'ad-hoc' },
        optionPlaceIds: [oid(1), oid(1)],
      }).success
    ).toBe(false);
    expect(
      lockInSchema.safeParse({
        lat: 0,
        lng: 0,
        optionPlaceIds: [oid(1), oid(1)],
        winnerPlaceId: oid(1),
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

describe('guestDisplayName', () => {
  it('trims and collapses whitespace', () => {
    expect(guestDisplayName.parse('  Sam   T  ')).toBe('Sam T');
  });

  it('rejects empties, over-long names, and control characters', () => {
    expect(guestDisplayName.safeParse('   ').success).toBe(false);
    expect(guestDisplayName.safeParse('x'.repeat(25)).success).toBe(false);
    expect(guestDisplayName.safeParse('Sam\u0007').success).toBe(false);
    // Zero-widths and bidi overrides are format characters — rejected too.
    expect(guestDisplayName.safeParse('Sam\u200b').success).toBe(false);
    expect(guestDisplayName.safeParse('Sam\u202e').success).toBe(false);
  });

  it('accepts real names, emoji included', () => {
    expect(guestDisplayName.safeParse('José').success).toBe(true);
    expect(guestDisplayName.safeParse('Sam 🍜').success).toBe(true);
  });
});

describe('guestVoteSchema', () => {
  it('requires the fork token alongside rankings', () => {
    expect(
      guestVoteSchema.safeParse({ rankings: [oid(1)], forkToken: 't.sig' })
        .success
    ).toBe(true);
    expect(guestVoteSchema.safeParse({ rankings: [oid(1)] }).success).toBe(
      false
    );
  });

  it('keeps the display name optional (returning guests keep theirs)', () => {
    const parsed = guestVoteSchema.parse({
      rankings: [oid(1)],
      forkToken: 't.sig',
      displayName: '  Sam ',
    });
    expect(parsed.displayName).toBe('Sam');
    expect(
      guestVoteSchema.safeParse({ rankings: [oid(1)], forkToken: 't.sig' })
        .success
    ).toBe(true);
  });
});

describe('account schemas', () => {
  it('applies guest-name hygiene to the first name', () => {
    expect(updateAccountSchema.parse({ firstName: '  Liv  ' })).toEqual({
      firstName: 'Liv',
    });
    expect(updateAccountSchema.parse({})).toEqual({});
    expect(updateAccountSchema.safeParse({ firstName: 'Liv‮' }).success).toBe(
      false
    );
  });

  it('bounds passwords without duplicating Clerk rules', () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'old-pass',
        newPassword: 'new-password',
      }).success
    ).toBe(true);
    expect(
      changePasswordSchema.safeParse({
        currentPassword: '',
        newPassword: 'new-password',
      }).success
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'old-pass',
        newPassword: 'short',
      }).success
    ).toBe(false);
  });

  it('requires at least one notification flag', () => {
    expect(
      notificationSettingsSchema.safeParse({ pushEnabled: false }).success
    ).toBe(true);
    expect(notificationSettingsSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a real browser subscription shape, https only', () => {
    const sub = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      keys: { p256dh: 'BPk', auth: 'a2' },
    };
    expect(pushSubscriptionSchema.safeParse(sub).success).toBe(true);
    expect(
      pushSubscriptionSchema.safeParse({
        ...sub,
        endpoint: 'http://insecure.example/1',
      }).success
    ).toBe(false);
    expect(
      pushSubscriptionSchema.safeParse({ endpoint: sub.endpoint, keys: {} })
        .success
    ).toBe(false);
  });
});
