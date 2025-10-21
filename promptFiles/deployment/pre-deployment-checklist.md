# 🚀 You Hungry? Pre-Deployment Checklist

**Current Status**: Epics 1-9 Complete (90% ready), Epic 10 remaining  
**Last Updated**: October 15, 2025

---

## ✅ **PHASE 1: Code Quality & Cleanup** (Estimated: 2-3 hours)

### 1.1 Bundle Analysis & Optimization

- [x] **Run bundle analyzer** to verify bloat removal results

  ```bash
  npm run analyze
  ```

  - [x] Verify bundle size is optimized (no GraphQL bloat)
  - [x] Check for any remaining large dependencies
  - [x] Confirm tree-shaking is working

- [ ] **Verify bloat cleanup was successful** (from bloat-audit-cleanup.md)
  - [x] ✅ GraphQL removed (17MB saved)
  - [x] ✅ Toast libraries consolidated (sonner only)
  - [x] ✅ Unused dependencies removed
  - [x] ✅ Test artifacts cleaned
  - [x] ✅ Color scripts consolidated
  - [x] ✅ Performance metrics in MongoDB

### 1.2 Code Quality Checks

- [x] **Run pre-push validation**

  ```bash
  npm run pre-push
  ```

  - [x] TypeScript compilation passes (`npm run type-check`)
  - [x] ESLint passes with no errors (`npm run lint`)
  - [x] All unit tests pass (`npm test`)
  - [x] Build completes successfully (`npm run build`)

- [x] **Run E2E tests**

  ```bash
  npm run test:e2e:all
  ```

  - [x] All critical user flows pass
  - [x] Authentication flow works
  - [x] No flaky tests remaining

- [x] **Verify test suite health** (from unit-test-audit.md)
  - [x] ✅ 109 test suites, ~1,367 tests
  - [x] ✅ All skipped tests documented (11 total)
  - [x] ✅ Zero mystery skipped tests
  - [x] All tests pass in CI environment

### 1.3 Remove Development Code

- [x] **Smart logging verification**

  ```bash
  npm run logs:clean
  ```

  - [x] All console logs use smart logger
  - [x] Debug logs disabled in production
  - [x] No temporary test code remains

- [x] **Remove test/debug files**
  - [x] ✅ test-db-connection.js deleted
  - [x] ✅ tests/skipped/ removed
  - [x] No debug endpoints in API routes
  - [x] No test data in database

---

## 🔧 **PHASE 2: Environment Variables** (Estimated: 1 hour)

### 2.1 Pre-Deployment Environment Variables

**These can be prepared NOW (don't require live URL):**

- [ ] **MongoDB Configuration**

  ```bash
  MONGODB_URI=mongodb+srv://...
  MONGODB_DATABASE=you-hungry
  ```

  - [ ] Production MongoDB cluster created
  - [ ] Network access configured (Vercel IPs or 0.0.0.0/0)
  - [ ] Database user created with proper permissions
  - [ ] Connection tested from local environment

- [ ] **Google APIs Configuration**

  ```bash
  GOOGLE_PLACES_API_KEY=AIza...
  GOOGLE_ADDRESS_VALIDATION_API_KEY=AIza...
  ```

  - [ ] API keys have **"None"** application restrictions (server-side use)
  - [ ] Places API enabled in Google Cloud Console
  - [ ] Address Validation API enabled
  - [ ] Billing account linked
  - [ ] Test API keys work locally

- [ ] **Twilio Configuration** (REQUIRED for SMS)

  ```bash
  TWILIO_ACCOUNT_SID=AC...
  TWILIO_AUTH_TOKEN=...
  TWILIO_PHONE_NUMBER=+1...
  ```

  - [ ] Twilio account upgraded to **paid plan** (required for phone verification)
  - [ ] Phone number purchased and verified
  - [ ] Test SMS delivery works
  - [ ] Account has sufficient credits

- [ ] **Resend Email Configuration** (REQUIRED for emails)

  ```bash
  RESEND_API_KEY=re_...
  RESEND_FROM_EMAIL=noreply@...
  ```

  - [ ] Resend account created
  - [ ] Domain verified (or use onboarding@resend.dev for testing)
  - [ ] API key generated
  - [ ] Test email delivery works

### 2.2 Post-Deployment Environment Variables

**These REQUIRE live URL (set AFTER deployment):**

- [ ] **Clerk Production Keys** (requires live URL for webhook)

  ```bash
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
  CLERK_SECRET_KEY=sk_live_...
  CLERK_WEBHOOK_SECRET=whsec_...
  NEXT_PUBLIC_APP_URL=https://www.forkintheroad.app
  ```

  - [ ] Clerk production project created
  - [ ] Production keys ready (will switch after deployment)
  - [ ] Webhook will be configured post-deployment

### 2.3 Environment Variable Security

- [ ] **Security audit**
  - [ ] No hardcoded secrets in code (grep for API keys)
  - [ ] `.env` files in `.gitignore`
  - [ ] No sensitive data in commit history
  - [ ] env.example updated with all required variables

---

## 🗄️ **PHASE 3: Database Preparation** (Estimated: 1 hour)

### 3.1 MongoDB Atlas Setup

- [ ] **Production database cluster**

  - [ ] Cluster created and running
  - [ ] Cluster tier appropriate for production (M10+ recommended)
  - [ ] Network access configured (0.0.0.0/0 or Vercel IPs)
  - [ ] Database user created with read/write permissions
  - [ ] Connection string tested

- [ ] **Database collections verification**

  - [ ] Verify all required collections exist:
    - `users`
    - `restaurants`
    - `collections`
    - `groups`
    - `decisions`
    - `friendships`
    - `inAppNotifications`
    - `performanceMetrics`
    - `alerts` (admin)
    - `errorLogs` (admin)
  - [ ] Indexes created for common queries
  - [ ] Database monitoring enabled

- [ ] **Data migration** (if applicable)
  - [ ] Backup development data
  - [ ] Plan migration strategy
  - [ ] Test migration in staging

---

## 🔐 **PHASE 4: Security & Configuration** (Estimated: 1 hour)

### 4.1 Security Audit

- [ ] **API security**

  - [ ] CORS settings configured (`next.config.ts`)
  - [ ] Rate limiting implemented on critical endpoints
  - [ ] Input validation on all API endpoints
  - [ ] Proper error handling (no sensitive info exposed)

- [ ] **Authentication security**

  - [ ] Clerk configuration reviewed
  - [ ] Protected routes verified (`middleware.ts`)
  - [ ] Session management works correctly
  - [ ] Sign-out clears all data

- [ ] **Admin panel security** (`/admin`)
  - [ ] `ADMIN_USER_IDS` environment variable configured in Vercel
  - [ ] Only authorized users can access admin panel
  - [ ] Admin endpoints protected
  - [ ] Test admin access restrictions

### 4.2 Configuration Files

- [ ] **Next.js configuration** (`next.config.ts`)

  - [ ] Production optimizations enabled
  - [ ] Image domains configured
  - [ ] Security headers set
  - [ ] Bundle analyzer removed from production build

- [ ] **Middleware configuration** (`middleware.ts`)
  - [ ] Public routes correctly configured
  - [ ] Protected routes require authentication
  - [ ] Admin routes restricted
  - [ ] Test authentication flow

---

## 🧪 **PHASE 5: Testing** (Estimated: 2-3 hours)

### 5.1 Local Production Build Test

- [ ] **Production build test**

  ```bash
  npm run build
  npm run start
  ```

  - [ ] All pages load correctly
  - [ ] API endpoints work
  - [ ] Authentication flow works
  - [ ] No console errors in production build

### 5.2 Integration Testing

- [ ] **External service integration**
  - [ ] MongoDB connection works
  - [ ] Google Places API returns results
  - [ ] Twilio SMS sends (if implemented)
  - [ ] Clerk authentication works
  - [ ] Resend emails deliver

### 5.3 Critical User Flows

- [ ] **Authentication**

  - [ ] User can sign up
  - [ ] User can sign in
  - [ ] User can sign out
  - [ ] Protected routes redirect properly

- [ ] **Collections**

  - [ ] Create personal collection
  - [ ] Add restaurant to collection
  - [ ] Make decision (random selection)
  - [ ] View decision history

- [ ] **Social Features**

  - [ ] Add friend
  - [ ] Create group
  - [ ] Create group collection
  - [ ] Group decision making

- [ ] **Notifications**
  - [ ] Toast notifications appear
  - [ ] In-app notifications work
  - [ ] Email preferences can be set
  - [ ] SMS opt-in works (if implemented)

### 5.4 Performance Testing

- [ ] **Lighthouse scores**

  ```bash
  npm run lighthouse
  ```

  - [ ] Performance > 90
  - [ ] Accessibility > 95
  - [ ] Best Practices > 90
  - [ ] SEO > 90

- [ ] **Load testing**
  - [ ] API endpoints perform well under load
  - [ ] Database queries are optimized
  - [ ] No memory leaks

---

## 📋 **PHASE 6: Documentation** (Estimated: 1 hour)

### 6.1 Update Documentation

- [ ] **README.md**

  - [ ] Add deployment instructions
  - [ ] Update environment variable documentation
  - [ ] Add troubleshooting section
  - [ ] Document all features

- [ ] **API documentation**
  - [ ] Document all API endpoints
  - [ ] Include request/response examples
  - [ ] Document authentication requirements

### 6.2 Deployment Documentation

- [ ] **Review deployment guides**
  - [x] ✅ `pre-deployment.md` exists and is comprehensive
  - [x] ✅ `post-deployment.md` exists and is comprehensive
  - [ ] Update any outdated information
  - [ ] Add any missing steps

---

## 🚀 **PHASE 7: Vercel Deployment Setup** (Estimated: 30 min)

### 7.1 Vercel Project Setup

- [ ] **Create Vercel project**

  - [ ] Link GitHub repository
  - [ ] Configure build settings
    - Build Command: `npm run build`
    - Output Directory: `.next`
    - Install Command: `npm install --legacy-peer-deps`
  - [ ] Set Node.js version: 18.x or higher

- [ ] **Set pre-deployment environment variables**
  - [ ] Add all pre-deployment env vars from Phase 2.1
  - [ ] Verify all required variables are set
  - [ ] Test build with production env vars

### 7.2 Custom Domain (Optional)

- [ ] **Domain configuration**
  - [ ] Purchase domain (if using custom domain)
  - [ ] Configure DNS settings
  - [ ] Add domain to Vercel project
  - [ ] SSL certificate will auto-generate

---

## 🎯 **PHASE 8: Final Pre-Deployment Review** (Estimated: 1 hour)

### 8.1 Code Review Checklist

- [ ] **Security review**

  - [ ] No hardcoded secrets
  - [ ] Proper input validation
  - [ ] Secure API endpoints
  - [ ] Proper error handling

- [ ] **Performance review**

  - [ ] Optimized database queries
  - [ ] Efficient API calls
  - [ ] Proper caching strategies
  - [ ] Optimized bundle sizes

- [ ] **Functionality review**
  - [ ] All features work as expected
  - [ ] Error scenarios handled properly
  - [ ] User experience is smooth
  - [ ] Mobile responsiveness verified

### 8.2 Known Issues Check

From the audit, verify these are resolved:

- [x] ✅ GraphQL infrastructure removed (no longer needed)
- [x] ✅ Duplicate toast libraries consolidated (sonner only)
- [x] ✅ Test artifacts cleaned up
- [ ] All skipped tests documented (11 remaining - acceptable)
- [ ] Admin panel security configured

---

## ✅ **PRE-DEPLOYMENT SIGN-OFF**

**Before deploying to Vercel, confirm:**

- [ ] ✅ All Phase 1-8 items completed
- [ ] ✅ All tests passing (unit + E2E)
- [ ] ✅ Production build successful
- [ ] ✅ Bundle optimized (<500KB JavaScript)
- [ ] ✅ All pre-deployment env vars ready
- [ ] ✅ Database configured and tested
- [ ] ✅ Security audit passed
- [ ] ✅ Documentation updated
- [ ] ✅ No blocking issues remain

---

## 📞 **POST-DEPLOYMENT CRITICAL TASKS**

**IMMEDIATELY after deployment (See `post-deployment.md` for details):**

### Priority #1: Push Notifications Testing

- [ ] **⚠️ CRITICAL**: Test push notifications on HTTPS
  - Can only be tested in production (HTTPS required)
  - iOS 16.4+ requires Home Screen installation
  - See post-deployment.md for detailed testing procedure

### Priority #2: URL-Dependent Configuration

- [ ] Set `NEXT_PUBLIC_APP_URL` with live URL (https://www.forkintheroad.app)
- [ ] Configure Clerk webhook with live URL
- [ ] Switch to Clerk production keys
- [ ] Get `CLERK_WEBHOOK_SECRET` from webhook setup
- [ ] Update Google API restrictions (optional)

### Priority #3: Phone Verification Testing

- [ ] Test Twilio SMS delivery in production
- [ ] Verify phone verification flow works
- [ ] Test SMS notifications

### Priority #4: Admin Panel Configuration

- [ ] Add production user ID to `ADMIN_USER_IDS` environment variable in Vercel
- [ ] Test admin panel access
- [ ] Verify all admin features work

---

## 📊 **Success Metrics**

After deployment, you should see:

- ✅ Lighthouse scores > 90 across all metrics
- ✅ All E2E tests passing
- ✅ Zero console errors in production
- ✅ Database queries < 200ms
- ✅ API response times < 500ms
- ✅ Bundle size optimized (43.7MB saved from cleanup)
- ✅ Push notifications work on iOS/Android
- ✅ All notification channels functional

---

## 🚨 **Critical Notes**

### Must Complete BEFORE Deployment:

1. ✅ Bundle analysis and optimization (bloat cleanup complete)
2. ✅ All tests passing (109 suites, 1,367 tests)
3. ⚠️ Environment variables prepared (MongoDB, Google, Twilio, Resend)
4. ⚠️ Database setup complete
5. ✅ Security review passed
6. ⚠️ Admin panel security configured

### Must Complete AFTER Deployment:

1. ⚠️ **Push notifications testing** (PRIORITY #1 - can only test on HTTPS)
2. ⚠️ Clerk webhook configuration
3. ⚠️ Phone verification testing
4. ⚠️ Production monitoring setup

---

## 📚 **Related Documentation**

- **Pre-Deployment Guide**: `promptFiles/deployment/pre-deployment.md` (comprehensive guide)
- **Post-Deployment Guide**: `promptFiles/deployment/post-deployment.md` (post-deployment tasks)
- **Unit Test Audit**: `promptFiles/audits/unit-test-audit-2025-10-15.md` (test suite health)
- **Bloat Cleanup**: `promptFiles/audits/bloat-audit-cleanup.md` (optimization progress)
- **Epic Breakdown**: `promptFiles/planning/epic-breakdown.md` (feature completion status)

---

## 📈 **Progress Summary**

### Completed Work:

- ✅ **Epic 1-9**: Foundation, Collections, Social, Decision Making, Mobile/PWA, Admin, Notifications, Analytics, Polish
- ✅ **Test Suite**: 109 suites, 1,367 tests, all documented
- ✅ **Bloat Cleanup**: 43.7MB saved, 78 packages removed
- ✅ **Performance**: Baseline metrics established, monitoring in place
- ✅ **Security**: WCAG 2.1 AA compliant, error boundaries, admin security

### Remaining Work:

- ⚠️ **Environment Setup**: Configure all production env vars
- ⚠️ **Database Setup**: Create production MongoDB cluster
- ⚠️ **Admin Security**: Add production user IDs to AdminGate
- ⚠️ **Final Testing**: Production build, E2E, integration tests
- ⚠️ **Epic 10**: Deployment & Launch

---

## 🔍 **PHASE 9: SEO & Marketing Preparation** (Estimated: 30 min)

### 9.1 SEO Verification

- [ ] **Sitemap validation**

  - [ ] Sitemap generates at build time (`/sitemap.xml`)
  - [ ] All public pages included
  - [ ] Proper priority and change frequency set

- [ ] **Schema.org structured data**

  - [ ] Organization schema present on homepage
  - [ ] WebApplication schema with features list
  - [ ] FAQ schema for GEO (AI search)
  - [ ] Validate at [Rich Results Test](https://search.google.com/test/rich-results)

- [ ] **Meta tags verification**

  - [ ] Every page has unique title and description
  - [ ] Open Graph tags for social sharing
  - [ ] Twitter Card tags configured
  - [ ] Canonical URLs set correctly

- [ ] **Robots.txt configuration**
  - [ ] Allows search engine crawling
  - [ ] Blocks admin/test routes
  - [ ] Sitemap location specified
  - [ ] AI bot permissions configured (GPTBot, Claude-Web, PerplexityBot)

### 9.2 Social Media Optimization

- [ ] **Open Graph images**

  - [ ] OG image exists (1200x630px recommended)
  - [ ] Image accessible via CDN
  - [ ] Preview looks good in [Facebook Debugger](https://developers.facebook.com/tools/debug/)

- [ ] **Social preview testing**
  - [ ] Facebook preview works
  - [ ] Twitter card displays correctly
  - [ ] LinkedIn preview looks good

### 9.3 Post-Deployment SEO Tasks

**After deployment**:

- [ ] Submit sitemap to Google Search Console
- [ ] Verify indexing in Search Console
- [ ] Request indexing for key pages
- [ ] Monitor search performance

---

## 📊 **PHASE 10: Monitoring & Alerting Setup** (Estimated: 1 hour)

### 10.1 Vercel Usage Monitoring

- [ ] **Environment variables for alerts**

  ```bash
  SLACK_WEBHOOK_URL=https://hooks.slack.com/...  # Optional
  ALERT_EMAIL=your-email@example.com             # Optional
  ```

- [ ] **Vercel monitoring configuration**
  - [ ] Cron job configured in `vercel.json` (already set: daily at midnight UTC)
  - [ ] Alert thresholds reviewed (70% warning, 90% critical)
  - [ ] Monitoring dashboard accessible at `/admin` (Cost Monitoring tab)

### 10.2 Alert Thresholds

**Default Settings**:

- Bandwidth: Warning at 70%, Critical at 90%
- Function Execution: Warning at 70%, Critical at 90%
- Request Volume: Monitor requests/hour trends

**Alert Channels**:

- Email (if configured)
- Slack (if webhook configured)
- In-app admin notifications

### 10.3 Performance Monitoring

- [ ] **Enable Vercel Analytics**
  - Automatically enabled on Vercel
  - View in Vercel Dashboard → Analytics tab
- [ ] **Enable Vercel Speed Insights**

  - Automatically enabled on Vercel
  - View in Vercel Dashboard → Speed Insights tab

- [ ] **Google Analytics 4**
  ```bash
  NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
  ```
  - [ ] Create GA4 property
  - [ ] Configure data retention (recommend: 14 months)
  - [ ] Set up custom conversions

### 10.4 Error Monitoring

- [ ] **Review error tracking system**
  - [ ] Error boundaries in place
  - [ ] Error logs stored in MongoDB
  - [ ] Admin dashboard accessible
  - [ ] Critical errors trigger alerts (if configured)

### 10.5 Cost Monitoring

- [ ] **API cost tracking**

  - [ ] Cost monitoring dashboard works (`/admin` → Cost Monitoring)
  - [ ] Google API usage tracked in `api_usage` collection
  - [ ] Cache hit rate monitoring active
  - [ ] Monthly cost projections reviewed

- [ ] **Set cost budgets**
  - [ ] Google Places API: Target <$30/month
  - [ ] Vercel: Free tier limits monitored
  - [ ] Twilio: SMS credit alerts configured
  - [ ] Database: Atlas free tier monitored

### 10.6 Production Environment Setup

- [ ] **Environment-specific configuration**

  ```bash
  NODE_ENV=production
  NEXT_PUBLIC_APP_URL=https://www.forkintheroad.app
  ```

- [ ] **Production optimization**
  - [ ] Performance monitoring disabled in prod (already configured)
  - [ ] Server monitoring: 5-minute intervals (already configured)
  - [ ] Development vs production intervals verified

---

## ✅ **PRE-DEPLOYMENT SIGN-OFF**

**Before deploying to Vercel, confirm:**

- [ ] ✅ All Phase 1-10 items completed
- [ ] ✅ All tests passing (unit + E2E)
- [ ] ✅ Production build successful
- [ ] ✅ Bundle optimized (<500KB JavaScript)
- [ ] ✅ All pre-deployment env vars ready
- [ ] ✅ Database configured and tested
- [ ] ✅ Security audit passed
- [ ] ✅ Documentation updated
- [ ] ✅ SEO optimization complete
- [ ] ✅ Monitoring and alerting configured
- [ ] ✅ No blocking issues remain

---

**Estimated Total Time**: 10-14 hours for complete pre-deployment preparation

**Your app is 90% ready!** Focus on environment variable setup, database configuration, admin panel security, and monitoring before deploying.
