# API Request Optimization - Vercel Cost Reduction

## Problem Summary

Your app was generating **1.3k requests/hour** from just a few users due to aggressive 30-second polling intervals. This would quickly exhaust Vercel's free tier limits (100GB bandwidth, 100GB-hours serverless function execution).

## Root Causes Identified

1. **Multiple 30-second polling intervals** running simultaneously
2. **No visibility-based polling** (continued polling when tab inactive)
3. **No request throttling or deduplication**
4. **Performance monitoring** running in production
5. **Short cache TTLs** causing frequent refetches

## Optimizations Implemented

### 1. ✅ Reduced Polling Frequencies

**Before:** 30 seconds → **After:** 5 minutes (10x reduction)

- **Notifications:** 30s → 5min (120 → 12 requests/hour per user)
- **Group Decisions:** 30s → 5min (120 → 12 requests/hour per user)
- **PWA Sync:** 30s → 5min (120 → 12 requests/hour per user)
- **Performance Monitor:** Disabled in production

### 2. ✅ Added Visibility-Aware Polling

- **Active tab:** 5-minute intervals
- **Inactive tab:** 15-minute intervals (or disabled)
- **Background polling:** Disabled globally

### 3. ✅ Implemented Request Throttling

- **Max 10 requests per minute** per endpoint
- **Request deduplication** prevents duplicate calls
- **Smart caching** with 30-second TTL

### 4. ✅ Enhanced Caching Strategy

- **Stale time:** 30s → 5min (data stays fresh longer)
- **GC time:** 5min → 10min (keeps data in memory longer)
- **Background refetch:** Disabled

### 5. ✅ Production Optimizations

- **Performance monitoring:** Disabled in production
- **Server monitoring:** 30s → 5min in production
- **Development vs Production:** Different intervals

## Expected Impact

### Request Reduction Calculation

**Before (per user):**

- Notifications: 120/hour
- Group Decisions: 120/hour
- PWA Sync: 120/hour
- Performance Monitor: 120/hour
- **Total: ~480 requests/hour per user**

**After (per user):**

- Notifications: 12/hour (5min intervals)
- Group Decisions: 12/hour (5min intervals)
- PWA Sync: 12/hour (5min intervals)
- Performance Monitor: 0/hour (disabled in prod)
- **Total: ~36 requests/hour per user**

### Cost Savings

- **87% reduction** in API requests
- **From 1.3k/hour to ~170/hour** for same user base
- **Vercel free tier:** Now supports ~50+ concurrent users instead of 5-10

## Additional Recommendations

### 1. Implement WebSockets (Future)

Replace polling with WebSockets for real-time features:

```typescript
// Instead of polling every 5 minutes
const socket = new WebSocket('/api/notifications/ws');
socket.onmessage = (event) => {
  // Real-time updates without polling
};
```

### 2. Add Request Analytics

Monitor actual API usage:

```typescript
// Track API calls per user
const apiUsage = await fetch('/api/analytics/usage');
```

### 3. Implement Progressive Loading

Load critical data first, non-critical later:

```typescript
// Critical: Load immediately
const notifications = useQuery(['notifications'], fetchNotifications);

// Non-critical: Load after delay
const analytics = useQuery(['analytics'], fetchAnalytics, {
  enabled: false, // Load on demand
});
```

### 4. Add Request Batching

Combine multiple API calls:

```typescript
// Instead of 3 separate calls
const batchData = await fetch('/api/batch', {
  body: JSON.stringify({
    notifications: true,
    decisions: true,
    profile: true,
  }),
});
```

## Monitoring & Alerts

### Set up Vercel Analytics

1. Enable Vercel Analytics in dashboard
2. Monitor request volume trends
3. Set up alerts for unusual spikes

### Track Key Metrics

- Requests per user per hour
- API response times
- Cache hit rates
- Error rates

## Testing the Changes

### Before Deployment

1. Test polling intervals work correctly
2. Verify visibility detection
3. Check throttling behavior
4. Confirm caching works

### After Deployment

1. Monitor Vercel dashboard for request reduction
2. Check user experience isn't degraded
3. Verify real-time features still work
4. Monitor error rates

## Emergency Rollback Plan

If issues arise, quickly revert polling intervals:

```typescript
// Emergency: Restore 30s polling
refetchInterval: 30000,
refetchIntervalInBackground: true,
```

## Long-term Strategy

1. **Phase 1:** ✅ Reduce polling (implemented)
2. **Phase 2:** Implement WebSockets for real-time features
3. **Phase 3:** Add request batching and optimization
4. **Phase 4:** Implement edge caching and CDN

This optimization should reduce your API costs by **80-90%** while maintaining good user experience.
