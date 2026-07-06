import { ObjectId } from 'mongodb';
import { isAdminUser } from '../admin';
import type { V2UserDoc } from '../schema';

function makeUser(id: string): V2UserDoc {
  return {
    _id: new ObjectId(id),
    clerkId: 'user_abc',
    email: 'a@example.com',
    name: 'A',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const ADMIN_ID = '68d9b010a25dec569c34c111';
const OTHER_ID = '68d9ae3528a9bab6c334d9f9';

describe('isAdminUser', () => {
  const original = process.env.ADMIN_USER_IDS;
  afterEach(() => {
    if (original === undefined) delete process.env.ADMIN_USER_IDS;
    else process.env.ADMIN_USER_IDS = original;
  });

  it('matches ids in the comma-separated list (whitespace tolerated)', () => {
    process.env.ADMIN_USER_IDS = ` ${ADMIN_ID} , ${OTHER_ID}`;
    expect(isAdminUser(makeUser(ADMIN_ID))).toBe(true);
    expect(isAdminUser(makeUser(OTHER_ID))).toBe(true);
  });

  it('rejects ids not in the list', () => {
    process.env.ADMIN_USER_IDS = ADMIN_ID;
    expect(isAdminUser(makeUser(OTHER_ID))).toBe(false);
  });

  it('rejects everyone when the env var is unset', () => {
    delete process.env.ADMIN_USER_IDS;
    expect(isAdminUser(makeUser(ADMIN_ID))).toBe(false);
  });
});
