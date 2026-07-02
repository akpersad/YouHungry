/* eslint-disable no-console -- CLI script, console is the interface */
/**
 * v2 dev seed (WORKPLAN Phase 1) — idempotent; run any time with:
 *
 *   npm run seed:v2-dev
 *
 * 1. Ensures the Clerk DEV-instance test squad exists (+clerk_test emails,
 *    fixed OTP 424242, password sign-in) — refuses to touch a live instance.
 * 2. Seeds the SEPARATE dev database (refuses the production DB name) with
 *    squad user docs, fixture places (fake googlePlaceIds — the Places API
 *    is never billed in dev), a starter list, decision history for weight
 *    testing, and one unclaimed guest.
 * 3. Applies the code-defined v2 indexes.
 */
import { MongoClient, ObjectId } from 'mongodb';
import { createClerkClient } from '@clerk/backend';
import {
  V2_COLLECTIONS,
  ensureV2Indexes,
  type ForkDoc,
  type GuestDoc,
  type ListDoc,
  type PlaceDoc,
} from '../../src/lib/v2/schema';
import { TEST_SQUAD, SQUAD_PASSWORD } from './test-squad';

const PROD_DB_NAME = 'you-hungry';
const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Environment + safety rails
// ---------------------------------------------------------------------------

try {
  process.loadEnvFile('.env.local');
} catch {
  // Fine — env may come from the shell (CI).
}

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!mongoUri || !dbName || !clerkSecretKey) {
  console.error(
    'Missing env: need MONGODB_URI, MONGODB_DATABASE, CLERK_SECRET_KEY (from .env.local)'
  );
  process.exit(1);
}
if (dbName === PROD_DB_NAME) {
  console.error(
    `Refusing to seed "${PROD_DB_NAME}" — that is the production database. ` +
      'Point MONGODB_DATABASE at a dev database (e.g. you-hungry-v2-dev).'
  );
  process.exit(1);
}
if (!clerkSecretKey.startsWith('sk_test_')) {
  console.error(
    'Refusing to run against a non-dev Clerk instance (CLERK_SECRET_KEY is not sk_test_).'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Fixture places — fictional, clustered around Astoria, Queens
// ---------------------------------------------------------------------------

interface PlaceFixture {
  key: string;
  name: string;
  categories: string[];
  priceLevel: number;
  rating: number;
  lng: number;
  lat: number;
}

const PLACE_FIXTURES: PlaceFixture[] = [
  {
    key: 'sushi-yama',
    name: 'Sushi Yama',
    categories: ['japanese', 'sushi'],
    priceLevel: 2,
    rating: 4.6,
    lng: -73.921,
    lat: 40.763,
  },
  {
    key: 'taco-bravo',
    name: 'Taco Bravo',
    categories: ['mexican', 'tacos'],
    priceLevel: 1,
    rating: 4.4,
    lng: -73.918,
    lat: 40.761,
  },
  {
    key: 'pho-lantern',
    name: 'Pho Lantern',
    categories: ['vietnamese', 'noodles'],
    priceLevel: 1,
    rating: 4.7,
    lng: -73.925,
    lat: 40.765,
  },
  {
    key: 'trattoria-nonna',
    name: 'Trattoria Nonna',
    categories: ['italian', 'pasta'],
    priceLevel: 3,
    rating: 4.5,
    lng: -73.915,
    lat: 40.767,
  },
  {
    key: 'seoul-ember',
    name: 'Seoul Ember',
    categories: ['korean', 'bbq'],
    priceLevel: 2,
    rating: 4.8,
    lng: -73.929,
    lat: 40.759,
  },
  {
    key: 'falafel-park',
    name: 'Falafel Park',
    categories: ['middle-eastern', 'vegetarian'],
    priceLevel: 1,
    rating: 4.3,
    lng: -73.912,
    lat: 40.764,
  },
  {
    key: 'burger-forge',
    name: 'Burger Forge',
    categories: ['american', 'burgers'],
    priceLevel: 2,
    rating: 4.2,
    lng: -73.923,
    lat: 40.757,
  },
  {
    key: 'thai-orchid',
    name: 'Thai Orchid',
    categories: ['thai', 'curry'],
    priceLevel: 2,
    rating: 4.5,
    lng: -73.917,
    lat: 40.769,
  },
  {
    key: 'diner-nine',
    name: 'Diner Nine',
    categories: ['american', 'diner'],
    priceLevel: 1,
    rating: 4.0,
    lng: -73.931,
    lat: 40.762,
  },
  {
    key: 'masala-line',
    name: 'Masala Line',
    categories: ['indian', 'curry'],
    priceLevel: 2,
    rating: 4.6,
    lng: -73.909,
    lat: 40.766,
  },
  {
    key: 'el-jardin',
    name: 'El Jardín',
    categories: ['colombian', 'latin'],
    priceLevel: 2,
    rating: 4.4,
    lng: -73.927,
    lat: 40.755,
  },
  {
    key: 'noodle-atlas',
    name: 'Noodle Atlas',
    categories: ['chinese', 'noodles'],
    priceLevel: 1,
    rating: 4.3,
    lng: -73.913,
    lat: 40.758,
  },
];

// ---------------------------------------------------------------------------

async function main() {
  // --- Clerk squad ----------------------------------------------------------
  const clerk = createClerkClient({ secretKey: clerkSecretKey! });
  const clerkIdByRole = new Map<string, string>();

  for (const member of TEST_SQUAD) {
    const existing = await clerk.users.getUserList({
      emailAddress: [member.email],
    });
    if (existing.data.length > 0) {
      clerkIdByRole.set(member.role, existing.data[0].id);
      console.log(`clerk: ${member.role} exists (${member.email})`);
      continue;
    }
    const created = await clerk.users.createUser({
      emailAddress: [member.email],
      password: SQUAD_PASSWORD,
      firstName: member.firstName,
      lastName: member.lastName,
      // The dev instance still enforces v1's username requirement.
      username: `fitr_${member.role}`,
    });
    clerkIdByRole.set(member.role, created.id);
    console.log(`clerk: created ${member.role} (${member.email})`);
  }

  // --- Mongo ----------------------------------------------------------------
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const db = client.db(dbName);
  console.log(`mongo: seeding database "${dbName}"`);

  try {
    await ensureV2Indexes(db);
    console.log('mongo: v2 indexes ensured');

    // Users — upsert on clerkId.
    const users = db.collection(V2_COLLECTIONS.users);
    const userIdByRole = new Map<string, ObjectId>();
    for (const member of TEST_SQUAD) {
      const clerkId = clerkIdByRole.get(member.role)!;
      const now = new Date();
      const result = await users.findOneAndUpdate(
        { clerkId },
        {
          $set: {
            email: member.email,
            name: `${member.firstName} ${member.lastName}`,
            updatedAt: now,
          },
          $setOnInsert: { clerkId, createdAt: now },
        },
        { upsert: true, returnDocument: 'after' }
      );
      userIdByRole.set(member.role, result!._id as ObjectId);
    }
    console.log(`mongo: ${TEST_SQUAD.length} squad users upserted`);

    // Places — upsert on googlePlaceId (dev-* ids: never billable, never
    // confusable with real cached Google payloads).
    const places = db.collection<PlaceDoc>(V2_COLLECTIONS.places);
    const placeIdByKey = new Map<string, ObjectId>();
    for (const fixture of PLACE_FIXTURES) {
      const now = new Date();
      const result = await places.findOneAndUpdate(
        { googlePlaceId: `dev-${fixture.key}` },
        {
          $set: {
            name: fixture.name,
            address: `Fixture Ave, Astoria, NY (${fixture.key})`,
            location: {
              type: 'Point',
              coordinates: [fixture.lng, fixture.lat],
            },
            categories: fixture.categories,
            priceLevel: fixture.priceLevel,
            rating: fixture.rating,
            cachedAt: now,
            updatedAt: now,
          },
          $setOnInsert: { googlePlaceId: `dev-${fixture.key}`, createdAt: now },
        },
        { upsert: true, returnDocument: 'after' }
      );
      placeIdByKey.set(fixture.key, result!._id as ObjectId);
    }
    console.log(`mongo: ${PLACE_FIXTURES.length} fixture places upserted`);

    // Starter list for the organizer.
    const lists = db.collection<ListDoc>(V2_COLLECTIONS.lists);
    const organizerId = userIdByRole.get('organizer')!;
    const listPlaceIds = PLACE_FIXTURES.slice(0, 6).map(
      (fixture) => placeIdByKey.get(fixture.key)!
    );
    await lists.updateOne(
      { ownerId: organizerId, name: 'Astoria favorites' },
      {
        $set: { placeIds: listPlaceIds, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    console.log('mongo: organizer starter list upserted');

    // Decision history — closed forks with results at staggered ages so
    // weight decay is observable: 2d ago (heavy penalty), 12d ago (partial),
    // 40d ago (fully recovered). Deterministic seed-* codes → idempotent
    // delete-and-reinsert.
    const forks = db.collection<ForkDoc>(V2_COLLECTIONS.forks);
    await forks.deleteMany({ code: /^seed-/ });

    const organizer = TEST_SQUAD.find((m) => m.role === 'organizer')!;
    const member1 = TEST_SQUAD.find((m) => m.role === 'member1')!;
    const historySpec: Array<{
      code: string;
      placeKey: string;
      ageDays: number;
      roles: string[];
    }> = [
      {
        code: 'seed-spin-1',
        placeKey: 'sushi-yama',
        ageDays: 2,
        roles: ['organizer'],
      },
      {
        code: 'seed-spin-2',
        placeKey: 'taco-bravo',
        ageDays: 12,
        roles: ['organizer', 'member1'],
      },
      {
        code: 'seed-spin-3',
        placeKey: 'pho-lantern',
        ageDays: 40,
        roles: ['organizer'],
      },
      {
        code: 'seed-spin-4',
        placeKey: 'seoul-ember',
        ageDays: 6,
        roles: ['member1'],
      },
    ];

    for (const spec of historySpec) {
      const decidedAt = new Date(Date.now() - spec.ageDays * DAY_MS);
      const placeId = placeIdByKey.get(spec.placeKey)!;
      const fixture = PLACE_FIXTURES.find((f) => f.key === spec.placeKey)!;
      const lead = spec.roles[0] === 'member1' ? member1 : organizer;
      const doc: Omit<ForkDoc, '_id'> = {
        code: spec.code,
        organizer: {
          userId: userIdByRole.get(lead.role)!,
          displayName: lead.displayName,
        },
        source: { kind: 'list', listId: new ObjectId() },
        mode: 'spin',
        options: PLACE_FIXTURES.slice(0, 6).map((f) => ({
          placeId: placeIdByKey.get(f.key)!,
          googlePlaceId: `dev-${f.key}`,
          name: f.name,
        })),
        status: 'closed',
        closesAt: decidedAt,
        votes: [],
        result: {
          placeId,
          decidedAt,
          reasoning: `Seeded history: ${fixture.name} picked ${spec.ageDays} days ago.`,
          weights: {},
        },
        participantUserIds: spec.roles.map((role) => userIdByRole.get(role)!),
        participantGuestIds: [],
        createdAt: decidedAt,
        updatedAt: decidedAt,
      };
      await forks.insertOne(doc as ForkDoc);
    }
    console.log(`mongo: ${historySpec.length} history forks inserted`);

    // One unclaimed guest for guest-identity flows.
    const guests = db.collection<GuestDoc>(V2_COLLECTIONS.guests);
    await guests.updateOne(
      { guestId: 'seed-guest-gabi' },
      {
        $set: { displayName: 'Gabi', lastSeenAt: new Date() },
        $setOnInsert: { guestId: 'seed-guest-gabi', createdAt: new Date() },
      },
      { upsert: true }
    );
    console.log('mongo: guest upserted');

    console.log('\nSeed complete.');
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
