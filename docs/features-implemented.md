# Features Implemented - Fork In The Road

This document provides a comprehensive overview of all major features implemented in the application, consolidating implementation details and architectural patterns for reference during iOS migration.

## Analytics & Tracking

### Google Analytics 4 (GA4)

**Implementation Date**: October 16, 2025

**Core Architecture**:

- Privacy-preserving hashed user IDs (SHA-256) for tracking without exposing Clerk IDs
- Type-safe event tracking with 50+ tracking functions
- Production-only tracking with development logging
- Automatic page view tracking on route changes

**Key Files**:

- `src/lib/analytics.ts` - Analytics utility library (468 lines)
- `src/types/analytics.ts` - Type definitions (100 lines)
- `src/components/analytics/GoogleAnalytics.tsx` - GA4 component (67 lines)

**Event Categories Tracked**:

- Authentication (signup, signin, signout)
- Restaurant Search (search, view, filters, add to collection)
- Collections (create, view, delete)
- Decisions (random start/complete, group start/vote/complete, manual entry)
- Social (friend requests, group invitations)
- Notifications (bell click, view, click, dismiss)
- UI/UX (theme toggle, PWA install)
- Errors (with component, page, severity tracking)

**Privacy Compliance**:

- IP anonymization enabled
- No PII collection (email, phone excluded)
- Cookie flags: Secure, SameSite=None
- User opt-out support via Google Analytics Browser Add-on
- Privacy policy disclosure included

**iOS Migration Notes**:

- Replace gtag.js with Firebase Analytics SDK for iOS
- Maintain same event taxonomy for cross-platform analysis
- Consider Apple's App Tracking Transparency (ATT) framework
- Hash user IDs consistently across platforms

### API Usage Tracking

**Purpose**: Monitor Google API costs and track cache effectiveness

**Architecture**:

- `api_usage` MongoDB collection stores all API calls
- Tracks: API type, timestamp, cached status, metadata
- Real-time cost calculation based on official Google pricing
- Cache hit rate monitoring

**Tracked API Types**:

- `google_places_text_search` - $32 per 1000 requests
- `google_places_nearby_search` - $32 per 1000 requests
- `google_places_details` - $17 per 1000 requests
- `google_geocoding` - $5 per 1000 requests
- `google_address_validation` - $5 per 1000 requests
- `google_maps_load` - $7 per 1000 loads

**Key Pattern**:

```typescript
// lib/api-usage-tracker.ts
export async function trackAPIUsage(apiType: string, cached: boolean) {
  await db.collection('api_usage').insertOne({
    apiType,
    timestamp: Date.now(),
    date: new Date().toISOString().split('T')[0],
    cached,
    metadata: {},
  });
}
```

**iOS Migration Notes**:

- Implement similar tracking for iOS API calls
- Consider using CloudKit for cost-free backend option
- Track MapKit usage vs Google Maps SDK costs

### Vercel Analytics

**Dual Analytics Strategy**: GA4 for user behavior + Vercel Analytics for performance

**Why Both**:

- GA4: Custom events, conversions, user journeys, demographics
- Vercel Analytics: Core Web Vitals, page views (no cookies, privacy-friendly)

**No Conflicts**: Different scripts, data destinations, tracking methods

**iOS Migration Notes**:

- Replace Vercel Analytics with iOS-native performance monitoring
- Consider Firebase Performance Monitoring or MetricKit
- Maintain dual strategy: Firebase Analytics + Performance Monitoring

## Epic 8: Decision History, Weights & Analytics

### Decision History System

**Features**:

- Advanced filtering (type, collection, group, restaurant, date range)
- Real-time search across metadata
- Pagination (up to 500 items per request)
- CSV and JSON export
- Manual decision entry for past visits

**Database Schema Enhancement**:

```typescript
interface Decision {
  method: 'tiered' | 'random' | 'manual'; // Added 'manual'
  visitDate: Date; // For historical tracking
  result?: {
    reasoning?: string; // For manual entries
  };
}
```

**API Endpoints**:

- `GET /api/decisions/history` - Advanced filtering and pagination
- `POST /api/decisions/manual` - Manual entry for past decisions

**iOS Migration Notes**:

- Implement offline-first with Core Data
- Use NSFetchedResultsController for efficient list management
- Consider CloudKit sync for cross-device history

### Restaurant Weighting System

**30-Day Rolling Weight Algorithm**:

- Restaurants start at weight 1.0
- Weight decreases to 0.0 when selected
- Restores linearly over 30 days
- Prevents restaurant repetition

**Weight Calculation**:

```typescript
const daysSinceSelection =
  (Date.now() - lastSelectedDate) / (1000 * 60 * 60 * 24);
const weight = Math.min(daysSinceSelection / 30, 1.0);
```

**API Endpoints**:

- `GET /api/decisions/weights?collectionId=...` - Get weights for collection
- `POST /api/decisions/weights` - Reset weights (all or specific restaurant)

**UI Features**:

- Visual weight indicators (color-coded)
- Progress bars showing restoration
- Days until full weight display
- Bulk and individual reset

**iOS Migration Notes**:

- Store weights locally in Core Data
- Background refresh to update weights daily
- Use WidgetKit to show "ready to select" restaurants

### Analytics Dashboard

**Personal Analytics**:

- Overview stats (total decisions, unique restaurants, collections)
- Popular restaurants (top 10)
- Monthly decision trends (last 12 months)
- Collection statistics
- Group participation stats
- Favorite cuisines analysis

**Group Analytics**:

- Group overview stats
- Popular restaurants in group
- Monthly trends
- Member participation tracking
- Decision method breakdown
- Recent activity metrics

**API Endpoints**:

- `GET /api/analytics/personal` - User analytics
- `GET /api/analytics/group/[groupId]` - Group analytics

**iOS Migration Notes**:

- Use Charts framework for visualizations
- Implement dashboard widgets
- Consider Shortcuts integration for quick stats

## Notification System

### Multi-Channel Architecture

**Orchestrator Pattern**:

```typescript
class NotificationService {
  async send(decision, recipient, channels) {
    await Promise.allSettled([
      channels.smsEnabled && this.sendSMS(),
      channels.emailEnabled && this.sendEmail(),
      channels.pushEnabled && this.sendPush(),
      channels.inAppEnabled && this.createInApp(),
    ]);
  }
}
```

**Channels Implemented**:

1. **SMS** - Twilio with E.164 phone formatting
2. **Email** - Resend API with HTML templates
3. **In-App** - MongoDB-backed with 30-second polling
4. **Push** - PWA notifications (iOS 16.4+)

**Graceful Degradation**: Channel failures don't affect others (Promise.allSettled)

**Notification Types**:

- Group decision started (admins create, members notified)
- Group decision completed (all members notified)
- Friend requests
- Group invitations
- Decision results

**User Preferences** (Granular Control):

```typescript
notificationSettings: {
  groupDecisions: {
    started: boolean,
    completed: boolean
  },
  friendRequests: boolean,
  groupInvites: boolean,
  smsEnabled: boolean,
  emailEnabled: boolean,
  pushEnabled: boolean
}
```

**iOS Migration Notes**:

- Use UserNotifications framework for local/remote notifications
- Implement notification categories for interactive actions
- Use silent push for in-app updates
- Consider Rich Notifications with media attachments

### Push Notifications (VAPID)

**Web Push Architecture**:

- VAPID keys for server identification
- Service worker for background notifications
- Push subscription stored in user document
- Works on iOS 16.4+ when installed as PWA

**Key Implementation**:

```typescript
// Client subscription
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
});

// Server push
await webpush.sendNotification(
  subscription,
  JSON.stringify({
    title: 'Group Decision',
    body: 'Vote now!',
    data: { url: '/collections/123' },
  })
);
```

**iOS Migration Notes**:

- Replace with Apple Push Notification service (APNs)
- Generate APNs authentication key (.p8 file)
- Implement token refresh on app launch
- Handle notification permissions properly

## PWA Features

### Pull-to-Refresh

**Implementation**: PWA-only, mobile-only feature with native feel

**Detection Logic**:

- PWA: `display-mode: standalone` media query
- Mobile: User agent + screen width < 768px
- Position: Must be at top (`window.scrollY === 0`)

**Gesture Tracking**:

- Touch start/move/end events
- Resistance calculation (distance / 2.5)
- Threshold: 80px default
- Max distance: 120px

**iOS Migration Notes**:

- Use UIRefreshControl for native pull-to-refresh
- Integrate with async/await for data fetching
- Consider haptic feedback (UIImpactFeedbackGenerator)

### Service Worker Caching

**Cache Strategy**:

- Cache-first for static assets
- Network-first for API calls with fallback
- Stale-while-revalidate for restaurant data

**iOS Migration Notes**:

- Use URLCache for HTTP caching
- Implement NSCache for in-memory caching
- Consider Core Data for offline-first architecture

## Authentication & User Management

### Custom Registration Flow

**Implementation**: Clerk SDK with custom UI (not Clerk components)

**Key Features**:

- Custom form using `useSignUp` hook
- In-line email verification (6-digit code)
- Real-time username availability checking
- Phone number collection (optional)
- SMS opt-in consent
- Location preferences (city, state)

**Data Flow**:

1. User fills custom form → Clerk API (client-side)
2. Email verification in same form (no redirect)
3. Clerk creates user → Webhook fires
4. Webhook extracts data from `unsafeMetadata` → MongoDB

**Webhook Sync** (`/api/webhooks/clerk`):

```typescript
user.created → createUser(clerkId, email, username, phone, city, state)
user.updated → updateUser(clerkId, { email, username, phone, city, state })
```

**iOS Migration Notes**:

- Use Sign in with Apple (required by App Store)
- Implement custom registration UI with UIKit/SwiftUI
- Store user data in Keychain (secure)
- Sync to backend via REST API
- Consider Firebase Auth as Clerk alternative

### SMS Consent & Compliance

**Twilio A2P 10DLC Compliance**:

- Clear opt-in checkbox (not pre-checked)
- Message types disclosed (transactional)
- Frequency disclosed ("varies by activity")
- Opt-out instructions (profile settings)
- Cost disclosure ("Msg & data rates may apply")
- Non-conditional consent

**Privacy Policy Integration**: Full disclosure in `/privacy-policy` page

**iOS Migration Notes**:

- SMS consent same on iOS (Twilio backend unchanged)
- Use MessageUI framework for compose if needed
- Consider iMessage Business integration

## Performance & Optimization

### API Request Optimization

**Problem Solved**: Reduced 1.3k requests/hour to ~170/hour (87% reduction)

**Strategies**:

1. Reduced polling: 30s → 5min (10x reduction)
2. Visibility-aware polling: Inactive tabs use 15min intervals
3. Request throttling: Max 10 requests/min per endpoint
4. Enhanced caching: 30s → 5min stale time
5. Disabled production performance monitoring

**Conditional Polling Pattern**:

```typescript
// Active decision: 30s polling
// Inactive decision: 5min polling
// Recent activity: 30s for 5min, then 5min
refetchInterval: hasActiveDecision ? 30000 : 300000;
```

**iOS Migration Notes**:

- Use Background App Refresh for periodic updates
- Implement intelligent refresh based on app state
- Consider push notifications instead of polling
- Use NSURLSession with proper cache policies

### Caching Strategy

**Layers**:

1. **Client Cache** (TanStack Query): 5min stale, 10min GC
2. **API Cache** (Memory): 30s-30 day TTL based on data type
3. **Database Cache**: Indexed queries, connection pooling

**Cache Hit Targets**:

- Google Places API: >70% (cost optimization)
- Restaurant data: >80% (performance)
- User profiles: >90% (frequently accessed)

**iOS Migration Notes**:

- URLCache for HTTP responses
- NSCache for in-memory objects
- Core Data persistent store for offline
- Consider cache size limits on iOS

## Error Tracking & Monitoring

### Comprehensive Error System

**Architecture**:

- React Error Boundaries (root, route, component levels)
- Error grouping by fingerprint (SHA-256 of message + stack)
- User context capture (ID, email, browser, device)
- Breadcrumb trail (last 10 user actions)
- Admin dashboard for error management

**Error Classification**:

- **Severity**: critical, error, warning, info
- **Category**: client, server, network, api

**Database Schema**:

```typescript
interface ErrorLog {
  fingerprint: string; // For grouping
  message: string;
  stack?: string;
  userId?: ObjectId;
  breadcrumbs?: Array<{ timestamp; action; data }>;
  severity: 'critical' | 'error' | 'warning' | 'info';
  category: 'client' | 'server' | 'network' | 'api';
}

interface ErrorGroup {
  fingerprint: string;
  totalOccurrences: number;
  affectedUsers: number;
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
}
```

**iOS Migration Notes**:

- Use Firebase Crashlytics or Sentry for iOS
- Implement custom error boundaries in SwiftUI
- Capture user actions with analytics events
- Local error logging with OSLog

## SEO & Marketing

### Implementation Summary

**Date**: October 20, 2025 (Epic 10, Story 2)

**Files Created**:

- `src/components/seo/StructuredData.tsx` (347 lines) - 6 Schema.org components
- `src/lib/metadata.ts` (389 lines) - Centralized metadata for 12+ pages
- `src/app/sitemap.ts` (67 lines) - Dynamic XML sitemap
- `public/robots.txt` (48 lines) - Search engine and AI bot directives
- 10 layout files for metadata injection (dashboard, restaurants, groups, etc.)

**Performance Impact**: <100ms page load increase (~7KB total)

### Schema.org Structured Data

**Implemented Schemas**:

1. **OrganizationStructuredData** - Company contact info, logo, founding details
2. **WebApplicationStructuredData** - Features, pricing (free), aggregate rating, categories
3. **SoftwareApplicationStructuredData** - OS compatibility, version info, help docs
4. **FAQStructuredData** - 10 Q&A pairs optimized for featured snippets
5. **WebSiteStructuredData** - Search capability for SERPs
6. **BreadcrumbStructuredData** - Navigation hierarchy

**All validate at**: https://search.google.com/test/rich-results

### Meta Tags & Open Graph

**Page-Specific Metadata** (12 functions):

- Unique titles and descriptions for every page
- Open Graph tags for rich social sharing (1200x630 images)
- Twitter Card optimization
- Canonical URLs to prevent duplicate content
- Keyword optimization for 15+ target keywords

**Target Keywords**:

- **Primary**: restaurant decision maker, where to eat app, group restaurant voting
- **Secondary**: restaurant discovery app, food decision app, restaurant collections
- **Long-tail**: how to decide where to eat with friends, smart restaurant selection algorithm

### GEO (Generative Engine Optimization)

**For AI Platforms** (ChatGPT, Claude, Perplexity, Bard):

**Implemented Features**:

- Natural language FAQ section (6 questions on homepage)
- Clear entity definitions ("Fork In The Road is a...")
- Structured Q&A format for easy extraction
- Feature lists in plain language
- Context-rich metadata

**AI Bot Permissions** (robots.txt):

- ✅ GPTBot (OpenAI)
- ✅ Claude-Web (Anthropic)
- ✅ PerplexityBot (Perplexity AI)
- ✅ Google-Extended (Bard)

### Technical SEO

**Implemented**:

- ✅ XML Sitemap (dynamic generation at build time)
- ✅ Robots.txt (AI-friendly, blocks admin/test routes)
- ✅ Semantic HTML throughout
- ✅ Proper heading hierarchy (h1 → h2 → h3)
- ✅ Canonical URLs
- ✅ Mobile-first responsive design
- ✅ Fast loading times (<3s)
- ✅ HTTPS enabled
- ✅ PWA capabilities

### Post-Deployment SEO Tasks

1. Submit sitemap to Google Search Console
2. Verify indexing in Search Console
3. Request indexing for key pages
4. Monitor search performance
5. Test social previews (Facebook, Twitter, LinkedIn)

**Expected Results**:

- **1-2 weeks**: Sitemap indexed, rich results appear
- **1-3 months**: Improved rankings, featured snippets, AI citations
- **3-6 months**: Top 10 for primary keywords, 50%+ organic traffic increase

**iOS Migration Notes**:

- SEO not applicable to native apps
- Focus on App Store Optimization (ASO):
  - App title with keywords (30 chars max)
  - Subtitle (30 chars max)
  - Keyword field (100 chars, comma-separated)
  - App description (first 3 lines critical)
  - Screenshots and preview videos
  - App icon optimization
  - Ratings and reviews strategy
- Use app indexing for Spotlight search
- Implement universal links for deep linking
- Consider App Clips for quick access

---

## Key Architectural Patterns for iOS Migration

### 1. Multi-Channel Notification Orchestrator

- Pattern: Promise.allSettled for parallel delivery with graceful degradation
- iOS: Combine UserNotifications + silent push + in-app

### 2. Privacy-First Analytics

- Pattern: Hash user IDs before sending to analytics
- iOS: Consistent hashing across platforms for unified analysis

### 3. Weighted Random Selection

- Pattern: 30-day rolling weight algorithm
- iOS: Core Data for persistence + background calculation

### 4. Offline-First Data Management

- Pattern: TanStack Query with optimistic updates
- iOS: Core Data + CloudKit sync

### 5. Conditional Polling/Refresh

- Pattern: Adjust intervals based on activity state
- iOS: Background App Refresh + push notifications

### 6. Webhook-Based Sync

- Pattern: Auth provider → Webhook → Database
- iOS: Sign in with Apple → Backend API → Core Data

---

**Document Version**: 1.0  
**Last Updated**: October 21, 2025  
**Purpose**: Consolidated reference for iOS migration
