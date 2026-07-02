import { rankOf, toggleRank } from '../ranking';

describe('toggleRank', () => {
  it('appends up to three, ignores a fourth, removes on re-tap', () => {
    let r: string[] = [];
    r = toggleRank(r, 'a');
    r = toggleRank(r, 'b');
    r = toggleRank(r, 'c');
    expect(r).toEqual(['a', 'b', 'c']);
    expect(toggleRank(r, 'd')).toEqual(['a', 'b', 'c']); // full ballot
    expect(toggleRank(r, 'b')).toEqual(['a', 'c']); // c moves up
  });
});

describe('rankOf', () => {
  it('is 1-based and null when unranked', () => {
    expect(rankOf(['a', 'b'], 'a')).toBe(1);
    expect(rankOf(['a', 'b'], 'b')).toBe(2);
    expect(rankOf(['a', 'b'], 'z')).toBeNull();
  });
});
