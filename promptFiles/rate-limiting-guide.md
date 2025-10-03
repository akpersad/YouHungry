# Rate Limiting Implementation Guide

This document outlines the recommended rate limiting strategy for all API endpoints in the You Hungry? application, designed for a beta launch with ~20 users.

## 🎯 **Rate Limiting Strategy Overview**

### **Target Audience**: Beta Launch (~20 Users)

- **Expected Usage**: Light to moderate per user
- **Peak Usage**: Restaurant searches during meal times
- **Cost Sensitivity**: High - need to prevent runaway costs

### **Rate Limiting Goals**

1. **Prevent Abuse**: Protect against malicious or accidental excessive usage
2. **Cost Control**: Ensure API costs stay within budget
3. **Fair Usage**: Ensure all users get reasonable access
4. **Graceful Degradation**: Provide fallbacks when limits are hit

## 📊 **Recommended Rate Limits by Endpoint**

### **1. Restaurant Search APIs**

#### **Text Search (`/api/restaurants/search`)**

- **Rate Limit**: 30 requests per minute per user
- **Burst Limit**: 10 requests per 10 seconds
- **Daily Limit**: 200 requests per user
- **Reasoning**:
  - Most expensive API call ($32/1k requests)
  - Users typically search 2-3 times per meal
  - 20 users × 3 meals × 3 searches = 180 daily requests (safety margin)

#### **Nearby Search (`/api/restaurants/search?lat=&lng=`)**

- **Rate Limit**: 50 requests per minute per user
- **Burst Limit**: 15 requests per 10 seconds
- **Daily Limit**: 300 requests per user
- **Reasoning**:
  - Slightly cheaper than text search
  - More likely to be used for location-based browsing

#### **Restaurant Details (`/api/restaurants/[id]`)**

- **Rate Limit**: 100 requests per minute per user
- **Burst Limit**: 25 requests per 10 seconds
- **Daily Limit**: 500 requests per user
- **Reasoning**:
  - Cheaper API call ($17/1k requests)
  - Users browse multiple restaurant details

### **2. Collection Management APIs**

#### **Create Collection (`POST /api/collections`)**

- **Rate Limit**: 5 requests per minute per user
- **Daily Limit**: 10 requests per user
- **Reasoning**: Users don't create collections frequently

#### **Add Restaurant to Collection (`POST /api/collections/[id]/restaurants`)**

- **Rate Limit**: 20 requests per minute per user
- **Daily Limit**: 100 requests per user
- **Reasoning**: Users add multiple restaurants to collections

### **3. Group Management APIs**

#### **Create Group (`POST /api/groups`)**

- **Rate Limit**: 3 requests per minute per user
- **Daily Limit**: 5 requests per user
- **Reasoning**: Groups are created infrequently

#### **Group Decision Making (`POST /api/decisions/group`)**

- **Rate Limit**: 10 requests per minute per user
- **Daily Limit**: 20 requests per user
- **Reasoning**: Group decisions happen during meal planning

### **4. User Management APIs**

#### **Friend Requests (`POST /api/friends/requests`)**

- **Rate Limit**: 10 requests per minute per user
- **Daily Limit**: 50 requests per user
- **Reasoning**: Social features have moderate usage

#### **User Search (`GET /api/friends/search`)**

- **Rate Limit**: 30 requests per minute per user
- **Daily Limit**: 100 requests per user
- **Reasoning**: Users search for friends occasionally

### **5. External API Proxies**

#### **Address Validation (`POST /api/address/validate`)**

- **Rate Limit**: 20 requests per minute per user
- **Daily Limit**: 100 requests per user
- **Reasoning**: Address validation is used during location setup

#### **Address Suggestions (`GET /api/address/suggestions`)**

- **Rate Limit**: 60 requests per minute per user
- **Daily Limit**: 200 requests per user
- **Reasoning**: Autocomplete has higher frequency but lower cost

## 🛠️ **Implementation Strategy**

### **1. Rate Limiting Library**

```typescript
// Recommended: express-rate-limit or similar
import rateLimit from 'express-rate-limit';

const restaurantSearchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many restaurant searches, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### **2. User-Based Rate Limiting**

```typescript
// Use Clerk user ID for rate limiting
const userRateLimit = rateLimit({
  keyGenerator: (req) => {
    return req.auth?.userId || req.ip; // Fallback to IP
  },
  windowMs: 60 * 1000,
  max: 30,
});
```

### **3. Tiered Rate Limiting**

```typescript
// Different limits for different user types
const getRateLimit = (userType: 'beta' | 'premium' | 'admin') => {
  const limits = {
    beta: 30,
    premium: 100,
    admin: 1000,
  };
  return limits[userType];
};
```

## 📈 **Monitoring & Alerts**

### **1. Rate Limit Metrics**

- Track rate limit hits per endpoint
- Monitor user usage patterns
- Alert on unusual spikes

### **2. Cost Alerts**

- Daily cost threshold: $10
- Hourly cost threshold: $2
- Per-user daily cost threshold: $1

### **3. Usage Analytics**

- Most used endpoints
- Peak usage times
- User behavior patterns

## 🚨 **Emergency Controls**

### **1. Circuit Breakers**

- Automatically disable expensive endpoints if costs spike
- Implemented in `src/lib/circuit-breaker.ts`

### **2. Manual Overrides**

- Admin ability to temporarily increase limits
- Emergency cost-cutting mode
- User-specific limit adjustments

### **3. Fallback Strategies**

- Cached responses when rate limited
- Graceful degradation messages
- Alternative data sources

## 💰 **Cost Projections**

### **Conservative Estimates (20 Users)**

- **Daily Restaurant Searches**: 60 searches × $0.032 = $1.92
- **Daily Place Details**: 120 details × $0.017 = $2.04
- **Daily Geocoding**: 40 geocoding × $0.005 = $0.20
- **Total Daily Cost**: ~$4.16
- **Monthly Cost**: ~$125

### **With Rate Limiting**

- **Reduced by 70%**: ~$37.50/month
- **Safety margin**: Prevents runaway costs
- **Scalable**: Easy to adjust as user base grows

## 🔧 **Implementation Checklist**

### **Phase 1: Core Rate Limiting**

- [ ] Implement express-rate-limit middleware
- [ ] Add user-based rate limiting
- [ ] Set up basic monitoring

### **Phase 2: Advanced Features**

- [ ] Implement burst limiting
- [ ] Add daily limits
- [ ] Set up cost alerts

### **Phase 3: Monitoring & Optimization**

- [ ] Add usage analytics
- [ ] Implement circuit breakers
- [ ] Set up emergency controls

## 📋 **Rate Limit Configuration**

### **Environment Variables**

```bash
# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=true
RATE_LIMIT_SKIP_FAILED_REQUESTS=false

# Cost Monitoring
DAILY_COST_THRESHOLD=10
HOURLY_COST_THRESHOLD=2
PER_USER_DAILY_COST_THRESHOLD=1
```

### **Rate Limit Headers**

```typescript
// Standard rate limit headers
'X-RateLimit-Limit': '30',
'X-RateLimit-Remaining': '25',
'X-RateLimit-Reset': '1640995200',
'X-RateLimit-Retry-After': '60'
```

## 🎯 **Beta Launch Recommendations**

### **Start Conservative**

- Begin with lower limits
- Monitor usage patterns
- Adjust based on actual usage

### **User Communication**

- Clear error messages when rate limited
- Explain why limits exist
- Provide alternatives when possible

### **Gradual Scaling**

- Increase limits as usage patterns emerge
- Monitor costs closely
- Adjust based on user feedback

## 📞 **Emergency Contacts**

### **If Rate Limits Are Too Restrictive**

1. Check admin dashboard for usage patterns
2. Temporarily increase limits for affected users
3. Investigate if limits are appropriate

### **If Costs Spike**

1. Check circuit breaker status
2. Review rate limit effectiveness
3. Consider emergency cost-cutting measures

---

## 📝 **Notes**

- Rate limits should be reviewed monthly
- Adjust based on actual usage patterns
- Consider user feedback for limit adjustments
- Monitor external API rate limits (Google Places, etc.)
- Implement graceful degradation for all endpoints
