# Vercel Cron Job Setup Guide

This guide explains how to set up automated daily performance metrics collection using Vercel Cron Jobs.

## Overview

The application automatically collects performance metrics daily at **6:00 AM EST (11:00 AM UTC)** and saves them to MongoDB.

## Files Created

1. **`vercel.json`** - Vercel cron configuration
2. **`src/lib/metrics-collector.ts`** - Metrics collection logic (TypeScript module)
3. **`src/app/api/cron/performance-metrics/route.ts`** - API endpoint triggered by cron

## Setup Steps

### 1. Generate Secure Secrets

Generate two secure random strings for authentication:

```bash
# Generate CRON_SECRET
openssl rand -base64 32

# Generate INTERNAL_API_SECRET (for future internal API calls)
openssl rand -base64 32
```

### 2. Add Environment Variables to Vercel

Go to your Vercel project settings and add these environment variables:

**Production, Preview, and Development:**

- `CRON_SECRET` - The first generated secret
- `INTERNAL_API_SECRET` - The second generated secret

**Important:**

- Make sure these are set for all environments (Production, Preview, Development)
- These secrets prevent unauthorized access to your cron endpoint

### 3. Deploy to Vercel

```bash
# Commit all changes
git add .
git commit -m "feat: add Vercel cron job for performance metrics"

# Push to trigger deployment
git push origin epic/9/polish-and-optimization
```

Vercel will automatically:

- ✅ Detect the `vercel.json` configuration
- ✅ Schedule the cron job
- ✅ Start running it daily at 11:00 AM UTC (6:00 AM EST)

### 4. Verify Deployment

After deploying, verify in your Vercel dashboard:

1. Go to **Settings** → **Cron Jobs**
2. You should see:
   - Path: `/api/cron/performance-metrics`
   - Schedule: `0 11 * * *`
   - Status: Active

### 5. Test Manually (Optional)

Test the cron job manually before waiting for the scheduled time:

```bash
# Replace with your actual values
curl -X GET "https://www.forkintheroad.app/api/cron/performance-metrics" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:

```json
{
  "success": true,
  "date": "2025-10-15",
  "duration": "1234ms",
  "metrics": {
    "apiPerformance": { ... },
    "system": { ... }
  },
  "message": "Performance metrics collected successfully"
}
```

### 6. Monitor Execution

Check cron job logs in Vercel:

1. Go to your project in Vercel dashboard
2. Click **Logs** tab
3. Filter by function: `/api/cron/performance-metrics`
4. You'll see execution logs, errors, and duration

## Cron Schedule Explanation

**Schedule:** `0 11 * * *`

| Minute | Hour | Day of Month | Month | Day of Week |
| ------ | ---- | ------------ | ----- | ----------- |
| 0      | 11   | \*           | \*    | \*          |

- **0** = At minute 0 (top of the hour)
- **11** = At hour 11 (11:00 AM UTC = 6:00 AM EST)
- **\*** = Every day
- **\*** = Every month
- **\*** = Every day of week

## What Gets Collected

The cron job collects:

1. ✅ **API Performance Metrics**
   - Total requests
   - Cache hit rate
   - Daily/monthly costs
   - Cache statistics

2. ✅ **System Metrics**
   - Platform info
   - Node version
   - Memory usage
   - Uptime

3. ⏭️ **Bundle Size** (skipped in production)
   - Only collected during build time
   - Available locally via `npm run perf:collect`

4. ⏭️ **Web Vitals** (collected client-side)
   - Already being collected via `/api/web-vitals`
   - Aggregated separately from user visits

## Troubleshooting

### Cron Job Not Running

**Check:**

1. `vercel.json` is in the project root
2. `CRON_SECRET` is set in Vercel environment variables
3. Deployment was successful (check Vercel dashboard)
4. Cron job is listed under Settings → Cron Jobs

### Unauthorized (401) Error

**Fix:**

1. Verify `CRON_SECRET` matches in:
   - Vercel environment variables
   - Your test curl command (if testing manually)
2. Redeploy after adding/updating environment variables

### Health Check Failed (503) Error

**Fix:**

1. Verify `MONGODB_URI` and `MONGODB_DATABASE` are set correctly
2. Check MongoDB Atlas allows connections from Vercel IPs (0.0.0.0/0)
3. Test database connection in Vercel logs

### Timeout Error

The cron job has a 5-minute timeout (`maxDuration = 300`).

If timing out:

1. Check Vercel logs for slow operations
2. Consider reducing metrics collected
3. Optimize database queries

## Local Development

To test locally (without cron):

```bash
# Method 1: Use the CLI script (with builds, Lighthouse, etc.)
npm run perf:collect

# Method 2: Test the API endpoint locally
# Start dev server
npm run dev

# In another terminal
curl -X GET "http://localhost:3000/api/cron/performance-metrics" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Changing the Schedule

To run at a different time, edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/performance-metrics",
      "schedule": "0 14 * * *" // 2:00 PM UTC = 9:00 AM EST
    }
  ]
}
```

Common schedules:

- Daily at midnight UTC: `"0 0 * * *"`
- Daily at 6 AM EST: `"0 11 * * *"`
- Daily at 9 AM EST: `"0 14 * * *"`
- Weekly on Monday 6 AM EST: `"0 11 * * 1"`

**Note:** Vercel Hobby plans are limited to daily cron jobs only. More frequent schedules (like `"0 */6 * * *"`) require a Pro plan.

After changing, commit and deploy for changes to take effect.

## Security Notes

1. **Never commit secrets** - Use environment variables only
2. **Rotate secrets regularly** - Change `CRON_SECRET` periodically
3. **Monitor logs** - Watch for unauthorized access attempts
4. **Restrict access** - Only Vercel cron should call this endpoint

## Admin Dashboard Access

View collected metrics in the admin dashboard:

1. Go to `https://www.forkintheroad.app/admin`
2. Click **Performance** tab
3. Select comparison period:
   - Yesterday
   - 1 week ago
   - 2 weeks ago
   - 1 month ago

All data is queried from MongoDB in real-time.

## Support

If you encounter issues:

1. Check Vercel logs for errors
2. Verify all environment variables are set
3. Test MongoDB connection
4. Try manual trigger to debug

For Vercel-specific cron issues, see: https://vercel.com/docs/cron-jobs
