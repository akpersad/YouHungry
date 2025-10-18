# Vercel Analytics - Verification Checklist

## ✅ Installation Complete

All components have been successfully installed and configured.

## What to Check After Deployment

### 1. Verify Vercel Analytics is Active

Once deployed to Vercel:

1. Go to your Vercel project dashboard
2. Click on the **Analytics** tab in the sidebar
3. You should see:
   - Page views per route
   - Top pages
   - Visitors count
   - Traffic sources

**Note**: Data may take 5-10 minutes to appear after first deployment.

### 2. Verify Speed Insights is Active

In your Vercel project dashboard:

1. Click on the **Speed Insights** tab
2. You should see:
   - Core Web Vitals scores (LCP, FID, CLS, TTFB, FCP)
   - Performance scores per route
   - Real User Monitoring data

**Note**: Speed data may take 15-30 minutes to populate with meaningful data.

### 3. Verify Google Analytics Still Works

To ensure no conflicts:

1. Visit your site in production
2. Open browser DevTools → Console
3. Type: `window.gtag`
4. Should return: `function gtag() { ... }` (not `undefined`)
5. Check Google Analytics dashboard - should still see real-time data

### 4. Browser DevTools Check

Open your production site and check DevTools:

**Network Tab:**

- Filter by "gtag" → Should see Google Analytics requests
- Filter by "vercel" or "\_vercel" → Should see Vercel Analytics beacons

**Console Tab:**

- Should be **no errors** related to analytics
- Both scripts should load without conflicts

## Expected Behavior

### Development Mode (`npm run dev`)

- ❌ Google Analytics: Disabled (only runs in production)
- ❌ Vercel Analytics: Disabled (only runs on Vercel)
- ❌ Speed Insights: Disabled (only runs on Vercel)

### Production Build Locally (`npm run build && npm run start`)

- ✅ Google Analytics: Active (if `NEXT_PUBLIC_GA_MEASUREMENT_ID` set)
- ❌ Vercel Analytics: Disabled (needs Vercel deployment)
- ❌ Speed Insights: Disabled (needs Vercel deployment)

### Production on Vercel

- ✅ Google Analytics: Active
- ✅ Vercel Analytics: Active
- ✅ Speed Insights: Active

## Testing the Integration

### Quick Smoke Test

After deploying to Vercel:

```bash
# 1. Visit your production URL
open https://forkintheroad.app

# 2. Navigate to a few different pages:
# - Home page
# - Dashboard
# - Search page
# - A group page

# 3. Wait 5-10 minutes

# 4. Check both dashboards:
# - Google Analytics: https://analytics.google.com/
# - Vercel Analytics: https://vercel.com/[your-project]/analytics
```

### Detailed Test

1. **Test Google Analytics**

   ```javascript
   // In browser console on production site:
   window.gtag('event', 'test_event', { test: true });
   // Check GA real-time events - should see 'test_event'
   ```

2. **Test Vercel Analytics**
   - Simply navigate between pages
   - Vercel automatically tracks page views
   - Check Vercel dashboard after 5-10 minutes

3. **Test Speed Insights**
   - Load a page and let it fully render
   - Speed Insights automatically measures Core Web Vitals
   - Check Vercel Speed Insights tab after 15-30 minutes

## Troubleshooting

### Issue: Vercel Analytics showing no data

**Solutions:**

1. Ensure you're deployed on Vercel (not Netlify, AWS, etc.)
2. Wait 10-15 minutes after deployment
3. Visit a few pages to generate data
4. Check if ad blockers are interfering

### Issue: Google Analytics stopped working

**Solutions:**

1. Check `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set in Vercel environment variables
2. Verify no JavaScript errors in console
3. Check GA dashboard for configuration issues
4. **This is unlikely** - Vercel Analytics doesn't interfere with GA

### Issue: Both analytics showing different page view counts

**This is normal!**

- GA tracks sessions, events, custom tracking
- Vercel tracks simple page views
- Different methods = different counts
- Both are correct for their respective purposes

### Issue: Performance issues after adding Vercel Analytics

**This should not happen!**

- Vercel Analytics adds only ~1.5KB
- If you notice issues, check:
  - Browser DevTools → Performance tab
  - Network tab for failed requests
  - Console for JavaScript errors

## Success Indicators

### ✅ Everything is working when:

1. **Google Analytics Dashboard**: Shows traffic, events, conversions
2. **Vercel Analytics Tab**: Shows page views and top pages
3. **Vercel Speed Insights Tab**: Shows Core Web Vitals scores
4. **No console errors**: Browser console is clean
5. **Both tracking independently**: Data in both dashboards doesn't conflict

## Data Comparison

After a few days, compare the data:

| Metric               | Google Analytics                   | Vercel Analytics   |
| -------------------- | ---------------------------------- | ------------------ |
| **Page Views**       | Higher (includes duplicates, bots) | Lower (filtered)   |
| **Unique Visitors**  | Tracked                            | Not tracked        |
| **Session Duration** | Tracked                            | Not tracked        |
| **Bounce Rate**      | Tracked                            | Not tracked        |
| **Core Web Vitals**  | Limited                            | Comprehensive      |
| **Custom Events**    | Yes                                | No                 |
| **Real-time**        | Yes                                | Delayed (5-10 min) |

## Next Steps

1. **Deploy to Vercel** (if not already)
2. **Wait 10-15 minutes** for data to populate
3. **Check both dashboards** (GA + Vercel)
4. **Monitor for 24 hours** to ensure stability
5. **Set up alerts** (optional):
   - GA: Anomaly detection
   - Vercel: Performance budgets

## Documentation References

- [Vercel Analytics Implementation](./VERCEL_ANALYTICS_IMPLEMENTATION.md) - Detailed technical guide
- [Vercel Analytics Quick Start](./VERCEL_ANALYTICS_QUICK_START.md) - Quick reference
- [Google Analytics Implementation](./ANALYTICS_IMPLEMENTATION_SUMMARY.md) - Your existing GA setup

## Support

If you encounter issues:

1. Check the troubleshooting sections in the docs above
2. Review Vercel's official docs: https://vercel.com/docs/analytics
3. Check Google Analytics help: https://support.google.com/analytics

## Summary

✅ **Installation complete**  
✅ **No configuration needed**  
✅ **No conflicts with Google Analytics**  
✅ **Ready to track data on next deployment**

Simply deploy to Vercel and both systems will work together seamlessly!
