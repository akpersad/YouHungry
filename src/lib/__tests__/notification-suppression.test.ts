import { isExternalSendAllowed } from '../notification-suppression';

describe('isExternalSendAllowed', () => {
  const savedVercelEnv = process.env.VERCEL_ENV;
  const savedOverride = process.env.ALLOW_REAL_NOTIFICATIONS;

  afterEach(() => {
    if (savedVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = savedVercelEnv;
    if (savedOverride === undefined)
      delete process.env.ALLOW_REAL_NOTIFICATIONS;
    else process.env.ALLOW_REAL_NOTIFICATIONS = savedOverride;
  });

  it('suppresses when VERCEL_ENV is unset (local dev, CI, scripts)', () => {
    delete process.env.VERCEL_ENV;
    delete process.env.ALLOW_REAL_NOTIFICATIONS;
    expect(isExternalSendAllowed()).toBe(false);
  });

  it('suppresses on preview deployments', () => {
    process.env.VERCEL_ENV = 'preview';
    delete process.env.ALLOW_REAL_NOTIFICATIONS;
    expect(isExternalSendAllowed()).toBe(false);
  });

  it('allows in the production deployment', () => {
    process.env.VERCEL_ENV = 'production';
    delete process.env.ALLOW_REAL_NOTIFICATIONS;
    expect(isExternalSendAllowed()).toBe(true);
  });

  it('honors the explicit operator override', () => {
    delete process.env.VERCEL_ENV;
    process.env.ALLOW_REAL_NOTIFICATIONS = 'true';
    expect(isExternalSendAllowed()).toBe(true);
  });

  it('ignores non-"true" override values', () => {
    delete process.env.VERCEL_ENV;
    process.env.ALLOW_REAL_NOTIFICATIONS = '1';
    expect(isExternalSendAllowed()).toBe(false);
  });
});
