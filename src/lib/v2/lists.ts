import { ObjectId } from 'mongodb';
import type { Filter } from 'mongodb';
import { getV2Db } from './db';
import { V2DomainError, notFound } from './errors';
import { getPlacesByIds } from './places';
import { signListInviteToken, verifyListInviteToken } from './tokens';
import type { ListDoc, PlaceDoc } from './schema';

/**
 * Lists — v1's "collections", demoted from prerequisite to accelerant
 * (CHARTER lane 2). A list makes a fork faster; its absence never blocks
 * one. Saving is one concept: a place is saved BY being on a list — there
 * is no separate global "saved" flag to keep in sync.
 *
 * Shared lists (owner ask 2026-07-06): the owner mints a signed invite
 * link; whoever opens it signed-in becomes a collaborator. Collaborators
 * save/remove places and fork the list — the everyday work; rename,
 * delete, and inviting stay the owner's. Access is guarded in the query
 * itself (owner-or-collaborator, or owner-only), so a foreign list id
 * behaves exactly like a missing one (404, no existence leak). Caps are
 * abuse bounds, not product limits.
 */

export const MAX_LISTS_PER_OWNER = 100;
export const MAX_PLACES_PER_LIST = 200;
export const MAX_COLLABORATORS_PER_LIST = 20;

/** Owner or collaborator — the read/save/fork access level. */
function memberFilter(userId: ObjectId): Filter<ListDoc> {
  return { $or: [{ ownerId: userId }, { collaboratorIds: userId }] };
}

export function isListMember(list: ListDoc, userId: ObjectId): boolean {
  const uid = userId.toString();
  return (
    list.ownerId.toString() === uid ||
    (list.collaboratorIds ?? []).some((id) => id.toString() === uid)
  );
}

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
 * Collaborator work: any member saves.
 */
export async function savePlaceToList(
  userId: ObjectId,
  listId: ObjectId,
  placeId: ObjectId
): Promise<ListDoc> {
  const { lists, places } = await getV2Db();
  const place = await places.findOne({ _id: placeId });
  if (!place) throw notFound('Place');

  const result = await lists.findOneAndUpdate(
    {
      _id: listId,
      ...memberFilter(userId),
      $and: [
        {
          $or: [
            { placeIds: placeId }, // already saved → touch only updatedAt
            { [`placeIds.${MAX_PLACES_PER_LIST - 1}`]: { $exists: false } },
          ],
        },
      ],
    },
    { $addToSet: { placeIds: placeId }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (result) return result;

  // Distinguish "not yours/missing" from "full" for an honest message.
  const exists = await lists.findOne({ _id: listId, ...memberFilter(userId) });
  if (!exists) throw notFound('List');
  throw new V2DomainError(
    `That list is at ${MAX_PLACES_PER_LIST} places. Start a fresh one.`
  );
}

/** Remove a place from a list. Idempotent like saving; any member. */
export async function removePlaceFromList(
  userId: ObjectId,
  listId: ObjectId,
  placeId: ObjectId
): Promise<ListDoc> {
  const { lists } = await getV2Db();
  const result = await lists.findOneAndUpdate(
    { _id: listId, ...memberFilter(userId) },
    { $pull: { placeIds: placeId }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!result) throw notFound('List');
  return result;
}

/** Every list this user can work with: their own plus shared-with-them. */
export async function getListsForUser(userId: ObjectId): Promise<ListDoc[]> {
  const { lists } = await getV2Db();
  return lists.find(memberFilter(userId)).sort({ updatedAt: -1 }).toArray();
}

export interface ListWithPlaces {
  list: ListDoc;
  places: PlaceDoc[];
}

export async function getListWithPlaces(
  userId: ObjectId,
  listId: ObjectId
): Promise<ListWithPlaces> {
  const { lists } = await getV2Db();
  const list = await lists.findOne({ _id: listId, ...memberFilter(userId) });
  if (!list) throw notFound('List');
  return { list, places: await getPlacesByIds(list.placeIds) };
}

/**
 * Mint an invite token for a list. Owner-only: sharing a list is the
 * owner's call, like renaming or deleting it. The token is stateless —
 * nothing is stored, revocation is the 7-day expiry.
 */
export async function createListInvite(
  ownerId: ObjectId,
  listId: ObjectId
): Promise<string> {
  const { lists } = await getV2Db();
  const list = await lists.findOne({ _id: listId, ownerId });
  if (!list) throw notFound('List');
  return signListInviteToken(listId.toString());
}

/**
 * Resolve an invite token to what the landing page shows BEFORE joining:
 * the list's name and who shared it. Holding the link is what authorizes
 * this much (capability-URL semantics, like a fork link); joining still
 * requires signing in. Null for forged/expired tokens and deleted lists.
 */
export async function peekListInvite(
  token: string
): Promise<{ list: ListDoc; ownerFirstName: string } | null> {
  const listIdHex = verifyListInviteToken(token);
  if (!listIdHex) return null;
  const { lists, users } = await getV2Db();
  const list = await lists.findOne({ _id: new ObjectId(listIdHex) });
  if (!list) return null;
  const owner = await users.findOne({ _id: list.ownerId });
  const ownerFirstName = owner?.name.split(' ')[0] || 'Someone';
  return { list, ownerFirstName };
}

/**
 * Accept an invite link. The signed token IS the authorization (fork-link
 * DNA: a capability URL, no user search, no pending-invite state). One
 * atomic filter+update: the collaborator cap guard rides the query, and
 * re-joining (or the owner opening their own link) is idempotent success.
 */
export async function joinListByToken(
  userId: ObjectId,
  token: string
): Promise<ListDoc> {
  const listIdHex = verifyListInviteToken(token);
  if (!listIdHex) {
    throw new V2DomainError('That invite link is not right or has expired.');
  }
  const listId = new ObjectId(listIdHex);
  const { lists } = await getV2Db();

  const existing = await lists.findOne({ _id: listId });
  if (!existing) throw notFound('List');
  if (isListMember(existing, userId)) return existing; // already in

  const result = await lists.findOneAndUpdate(
    {
      _id: listId,
      [`collaboratorIds.${MAX_COLLABORATORS_PER_LIST - 1}`]: {
        $exists: false,
      },
    },
    {
      $addToSet: { collaboratorIds: userId },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' }
  );
  if (result) return result;
  throw new V2DomainError(
    `That list already has ${MAX_COLLABORATORS_PER_LIST} people. Ask the owner to start another.`
  );
}
