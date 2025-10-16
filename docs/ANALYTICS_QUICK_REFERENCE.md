# Analytics Quick Reference Guide

Quick reference for using analytics tracking functions throughout the app.

## Import Statement

```typescript
import { trackEventName } from '@/lib/analytics';
```

## Common Use Cases

### 1. Track Button Clicks

```typescript
import { trackEvent } from '@/lib/analytics';

<Button
  onClick={() => {
    trackEvent('button_click', {
      button_name: 'feature_name',
      location: 'page_name',
    });
    // Your existing onClick logic
  }}
>
  Click Me
</Button>
```

### 2. Track Page/Component Views

```typescript
import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

function MyComponent() {
  useEffect(() => {
    trackEvent('component_view', {
      component: 'MyComponent',
      page: window.location.pathname,
    });
  }, []);

  // Component code...
}
```

### 3. Track Form Submissions

```typescript
import { trackEvent } from '@/lib/analytics';

const handleSubmit = async (data) => {
  try {
    await submitForm(data);

    trackEvent('form_submit', {
      form_name: 'contact_form',
      success: true,
    });
  } catch (error) {
    trackEvent('form_submit', {
      form_name: 'contact_form',
      success: false,
      error: error.message,
    });
  }
};
```

## All Available Tracking Functions

### Authentication

```typescript
trackSignupStart(method?: 'email' | 'phone' | 'social')
trackSignupComplete(method?: 'email' | 'phone' | 'social')
trackSignIn(method?: 'email' | 'phone' | 'social')
trackSignOut()
trackProfileUpdate(updateType?: string)
trackNotificationPreferencesChanged(channel: string, enabled: boolean)
```

### Restaurant Search

```typescript
trackRestaurantSearch(params: {
  location?: string;
  searchTerm?: string;
  filters?: Record<string, unknown>;
  resultsCount?: number;
})

trackRestaurantView(params: {
  restaurantId?: string;
  restaurantName?: string;
  cuisineType?: string;
  priceLevel?: number;
  rating?: number;
  position?: number;
})

trackSearchFilterApplied(filterType: string, filterValue: string)
trackSearchSortChanged(sortBy: string)
trackRestaurantExternalLinkClick(restaurantName: string, linkType: string)
trackMapMarkerClick(restaurantId: string, restaurantName: string)
```

### Collections

```typescript
trackCollectionCreate(params: {
  collectionType: 'personal' | 'group';
  collectionName?: string;
})

trackCollectionView(params: {
  collectionId: string;
  collectionType?: 'personal' | 'group';
  restaurantCount?: number;
})

trackCollectionDelete(collectionId: string)

trackRestaurantAddToCollection(params: {
  restaurantId: string;
  restaurantName?: string;
  collectionId: string;
})

trackRestaurantRemoveFromCollection(params: {
  restaurantId: string;
  collectionId: string;
})

trackCollectionTabChanged(tabName: string, collectionId: string)
```

### Decisions

```typescript
// Random Decisions
trackDecisionRandomStart(params: {
  collectionId: string;
  restaurantCount: number;
})

trackDecisionRandomComplete(params: {
  collectionId: string;
  selectedRestaurantId?: string;
  selectedRestaurantName?: string;
})

// Group Decisions
trackDecisionGroupStart(params: {
  groupId: string;
  collectionId: string;
  decisionType: 'random' | 'tiered';
  restaurantCount: number;
})

trackDecisionVoteSubmitted(params: {
  groupId: string;
  decisionId: string;
  rankingPositions?: number;
})

trackDecisionGroupComplete(params: {
  groupId: string;
  decisionId: string;
  decisionType: 'random' | 'tiered';
  voteCount?: number;
  selectedRestaurantId?: string;
})

// Manual Entry
trackDecisionManualEntry(params: {
  restaurantId?: string;
  restaurantName?: string;
  collectionId?: string;
})

// Results & Statistics
trackDecisionResultViewed(params: {
  decisionType: 'random' | 'tiered' | 'manual';
  restaurantId?: string;
})

trackDecisionStatisticsViewed(collectionId: string)
```

### Social Features

```typescript
trackFriendSearch(searchTerm: string)
trackFriendRequestSent(friendId?: string)
trackFriendRequestAccepted(friendId?: string)
trackFriendRequestRejected(friendId?: string)
trackFriendRemoved(friendId?: string)

trackGroupCreated(params: {
  groupId?: string;
  memberCount?: number;
})

trackGroupViewed(params: {
  groupId: string;
  memberCount?: number;
})

trackGroupInvitationSent(groupId: string)
trackGroupInvitationAccepted(groupId: string)
trackGroupLeft(groupId: string)
```

### Notifications

```typescript
trackNotificationBellClick()

trackNotificationViewed(params: {
  notificationId?: string;
  notificationType?: string;
})

trackNotificationClicked(params: {
  notificationId?: string;
  notificationType?: string;
})

trackNotificationDismissed(params: {
  notificationId?: string;
  notificationType?: string;
})
```

### UI/UX

```typescript
trackThemeToggle(theme: 'light' | 'dark')
trackNavigationClick(destination: string, location: string)
trackPWAInstallPromptShown()
trackPWAInstalled()

trackError(params: {
  errorType: string;
  errorMessage?: string;
  component?: string;
  page?: string;
  fatal?: boolean;
})
```

### Admin

```typescript
trackAdminDashboardViewed(dashboard: string)
trackAdminAction(action: string, target?: string)
```

### Performance

```typescript
trackWebVital(params: {
  metricName: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  page?: string;
})
```

### Generic Event Tracking

```typescript
trackEvent(eventName: string, params?: EventParams)
trackPageView(url: string, title?: string)
```

## Best Practices

### ✅ DO

1. **Track meaningful actions:**

   ```typescript
   // Good: Track when user completes a meaningful action
   trackDecisionRandomComplete({
     collectionId: 'abc123',
     selectedRestaurantId: 'xyz789',
     selectedRestaurantName: 'Pizza Palace',
   });
   ```

2. **Include context:**

   ```typescript
   // Good: Include relevant context
   trackSearchFilterApplied('cuisine', 'Italian');
   trackSearchSortChanged('price-asc');
   ```

3. **Track both success and failure:**
   ```typescript
   try {
     await createCollection(data);
     trackCollectionCreate({
       collectionType: 'personal',
       collectionName: data.name,
     });
   } catch (error) {
     trackError({
       errorType: 'CollectionCreationError',
       errorMessage: error.message,
       component: 'CreateCollectionForm',
     });
   }
   ```

### ❌ DON'T

1. **Don't track PII:**

   ```typescript
   // Bad: Don't send email addresses or phone numbers
   trackEvent('user_action', {
     email: user.email, // ❌ NO!
     phone: user.phone, // ❌ NO!
   });

   // Good: Use hashed IDs or generic identifiers
   trackEvent('user_action', {
     userId: hashedUserId, // ✅ Already handled automatically
   });
   ```

2. **Don't over-track:**

   ```typescript
   // Bad: Tracking every mouse move
   onMouseMove={() => trackEvent('mouse_move')} // ❌ NO!

   // Good: Track meaningful interactions
   onClick={() => trackDecisionVoteSubmitted({...})} // ✅ YES!
   ```

3. **Don't block on tracking:**

   ```typescript
   // Bad: Awaiting analytics
   await trackEvent('click'); // ❌ NO! (trackEvent is fire-and-forget)

   // Good: Fire and continue
   trackEvent('click'); // ✅ YES!
   doNextThing();
   ```

## Development vs Production

- **Development:** Events are logged to console with `[Analytics]` prefix, but NOT sent to GA4
- **Production:** Events are sent to GA4 when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set

### Testing in Development

```typescript
// Open browser console and look for:
// [Analytics] restaurant_search { location: 'New York', ... }
```

### Testing in Production

1. Install Google Analytics Debugger extension
2. Enable debug mode
3. Check Real-Time reports in GA4
4. Look for network requests to `google-analytics.com/g/collect`

## Common Patterns

### Pattern 1: Track on Mount

```typescript
useEffect(() => {
  trackCollectionView({
    collectionId: id,
    collectionType: 'personal',
    restaurantCount: restaurants.length,
  });
}, [id, restaurants.length]);
```

### Pattern 2: Track on User Action

```typescript
const handleClick = () => {
  trackRestaurantView({
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    position: index,
  });
  // Continue with action...
};
```

### Pattern 3: Track on Success

```typescript
const mutation = useMutation({
  mutationFn: createItem,
  onSuccess: (data) => {
    trackEvent('item_created', {
      itemId: data.id,
      itemType: data.type,
    });
  },
});
```

## Troubleshooting

### Events not showing in GA4?

1. Check `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set
2. Verify you're in production mode
3. Check browser console for `[Analytics]` logs in development
4. Enable GA4 debug mode to see events in real-time
5. Check browser's Network tab for `google-analytics.com/g/collect` requests

### User ID not appearing?

- User ID is automatically set when `GoogleAnalytics` component detects authenticated user
- ID is cryptographically hashed (SHA-256) - you'll see a 64-character hex string, not the actual Clerk ID

### Want to track something not listed?

Use the generic `trackEvent` function:

```typescript
trackEvent('custom_event_name', {
  param1: 'value1',
  param2: 123,
  param3: true,
});
```

---

**Quick Tip:** Import only the functions you need to keep bundle size small:

```typescript
// Good
import { trackRestaurantSearch, trackRestaurantView } from '@/lib/analytics';

// Also fine (tree-shaking will handle it)
import * as analytics from '@/lib/analytics';
```
