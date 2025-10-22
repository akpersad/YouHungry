# Quick Reference Guide

Consolidated quick reference for common development tasks, analytics tracking, SEO management, and Vercel deployment.

## Table of Contents

- [Analytics Tracking](#analytics-tracking)
- [SEO & Schema.org](#seo--schemaorg)
- [Vercel Analytics](#vercel-analytics)
- [Common Commands](#common-commands)

---

## Analytics Tracking

### Import Statement

```typescript
import { trackEventName } from '@/lib/analytics';
```

### Common Tracking Patterns

#### Track Button Clicks

```typescript
<Button
  onClick={() => {
    trackEvent('button_click', {
      button_name: 'feature_name',
      location: 'page_name',
    });
    // Your logic
  }}
>
  Click Me
</Button>
```

#### Track Page Views

```typescript
useEffect(() => {
  trackEvent('component_view', {
    component: 'MyComponent',
    page: window.location.pathname,
  });
}, []);
```

#### Track Form Submissions

```typescript
const handleSubmit = async (data) => {
  try {
    await submitForm(data);
    trackEvent('form_submit', { form_name: 'contact_form', success: true });
  } catch (error) {
    trackEvent('form_submit', {
      form_name: 'contact_form',
      success: false,
      error: error.message,
    });
  }
};
```

### Available Tracking Functions

#### Authentication

```typescript
trackSignupStart(method?: 'email' | 'phone' | 'social')
trackSignupComplete(method?: 'email' | 'phone' | 'social')
trackSignIn(method?: 'email' | 'phone' | 'social')
trackSignOut()
trackProfileUpdate(updateType?: string)
```

#### Restaurant Search

```typescript
trackRestaurantSearch({ location, searchTerm, filters, resultsCount })
trackRestaurantView({ restaurantId, restaurantName, cuisineType, priceLevel, rating, position })
trackSearchFilterApplied(filterType: string, filterValue: string)
trackSearchSortChanged(sortBy: string)
trackMapMarkerClick(restaurantId: string, restaurantName: string)
```

#### Collections

```typescript
trackCollectionCreate({ collectionType: 'personal' | 'group', collectionName })
trackCollectionView({ collectionId, collectionType, restaurantCount })
trackRestaurantAddToCollection({ restaurantId, restaurantName, collectionId })
trackRestaurantRemoveFromCollection({ restaurantId, collectionId })
trackCollectionTabChanged(tabName: string, collectionId: string)
```

#### Decisions

```typescript
// Random
trackDecisionRandomStart({ collectionId, restaurantCount })
trackDecisionRandomComplete({ collectionId, selectedRestaurantId, selectedRestaurantName })

// Group
trackDecisionGroupStart({ groupId, collectionId, decisionType: 'random' | 'tiered', restaurantCount })
trackDecisionVoteSubmitted({ groupId, decisionId, rankingPositions })
trackDecisionGroupComplete({ groupId, decisionId, decisionType, voteCount, selectedRestaurantId })

// Manual Entry
trackDecisionManualEntry({ restaurantId, restaurantName, collectionId })
trackDecisionStatisticsViewed(collectionId: string)
```

#### Social Features

```typescript
trackFriendSearch(searchTerm: string)
trackFriendRequestSent(friendId?: string)
trackFriendRequestAccepted(friendId?: string)
trackGroupCreated({ groupId, memberCount })
trackGroupInvitationSent(groupId: string)
```

#### Notifications

```typescript
trackNotificationBellClick();
trackNotificationClicked({ notificationId, notificationType });
trackPushNotificationSent({ notificationType, success, recipientCount, error });
```

#### UI/UX

```typescript
trackThemeToggle(theme: 'light' | 'dark')
trackPWAInstallPromptShown()
trackPWAInstalled()
trackError({ errorType, errorMessage, component, page, fatal })
```

### Best Practices

**DO**:

- Include relevant context in event parameters
- Track both success and failure states
- Use descriptive event names

**DON'T**:

- Track PII (email, phone numbers)
- Over-track (every mouse move)
- Block on tracking (fire-and-forget)

### Development vs Production

- **Development**: Events logged to console with `[Analytics]` prefix, NOT sent to GA4
- **Production**: Events sent to GA4 when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set

---

## SEO & Schema.org

### Quick Verification After Deployment

1. **Sitemap**: `https://yourdomain.com/sitemap.xml`
2. **Robots.txt**: `https://yourdomain.com/robots.txt`
3. **Structured Data**: [Google Rich Results Test](https://search.google.com/test/rich-results)
4. **Social Preview**:
   - Facebook: [Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - Twitter: [Card Validator](https://cards-dev.twitter.com/validator)

### Schema.org Components

```tsx
<OrganizationStructuredData />      // Company info
<WebApplicationStructuredData />    // App details, features, pricing
<SoftwareApplicationStructuredData /> // Technical specs
<FAQStructuredData />               // Q&A for AI/search engines
<WebSiteStructuredData />           // Site search capability
<BreadcrumbStructuredData />        // Navigation hierarchy
```

### Metadata Functions

```typescript
getDashboardMetadata(); // Dashboard page
getRestaurantsMetadata(); // Restaurant search
getGroupsMetadata(); // Groups page
getFriendsMetadata(); // Friends page
getHistoryMetadata(); // Decision history
getProfileMetadata(); // User profile
getAnalyticsMetadata(); // Analytics page
getPrivacyPolicyMetadata(); // Privacy policy
getSignInMetadata(); // Sign-in page
getSignUpMetadata(); // Sign-up page
```

### SEO Checklist

- [x] Every page has unique `<title>`
- [x] Every page has unique meta description
- [x] Heading hierarchy (h1 → h2 → h3) correct
- [x] Images have alt attributes
- [x] Links have descriptive text
- [x] Canonical URLs set
- [x] Open Graph tags present
- [x] Twitter Card tags present
- [x] Structured data validates
- [x] Sitemap accessible
- [x] Robots.txt accessible

### Target Keywords

**Primary**: restaurant decision maker, where to eat app, group restaurant voting

**Secondary**: restaurant discovery app, food decision app, restaurant collections

**Long-tail**: how to decide where to eat with friends, collaborative restaurant decision making

### Google Search Console Setup

1. **Submit Sitemap**: Search Console → Sitemaps → Add `https://yourdomain.com/sitemap.xml`
2. **Verify Indexing**: URL Inspection → Test any page URL
3. **Request Indexing**: For homepage and key pages
4. **Monitor Performance**: Track clicks, impressions, CTR, position

---

## Vercel Analytics

### What Was Implemented

**Packages**:

- `@vercel/analytics` - Page views and performance
- `@vercel/speed-insights` - Core Web Vitals

**Components** (in `/src/app/layout.tsx`):

```tsx
<GoogleAnalytics />    {/* Your existing GA4 */}
<Analytics />          {/* NEW: Vercel Analytics */}
<SpeedInsights />      {/* NEW: Vercel Speed Insights */}
```

### Why Both Analytics?

| Feature      | Google Analytics             | Vercel Analytics            |
| ------------ | ---------------------------- | --------------------------- |
| **Tracks**   | Custom events, user behavior | Page views, Core Web Vitals |
| **Cookies**  | Yes (3-4 cookies)            | No cookies                  |
| **Size**     | ~45KB                        | ~1.5KB                      |
| **Data**     | Sent to Google               | Sent to Vercel              |
| **Use Case** | Behavior analysis            | Performance monitoring      |

**They don't conflict** - different scripts, servers, purposes.

### Viewing Data

#### Google Analytics

- Dashboard: [analytics.google.com](https://analytics.google.com/)
- Real-time tracking, custom events, conversions

#### Vercel Analytics

- Dashboard: Vercel project → **Analytics** tab
- Page views, top pages, traffic sources

#### Vercel Speed Insights

- Dashboard: Vercel project → **Speed Insights** tab
- Core Web Vitals, performance scores per page

### Environment Variables

```bash
# Google Analytics (required)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Vercel Analytics (optional - auto-detects Vercel environment)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### Performance Impact

- **Before (GA4 only)**: ~45KB
- **After (GA4 + Vercel)**: ~46.5KB
- **Additional load**: < 2KB (negligible)

### Troubleshooting

**Vercel Analytics not showing data?**

1. Ensure deployed on **Vercel** (doesn't work on other platforms)
2. Wait a few minutes - data isn't instant
3. Check Vercel Dashboard → Analytics tab
4. Verify no ad blockers enabled

**Google Analytics stopped working?**

- No! They're independent. Check:
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set
  - Browser console for gtag errors
  - GA dashboard for data

**Different numbers?**

- This is **normal**! Different tracking methods = different counts

### Benefits of Dual Strategy

**Google Analytics (Behavior)**:

- ✅ Track user journeys
- ✅ Measure conversions
- ✅ Understand demographics
- ✅ Custom event tracking

**Vercel Analytics (Performance)**:

- ✅ Monitor Core Web Vitals (affects SEO)
- ✅ Identify slow pages
- ✅ Track performance regressions
- ✅ Privacy-friendly (no cookies)

---

## Common Commands

### Development

```bash
npm run dev                 # Start development server
npm run build              # Build production bundle
npm run start              # Start production server
npm run lint               # Run ESLint
npm run type-check         # Run TypeScript compiler
```

### Testing

```bash
npm test                   # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
npm run test:e2e           # Run Playwright E2E tests
npm run test:e2e:ui        # Run E2E tests with UI
```

### Performance

```bash
npm run analyze            # Analyze bundle size
npm run lighthouse         # Run Lighthouse audit
```

### Production Simulation

```bash
npm run prod               # Build and start in production mode
npm run prod:build         # Build only
npm run prod:start         # Start only (must build first)
```

### Deployment

```bash
vercel                     # Deploy to Vercel (preview)
vercel --prod              # Deploy to production
vercel env pull            # Pull environment variables
```

### Database

```bash
# MongoDB Atlas - use connection string from .env.local
# No local MongoDB required
```

### Error Tracking

```bash
# View errors in Admin dashboard
# Navigate to /admin → Error Tracking tab
```

### Analytics

```bash
# View analytics in Admin dashboard
# Navigate to /admin → Analytics tab
# Or check Google Analytics dashboard
```

---

## Environment Variables Quick Reference

### Required for Development

```bash
# Database
MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=fork-in-the-road

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Google APIs
GOOGLE_PLACES_API_KEY=AIza...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
GOOGLE_ADDRESS_VALIDATION_API_KEY=AIza...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional Services

```bash
# Analytics (Production)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# SMS Notifications
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_TO_PHONE_NUMBER=+1...  # Development only

# Email Notifications
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@forkintheroad.app

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:your-email@example.com
```

---

## Quick Debugging Tips

### Analytics Not Tracking

1. Check environment variable is set
2. Verify production mode
3. Check browser console for `[Analytics]` logs in development
4. Enable GA4 debug mode in browser
5. Check Network tab for `google-analytics.com/g/collect` requests

### Build Errors

1. Run `npm run type-check` to find TypeScript errors
2. Run `npm run lint` to find linting errors
3. Clear `.next` directory and rebuild
4. Check `node_modules` is up to date

### Test Failures

1. Check mocks are properly configured
2. Verify test environment variables
3. Clear test cache: `npm test -- --clearCache`
4. Run single test file to isolate issue

### Performance Issues

1. Run `npm run analyze` to check bundle size
2. Check Network tab for slow requests
3. Use React DevTools Profiler
4. Check for unnecessary re-renders

---

**Document Version**: 1.0  
**Last Updated**: October 21, 2025  
**Purpose**: Quick reference for common development tasks
