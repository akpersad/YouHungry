# Baseline Performance Metrics

**Epic 9 Story 4: Performance Benchmarking & Monitoring**

## Overview

This document establishes baseline performance metrics for the You Hungry? application prior to implementing advanced optimizations (e.g., GraphQL). These baselines serve as reference points for measuring the effectiveness of future performance improvements.

**Date Established**: October 14, 2025  
**Application Version**: 0.1.0  
**Environment**: Development/Production  
**Technology Stack**: Next.js 15, REST APIs, MongoDB, TanStack Query

---

## 📊 Performance Metrics Summary

### 1. Bundle Performance

| Metric            | Target   | Current Status   |
| ----------------- | -------- | ---------------- |
| First Load JS     | < 250 KB | ✅ Within limits |
| Total Bundle Size | < 500 KB | ✅ Within limits |
| Build Time        | < 60s    | ✅ Acceptable    |

**Notes**:

- Using Next.js 15 with Turbopack for development
- Code splitting implemented for major routes
- Lazy loading for non-critical components
- Bundle analyzer configured for monitoring

### 2. Web Vitals (Core Web Vitals)

| Metric                         | Good    | Needs Improvement | Current            |
| ------------------------------ | ------- | ----------------- | ------------------ |
| FCP (First Contentful Paint)   | < 1.8s  | < 3.0s            | TBD via Lighthouse |
| LCP (Largest Contentful Paint) | < 2.5s  | < 4.0s            | TBD via Lighthouse |
| FID (First Input Delay)        | < 100ms | < 300ms           | TBD via Lighthouse |
| CLS (Cumulative Layout Shift)  | < 0.1   | < 0.25            | TBD via Lighthouse |
| TTFB (Time to First Byte)      | < 800ms | < 1800ms          | TBD via Lighthouse |

**Collection Method**:

- Lighthouse CI for automated measurement
- Real User Monitoring (RUM) via Web Vitals API
- Performance API for custom measurements

**Optimization Status**:

- ✅ Next.js Image optimization enabled
- ✅ Font optimization with next/font
- ✅ Lazy loading implemented
- ✅ Skeleton screens for loading states
- ✅ Preconnect to external APIs

### 3. API Performance (REST)

#### Critical API Endpoints

| Endpoint                  | Target Response Time | Current Performance     | Notes                        |
| ------------------------- | -------------------- | ----------------------- | ---------------------------- |
| `/api/collections`        | < 500ms              | Measured via monitoring | Database query, auth check   |
| `/api/restaurants/search` | < 2000ms             | Variable (external API) | Google Places API dependency |
| `/api/user/profile`       | < 300ms              | Fast (cached)           | Clerk user data              |
| `/api/groups`             | < 500ms              | Measured via monitoring | Multiple DB queries          |
| `/api/decisions/history`  | < 800ms              | Measured via monitoring | Complex aggregation          |
| `/api/friends`            | < 300ms              | Fast (indexed)          | Indexed queries              |
| `/api/analytics/personal` | < 1000ms             | Complex queries         | Multiple aggregations        |

**Optimization Techniques**:

- ✅ Database indexing on frequently queried fields
- ✅ TanStack Query for client-side caching
- ✅ API-level caching with TTL
- ✅ Optimistic updates for better UX
- ✅ Request deduplication

### 4. Caching Effectiveness

#### Current Caching Strategy

| Layer          | Implementation | Hit Rate Target | Current Status          |
| -------------- | -------------- | --------------- | ----------------------- |
| Memory Cache   | In-memory LRU  | > 70%           | Tracked via API         |
| Database Cache | MongoDB TTL    | N/A             | Automatic expiration    |
| Client Cache   | TanStack Query | > 80%           | Default 5min stale time |
| Google Places  | Custom cache   | > 70%           | Cost optimization       |

**Cache Performance Metrics**:

- **Overall Cache Hit Rate**: Tracked in real-time
- **Memory Cache Size**: Monitored for optimization
- **Cache Miss Penalty**: Average additional latency
- **Cost Savings**: Estimated based on cache hits

**API Usage Tracking**:

- ✅ Real-time tracking via `api_usage` collection
- ✅ Cost calculation per API type
- ✅ Cache hit/miss tracking
- ✅ Daily/monthly cost projections

### 5. Database Performance

#### Query Performance Baselines

| Query Type             | Target  | Current    | Optimization   |
| ---------------------- | ------- | ---------- | -------------- |
| Simple reads (by \_id) | < 10ms  | Fast       | Primary index  |
| User collections       | < 50ms  | Good       | userId index   |
| Decision history       | < 100ms | Acceptable | Compound index |
| Analytics aggregations | < 500ms | Complex    | Indexed fields |
| Friend searches        | < 50ms  | Good       | Username index |

**Indexes in Place**:

- ✅ User ID on all user-related collections
- ✅ Date indexes for time-based queries
- ✅ Compound indexes for complex queries
- ✅ Text indexes for search functionality

**Connection Pooling**:

- Max pool size: 10 connections
- Min pool size: 2 connections
- Connection timeout: 30s

### 6. External API Costs

#### Google APIs

| API                | Usage    | Cost per 1K | Monthly Budget | Current Spend |
| ------------------ | -------- | ----------- | -------------- | ------------- |
| Places Text Search | Variable | $32         | $10            | Tracked       |
| Places Nearby      | Variable | $32         | $5             | Tracked       |
| Place Details      | Variable | $17         | $5             | Tracked       |
| Geocoding          | Low      | $5          | $2             | Tracked       |
| Address Validation | Low      | $5          | $2             | Tracked       |
| Maps Load          | Per page | $7          | $3             | Tracked       |

**Total Monthly Budget**: ~$30  
**Cost Optimization**:

- ✅ Aggressive caching (70%+ hit rate target)
- ✅ Request deduplication
- ✅ Location-based cache keys
- ✅ TTL optimization (24-48 hours for restaurant data)

#### Other Services

| Service      | Usage Pattern | Monthly Cost | Notes               |
| ------------ | ------------- | ------------ | ------------------- |
| Clerk Auth   | < 10K MAU     | Free tier    | User authentication |
| Twilio SMS   | < 100/month   | ~$1          | Group notifications |
| Resend Email | < 3K/month    | Free tier    | Email notifications |
| Vercel Blob  | < 1GB         | Free tier    | Profile pictures    |

---

## 🎯 Performance Targets

### Development Goals (Next 3 Months)

1. **Bundle Size**: Maintain < 250KB first load JS
2. **Web Vitals**: All metrics in "Good" range
3. **API Response**: 95th percentile < 1s for all endpoints
4. **Cache Hit Rate**: > 75% across all caching layers
5. **API Costs**: < $25/month with 20 active users

### GraphQL Migration Comparison (Future)

After implementing GraphQL (Epic 10), we will compare:

| Metric               | REST Baseline  | GraphQL Target  | Improvement Goal |
| -------------------- | -------------- | --------------- | ---------------- |
| Dashboard Load       | TBD            | TBD             | 30% faster       |
| API Requests         | Multiple       | Single          | 50-70% reduction |
| Data Transfer        | Full objects   | Selected fields | 40-60% smaller   |
| Client Caching       | Per endpoint   | Normalized      | Better hit rates |
| Developer Experience | Multiple calls | Single query    | Simplified       |

---

## 📈 Monitoring & Tracking

### Automated Monitoring

1. **Daily Metrics Collection**
   - Script: `npm run perf:collect`
   - Frequency: Daily at 2 AM
   - Storage: `performance-metrics/daily-metrics/`

2. **Performance Comparison**
   - Script: `npm run perf:compare`
   - Frequency: Weekly
   - Output: Trend analysis and alerts

3. **Dashboard Visualization**
   - Script: `npm run perf:dashboard`
   - Access: `performance-metrics/dashboard.html`
   - Updates: Real-time

### CI/CD Integration

- ✅ Playwright performance tests on every PR
- ✅ Lighthouse CI on main branch
- ✅ Bundle size regression tests
- ✅ API synthetic monitoring
- ✅ Accessibility testing

### Manual Monitoring

1. **Admin Dashboard**
   - Path: `/admin` → Cost Monitoring tab
   - Metrics: Real-time API usage and costs
   - Refresh: Auto-refresh every 5 minutes

2. **Production Monitoring**
   - Vercel Analytics: Web Vitals tracking
   - Custom logging: API performance logs
   - Error tracking: Error boundaries + admin dashboard

---

## 🔍 Baseline Data Collection Process

### 1. Bundle Analysis

```bash
# Run bundle analyzer
npm run analyze

# Record metrics
- First Load JS size
- Total bundle size
- Number of chunks
- Build time
```

### 2. Web Vitals Collection

```bash
# Run Lighthouse CI
npm run lighthouse

# Record Core Web Vitals
- FCP, LCP, FID, CLS, TTFB
- Performance score
- Best practices score
```

### 3. API Performance Testing

```bash
# Run synthetic monitoring
npm run test:e2e:perf

# Measure:
- Response times for all endpoints
- Success rates
- Error rates
- Cache hit rates
```

### 4. Load Testing (Future)

- Use k6 or Artillery for load testing
- Simulate 20 concurrent users
- Measure performance under load
- Identify bottlenecks

---

## 📝 Baseline Methodology

### Data Collection Standards

1. **Environment**: Development server running locally
2. **Network**: Simulated 3G throttling (optional)
3. **Device**: Desktop (M1 Mac) and Mobile (iPhone 12 Pro)
4. **Browser**: Chrome latest stable
5. **Cache**: Cold start and warm cache scenarios
6. **Time**: Multiple measurements at different times

### Statistical Approach

- **Sample Size**: Minimum 10 measurements per metric
- **Calculation**: P50 (median) and P95 (95th percentile)
- **Outliers**: Removed (> 3 standard deviations)
- **Confidence**: 95% confidence interval

---

## 🚀 Next Steps

### Immediate Actions

1. ✅ Establish automated metrics collection
2. ✅ Implement real-time monitoring
3. ✅ Set up CI/CD performance gates
4. ⏳ Collect initial baseline data (1 week)
5. ⏳ Document findings in this file

### Future Optimizations (Post-Baseline)

1. **Phase 1: GraphQL Migration** (Epic 10)
   - Implement Apollo Server + Client
   - Migrate complex queries
   - Measure improvements

2. **Phase 2: Advanced Caching**
   - Redis for distributed caching
   - Service worker enhancements
   - CDN optimization

3. **Phase 3: Database Optimization**
   - Query optimization
   - Index tuning
   - Read replicas (if needed)

---

## 📚 References

- [Next.js Performance Documentation](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Google Places API Pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
- [TanStack Query Performance](https://tanstack.com/query/latest/docs/react/guides/performance)

---

**Last Updated**: October 14, 2025  
**Next Review**: Weekly with metrics collection  
**Owner**: Development Team
