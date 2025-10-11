# Group Decision Notifications System

## Overview

The Group Decision Notifications system provides comprehensive multi-channel notifications to group members when decisions are started and completed. This feature ensures all group members stay informed about decision-making activities through their preferred communication channels.

## Features

### Multi-Channel Notifications

- **Email**: Rich HTML emails with decision details and direct links
- **SMS**: Concise text messages with shortened URLs (development mode uses `TWILIO_TO_PHONE_NUMBER`)
- **Push Notifications**: Native browser push notifications
- **In-App**: Database-backed notifications visible in the app

### Granular Notification Preferences

Users can control their notification preferences at a granular level:

- **Decision Started**: Notify when a group decision is created (prompting members to vote)
- **Decision Completed**: Notify when a decision is finalized (result announced)

Both settings are enabled by default and can be toggled independently in the user's profile.

## Database Schema Changes

### User Schema

Added granular notification settings:

```typescript
interface User {
  // ... existing fields
  preferences: {
    // ... existing preferences
    notificationSettings: {
      groupDecisions: {
        started: boolean; // Notify when decision starts
        completed: boolean; // Notify when decision completes
      };
      friendRequests: boolean;
      groupInvites: boolean;
      smsEnabled: boolean;
      emailEnabled: boolean;
      pushEnabled: boolean;
    };
  };
}
```

### Decision Schema

Added creator tracking:

```typescript
interface Decision {
  // ... existing fields
  createdBy?: ObjectId; // User ID of person who started the decision
}
```

## Notification Flow

### Decision Started (Tiered Voting)

**Trigger**: When a tiered decision is created via `POST /api/decisions/group`

**Recipients**: All group members except the creator

**Content**:

- **Email**:
  - Subject: "🍽️ Decision Time in {GroupName} - Vote Now"
  - Includes: Group name, collection name, creator name, deadline, direct link to collection page
- **SMS**: "🍽️ You Hungry? - {GroupName} has started a group decision! Vote by {deadline}. {shortUrl}"
- **Push**: "X Group has started a decision"
- **In-App**: Notification stored in database with decision details

**Preferences Check**: Only sent to users with `groupDecisions.started = true`

### Decision Started (Random Selection)

**Trigger**: When a random selection decision is created and immediately completed

**Recipients**: All group members

**Content**:

- **Email**:
  - Subject: "🎉 {GroupName} decided: {RestaurantName}"
  - Includes: Group name, collection name, restaurant name, indication it was random choice
- **SMS**: "🎉 You Hungry? - {GroupName} decision complete! You're going to {RestaurantName} (random choice)! {shortUrl}"
- **Push**: "{GroupName} decided on {RestaurantName}"
- **In-App**: Notification with decision result

**Preferences Check**: Only sent to users with `groupDecisions.completed = true`

### Decision Completed (Tiered Voting)

**Trigger**: When all votes are in and decision is finalized via `PUT /api/decisions/group/vote`

**Recipients**: All group members

**Content**:

- **Email**:
  - Subject: "{GroupName} decided: {RestaurantName}"
  - Includes: Group name, collection name, restaurant name, voting method indication
- **SMS**: "🎉 You Hungry? - {GroupName} decision complete! You're going to {RestaurantName} (group vote)! {shortUrl}"
- **Push**: "{GroupName} decided on {RestaurantName}"
- **In-App**: Notification with decision result

**Preferences Check**: Only sent to users with `groupDecisions.completed = true`

## SMS Configuration

### Development Mode

- SMS sent to: `process.env.TWILIO_TO_PHONE_NUMBER`
- Allows testing without needing multiple verified phone numbers

### Production Mode

- SMS sent to: User's verified `phoneNumber` or `smsPhoneNumber`
- Requires: `smsOptIn = true` AND `smsEnabled = true` AND verified phone number

## URL Shortening

All SMS messages include shortened URLs for better user experience:

- Collection page URLs are shortened using the built-in URL shortener
- Format: `{APP_URL}/s/{shortCode}`
- Expiration: 30 days
- Tracks click counts for analytics

## Implementation Details

### Core Files

#### Decision Notifications Service

**File**: `src/lib/decision-notifications.ts`

Functions:

- `sendDecisionStartedNotifications()` - Sends notifications when decision starts
- `sendDecisionCompletedNotifications()` - Sends notifications when decision completes

Features:

- Fetches group members with preferences
- Respects user notification preferences
- Generates shortened URLs for SMS
- Orchestrates multi-channel delivery

#### API Endpoints

**Decision Creation**: `src/app/api/decisions/group/route.ts`

- Tracks `createdBy` user
- Sends decision started notifications after creation

**Random Selection**: `src/app/api/decisions/group/random-select/route.ts`

- Tracks `createdBy` user
- Sends decision completed notifications after selection

**Vote Completion**: `src/app/api/decisions/group/vote/route.ts`

- Sends decision completed notifications after final vote tallied

#### Profile Management

**File**: `src/app/api/user/profile/route.ts`

- Handles granular notification preferences
- Backward compatible with old boolean `groupDecisions` format
- Auto-converts boolean to object format

**UI**: `src/app/profile/page.tsx`

- Separate toggles for "Decision Started" and "Decision Completed"
- Clear descriptions for each notification type

### Email Templates

**File**: `src/lib/user-email-notifications.ts`

**Decision Started Template**:

- Gradient purple header
- Group name with collection name
- Creator attribution ("Started by John Doe")
- Deadline callout box
- CTA button linking to collection page
- Unsubscribe link

**Decision Completed Template**:

- Gradient green header (celebration theme)
- Group name with collection name
- Restaurant name in highlighted box
- Decision type indicator (random vs. voting)
- CTA button linking to collection page
- Unsubscribe link

### SMS Templates

**File**: `src/lib/sms-notifications.ts`

**Decision Started**:

```
🍽️ You Hungry? - {GroupName} has started a group decision! Vote by {date} at {time}. {shortUrl}
```

**Decision Completed**:

```
🎉 You Hungry? - {GroupName} decision complete! You're going to {RestaurantName} ({type})! {shortUrl}
```

## Testing

### Test Files

- `src/lib/__tests__/decision-notifications.test.ts` - Core notification logic tests
- `src/app/api/user/profile/__tests__/granular-notifications.test.ts` - Profile preferences tests

### Test Coverage

- ✅ Notification sending to group members
- ✅ Preference filtering (opted in/out users)
- ✅ Creator exclusion from started notifications
- ✅ Missing data handling (graceful degradation)
- ✅ Backward compatibility with old boolean format
- ✅ Partial preference updates
- ✅ URL shortening integration

### Manual Testing Checklist

#### Setup

- [ ] Verify `TWILIO_TO_PHONE_NUMBER` is set (development)
- [ ] Verify `RESEND_API_KEY` is set
- [ ] Verify `NEXT_PUBLIC_APP_URL` is set
- [ ] Create test group with multiple members

#### Decision Started (Tiered)

- [ ] Create tiered decision
- [ ] Verify creator receives NO notification
- [ ] Verify other members receive email
- [ ] Verify other members receive SMS (if enabled)
- [ ] Verify email includes collection name and creator name
- [ ] Verify SMS includes shortened URL
- [ ] Verify URL redirects to collection page

#### Decision Started (Random)

- [ ] Create random decision
- [ ] Verify all members receive email
- [ ] Verify email indicates random selection
- [ ] Verify SMS mentions random choice

#### Decision Completed (Tiered)

- [ ] Complete tiered decision (all votes in)
- [ ] Verify all members receive email
- [ ] Verify email shows restaurant name and voting method
- [ ] Verify SMS includes restaurant name

#### Preferences

- [ ] Disable "Decision Started" in profile
- [ ] Create decision - verify no notification
- [ ] Re-enable and verify notifications resume
- [ ] Disable "Decision Completed" in profile
- [ ] Complete decision - verify no notification
- [ ] Test with SMS disabled
- [ ] Test with email disabled

## Migration Notes

### Existing Users

- Users with old boolean `groupDecisions` setting will have it auto-converted to object format
- Default values: `{ started: true, completed: true }`
- No data migration script needed - handled on-the-fly

### New Users

- Created via Clerk webhook with granular settings by default
- Both `started` and `completed` default to `true`

## Environment Variables

```bash
# Required for notifications
RESEND_API_KEY=your_resend_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
TWILIO_TO_PHONE_NUMBER=+1234567890  # Development only
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid
FROM_EMAIL=noreply@yourdomain.com
```

## Future Enhancements

Potential improvements:

- [ ] Reminder notifications for pending votes (approaching deadline)
- [ ] Early completion notifications (all votes in before deadline)
- [ ] Digest mode (batch notifications)
- [ ] Custom notification schedules (quiet hours)
- [ ] WhatsApp integration
- [ ] Slack integration for group channels

## Troubleshooting

### Notifications Not Received

**Check**:

1. User notification preferences in profile
2. `smsOptIn` and `smsPhoneNumber` for SMS
3. Email deliverability (check spam folder)
4. API key configuration
5. Logs for error messages

**Common Issues**:

- SMS not sending: Verify `TWILIO_TO_PHONE_NUMBER` in dev or user has verified phone in prod
- Email not sending: Check `RESEND_API_KEY` and `FROM_EMAIL`
- Push not working: Requires HTTPS and service worker registration

### URL Shortening Fails

**Fallback**:

- System falls back to full URL if shortening fails
- Notifications still sent, just with longer URLs

### Performance Considerations

**Optimization**:

- Notifications sent in parallel using `Promise.allSettled()`
- Failed notifications don't block others
- Errors logged but don't fail the decision creation/completion

## Support

For issues or questions:

1. Check logs in `src/lib/logger.ts` output
2. Verify environment variables are set
3. Test with development mode first
4. Review test files for expected behavior
