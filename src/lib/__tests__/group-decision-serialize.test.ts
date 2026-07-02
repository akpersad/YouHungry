import { ObjectId } from 'mongodb';
import { buildVoteBreakdown, serializeGroupDecision } from '../decisions';
import { Decision } from '@/types/database';

// The jest mongodb mock stringifies argument-less ObjectIds to a shared
// constant, so give each restaurant an explicit, distinct hex id.
const r1 = new ObjectId('aaaaaaaaaaaaaaaaaaaaaaa1');
const r2 = new ObjectId('aaaaaaaaaaaaaaaaaaaaaaa2');
const r3 = new ObjectId('aaaaaaaaaaaaaaaaaaaaaaa3');
const r4 = new ObjectId('aaaaaaaaaaaaaaaaaaaaaaa4');

describe('buildVoteBreakdown', () => {
  it('returns an empty tally when there are no votes', () => {
    expect(buildVoteBreakdown(undefined)).toEqual({});
    expect(buildVoteBreakdown([])).toEqual({});
  });

  it('scores 1st/2nd/3rd as 3/2/1 points', () => {
    const breakdown = buildVoteBreakdown([
      { userId: 'a', rankings: [r1, r2, r3], submittedAt: new Date() },
      { userId: 'b', rankings: [r1, r3], submittedAt: new Date() },
    ]);

    expect(breakdown[r1.toString()]).toEqual({
      first: 2,
      second: 0,
      third: 0,
      total: 6,
    });
    expect(breakdown[r2.toString()]).toEqual({
      first: 0,
      second: 1,
      third: 0,
      total: 2,
    });
    expect(breakdown[r3.toString()]).toEqual({
      first: 0,
      second: 1,
      third: 1,
      total: 3,
    });
  });

  it('ignores ranks beyond the top 3 (matches the live scorer)', () => {
    const breakdown = buildVoteBreakdown([
      { userId: 'a', rankings: [r1, r2, r3, r4], submittedAt: new Date() },
    ]);
    expect(breakdown[r4.toString()]).toBeUndefined();
  });
});

describe('serializeGroupDecision', () => {
  const baseDecision: Decision = {
    _id: new ObjectId(),
    type: 'group',
    collectionId: new ObjectId(),
    groupId: new ObjectId(),
    participants: ['user_1', 'user_2'],
    method: 'tiered',
    status: 'active',
    deadline: new Date('2024-01-02T00:00:00Z'),
    visitDate: new Date('2024-01-01T18:00:00Z'),
    votes: [
      { userId: 'user_1', rankings: [r1, r2], submittedAt: new Date() },
      { userId: 'user_2', rankings: [r2, r1], submittedAt: new Date() },
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  it('strips individual ballots but exposes an aggregated breakdown', () => {
    const result = serializeGroupDecision(baseDecision);
    expect(result.votes).toEqual([
      expect.objectContaining({ userId: 'user_1', hasRankings: true }),
      expect.objectContaining({ userId: 'user_2', hasRankings: true }),
    ]);
    // No raw rankings leak through the votes array.
    expect(JSON.stringify(result.votes)).not.toContain(r1.toString());
    expect(result.voteBreakdown[r1.toString()].total).toBe(5);
    expect(result.voteBreakdown[r2.toString()].total).toBe(5);
  });

  it('returns only the requesting user’s own rankings (V5)', () => {
    const result = serializeGroupDecision(baseDecision, 'user_1');
    expect(result.myRankings).toEqual([r1.toString(), r2.toString()]);
  });

  it('returns no rankings when the requester has not voted', () => {
    const result = serializeGroupDecision(baseDecision, 'user_999');
    expect(result.myRankings).toEqual([]);
  });

  it('serializes the result and dates to strings', () => {
    const completed: Decision = {
      ...baseDecision,
      status: 'completed',
      result: {
        restaurantId: r1,
        selectedAt: new Date('2024-01-01T20:00:00Z'),
        reasoning: 'Clear winner',
      },
    };
    const result = serializeGroupDecision(completed);
    expect(result.result).toEqual({
      restaurantId: r1.toString(),
      selectedAt: '2024-01-01T20:00:00.000Z',
      reasoning: 'Clear winner',
    });
    expect(result.deadline).toBe('2024-01-02T00:00:00.000Z');
  });
});
