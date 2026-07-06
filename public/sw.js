// Self-destructing service worker (Phase 7 cutover).
//
// v1 registered a cache-first worker at scope '/'; any browser that ever
// visited v1 in production still runs it and would serve dead v1 chunks
// against the v2 app forever. Browsers re-fetch this file on navigation,
// so shipping this in its place makes every returning client unregister,
// drop the old caches, and reload onto plain network. The v2 PWA story
// (a real worker again) is Phase 8 — it must keep this filename so the
// same update path applies.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('forkintheroad-'))
          .map((key) => caches.delete(key))
      );
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
