/* eslint-disable no-console -- CLI script, console is the interface */
/**
 * One-time v1 → v2 data migration (WORKPLAN Phase 7).
 *
 *   npm run migrate:v1            # DRY RUN — reads v1, writes nothing, prints the report
 *   npm run migrate:v1 -- --execute --into <db-name>
 *                                 # real run; --into must match MONGODB_DATABASE exactly
 *
 * What it does (see src/lib/v2/migration.ts for every mapping rule):
 *   restaurants → places, collections → lists, groups (with decision
 *   history) → crews, completed decisions → closed forks with weights and
 *   decidedAt preserved. `users` is shared with v2 and is NOT touched.
 *   No v1 collection is ever written or dropped by this script.
 *
 * Safety: dry-run is the default and is strictly read-only. The real run
 * demands the target db name typed back via --into. Writes are idempotent
 * upserts keyed on the reused v1 _id (places: googlePlaceId), so re-running
 * after a partial failure is safe. Run the dry run against a prod snapshot
 * and get owner sign-off BEFORE --execute (the Phase 7 merge gate).
 */
import { MongoClient, ObjectId } from 'mongodb';
import {
  V2_COLLECTIONS,
  ensureV2Indexes,
  type CrewDoc,
  type ListDoc,
  type PlaceDoc,
} from '../../src/lib/v2/schema';
import { mintForkCode } from '../../src/lib/v2/tokens';
import {
  buildPlaceIndex,
  collectionToList,
  decisionToFork,
  groupToCrew,
  isSkip,
  restaurantToPlace,
  type ForkMigration,
  type ListMigration,
  type MigrationSkip,
  type V1Collection,
  type V1Decision,
  type V1Group,
  type V1Restaurant,
  type V1UserLean,
} from '../../src/lib/v2/migration';

try {
  process.loadEnvFile('.env.local');
} catch {
  // Fine — env may come from the shell.
}

const args = process.argv.slice(2);
const execute = args.includes('--execute');
const intoIndex = args.indexOf('--into');
const intoDb = intoIndex >= 0 ? args[intoIndex + 1] : undefined;

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE;
if (!mongoUri || !dbName) {
  console.error('Missing env: need MONGODB_URI and MONGODB_DATABASE.');
  process.exit(1);
}
if (execute && intoDb !== dbName) {
  console.error(
    `--execute requires typing the target back: --into ${dbName}\n` +
      '(this is the confirmation step; dry run needs no flags)'
  );
  process.exit(1);
}

function section(title: string): void {
  console.log(`\n=== ${title} ===`);
}

function reportSkips(label: string, skips: MigrationSkip[]): void {
  if (skips.length === 0) return;
  const byReason = new Map<string, string[]>();
  for (const skip of skips) {
    const ids = byReason.get(skip.reason) ?? [];
    ids.push(skip.id);
    byReason.set(skip.reason, ids);
  }
  console.log(`  skipped ${skips.length} ${label}:`);
  for (const [reason, ids] of byReason) {
    const sample = ids.slice(0, 5).join(', ');
    console.log(
      `    - ${reason}: ${ids.length}` +
        (ids.length > 5 ? ` (e.g. ${sample}, …)` : ` (${sample})`)
    );
  }
}

async function main(): Promise<void> {
  console.log(
    `v1 → v2 migration ${execute ? 'EXECUTE' : 'DRY RUN (no writes)'} ` +
      `against db "${dbName}"`
  );
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const db = client.db(dbName);

  try {
    // -- Read all of v1 (lean projections) --------------------------------
    const [users, restaurants, collections, groups, decisions] =
      await Promise.all([
        db
          .collection<V1UserLean>('users')
          .find({}, { projection: { clerkId: 1, name: 1, email: 1 } })
          .toArray(),
        db.collection<V1Restaurant>('restaurants').find({}).toArray(),
        db.collection<V1Collection>('collections').find({}).toArray(),
        db.collection<V1Group>('groups').find({}).toArray(),
        db.collection<V1Decision>('decisions').find({}).toArray(),
      ]);

    section('v1 source counts');
    console.log(
      `  users ${users.length} · restaurants ${restaurants.length} · ` +
        `collections ${collections.length} · groups ${groups.length} · ` +
        `decisions ${decisions.length}`
    );

    const now = new Date();
    const usersById = new Map(users.map((u) => [u._id.toString(), u]));
    const usersByClerkId = new Map(users.map((u) => [u.clerkId, u]));
    const groupsById = new Map(groups.map((g) => [g._id.toString(), g]));

    // -- restaurants → places ---------------------------------------------
    const places: PlaceDoc[] = [];
    const placeSkips: MigrationSkip[] = [];
    for (const restaurant of restaurants) {
      const mapped = restaurantToPlace(restaurant, now);
      if (isSkip(mapped)) placeSkips.push(mapped);
      else places.push(mapped);
    }
    const index = buildPlaceIndex(places);
    section('restaurants → places');
    console.log(`  ${places.length} places`);
    reportSkips('restaurants', placeSkips);

    // -- collections → lists ----------------------------------------------
    const listMigrations: ListMigration[] = [];
    const listSkips: MigrationSkip[] = [];
    for (const collection of collections) {
      const mapped = collectionToList(
        collection,
        { index, groupsById, usersById },
        now
      );
      if (isSkip(mapped)) listSkips.push(mapped);
      else listMigrations.push(mapped);
    }
    const listsByCollectionId = new Map<string, ListDoc>(
      listMigrations.map((m) => [m.list._id.toString(), m.list])
    );
    const droppedRefs = listMigrations.reduce(
      (sum, m) => sum + m.droppedPlaceRefs,
      0
    );
    section('collections → lists');
    console.log(
      `  ${listMigrations.length} lists` +
        (droppedRefs > 0
          ? ` (${droppedRefs} unresolvable place refs dropped)`
          : '')
    );
    reportSkips('collections', listSkips);

    // -- groups → crews (only groups with completed decision history) ------
    const groupIdsWithHistory = new Set(
      decisions
        .filter((d) => d.status === 'completed' && d.groupId)
        .map((d) => d.groupId!.toString())
    );
    const crews: CrewDoc[] = [];
    const crewSkips: MigrationSkip[] = [];
    for (const group of groups) {
      if (!groupIdsWithHistory.has(group._id.toString())) {
        crewSkips.push({
          id: group._id.toString(),
          reason: 'no completed decisions (crews emerge from decisions)',
        });
        continue;
      }
      const mapped = groupToCrew(group, usersById, now);
      if (isSkip(mapped)) crewSkips.push(mapped);
      else crews.push(mapped);
    }
    const crewsByGroupId = new Map(crews.map((c) => [c._id.toString(), c]));
    section('groups → crews');
    console.log(`  ${crews.length} crews`);
    reportSkips('groups', crewSkips);

    // -- decisions → forks --------------------------------------------------
    const forkMigrations: ForkMigration[] = [];
    const forkSkips: MigrationSkip[] = [];
    for (const decision of decisions) {
      const mapped = decisionToFork(
        decision,
        {
          index,
          usersByClerkId,
          usersById,
          listsByCollectionId,
          crewsByGroupId,
        },
        now
      );
      if (isSkip(mapped)) forkSkips.push(mapped);
      else forkMigrations.push(mapped);
    }
    const droppedVotes = forkMigrations.reduce(
      (sum, m) => sum + m.droppedVotes,
      0
    );
    const crewForks = forkMigrations.filter((m) => m.fork.crewId).length;
    section('decisions → forks');
    console.log(
      `  ${forkMigrations.length} closed forks ` +
        `(${crewForks} carry a crewId for shared weights)` +
        (droppedVotes > 0 ? `; ${droppedVotes} unresolvable votes dropped` : '')
    );
    reportSkips('decisions', forkSkips);

    if (!execute) {
      section('dry run complete');
      console.log(
        '  Nothing was written. Re-run with --execute --into ' +
          `${dbName} after owner sign-off.`
      );
      return;
    }

    // -- Writes (idempotent upserts on the reused v1 _id) -------------------
    section('writing');
    await ensureV2Indexes(db);

    const placesCol = db.collection<PlaceDoc>(V2_COLLECTIONS.places);
    for (const place of places) {
      const { _id, ...rest } = place;
      await placesCol.updateOne(
        { googlePlaceId: place.googlePlaceId },
        { $setOnInsert: { _id }, $set: rest },
        { upsert: true }
      );
    }
    console.log(`  places upserted: ${places.length}`);

    const listsCol = db.collection<ListDoc>(V2_COLLECTIONS.lists);
    for (const { list } of listMigrations) {
      const { _id, ...rest } = list;
      await listsCol.updateOne({ _id }, { $set: rest }, { upsert: true });
    }
    console.log(`  lists upserted: ${listMigrations.length}`);

    const crewsCol = db.collection<CrewDoc>(V2_COLLECTIONS.crews);
    for (const crew of crews) {
      const { _id, ...rest } = crew;
      await crewsCol.updateOne({ _id }, { $set: rest }, { upsert: true });
    }
    console.log(`  crews upserted: ${crews.length}`);

    const forksCol = db.collection(V2_COLLECTIONS.forks);
    let forksWritten = 0;
    for (const { fork } of forkMigrations) {
      const { _id, ...rest } = fork;
      // Existing docs keep their code; new docs mint one. A random-code
      // collision trips the unique index — retry with a fresh code.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await forksCol.updateOne(
            { _id: _id as ObjectId },
            { $set: rest, $setOnInsert: { code: mintForkCode() } },
            { upsert: true }
          );
          forksWritten += 1;
          break;
        } catch (error) {
          const isDuplicateCode =
            typeof error === 'object' &&
            error !== null &&
            (error as { code?: unknown }).code === 11000 &&
            attempt < 2;
          if (!isDuplicateCode) throw error;
        }
      }
    }
    console.log(`  forks upserted: ${forksWritten}`);

    section('execute complete');
    console.log(
      '  v1 collections were read, never written. Archive + drop them ' +
        'separately after cutover verification.'
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
