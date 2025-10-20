// Service Worker for Fork In The Road PWA
// Bump version to force cache invalidation
const CACHE_NAME = 'forkintheroad-v26';

console.log('🔔 Service Worker: Script loaded and running!');
const STATIC_CACHE_NAME = 'forkintheroad-static-v13';
const DYNAMIC_CACHE_NAME = 'forkintheroad-dynamic-v13';
const API_CACHE_NAME = 'forkintheroad-api-v13';

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
  // Note: _next/static assets are dynamic and will be cached on-demand
];

// API endpoints to cache (currently disabled to prevent caching conflicts)
// const API_ENDPOINTS = [
//   '/api/collections',
//   '/api/restaurants',
//   '/api/decisions',
//   '/api/groups',
//   '/api/friends',
// ];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        // Cache assets one by one to handle failures gracefully
        return Promise.allSettled(
          STATIC_ASSETS.map((asset) =>
            cache.add(asset).catch((err) => {
              console.warn(`Service Worker: Failed to cache ${asset}:`, err);
              return null; // Continue with other assets
            })
          )
        );
      })
      .then((results) => {
        const successful = results.filter(
          (r) => r.status === 'fulfilled'
        ).length;
        const failed = results.filter((r) => r.status === 'rejected').length;
        console.log(
          `Service Worker: Cached ${successful} assets, ${failed} failed`
        );
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache assets', error);
        return self.skipWaiting(); // Still activate even if caching fails
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

  // Handle API requests - always fetch fresh (no caching to prevent conflicts)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return offline response for API requests
        return new Response(
          JSON.stringify({
            error: 'Offline',
            message: 'This request cannot be completed offline',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // Handle page requests with network-first strategy (to avoid stale Server Actions)
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
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
          // Fallback to cache only when offline
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            // Return offline page as last resort
            return caches.match('/').then((response) => {
              if (response) {
                return response;
              }
              return new Response(
                `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="UTF-8">
                      <title>Fork In The Road - Offline</title>
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
                        <h1>🍕 You're Offline</h1>
                        <p>It looks like you're not connected to the internet. Check your connection and try again.</p>
                        <button onclick="window.location.reload()">Try Again</button>
                      </div>
                    </body>
                    </html>
                    `,
                {
                  status: 200,
                  headers: { 'Content-Type': 'text/html; charset=utf-8' },
                }
              );
            });
          });
        })
    );
    return;
  }

  // Handle Next.js static assets (content-hashed) with cache-first strategy
  // These have hashes in their filenames, so cache-first is safe and efficient
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Handle other CSS files with stale-while-revalidate strategy
  // Shows cached version immediately, then updates cache in background
  if (request.destination === 'style' || url.pathname.endsWith('.css')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => cachedResponse);

        // Return cached response immediately, but update cache in background
        return cachedResponse || fetchPromise;
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
    const request = indexedDB.open('Fork In The RoadOfflineDB', 1);

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
    const request = indexedDB.open('Fork In The RoadOfflineDB', 1);

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
    const request = indexedDB.open('Fork In The RoadOfflineDB', 1);

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
  const timestamp = new Date().toISOString();
  console.log(
    `🔔 [${timestamp}] Service Worker: Push notification received!`,
    event
  );
  console.log(`🔔 [${timestamp}] Service Worker: Event data:`, event.data);
  console.log(
    `🔔 [${timestamp}] Service Worker: Event data type:`,
    typeof event.data
  );
  console.log(
    `🔔 [${timestamp}] Service Worker: Event data methods:`,
    event.data ? Object.getOwnPropertyNames(event.data) : 'null'
  );

  // Also log to help identify which push this is
  if (event.data) {
    try {
      const rawData = event.data.text();
      console.log(
        `🔔 [${timestamp}] Service Worker: Raw data preview:`,
        rawData.substring(0, 100)
      );
    } catch (e) {
      console.log(`🔔 [${timestamp}] Service Worker: Could not read data:`, e);
    }
  }

  // Simple test notification to verify push events are working
  if (!event.data) {
    console.log(
      '🔔 Service Worker: No data in push event, showing test notification'
    );
    event.waitUntil(
      self.registration.showNotification('Test Push', {
        body: 'Service worker received push event!',
        icon: '/icons/icon-192x192.svg',
        tag: 'test-push',
      })
    );
    return;
  }

  // Parse the push notification payload
  let data = {
    title: 'Fork In The Road',
    body: 'New notification',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
  };

  if (event.data) {
    try {
      // Try to get the data as text first to see what we're receiving
      const rawData = event.data.text();
      console.log('Service Worker: Raw push data:', rawData);

      // Check if it looks like JSON (starts with { or [)
      if (rawData.trim().startsWith('{') || rawData.trim().startsWith('[')) {
        // Try to parse as JSON
        data = JSON.parse(rawData);
        console.log('Service Worker: Parsed push data:', data);
      } else {
        // It's plain text, use it as the notification body
        console.log('Service Worker: Using raw text as notification body');
        data.body = rawData;
      }
    } catch (error) {
      console.error('Service Worker: Failed to parse push data', error);
      // Fallback to using the raw text as body
      data.body = event.data.text();
    }
  }

  const title = data.title || 'Fork In The Road';
  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/icons/icon-192x192.svg',
    badge: data.badge || '/icons/icon-72x72.svg',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [
      {
        action: 'view',
        title: 'View',
      },
    ],
  };

  console.log('Service Worker: About to show notification with:', {
    title,
    options,
  });

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => {
        console.log('Service Worker: Notification shown successfully');
      })
      .catch((error) => {
        console.error('Service Worker: Failed to show notification', error);
      })
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);

  event.notification.close();

  // Get the URL from notification data or use default
  const urlToOpen = event.notification.data?.url || '/';

  // Handle specific actions
  if (event.action === 'view') {
    event.waitUntil(
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window open
          for (const client of clientList) {
            if (client.url.includes(urlToOpen) && 'focus' in client) {
              return client.focus();
            }
          }
          // If not, open a new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app at the specified URL
    event.waitUntil(
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window open
          for (const client of clientList) {
            if ('focus' in client) {
              return client.focus().then(() => {
                // Navigate to the URL
                if (client.navigate) {
                  return client.navigate(urlToOpen);
                }
              });
            }
          }
          // If not, open a new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
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
