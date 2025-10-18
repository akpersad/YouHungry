# 📋 Post-Deployment Checklist - You Hungry? App

**Purpose**: This checklist covers all critical tasks that must be completed **after** deploying the app to Vercel.

**Last Updated**: October 18, 2025

**Status**: Reorganized to show pending items first, completed implementation items at bottom

---

## 🔴 **PENDING: Post-Deployment Configuration & Testing**

These items require the live production environment to complete.

---

## 🚀 **Phase 1: Prerequisites** (Immediately After Deployment) ✅ COMPLETE

Confirm these are complete before proceeding:

- [x] App deployed to Vercel successfully
- [x] Production domain configured and accessible
- [x] Pre-deployment environment variables already set
- [x] Live URL available (e.g., `https://www.forkintheroad.app`)

---

## 🔧 **Phase 2: URL-Dependent Environment Variables** ✅ COMPLETE

Set these in your Vercel project dashboard under **Settings > Environment Variables**:

### Required Variables

```bash
# App Configuration (requires live URL)
NEXT_PUBLIC_APP_URL=https://www.forkintheroad.app

# Clerk Production Keys (requires live URL for webhook)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...  # Get after webhook setup below

# Google Analytics 4 (requires production URL)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Checklist

- [x] `NEXT_PUBLIC_APP_URL` set to actual Vercel domain
- [x] Clerk keys switched from `pk_test_`/`sk_test_` to `pk_live_`/`sk_live_`
- [x] `CLERK_WEBHOOK_SECRET` placeholder added (will update after webhook setup)
- [x] `NEXT_PUBLIC_GA_MEASUREMENT_ID` ready (will set after GA4 setup)

---

## 🔗 **Phase 3: Clerk Webhook Setup** (In Progress - 3 of 4 steps complete)

### Step 1: Access Clerk Dashboard ✅

1. [x] Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. [x] Sign in to your Clerk account
3. [x] Select your production project

### Step 2: Configure Webhook ✅

1. [x] Navigate to **Webhooks** in left sidebar
2. [x] Click **"Add Endpoint"**
3. [x] Set endpoint URL: `https://www.forkintheroad.app/api/webhooks/clerk`
4. [x] Subscribe to events:
   - [x] `user.created`
   - [x] `user.updated`
   - [x] `user.deleted`
5. [x] Click **"Create"**

### Step 3: Get Webhook Secret ✅

1. [x] Copy the **"Signing Secret"** (starts with `whsec_`)
2. [x] Add to Vercel environment variables as `CLERK_WEBHOOK_SECRET`
3. [x] Redeploy if needed for env var to take effect

### Step 4: Test Webhook

- [ ] Create a test user in your app
- [ ] Check Vercel function logs for webhook activity
- [ ] Verify user is created in MongoDB `users` collection

---

## 📱 **Phase 4: Phone Verification Testing** (REQUIRED FOR SMS)

### Step 1: Verify Twilio Configuration

**Ensure these environment variables are set:**

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_VERIFY_SERVICE_SID=...
```

**Checklist:**

- [ ] Twilio account is upgraded to paid plan (required for phone verification)
- [ ] Phone number is purchased and verified
- [ ] Twilio Verify Service created and SID configured
- [ ] Account has sufficient credits
- [ ] All environment variables are set in Vercel

### Step 2: Test Phone Verification Flow

**After deployment:**

1. [ ] Sign in to your production app
2. [ ] Go to Profile Settings
3. [ ] Enable SMS Notifications toggle
4. [ ] Enter phone number in SMS Phone Number field
5. [ ] Click **"Verify"** button
6. [ ] Check for SMS with 6-digit verification code
7. [ ] Confirm phone number is automatically verified and saved

### Step 3: Monitor Phone Verification

**Check these logs after testing:**

- [ ] **Vercel Function Logs**: Look for `/api/user/verify-phone` calls
- [ ] **Twilio Console**: Check SMS delivery logs
- [ ] **MongoDB**: Check `phone_verifications` collection for verification attempts
- [ ] **User Profile**: Confirm phone number is saved to user document

### Success Criteria

- [ ] ✅ Phone verification API endpoint working (`/api/user/verify-phone`)
- [ ] ✅ Twilio SMS delivery successful
- [ ] ✅ SMS notifications can be enabled
- [ ] ✅ Phone numbers can be verified via SMS
- [ ] ✅ Verified phone numbers update user profile automatically
- [ ] ✅ Phone verification works without "Save Changes" click
- [ ] ✅ Verification codes expire after 10 minutes

---

## 📲 **Phase 5: Twilio A2P 10DLC Registration** (REQUIRED - 2-4 weeks)

### ⚠️ Critical: A2P 10DLC Registration

**What is A2P 10DLC?**

A2P (Application-to-Person) 10DLC (10-Digit Long Code) is required by US carriers for business SMS messaging.

**Why is this required?**

- ✅ **Higher message throughput** (up to 4,500 msgs/min vs 1 msg/sec unregistered)
- ✅ **Better deliverability** and reduced filtering
- ✅ **Required by US carriers** for business messaging
- ✅ **Avoid blocked messages** on major carriers (AT&T, T-Mobile, Verizon)
- ❌ **Without registration**: Messages may be heavily filtered or blocked

**⚠️ Start this process immediately after deployment! Total time: 2-4 weeks**

### Step 1: Register Your Business Brand (1-2 weeks)

1. [ ] Access Twilio Console → **Messaging** → **Regulatory Compliance** → **A2P 10DLC**
2. [ ] Click **"Register a brand"**
3. [ ] Provide business information:
   - [ ] Legal business name
   - [ ] Business address
   - [ ] Business phone number
   - [ ] Business website URL (use your production URL!)
   - [ ] Tax ID (EIN for US businesses)
   - [ ] Business type (Sole Proprietor, LLC, Corporation, etc.)
   - [ ] Industry/vertical
4. [ ] Submit additional documentation if requested
5. [ ] Wait for brand approval (1-2 weeks)
6. [ ] Check status in Twilio Console (email notification when approved)

### Step 2: Register Your Messaging Campaign (1-2 weeks)

**Once brand is approved:**

1. [ ] Navigate to **A2P 10DLC** → **Campaigns** → **"Create new campaign"**
2. [ ] Choose campaign use case: **"Account Notifications"** or **"Customer Care"**
3. [ ] Provide campaign description:
   - Example: _"Restaurant group decision notifications and SMS verification codes for You Hungry? app users"_
4. [ ] Provide message samples:
   - Example 1: _"Your verification code is 123456"_
   - Example 2: _"Your group has made a decision on where to eat! Check You Hungry? app."_
5. [ ] Describe opt-in process:
   - Example: _"Users opt-in by enabling SMS notifications in their profile settings"_
6. [ ] Describe opt-out process:
   - Example: _"Users can disable SMS notifications in profile settings or reply STOP"_
7. [ ] Describe help process:
   - Example: _"Users can reply HELP for support or visit our help center"_
8. [ ] Estimate monthly message volume
9. [ ] Submit campaign for carrier approval (1-2 weeks)

### Step 3: Link Phone Number to Campaign

**After campaign approval:**

1. [ ] Navigate to **Phone Numbers** → **Manage** → **Active Numbers**
2. [ ] Select your messaging phone number
3. [ ] Find **"A2P 10DLC Campaign"** section
4. [ ] Select your approved campaign from dropdown
5. [ ] Click **"Save"**
6. [ ] Verify phone number shows as registered
7. [ ] Check throughput tier assigned

### Step 4: Update Application Settings

**After registration is complete:**

1. [ ] Verify environment variables are unchanged:

   ```bash
   TWILIO_ACCOUNT_SID=AC...        # Same as before
   TWILIO_AUTH_TOKEN=...           # Same as before
   TWILIO_PHONE_NUMBER=+1...       # Same registered number
   ```

2. [ ] Ensure message content matches registered samples
3. [ ] Include opt-out language if required
4. [ ] Follow campaign guidelines

### Costs

**Registration Fees** (one-time):

- **Brand Registration**: ~$4 (one-time)
- **Campaign Registration**: ~$10-$15 (one-time)
- **Monthly Trust Score Fee**: $1-$3/month per brand

**Message Costs**:

- Same as before (~$0.0079 per SMS segment)
- Higher throughput available after registration

### Success Criteria

- [ ] ✅ Business brand registered and approved
- [ ] ✅ Messaging campaign registered and approved
- [ ] ✅ Phone number linked to approved campaign
- [ ] ✅ Higher throughput enabled (verify in Twilio Console)
- [ ] ✅ Messages delivering without carrier filtering
- [ ] ✅ Monthly trust score fees set up in billing
- [ ] ✅ Message content complies with registered campaign

### Resources

- **Twilio A2P 10DLC Guide**: [https://www.twilio.com/docs/sms/a2p-10dlc](https://www.twilio.com/docs/sms/a2p-10dlc)
- **Campaign Use Cases**: [https://support.twilio.com/hc/en-us/articles/1260803225669](https://support.twilio.com/hc/en-us/articles/1260803225669)
- **Registration API**: [https://www.twilio.com/docs/sms/a2p-10dlc/api](https://www.twilio.com/docs/sms/a2p-10dlc/api)

---

## 🔔 **Phase 6: Push Notifications Testing** (PRIORITY #1)

### ⚠️ MUST BE TESTED IMMEDIATELY AFTER DEPLOYMENT

**Why This Is Critical:**

- ❌ Service Workers require HTTPS or localhost
- ❌ Testing on `http://192.168.x.x` does NOT work on iOS
- ❌ Push API and PushManager unavailable over HTTP on network IPs
- ✅ **Will work in production with HTTPS**

### Prerequisites

- [ ] App deployed to Vercel with HTTPS
- [ ] iOS device with iOS 16.4 or later (iOS 17+ recommended)
- [ ] Safari browser on iOS
- [ ] Production URL (e.g., `https://you-hungry.vercel.app`)

### Step 1: Install PWA on iOS

1. [ ] Open **Safari** on iOS device
2. [ ] Navigate to production HTTPS URL
3. [ ] Tap **Share** → **"Add to Home Screen"** → **"Add"**
4. [ ] **Close Safari completely** (swipe up and close)

### Step 2: Open from Home Screen

1. [ ] Locate "You Hungry?" icon on Home Screen
2. [ ] **Tap the icon** (NOT Safari)
3. [ ] Verify standalone mode (no browser UI visible)

### Step 3: Navigate to Push Test Page

1. [ ] On home page, scroll to **"🛠️ Developer Tools"** section
2. [ ] Tap **"🔔 Push Notifications Test"** button
3. [ ] You'll be on `/push-test` page

### Step 4: Verify Service Worker APIs

**Check the Debug Info section should show:**

- [ ] ✅ SW in navigator: **Yes**
- [ ] ✅ PushManager: **Yes**
- [ ] ✅ Notification: **Yes**
- [ ] ✅ Display Mode: **Standalone**
- [ ] ✅ Supported: **Yes**
- [ ] ✅ Subscribe button should be **BLUE** (not gray)

**⚠️ If any show "No", there's still an issue!**

### Step 5: Test Push Subscription

1. [ ] Tap **"🔔 Subscribe to Push Notifications (Full)"** button (blue button)
2. [ ] iOS should prompt for notification permission
3. [ ] Tap **"Allow"**
4. [ ] Should see success message
5. [ ] Button should change to show unsubscribe option

### Step 6: Test Notification Delivery

1. [ ] Tap **"📬 Send Test Notification"** button
2. [ ] A notification should appear on your device
3. [ ] Notification should show:
   - Title: "You Hungry? Test"
   - Body: "This is a test notification from your PWA!"
   - App icon

### Step 7: Test on Additional Platforms

**Android Chrome:**

- [ ] Install PWA
- [ ] Test push subscription
- [ ] Verify notifications appear
- [ ] Test automatic install prompt

**Desktop Chrome/Edge:**

- [ ] Test push subscription
- [ ] Verify notifications
- [ ] Test notification actions (if implemented)

### Success Criteria

- [ ] ✅ Service Workers register on HTTPS
- [ ] ✅ PushManager API available in standalone mode
- [ ] ✅ Notification permissions work
- [ ] ✅ Test notifications deliver successfully
- [ ] ✅ Works on iOS 17+
- [ ] ✅ Works on Android
- [ ] ✅ Works on Desktop
- [ ] ✅ Graceful degradation for unsupported platforms

### Troubleshooting

**If Service Worker Still Shows "No" on HTTPS:**

1. Clear Safari cache completely
2. Delete PWA from Home Screen
3. Close Safari
4. Reinstall PWA
5. Open from Home Screen
6. Try again

**If Permission is "Denied":**

1. Settings → Safari → Advanced → Website Data
2. Find and remove production domain
3. Settings → Notifications → Find app → Allow
4. Reinstall PWA

---

## 🗄️ **Phase 7: MongoDB Atlas Post-Deployment Verification**

### Database Connection Testing

1. [ ] **Test production connection**
   - [ ] Verify MongoDB connection works from Vercel
   - [ ] Check connection logs in Vercel dashboard
   - [ ] Test database operations through deployed app

2. [ ] **Database Collections Verification**

   Verify these collections exist and are accessible:
   - [ ] `users`
   - [ ] `restaurants`
   - [ ] `collections`
   - [ ] `groups`
   - [ ] `decisions`
   - [ ] `friendships`
   - [ ] `inAppNotifications`
   - [ ] `performanceMetrics`
   - [ ] `phone_verifications`
   - [ ] `alerts` (admin)
   - [ ] `errorLogs` (admin)
   - [ ] `errorGroups` (admin)

3. [ ] **Performance Monitoring**
   - [ ] Monitor database connection counts
   - [ ] Check for slow queries
   - [ ] Set up alerts for connection issues
   - [ ] Configure alerts for high memory usage

---

## 🔍 **Phase 8: Google APIs Post-Deployment Configuration**

### Update API Key Restrictions

1. [ ] **Google Places API**
   - [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
   - [ ] Navigate to **APIs & Services > Credentials**
   - [ ] Select your API key
   - [ ] Update **Application restrictions** to **"None"** (required for server-side use)
   - [ ] Ensure **Places API** is enabled
   - [ ] Test API calls from deployed app

2. [ ] **Google Address Validation API**
   - [ ] Update restrictions for your live domain
   - [ ] Test API calls from deployed app
   - [ ] Monitor API usage and quotas

### Common Issues

**Issue: "API keys with referer restrictions cannot be used with this API"**

- **Fix**: Change application restrictions from "HTTP referrers" to "None" in Google Cloud Console
- **Wait**: 5-10 minutes for changes to propagate

**Issue: Empty search results**

- [ ] Check API key restrictions (must be "None" for server-side use)
- [ ] Verify Places API is enabled in Google Cloud Console
- [ ] Test with simple location like "Times Square New York NY"
- [ ] Check API usage in Google Cloud Console
- [ ] Review server logs for error messages

---

## 📈 **Phase 9: Google Analytics 4 (GA4) Setup**

### Why GA4?

**Key Benefits:**

- ✅ User behavior tracking - Understand how users navigate your app
- ✅ Conversion tracking - Track sign-ups, restaurant searches, group decisions
- ✅ Audience insights - Demographics, interests, devices, locations
- ✅ Real-time monitoring - See live user activity
- ✅ Custom events - Track app-specific actions

### Step 1: Create GA4 Property

1. [ ] Go to [https://analytics.google.com](https://analytics.google.com)
2. [ ] Sign in with Google account
3. [ ] Click **"Admin"** (bottom left)
4. [ ] Under **"Property"**, click **"Create Property"**
5. [ ] **Property Details**:
   - [ ] Property name: "You Hungry?"
   - [ ] Reporting time zone: Choose your timezone
   - [ ] Currency: USD (or your currency)
6. [ ] Click **"Next"**
7. [ ] **Business Information**:
   - [ ] Industry category: "Food & Drink" or "Technology"
   - [ ] Business size: Choose appropriate size
   - [ ] Intended use: "Examine user behavior" + "Measure advertising ROI"
8. [ ] Click **"Create"**
9. [ ] Accept Terms of Service

### Step 2: Set Up Data Stream

1. [ ] Click **"Web"** to create web data stream
2. [ ] **Stream Configuration**:
   - [ ] Website URL: `https://www.forkintheroad.app` (your production URL)
   - [ ] Stream name: "You Hungry? Production"
3. [ ] **Enhanced measurement**: Toggle **ON** (recommended)
   - [ ] Page views ✅
   - [ ] Scrolls ✅
   - [ ] Outbound clicks ✅
   - [ ] Site search ✅
   - [ ] Video engagement ✅
   - [ ] File downloads ✅
4. [ ] Click **"Create stream"**

### Step 3: Copy Measurement ID

1. [ ] After stream creation, copy the **Measurement ID**
2. [ ] Format: `G-XXXXXXXXXX`
3. [ ] Add to Vercel environment variables:
   ```bash
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
4. [ ] Redeploy if needed for env var to take effect

### Step 4: Verify Installation

1. [ ] **Real-Time Testing**
   - [ ] Go to GA4 dashboard → **Reports** → **Realtime**
   - [ ] Visit your production site
   - [ ] You should see your session in real-time
   - [ ] Navigate to different pages to see page views

2. [ ] **DebugView (Recommended)**
   - [ ] In GA4, go to **Admin** → **DebugView**
   - [ ] Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/) Chrome extension
   - [ ] Visit your site with extension enabled
   - [ ] See detailed event tracking in DebugView

3. [ ] **Check Browser Console**
   - [ ] Open browser DevTools
   - [ ] Look for GA4 network requests to `google-analytics.com/g/collect`
   - [ ] Verify `G-XXXXXXXXXX` is in the request

### Step 5: Configure Key Conversions

1. [ ] Navigate to **Admin** → **Events**
2. [ ] Mark these events as conversions:
   - [ ] `sign_up` - New user registration
   - [ ] `login` - User sign-in
   - [ ] `create_group` - Group creation
   - [ ] `make_decision` - Decision made
   - [ ] `add_to_collection` - Restaurant saved
   - [ ] `enable_notification` - Notifications enabled
   - [ ] `install_pwa` - PWA installed

### Step 6: Set Up Custom Reports

1. [ ] Click **"Explore"** → **"Create new exploration"**
2. [ ] Create recommended reports:
   - [ ] **User Journey**: Sign up → Group creation → Decision made
   - [ ] **Restaurant Engagement**: Search → View → Save
   - [ ] **Group Activity**: Group size distribution, decision algorithms
   - [ ] **Notification Adoption**: SMS vs Push notification rates
   - [ ] **PWA Performance**: Install rate, engagement metrics

### Step 7: Configure Data Retention

1. [ ] Navigate to **Admin** → **Data Settings** → **Data Retention**
2. [ ] Choose **14 months** (maximum for free tier)
3. [ ] Enable **"Reset user data on new activity"**

### Success Criteria

- [ ] ✅ GA4 property created and configured
- [ ] ✅ Web data stream set up with production URL
- [ ] ✅ Measurement ID added to environment variables
- [ ] ✅ GA4 installed and tracking in production
- [ ] ✅ Real-time tracking shows live users
- [ ] ✅ Custom events tracking correctly
- [ ] ✅ Key conversions configured
- [ ] ✅ Custom reports created for app metrics
- [ ] ✅ Data retention set to maximum (14 months)
- [ ] ✅ DebugView tested and working

### Resources

- **GA4 Documentation**: [https://support.google.com/analytics/topic/9143232](https://support.google.com/analytics/topic/9143232)
- **GA4 with Next.js**: [https://nextjs.org/docs/app/building-your-application/optimizing/analytics](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)
- **Custom Events**: [https://developers.google.com/analytics/devguides/collection/ga4/events](https://developers.google.com/analytics/devguides/collection/ga4/events)

---

## 🔒 **Phase 10: Security & Admin Configuration**

### Admin Panel Security (CRITICAL)

1. [ ] **Get Production User ID**
   - [ ] Sign in to production app
   - [ ] Check MongoDB `users` collection for your user document
   - [ ] Copy your MongoDB user `_id` (e.g., `507f1f77bcf86cd799439011`)

2. [ ] **Configure Admin Access**
   - [ ] Go to Vercel project → **Settings** → **Environment Variables**
   - [ ] Add `ADMIN_USER_IDS` (comma-separated MongoDB user IDs)
   - [ ] Example: `507f1f77bcf86cd799439011,507f1f77bcf86cd799439012`
   - [ ] Redeploy for changes to take effect

3. [ ] **Test Admin Panel**
   - [ ] Navigate to `/admin` on production site
   - [ ] Verify you can access the admin panel
   - [ ] Check all tabs are accessible:
     - [ ] Performance
     - [ ] Analytics
     - [ ] Errors
     - [ ] Costs
     - [ ] Users
     - [ ] Database
     - [ ] Settings
     - [ ] Alerts
   - [ ] Verify cost monitoring dashboard displays real data
   - [ ] Test that other users cannot access admin panel

### Security Testing

- [ ] **CORS Testing**
  - [ ] Verify API endpoints work from live domain
  - [ ] Test cross-origin requests
  - [ ] Check for CORS errors in browser console
  - [ ] Ensure preflight requests work correctly

- [ ] **Rate Limiting Testing**
  - [ ] Verify rate limiting is working on API endpoints
  - [ ] Test with multiple requests
  - [ ] Check rate limit responses
  - [ ] Monitor for abuse patterns

- [ ] **Security Headers Verification**
  - [ ] Check security headers are properly set
  - [ ] Verify HTTPS is enforced
  - [ ] Test authentication flow security

---

## 📊 **Phase 11: Monitoring & Analytics Activation**

### Enable Production Monitoring

1. [ ] **Vercel Analytics**
   - [ ] Enable Vercel Analytics in project dashboard
   - [ ] Verify analytics tracking is working
   - [ ] Set up performance monitoring
   - [ ] Verify Vercel Speed Insights is tracking Core Web Vitals

2. [ ] **Custom Error Tracking**
   - [ ] Verify custom error tracking dashboard works (`/admin?tab=errors`)
   - [ ] Test error reporting functionality
   - [ ] Set up alert notifications for critical errors
   - [ ] Verify errors are being logged to MongoDB

3. [ ] **Database Monitoring**
   - [ ] Verify MongoDB Atlas monitoring is active
   - [ ] Set up performance alerts
   - [ ] Monitor connection counts and query performance
   - [ ] Configure alerts for high memory usage or slow queries

### Vercel Cron Job Setup

1. [ ] **Generate Secure Secrets**

   ```bash
   # Generate CRON_SECRET
   openssl rand -base64 32

   # Generate INTERNAL_API_SECRET
   openssl rand -base64 32
   ```

2. [ ] **Add Environment Variables**
   - [ ] Add `CRON_SECRET` to Vercel environment variables
   - [ ] Add `INTERNAL_API_SECRET` to Vercel environment variables
   - [ ] Set for all environments (Production, Preview, Development)

3. [ ] **Verify Cron Job**
   - [ ] Go to Vercel project → **Settings** → **Cron Jobs**
   - [ ] Verify cron jobs are scheduled:
     - Path: `/api/cron/performance-metrics`
     - Schedule: `0 6 * * *` (6:00 AM UTC)
     - Status: Active
     - Path: `/api/cron/vercel-monitoring`
     - Schedule: `0 0 * * *` (12:00 AM UTC)
     - Status: Active

4. [ ] **Test Manually** (optional)

   ```bash
   curl -X GET "https://www.forkintheroad.app/api/cron/performance-metrics" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

5. [ ] **Monitor Execution**
   - [ ] Check Vercel logs for cron execution
   - [ ] Verify metrics are saved to MongoDB `performanceMetrics` collection
   - [ ] Confirm daily collection is working

---

## 🧪 **Phase 12: Production Testing**

### Authentication Flow

- [ ] User can sign up with email on live site
- [ ] User can sign in with existing account
- [ ] User profile is created in production database
- [ ] User can sign out successfully
- [ ] Protected routes redirect to sign-in
- [ ] Clerk webhook creates users automatically

### Database Operations

- [ ] User data is properly stored in production DB
- [ ] Collections can be created and retrieved
- [ ] Restaurant data is searchable from live site
- [ ] Database connections are stable
- [ ] No connection timeout issues

### API Endpoints

- [ ] Restaurant search returns results from live site
- [ ] Collection CRUD operations work
- [ ] Error handling works properly in production
- [ ] Rate limiting is functioning
- [ ] API responses are fast and reliable

### External Integrations

- [ ] Google Places API returns restaurant data from live site
- [ ] Twilio can send SMS from production
- [ ] Address validation works from live site
- [ ] All API keys work with production domain

---

## 🚨 **Phase 13: Troubleshooting**

### Common Issues

#### Webhook Not Working

- [ ] Check webhook URL is correct
- [ ] Verify webhook secret matches
- [ ] Check Vercel function logs
- [ ] Ensure webhook events are properly configured

#### Database Connection Issues

- [ ] Verify MongoDB URI is correct
- [ ] Check network access settings (allow Vercel IPs or 0.0.0.0/0)
- [ ] Ensure database user has proper permissions
- [ ] Check Vercel environment variables

#### API Key Issues

- [ ] Verify API keys are correct
- [ ] Check API key restrictions (must be "None" for server-side use)
- [ ] Ensure APIs are enabled in Google Cloud Console
- [ ] Check rate limits and quotas

#### CORS Errors

- [ ] Verify CORS headers are set correctly
- [ ] Check domain restrictions
- [ ] Ensure preflight requests are handled

#### Push Notifications Not Working

- [ ] Clear Safari cache completely
- [ ] Delete PWA from Home Screen and reinstall
- [ ] Verify secure context (HTTPS)
- [ ] Check Service Worker registration in DevTools

### Debug Steps

1. [ ] Check Vercel function logs
2. [ ] Verify environment variables are set
3. [ ] Test API endpoints individually
4. [ ] Check external service logs (Clerk, MongoDB, Google, Twilio)
5. [ ] Use browser dev tools to debug frontend issues

---

## 📝 **Phase 14: Documentation & Communication**

### Update Documentation

- [ ] Document any custom configurations or workarounds
- [ ] Record known issues and their solutions
- [ ] Update post-deployment notes
- [ ] Add troubleshooting tips discovered during deployment

### Team Communication

- [ ] Notify team of successful deployment
- [ ] Share production URL and admin access info
- [ ] Document any deployment issues encountered
- [ ] Schedule post-deployment review meeting

---

## ✅ **Completion Criteria**

### All Systems Operational When:

**Core Infrastructure:**

- [ ] ✅ All URL-dependent environment variables set
- [ ] ✅ Clerk webhook configured and tested
- [ ] ✅ MongoDB Atlas verified and monitored
- [ ] ✅ All API endpoints working correctly

**Messaging & Notifications:**

- [ ] ✅ Phone verification working via Twilio SMS
- [ ] ✅ **A2P 10DLC registration in progress** (allow 2-4 weeks)
- [ ] ✅ Push notifications tested on iOS, Android, Desktop

**Analytics & Monitoring:**

- [ ] ✅ Google Analytics 4 tracking live users
- [ ] ✅ Admin panel security configured
- [ ] ✅ All monitoring and alerts active
- [ ] ✅ Cron jobs collecting daily metrics

**Testing & Verification:**

- [ ] ✅ All production tests passing
- [ ] ✅ All critical user flows verified
- [ ] ✅ Security audit completed
- [ ] ✅ Performance benchmarks met

**Documentation:**

- [ ] ✅ Team notified and documentation updated
- [ ] ✅ Known issues documented
- [ ] ✅ Post-deployment notes recorded

---

## 📌 **Priority Order Summary**

### Immediate (Within 1 Hour):

1. **URL-Dependent Environment Variables** - Set all required env vars
2. **Clerk Webhook Setup** - Configure and test
3. **Admin Panel Security** - Add production user IDs

### Critical (Same Day):

4. **Push Notifications Testing** - Can only test in production on HTTPS
5. **Phone Verification Testing** - Verify Twilio SMS works
6. **Google APIs Configuration** - Update restrictions and test

### Important (Within 1 Week):

7. **A2P 10DLC Registration** - Start immediately (takes 2-4 weeks)
8. **Google Analytics 4 Setup** - Configure tracking and conversions
9. **Monitoring & Alerts** - Set up all monitoring systems

### Ongoing:

10. **Production Testing** - Continuous verification of all features
11. **Performance Monitoring** - Track metrics and optimize
12. **Documentation** - Keep all docs updated

---

## 📞 **Support Resources**

### Service Providers

- **Vercel**: [support.vercel.com](https://support.vercel.com)
- **Clerk**: [clerk.com/support](https://clerk.com/support)
- **MongoDB**: [support.mongodb.com](https://support.mongodb.com)
- **Google Cloud**: [cloud.google.com/support](https://cloud.google.com/support)
- **Twilio**: [support.twilio.com](https://support.twilio.com)

### Documentation

- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Clerk**: [clerk.com/docs](https://clerk.com/docs)
- **MongoDB**: [docs.mongodb.com](https://docs.mongodb.com)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Twilio**: [twilio.com/docs](https://twilio.com/docs)
- **Google Analytics**: [support.google.com/analytics](https://support.google.com/analytics)

---

## 📈 **Success Metrics**

After completing this checklist, you should see:

- ✅ Lighthouse scores > 90 across all metrics
- ✅ All E2E tests passing in production
- ✅ Zero console errors in production
- ✅ Database queries < 200ms
- ✅ API response times < 500ms
- ✅ Push notifications work on iOS/Android/Desktop
- ✅ All notification channels functional
- ✅ GA4 tracking user behavior
- ✅ Admin panel accessible and functional
- ✅ Cron jobs running daily
- ✅ All monitoring alerts active

---

# ✅ **COMPLETED: Pre-Implemented Features**

The following infrastructure has already been built and is ready for production use. These items are **code-complete** and just need configuration/testing in production (covered in phases above).

---

## 🎉 **Already Implemented - No Code Changes Needed**

### ✅ Clerk Webhook Infrastructure

**Status**: Fully implemented, needs production configuration only

**What's Done:**

- ✅ Webhook endpoint at `/api/webhooks/clerk/route.ts`
- ✅ Handles `user.created`, `user.updated`, `user.deleted` events
- ✅ Creates/updates users in MongoDB automatically
- ✅ Supports development mode without webhook secret
- ✅ Full error handling and logging

**Configuration Needed:** Just set up webhook in Clerk dashboard (Phase 3)

---

### ✅ Phone Verification System

**Status**: Fully implemented with Twilio Verify API

**What's Done:**

- ✅ Send verification endpoint: `/api/user/verify-phone` (POST)
- ✅ Verify code endpoint: `/api/user/verify-phone` (PUT)
- ✅ Phone number formatting and validation
- ✅ MongoDB integration for storing verified phone numbers
- ✅ Twilio Verify Service integration
- ✅ 10-minute code expiration
- ✅ Automatic phone number update on verification
- ✅ UI in profile settings page

**Configuration Needed:** Test in production with real Twilio account (Phase 4)

---

### ✅ Push Notifications Infrastructure

**Status**: Complete PWA push notification system

**What's Done:**

- ✅ Service Worker with push notification handling (`/public/sw.js`)
- ✅ VAPID keys support for web push
- ✅ Subscribe endpoint: `/api/push/subscribe`
- ✅ Unsubscribe endpoint: `/api/push/unsubscribe`
- ✅ Send test notification endpoint: `/api/push/test`
- ✅ Push notification service (`src/lib/push-service.ts`)
- ✅ React hook (`src/hooks/usePushNotifications.ts`)
- ✅ Test page at `/push-test`
- ✅ iOS 16.4+ support with standalone mode detection
- ✅ Android and Desktop support
- ✅ Notification permission handling
- ✅ Graceful degradation for unsupported browsers

**Configuration Needed:** Generate VAPID keys and test on HTTPS (Phase 6)

---

### ✅ Google Analytics 4 Integration

**Status**: Fully integrated, needs GA4 property setup

**What's Done:**

- ✅ GoogleAnalytics component (`src/components/analytics/GoogleAnalytics.tsx`)
- ✅ Analytics library with 50+ tracking functions (`src/lib/analytics.ts`)
- ✅ Type-safe event tracking
- ✅ Privacy-preserving hashed user IDs (SHA-256)
- ✅ Page view tracking
- ✅ Custom event tracking for all features
- ✅ Enhanced measurement configured
- ✅ Production-only tracking (no dev pollution)
- ✅ Integrated in root layout

**Configuration Needed:** Create GA4 property and add measurement ID (Phase 9)

---

### ✅ Vercel Analytics Integration

**Status**: Installed and ready to use

**What's Done:**

- ✅ `@vercel/analytics` package installed
- ✅ `@vercel/speed-insights` package installed
- ✅ Analytics component added to layout
- ✅ Speed Insights component added to layout
- ✅ Auto-enabled in production on Vercel
- ✅ No configuration needed

**Configuration Needed:** None - works automatically on Vercel!

---

### ✅ Admin Panel & Access Control

**Status**: Fully functional admin panel with security

**What's Done:**

- ✅ Admin gate component with access control
- ✅ MongoDB user ID-based authentication
- ✅ Admin panel at `/admin`
- ✅ 8 admin tabs:
  - Performance monitoring
  - Usage analytics
  - Error tracking dashboard
  - Cost monitoring
  - User management
  - Database management
  - System settings
  - Alert management
- ✅ `useIsAdmin` hook for conditional UI
- ✅ `requireAdminAuth()` for API protection
- ✅ Environment variable configuration (`ADMIN_USER_IDS`)

**Configuration Needed:** Add your MongoDB user ID to env vars (Phase 10)

---

### ✅ Error Tracking System

**Status**: Production-ready custom error tracking

**What's Done:**

- ✅ React Error Boundaries at multiple levels
- ✅ Error logging to MongoDB (`errorLogs` collection)
- ✅ Error grouping by fingerprint (`errorGroups` collection)
- ✅ User context capture (browser, device, breadcrumbs)
- ✅ Severity classification (critical, error, warning, info)
- ✅ Category classification (client, server, network, api)
- ✅ Admin dashboard for error management
- ✅ User reporting functionality
- ✅ Critical error alerts via email/SMS
- ✅ Automatic error fingerprinting
- ✅ Error deduplication

**Configuration Needed:** None - works automatically!

**Note:** You do NOT need Sentry - this is a complete custom solution.

---

### ✅ SMS Notifications Service

**Status**: Complete SMS system with Twilio

**What's Done:**

- ✅ SMS service class (`src/lib/sms-notifications.ts`)
- ✅ Group decision notifications
- ✅ Friend request notifications
- ✅ Decision result notifications
- ✅ URL shortening integration
- ✅ Phone number validation
- ✅ Delivery status tracking
- ✅ Template-based messages

**Configuration Needed:** Test in production, then register for A2P 10DLC (Phase 5)

---

### ✅ Email Notifications

**Status**: Email service with Resend API

**What's Done:**

- ✅ Email service implementation
- ✅ Admin alert emails
- ✅ Critical error notifications
- ✅ Template support
- ✅ HTML email formatting

**Configuration Needed:** Configure Resend API key in env vars

---

### ✅ MongoDB Schema & Collections

**Status**: Complete database schema

**What's Done:**

- ✅ Users collection with full schema
- ✅ Restaurants collection
- ✅ Collections (saved restaurants)
- ✅ Groups collection
- ✅ Decisions collection
- ✅ Friendships collection
- ✅ In-app notifications collection
- ✅ Performance metrics collection
- ✅ Phone verifications collection
- ✅ Error logs collection
- ✅ Error groups collection
- ✅ Alerts collection
- ✅ All with proper indexes

**Configuration Needed:** Verify collections exist in production (Phase 7)

---

### ✅ Vercel Cron Jobs

**Status**: Configured in vercel.json

**What's Done:**

- ✅ Performance metrics cron: `/api/cron/performance-metrics` (daily at 6 AM UTC)
- ✅ Vercel monitoring cron: `/api/cron/vercel-monitoring` (daily at midnight UTC)
- ✅ CRON_SECRET authentication
- ✅ Internal API secret for service-to-service auth

**Configuration Needed:** Generate secrets and verify in Vercel dashboard (Phase 11)

---

### ✅ Service Worker & PWA

**Status**: Full PWA with offline support

**What's Done:**

- ✅ Service worker at `/public/sw.js`
- ✅ Caching strategies (static, dynamic, API)
- ✅ Offline fallback pages
- ✅ Push notification handling
- ✅ Background sync support
- ✅ Install prompt handling
- ✅ Manifest file configured
- ✅ PWA icons generated

**Configuration Needed:** Test PWA installation on all platforms (Phase 6)

---

### ✅ Environment Variables Documentation

**Status**: Complete env.example file

**What's Done:**

- ✅ All required env vars documented
- ✅ Clear comments explaining each variable
- ✅ Examples and formats provided
- ✅ Grouped by service
- ✅ VAPID key generation instructions

**Configuration Needed:** Set actual values in Vercel (Phase 2)

---

### ✅ Testing Infrastructure

**Status**: Comprehensive testing setup

**What's Done:**

- ✅ Push test page at `/push-test`
- ✅ PWA explorer page at `/pwa-explorer`
- ✅ Notification test page at `/notification-test`
- ✅ Debug tools accessible from home/dashboard
- ✅ Detailed status displays
- ✅ Error handling and logging

**Configuration Needed:** Use for testing in production (Phase 6)

---

## 🎯 **Summary**

**Total Implementation Progress:**

- ✅ **Code Implementation**: 100% complete
- 🔄 **Production Configuration**: Pending (requires live deployment)
- 🔄 **Production Testing**: Pending (requires HTTPS environment)

**What This Means:**

- All features are built and ready to use
- No new code needs to be written
- Just need to configure environment variables
- Just need to test features in production
- Some external processes (A2P 10DLC) take time but don't block launch

---

**Remember**: This checklist is comprehensive but flexible. Some steps may not apply to your specific deployment or may need to be adjusted based on your configuration. Document any deviations and their reasons for future reference.

**Estimated Total Time**: 4-6 hours for initial setup (excluding A2P 10DLC which takes 2-4 weeks)
