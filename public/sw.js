// Service Worker for You Hungry? PWA
const CACHE_NAME = 'you-hungry-v1';
const STATIC_CACHE_NAME = 'you-hungry-static-v1';
const DYNAMIC_CACHE_NAME = 'you-hungry-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/restaurants',
  '/groups',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME
            ) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache for API requests
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            // Return offline page for API requests
            return new Response(
              JSON.stringify({
                error: 'Offline',
                message:
                  'You are currently offline. Please check your connection.',
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // Handle page requests with cache-first strategy
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(request)
          .then((response) => {
            // Cache successful page responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Return offline page
            return caches.match('/').then((response) => {
              if (response) {
                return response;
              }
              return new Response(
                `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>You Hungry? - Offline</title>
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <style>
                        body { 
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                          margin: 0; padding: 20px; background: #f5f5f5; 
                          display: flex; align-items: center; justify-content: center; 
                          min-height: 100vh; text-align: center;
                        }
                        .offline-container {
                          background: white; padding: 40px; border-radius: 12px;
                          box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px;
                        }
                        h1 { color: #333; margin-bottom: 16px; }
                        p { color: #666; margin-bottom: 24px; }
                        button {
                          background: #ff6b6b; color: white; border: none;
                          padding: 12px 24px; border-radius: 8px; cursor: pointer;
                          font-size: 16px;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="offline-container">
                        <h1>🍽️ You're Offline</h1>
                        <p>It looks like you're not connected to the internet. Check your connection and try again.</p>
                        <button onclick="window.location.reload()">Try Again</button>
                      </div>
                    </body>
                    </html>
                    `,
                {
                  status: 200,
                  headers: { 'Content-Type': 'text/html' },
                }
              );
            });
          });
      })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return a placeholder for failed requests
          if (request.destination === 'image') {
            return new Response(
              `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <rect width="200" height="200" fill="#f0f0f0"/>
                  <text x="100" y="100" text-anchor="middle" dy=".3em" fill="#999" font-family="Arial, sans-serif" font-size="14">
                    Image not available offline
                  </text>
                </svg>`,
              {
                status: 200,
                headers: { 'Content-Type': 'image/svg+xml' },
              }
            );
          }
        });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);

  if (event.tag === 'restaurant-vote') {
    event.waitUntil(syncRestaurantVotes());
  }

  if (event.tag === 'collection-update') {
    event.waitUntil(syncCollectionUpdates());
  }
});

// Sync restaurant votes when back online
async function syncRestaurantVotes() {
  try {
    // Get offline votes from IndexedDB
    const offlineVotes = await getOfflineVotes();

    for (const vote of offlineVotes) {
      try {
        await fetch('/api/decisions/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vote),
        });

        // Remove from offline storage after successful sync
        await removeOfflineVote(vote.id);
      } catch (error) {
        console.error('Failed to sync vote:', error);
      }
    }
  } catch (error) {
    console.error('Failed to sync restaurant votes:', error);
  }
}

// Sync collection updates when back online
async function syncCollectionUpdates() {
  try {
    // Get offline collection updates from IndexedDB
    const offlineUpdates = await getOfflineCollectionUpdates();

    for (const update of offlineUpdates) {
      try {
        await fetch('/api/collections', {
          method: update.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update.data),
        });

        // Remove from offline storage after successful sync
        await removeOfflineCollectionUpdate(update.id);
      } catch (error) {
        console.error('Failed to sync collection update:', error);
      }
    }
  } catch (error) {
    console.error('Failed to sync collection updates:', error);
  }
}

// IndexedDB helpers (simplified)
async function getOfflineVotes() {
  // Implementation would use IndexedDB
  return [];
}

async function removeOfflineVote(_id) {
  // Implementation would use IndexedDB
}

async function getOfflineCollectionUpdates() {
  // Implementation would use IndexedDB
  return [];
}

async function removeOfflineCollectionUpdate(_id) {
  // Implementation would use IndexedDB
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');

  const options = {
    body: 'New restaurant recommendations available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icons/explore.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification('You Hungry?', options));
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/restaurants'));
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow('/'));
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
