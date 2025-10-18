# Pull-to-Refresh Implementation

## Overview

The Pull-to-Refresh feature provides a native mobile app-like experience for users who have installed your PWA on their mobile devices. When enabled, users can pull down on any page to refresh the content.

**UI Pattern**: Follows the Twitter-style pull-to-refresh pattern with content displacement, where the entire content area moves down to reveal a simple grey indicator area at the top.

## Features

- ✅ **PWA-Only Mode**: Only activates when the app is installed as a PWA
- ✅ **Mobile-Only Mode**: Only activates on mobile devices (configurable)
- ✅ **Smart Detection**: Automatically detects if user is at the top of the page
- ✅ **Visual Feedback**: Animated spinner and text showing pull progress
- ✅ **Smooth Animations**: Natural resistance and smooth transitions
- ✅ **Dark Mode Support**: Automatically adapts to light/dark mode
- ✅ **Customizable**: Threshold, distance, and refresh behavior can be configured
- ✅ **Performance Optimized**: Uses CSS transforms and will-change hints

## How It Works

### Detection Logic

The feature is enabled only when ALL of the following conditions are met:

1. **PWA Detection** (when `pwaOnly: true`):
   - Checks `display-mode: standalone` media query
   - Checks `navigator.standalone` for iOS
   - Checks for Android app referrer

2. **Mobile Detection** (when `mobileOnly: true`):
   - User agent detection for mobile browsers
   - Screen width < 768px as fallback

3. **Page Position**:
   - User is at the top of the page (`window.scrollY === 0`)
   - No scrollable parent is scrolled

### Gesture Tracking

1. **Touch Start**: Records initial Y position
2. **Touch Move**:
   - Calculates pull distance
   - Applies resistance (divides distance by 2.5)
   - Updates visual indicator
   - Prevents default scrolling
3. **Touch End**:
   - Triggers refresh if threshold is met (default 80px)
   - Animates back if threshold not met

## Usage

### Basic Usage (Already Implemented)

The component is already added to your root layout and will work automatically on installed PWAs:

```tsx
// src/app/layout.tsx
<PullToRefresh>
  <PageTransition>
    <AppLayout>{children}</AppLayout>
  </PageTransition>
</PullToRefresh>
```

### Custom Configuration

You can customize the behavior by passing options:

```tsx
<PullToRefresh
  threshold={100} // Minimum pull distance to trigger (default: 80px)
  maxPullDistance={150} // Maximum pull distance (default: 120px)
  pwaOnly={true} // Only on installed PWAs (default: true)
  mobileOnly={true} // Only on mobile devices (default: true)
  onRefresh={customRefresh} // Custom refresh function
  onPullStart={() => {}} // Callback when pull starts
  onPullEnd={() => {}} // Callback when pull ends
>
  {children}
</PullToRefresh>
```

### Custom Refresh Function

By default, the feature uses `window.location.reload()` for a hard refresh. You can provide a custom refresh function:

```tsx
const customRefresh = async () => {
  // Invalidate queries
  await queryClient.invalidateQueries();

  // Fetch fresh data
  await mutate('/api/data');

  // Show success message
  toast.success('Page refreshed!');
};

<PullToRefresh onRefresh={customRefresh}>{children}</PullToRefresh>;
```

### Using the Hook Directly

You can also use the hook directly in any component:

```tsx
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

function MyComponent() {
  const { isPulling, pullDistance, isRefreshing, isEnabled, refresh } =
    usePullToRefresh({
      threshold: 80,
      onRefresh: async () => {
        // Custom refresh logic
        await fetchData();
      },
    });

  return (
    <div>
      {isEnabled && <div>Pull-to-refresh is enabled</div>}
      {isPulling && <div>Pull distance: {pullDistance}px</div>}
      {isRefreshing && <div>Refreshing...</div>}
    </div>
  );
}
```

## Visual States

### 1. Idle State

- Indicator hidden
- No visual feedback

### 2. Pulling State (< threshold)

- Indicator visible
- Spinner rotates based on pull distance
- Text: "Pull to refresh"
- Opacity increases with pull distance

### 3. Ready to Release State (≥ threshold)

- Indicator fully visible
- Spinner fully rotated
- Text: "Release to refresh"

### 4. Refreshing State

- Indicator visible at fixed position
- Spinner animating continuously
- Text: "Refreshing..."
- Triggers page reload or custom refresh

## Customization

### Styling

The component uses CSS variables from your design system. You can customize the appearance by overriding these classes in your CSS:

```css
/* Indicator container */
.pull-to-refresh-indicator {
  /* Customize position, padding, etc. */
}

/* Spinner circle */
.pull-to-refresh-spinner {
  /* Customize size, color, shadow, etc. */
}

/* Text label */
.pull-to-refresh-text {
  /* Customize font, color, background, etc. */
}
```

### Options Reference

| Option            | Type       | Default                    | Description                                   |
| ----------------- | ---------- | -------------------------- | --------------------------------------------- |
| `threshold`       | `number`   | `80`                       | Minimum pull distance (px) to trigger refresh |
| `maxPullDistance` | `number`   | `120`                      | Maximum pull distance (px)                    |
| `pwaOnly`         | `boolean`  | `true`                     | Only enable on installed PWAs                 |
| `mobileOnly`      | `boolean`  | `true`                     | Only enable on mobile devices                 |
| `onRefresh`       | `function` | `window.location.reload()` | Custom refresh function                       |
| `onPullStart`     | `function` | `undefined`                | Callback when pull starts                     |
| `onPullEnd`       | `function` | `undefined`                | Callback when pull ends                       |

## Testing

### Testing on Desktop (Development)

To test the feature during development, you can temporarily disable the PWA-only and mobile-only checks:

```tsx
<PullToRefresh
  pwaOnly={false} // Disable PWA requirement
  mobileOnly={false} // Disable mobile requirement
>
  {children}
</PullToRefresh>
```

Then use Chrome DevTools:

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Select a mobile device
4. Refresh the page
5. Use mouse to simulate touch gestures

### Testing on Real Device

1. **Build and deploy** your app
2. **Install the PWA** on your mobile device:
   - iOS: Safari → Share → Add to Home Screen
   - Android: Chrome → Menu → Install App
3. **Open the installed app** (not the browser)
4. **Pull down** from the top of any page
5. **Observe** the refresh indicator and behavior

## Browser Compatibility

### Supported

- ✅ iOS Safari (installed PWAs)
- ✅ Android Chrome (installed PWAs)
- ✅ Android Firefox (installed PWAs)
- ✅ Samsung Internet (installed PWAs)

### Not Supported

- ❌ Desktop browsers (by design - mobileOnly: true)
- ❌ In-browser mode (by design - pwaOnly: true)
- ❌ Browsers without touch events

## Performance Considerations

1. **Efficient Event Listeners**: Uses passive: false only when necessary
2. **CSS Transforms**: Uses transform instead of position for smooth 60fps animations
3. **Will-Change Hints**: Optimizes for transform and opacity changes
4. **Debounced Checks**: Device/PWA checks are cached and only re-run on resize
5. **Cleanup**: Properly removes event listeners on unmount

## Troubleshooting

### Pull-to-refresh not working

**Check these in order:**

1. **Is the app installed as a PWA?**
   - Open Chrome DevTools → Application → Manifest
   - Verify "installed" status

2. **Is it on a mobile device?**
   - Desktop browsers won't activate by default
   - Set `mobileOnly: false` for testing

3. **Are you at the top of the page?**
   - Feature only works when `window.scrollY === 0`
   - Scroll to the very top

4. **Is PWA detection working?**
   - Check console for detection logs
   - Verify `window.matchMedia('(display-mode: standalone)').matches`

5. **Are touch events supported?**
   - Some browsers/devices may not support touch events
   - Check `'ontouchstart' in window`

### Indicator not visible

1. Check z-index conflicts (indicator uses `z-index: 9999`)
2. Verify CSS is loaded correctly
3. Check for overflow:hidden on parent elements
4. Inspect element in DevTools while pulling

### Refresh not triggering

1. Check if threshold is too high (try reducing to 60px)
2. Verify touch events are being captured
3. Check console for errors during refresh
4. Test custom refresh function in isolation

## Future Enhancements

Potential improvements for future iterations:

- [ ] Add haptic feedback on iOS
- [ ] Add sound effects option
- [ ] Support for swipe gestures in other directions
- [ ] Cache-first refresh option (check for updates without full reload)
- [ ] Analytics tracking for pull-to-refresh usage
- [ ] A/B testing different thresholds
- [ ] Accessibility announcements for screen readers

## Related Files

- **Hook**: `src/hooks/usePullToRefresh.ts`
- **Component**: `src/components/PullToRefresh.tsx`
- **Styles**: `src/app/globals.css` (search for "Pull-to-Refresh")
- **Layout**: `src/app/layout.tsx`
- **PWA Hook**: `src/hooks/usePWA.ts` (for PWA detection)

## Credits

Inspired by native mobile app pull-to-refresh patterns and designed specifically for PWA experiences.
