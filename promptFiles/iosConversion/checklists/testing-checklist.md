# Testing Checklist

Complete testing checklist for each TestFlight build and before App Store submission.

---

## ✅ Before Every TestFlight Build

### Code Quality

- [ ] All unit tests passing (Cmd+U)
- [ ] No compiler warnings (or all justified)
- [ ] Code reviewed (even if just by you)
- [ ] SwiftLint passing (no errors)
- [ ] No debug print statements left in code
- [ ] No hardcoded values (API keys, user IDs, etc.)

### Build Configuration

- [ ] Built in Release configuration
- [ ] Version number updated (if needed)
- [ ] Build number incremented
- [ ] Code signing working
- [ ] Archive succeeds

---

## ✅ Functional Testing

### Authentication

- [ ] Sign in with email/password
- [ ] Sign up with email/password
- [ ] Sign in with Apple
- [ ] Sign out
- [ ] Face ID/Touch ID (on physical device)
- [ ] Token persistence (stays signed in after app restart)
- [ ] Handle invalid credentials

### Collections

- [ ] View collections list
- [ ] Create collection
- [ ] Edit collection name
- [ ] Delete collection
- [ ] Add restaurant to collection
- [ ] Remove restaurant from collection
- [ ] View collection details

### Restaurant Search

- [ ] Search by query
- [ ] Search by current location
- [ ] Search by manual location
- [ ] View restaurant details
- [ ] Open in Apple Maps
- [ ] Call restaurant
- [ ] Share restaurant

### Groups

- [ ] View groups list
- [ ] Create group
- [ ] Invite members
- [ ] Accept/decline invitations
- [ ] Leave group
- [ ] Admin controls (if admin)

### Decisions

- [ ] Personal random selection
- [ ] Create group decision
- [ ] Tiered voting (drag-and-drop)
- [ ] Submit vote
- [ ] View results
- [ ] View decision history

### Notifications

- [ ] Push notifications received
- [ ] In-app notifications showing
- [ ] Notification tap navigation
- [ ] Settings toggles working

### Offline Mode

- [ ] View collections offline
- [ ] View restaurants offline
- [ ] Create collection offline (syncs when online)
- [ ] Offline indicator shows
- [ ] Auto-sync when connection restored

### Premium Features

- [ ] Purchase subscription (Sandbox)
- [ ] Restore purchases
- [ ] Premium features unlock
- [ ] Free tier limits enforced
- [ ] Paywall shows correctly

---

## ✅ UI/UX Testing

### Visual

- [ ] All screens look good in light mode
- [ ] All screens look good in dark mode
- [ ] No visual glitches or layout issues
- [ ] Images load properly
- [ ] Icons consistent
- [ ] Colors match design system

### Interactions

- [ ] All buttons respond
- [ ] All swipe actions work
- [ ] Drag-and-drop smooth (decisions)
- [ ] Pull-to-refresh works
- [ ] Haptic feedback on interactions
- [ ] Loading states show appropriately
- [ ] Error states show helpful messages

### Navigation

- [ ] Tab bar navigation works
- [ ] Back navigation works
- [ ] Deep links work (from notifications)
- [ ] Sheet/modal presentations smooth
- [ ] Can navigate to all screens

---

## ✅ Device Testing Matrix

**Required Devices** (test on at least 3):

- [ ] iPhone 16 Pro (iOS 26) - Latest, Dynamic Island
- [ ] iPhone SE 3rd gen (iOS 26) - Small screen
- [ ] iPhone 11 (iOS 16) - Minimum supported

**Recommended Devices**:

- [ ] iPhone 15 Pro (iOS 26)
- [ ] iPhone 13 (iOS 25)

**Screen Sizes**:

- [ ] Large (16 Pro Max) - 6.9"
- [ ] Standard (16 Pro) - 6.3"
- [ ] Small (SE) - 4.7"

**iOS Versions**:

- [ ] iOS 26.0 (latest)
- [ ] iOS 25.0
- [ ] iOS 16.0 (minimum)

---

## ✅ Scenario Testing

### Fresh Install

- [ ] First launch experience
- [ ] Onboarding clear
- [ ] Sign up flow smooth
- [ ] Permission requests clear (location, notifications, Face ID)

### Network Conditions

- [ ] WiFi connection
- [ ] Cellular connection
- [ ] Poor network (slow loading)
- [ ] Offline mode (airplane mode)
- [ ] Network transitions (WiFi → Cellular)

### Edge Cases

- [ ] Low battery mode
- [ ] Low storage
- [ ] Interrupted by phone call
- [ ] Backgrounded during critical action
- [ ] Device rotation
- [ ] Split screen (iPad)

### Accessibility

- [ ] VoiceOver enabled (navigate entire app)
- [ ] Dynamic Type (test largest text size)
- [ ] Color contrast (verify WCAG AA)
- [ ] Reduce Motion enabled
- [ ] Increase Contrast enabled

---

## ✅ Integration Testing

### Cross-Platform

- [ ] Create collection on iOS → appears on web
- [ ] Create collection on web → appears on iOS
- [ ] Sign in with Apple on iOS → can sign in on web with same email
- [ ] Premium subscription on iOS → premium on web (and vice versa)
- [ ] Notification settings sync between platforms

### External Services

- [ ] Google Places API working
- [ ] Firebase Analytics logging events
- [ ] Firebase Crashlytics logging crashes (test crash)
- [ ] Push notifications being sent and received
- [ ] Twilio SMS working (if tested)
- [ ] Email notifications working

---

## ✅ Security Testing

**Authentication**:

- [ ] Token expires and refreshes correctly
- [ ] Unauthorized requests fail gracefully
- [ ] Sign out clears all data
- [ ] Keychain storage secure

**Data**:

- [ ] User can only access their own data
- [ ] Group members can only access group data
- [ ] API calls include proper authorization
- [ ] Sensitive data not logged

**IAP**:

- [ ] Receipt validation working
- [ ] Can't fake premium status
- [ ] Restore purchases working

---

## ✅ Performance Testing

**Metrics** (use Instruments):

- [ ] App launch: < 2 seconds (cold start)
- [ ] Screen transitions: < 300ms
- [ ] API responses: < 500ms (cached), < 2s (network)
- [ ] Scrolling: 60 FPS consistently
- [ ] Memory usage: < 150MB typical
- [ ] Battery impact: < 5% per hour active use

**Stress Testing**:

- [ ] 100+ restaurants in collection (performance OK)
- [ ] 10+ groups (loads quickly)
- [ ] 100+ decisions in history (scrolls smoothly)
- [ ] Large images load without issues

---

## ✅ App Store Guidelines Compliance

**Required Elements**:

- [ ] Sign in with Apple present (if offering social/third-party login) ✅
- [ ] Privacy Policy accessible
- [ ] Terms of Service accessible
- [ ] Support contact information
- [ ] Age-appropriate content

**Prohibited**:

- [ ] No references to other mobile platforms ("Download on Android")
- [ ] No external payment links (use IAP only)
- [ ] No misleading information
- [ ] No "Coming Soon" features listed as available

---

## ✅ Final Pre-Submission

**Last Checks**:

- [ ] Test demo account yourself (sign in, use features)
- [ ] Verify all URLs work (Privacy, Support, Marketing)
- [ ] Check screenshots match current app UI
- [ ] Review description for accuracy
- [ ] Version and build numbers correct
- [ ] Remove all test data from production database
- [ ] API keys secure (not committed to git)

**Team Communication**:

- [ ] Stakeholders notified of submission
- [ ] Support team prepared for user questions
- [ ] Monitoring set up and tested

---

## 🚀 Ready to Submit!

**If all checkboxes above are checked:**

1. Archive your app (Product → Archive)
2. Validate archive
3. Distribute to App Store
4. Add build to version in App Store Connect
5. Complete all metadata
6. Submit for Review

**Expected Timeline**:

- Upload: 5-15 minutes
- Processing: 10-30 minutes
- Review: 1-3 days (typically 24-48 hours)

---

## 📋 Post-Submission Monitoring

**First 24 Hours After Launch**:

- [ ] Monitor Crashlytics (crash-free rate should stay > 99.5%)
- [ ] Check Firebase Analytics (user sessions, feature usage)
- [ ] Read first reviews (respond to negative ones)
- [ ] Verify IAP purchases working in production
- [ ] Check server load (mobile API on Render)

**First Week**:

- [ ] Respond to all reviews
- [ ] Track key metrics (downloads, retention, crashes)
- [ ] Gather user feedback
- [ ] Start planning v1.1 updates

---

**Use this checklist before every build! Quality matters! ✅**
