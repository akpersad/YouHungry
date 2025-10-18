# VAPID Push Notifications Implementation Guide

## Overview

This application now supports **full push notifications** using VAPID (Voluntary Application Server Identification for Web Push). Push notifications can reach users even when the app is closed or in the background.

## What is VAPID?

VAPID is a specification that allows push notification servers to identify themselves to push services (like Google FCM, Apple Push Notification service, etc.). It provides:

- **Server Authentication**: Proves your server is authorized to send push notifications
- **Public/Private Key Pair**: Uses asymmetric cryptography for secure communication
- **Cross-Platform Support**: Works with all major browsers and platforms

## Implementation Status

✅ **Completed**:

- VAPID keys generated and configured
- Client-side push subscription with VAPID public key
- Server-side push notification sending
- Push subscription storage in MongoDB
- Service worker push event handling
- API endpoints for subscription management
- Test push notification functionality

## Environment Configuration

### Required Environment Variables

Add these to your `.env` file (already included in `env.example`):

```bash
# VAPID Public Key (client-side)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BN1bJK60HzLLlEzqNj4D07BHSSOtPGQgw5qjFCzgB_TxBHzulUCWXafHJO7grUDUWlL6jI3F4M1TBqHkjCMGtgI

# VAPID Private Key (server-side, KEEP SECRET!)
VAPID_PRIVATE_KEY=0SqefchXdfG3FhNYqThhGoE21XsClIwsGDrtIOPsumY

# VAPID Subject (contact email)
VAPID_SUBJECT=mailto:your-email@example.com
```

### Generating New VAPID Keys

If you need to generate new keys for production:

```bash
npx web-push generate-vapid-keys
```

**⚠️ Important**:

- Keep the private key secret - never commit it to version control
- If you change keys, all existing subscriptions will be invalidated
- Use the same keys across all environments for consistency

## Architecture

### Client-Side Flow

1. **User visits app** → Service worker registers
2. **User clicks subscribe** → Request notification permission
3. **Permission granted** → Subscribe to push with VAPID public key
4. **Subscription created** → Send subscription to server API
5. **Server stores** → Subscription saved in user document

### Server-Side Flow

1. **Event triggered** (e.g., group decision, friend request)
2. **Fetch user subscriptions** from MongoDB
3. **Use web-push library** to send notification with VAPID private key
4. **Push service delivers** notification to user's device
5. **Service worker receives** push event and displays notification

## File Structure

### Core Files

```
src/
├── lib/
│   ├── push-notifications.ts      # Client-side push notification manager
│   └── push-service.ts             # Server-side push notification service
├── hooks/
│   └── usePushNotifications.ts     # React hook for push notifications
├── app/
│   ├── api/
│   │   └── push/
│   │       ├── subscribe/route.ts   # Save subscription to database
│   │       ├── unsubscribe/route.ts # Remove subscription from database
│   │       └── test/route.ts        # Send test notification
│   └── push-test/page.tsx          # Push notification test interface
├── types/
│   └── database.ts                 # Added PushSubscription interface
└── public/
    └── sw.js                       # Service worker with push event handlers

package.json                        # Added web-push dependency
env.example                         # VAPID configuration examples
```

## API Endpoints

### POST /api/push/subscribe

Save a push subscription to the user's account.

**Request Body**:

```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

**Response**:

```json
{
  "success": true,
  "message": "Successfully subscribed to push notifications"
}
```

### POST /api/push/unsubscribe

Remove a push subscription from the user's account.

**Request Body**:

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**Response**:

```json
{
  "success": true,
  "message": "Successfully unsubscribed from push notifications"
}
```

### POST /api/push/test

Send a test push notification to all user's subscriptions.

**Response**:

```json
{
  "success": true,
  "message": "Test notification sent to 1 of 1 subscriptions",
  "sent": 1,
  "total": 1
}
```

## Database Schema

### User Document

Added `pushSubscriptions` array to User interface:

```typescript
interface User {
  // ... existing fields
  pushSubscriptions?: PushSubscription[];
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  subscribedAt: Date;
}
```

## Usage Examples

### Client-Side: Subscribe to Push Notifications

```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

function MyComponent() {
  const { subscribe, status } = usePushNotifications();

  const handleSubscribe = async () => {
    try {
      const subscription = await subscribe();
      if (subscription) {
        console.log('Subscribed!', subscription);
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={!status.supported || status.subscribed}
    >
      Subscribe to Notifications
    </button>
  );
}
```

### Server-Side: Send Push Notification

```typescript
import { pushService } from '@/lib/push-service';
import { getUserById } from '@/lib/users';

// Send notification to a user
async function notifyUser(userId: string) {
  const user = await getUserById(userId);
  const subscriptions = user.pushSubscriptions || [];

  if (subscriptions.length === 0) {
    console.log('User has no push subscriptions');
    return;
  }

  const result = await pushService.sendNotificationToMany(subscriptions, {
    title: 'New Update!',
    body: 'Something interesting happened',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    data: { url: '/dashboard' },
  });

  console.log(
    `Sent to ${result.sent} of ${subscriptions.length} subscriptions`
  );
}
```

### Specialized Notifications

The `pushService` provides helper methods for common notification types:

```typescript
// Group decision notification
await pushService.sendGroupDecisionNotification(
  subscriptions,
  'Family Dinner',
  'tiered',
  new Date('2025-10-20')
);

// Friend request notification
await pushService.sendFriendRequestNotification(subscription, 'John Doe');

// Group invitation notification
await pushService.sendGroupInvitationNotification(
  subscription,
  'Weekend Brunch Club',
  'Jane Smith'
);

// Decision result notification
await pushService.sendDecisionResultNotification(
  subscriptions,
  'Family Dinner',
  'Pizza Palace'
);
```

## Testing

### Test Page

Visit `/push-test` to test push notifications:

1. **Check Status** - Verify browser support and permissions
2. **Subscribe** - Subscribe to push notifications
3. **Send Test (Client)** - Test client-side notification (app must be open)
4. **Send Server Push** - Test real push notification (works when app is closed!)
5. **Unsubscribe** - Remove subscription

### Manual Testing

```bash
# 1. Install the PWA on your device
# 2. Open from home screen (standalone mode)
# 3. Navigate to /push-test
# 4. Click "Subscribe to Push Notifications"
# 5. Grant permission when prompted
# 6. Click "Send Server Push Notification"
# 7. Close the app completely
# 8. Notification should still appear!
```

## Platform Support

### ✅ Fully Supported

- **Desktop Chrome** (macOS, Windows, Linux)
- **Desktop Edge** (macOS, Windows)
- **Desktop Firefox** (macOS, Windows, Linux)
- **Android Chrome**
- **iOS Safari 16.4+** (PWA only, when installed to home screen)

### ⚠️ Limited Support

- **iOS Safari** (web browser) - Only basic notifications while app is open
- **iOS Chrome** - No push notification support (uses Safari WebKit)

### ❌ Not Supported

- **iOS < 16.4** - No push notification support for PWAs
- **Older browsers** - Lack Service Worker or Push API support

## Service Worker Integration

The service worker (`public/sw.js`) handles push events:

```javascript
// Push event - receives notification from server
self.addEventListener('push', (event) => {
  const data = event.data.json();

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: data.data,
    actions: data.actions,
  });
});

// Notification click - handle user interaction
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  clients.openWindow(urlToOpen);
});
```

## Security Considerations

### VAPID Private Key

- **Never commit to Git** - Add to `.gitignore`
- **Never expose to client** - Server-side only
- **Rotate periodically** - Generate new keys and update all services
- **Use environment variables** - Never hardcode in source

### Subscription Management

- **Validate subscriptions** - Check endpoint origin before saving
- **Clean up expired** - Remove subscriptions that return 410/404 errors
- **Respect user preferences** - Check notification settings before sending
- **Rate limiting** - Prevent abuse of push notification API

## Troubleshooting

### "subscribing for push requires an applicationServerKey"

✅ **FIXED!** - VAPID keys are now configured. Update your `.env` file.

### Subscription fails silently

- Check VAPID public key is correct in environment
- Verify service worker is registered and active
- Check browser console for errors
- Ensure HTTPS (or localhost) is being used

### Notifications not received

- Check user has granted notification permission
- Verify subscription is saved in database
- Check server logs for push sending errors
- Test with `/api/push/test` endpoint
- Verify service worker is handling push events

### Invalid VAPID keys error

- Regenerate keys with `npx web-push generate-vapid-keys`
- Update both `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`
- Restart development server
- Clear existing subscriptions and resubscribe

## Next Steps

### Integrate with Application Features

1. **Group Decisions** - Send notifications when decisions start/complete
2. **Friend Requests** - Notify users of new friend requests
3. **Group Invitations** - Alert users when invited to groups
4. **Decision Results** - Announce final restaurant selections

### Example Integration

```typescript
// In your group decision creation endpoint
import { pushService } from '@/lib/push-service';
import { getUserById } from '@/lib/users';

// After creating decision
const group = await getGroupById(groupId);
const members = await Promise.all(
  group.memberIds.map((id) => getUserById(id.toString()))
);

// Send notifications to all members
for (const member of members) {
  if (member.pushSubscriptions?.length > 0) {
    await pushService.sendGroupDecisionNotification(
      member.pushSubscriptions,
      group.name,
      'tiered',
      decision.deadline
    );
  }
}
```

## Resources

- [Web Push API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [web-push Library](https://github.com/web-push-libs/web-push)
- [iOS Web Push Support](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## Conclusion

Push notifications are now fully implemented with VAPID authentication! Users can subscribe to receive real-time notifications even when the app is closed. The system is secure, scalable, and works across all major platforms (iOS 16.4+, Android, Desktop).

Test it out at `/push-test` and start integrating push notifications into your application features! 🎉
