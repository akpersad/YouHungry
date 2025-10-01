// Service Worker for You Hungry? PWA
const CACHE_NAME = 'you-hungry-v2';
const STATIC_CACHE_NAME = 'you-hungry-static-v2';
const DYNAMIC_CACHE_NAME = 'you-hungry-dynamic-v2';
const API_CACHE_NAME = 'you-hungry-api-v2';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/restaurants',
  '/groups',
  '/friends',
  '/collections',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/_next/static/css/',
  '/_next/static/js/',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/collections',
  '/api/restaurants',
  '/api/decisions',
  '/api/groups',
  '/api/friends',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache API endpoints
      caches.open(API_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching API endpoints');
        return Promise.all(
          API_ENDPOINTS.map((endpoint) =>
            cache
              .add(endpoint)
              .catch((err) => console.warn(`Failed to cache ${endpoint}:`, err))
          )
        );
      }),
    ])
      .then(() => {
        console.log('Service Worker: All assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache assets', error);
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
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== API_CACHE_NAME
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
            const cacheName = API_ENDPOINTS.some((endpoint) =>
              url.pathname.startsWith(endpoint)
            )
              ? API_CACHE_NAME
              : DYNAMIC_CACHE_NAME;

            caches.open(cacheName).then((cache) => {
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

            // Return appropriate offline response based on endpoint
            const isReadOperation = request.method === 'GET';
            const endpoint = url.pathname;

            if (isReadOperation) {
              // Return empty array for collection endpoints
              if (
                endpoint.includes('/collections') ||
                endpoint.includes('/restaurants') ||
                endpoint.includes('/groups')
              ) {
                return new Response(JSON.stringify([]), {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' },
                });
              }

              // Return empty object for single resource endpoints
              if (endpoint.match(/\/api\/\w+\/[a-f0-9]+$/)) {
                return new Response(JSON.stringify({}), {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' },
                });
              }
            }

            // Return offline error for write operations
            return new Response(
              JSON.stringify({
                error: 'Offline',
                message:
                  "You are currently offline. This action will be synced when you're back online.",
                offline: true,
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

  if (event.tag === 'offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync all offline actions when back online
async function syncOfflineActions() {
  try {
    // Get offline actions from IndexedDB
    const offlineActions = await getOfflineActions();

    for (const action of offlineActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.data ? JSON.stringify(action.data) : undefined,
        });

        if (response.ok) {
          // Remove from offline storage after successful sync
          await removeOfflineAction(action.id);
          console.log(`Successfully synced action ${action.id}`);
        } else {
          // Increment retry count
          await updateOfflineAction(action.id, {
            retryCount: action.retryCount + 1,
          });
          console.warn(
            `Failed to sync action ${action.id}, retry count: ${action.retryCount + 1}`
          );
        }
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        // Increment retry count
        await updateOfflineAction(action.id, {
          retryCount: action.retryCount + 1,
        });
      }
    }
  } catch (error) {
    console.error('Failed to sync offline actions:', error);
  }
}

// IndexedDB helpers for offline actions
async function getOfflineActions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('YouHungryOfflineDB', 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineActions'], 'readonly');
      const store = transaction.objectStore('offlineActions');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };

      getAllRequest.onerror = () => {
        reject(getAllRequest.error);
      };
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function removeOfflineAction(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('YouHungryOfflineDB', 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineActions'], 'readwrite');
      const store = transaction.objectStore('offlineActions');
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => {
        resolve();
      };

      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function updateOfflineAction(id, updates) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('YouHungryOfflineDB', 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineActions'], 'readwrite');
      const store = transaction.objectStore('offlineActions');

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (action) {
          const updatedAction = { ...action, ...updates };
          const putRequest = store.put(updatedAction);

          putRequest.onsuccess = () => {
            resolve();
          };

          putRequest.onerror = () => {
            reject(putRequest.error);
          };
        } else {
          reject(new Error('Action not found'));
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');

  const options = {
    body: 'New restaurant recommendations available!',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icons/explore.svg',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.svg',
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
