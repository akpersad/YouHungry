# Epic 6: Notifications & Communication

**Goal**: Implement Firebase Cloud Messaging, in-app notifications, and multi-channel notification system

**Duration**: 1-2 weeks (aggressive: 5-7 days)
**Priority**: 🟡 Medium
**Dependencies**: Epic 2 (Auth), Epic 5 (Decisions)

---

## 📖 Stories

### Story 6.1: Firebase Cloud Messaging (FCM) Setup

**Estimated Time**: 6-8 hours

**Tasks**:

- [ ] Configure APNs in Apple Developer Portal

  - Create APNs Authentication Key (.p8 file)
  - Note Key ID and Team ID
  - Download and save securely

- [ ] Upload APNs key to Firebase

  - Firebase Console → Project Settings → Cloud Messaging
  - Upload .p8 file with Key ID and Team ID

- [ ] Configure AppDelegate for FCM

  - Implement UNUserNotificationCenterDelegate
  - Implement MessagingDelegate
  - Handle FCM token registration
  - Handle remote notification events

- [ ] Implement NotificationService

  - Register device with FCM token
  - Send token to mobile API backend
  - Handle permission requests

- [ ] Test push notifications
  - Send test notification from Firebase Console
  - Verify received on device
  - Test tap action

**Deliverables**:

- ✅ APNs configured
- ✅ FCM receiving notifications
- ✅ Device token registered with backend
- ✅ Test notification received on device

**Code Example**:

```swift
// App/AppDelegate.swift (see agent guide 07 for full implementation)
class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        Messaging.messaging().delegate = self
        UNUserNotificationCenter.current().delegate = self
        application.registerForRemoteNotifications()
        return true
    }

    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken else { return }
        Task {
            await NotificationService.shared.registerDevice(fcmToken: token)
        }
    }
}
```

---

### Story 6.2: In-App Notifications

**Estimated Time**: 6-8 hours
**🔄 Can work in parallel with Story 6.3**

**Tasks**:

- [ ] Implement InAppNotificationService

  - Fetch notifications from API
  - Poll every 5 minutes
  - Mark as read
  - Mark all as read

- [ ] Create NotificationsView

  - List of notifications
  - Unread badge
  - Notification icons by type
  - Swipe to delete
  - Mark all read button

- [ ] Create NotificationRow component

  - Icon based on type
  - Title and message
  - Relative time ("5 minutes ago")
  - Unread indicator (blue dot)
  - Tap to navigate

- [ ] Add notification bell to tab bar
  - Badge count for unread
  - Navigate to NotificationsView

**Deliverables**:

- ✅ In-app notifications displaying
- ✅ Unread count badge working
- ✅ Can mark as read
- ✅ Tap to navigate to relevant screen
- ✅ Polls for new notifications

---

### Story 6.3: Notification Settings

**Estimated Time**: 4-5 hours
**🔄 Can work in parallel with Story 6.2**

**Tasks**:

- [ ] Create NotificationSettingsView

  - Toggle for push notifications
  - Toggle for email notifications
  - Toggle for SMS notifications
  - Group decision toggles (started, completed)
  - Friend request toggle
  - Group invitation toggle

- [ ] Implement NotificationSettingsViewModel

  - Load current settings from API
  - Update settings on toggle
  - Save to backend (syncs with web)

- [ ] Link from ProfileView
  - "Notification Settings" row
  - Navigate to settings view

**Deliverables**:

- ✅ Notification settings accessible
- ✅ Toggles save to backend
- ✅ Settings sync with web app
- ✅ Changes take effect immediately

---

### Story 6.4: Notification Routing & Deep Links

**Estimated Time**: 6-8 hours

**Tasks**:

- [ ] Implement notification tap handling

  - Parse notification data
  - Determine destination (decision, group, friend request)
  - Navigate to appropriate screen

- [ ] Create navigation coordinator

  - Deep link router
  - Handle URL schemes (forkintheroad://decision/123)
  - Navigate from any screen state

- [ ] Test all notification types
  - Group decision started → Navigate to voting screen
  - Decision completed → Navigate to result
  - Friend request → Navigate to friends
  - Group invitation → Navigate to group detail

**Deliverables**:

- ✅ Tapping notification opens correct screen
- ✅ Deep linking working
- ✅ Works from any app state (foreground, background, killed)
- ✅ Handles invalid/expired links gracefully

**Code Example**:

```swift
// Core/Navigation/DeepLinkHandler.swift
@MainActor
class DeepLinkHandler: ObservableObject {
    @Published var activeLink: DeepLink?

    enum DeepLink: Hashable {
        case decision(id: String)
        case group(id: String)
        case friendRequests
        case profile
    }

    func handle(_ userInfo: [AnyHashable: Any]) {
        guard let type = userInfo["type"] as? String else { return }

        switch type {
        case "group_decision":
            if let decisionId = userInfo["decisionId"] as? String {
                activeLink = .decision(id: decisionId)
            }
        case "group_invitation":
            if let groupId = userInfo["groupId"] as? String {
                activeLink = .group(id: groupId)
            }
        case "friend_request":
            activeLink = .friendRequests
        default:
            break
        }
    }
}

// In RootView
struct RootView: View {
    @StateObject private var deepLinkHandler = DeepLinkHandler()

    var body: some View {
        MainTabView()
            .sheet(item: $deepLinkHandler.activeLink) { link in
                NavigationStack {
                    destinationView(for: link)
                }
            }
            .onReceive(NotificationCenter.default.publisher(for: .didReceiveNotification)) { notification in
                if let userInfo = notification.userInfo as? [AnyHashable: Any] {
                    deepLinkHandler.handle(userInfo)
                }
            }
    }

    @ViewBuilder
    private func destinationView(for link: DeepLink) -> some View {
        switch link {
        case .decision(let id):
            DecisionDetailView(decisionId: id)
        case .group(let id):
            GroupDetailView(groupId: id)
        case .friendRequests:
            FriendsView()
        case .profile:
            ProfileView()
        }
    }
}
```

---

### Story 6.5: Rich Notifications

**Estimated Time**: 4-6 hours

**Tasks**:

- [ ] Add images to notifications

  - Restaurant photo in decision notifications
  - User profile pictures in friend requests

- [ ] Add notification actions

  - "Vote Now" button on decision notifications
  - "Accept" / "Decline" on friend requests
  - Handle action responses

- [ ] Implement notification categories
  - Define action categories in AppDelegate
  - Handle action identifiers

**Deliverables**:

- ✅ Notifications show images
- ✅ Action buttons working
- ✅ Rich media displays properly
- ✅ Actions trigger correct behavior

---

## 🔄 Parallel Work Groups

**Week 1**:

- Day 1-3: Story 6.1 (FCM Setup) - Must be first
- Day 4-7: Stories 6.2 + 6.3 in parallel (In-App + Settings)

**Week 2**:

- Day 1-4: Stories 6.4 + 6.5 in parallel (Routing + Rich Notifications)
- Day 5-7: Testing, polish

---

## ✅ Epic Completion Checklist

**Push Notifications**:

- [ ] FCM configured with APNs
- [ ] Device registration working
- [ ] Receive notifications (foreground)
- [ ] Receive notifications (background)
- [ ] Receive notifications (app killed)
- [ ] Notification tap navigation working

**In-App Notifications**:

- [ ] Notifications list displaying
- [ ] Unread count badge
- [ ] Mark as read
- [ ] Poll for new notifications
- [ ] Navigate from notification

**Settings**:

- [ ] Notification preferences accessible
- [ ] Can enable/disable channels (Push, Email, SMS)
- [ ] Can configure notification types
- [ ] Settings sync with web app

**Rich Notifications**:

- [ ] Images display in notifications
- [ ] Action buttons working
- [ ] Deep links functional

**Testing**:

- [ ] Unit tests for notification service
- [ ] Test all notification types
- [ ] Test on physical device (REQUIRED!)
- [ ] Test notification actions
- [ ] Test permission flows

---

## 🐛 Common Issues

**Issue**: "Not receiving push notifications"

- **Solution**: Must test on physical device, not simulator. Check APNs key in Firebase.

**Issue**: "FCM token not registering"

- **Solution**: Verify APNs entitlement in Xcode, check Info.plist for privacy string.

**Issue**: "Notification tap doesn't navigate"

- **Solution**: Check deep link handler, ensure notification data includes correct keys.

---

**Next**: [Epic 7: Offline Support & Polish](./epic-07-offline-polish.md)

**Notifications keep users engaged! 🔔**
