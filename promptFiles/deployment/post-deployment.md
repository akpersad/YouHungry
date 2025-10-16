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

# Google Analytics 4 (requires production URL)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Environment Variable Notes

- **Clerk Keys**: Switch from `pk_test_` and `sk_test_` to `pk_live_` and `sk_live_` for production
- **App URL**: Must be set to your actual Vercel domain or custom domain
- **Webhook Secret**: Generated after setting up Clerk webhook with live URL
- **GA4 Measurement ID**: Create GA4 property with production URL to get measurement ID

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

## 📱 Phone Verification Testing (REQUIRED FOR SMS)

### ⚠️ Critical: Phone Verification Testing

Phone verification is now implemented using **Twilio SMS** instead of Clerk. This provides more control and doesn't require Clerk Pro.

### Step 1: Verify Twilio Configuration

**Ensure these environment variables are set:**

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

### Step 2: Test Phone Verification Flow

**After deployment:**

1. **Enable SMS Notifications** in profile settings
2. **Enter phone number** in SMS Phone Number field (client-side validation happens automatically)
3. **Click "Verify"** button to send SMS verification code
4. **Check for SMS** with 6-digit verification code
5. **Phone number** is automatically verified and updated in profile

### Step 3: Monitor Phone Verification

**Check these logs after testing:**

1. **Vercel Function Logs**: Look for phone verification API calls
2. **Twilio Console**: Check SMS delivery logs
3. **Database**: Confirm phone number is saved to user profile
4. **MongoDB**: Check `phone_verifications` collection for verification attempts

### Troubleshooting Phone Verification

**Common Issues:**

1. **"Phone verification failed"**
   - Check Twilio credentials are correct
   - Verify phone number format (+1XXXXXXXXXX)
   - Ensure Twilio account has sufficient credits

2. **"SMS not received"**
   - Check Twilio phone number is valid
   - Verify destination phone number format
   - Check Twilio console for delivery errors
   - Ensure Twilio account is not in trial mode (upgrade required)

3. **"Invalid phone number format"**
   - Phone numbers must be in E.164 format (+1XXXXXXXXXX)
   - 10-digit US numbers are automatically formatted
   - International numbers must include country code

### Success Criteria

- [ ] ✅ Phone verification API endpoint working (`/api/user/verify-phone`)
- [ ] ✅ Twilio SMS delivery successful
- [ ] ✅ SMS notifications can be enabled
- [ ] ✅ Phone numbers can be verified via SMS
- [ ] ✅ Verified phone numbers update user profile automatically
- [ ] ✅ Phone verification works without "Save Changes" click
- [ ] ✅ Verification codes expire after 10 minutes

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

## 📲 Twilio US A2P 10DLC Registration (REQUIRED FOR PRODUCTION SMS)

### ⚠️ Critical: A2P 10DLC Registration

**What is A2P 10DLC?**

A2P (Application-to-Person) 10DLC (10-Digit Long Code) is a system in the United States that allows businesses to send SMS messages using standard 10-digit phone numbers with higher throughput and better deliverability.

**Why is this required?**

- ✅ **Higher message throughput** (up to 4,500 msgs/min vs 1 msg/sec unregistered)
- ✅ **Better deliverability** and reduced filtering
- ✅ **Required by US carriers** for business messaging
- ✅ **Avoid blocked messages** on major carriers (AT&T, T-Mobile, Verizon)
- ❌ **Without registration**: Messages may be heavily filtered or blocked

### Registration Timeline

**Total Time: 2-4 weeks**

- Brand Registration: 1-2 weeks
- Campaign Registration: 1-2 weeks
- Approval Process: May require additional documentation

**⚠️ Start this process immediately after deployment!**

### Step 1: Register Your Business Brand

1. **Access Twilio Console**
   - Go to [https://console.twilio.com](https://console.twilio.com)
   - Navigate to **Messaging** → **Regulatory Compliance** → **A2P 10DLC**

2. **Create a Brand**
   - Click **"Register a brand"**
   - **Business Information Required**:
     - Legal business name
     - Business address
     - Business phone number
     - Business website URL (use your production URL!)
     - Tax ID (EIN for US businesses)
     - Business type (Sole Proprietor, LLC, Corporation, etc.)
     - Industry/vertical
3. **Business Verification**
   - Twilio may require additional documentation:
     - Business registration documents
     - Tax documentation
     - Website verification
   - Approval typically takes 1-2 weeks

4. **Approval Status**
   - Check status in Twilio Console
   - You'll receive email notification when approved

### Step 2: Register Your Messaging Campaign

Once your brand is approved:

1. **Create Campaign**
   - Navigate to **A2P 10DLC** → **Campaigns**
   - Click **"Create new campaign"**

2. **Campaign Details**
   - **Campaign Use Case**: Choose appropriate category
     - For You Hungry?: "Account Notifications" or "Customer Care"
   - **Campaign Description**: Describe your SMS use case
     - Example: "Restaurant group decision notifications and SMS verification codes for You Hungry? app users"
   - **Message Sample**: Provide examples of messages you'll send
     - Example 1: "Your verification code is 123456"
     - Example 2: "Your group has made a decision on where to eat! Check You Hungry? app."
   - **Opt-in Process**: Describe how users consent
     - Example: "Users opt-in by enabling SMS notifications in their profile settings"
   - **Opt-out Process**: Describe how users can opt-out
     - Example: "Users can disable SMS notifications in profile settings or reply STOP"
   - **Help Process**: Describe help options
     - Example: "Users can reply HELP for support or visit our help center"

3. **Message Volume**
   - Estimate monthly message volume
   - Be realistic - this affects your throughput tier

4. **Submit for Review**
   - Review all information
   - Submit campaign for carrier approval
   - Approval typically takes 1-2 weeks

### Step 3: Link Phone Number to Campaign

After campaign approval:

1. **Navigate to Phone Numbers**
   - Go to **Phone Numbers** → **Manage** → **Active Numbers**
   - Select your messaging phone number

2. **Link to Campaign**
   - Find **"A2P 10DLC Campaign"** section
   - Select your approved campaign from dropdown
   - Click **"Save"**

3. **Verification**
   - Ensure phone number shows as registered
   - Check throughput tier assigned

### Step 4: Update Application Settings

After registration is complete, no code changes are typically needed, but verify:

1. **Environment Variables**

   ```bash
   TWILIO_ACCOUNT_SID=AC...        # Same as before
   TWILIO_AUTH_TOKEN=...           # Same as before
   TWILIO_PHONE_NUMBER=+1...       # Same registered number
   ```

2. **Message Content Compliance**
   - Ensure messages match registered samples
   - Include opt-out language if required
   - Follow campaign guidelines

### Costs

**Registration Fees** (one-time):

- **Brand Registration**: ~$4 (one-time)
- **Campaign Registration**: ~$10-$15 (one-time)
- **Monthly Trust Score Fee**: $1-$3/month per brand

**Message Costs**:

- Same as before (~$0.0079 per SMS segment)
- Higher throughput available after registration

### Monitoring A2P 10DLC Status

1. **Check Registration Status**
   - Twilio Console → Messaging → A2P 10DLC
   - View brand and campaign status
   - Monitor approval progress

2. **Track Message Throughput**
   - Monitor actual vs. allowed throughput
   - Check for carrier filtering
   - Review delivery reports

3. **Campaign Compliance**
   - Ensure messages match registered use case
   - Monitor opt-out requests
   - Track compliance metrics

### Troubleshooting A2P 10DLC

**Brand Registration Rejected**:

- Verify business information is accurate
- Provide additional documentation if requested
- Ensure website URL is live and matches business
- Contact Twilio support for guidance

**Campaign Registration Rejected**:

- Review campaign description and use case
- Ensure message samples are clear and compliant
- Verify opt-in/opt-out processes are described
- Revise and resubmit

**Low Throughput After Registration**:

- Check campaign tier assigned
- Verify phone number is linked to campaign
- Review trust score (may need to build over time)
- Contact Twilio if throughput is unexpectedly low

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

## 📈 Google Analytics 4 (GA4) Setup

### Why GA4?

Google Analytics 4 provides comprehensive analytics for understanding user behavior, tracking conversions, and measuring app performance.

**Key Benefits**:

- ✅ **User behavior tracking** - Understand how users navigate your app
- ✅ **Conversion tracking** - Track sign-ups, restaurant searches, group decisions
- ✅ **Audience insights** - Demographics, interests, devices, locations
- ✅ **Real-time monitoring** - See live user activity
- ✅ **Custom events** - Track app-specific actions

### Step 1: Create GA4 Property

1. **Access Google Analytics**
   - Go to [https://analytics.google.com](https://analytics.google.com)
   - Sign in with your Google account

2. **Create Property**
   - Click **"Admin"** (bottom left)
   - Under **"Property"**, click **"Create Property"**
   - **Property Details**:
     - Property name: "You Hungry?"
     - Reporting time zone: Choose your timezone
     - Currency: USD (or your currency)
   - Click **"Next"**

3. **Business Information**
   - Industry category: "Food & Drink" or "Technology"
   - Business size: Choose appropriate size
   - Intended use: "Examine user behavior" + "Measure advertising ROI"
   - Click **"Create"**

4. **Accept Terms of Service**
   - Review and accept GA4 terms
   - Choose data sharing settings

### Step 2: Set Up Data Stream

1. **Create Web Data Stream**
   - After property creation, you'll be prompted to set up a data stream
   - Click **"Web"**

2. **Stream Configuration**
   - **Website URL**: `https://your-app.vercel.app` (your production URL)
   - **Stream name**: "You Hungry? Production"
   - **Enhanced measurement**: Toggle ON (recommended)
     - Page views ✅
     - Scrolls ✅
     - Outbound clicks ✅
     - Site search ✅
     - Video engagement ✅
     - File downloads ✅
   - Click **"Create stream"**

3. **Copy Measurement ID**
   - After stream creation, copy the **Measurement ID**
   - Format: `G-XXXXXXXXXX`
   - You'll need this for your app configuration

### Step 3: Install GA4 in Your App

#### Option A: Using next-google-gtag (Recommended for Next.js)

1. **Install Package**

   ```bash
   npm install next-google-gtag
   ```

2. **Add Environment Variable**

   In Vercel dashboard, add:

   ```bash
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

3. **Update Layout** (`src/app/layout.tsx`)

   ```tsx
   import { GoogleAnalytics } from 'next-google-gtag';

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
             <GoogleAnalytics
               gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
               dataLayerName="dataLayer"
             />
           )}
           {children}
         </body>
       </html>
     );
   }
   ```

#### Option B: Using Google Tag (gtag.js) Directly

1. **Add Environment Variable**

   ```bash
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

2. **Create GA4 Component** (`src/components/analytics/GoogleAnalytics.tsx`)

   ```tsx
   'use client';

   import Script from 'next/script';

   export default function GoogleAnalytics() {
     const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

     if (!GA_MEASUREMENT_ID) return null;

     return (
       <>
         <Script
           strategy="afterInteractive"
           src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
         />
         <Script
           id="google-analytics"
           strategy="afterInteractive"
           dangerouslySetInnerHTML={{
             __html: `
               window.dataLayer = window.dataLayer || [];
               function gtag(){dataLayer.push(arguments);}
               gtag('js', new Date());
               gtag('config', '${GA_MEASUREMENT_ID}', {
                 page_path: window.location.pathname,
               });
             `,
           }}
         />
       </>
     );
   }
   ```

3. **Add to Layout** (`src/app/layout.tsx`)

   ```tsx
   import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <GoogleAnalytics />
           {children}
         </body>
       </html>
     );
   }
   ```

### Step 4: Configure Custom Events

Create a helper to track custom events throughout your app:

**Create Analytics Helper** (`src/lib/analytics.ts`):

```typescript
type GAEventParams = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

export const trackEvent = ({
  action,
  category,
  label,
  value,
}: GAEventParams) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Predefined event tracking functions
export const analytics = {
  // User events
  trackSignUp: (method: string) => {
    trackEvent({
      action: 'sign_up',
      category: 'User',
      label: method,
    });
  },

  trackSignIn: (method: string) => {
    trackEvent({
      action: 'login',
      category: 'User',
      label: method,
    });
  },

  // Restaurant events
  trackRestaurantSearch: (query: string) => {
    trackEvent({
      action: 'search',
      category: 'Restaurant',
      label: query,
    });
  },

  trackRestaurantView: (restaurantId: string) => {
    trackEvent({
      action: 'view_item',
      category: 'Restaurant',
      label: restaurantId,
    });
  },

  trackRestaurantSave: (restaurantId: string) => {
    trackEvent({
      action: 'add_to_collection',
      category: 'Restaurant',
      label: restaurantId,
    });
  },

  // Group events
  trackGroupCreate: () => {
    trackEvent({
      action: 'create_group',
      category: 'Group',
      label: 'New Group',
    });
  },

  trackGroupJoin: (groupId: string) => {
    trackEvent({
      action: 'join_group',
      category: 'Group',
      label: groupId,
    });
  },

  trackDecisionMade: (algorithm: string, restaurantCount: number) => {
    trackEvent({
      action: 'make_decision',
      category: 'Group',
      label: algorithm,
      value: restaurantCount,
    });
  },

  // Notification events
  trackNotificationEnabled: (type: string) => {
    trackEvent({
      action: 'enable_notification',
      category: 'Notification',
      label: type,
    });
  },

  // PWA events
  trackPWAInstall: () => {
    trackEvent({
      action: 'install_pwa',
      category: 'PWA',
      label: 'Home Screen Install',
    });
  },
};
```

**Usage Example**:

```tsx
import { analytics } from '@/lib/analytics';

// Track restaurant search
const handleSearch = async (query: string) => {
  analytics.trackRestaurantSearch(query);
  // ... search logic
};

// Track group decision
const handleDecision = async (algorithm: string, restaurants: Restaurant[]) => {
  analytics.trackDecisionMade(algorithm, restaurants.length);
  // ... decision logic
};
```

### Step 5: Verify Installation

1. **Real-Time Testing**
   - Go to GA4 dashboard
   - Click **"Reports"** → **"Realtime"**
   - Visit your production site
   - You should see your session in real-time
   - Navigate to different pages to see page views

2. **DebugView (Recommended)**
   - In GA4, go to **"Admin"** → **"DebugView"**
   - Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/) Chrome extension
   - Visit your site with extension enabled
   - See detailed event tracking in DebugView

3. **Check Browser Console**
   - Open browser DevTools
   - Look for GA4 network requests to `google-analytics.com/g/collect`
   - Verify `G-XXXXXXXXXX` is in the request

### Step 6: Configure Key Conversions

Set up conversions for important user actions:

1. **Navigate to Conversions**
   - GA4 Dashboard → **"Admin"** → **"Events"**
   - Click **"Create event"** or mark existing events as conversions

2. **Recommended Conversions**
   - `sign_up` - New user registration
   - `login` - User sign-in
   - `create_group` - Group creation
   - `make_decision` - Decision made
   - `add_to_collection` - Restaurant saved
   - `enable_notification` - Notifications enabled
   - `install_pwa` - PWA installed

3. **Mark as Conversion**
   - Find event in list
   - Toggle **"Mark as conversion"** ON
   - Conversions will appear in reports within 24 hours

### Step 7: Set Up Custom Reports

Create custom reports for app-specific metrics:

1. **Exploration Reports**
   - Click **"Explore"** → **"Create new exploration"**
   - Choose template or start blank

2. **Recommended Reports**
   - **User Journey**: Sign up → Group creation → Decision made
   - **Restaurant Engagement**: Search → View → Save
   - **Group Activity**: Group size distribution, decision algorithms
   - **Notification Adoption**: SMS vs Push notification rates
   - **PWA Performance**: Install rate, engagement metrics

### Step 8: Configure Data Retention

1. **Navigate to Data Settings**
   - **"Admin"** → **"Data Settings"** → **"Data Retention"**

2. **Set Retention Period**
   - Choose **14 months** (maximum for free tier)
   - Enable **"Reset user data on new activity"**

### Environment Variables Summary

Add to Vercel production environment:

```bash
# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Privacy Considerations

1. **Cookie Consent**
   - Consider implementing cookie consent banner
   - Respect user privacy preferences
   - Follow GDPR/CCPA requirements if applicable

2. **IP Anonymization**
   - GA4 anonymizes IPs by default
   - No additional configuration needed

3. **Data Collection**
   - Review what data is collected
   - Update privacy policy to mention GA4
   - Provide opt-out mechanism if required

### Monitoring GA4 Performance

1. **Daily Checks**
   - Review real-time users
   - Check for tracking errors
   - Monitor key conversions

2. **Weekly Reviews**
   - Analyze user behavior patterns
   - Review popular pages and features
   - Check conversion funnel performance

3. **Monthly Analysis**
   - Deep dive into user demographics
   - Analyze user retention
   - Review custom event trends
   - Optimize based on insights

### Troubleshooting GA4

**No Data Appearing**:

- Verify Measurement ID is correct
- Check GA4 is included in production build
- Ensure environment variable is set in Vercel
- Wait 24-48 hours for initial data processing
- Check browser console for errors

**Events Not Tracking**:

- Verify gtag function exists: `console.log(window.gtag)`
- Check DebugView for event details
- Ensure custom events are triggered correctly
- Verify network requests in DevTools

**Real-Time Not Working**:

- Clear browser cache
- Try incognito/private browsing
- Wait a few minutes (can be slight delay)
- Check ad blockers aren't blocking GA4

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
- **Measurement Protocol**: [https://developers.google.com/analytics/devguides/collection/protocol/ga4](https://developers.google.com/analytics/devguides/collection/protocol/ga4)

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

### Core Deployment

- [ ] Live URL accessible and working
- [ ] Custom domain configured (if applicable)
- [ ] URL-dependent environment variables set

### Authentication & Webhooks

- [ ] Clerk webhook configured and tested
- [ ] Clerk production keys activated
- [ ] Webhook creates users in production database

### External APIs & Services

- [ ] Google Places API restrictions updated for live domain
- [ ] Google Address Validation API tested
- [ ] Twilio SMS tested in production
- [ ] **Twilio A2P 10DLC Registration** (REQUIRED - allow 2-4 weeks)
  - [ ] Business brand registered with Twilio
  - [ ] Brand registration approved (1-2 weeks)
  - [ ] Messaging campaign registered
  - [ ] Campaign registration approved (1-2 weeks)
  - [ ] Phone number linked to approved campaign
  - [ ] Higher message throughput verified
  - [ ] Message content complies with registered campaign

### Analytics & Monitoring

- [ ] **Google Analytics 4 (GA4) Setup**
  - [ ] GA4 property created
  - [ ] Web data stream configured with production URL
  - [ ] Measurement ID (`G-XXXXXXXXXX`) added to environment variables
  - [ ] GA4 tracking code installed in app
  - [ ] Real-time tracking verified
  - [ ] Custom events configured and tracking
  - [ ] Key conversions set up (sign_up, create_group, make_decision, etc.)
  - [ ] Custom reports created
  - [ ] Data retention set to 14 months
- [ ] Vercel Analytics enabled and working
- [ ] Error tracking configured (Sentry/etc.)
- [ ] Database monitoring active (MongoDB Atlas)
- [ ] Performance monitoring active

### Security & Compliance

- [ ] Security settings verified
- [ ] Rate limiting tested
- [ ] CORS configuration tested
- [ ] HTTPS enforced
- [ ] **Admin Panel Security Configuration** (`/admin`)
  - [ ] **CRITICAL**: Add your production user ID to `ADMIN_USER_IDS` environment variable in Vercel (comma-separated list of MongoDB user IDs)
  - [ ] Test admin panel access with your production user account
  - [ ] Verify all admin tabs are accessible and functional
  - [ ] Ensure cost monitoring dashboard displays real data
  - [ ] Test admin panel security - verify other users cannot access
  - [ ] Ensure standalone dashboard (`/performance-dashboard.html`) remains accessible

### Testing & Verification

- [ ] All production tests passing
- [ ] Authentication flow tested end-to-end
- [ ] Database operations verified
- [ ] Restaurant search working
- [ ] Group collaboration tested
- [ ] SMS notifications working
- [ ] Phone verification working
- [ ] **Push Notifications tested** (iOS, Android, Desktop)
  - [ ] PWA installed on test devices
  - [ ] Push subscription working
  - [ ] Test notifications delivered successfully

### Communication

- [ ] Team notified of successful deployment
- [ ] Known issues documented
- [ ] Post-deployment notes recorded

---

## 📝 Notes

- This document focuses on post-deployment tasks that require a live URL
- Pre-deployment tasks are covered in [pre-deployment.md](./pre-deployment.md)
- Test all integrations thoroughly before marking as complete
- Keep this document updated as you add new services or configurations
- Document any custom configurations or workarounds
- Consider setting up staging environment for testing changes
