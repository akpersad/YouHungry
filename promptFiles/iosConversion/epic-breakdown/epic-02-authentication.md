# Epic 2: Authentication & User Management

**Goal**: Implement Clerk authentication + Sign in with Apple for seamless cross-platform login

**Duration**: 1-2 weeks (aggressive: 5-7 days)
**Priority**: 🔴 Critical
**Dependencies**: Epic 1 complete, Web App Epic 11 complete

---

## 📋 Prerequisites

- [ ] Epic 1 (Foundation) completed
- [ ] Web App has Sign in with Apple configured
- [ ] Clerk iOS SDK documentation reviewed
- [ ] Sign in with Apple entitlement understood

---

## 📖 Stories

### Story 2.1: Clerk iOS SDK Integration

**Estimated Time**: 4-6 hours

**Tasks**:

- [ ] Add Clerk iOS SDK via SPM

  - URL: https://github.com/clerk/clerk-ios
  - Version: 1.0.0+

- [ ] Configure Clerk in app

  - Add publishable key to Info.plist
  - Initialize Clerk in App init
  - Configure redirect URLs

- [ ] Implement AuthViewModel

  - Sign in method (email/password)
  - Sign up method
  - Sign out method
  - Auth state management (@Published properties)

- [ ] Test basic auth flow
  - Sign up with test account
  - Sign in with test account
  - Sign out

**Deliverables**:

- ✅ Clerk SDK integrated
- ✅ Can sign up with email/password
- ✅ Can sign in with email/password
- ✅ Auth state persists across app launches
- ✅ Token stored in Keychain

**Code Example**:

```swift
// Features/Authentication/ViewModels/AuthViewModel.swift
@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var user: User?
    @Published var isLoading = false
    @Published var error: String?

    func signIn(email: String, password: String) async {
        isLoading = true
        defer { isLoading = false }

        do {
            let signIn = try await Clerk.shared.client.signIns.create(
                strategy: .identifier(email, password: password)
            )

            guard let token = signIn.createdSessionId else {
                throw AuthError.noToken
            }

            try await handleSuccessfulAuth(token: token)
        } catch {
            self.error = "Sign in failed"
        }
    }

    private func handleSuccessfulAuth(token: String) async throws {
        try KeychainManager.shared.save(token: token)
        let user: User = try await APIService.shared.get(.currentUser)
        self.user = user
        self.isAuthenticated = true
    }
}
```

---

### Story 2.2: Sign in with Apple Implementation

**Estimated Time**: 6-8 hours
**🔄 Can work in parallel with Story 2.3**

**Tasks**:

- [ ] Add Sign in with Apple capability in Xcode

  - Signing & Capabilities → + Capability → Sign in with Apple

- [ ] Implement Apple Sign-in button

  - Use SignInWithAppleButton from AuthenticationServices
  - Configure presentation (black style)

- [ ] Handle Apple authorization

  - Request authorization with scopes (.fullName, .email)
  - Extract identity token, email, name
  - Send to Clerk for account linking

- [ ] Test Sign in with Apple

  - New user flow (creates Clerk account)
  - Existing user flow (links to Clerk account)
  - Cross-platform login (sign in with Apple on iOS, email on web)

- [ ] Handle edge cases
  - User cancels
  - Email hidden by Apple
  - Existing account with same email

**Deliverables**:

- ✅ Sign in with Apple button working
- ✅ New users can sign in with Apple
- ✅ Existing Clerk users can link Apple ID
- ✅ Cross-platform auth working (web ↔ iOS)
- ✅ Satisfies App Store requirements

**Code Example**:

```swift
// Features/Authentication/Views/SignInView.swift
import SwiftUI
import AuthenticationServices

struct SignInView: View {
    @EnvironmentObject var authViewModel: AuthViewModel

    var body: some View {
        VStack(spacing: 24) {
            // App Logo
            Image("AppLogo")
                .resizable()
                .frame(width: 120, height: 120)

            // Sign in with Apple (REQUIRED!)
            SignInWithAppleButton(
                onRequest: { request in
                    request.requestedScopes = [.fullName, .email]
                },
                onCompletion: { result in
                    Task {
                        await authViewModel.handleAppleSignIn(result)
                    }
                }
            )
            .signInWithAppleButtonStyle(.black)
            .frame(height: 50)
            .cornerRadius(12)

            Divider()

            // Email/Password fields
            // ... (see agent guide for full implementation)
        }
        .padding()
    }
}
```

---

### Story 2.3: Sign In/Sign Up UI

**Estimated Time**: 6-8 hours
**🔄 Can work in parallel with Story 2.2**

**Tasks**:

- [ ] Create SignInView

  - Sign in with Apple button (prominent placement)
  - Email/password fields
  - Error messaging
  - Loading states
  - "Sign Up" link

- [ ] Create SignUpView

  - Email/password fields
  - Name fields (first, last)
  - Optional phone number
  - SMS opt-in toggle
  - Terms and Privacy Policy links
  - Validation (email format, password strength)

- [ ] Implement form validation

  - Email regex validation
  - Password requirements (8+ chars)
  - Real-time error messages

- [ ] Design polish
  - Liquid Glass + Neumorphic blend
  - Smooth animations
  - Haptic feedback on submit
  - Keyboard handling (dismiss on tap)

**Deliverables**:

- ✅ SignInView complete and polished
- ✅ SignUpView complete with validation
- ✅ Forms look great in light/dark mode
- ✅ Keyboard handling smooth
- ✅ Error states clear and helpful

---

### Story 2.4: Biometric Authentication

**Estimated Time**: 4-5 hours

**Tasks**:

- [ ] Implement BiometricAuthService

  - Detect biometric type (Face ID/Touch ID)
  - Request biometric authentication
  - Handle errors (not enrolled, cancelled, etc.)

- [ ] Add Face ID/Touch ID to sign-in flow

  - Show biometric option if available
  - "Sign in with Face ID" button
  - Fallback to password if fails

- [ ] Add biometric app lock (optional security feature)

  - Settings toggle for "Require Face ID on Launch"
  - Lock app after backgrounding
  - Unlock with biometric

- [ ] Add Info.plist privacy strings
  - NSFaceIDUsageDescription
  - "Fork In The Road uses Face ID to securely sign you in"

**Deliverables**:

- ✅ Face ID/Touch ID sign-in working
- ✅ App lock feature working
- ✅ Privacy string added
- ✅ Tested on physical device (simulators don't support biometrics fully)

**Code Example**:

```swift
// Services/BiometricAuthService.swift
import LocalAuthentication

class BiometricAuthService {
    static let shared = BiometricAuthService()

    func authenticate(reason: String) async throws -> Bool {
        let context = LAContext()

        return try await context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: reason
        )
    }
}

// Usage
Button("Sign in with Face ID") {
    Task {
        do {
            let success = try await BiometricAuthService.shared.authenticate(
                reason: "Sign in to Fork In The Road"
            )
            if success {
                await authViewModel.signInWithBiometrics()
            }
        } catch {
            // Handle error
        }
    }
}
```

---

### Story 2.5: User Profile Management

**Estimated Time**: 4-6 hours

**Tasks**:

- [ ] Implement ProfileViewModel

  - Fetch user profile
  - Update profile (name, email, phone)
  - Update notification settings
  - Delete account

- [ ] Create ProfileView

  - Display user info
  - Profile picture (from Clerk)
  - Edit fields
  - Notification settings link
  - Sign out button
  - Delete account (with confirmation)

- [ ] Sync profile with backend
  - Updates saved to mobile API
  - Syncs to MongoDB
  - Available on web app

**Deliverables**:

- ✅ Profile view displaying user data
- ✅ Can update name, email, phone
- ✅ Notification settings accessible
- ✅ Sign out working
- ✅ Profile syncs cross-platform

---

## 🔄 Parallel Work Groups

**Week 1**:

- Day 1-2: Story 2.1 (Clerk SDK) - Must be first
- Day 3-5: Stories 2.2 + 2.3 in parallel (Sign in with Apple + UI)
- Day 6-7: Stories 2.4 + 2.5 in parallel (Biometrics + Profile)

**Week 2** (if needed):

- Polish, bug fixes, testing

---

## ✅ Epic Completion Checklist

**Authentication Working**:

- [ ] Email/password sign in
- [ ] Email/password sign up
- [ ] Sign in with Apple (NEW users)
- [ ] Sign in with Apple (EXISTING users)
- [ ] Biometric sign in (Face ID/Touch ID)
- [ ] Sign out
- [ ] Token persistence (stays signed in)

**Cross-Platform**:

- [ ] Same credentials work on web and iOS
- [ ] Apple ID links to Clerk account
- [ ] User data syncs between platforms

**UI/UX**:

- [ ] Sign in screen polished
- [ ] Sign up screen polished
- [ ] Profile screen complete
- [ ] Error handling clear
- [ ] Loading states smooth

**App Store Compliance**:

- [ ] Sign in with Apple present (REQUIRED!)
- [ ] Privacy strings added to Info.plist
- [ ] Terms and Privacy accessible

**Testing**:

- [ ] Unit tests for AuthViewModel
- [ ] Integration tests for auth flow
- [ ] UI tests for sign in/sign up
- [ ] Tested on physical device
- [ ] Cross-platform auth verified

---

## 🐛 Common Issues & Solutions

**Issue**: "Sign in with Apple not working on simulator"

- **Solution**: Must test on physical device. Simulator has limited support.

**Issue**: "Clerk says user not found"

- **Solution**: Ensure web app Sign in with Apple is configured identically.

**Issue**: "Token expires too quickly"

- **Solution**: Implement token refresh logic in AuthViewModel.

**Issue**: "Face ID not prompting"

- **Solution**: Add NSFaceIDUsageDescription to Info.plist.

---

## 📚 Resources

**Clerk iOS Documentation**:

- [Clerk iOS Quickstart](https://clerk.com/docs/quickstarts/ios)
- [Clerk iOS SDK Reference](https://clerk.com/docs/references/ios/overview)

**Apple Documentation**:

- [Sign in with Apple](https://developer.apple.com/documentation/sign_in_with_apple)
- [Biometric Authentication](https://developer.apple.com/documentation/localauthentication)

---

**Next**: [Epic 3: Collections Management](./epic-03-collections.md)

**Authentication is the gateway - make it smooth! 🔐**
