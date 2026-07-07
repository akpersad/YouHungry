import { ObjectId } from 'mongodb';
import {
  MAX_COLLABORATORS_PER_LIST,
  MAX_LISTS_PER_OWNER,
  MAX_PLACES_PER_LIST,
  createList,
  createListInvite,
  deleteList,
  getListWithPlaces,
  isListMember,
  joinListByToken,
  removePlaceFromList,
  renameList,
  savePlaceToList,
} from '../lists';
import {
  LIST_INVITE_TOKEN_TTL_MS,
  signListInviteToken,
  verifyListInviteToken,
} from '../tokens';
import { V2DomainError } from '../errors';
import type { ListDoc } from '../schema';

jest.mock('../db', () => ({
  getV2Db: jest.fn(),
}));

jest.mock('../places', () => ({
  getPlacesByIds: jest.fn().mockResolvedValue([]),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getV2Db } = require('../db');

const OWNER = new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa');
const LIST_ID = new ObjectId('bbbbbbbbbbbbbbbbbbbbbbbb');
const PLACE_ID = new ObjectId('cccccccccccccccccccccccc');

function listDoc(overrides: Partial<ListDoc> = {}): ListDoc {
  const now = new Date();
  return {
    _id: LIST_ID,
    ownerId: OWNER,
    name: 'Astoria favorites',
    placeIds: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

interface Stubs {
  lists: {
    countDocuments: jest.Mock;
    insertOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    findOne: jest.Mock;
    deleteOne: jest.Mock;
    find: jest.Mock;
  };
  places: { findOne: jest.Mock };
}

function mockDb(overrides: Partial<Stubs['lists']> = {}): Stubs {
  const stubs: Stubs = {
    lists: {
      countDocuments: jest.fn().mockResolvedValue(0),
      insertOne: jest.fn().mockResolvedValue({}),
      findOneAndUpdate: jest.fn().mockResolvedValue(listDoc()),
      findOne: jest.fn().mockResolvedValue(listDoc()),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([]),
      }),
      ...overrides,
    },
    places: { findOne: jest.fn().mockResolvedValue({ _id: PLACE_ID }) },
  };
  (getV2Db as jest.Mock).mockResolvedValue(stubs);
  return stubs;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createList', () => {
  it('inserts an empty list owned by the caller', async () => {
    const stubs = mockDb();
    const list = await createList(OWNER, 'Date night');
    expect(list.ownerId).toBe(OWNER);
    expect(list.placeIds).toEqual([]);
    expect(stubs.lists.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Date night' })
    );
  });

  it('refuses list number MAX_LISTS_PER_OWNER + 1 with an honest message', async () => {
    mockDb({
      countDocuments: jest.fn().mockResolvedValue(MAX_LISTS_PER_OWNER),
    });
    await expect(createList(OWNER, 'One too many')).rejects.toThrow(
      V2DomainError
    );
  });
});

describe('ownership guards (foreign = missing = 404)', () => {
  it('renameList 404s when the filter misses', async () => {
    mockDb({ findOneAndUpdate: jest.fn().mockResolvedValue(null) });
    await expect(renameList(OWNER, LIST_ID, 'New name')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('rename filters on BOTH id and owner', async () => {
    const stubs = mockDb();
    await renameList(OWNER, LIST_ID, 'New name');
    expect(stubs.lists.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: LIST_ID, ownerId: OWNER },
      expect.anything(),
      expect.anything()
    );
  });

  it('deleteList 404s when nothing matches', async () => {
    mockDb({ deleteOne: jest.fn().mockResolvedValue({ deletedCount: 0 }) });
    await expect(deleteList(OWNER, LIST_ID)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('getListWithPlaces 404s for a foreign list', async () => {
    mockDb({ findOne: jest.fn().mockResolvedValue(null) });
    await expect(getListWithPlaces(OWNER, LIST_ID)).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe('savePlaceToList', () => {
  it('404s when the place is not in the cache', async () => {
    const stubs = mockDb();
    stubs.places.findOne.mockResolvedValue(null);
    await expect(
      savePlaceToList(OWNER, LIST_ID, PLACE_ID)
    ).rejects.toMatchObject({ status: 404 });
    expect(stubs.lists.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('adds via $addToSet with member access and the cap guard in one filter', async () => {
    const stubs = mockDb();
    await savePlaceToList(OWNER, LIST_ID, PLACE_ID);
    const [filter, update] = stubs.lists.findOneAndUpdate.mock.calls[0];
    expect(filter._id).toBe(LIST_ID);
    expect(filter.$or).toEqual([
      { ownerId: OWNER },
      { collaboratorIds: OWNER },
    ]);
    expect(filter.$and).toEqual([
      {
        $or: [
          { placeIds: PLACE_ID },
          { [`placeIds.${MAX_PLACES_PER_LIST - 1}`]: { $exists: false } },
        ],
      },
    ]);
    expect(update.$addToSet).toEqual({ placeIds: PLACE_ID });
  });

  it('says "full" only when the list exists but is at the cap', async () => {
    const stubs = mockDb({
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
      findOne: jest.fn().mockResolvedValue(listDoc()),
    });
    await expect(savePlaceToList(OWNER, LIST_ID, PLACE_ID)).rejects.toThrow(
      /fresh one/
    );
    expect(stubs.lists.findOne).toHaveBeenCalledWith({
      _id: LIST_ID,
      $or: [{ ownerId: OWNER }, { collaboratorIds: OWNER }],
    });
  });

  it("404s when the update missed because the list is not the caller's", async () => {
    mockDb({
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
      findOne: jest.fn().mockResolvedValue(null),
    });
    await expect(
      savePlaceToList(OWNER, LIST_ID, PLACE_ID)
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe('removePlaceFromList', () => {
  it('pulls the place with member access and touches updatedAt', async () => {
    const stubs = mockDb();
    await removePlaceFromList(OWNER, LIST_ID, PLACE_ID);
    const [filter, update] = stubs.lists.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({
      _id: LIST_ID,
      $or: [{ ownerId: OWNER }, { collaboratorIds: OWNER }],
    });
    expect(update.$pull).toEqual({ placeIds: PLACE_ID });
    expect(update.$set.updatedAt).toBeInstanceOf(Date);
  });
});

describe('shared lists (invite + join)', () => {
  const COLLABORATOR = new ObjectId('dddddddddddddddddddddddd');

  beforeEach(() => {
    process.env.V2_TOKEN_SECRET = 'test-secret';
  });

  it('createListInvite is owner-only and mints a verifiable token', async () => {
    const stubs = mockDb();
    const token = await createListInvite(OWNER, LIST_ID);
    expect(stubs.lists.findOne).toHaveBeenCalledWith({
      _id: LIST_ID,
      ownerId: OWNER,
    });
    expect(verifyListInviteToken(token)).toBe(LIST_ID.toString());
  });

  it('createListInvite 404s for a collaborator or stranger', async () => {
    mockDb({ findOne: jest.fn().mockResolvedValue(null) });
    await expect(createListInvite(COLLABORATOR, LIST_ID)).rejects.toMatchObject(
      { status: 404 }
    );
  });

  it('joinListByToken adds a collaborator under the cap guard', async () => {
    const stubs = mockDb();
    const token = signListInviteToken(LIST_ID.toString());

    await joinListByToken(COLLABORATOR, token);

    const [filter, update] = stubs.lists.findOneAndUpdate.mock.calls[0];
    expect(filter._id.toString()).toBe(LIST_ID.toString());
    expect(filter[`collaboratorIds.${MAX_COLLABORATORS_PER_LIST - 1}`]).toEqual(
      { $exists: false }
    );
    expect(update.$addToSet).toEqual({ collaboratorIds: COLLABORATOR });
  });

  it('joining a list you own or are already on is idempotent success', async () => {
    const stubs = mockDb({
      findOne: jest
        .fn()
        .mockResolvedValue(listDoc({ collaboratorIds: [COLLABORATOR] })),
    });
    const token = signListInviteToken(LIST_ID.toString());

    await joinListByToken(OWNER, token); // owner opens own link
    await joinListByToken(COLLABORATOR, token); // re-join
    expect(stubs.lists.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('rejects forged and expired tokens with an honest message', async () => {
    mockDb();
    await expect(
      joinListByToken(COLLABORATOR, 'garbage.token')
    ).rejects.toThrow(/invite link/);

    const expired = signListInviteToken(
      LIST_ID.toString(),
      new Date(Date.now() - LIST_INVITE_TOKEN_TTL_MS - 1000)
    );
    await expect(joinListByToken(COLLABORATOR, expired)).rejects.toThrow(
      /invite link/
    );
  });

  it('404s when the invited list has since been deleted', async () => {
    mockDb({ findOne: jest.fn().mockResolvedValue(null) });
    const token = signListInviteToken(LIST_ID.toString());
    await expect(joinListByToken(COLLABORATOR, token)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('caps collaborators with an honest message', async () => {
    mockDb({
      findOne: jest.fn().mockResolvedValue(listDoc()),
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
    });
    const token = signListInviteToken(LIST_ID.toString());
    await expect(joinListByToken(COLLABORATOR, token)).rejects.toThrow(
      /already has/
    );
  });
});

describe('isListMember', () => {
  const COLLABORATOR = new ObjectId('dddddddddddddddddddddddd');
  const STRANGER = new ObjectId('eeeeeeeeeeeeeeeeeeeeeeee');

  it('owners and collaborators are members; strangers are not', () => {
    const list = listDoc({ collaboratorIds: [COLLABORATOR] });
    expect(isListMember(list, OWNER)).toBe(true);
    expect(isListMember(list, COLLABORATOR)).toBe(true);
    expect(isListMember(list, STRANGER)).toBe(false);
  });
});
