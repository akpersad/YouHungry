/**
 * Browser-side web-push plumbing for the account page. Everything here is
 * feature-detected: the page renders an honest state for browsers that
 * can't do push (no service worker, no PushManager, iOS outside the
 * installed app) instead of a dead button.
 */

/**
 * PushManager.subscribe wants the VAPID public key as raw bytes. Typed over
 * a plain ArrayBuffer because TS 5.9's BufferSource excludes the
 * SharedArrayBuffer-capable Uint8Array default.
 */
export function urlBase64ToUint8Array(
  base64String: string
): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Every iOS browser is WebKit; push only works from the Home Screen app.
export function isIos(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      (navigator as { standalone?: boolean }).standalone === true)
  );
}

/** The subscription fields the API stores (schema.ts shape). */
export interface PushSubscriptionJson {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export function toSubscriptionJson(
  subscription: PushSubscription
): PushSubscriptionJson | null {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null;
  return {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  };
}
