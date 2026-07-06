// Fork In The Road service worker (Phase 8).
//
// This file MUST keep this name and scope: it took over the URL of v1's
// cache-first worker (via the Phase 7 self-destruct), and any future
// replacement takes over from this one the same way.
//
// Deliberately conservative — this repo has been burned by stale-chunk
// caching before (see HANDOFF, Phase 4 C7):
//   - cache-first ONLY for content-hashed /_next/static and the icon set
//     (registration is production-only, where those filenames are hashed)
//   - navigations are network-first; the cache is an offline fallback,
//     never a source of staleness while online
//   - /api is NEVER touched (auth-varying JSON, SSE streams)
const VERSION = 'v1';
const STATIC_CACHE = `fitr-static-${VERSION}`;
const PAGES_CACHE = `fitr-pages-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE];
const OFFLINE_URL = '/offline';
const MAX_STATIC_ENTRIES = 160;
const MAX_PAGE_ENTRIES = 40;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGES_CACHE);
      // 'reload' bypasses the HTTP cache so the precached fallback is
      // the deployed one, not whatever the browser had lying around.
      await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              (key.startsWith('fitr-') || key.startsWith('forkintheroad-')) &&
              !CURRENT_CACHES.includes(key)
          )
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Drop the oldest entries once a cache outgrows its bound (cache keys
// iterate in insertion order).
async function trim(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i]);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
    trim(STATIC_CACHE, MAX_STATIC_ENTRIES);
  }
  return response;
}

async function pageNetworkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES_CACHE);
      await cache.put(request, response.clone());
      trim(PAGES_CACHE, MAX_PAGE_ENTRIES);
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    throw error;
  }
}

// Web push: the server sends exactly one notification kind — the fork
// result ("We're going here.", lib/v2/notifications.ts). The payload is
// JSON {title, body, tag, data.url}; the tag collapses duplicate sends for
// the same fork into one notification.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    return; // not ours — never show a mystery notification
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'Fork In The Road', {
      body: payload.body || '',
      tag: payload.tag,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: payload.data || {},
    })
  );
});

// Tap-through: focus an open app window on the fork page, or open one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin)
    .href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      const client = windows.find((c) => 'navigate' in c && 'focus' in c);
      if (client) {
        await client.navigate(url);
        return client.focus();
      }
      return self.clients.openWindow(url);
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/apple-touch-icon.png'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigations: fresh while online, last-known copy offline, then the
  // offline page. /admin stays out of the cache (owner-only data).
  if (request.mode === 'navigate' && !url.pathname.startsWith('/admin')) {
    event.respondWith(pageNetworkFirst(request));
  }
});
