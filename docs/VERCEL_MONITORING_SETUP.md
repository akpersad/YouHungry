# Vercel Monitoring & Alerting Setup Guide

## 🚨 Problem Solved

Your app was generating **1.3k requests/hour** and you needed:

1. **Smart polling** that maintains UX for group decisions
2. **Cost monitoring** to prevent hitting Vercel free tier limits
3. **Early warning system** to take action before costs spiral

## ✅ Solutions Implemented

### 1. Smart Conditional Polling

**Group Decisions:**

- **Active decisions:** 30-second polling (real-time UX)
- **Inactive decisions:** 5-minute polling (cost savings)
- **Recent activity:** 30-second polling for 5 minutes after updates

**Notifications:**

- **Unread notifications:** 30-second polling
- **All read:** 5-minute polling

**Result:** Best of both worlds - real-time UX when needed, cost savings when idle.

### 2. Vercel Usage Monitoring

**Automated Monitoring:**

- **Cron job:** Runs every 6 hours (`0 */6 * * *`)
- **Checks:** Bandwidth, function execution, request volume
- **Alerts:** Email/Slack notifications when approaching limits

**Alert Thresholds:**

- **Warning:** 70% of limits
- **Critical:** 90% of limits
- **Cooldown:** 1 hour between same-level alerts

### 3. Real-time Dashboard

**Monitoring Dashboard:**

- **Live usage data** with visual progress bars
- **Status indicators** (green/yellow/red)
- **Auto-refresh** every 5 minutes
- **Manual refresh** button

## 🔧 Setup Instructions

### Step 1: Environment Variables

Add to your `.env.local`:

```bash
# Slack webhook for alerts (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Email service for alerts (optional)
SENDGRID_API_KEY=your_sendgrid_key
ALERT_EMAIL=your-email@example.com
```

### Step 2: Deploy Cron Job

The cron job is already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/vercel-monitoring",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Step 3: Set Up Slack Alerts (Optional)

1. Go to your Slack workspace
2. Create a new app or use existing one
3. Add "Incoming Webhooks" feature
4. Create webhook for `#alerts` channel
5. Add webhook URL to environment variables

### Step 4: Access Monitoring Dashboard

Add the dashboard to your admin panel:

```tsx
import { VercelUsageDashboard } from '@/components/monitoring/VercelUsageDashboard';

// In your admin page
<VercelUsageDashboard />;
```

## 📊 Expected Impact

### Request Volume Reduction

**Before:**

- Group decisions: 120 requests/hour (always)
- Notifications: 120 requests/hour (always)
- **Total per user:** ~240 requests/hour

**After:**

- Group decisions: 12-120 requests/hour (conditional)
- Notifications: 12-120 requests/hour (conditional)
- **Total per user:** ~24-240 requests/hour (50-90% reduction)

### Cost Savings

- **Peak usage:** Same UX as before
- **Idle periods:** 90% fewer requests
- **Overall:** 50-70% reduction in API costs
- **Vercel free tier:** Now supports 20-50+ users instead of 5-10

## 🚨 Alert Examples

### Warning Alert (70% bandwidth)

```
🚨 Vercel Usage Alert - WARNING

Metric: bandwidth
Current Usage: 75%
Threshold: 70%

Bandwidth: 75% (75GB / 100GB)
Function Execution: 45% (45GB-hours / 100GB-hours)
Requests/Hour: 800

Time: 2024-01-15T14:30:00Z
```

### Critical Alert (90% function execution)

```
🚨 Vercel Usage Alert - CRITICAL

Metric: functionExecution
Current Usage: 95%
Threshold: 90%

Bandwidth: 60% (60GB / 100GB)
Function Execution: 95% (95GB-hours / 100GB-hours)
Requests/Hour: 1200

Time: 2024-01-15T18:45:00Z
```

## 🔍 Monitoring Dashboard Features

### Visual Indicators

- **Green:** Usage below warning threshold
- **Yellow:** Usage above warning threshold
- **Red:** Usage above critical threshold

### Real-time Data

- **Bandwidth:** Current usage vs limit
- **Function Execution:** GB-hours used vs limit
- **Request Volume:** Requests per hour
- **Last Updated:** Timestamp of last data refresh

### Alert Thresholds

- **Configurable:** Easy to adjust warning/critical levels
- **Per-metric:** Different thresholds for different metrics
- **Cooldown:** Prevents alert spam

## 🛠️ Customization Options

### Adjust Alert Thresholds

Edit `src/app/api/monitoring/vercel-usage/route.ts`:

```typescript
const ALERT_THRESHOLDS: AlertThresholds = {
  bandwidth: {
    warning: 60, // Lower to 60% for earlier warnings
    critical: 80, // Lower to 80% for earlier critical alerts
  },
  // ... other thresholds
};
```

### Change Cron Schedule

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/vercel-monitoring",
      "schedule": "0 */2 * * *" // Every 2 hours instead of 6
    }
  ]
}
```

### Add More Alert Channels

Extend `sendAlert()` function:

```typescript
// Add SMS alerts
if (process.env.TWILIO_ACCOUNT_SID) {
  await sendSMSAlert(message);
}

// Add Discord alerts
if (process.env.DISCORD_WEBHOOK_URL) {
  await sendDiscordAlert(message);
}
```

## 🚀 Next Steps

### Phase 1: Deploy & Monitor (Week 1)

1. Deploy the monitoring system
2. Watch dashboard for 1 week
3. Adjust thresholds based on actual usage
4. Test alert system

### Phase 2: Optimize Further (Week 2-3)

1. Implement WebSockets for real-time features
2. Add request batching
3. Implement edge caching
4. Add more granular monitoring

### Phase 3: Scale Safely (Ongoing)

1. Monitor usage trends
2. Adjust polling strategies based on user behavior
3. Implement progressive loading
4. Add more sophisticated caching

## 🆘 Emergency Procedures

### If You Get Critical Alerts

1. **Immediately check dashboard** for current usage
2. **Identify high-traffic endpoints** using Vercel analytics
3. **Temporarily increase polling intervals** if needed
4. **Check for infinite loops** or excessive API calls
5. **Consider upgrading Vercel plan** if approaching limits

### Quick Rollback

If UX is severely impacted:

```typescript
// Emergency: Restore 30s polling
refetchInterval: 30000,
refetchIntervalInBackground: true,
```

## 📈 Success Metrics

### Cost Reduction

- **Target:** 50-70% reduction in API requests
- **Monitor:** Vercel dashboard for bandwidth/function usage
- **Alert:** When approaching 70% of limits

### UX Maintenance

- **Target:** No degradation in group decision experience
- **Monitor:** User feedback and engagement metrics
- **Alert:** If polling intervals cause UX issues

### System Health

- **Target:** <1% alert false positives
- **Monitor:** Alert accuracy and relevance
- **Alert:** If monitoring system fails

This setup gives you **complete visibility** into your Vercel usage while maintaining **excellent UX** for your most important features. You'll never be surprised by unexpected costs again! 🎯
