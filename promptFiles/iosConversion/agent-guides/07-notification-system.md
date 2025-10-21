# Notification System Guide

Complete guide to implementing multi-channel notifications in the iOS app.

---

## 🎯 Notification Architecture

**Multi-Channel Strategy** (same as web app):

- 🔔 **Push Notifications** (APNs via Firebase Cloud Messaging) - PRIMARY
- 📧 **Email** (Resend API) - Backup channel
- 📱 **SMS** (Twilio) - Backup channel
- 📬 **In-App** (Database + polling) - Always available

**User has control**: Can enable/disable each channel in settings

---

## 🔥 Firebase Cloud Messaging Setup

### Installation

```swift
// Package.swift dependencies
dependencies: [
    .package(url: "https://github.com/firebase/firebase-ios-sdk", from: "11.0.0")
]

// In target dependencies
.product(name: "FirebaseMessaging", package: "firebase-ios-sdk"),
.product(name: "FirebaseAnalytics", package: "firebase-ios-sdk"),
.product(name: "FirebaseCrashlytics", package: "firebase-ios-sdk")
```

### Configuration

```swift
// App/ForkInTheRoadApp.swift
import SwiftUI
import Firebase

@main
struct ForkInTheRoadApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate

    init() {
        // Configure Firebase
        FirebaseApp.configure()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}

// App/AppDelegate.swift
import UIKit
import Firebase
import FirebaseMessaging
import UserNotifications

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
    ) -> Bool {
        // Configure Firebase (done in App init)

        // Set FCM delegate
        Messaging.messaging().delegate = self

        // Set UNUserNotificationCenter delegate
        UNUserNotificationCenter.current().delegate = self

        // Request notification permission
        registerForNotifications()

        // Register for remote notifications
        application.registerForRemoteNotifications()

        return true
    }

    // MARK: - Notification Registration

    private func registerForNotifications() {
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .badge, .sound]
        ) { granted, error in
            if granted {
                print("Notification permission granted")
            } else if let error = error {
                print("Notification permission error: \(error)")
            }
        }
    }

    // MARK: - APNs Token

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        // Pass device token to FCM
        Messaging.messaging().apnsToken = deviceToken

        print("APNs token registered")
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("Failed to register for remote notifications: \(error)")
    }

    // MARK: - FCM Token

    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let fcmToken = fcmToken else { return }

        print("FCM token: \(fcmToken)")

        // Send to backend
        Task {
            await NotificationService.shared.registerDevice(fcmToken: fcmToken)
        }
    }

    // MARK: - Handle Notifications

    // Foreground notification
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }

    // User tapped notification
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo

        // Handle notification tap
        handleNotificationTap(userInfo: userInfo)

        completionHandler()
    }

    private func handleNotificationTap(userInfo: [AnyHashable: Any]) {
        // Parse notification data
        guard let notificationType = userInfo["type"] as? String else {
            return
        }

        // Route to appropriate screen
        switch notificationType {
        case "group_decision":
            if let decisionId = userInfo["decisionId"] as? String {
                // Navigate to decision screen
                NotificationCenter.default.post(
                    name: .navigateToDecision,
                    object: nil,
                    userInfo: ["decisionId": decisionId]
                )
            }

        case "friend_request":
            // Navigate to friends screen
            NotificationCenter.default.post(name: .navigateToFriends, object: nil)

        case "group_invitation":
            if let groupId = userInfo["groupId"] as? String {
                // Navigate to group invitation screen
                NotificationCenter.default.post(
                    name: .navigateToGroup,
                    object: nil,
                    userInfo: ["groupId": groupId]
                )
            }

        default:
            break
        }
    }
}

// Notification names
extension Notification.Name {
    static let navigateToDecision = Notification.Name("navigateToDecision")
    static let navigateToFriends = Notification.Name("navigateToFriends")
    static let navigateToGroup = Notification.Name("navigateToGroup")
}
```

---

## 📬 NotificationService

### Complete Notification Management

```swift
// Services/Notifications/NotificationService.swift
import Foundation
import FirebaseMessaging
import UserNotifications

@MainActor
class NotificationService: ObservableObject {
    static let shared = NotificationService()

    @Published var permissionGranted = false
    @Published var fcmToken: String?

    private let api = APIService.shared

    // MARK: - Request Permission

    func requestPermission() async {
        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(
                options: [.alert, .badge, .sound]
            )
            permissionGranted = granted

            if granted {
                await registerForRemoteNotifications()
            }
        } catch {
            print("Permission request error: \(error)")
        }
    }

    @MainActor
    private func registerForRemoteNotifications() async {
        await UIApplication.shared.registerForRemoteNotifications()
    }

    // MARK: - Register Device

    func registerDevice(fcmToken: String) async {
        self.fcmToken = fcmToken

        // Send to backend
        do {
            struct RegisterDeviceRequest: Encodable {
                let fcmToken: String
                let platform: String = "ios"
            }

            let _: EmptyResponse = try await api.post(
                .registerDevice,
                body: RegisterDeviceRequest(fcmToken: fcmToken)
            )

            print("Device registered for push notifications")
        } catch {
            print("Failed to register device: \(error)")
        }
    }

    // MARK: - Unregister Device

    func unregisterDevice() async {
        guard let fcmToken = fcmToken else { return }

        do {
            struct UnregisterDeviceRequest: Encodable {
                let fcmToken: String
            }

            let _: EmptyResponse = try await api.post(
                .unregisterDevice,
                body: UnregisterDeviceRequest(fcmToken: fcmToken)
            )

            self.fcmToken = nil
        } catch {
            print("Failed to unregister device: \(error)")
        }
    }

    // MARK: - Subscribe to Topics

    func subscribeToGroup(groupId: String) {
        Messaging.messaging().subscribe(toTopic: "group_\(groupId)") { error in
            if let error = error {
                print("Failed to subscribe to group: \(error)")
            }
        }
    }

    func unsubscribeFromGroup(groupId: String) {
        Messaging.messaging().unsubscribe(fromTopic: "group_\(groupId)") { error in
            if let error = error {
                print("Failed to unsubscribe from group: \(error)")
            }
        }
    }
}
```

---

## 🎯 Notification Types

### Group Decision Notifications

**Backend sends**:

```json
{
  "notification": {
    "title": "New Group Decision",
    "body": "Vote on where to eat for Dinner Tonight!"
  },
  "data": {
    "type": "group_decision",
    "decisionId": "abc123",
    "groupId": "group456",
    "groupName": "Dinner Crew"
  }
}
```

**iOS handles**:

```swift
// When user taps notification
private func handleGroupDecisionNotification(decisionId: String, groupId: String) {
    // Navigate to decision voting screen
    NotificationCenter.default.post(
        name: .navigateToDecision,
        object: nil,
        userInfo: ["decisionId": decisionId, "groupId": groupId]
    )
}
```

### Deep Linking from Notifications

```swift
// App/RootView.swift
struct RootView: View {
    @State private var navigationPath = NavigationPath()

    var body: some View {
        NavigationStack(path: $navigationPath) {
            MainTabView()
                .navigationDestination(for: String.self) { route in
                    handleRoute(route)
                }
        }
        .onReceive(NotificationCenter.default.publisher(for: .navigateToDecision)) { notification in
            if let decisionId = notification.userInfo?["decisionId"] as? String {
                navigationPath.append("decision/\(decisionId)")
            }
        }
    }

    @ViewBuilder
    private func handleRoute(_ route: String) -> some View {
        if route.starts(with: "decision/") {
            let id = String(route.dropFirst("decision/".count))
            DecisionDetailView(decisionId: id)
        } else {
            Text("Unknown route")
        }
    }
}
```

---

## 📨 In-App Notifications

### Polling for In-App Notifications

```swift
// Services/Notifications/InAppNotificationService.swift
import Foundation
import Combine

@MainActor
class InAppNotificationService: ObservableObject {
    static let shared = InAppNotificationService()

    @Published var notifications: [AppNotification] = []
    @Published var unreadCount = 0

    private let api = APIService.shared
    private var timer: Timer?
    private var cancellables = Set<AnyCancellable>()

    init() {
        startPolling()
    }

    func startPolling() {
        // Poll every 5 minutes
        timer = Timer.scheduledTimer(withTimeInterval: 300, repeats: true) { [weak self] _ in
            Task {
                await self?.fetchNotifications()
            }
        }

        // Fetch immediately
        Task {
            await fetchNotifications()
        }
    }

    func stopPolling() {
        timer?.invalidate()
        timer = nil
    }

    func fetchNotifications() async {
        do {
            let response: NotificationsResponse = try await api.get(.notifications)
            notifications = response.notifications
            unreadCount = notifications.filter { !$0.read }.count
        } catch {
            print("Fetch notifications error: \(error)")
        }
    }

    func markAsRead(id: String) async {
        // Optimistic update
        if let index = notifications.firstIndex(where: { $0.id == id }) {
            notifications[index].read = true
            unreadCount = notifications.filter { !$0.read }.count
        }

        do {
            let _: EmptyResponse = try await api.put(.markNotificationRead(id: id), body: EmptyRequest())
        } catch {
            print("Mark as read error: \(error)")
        }
    }

    func markAllAsRead() async {
        // Optimistic update
        notifications = notifications.map { notification in
            var updated = notification
            updated.read = true
            return updated
        }
        unreadCount = 0

        do {
            let _: EmptyResponse = try await api.post(.markAllNotificationsRead, body: EmptyRequest())
        } catch {
            print("Mark all as read error: \(error)")
        }
    }
}

struct NotificationsResponse: Decodable {
    let notifications: [AppNotification]
}
```

---

## 🎨 Notification UI

### Notifications View

```swift
// Features/Profile/Views/NotificationsView.swift
import SwiftUI

struct NotificationsView: View {
    @StateObject private var service = InAppNotificationService.shared

    var body: some View {
        List {
            if service.notifications.isEmpty {
                EmptyStateView(
                    icon: "bell.slash",
                    title: "No Notifications",
                    message: "You're all caught up!"
                )
            } else {
                ForEach(service.notifications) { notification in
                    NotificationRow(notification: notification)
                        .onTapGesture {
                            Task {
                                await service.markAsRead(id: notification.id)
                                handleNotificationTap(notification)
                            }
                        }
                }
            }
        }
        .navigationTitle("Notifications")
        .toolbar {
            if service.unreadCount > 0 {
                ToolbarItem(placement: .primaryAction) {
                    Button("Mark All Read") {
                        Task {
                            await service.markAllAsRead()
                        }
                    }
                }
            }
        }
        .task {
            await service.fetchNotifications()
        }
        .refreshable {
            await service.fetchNotifications()
        }
    }

    private func handleNotificationTap(_ notification: AppNotification) {
        // Handle based on notification type
        switch notification.type {
        case .groupDecision:
            if let decisionId = notification.data?["decisionId"] {
                // Navigate to decision
            }
        case .friendRequest:
            // Navigate to friends
            break
        case .groupInvitation:
            // Navigate to groups
            break
        default:
            break
        }
    }
}

struct NotificationRow: View {
    let notification: AppNotification

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Icon
            Image(systemName: notification.type.icon)
                .font(.title2)
                .foregroundColor(notification.read ? .secondary : .accentColor)
                .frame(width: 40, height: 40)
                .background(
                    Circle()
                        .fill(Color.accentColor.opacity(0.1))
                )

            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(notification.title)
                    .font(.headline)
                    .fontWeight(notification.read ? .regular : .semibold)

                Text(notification.message)
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Text(notification.displayTime)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Unread indicator
            if !notification.read {
                Circle()
                    .fill(Color.accentColor)
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.vertical, 8)
        .background(notification.read ? Color.clear : Color.accentColor.opacity(0.05))
    }
}
```

---

## 🔔 Local Notifications

### Schedule Local Notifications

```swift
// Services/Notifications/LocalNotificationService.swift
import UserNotifications

class LocalNotificationService {
    static let shared = LocalNotificationService()

    func scheduleDecisionReminder(decision: Decision) {
        let content = UNMutableNotificationContent()
        content.title = "Decision Deadline Approaching"
        content.body = "Vote on '\(decision.groupName ?? "group decision")' before \(decision.deadline.formatted())"
        content.sound = .default
        content.badge = 1
        content.userInfo = [
            "type": "decision_reminder",
            "decisionId": decision.id
        ]

        // Schedule 1 hour before deadline
        let triggerDate = Calendar.current.date(
            byAdding: .hour,
            value: -1,
            to: decision.deadline
        ) ?? decision.deadline

        let components = Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute],
            from: triggerDate
        )
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)

        let request = UNNotificationRequest(
            identifier: "decision_\(decision.id)",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Schedule notification error: \(error)")
            }
        }
    }

    func cancelDecisionReminder(decisionId: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: ["decision_\(decisionId)"]
        )
    }
}
```

---

## ⚙️ Notification Settings

### User Preferences

```swift
// Features/Profile/Views/NotificationSettingsView.swift
import SwiftUI

struct NotificationSettingsView: View {
    @StateObject private var viewModel = NotificationSettingsViewModel()

    var body: some View {
        Form {
            Section("Push Notifications") {
                Toggle("Enable Push", isOn: $viewModel.pushEnabled)
                    .onChange(of: viewModel.pushEnabled) { _, newValue in
                        Task {
                            await viewModel.updateSettings()
                        }
                    }

                if !viewModel.pushEnabled {
                    Text("Go to Settings to enable")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Section("Group Decisions") {
                Toggle("Decision Started", isOn: $viewModel.groupDecisionStarted)
                Toggle("Decision Completed", isOn: $viewModel.groupDecisionCompleted)
            }
            .onChange(of: viewModel.groupDecisionStarted) { _, _ in
                Task { await viewModel.updateSettings() }
            }
            .onChange(of: viewModel.groupDecisionCompleted) { _, _ in
                Task { await viewModel.updateSettings() }
            }

            Section("Other Notifications") {
                Toggle("Friend Requests", isOn: $viewModel.friendRequests)
                Toggle("Group Invitations", isOn: $viewModel.groupInvites)
            }
            .onChange(of: viewModel.friendRequests) { _, _ in
                Task { await viewModel.updateSettings() }
            }
            .onChange(of: viewModel.groupInvites) { _, _ in
                Task { await viewModel.updateSettings() }
            }

            Section("Email Notifications") {
                Toggle("Enable Email", isOn: $viewModel.emailEnabled)
            }
            .onChange(of: viewModel.emailEnabled) { _, _ in
                Task { await viewModel.updateSettings() }
            }

            Section("SMS Notifications") {
                Toggle("Enable SMS", isOn: $viewModel.smsEnabled)

                if viewModel.smsEnabled {
                    Text("SMS may incur carrier charges")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .onChange(of: viewModel.smsEnabled) { _, _ in
                Task { await viewModel.updateSettings() }
            }
        }
        .navigationTitle("Notification Settings")
        .task {
            await viewModel.loadSettings()
        }
    }
}

@MainActor
class NotificationSettingsViewModel: ObservableObject {
    @Published var pushEnabled = false
    @Published var emailEnabled = false
    @Published var smsEnabled = false
    @Published var groupDecisionStarted = false
    @Published var groupDecisionCompleted = false
    @Published var friendRequests = false
    @Published var groupInvites = false

    private let api = APIService.shared

    func loadSettings() async {
        do {
            let user: User = try await api.get(.profile)
            let settings = user.preferences.notificationSettings

            pushEnabled = settings.pushEnabled
            emailEnabled = settings.emailEnabled
            smsEnabled = settings.smsEnabled
            groupDecisionStarted = settings.groupDecisions.started
            groupDecisionCompleted = settings.groupDecisions.completed
            friendRequests = settings.friendRequests
            groupInvites = settings.groupInvites
        } catch {
            print("Load settings error: \(error)")
        }
    }

    func updateSettings() async {
        let request = UpdateNotificationSettingsRequest(
            pushEnabled: pushEnabled,
            emailEnabled: emailEnabled,
            smsEnabled: smsEnabled,
            groupDecisions: GroupDecisionSettings(
                started: groupDecisionStarted,
                completed: groupDecisionCompleted
            ),
            friendRequests: friendRequests,
            groupInvites: groupInvites
        )

        do {
            let _: EmptyResponse = try await api.put(.updateNotificationSettings, body: request)
        } catch {
            print("Update settings error: \(error)")
        }
    }
}

struct UpdateNotificationSettingsRequest: Encodable {
    let pushEnabled: Bool
    let emailEnabled: Bool
    let smsEnabled: Bool
    let groupDecisions: GroupDecisionSettings
    let friendRequests: Bool
    let groupInvites: Bool

    struct GroupDecisionSettings: Encodable {
        let started: Bool
        let completed: Bool
    }
}
```

---

## 🎯 Rich Notifications

### Notification with Image

```swift
// Backend sends notification with image
{
  "notification": {
    "title": "Decision Complete!",
    "body": "The Burger Joint won the vote!",
    "image": "https://photos.google.com/restaurant-123.jpg"
  },
  "data": {
    "type": "decision_result",
    "decisionId": "abc123",
    "restaurantId": "restaurant456"
  }
}
```

### Notification Actions

```swift
// AppDelegate.swift
func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
) -> Bool {
    // ... existing code

    // Define notification categories and actions
    defineNotificationActions()

    return true
}

private func defineNotificationActions() {
    // Group decision actions
    let acceptAction = UNNotificationAction(
        identifier: "VOTE_ACTION",
        title: "Vote Now",
        options: [.foreground]
    )

    let declineAction = UNNotificationAction(
        identifier: "DISMISS_ACTION",
        title: "Maybe Later",
        options: []
    )

    let decisionCategory = UNNotificationCategory(
        identifier: "GROUP_DECISION",
        actions: [acceptAction, declineAction],
        intentIdentifiers: [],
        options: []
    )

    // Register categories
    UNUserNotificationCenter.current().setNotificationCategories([decisionCategory])
}

// Handle action
func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
) {
    switch response.actionIdentifier {
    case "VOTE_ACTION":
        handleVoteAction(userInfo: response.notification.request.content.userInfo)
    case "DISMISS_ACTION":
        // Do nothing
        break
    default:
        handleNotificationTap(userInfo: response.notification.request.content.userInfo)
    }

    completionHandler()
}
```

---

## 🧪 Testing Notifications

### Send Test Notification

```swift
// For development/testing
func sendTestNotification() {
    let content = UNMutableNotificationContent()
    content.title = "Test Notification"
    content.body = "This is a test from Fork In The Road"
    content.sound = .default

    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)

    let request = UNNotificationRequest(
        identifier: UUID().uuidString,
        content: content,
        trigger: trigger
    )

    UNUserNotificationCenter.current().add(request)
}
```

---

## ✅ Notification Checklist

**Firebase Setup**:

- [ ] Firebase project created
- [ ] iOS app added to Firebase
- [ ] GoogleService-Info.plist downloaded and added to Xcode
- [ ] APNs key uploaded to Firebase Console
- [ ] Firebase Messaging SDK integrated

**iOS Configuration**:

- [ ] Push Notifications capability enabled in Xcode
- [ ] Background Modes capability enabled (Remote notifications)
- [ ] Info.plist configured for notifications
- [ ] AppDelegate implements notification delegates

**Implementation**:

- [ ] NotificationService implemented
- [ ] Device registration on sign-in
- [ ] Device unregistration on sign-out
- [ ] Notification handling (foreground + tap)
- [ ] Deep linking from notifications
- [ ] In-app notification polling
- [ ] Notification settings UI

**Testing**:

- [ ] Test permission request flow
- [ ] Test receiving notifications (foreground)
- [ ] Test receiving notifications (background)
- [ ] Test notification tap navigation
- [ ] Test notification actions
- [ ] Test on physical device (simulators don't support push!)

---

**Next**: [Design System iOS Guide](./08-design-system-ios.md)

**Notifications keep users engaged! 🔔**
