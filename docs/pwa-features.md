# PWA Features - Implementation & iOS Comparison

This document details PWA-specific features implemented in the web app and provides guidance for iOS native equivalents.

## Overview

The Fork In The Road web app is built as a Progressive Web App (PWA) to provide an app-like experience on mobile devices. This document catalogs PWA features for comparison when building the native iOS app.

---

## Pull-to-Refresh

### Web Implementation

**Status**: ✅ Fully Implemented

**Pattern**: Twitter-style pull-to-refresh with content displacement

**Features**:

- PWA-only mode (only when installed to home screen)
- Mobile-only (screen width < 768px)
- Smart detection (must be at scroll top)
- Visual feedback (spinner + progress text)
- Smooth animations (CSS transforms)
- Dark mode support

**Detection Logic**:

```javascript
// PWA Detection
const isPWA =
  window.matchMedia('(display-mode: standalone)').matches ||
  navigator.standalone === true || // iOS
  document.referrer.includes('android-app://'); // Android

// Mobile Detection
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;

// Position Detection
const isAtTop = window.scrollY === 0;
```

**Gesture Tracking**:

```javascript
let startY = 0;
let pullDistance = 0;

element.addEventListener('touchstart', (e) => {
  if (window.scrollY === 0) {
    startY = e.touches[0].pageY;
  }
});

element.addEventListener('touchmove', (e) => {
  if (startY > 0) {
    const currentY = e.touches[0].pageY;
    pullDistance = Math.min((currentY - startY) / 2.5, maxPullDistance);

    // Update UI
    indicator.style.transform = `translateY(${pullDistance}px)`;
    indicator.style.opacity = pullDistance / threshold;
  }
});

element.addEventListener('touchend', () => {
  if (pullDistance >= threshold) {
    triggerRefresh();
  }
  resetUI();
});
```

**Configuration**:

- Threshold: 80px (minimum pull to trigger)
- Max pull distance: 120px
- Resistance: 2.5 (divide actual distance)

### iOS Native Equivalent

**Framework**: UIRefreshControl (UIKit) or refreshable (SwiftUI)

**SwiftUI Example**:

```swift
List {
  ForEach(items) { item in
    ItemRow(item: item)
  }
}
.refreshable {
  await loadData()
}
```

**UIKit Example**:

```swift
let refreshControl = UIRefreshControl()
refreshControl.addTarget(self, action: #selector(refresh), for: .valueChanged)
tableView.refreshControl = refreshControl

@objc func refresh() {
  Task {
    await loadData()
    refreshControl.endRefreshing()
  }
}
```

**Enhancements for iOS**:

- Haptic feedback: `UIImpactFeedbackGenerator(style: .medium).impactOccurred()`
- Custom tint color to match brand
- Attributed title for status messages

---

## Push Notifications

### Web Implementation (VAPID)

**Status**: ✅ Fully Implemented

**Architecture**:

- VAPID keys for server authentication
- Service worker for background notifications
- Push subscription stored in MongoDB
- web-push library for server-side sending

**Client Subscription**:

```javascript
// Request permission
const permission = await Notification.requestPermission();

if (permission === 'granted') {
  // Subscribe to push
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // Save subscription to server
  await fetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({ subscription }),
  });
}
```

**Service Worker** (`public/sw.js`):

```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: data.data,
      actions: data.actions,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
```

**Server-Side** (Node.js):

```javascript
const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Send notification
await webpush.sendNotification(
  subscription,
  JSON.stringify({
    title: 'Group Decision Started',
    body: 'Vote now in Family Dinner!',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    data: { url: '/collections/123' },
  })
);
```

**Platform Support**:

- ✅ Desktop Chrome, Firefox, Edge
- ✅ Android Chrome
- ✅ iOS Safari 16.4+ (PWA only, home screen required)

### iOS Native Equivalent

**Framework**: UserNotifications + APNs (Apple Push Notification service)

**Request Permission**:

```swift
import UserNotifications

let center = UNUserNotificationCenter.current()
let options: UNAuthorizationOptions = [.alert, .sound, .badge]

center.requestAuthorization(options: options) { granted, error in
  if granted {
    DispatchQueue.main.async {
      UIApplication.shared.registerForRemoteNotifications()
    }
  }
}
```

**Register for Remote Notifications**:

```swift
// AppDelegate.swift
func application(_ application: UIApplication,
                 didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
  let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()

  // Send token to your server
  sendTokenToServer(token)
}

func application(_ application: UIApplication,
                 didReceiveRemoteNotification userInfo: [AnyHashable : Any],
                 fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
  // Handle notification
  completionHandler(.newData)
}
```

**Local Notification** (for testing):

```swift
let content = UNMutableNotificationContent()
content.title = "Group Decision Started"
content.body = "Vote now in Family Dinner!"
content.sound = .default
content.badge = 1
content.userInfo = ["url": "/collections/123"]

let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
let request = UNNotificationRequest(identifier: UUID().uuidString,
                                   content: content,
                                   trigger: trigger)

UNUserNotificationCenter.current().add(request)
```

**Notification Categories** (Interactive):

```swift
let voteAction = UNNotificationAction(
  identifier: "VOTE_ACTION",
  title: "Vote Now",
  options: [.foreground]
)

let category = UNNotificationCategory(
  identifier: "GROUP_DECISION",
  actions: [voteAction],
  intentIdentifiers: []
)

UNUserNotificationCenter.current().setNotificationCategories([category])
```

**Server Configuration**:

- Generate APNs authentication key (.p8 file) in Apple Developer Portal
- Store key ID, team ID, and .p8 file securely
- Use HTTP/2 APNs API (not legacy binary protocol)

**Payload Format**:

```json
{
  "aps": {
    "alert": {
      "title": "Group Decision Started",
      "body": "Vote now in Family Dinner!"
    },
    "badge": 1,
    "sound": "default",
    "category": "GROUP_DECISION"
  },
  "url": "/collections/123"
}
```

---

## Offline Support & Caching

### Web Implementation

**Service Worker Caching Strategy**:

```javascript
// public/sw.js
const CACHE_NAME = 'fork-in-the-road-v1';
const STATIC_CACHE = [
  '/',
  '/dashboard',
  '/collections',
  '/manifest.json',
  '/icons/icon-192x192.svg',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE))
  );
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
```

**Cache Strategies by Content Type**:

- **Static Assets**: Cache-first (CSS, JS, images)
- **API Calls**: Network-first with cache fallback
- **Restaurant Data**: Stale-while-revalidate (30-day TTL)
- **User Data**: Network-only (always fresh)

### iOS Native Equivalent

**URLCache Configuration**:

```swift
// AppDelegate.swift
let cachesURL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
let diskCacheURL = cachesURL.appendingPathComponent("URLCache")

let cache = URLCache(
  memoryCapacity: 50_000_000,  // 50 MB
  diskCapacity: 200_000_000,   // 200 MB
  diskPath: diskCacheURL.path
)

URLCache.shared = cache
```

**Cache Policy per Request**:

```swift
var request = URLRequest(url: url)

// Return cached data if available, else fetch
request.cachePolicy = .returnCacheDataElseLoad

// Always fetch fresh data
request.cachePolicy = .reloadIgnoringLocalCacheData

// Use cached data, don't fetch
request.cachePolicy = .returnCacheDataDontLoad
```

**Core Data for Offline-First**:

```swift
// Persistent container setup
lazy var persistentContainer: NSPersistentContainer = {
  let container = NSPersistentContainer(name: "ForkInTheRoad")
  container.loadPersistentStores { description, error in
    if let error = error {
      fatalError("Unable to load persistent stores: \(error)")
    }
  }
  return container
}()

// Save restaurants locally
func saveRestaurants(_ restaurants: [Restaurant]) {
  let context = persistentContainer.viewContext

  for restaurant in restaurants {
    let entity = RestaurantEntity(context: context)
    entity.id = restaurant.id
    entity.name = restaurant.name
    entity.cachedAt = Date()
  }

  try? context.save()
}

// Fetch cached restaurants
func fetchCachedRestaurants() -> [Restaurant] {
  let context = persistentContainer.viewContext
  let request: NSFetchRequest<RestaurantEntity> = RestaurantEntity.fetchRequest()

  let results = try? context.fetch(request)
  return results?.map { $0.toRestaurant() } ?? []
}
```

---

## App Install & PWA Capabilities

### Web Implementation

**App Manifest** (`public/manifest.json`):

```json
{
  "name": "Fork In The Road",
  "short_name": "ForkInRd",
  "description": "Decide where to eat with friends",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fafafa",
  "theme_color": "#ff3366",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.svg",
      "sizes": "72x72",
      "type": "image/svg+xml"
    },
    {
      "src": "/icons/icon-96x96.svg",
      "sizes": "96x96",
      "type": "image/svg+xml"
    },
    {
      "src": "/icons/icon-128x128.svg",
      "sizes": "128x128",
      "type": "image/svg+xml"
    },
    {
      "src": "/icons/icon-144x144.svg",
      "sizes": "144x144",
      "type": "image/svg+xml"
    },
    {
      "src": "/icons/icon-152x152.svg",
      "sizes": "152x152",
      "type": "image/svg+xml"
    },
    {
      "src": "/icons/icon-192x192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.svg",
      "sizes": "384x384",
      "type": "image/svg+xml"
    },
    {
      "src": "/icons/icon-512x512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop-1.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile-1.png",
      "sizes": "750x1334",
      "type": "image/png"
    }
  ]
}
```

**Install Prompt**:

```javascript
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Show custom install UI
  showInstallPromotion();
});

function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      deferredPrompt = null;
    });
  }
}
```

### iOS Native Equivalent

**App Icons** (required sizes):

- 20x20 (iPhone Notification)
- 29x29 (iPhone Settings)
- 40x40 (iPhone Spotlight)
- 60x60 (iPhone App)
- 76x76 (iPad App)
- 83.5x83.5 (iPad Pro App)
- 1024x1024 (App Store)

**Launch Screen**:

```swift
// LaunchScreen.storyboard
// Or use Info.plist for UILaunchScreen configuration
```

**App Distribution**:

- TestFlight for beta testing
- App Store for production
- Enterprise distribution for internal apps

---

## Performance Monitoring

### Web Implementation

**Web Vitals Tracking**:

```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics({ name, delta, value, id }) {
  // Send to analytics service
  gtag('event', name, {
    event_category: 'Web Vitals',
    value: Math.round(name === 'CLS' ? delta * 1000 : delta),
    event_label: id,
    non_interaction: true,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

**Performance Observer**:

```javascript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.name, entry.duration);
  }
});

observer.observe({ entryTypes: ['navigation', 'resource', 'paint'] });
```

### iOS Native Equivalent

**MetricKit** (iOS 13+):

```swift
import MetricKit

class MetricsManager: NSObject, MXMetricManagerSubscriber {
  override init() {
    super.init()
    MXMetricManager.shared.add(self)
  }

  func didReceive(_ payloads: [MXMetricPayload]) {
    for payload in payloads {
      // Application launch metrics
      if let launchMetrics = payload.applicationLaunchMetrics {
        print("Average launch time: \(launchMetrics.histogrammedTimeToFirstDraw)")
      }

      // Application hang metrics
      if let hangMetrics = payload.applicationHangMetrics {
        print("Hang rate: \(hangMetrics.cumulativeHangTime)")
      }

      // Network metrics
      if let networkMetrics = payload.networkTransferMetrics {
        print("Cellular data: \(networkMetrics.cumulativeCellularDownload)")
      }
    }
  }
}
```

**Firebase Performance**:

```swift
import FirebasePerformance

// Automatic traces (app start, screen rendering)
// No code needed

// Custom traces
let trace = Performance.startTrace(name: "load_restaurants")
loadRestaurants { restaurants in
  trace?.stop()
}

// Network request tracing
let url = URL(string: "https://api.example.com/restaurants")!
let request = URLRequest(url: url)
let metric = HTTPMetric(url: url, httpMethod: .get)

metric?.start()
URLSession.shared.dataTask(with: request) { data, response, error in
  metric?.responseCode = (response as? HTTPURLResponse)?.statusCode ?? 0
  metric?.stop()
}.resume()
```

---

## Background Sync

### Web Implementation

**Background Sync API** (not widely supported):

```javascript
// Register sync
navigator.serviceWorker.ready.then((registration) => {
  return registration.sync.register('sync-restaurants');
});

// Service worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-restaurants') {
    event.waitUntil(syncRestaurants());
  }
});

async function syncRestaurants() {
  const pendingData = await getPendingData();
  await fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify(pendingData),
  });
}
```

### iOS Native Equivalent

**Background App Refresh**:

```swift
// Enable in capabilities
// Info.plist: UIBackgroundModes = ["fetch"]

// AppDelegate.swift
func application(_ application: UIApplication,
                 performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
  Task {
    let hasNewData = await syncRestaurants()
    completionHandler(hasNewData ? .newData : .noData)
  }
}

// Set minimum interval
UIApplication.shared.setMinimumBackgroundFetchInterval(UIApplication.backgroundFetchIntervalMinimum)
```

**Background Tasks** (iOS 13+):

```swift
import BackgroundTasks

// Register task
BGTaskScheduler.shared.register(
  forTaskWithIdentifier: "com.forkintheroad.sync",
  using: nil
) { task in
  self.handleSync(task: task as! BGAppRefreshTask)
}

// Schedule task
func scheduleSync() {
  let request = BGAppRefreshTaskRequest(identifier: "com.forkintheroad.sync")
  request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes

  try? BGTaskScheduler.shared.submit(request)
}

// Handle task
func handleSync(task: BGAppRefreshTask) {
  scheduleSync() // Reschedule

  Task {
    await syncRestaurants()
    task.setTaskCompleted(success: true)
  }
}
```

---

## Key Takeaways for iOS Migration

### Replace with Native iOS Equivalents

| PWA Feature                | iOS Equivalent                   | Notes                       |
| -------------------------- | -------------------------------- | --------------------------- |
| Pull-to-refresh            | UIRefreshControl                 | Add haptic feedback         |
| Push notifications (VAPID) | APNs + UserNotifications         | More reliable on iOS        |
| Service worker caching     | URLCache + Core Data             | Better offline support      |
| Web Vitals                 | MetricKit + Firebase Performance | Native performance tracking |
| Background sync            | Background App Refresh           | System-managed              |
| App install prompt         | App Store distribution           | No prompt needed            |

### Keep Cross-Platform

| Feature        | Implementation             | Notes                             |
| -------------- | -------------------------- | --------------------------------- |
| Backend API    | REST/GraphQL               | Same endpoints for web and iOS    |
| Authentication | Clerk → Sign in with Apple | Different providers, same backend |
| Database       | MongoDB                    | Shared database                   |
| Analytics      | GA4 → Firebase Analytics   | Consistent event taxonomy         |
| Push backend   | Twilio/Resend              | Same notification logic           |

### iOS Advantages

1. **Better Performance**: Native code execution, no JavaScript overhead
2. **Reliable Push**: APNs more reliable than web push
3. **Offline-First**: Core Data + CloudKit native offline support
4. **Better UX**: Native gestures, animations, haptics
5. **App Store**: Discoverability, trust, reviews

### PWA Advantages

1. **Instant Updates**: No app store approval process
2. **Cross-Platform**: One codebase for all devices
3. **Lower Barrier**: No installation required
4. **SEO**: Discoverable via search engines

---

**Document Version**: 1.0  
**Last Updated**: October 21, 2025  
**Purpose**: PWA feature catalog for iOS migration planning
