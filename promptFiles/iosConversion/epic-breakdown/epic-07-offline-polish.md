# Epic 7: Offline Support & Polish

**Goal**: Implement robust offline functionality, optimize performance, and polish UX

**Duration**: 1-2 weeks (aggressive: 5-7 days)
**Priority**: 🟡 Medium
**Dependencies**: Epic 3 (Collections), Epic 4 (Groups), Epic 5 (Decisions)

---

## 📖 Stories

### Story 7.1: Offline Data Sync

**Estimated Time**: 8-10 hours

**Tasks**:

- [ ] Implement SyncManager (from agent guide 06)

  - Monitor network connectivity
  - Auto-sync when connection restored
  - Handle conflicts (last-write-wins)

- [ ] Implement offline queue

  - Queue operations when offline (create collection, add restaurant)
  - Process queue when back online
  - Show sync status indicator

- [ ] Add offline indicators

  - Banner at top ("You're offline")
  - Sync status in profile ("Last synced: 5 min ago")
  - Visual cues on cached data

- [ ] Test offline scenarios
  - Create collection offline → sync when online
  - View cached data offline
  - Airplane mode testing

**Deliverables**:

- ✅ Auto-sync when connection restored
- ✅ Offline queue working
- ✅ Sync status visible to user
- ✅ Handles conflicts gracefully
- ✅ Works smoothly offline

---

### Story 7.2: Image Caching Optimization

**Estimated Time**: 4-6 hours
**🔄 Can work in parallel with Story 7.3**

**Tasks**:

- [ ] Integrate SDWebImage or Kingfisher

  - Add via SPM
  - Configure cache limits (50MB memory, 200MB disk)
  - Set cache expiration (30 days)

- [ ] Replace AsyncImage with cached version

  - Create CachedAsyncImage component
  - Automatic caching
  - Placeholder while loading
  - Error state

- [ ] Pre-cache important images
  - Restaurant photos in collections
  - User profile pictures
  - Cache in background

**Deliverables**:

- ✅ All images cached automatically
- ✅ Images load instantly when cached
- ✅ Cache size managed (doesn't grow infinitely)
- ✅ Images available offline

---

### Story 7.3: Performance Optimization

**Estimated Time**: 6-8 hours
**🔄 Can work in parallel with Story 7.2**

**Tasks**:

- [ ] Optimize list rendering

  - Use LazyVStack/LazyHStack
  - Implement pagination (load more)
  - Reduce re-renders

- [ ] Optimize API calls

  - Implement request deduplication
  - Add caching layer (5-minute TTL)
  - Batch requests where possible

- [ ] Optimize animations

  - Use .animation() modifier carefully
  - Reduce shadow complexity if laggy
  - Test on older devices (iPhone 11)

- [ ] Memory optimization

  - Profile memory usage (Instruments)
  - Fix any retain cycles
  - Optimize image loading

- [ ] Battery optimization
  - Reduce background polling
  - Use efficient APIs
  - Profile battery impact

**Deliverables**:

- ✅ Scrolling smooth (60 FPS)
- ✅ App launch < 2 seconds
- ✅ Memory usage reasonable (< 150MB)
- ✅ Battery impact low (< 5% per hour active use)
- ✅ No retain cycles or leaks

---

### Story 7.4: UX Polish

**Estimated Time**: 6-8 hours

**Tasks**:

- [ ] Add loading skeletons

  - Shimmer effect while loading lists
  - Better than spinners for perceived performance

- [ ] Improve empty states

  - All views have custom empty states
  - Helpful messages
  - Clear call-to-action

- [ ] Add haptic feedback everywhere

  - Button taps (light haptic)
  - Success actions (success haptic)
  - Errors (error haptic)
  - List selections (selection haptic)

- [ ] Smooth transitions

  - Between screens
  - Sheet presentations
  - List updates

- [ ] Accessibility improvements
  - VoiceOver labels
  - Dynamic Type support
  - Color contrast verification
  - Accessibility identifiers for testing

**Deliverables**:

- ✅ Loading states beautiful
- ✅ Empty states helpful
- ✅ Haptics feel natural
- ✅ Transitions smooth
- ✅ Accessible to all users

---

### Story 7.5: Error Handling & Recovery

**Estimated Time**: 4-6 hours

**Tasks**:

- [ ] Implement global error handling

  - User-friendly error messages
  - Automatic retry for network errors
  - Error logging to Firebase Crashlytics

- [ ] Add error recovery

  - Retry buttons on errors
  - Fallback to offline data
  - Clear error messaging

- [ ] Handle edge cases
  - Token expiration → Auto sign-out
  - 404 errors → Show not found
  - 500 errors → "Try again later"
  - Network timeout → "Check connection"

**Deliverables**:

- ✅ All errors handled gracefully
- ✅ User always knows what to do
- ✅ Auto-recovery where possible
- ✅ Errors logged for debugging

---

## 🔄 Parallel Work Groups

**Week 1**:

- Day 1-4: Story 7.1 (Offline Sync) - Must be first
- Day 5-7: Stories 7.2 + 7.3 in parallel (Image Caching + Performance)

**Week 2**:

- Day 1-3: Story 7.4 (UX Polish)
- Day 4-5: Story 7.5 (Error Handling)
- Day 6-7: Final testing and optimization

---

## ✅ Epic Completion Checklist

**Offline Functionality**:

- [ ] View collections offline
- [ ] View restaurants offline
- [ ] View groups offline
- [ ] View decision history offline
- [ ] Create collections offline (queues for sync)
- [ ] Auto-sync when online
- [ ] Offline indicators present

**Performance**:

- [ ] App launch < 2 seconds
- [ ] Scrolling at 60 FPS
- [ ] Images load quickly (cached)
- [ ] API responses < 500ms (cached)
- [ ] Memory usage < 150MB
- [ ] No memory leaks

**UX Polish**:

- [ ] Loading skeletons on all lists
- [ ] Empty states on all views
- [ ] Haptic feedback on all interactions
- [ ] Smooth transitions
- [ ] Accessible (VoiceOver, Dynamic Type)

**Error Handling**:

- [ ] All errors have user-friendly messages
- [ ] Retry functionality where appropriate
- [ ] Fallback to offline data
- [ ] Errors logged to Crashlytics

---

## 📊 Success Metrics

**Performance Targets**:

- App launch: < 2 seconds (cold start)
- List scrolling: 60 FPS
- API response: < 500ms (cached), < 2s (fresh)
- Image loading: < 100ms (cached), < 2s (network)
- Memory usage: < 150MB typical
- Battery impact: < 5% per hour

**User Experience**:

- Offline functionality works seamlessly
- No jarring loading states
- Errors are helpful, not scary
- Accessibility score > 95%

---

## 🧪 Testing Requirements

**Performance Tests**:

- [ ] Profile app with Instruments (Time Profiler)
- [ ] Check memory usage (Leaks instrument)
- [ ] Measure battery impact
- [ ] Test on iPhone 11 (oldest supported)

**Offline Tests**:

- [ ] Enable airplane mode, use app
- [ ] Create collection offline, sync when online
- [ ] Verify data persists across launches
- [ ] Test conflict resolution

**UX Tests**:

- [ ] Test all empty states
- [ ] Test all error states
- [ ] Test with VoiceOver enabled
- [ ] Test with largest Dynamic Type size

---

**Next**: [Epic 8: iOS-Specific Features](./epic-08-ios-features.md)

**Polish makes good apps great! 💎**
