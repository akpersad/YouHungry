# Post-Deployment Setup Guide - You Hungry? App

This document outlines all the steps required to complete the production setup after deploying the You Hungry? app to Vercel.

## 🚀 Prerequisites

- [ ] App deployed to Vercel
- [ ] Production domain configured
- [ ] All environment variables set in Vercel dashboard

## 🔧 Environment Variables Setup

### Required Environment Variables in Vercel

Set these in your Vercel project dashboard under Settings > Environment Variables:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/you-hungry?retryWrites=true&w=majority
MONGODB_DATABASE=you-hungry

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Google APIs
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIza...
GOOGLE_ADDRESS_VALIDATION_API_KEY=AIza...

# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Environment Variable Notes

- **Clerk Keys**: Switch from `pk_test_` and `sk_test_` to `pk_live_` and `sk_live_` for production
- **MongoDB**: Ensure your cluster allows connections from Vercel's IP ranges
- **Google APIs**: Update API key restrictions to allow your production domain
- **Twilio**: Use production credentials (not test credentials)

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

## 🗄️ MongoDB Atlas Configuration

### Step 1: Network Access

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Navigate to **Network Access**
3. Add **"0.0.0.0/0"** to allow connections from anywhere (or restrict to Vercel IPs)
4. Click **"Add Entry"**

### Step 2: Database User

1. Go to **Database Access**
2. Ensure you have a user with read/write permissions
3. Update the `MONGODB_URI` with the correct username/password

### Step 3: Database Collections

Verify these collections exist in your `you-hungry` database:

- `users`
- `restaurants`
- `collections`
- `groups`
- `decisions`
- `friendships`

## 🔍 Google APIs Configuration

### Google Places API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services > Credentials**
3. Select your API key
4. Under **Application restrictions**, add your production domain
5. Under **API restrictions**, ensure **Places API** is enabled

### Google Address Validation API

1. In the same Google Cloud Console
2. Enable **Address Validation API**
3. Add the same domain restrictions
4. Ensure the API key has access to this service

## 📱 Twilio Configuration

### Step 1: Phone Number Setup

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **Phone Numbers > Manage > Active numbers**
3. Purchase a phone number if you haven't already
4. Note the phone number (format: +1234567890)

### Step 2: Account Credentials

1. Go to **Account > API keys & tokens**
2. Copy your **Account SID** and **Auth Token**
3. Add these to your Vercel environment variables

### Step 3: Test SMS

1. Send a test SMS to verify the integration works
2. Check Twilio logs for any delivery issues

## 🔒 Security Configuration

### CORS Settings

Ensure your API routes have proper CORS configuration:

```typescript
// Example for API routes
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://your-app.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
```

### Rate Limiting

Consider implementing rate limiting for API endpoints:

- Restaurant search: 100 requests per minute per user
- Collection operations: 50 requests per minute per user
- Decision making: 10 requests per minute per user

## 📊 Monitoring & Analytics

### Vercel Analytics

1. Enable Vercel Analytics in your project dashboard
2. Monitor performance metrics and errors
3. Set up alerts for critical issues

### Error Tracking

1. Consider integrating Sentry or similar error tracking
2. Monitor database connection issues
3. Track API failures and timeouts

### Database Monitoring

1. Set up MongoDB Atlas monitoring
2. Monitor connection counts and query performance
3. Set up alerts for high memory usage or slow queries

## 🧪 Testing Checklist

### Authentication Flow

- [ ] User can sign up with email
- [ ] User can sign in with existing account
- [ ] User profile is created in database
- [ ] User can sign out
- [ ] Protected routes redirect to sign-in

### Database Operations

- [ ] User data is properly stored
- [ ] Collections can be created and retrieved
- [ ] Restaurant data is searchable
- [ ] Webhook creates users automatically

### API Endpoints

- [ ] Restaurant search returns results
- [ ] Collection CRUD operations work
- [ ] Error handling works properly
- [ ] Rate limiting is in place

### External Integrations

- [ ] Google Places API returns restaurant data
- [ ] Twilio can send SMS (if implemented)
- [ ] Address validation works (if implemented)

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
- Check API key restrictions
- Ensure APIs are enabled in Google Cloud Console
- Check rate limits and quotas

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

## ✅ Deployment Checklist

- [ ] App deployed to Vercel
- [ ] Custom domain configured (if applicable)
- [ ] All environment variables set
- [ ] Clerk webhook configured and tested
- [ ] MongoDB Atlas configured
- [ ] Google APIs configured
- [ ] Twilio configured (if using SMS)
- [ ] Security settings reviewed
- [ ] Monitoring set up
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Team notified of deployment

---

## 📝 Notes

- Keep this document updated as you add new services or configurations
- Test all integrations thoroughly before marking as complete
- Consider setting up staging environment for testing changes
- Document any custom configurations or workarounds
