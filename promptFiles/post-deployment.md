# Post-Deployment Setup Guide - You Hungry? App

This document outlines the steps required to complete the production setup **after** deploying the You Hungry? app to Vercel.

> **Note**: Make sure you've completed the [Pre-Deployment Checklist](./pre-deployment.md) before following this guide.

## 🚀 Prerequisites

- [ ] App deployed to Vercel
- [ ] Production domain configured and accessible
- [ ] Pre-deployment environment variables already set
- [ ] Live URL available (e.g., `https://your-app.vercel.app`)

## 🔧 Post-Deployment Environment Variables

These variables require the live URL and must be set after deployment:

### URL-Dependent Environment Variables

Set these in your Vercel project dashboard under Settings > Environment Variables:

```bash
# App Configuration (requires live URL)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Clerk Production Keys (requires live URL for webhook)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
```

### Environment Variable Notes

- **Clerk Keys**: Switch from `pk_test_` and `sk_test_` to `pk_live_` and `sk_live_` for production
- **App URL**: Must be set to your actual Vercel domain or custom domain
- **Webhook Secret**: Generated after setting up Clerk webhook with live URL

## 🔗 Clerk Webhook Setup

### Step 1: Access Clerk Dashboard

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Sign in to your Clerk account
3. Select your project

> **Note**: This guide assumes you're using Clerk v5. If you're using an older version, the webhook setup may differ slightly.

### Step 2: Navigate to Webhooks

1. In the left sidebar, click **"Webhooks"**
2. Click **"Add Endpoint"**

### Step 3: Configure Webhook

1. **Endpoint URL**: `https://your-app.vercel.app/api/webhooks/clerk`
2. **Events to Subscribe**:
   - `user.created`
   - `user.updated`
   - `user.deleted`
3. Click **"Create"**

### Step 4: Get Webhook Secret

1. After creating the webhook, copy the **"Signing Secret"**
2. It will start with `whsec_` (e.g., `whsec_1234567890abcdef...`)
3. Add this to your Vercel environment variables as `CLERK_WEBHOOK_SECRET`

### Step 5: Test Webhook

1. Create a test user in your app
2. Check the Vercel function logs to ensure webhook is working
3. Verify user is created in your MongoDB database

## 🗄️ MongoDB Atlas Post-Deployment Verification

### Database Connection Testing

1. **Test production connection**
   - Verify MongoDB connection works from Vercel
   - Check connection logs in Vercel dashboard
   - Test database operations through your deployed app

2. **Database Collections Verification**

   Verify these collections exist and are accessible:
   - `users`
   - `restaurants`
   - `collections`
   - `groups`
   - `decisions`
   - `friendships`

3. **Performance Monitoring**
   - Monitor database connection counts
   - Check for slow queries
   - Set up alerts for connection issues

## 🔍 Google APIs Post-Deployment Configuration

### Update API Key Restrictions

Now that you have a live URL, update your Google API key restrictions:

1. **Google Places API**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to **APIs & Services > Credentials**
   - Select your API key
   - **Update Application restrictions** to include your live domain:
     - Add `https://your-app.vercel.app` to HTTP referrers (if needed)
     - Or keep as "None" for server-side use
   - Ensure **Places API** is enabled

2. **Google Address Validation API**
   - Update restrictions for your live domain
   - Test API calls from your deployed app
   - Monitor API usage and quotas

### ⚠️ Common Google Places API Issues

#### Issue: "API keys with referer restrictions cannot be used with this API"

**Cause**: The API key has HTTP referer restrictions but is being used server-side.

**Solution**:

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Click on your API key
3. Under "Application restrictions", change from "HTTP referrers" to "None"
4. Save the changes
5. Wait 5-10 minutes for changes to propagate

#### Issue: Empty search results

**Possible Causes**:

- API key restrictions blocking requests
- Invalid location format
- API quota exceeded
- Places API not enabled

**Debug Steps**:

1. Check API key restrictions (must be "None" for server-side use)
2. Verify Places API is enabled in Google Cloud Console
3. Test with a simple location like "Times Square New York NY"
4. Check API usage in Google Cloud Console
5. Review server logs for error messages

## 📱 Twilio Post-Deployment Testing

### SMS Integration Testing

1. **Test SMS functionality**
   - Send test SMS from your deployed app
   - Verify SMS delivery to test numbers
   - Check Twilio logs for any delivery issues
   - Test SMS formatting and content

2. **Monitor Twilio usage**
   - Check SMS delivery rates
   - Monitor costs and usage
   - Set up billing alerts
   - Review delivery logs for any issues

## 🔒 Security Post-Deployment Verification

### CORS Testing

1. **Test CORS configuration**
   - Verify API endpoints work from your live domain
   - Test cross-origin requests
   - Check for CORS errors in browser console
   - Ensure preflight requests work correctly

2. **Security headers verification**
   - Check security headers are properly set
   - Verify HTTPS is enforced
   - Test authentication flow security

### Rate Limiting Testing

1. **Test rate limits**
   - Verify rate limiting is working on API endpoints
   - Test with multiple requests
   - Check rate limit responses
   - Monitor for abuse patterns

## 📊 Monitoring & Analytics Activation

### Enable Production Monitoring

1. **Vercel Analytics**
   - Enable Vercel Analytics in your project dashboard
   - Verify analytics tracking is working
   - Set up performance monitoring
   - Configure error tracking

2. **Error Tracking**
   - Activate error tracking service (Sentry, etc.)
   - Verify error reporting is working
   - Set up alert notifications
   - Test error reporting functionality

3. **Database Monitoring**
   - Verify MongoDB Atlas monitoring is active
   - Set up performance alerts
   - Monitor connection counts and query performance
   - Configure alerts for high memory usage or slow queries

## 🔔 ⚠️ CRITICAL: Push Notifications Testing (PRIORITY #1)

**⚠️ MUST BE TESTED IMMEDIATELY AFTER DEPLOYMENT**

Push notifications are fully implemented but **cannot be tested locally** due to iOS security restrictions. This is the **FIRST** thing to verify after deployment.

### Why This Is Critical

**Local Development Issue**:

- ❌ Service Workers require HTTPS or localhost
- ❌ Testing on `http://192.168.x.x` does NOT work on iOS
- ❌ Push API and PushManager unavailable over HTTP on network IPs
- ✅ **Will work in production with HTTPS**

**What We Learned**:

- iOS 16.4+ supports Web Push in Safari (iOS 18.6 confirmed)
- Chrome on iOS uses Safari's WebKit engine (same capabilities)
- Service Worker and PushManager APIs require secure context
- Standalone mode (Home Screen) is required for iOS
- `localhost` is secure, but network IPs (`192.168.x.x`) are not

### Testing Procedure

#### Prerequisites

- [ ] App deployed to Vercel with HTTPS
- [ ] iOS device with iOS 16.4 or later (iOS 17+ recommended)
- [ ] Safari browser on iOS
- [ ] Production URL (e.g., `https://you-hungry.vercel.app`)

#### Step 1: Install PWA on iOS

1. Open **Safari** on your iOS device
2. Navigate to production HTTPS URL
3. Tap **Share** → **"Add to Home Screen"** → **"Add"**
4. **Close Safari completely** (swipe up and close)

#### Step 2: Open from Home Screen

1. Locate "You Hungry?" icon on Home Screen
2. **Tap the icon** (NOT Safari)
3. Verify standalone mode (no browser UI visible)

#### Step 3: Navigate to Push Test Page

1. On home page, scroll to "🛠️ Developer Tools" section
2. Tap **"🔔 Push Notifications Test"** button
3. You'll be on `/push-test` page

#### Step 4: Verify Service Worker APIs

Check the Debug Info section should show:

- [ ] ✅ SW in navigator: Yes
- [ ] ✅ PushManager: Yes
- [ ] ✅ Notification: Yes
- [ ] ✅ Display Mode: Standalone
- [ ] ✅ Supported: Yes
- [ ] Subscribe button should be **BLUE** (not gray)

**If any show "No", there's still an issue!**

#### Step 5: Test Push Subscription

1. Tap **"🔔 Subscribe to Push Notifications (Full)"** button (blue button)
2. iOS should prompt for notification permission
3. Tap **"Allow"**
4. Should see success message
5. Button should change to show unsubscribe option

#### Step 6: Test Notification Delivery

1. Tap **"📬 Send Test Notification"** button
2. A notification should appear on your device
3. Notification should show:
   - Title: "You Hungry? Test"
   - Body: "This is a test notification from your PWA!"
   - App icon

#### Step 7: Test on Additional Platforms

**Android Chrome**:

- [ ] Install PWA
- [ ] Test push subscription
- [ ] Verify notifications appear
- [ ] Test automatic install prompt

**Desktop Chrome/Edge**:

- [ ] Test push subscription
- [ ] Verify notifications
- [ ] Test notification actions (if implemented)

### Expected Results

**iOS Safari (16.4+)**:

```json
{
  "capabilities": {
    "hasServiceWorker": true,    ✅
    "hasPushManager": true,       ✅
    "hasNotification": true       ✅
  },
  "displayMode": {
    "isStandalone": true,         ✅
    "displayMode": "standalone"   ✅
  },
  "status": {
    "supported": true,            ✅
    "permission": "granted"       ✅ (after allowing)
  }
}
```

### Troubleshooting Production

**If Service Worker Still Shows "No" on HTTPS**:

1. Clear Safari cache completely
2. Delete PWA from Home Screen
3. Close Safari
4. Reinstall PWA
5. Open from Home Screen
6. Try again

**If Permission is "Denied"**:

1. Settings → Safari → Advanced → Website Data
2. Find and remove production domain
3. Settings → Notifications → Find app → Allow
4. Reinstall PWA

### What We Implemented

✅ **Push Notification Manager** (`src/lib/push-notifications.ts`):

- Permission handling
- Subscription management
- iOS version detection
- Platform capability checks
- Test notification sending

✅ **React Hook** (`src/hooks/usePushNotifications.ts`):

- Status monitoring
- Subscribe/unsubscribe
- Loading states
- Error handling

✅ **Test Page** (`/push-test`):

- Comprehensive status display
- iOS requirement detection
- Platform-specific warnings
- Basic notification fallback for testing
- Debug information panel

✅ **PWA Explorer** (`/pwa-explorer`):

- Tests 15 PWA capabilities
- Browser detection
- API availability checks

### Key Learnings Documented

**iOS Push Notification Requirements** (from [WebKit blog](https://webkit.org/blog/12945/meet-web-push/) and [iOS 16.4 announcement](https://webkit.org/blog/13878/)):

1. **iOS 16.4+** required (most users on iOS 17+)
2. **Must be added to Home Screen** (standalone mode)
3. **Must open from Home Screen icon** (not browser)
4. **HTTPS required** (or localhost for development)
5. **Safari browser** (Chrome on iOS uses same WebKit engine)

**Platform Differences**:

- **iOS**: Limited features, no action buttons, requires home screen install
- **Android**: Full features, automatic prompts, rich notifications
- **Desktop**: Full features, best for development/testing

**Secure Context Requirements** (from [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)):

- ✅ `https://` - Always secure
- ✅ `localhost` - Considered secure even on HTTP
- ❌ `http://192.168.x.x` - NOT secure on iOS
- ❌ `http://` on network IPs - NOT secure on iOS

**Browser Detection**:

- Chrome on iOS: User agent contains `CriOS`
- Safari on iOS: User agent contains `Safari` but not `CriOS` or `Chrome`
- Both use WebKit engine on iOS (same capabilities)

### Success Criteria

- [ ] ✅ Service Workers register on HTTPS
- [ ] ✅ PushManager API available in standalone mode
- [ ] ✅ Notification permissions work
- [ ] ✅ Test notifications deliver successfully
- [ ] ✅ Works on iOS 17+
- [ ] ✅ Works on Android
- [ ] ✅ Works on Desktop
- [ ] ✅ Graceful degradation for unsupported platforms

### Next Steps After Verification

Once push notifications are confirmed working:

1. **Integrate with backend** - Server-side push sending
2. **Create notification templates** - For group decisions, invites, etc.
3. **Add user preferences** - Notification settings
4. **Implement triggers** - Auto-send for app events
5. **Add analytics** - Track notification engagement

---

## 🧪 Post-Deployment Testing Checklist

### Production Authentication Flow

- [ ] User can sign up with email on live site
- [ ] User can sign in with existing account
- [ ] User profile is created in production database
- [ ] User can sign out successfully
- [ ] Protected routes redirect to sign-in
- [ ] Clerk webhook creates users automatically

### Production Database Operations

- [ ] User data is properly stored in production DB
- [ ] Collections can be created and retrieved
- [ ] Restaurant data is searchable from live site
- [ ] Database connections are stable
- [ ] No connection timeout issues

### Production API Endpoints

- [ ] Restaurant search returns results from live site
- [ ] Collection CRUD operations work
- [ ] Error handling works properly in production
- [ ] Rate limiting is functioning
- [ ] API responses are fast and reliable

### Production External Integrations

- [ ] Google Places API returns restaurant data from live site
- [ ] Twilio can send SMS from production (if implemented)
- [ ] Address validation works from live site (if implemented)
- [ ] All API keys work with production domain

## 🚨 Troubleshooting

### Common Issues

#### Webhook Not Working

- Check webhook URL is correct
- Verify webhook secret matches
- Check Vercel function logs
- Ensure webhook events are properly configured

#### Database Connection Issues

- Verify MongoDB URI is correct
- Check network access settings
- Ensure database user has proper permissions
- Check Vercel environment variables

#### API Key Issues

- Verify API keys are correct
- Check API key restrictions (must be "None" for server-side use)
- Ensure APIs are enabled in Google Cloud Console
- Check rate limits and quotas
- **Google Places API**: Must have "None" application restrictions for server-side use

#### CORS Errors

- Verify CORS headers are set correctly
- Check domain restrictions
- Ensure preflight requests are handled

### Debug Steps

1. Check Vercel function logs
2. Verify environment variables are set
3. Test API endpoints individually
4. Check external service logs (Clerk, MongoDB, Google)
5. Use browser dev tools to debug frontend issues

## 📈 Performance Optimization

### Database Optimization

- [ ] Add proper indexes for common queries
- [ ] Implement connection pooling
- [ ] Monitor slow queries
- [ ] Set up database caching

### API Optimization

- [ ] Implement response caching
- [ ] Add request batching
- [ ] Optimize database queries
- [ ] Use CDN for static assets

### Frontend Optimization

- [ ] Enable Next.js optimizations
- [ ] Implement code splitting
- [ ] Optimize images
- [ ] Set up PWA caching

## 🔄 Maintenance Tasks

### Regular Tasks

- [ ] Monitor error rates and performance
- [ ] Update dependencies monthly
- [ ] Review and rotate API keys quarterly
- [ ] Backup database data
- [ ] Review and update security settings

### Monthly Reviews

- [ ] Check user growth and engagement
- [ ] Review API usage and costs
- [ ] Analyze error patterns
- [ ] Update documentation

## 📞 Support Contacts

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

## ✅ Post-Deployment Completion Checklist

- [ ] Live URL accessible and working
- [ ] Custom domain configured (if applicable)
- [ ] URL-dependent environment variables set
- [ ] Clerk webhook configured and tested
- [ ] Clerk production keys activated
- [ ] Google API restrictions updated for live domain
- [ ] Twilio SMS tested in production (if using SMS)
- [ ] Security settings verified
- [ ] Monitoring activated and working
- [ ] All production tests passing
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] Database monitoring active
- [ ] **Admin gating for performance dashboard** (`/admin/performance`)
  - [ ] Create allowlist of user IDs who can access admin panel
  - [ ] Implement `AdminGate` component to check user permissions
  - [ ] Test with production user ID once available
  - [ ] Ensure standalone dashboard (`/performance-dashboard.html`) remains accessible
- [ ] Team notified of successful deployment

---

## 📝 Notes

- This document focuses on post-deployment tasks that require a live URL
- Pre-deployment tasks are covered in [pre-deployment.md](./pre-deployment.md)
- Test all integrations thoroughly before marking as complete
- Keep this document updated as you add new services or configurations
- Document any custom configurations or workarounds
- Consider setting up staging environment for testing changes
