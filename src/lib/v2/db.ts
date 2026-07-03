import type { Collection, Db } from 'mongodb';
import { connectToDatabase } from '../db';
import {
  V2_COLLECTIONS,
  type CrewDoc,
  type ForkDoc,
  type GuestDoc,
  type ListDoc,
  type PlaceDoc,
  type PlaceQueryDoc,
  type V2UserDoc,
} from './schema';

/**
 * Typed accessors for the v2 collections. Same cluster/database as v1
 * (`MONGODB_DATABASE` — pointed at a separate dev database locally), new
 * collection names — see schema.ts for the model and index definitions.
 */

export interface V2Db {
  db: Db;
  forks: Collection<ForkDoc>;
  places: Collection<PlaceDoc>;
  placeQueries: Collection<PlaceQueryDoc>;
  lists: Collection<ListDoc>;
  crews: Collection<CrewDoc>;
  guests: Collection<GuestDoc>;
  users: Collection<V2UserDoc>;
}

export async function getV2Db(): Promise<V2Db> {
  const db = await connectToDatabase();
  return {
    db,
    forks: db.collection<ForkDoc>(V2_COLLECTIONS.forks),
    places: db.collection<PlaceDoc>(V2_COLLECTIONS.places),
    placeQueries: db.collection<PlaceQueryDoc>(V2_COLLECTIONS.placeQueries),
    lists: db.collection<ListDoc>(V2_COLLECTIONS.lists),
    crews: db.collection<CrewDoc>(V2_COLLECTIONS.crews),
    guests: db.collection<GuestDoc>(V2_COLLECTIONS.guests),
    users: db.collection<V2UserDoc>(V2_COLLECTIONS.users),
  };
}
