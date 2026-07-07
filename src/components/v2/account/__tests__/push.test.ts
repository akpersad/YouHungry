import {
  isIos,
  isStandalone,
  pushSupported,
  toSubscriptionJson,
  urlBase64ToUint8Array,
} from '../push';

function setUserAgent(value: string) {
  Object.defineProperty(navigator, 'userAgent', {
    value,
    configurable: true,
  });
}

describe('urlBase64ToUint8Array', () => {
  it('decodes plain base64 to bytes', () => {
    expect(Array.from(urlBase64ToUint8Array('AQID'))).toEqual([1, 2, 3]);
  });

  it('handles url-safe characters and missing padding', () => {
    // '_w' is url-safe base64 for 0xFF ('/w==' in classic base64).
    expect(Array.from(urlBase64ToUint8Array('_w'))).toEqual([255]);
    // '-A' → '+A' → 0xF8.
    expect(Array.from(urlBase64ToUint8Array('-A'))).toEqual([248]);
  });
});

describe('pushSupported', () => {
  afterEach(() => {
    delete (navigator as { serviceWorker?: unknown }).serviceWorker;
    delete (window as { PushManager?: unknown }).PushManager;
    delete (window as { Notification?: unknown }).Notification;
  });

  it('is false when the APIs are missing (jsdom default)', () => {
    expect(pushSupported()).toBe(false);
  });

  it('is true when service worker, PushManager, and Notification exist', () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {},
      configurable: true,
    });
    (window as { PushManager?: unknown }).PushManager = function () {};
    (window as { Notification?: unknown }).Notification = function () {};
    expect(pushSupported()).toBe(true);
  });
});

describe('isIos', () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => setUserAgent(originalUserAgent));

  it('recognizes iPhone and iPad user agents', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    expect(isIos()).toBe(true);
    setUserAgent('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)');
    expect(isIos()).toBe(true);
  });

  it('rejects everything else', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    expect(isIos()).toBe(false);
  });
});

describe('isStandalone', () => {
  afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia;
    delete (navigator as { standalone?: boolean }).standalone;
  });

  it('is true when display-mode is standalone', () => {
    (window as { matchMedia?: unknown }).matchMedia = jest.fn(() => ({
      matches: true,
    }));
    expect(isStandalone()).toBe(true);
  });

  it('falls back to the iOS navigator.standalone flag', () => {
    (window as { matchMedia?: unknown }).matchMedia = jest.fn(() => ({
      matches: false,
    }));
    (navigator as { standalone?: boolean }).standalone = true;
    expect(isStandalone()).toBe(true);
  });

  it('is false in a plain browser tab', () => {
    (window as { matchMedia?: unknown }).matchMedia = jest.fn(() => ({
      matches: false,
    }));
    expect(isStandalone()).toBe(false);
  });
});

describe('toSubscriptionJson', () => {
  const asSubscription = (json: unknown) =>
    ({ toJSON: () => json }) as unknown as PushSubscription;

  it('keeps only the stored fields when everything is present', () => {
    expect(
      toSubscriptionJson(
        asSubscription({
          endpoint: 'https://push.example/ep',
          expirationTime: null,
          keys: { p256dh: 'p', auth: 'a', extra: 'dropped' },
        })
      )
    ).toEqual({
      endpoint: 'https://push.example/ep',
      keys: { p256dh: 'p', auth: 'a' },
    });
  });

  it('returns null when the endpoint or a key is missing', () => {
    expect(
      toSubscriptionJson(asSubscription({ keys: { p256dh: 'p', auth: 'a' } }))
    ).toBeNull();
    expect(
      toSubscriptionJson(
        asSubscription({ endpoint: 'https://push.example/ep', keys: {} })
      )
    ).toBeNull();
    expect(
      toSubscriptionJson(
        asSubscription({ endpoint: 'https://push.example/ep' })
      )
    ).toBeNull();
  });
});
