import {
  clerkErrorMentionsParam,
  clerkErrorMessage,
  deriveUsername,
} from '../clerk-errors';
import { safeNextPath } from '../next-param';

describe('clerkErrorMessage', () => {
  it('prefers the long message, then message, then the fallback', () => {
    const err = {
      errors: [{ message: 'short', longMessage: 'Long explanation.' }],
    };
    expect(clerkErrorMessage(err, 'fb')).toBe('Long explanation.');
    expect(clerkErrorMessage({ errors: [{ message: 'short' }] }, 'fb')).toBe(
      'short'
    );
    expect(clerkErrorMessage(new Error('x'), 'fb')).toBe('fb');
    expect(clerkErrorMessage(undefined, 'fb')).toBe('fb');
  });
});

describe('clerkErrorMentionsParam', () => {
  it('detects the offending param', () => {
    const err = { errors: [{ meta: { paramName: 'username' } }] };
    expect(clerkErrorMentionsParam(err, 'username')).toBe(true);
    expect(clerkErrorMentionsParam(err, 'password')).toBe(false);
    expect(clerkErrorMentionsParam(new Error('x'), 'username')).toBe(false);
  });
});

describe('deriveUsername', () => {
  it('builds a valid username from the email local part', () => {
    const username = deriveUsername('olivia.organizer+tag@example.com');
    // 4–64 chars, alphanumeric + underscore/hyphen (v1 instance rule).
    expect(username).toMatch(/^[a-z0-9_-]{4,64}$/);
    expect(username.startsWith('oliviaorganizertag_')).toBe(true);
  });

  it('pads very short local parts', () => {
    expect(deriveUsername('x@example.com')).toMatch(/^x000_/);
  });
});

describe('safeNextPath', () => {
  it('honors same-app paths and rejects everything else', () => {
    expect(safeNextPath('/f/abc123defg')).toBe('/f/abc123defg');
    expect(safeNextPath('/')).toBe('/');
    expect(safeNextPath('/places')).toBe('/places');
    expect(safeNextPath('https://evil.example')).toBe('/');
    expect(safeNextPath('//evil.example')).toBe('/');
    expect(safeNextPath(null)).toBe('/');
  });
});
