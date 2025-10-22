# Per-Epic Completion Checklists

Quick reference checklists for marking epic completion. Check all boxes before moving to next epic.

---

## Epic 1: Foundation ✅

- [ ] Xcode project created and building
- [ ] Firebase integrated (Analytics, Crashlytics, Messaging)
- [ ] Design system implemented (colors, typography, components)
- [ ] Core services implemented (API, Keychain, Network Monitor)
- [ ] Mobile API deployed on Render
- [ ] Core Data configured
- [ ] Can run on simulator and physical device
- [ ] Unit tests for core services (70%+ coverage)

**Epic 1 must be 100% complete before starting Epic 2!**

---

## Epic 2: Authentication ✅

- [ ] Clerk iOS SDK integrated
- [ ] Email/password sign in working
- [ ] Email/password sign up working
- [ ] Sign in with Apple implemented (REQUIRED!)
- [ ] Biometric auth (Face ID/Touch ID) working
- [ ] Token persistence (stays signed in)
- [ ] Sign out working
- [ ] Profile view displaying user data
- [ ] Cross-platform auth verified (same account works on web + iOS)
- [ ] Unit tests for AuthViewModel
- [ ] UI tests for sign in/sign up flows

**Epic 2 must be complete before starting Epic 3!**

---

## Epic 3: Collections & Restaurant Search ✅

- [ ] Collections list displaying
- [ ] Can create collection
- [ ] Can edit collection
- [ ] Can delete collection
- [ ] Restaurant search working (Google Places)
- [ ] Location permission handled
- [ ] Restaurant details showing
- [ ] Can add restaurant to collection
- [ ] Can remove restaurant from collection
- [ ] Random selection from collection working
- [ ] Decision history tracked
- [ ] Offline mode working (cached collections)
- [ ] Unit tests for Collections + Restaurants ViewModels
- [ ] UI tests for search and add flow

**Epic 3 must be complete before starting Epic 4!**

---

## Epic 4: Groups & Friend Management ✅

- [ ] Groups list displaying
- [ ] Can create group
- [ ] Can edit group details
- [ ] Can invite members by email
- [ ] Can remove members (admin only)
- [ ] Can leave group
- [ ] Group collections working
- [ ] Members can collaborate on collections
- [ ] Friend requests working (optional)
- [ ] Group invitations handled
- [ ] Unit tests for GroupsViewModel
- [ ] Integration tests for group operations

**Epic 4 must be complete before starting Epic 5!**

---

## Epic 5: Decision Making & Voting ✅

- [ ] Personal random selection working
- [ ] 30-day weighting algorithm implemented
- [ ] Group decision creation working
- [ ] Tiered voting (drag-and-drop ranking) working
- [ ] Can submit vote
- [ ] Vote status updates
- [ ] Group random selection working
- [ ] Decision results displayed beautifully
- [ ] Decision history accessible
- [ ] Can filter/search history
- [ ] Unit tests for decision algorithms
- [ ] UI tests for voting flow

---

## Epic 6: Notifications & Communication ✅

- [ ] Firebase Cloud Messaging configured
- [ ] APNs key uploaded to Firebase
- [ ] Push notifications working on device
- [ ] In-app notifications displaying
- [ ] Notification settings working
- [ ] Can enable/disable notification channels
- [ ] Notification tap navigation working
- [ ] Deep links functional
- [ ] Rich notifications with images
- [ ] Notification actions working
- [ ] Settings sync with web app
- [ ] Tested on physical device (required!)

---

## Epic 7: Offline Support & Polish ✅

- [ ] Offline sync implemented
- [ ] Auto-sync when connection restored
- [ ] Offline queue working
- [ ] Image caching optimized
- [ ] Performance targets met (60 FPS, < 2s launch)
- [ ] Loading skeletons added
- [ ] Empty states polished
- [ ] Haptic feedback everywhere
- [ ] Error handling comprehensive
- [ ] Accessibility verified (VoiceOver, Dynamic Type)
- [ ] No memory leaks
- [ ] Battery impact minimal

---

## Epic 8: iOS-Specific Features ✅

- [ ] Home Screen widgets working (Collection + Decision widgets)
- [ ] Siri Shortcuts integrated
- [ ] Spotlight Search indexing
- [ ] Live Activities implemented (Dynamic Island)
- [ ] Share Sheet integration
- [ ] Maps integration (open in Apple Maps)
- [ ] Contact integration (optional)
- [ ] All features tested on device
- [ ] Widgets tested in all sizes

**Note**: This epic can be done in parallel with Epics 9-10 if timeline is tight.

---

## Epic 9: Monetization & IAP ✅

- [ ] In-App Purchases configured in App Store Connect
- [ ] StoreKit 2 integrated
- [ ] Can purchase monthly subscription
- [ ] Can purchase yearly subscription
- [ ] Can restore purchases
- [ ] Premium status syncs with backend
- [ ] Feature limits enforced (collections, groups, history)
- [ ] Paywall shows at correct times
- [ ] Ads implemented for free tier (non-intrusive)
- [ ] Ads hidden for premium users
- [ ] Tested in Sandbox environment

---

## Epic 10: Testing & QA ✅

- [ ] 80%+ unit test coverage
- [ ] All critical paths integration tested
- [ ] UI tests for main flows
- [ ] Tested on 5+ devices
- [ ] Tested on iOS 16, 25, 26
- [ ] Performance profiled (no leaks, meets targets)
- [ ] TestFlight build deployed
- [ ] 5-10 beta testers recruited
- [ ] Feedback collected and addressed
- [ ] Crash-free rate > 99.5%
- [ ] Critical bugs fixed
- [ ] High-priority bugs fixed

**Epic 10 must be complete before Epic 11!**

---

## Epic 11: App Store Submission ✅

- [ ] App icon finalized (1024x1024)
- [ ] Screenshots taken (all required sizes)
- [ ] App description written
- [ ] Keywords optimized
- [ ] Privacy Policy updated and accessible
- [ ] App Privacy questionnaire completed
- [ ] Demo account created and tested
- [ ] App Review notes written
- [ ] All metadata in App Store Connect
- [ ] Final build uploaded
- [ ] Build processing complete
- [ ] Submitted for review
- [ ] **Status: "Waiting for Review" or "In Review"**

---

## 🎯 Final Launch Checklist

**After Approval**:

- [ ] Status changed to "Pending Developer Release" or "Ready for Sale"
- [ ] Monitoring prepared (Firebase, Crashlytics)
- [ ] Support email ready
- [ ] Launch announcement prepared
- [ ] App released (automatic or manual)
- [ ] **APP IS LIVE! 🎉**

---

**Use these checklists to track your progress through each epic! ✅**
