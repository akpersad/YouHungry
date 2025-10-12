# Error Tracking System - Usage Guide

## Overview

The ForkInTheRoad app includes a comprehensive error tracking system designed to capture, analyze, and resolve errors during beta testing and production. This guide explains how to use the system effectively.

## For Developers

### Automatic Error Capture

Errors are automatically captured through React Error Boundaries at three levels:

1. **Root Level** (`/app/layout.tsx`)
   - Catches catastrophic errors
   - Shows full-screen error page
   - Always active, no configuration needed

2. **Route Level** (Individual pages)
   - Wrap page components with `<ErrorBoundary level="route">`
   - Example:

   ```tsx
   import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

   export default function MyPage() {
     return (
       <ErrorBoundary level="route">
         <MyPageContent />
       </ErrorBoundary>
     );
   }
   ```

3. **Component Level** (Individual components)
   - Wrap specific components that might fail
   - Example:
   ```tsx
   <ErrorBoundary level="component">
     <ComplexComponent />
   </ErrorBoundary>
   ```

### Manual Error Logging

Log errors manually from anywhere in the client:

```typescript
import { logClientError } from '@/lib/error-tracking';

try {
  // Risky operation
} catch (error) {
  await logClientError(
    error,
    {
      context: 'additional data',
      feature: 'restaurant-search',
    },
    'User was trying to search for restaurants'
  );
}
```

### Server-Side Error Logging

Log errors from API routes:

```typescript
import { logError } from '@/lib/error-tracking';

export async function GET(request: NextRequest) {
  try {
    // API logic
  } catch (error) {
    await logError({
      error,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      additionalData: { route: '/api/restaurants' },
    });

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
```

## For Admins

### Accessing the Error Dashboard

1. Navigate to `/admin`
2. Click the "Errors" tab in the navigation
3. View error statistics, groups, and individual occurrences

### Understanding Error Metrics

**Total Errors**: Total number of error occurrences across all groups

**Critical Errors**: Errors classified as "critical" (database, auth, etc.)

**Affected Users**: Number of unique users who encountered errors

**Error Rate**: Average errors per hour over the last 24 hours

### Error Severity Levels

- **Critical**: Database failures, authentication errors, payment issues
- **Error**: General application errors, failed API calls
- **Warning**: Deprecated features, potential issues
- **Info**: Informational logs, user-reported issues

### Error Categories

- **Client**: Front-end React errors, component failures
- **Server**: Backend API errors, server-side processing errors
- **Network**: Failed API requests, timeout errors
- **API**: External API failures (Google Places, etc.)

### Managing Errors

#### View Error Details

Click on any error group to see:

- Full error message and stack trace
- Individual occurrences with user context
- First seen and last seen timestamps
- Affected users
- User reports (if any)

#### Update Error Status

- **Investigate**: Mark error as being actively worked on
- **Resolve**: Mark error as fixed
- **Ignore**: Hide error from active view (false positives, etc.)

#### Delete Error Groups

Permanently remove error groups and all associated logs. Use cautiously.

#### Add Notes

Add notes to error groups for team coordination:

- "Fixed in PR #123"
- "Waiting for API fix from provider"
- "User-specific issue, contacted directly"

### Filtering Errors

Use the filter dropdowns to narrow down errors:

- **Status**: open, investigating, resolved, ignored
- **Severity**: critical, error, warning, info
- **Category**: client, server, network, api

### Error Alerts

Critical errors automatically trigger admin alerts via:

- Email (Resend API)
- SMS (Twilio)
- In-app notifications

Alerts include:

- Error message
- Error fingerprint
- URL where error occurred
- Timestamp

## For Beta Testers

### Reporting Issues

When you encounter an error:

1. You'll see a friendly error page with "Nibbles" (our mascot)
2. Click "Report this issue" button
3. Describe what you were trying to do
4. Submit the report

Your report helps us understand the context and fix issues faster!

### What Gets Captured

When you encounter an error, we automatically capture:

- What page you were on
- What browser and device you're using
- Your screen size
- A general idea of your recent actions

We DO NOT capture:

- Passwords or sensitive input
- Personal messages or data
- Keystrokes or detailed activity

Your privacy is important to us!

## Error Page Types

### 404 Not Found

- Shows "Nibbles" searching for the page
- Provides navigation options (home, search restaurants)
- Fun fact about HTTP 404 errors
- "Go back" button

### General Application Errors

- Shows "Nibbles" looking sad
- Explains what happened
- Recovery options (try again, go home)
- Report issue button
- Encouraging message

### Component-Level Errors

- Minimal UI disruption
- Shows error in specific section only
- Rest of page continues to work
- Try again button

## Best Practices

### For Developers

1. **Use Error Boundaries** at appropriate levels
2. **Log contextual data** to help debug
3. **Test error scenarios** in development
4. **Don't swallow errors** - always log or handle them
5. **Provide user-friendly messages** - avoid technical jargon in UI

### For Admins

1. **Review errors daily** during beta testing
2. **Prioritize critical errors** first
3. **Look for patterns** - multiple users hitting same error
4. **Communicate fixes** to affected users when possible
5. **Clean up resolved errors** regularly

### For Beta Testers

1. **Report errors** when you see them
2. **Describe what you were doing** in detail
3. **Include steps to reproduce** if possible
4. **Be patient** - we're working to fix everything!

## Database Schema

### ErrorLog Collection

Stores individual error occurrences with full context.

**Key Fields**:

- `fingerprint`: Groups similar errors
- `message`: Error message
- `stack`: Stack trace
- `userId`, `userEmail`, `userName`: User who encountered error
- `url`: Page where error occurred
- `browser`, `device`: Environment info
- `breadcrumbs`: User actions leading to error
- `severity`: critical | error | warning | info
- `category`: client | server | network | api
- `userReport`: User-submitted description

### ErrorGroup Collection

Aggregates errors by fingerprint for efficient analysis.

**Key Fields**:

- `fingerprint`: Unique identifier for error type
- `totalOccurrences`: How many times this error occurred
- `affectedUsers`: Number of unique users affected
- `affectedUserIds`: List of user IDs
- `status`: open | investigating | resolved | ignored
- `firstSeenAt`, `lastSeenAt`: Time tracking

## API Endpoints

### POST /api/errors

Log a client-side error

- **Auth**: Optional (works for anonymous users)
- **Body**: `{ error, url, userAgent, additionalData, userReport }`

### GET /api/admin/errors

Retrieve error groups and statistics

- **Auth**: Admin only
- **Query**: `?status=open&severity=critical&category=client`

### PATCH /api/admin/errors/[fingerprint]

Update error group status

- **Auth**: Admin only
- **Body**: `{ status, notes }`

### DELETE /api/admin/errors/[fingerprint]

Delete error group and all logs

- **Auth**: Admin only

## Troubleshooting

### Errors Not Appearing in Dashboard

1. Check MongoDB connection
2. Verify API endpoint is accessible
3. Check browser console for logging errors
4. Ensure user is authenticated (for admin dashboard)

### Error Boundaries Not Catching Errors

1. Ensure Error Boundary wraps the component
2. Check for async errors (may need try/catch)
3. Verify error is thrown in render phase
4. Check React version compatibility

### Critical Alerts Not Sending

1. Verify admin alert system is configured
2. Check RESEND_API_KEY is set
3. Verify Twilio credentials (for SMS)
4. Check alert threshold settings

## Future Enhancements

- **Error trends over time** - Graph showing error frequency
- **Error search** - Search errors by message or user
- **Automated error tagging** - ML-based error categorization
- **Integration with Sentry** - Optional external error tracking
- **Error performance impact** - Measure error effect on app performance
- **User impact scoring** - Prioritize errors by user impact

## Support

For questions or issues with the error tracking system:

- Check this documentation
- Review the technical architecture docs
- Contact the development team

---

**Remember**: The goal of error tracking is to improve the user experience by quickly identifying and fixing issues. Use this system proactively to maintain a high-quality app!
