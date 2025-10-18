# Vercel Analytics Implementation

## Overview

This document explains how Vercel Analytics and Speed Insights are implemented alongside Google Analytics 4 (GA4) without conflicts.

## Implementation Date

October 18, 2025

## Why Both Analytics Solutions?

Our application uses both **Google Analytics 4** and **Vercel Analytics** because they serve complementary purposes:

### Google Analytics 4

- **Purpose**: Comprehensive user behavior tracking
- **Tracks**: User journeys, conversions, events, demographics
- **Use Cases**:
  - Understanding user flows
  - Tracking custom events (restaurant searches, group decisions, etc.)
  - Conversion tracking
  - User segmentation
- **Method**: Client-side JavaScript (gtag.js)
- **Data Collection**: Cookie-based, sent to Google servers

### Vercel Analytics

- **Purpose**: Performance monitoring and page view tracking
- **Tracks**: Page views, web vitals (LCP, FID, CLS, TTFB, FCP)
- **Use Cases**:
  - Monitoring application performance
  - Tracking Core Web Vitals
  - Simple, privacy-friendly page view counts
  - No cookies or personal data collection
- **Method**: Lightweight client-side script with server-side aggregation
- **Data Collection**: Anonymous, stored in Vercel's edge network

### Vercel Speed Insights

- **Purpose**: Real-time performance monitoring
- **Tracks**: Real User Monitoring (RUM) data, Core Web Vitals
- **Use Cases**:
  - Identifying slow pages
  - Monitoring performance regressions
  - SEO optimization (Core Web Vitals affect search rankings)
- **Method**: Minimal client-side beacon
- **Data Collection**: Anonymous performance metrics only

## Why They Don't Conflict

1. **Different Tracking Methods**
   - Google Analytics uses gtag.js with cookies
   - Vercel Analytics uses a lightweight proprietary script
   - They operate independently on different scripts/domains

2. **Different Data Destinations**
   - GA4 sends data to Google's servers
   - Vercel Analytics sends data to Vercel's edge network
   - No shared data layer or communication

3. **Different Performance Impact**
   - GA4: ~45KB initial load, uses multiple cookies
   - Vercel Analytics: ~1KB, no cookies
   - Speed Insights: ~0.5KB beacon
   - Total impact is additive but minimal

4. **Different Loading Strategies**
   - All use `afterInteractive` or similar strategies
   - Load after critical content is rendered
   - Don't block page rendering

## Implementation Details

### Location

All analytics components are added in `/src/app/layout.tsx`:

```tsx
<GoogleAnalytics />    {/* Custom GA4 implementation */}
<Analytics />          {/* Vercel Analytics */}
<SpeedInsights />      {/* Vercel Speed Insights */}
```

### Order of Loading

1. **Google Analytics** - Loads first (historical placement)
2. **Vercel Analytics** - Loads second
3. **Vercel Speed Insights** - Loads third

The order doesn't matter functionally since they're independent, but maintaining consistency is good practice.

### Environment Configuration

#### Google Analytics

Requires environment variable:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Only runs in production when this variable is set.

#### Vercel Analytics

- **No environment variables needed** when deployed on Vercel
- Auto-detects Vercel environment
- Can be configured with options if needed:
  ```tsx
  <Analytics
    beforeSend={(event) => {
      // Optional: Filter events, add custom properties
      return event;
    }}
  />
  ```

#### Vercel Speed Insights

- **No configuration needed**
- Works automatically on Vercel
- Can add custom routes/sampling:
  ```tsx
  <SpeedInsights
    sampleRate={1} // 100% sampling (default: 0.1 = 10%)
    route="/custom" // Custom route name
  />
  ```

## Data Privacy Compliance

### Google Analytics

- Configured with `anonymize_ip: true`
- Cookie consent managed separately
- User ID tracking for authenticated users
- Compliant with GDPR/CCPA when properly configured

### Vercel Analytics

- **No cookies used**
- **No personal data collected**
- Compliant with GDPR/CCPA by default
- Anonymous page view tracking only

### Vercel Speed Insights

- **No cookies used**
- **No personal data collected**
- Only collects performance metrics
- Fully anonymous

## Performance Impact

### Before (GA4 only)

- Initial load: ~45KB
- Cookies: 3-4 cookies
- Network requests: 2-3 per page view

### After (GA4 + Vercel)

- Initial load: ~46.5KB (+1.5KB)
- Cookies: 3-4 cookies (Vercel adds none)
- Network requests: 4-5 per page view (+1-2 lightweight beacons)

**Total impact: Negligible** (< 2KB additional)

## Monitoring & Debugging

### Google Analytics

- View data: [Google Analytics Dashboard](https://analytics.google.com/)
- Debug: Use [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger)
- Real-time: GA4 Real-Time reports

### Vercel Analytics

- View data: Vercel Dashboard → Analytics tab
- Debug: Browser DevTools → Network tab (look for `/_vercel/insights/*`)
- Real-time: Vercel Analytics dashboard updates every few minutes

### Vercel Speed Insights

- View data: Vercel Dashboard → Speed Insights tab
- Debug: Browser DevTools → Performance tab
- Real-time: Data appears within minutes

## Testing

### Development

Both analytics systems are disabled in development by default:

- Google Analytics: Only runs when `NODE_ENV === 'production'`
- Vercel Analytics: Only sends data in Vercel deployments

To test locally:

```bash
# Build and run production mode
npm run build
npm run start
```

### Staging/Preview Deployments

- Google Analytics: Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel preview environment
- Vercel Analytics: Automatically tracks preview deployments separately

### Production

Both systems track production traffic independently.

## Troubleshooting

### Google Analytics not tracking

1. Check `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set
2. Verify `NODE_ENV === 'production'`
3. Check browser console for gtag errors
4. Verify no ad blockers blocking Google Analytics

### Vercel Analytics not tracking

1. Verify deployed on Vercel (doesn't work on other hosts)
2. Check Vercel Dashboard → Analytics (data appears after few minutes)
3. Verify no script blockers in browser
4. Check browser console for errors

### Conflicts Between Analytics

If you suspect conflicts:

1. Open Browser DevTools → Console
2. Check for JavaScript errors
3. Verify both scripts load: Network tab, filter for `gtag` and `_vercel`
4. Use `window.gtag` and check for Vercel's script in Network

**Expected behavior**: Both should load and track independently without errors.

## Best Practices

### Do's

✅ Keep both analytics systems for comprehensive tracking
✅ Use GA4 for custom events and user behavior
✅ Use Vercel Analytics for performance monitoring
✅ Monitor both dashboards regularly
✅ Respect user privacy preferences for both systems

### Don'ts

❌ Don't duplicate events in both systems
❌ Don't use Vercel Analytics for custom event tracking (use GA4)
❌ Don't use GA4 for Core Web Vitals (use Vercel Speed Insights)
❌ Don't disable one without understanding the data loss

## Custom Configuration (Optional)

### Google Analytics Custom Events

Located in `/src/lib/analytics.ts`:

```typescript
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  if (isAnalyticsAvailable()) {
    window.gtag?.('event', eventName, properties);
  }
}
```

### Vercel Analytics Custom Properties

Can add custom properties to all events:

```tsx
<Analytics
  beforeSend={(event) => {
    if (event.url.includes('/dashboard')) {
      event.properties = {
        ...event.properties,
        section: 'dashboard',
      };
    }
    return event;
  }}
/>
```

## Future Enhancements

### Potential Additions

- [ ] Segment.com integration for unified tracking
- [ ] Custom dashboards combining GA4 + Vercel data
- [ ] Automated alerts for performance regressions
- [ ] A/B testing with both analytics systems

### Deprecation Plan

If needed to remove one system:

1. **Document data requirements** from that system
2. **Migrate tracking** to remaining system if needed
3. **Remove package** and components
4. **Update documentation**
5. **Monitor for 30 days** to ensure no data loss

## Summary

- ✅ **Google Analytics** and **Vercel Analytics** work independently
- ✅ **No conflicts** - different scripts, methods, and data destinations
- ✅ **Minimal performance impact** (< 2KB additional)
- ✅ **Complementary data** - behavior tracking + performance monitoring
- ✅ **Privacy-friendly** - Vercel Analytics uses no cookies

Both systems enhance our understanding of the application without interfering with each other.
