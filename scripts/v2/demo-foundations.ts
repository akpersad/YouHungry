/* eslint-disable no-console -- CLI script, console is the interface */
/**
 * Phase 1 exit demo (WORKPLAN): seeded data → fork → spin → persisted
 * result, end-to-end through the REAL v2 modules (schema/db/forks/engine),
 * with zero owner involvement:
 *
 *   npm run seed:v2-dev && npm run demo:v2-foundations
 *
 * Asserts, not just prints: options from the seeded list, decay weights
 * reflecting the seeded history (2d-old pick penalized, 12d partial,
 * 40d fully recovered), the result persisted on the fork doc, and the
 * fork closed. Exits non-zero on any violation.
 */
import { ObjectId } from 'mongodb';
import { V2_COLLECTIONS } from '../../src/lib/v2/schema';
import type { ListDoc, PlaceDoc, V2UserDoc } from '../../src/lib/v2/schema';
import { getV2Db } from '../../src/lib/v2/db';
import { createFork, spinFork } from '../../src/lib/v2/forks';

const PROD_DB_NAME = 'you-hungry';

try {
  process.loadEnvFile('.env.local');
} catch {
  // env may come from the shell
}

if (
  !process.env.MONGODB_DATABASE ||
  process.env.MONGODB_DATABASE === PROD_DB_NAME
) {
  console.error(
    'Refusing: MONGODB_DATABASE must point at a dev database (not the production one).'
  );
  process.exit(1);
}

function assert(condition: unknown, label: string): asserts condition {
  if (!condition) {
    console.error(`✗ ${label}`);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
}

async function main() {
  const { db } = await getV2Db();

  // --- Gather seeded data ---------------------------------------------------
  const organizerUser = await db
    .collection<V2UserDoc>(V2_COLLECTIONS.users)
    .findOne({ email: 'fitr.organizer+clerk_test@example.com' });
  assert(organizerUser, 'seeded organizer user found');

  const list = await db
    .collection<ListDoc>(V2_COLLECTIONS.lists)
    .findOne({ ownerId: organizerUser._id, name: 'Astoria favorites' });
  assert(list && list.placeIds.length === 6, 'seeded 6-place list found');

  const places = await db
    .collection<PlaceDoc>(V2_COLLECTIONS.places)
    .find({ _id: { $in: list.placeIds } })
    .toArray();
  const placeByIdString = new Map(places.map((p) => [p._id.toString(), p]));

  // --- Create a fork from the list -----------------------------------------
  const fork = await createFork({
    organizer: { userId: organizerUser._id, displayName: 'Olivia' },
    source: { kind: 'list', listId: list._id },
    mode: 'spin',
    options: places.map((place) => ({
      placeId: place._id,
      googlePlaceId: place.googlePlaceId,
      name: place.name,
    })),
  });
  assert(fork.status === 'open', `fork created open (code ${fork.code})`);
  assert(fork.options.length === 6, 'fork carries the 6 list options');

  // --- Spin ------------------------------------------------------------------
  const result = await spinFork(fork._id);
  const winner = placeByIdString.get(result.placeId.toString());
  assert(winner, `spin selected a real option: ${winner?.name}`);

  // --- Weights reflect the seeded history ------------------------------------
  const weightOf = (googleKey: string) => {
    const place = places.find((p) => p.googlePlaceId === googleKey);
    return place ? result.weights[place._id.toString()] : undefined;
  };
  const sushi = weightOf('dev-sushi-yama'); // picked 2 days ago
  const taco = weightOf('dev-taco-bravo'); // picked 12 days ago
  const pho = weightOf('dev-pho-lantern'); // picked 40 days ago
  assert(
    sushi !== undefined && sushi < 0.2,
    `2-day-old pick heavily penalized (sushi weight ${sushi?.toFixed(2)})`
  );
  assert(
    taco !== undefined && taco > 0.4 && taco < 0.6,
    `12-day-old pick partially recovered (taco weight ${taco?.toFixed(2)})`
  );
  assert(
    pho === 1,
    `40-day-old pick fully recovered (pho weight ${pho?.toFixed(2)})`
  );

  console.log('\nWeights at spin time:');
  for (const [placeId, weight] of Object.entries(result.weights)) {
    const name = placeByIdString.get(placeId)?.name ?? placeId;
    console.log(`  ${weight.toFixed(2)}  ${name}`);
  }

  // --- Persistence ------------------------------------------------------------
  const persisted = await db
    .collection(V2_COLLECTIONS.forks)
    .findOne({ _id: new ObjectId(fork._id.toString()) });
  assert(persisted?.status === 'closed', 'fork persisted as closed');
  assert(
    persisted?.result?.placeId?.toString() === result.placeId.toString(),
    'persisted result matches the spin'
  );

  console.log(`\nExit demo PASSED — ${winner!.name} it is. 🍴`);
  process.exit(0);
}

main().catch((error) => {
  console.error('Exit demo failed:', error);
  process.exit(1);
});
