import { ObjectId } from 'mongodb';
import { getV2Db } from './db';
import { V2DomainError, notFound } from './errors';
import { getPlacesByIds } from './places';
import type { ListDoc, PlaceDoc } from './schema';

/**
 * Lists — v1's "collections", demoted from prerequisite to accelerant
 * (CHARTER lane 2). A list makes a fork faster; its absence never blocks
 * one. Saving is one concept: a place is saved BY being on a list — there
 * is no separate global "saved" flag to keep in sync.
 *
 * Every mutation is ownership-guarded in the query itself ({_id, ownerId}),
 * so a foreign list id behaves exactly like a missing one (404, no
 * existence leak). Caps are abuse bounds, not product limits.
 */

export const MAX_LISTS_PER_OWNER = 100;
export const MAX_PLACES_PER_LIST = 200;

export async function createList(
  ownerId: ObjectId,
  name: string
): Promise<ListDoc> {
  const { lists } = await getV2Db();
  const count = await lists.countDocuments({ ownerId });
  if (count >= MAX_LISTS_PER_OWNER) {
    throw new V2DomainError(
      `That's ${MAX_LISTS_PER_OWNER} lists. Retire one before starting another.`
    );
  }
  const now = new Date();
  const doc: ListDoc = {
    _id: new ObjectId(),
    ownerId,
    name,
    placeIds: [],
    createdAt: now,
    updatedAt: now,
  };
  await lists.insertOne(doc);
  return doc;
}

export async function renameList(
  ownerId: ObjectId,
  listId: ObjectId,
  name: string
): Promise<ListDoc> {
  const { lists } = await getV2Db();
  const result = await lists.findOneAndUpdate(
    { _id: listId, ownerId },
    { $set: { name, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!result) throw notFound('List');
  return result;
}

export async function deleteList(
  ownerId: ObjectId,
  listId: ObjectId
): Promise<void> {
  const { lists } = await getV2Db();
  const result = await lists.deleteOne({ _id: listId, ownerId });
  if (result.deletedCount === 0) throw notFound('List');
}

/**
 * Save a place to a list. Idempotent — saving what's already there is
 * success, not an error (the tap meant "make sure it's on the list").
 * The place must exist in the cache; the cap guard and the insert are one
 * atomic filter+update so racing saves can't blow past the bound.
 */
export async function savePlaceToList(
  ownerId: ObjectId,
  listId: ObjectId,
  placeId: ObjectId
): Promise<ListDoc> {
  const { lists, places } = await getV2Db();
  const place = await places.findOne({ _id: placeId });
  if (!place) throw notFound('Place');

  const result = await lists.findOneAndUpdate(
    {
      _id: listId,
      ownerId,
      $or: [
        { placeIds: placeId }, // already saved → touch nothing but updatedAt
        { [`placeIds.${MAX_PLACES_PER_LIST - 1}`]: { $exists: false } },
      ],
    },
    { $addToSet: { placeIds: placeId }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (result) return result;

  // Distinguish "not yours/missing" from "full" for an honest message.
  const exists = await lists.findOne({ _id: listId, ownerId });
  if (!exists) throw notFound('List');
  throw new V2DomainError(
    `That list is at ${MAX_PLACES_PER_LIST} places. Start a fresh one.`
  );
}

/** Remove a place from a list. Idempotent like saving. */
export async function removePlaceFromList(
  ownerId: ObjectId,
  listId: ObjectId,
  placeId: ObjectId
): Promise<ListDoc> {
  const { lists } = await getV2Db();
  const result = await lists.findOneAndUpdate(
    { _id: listId, ownerId },
    { $pull: { placeIds: placeId }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!result) throw notFound('List');
  return result;
}

export async function getListsForOwner(ownerId: ObjectId): Promise<ListDoc[]> {
  const { lists } = await getV2Db();
  return lists.find({ ownerId }).sort({ updatedAt: -1 }).toArray();
}

export interface ListWithPlaces {
  list: ListDoc;
  places: PlaceDoc[];
}

export async function getListWithPlaces(
  ownerId: ObjectId,
  listId: ObjectId
): Promise<ListWithPlaces> {
  const { lists } = await getV2Db();
  const list = await lists.findOne({ _id: listId, ownerId });
  if (!list) throw notFound('List');
  return { list, places: await getPlacesByIds(list.placeIds) };
}
