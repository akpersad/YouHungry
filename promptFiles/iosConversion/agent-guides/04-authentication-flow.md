# Authentication Flow - Clerk + Sign in with Apple

Complete guide to implementing authentication in the iOS app.

---

## 🎯 Overview

**Authentication Strategy**:

- **Primary**: Clerk iOS SDK (email/password, social logins)
- **Required**: Sign in with Apple (App Store requirement)
- **Goal**: Seamless cross-platform (same account works on web and iOS)

**User Flow**:

```
User Opens App
     ↓
Auth State Check (token exists?)
     ├─ Yes → Main App (authenticated)
     └─ No → Sign In/Register Screen
              ├─ Sign in with Apple → Clerk account linking
              ├─ Email/Password → Clerk authentication
              └─ Social (Google, etc.) → Clerk OAuth
                   ↓
              Get JWT Token
                   ↓
              Store in Keychain
                   ↓
              Fetch User Profile
                   ↓
              Register for Push Notifications
                   ↓
              Main App (authenticated)
```

---

## 🔐 Clerk iOS SDK Integration

### Installation

```swift
// Package.swift dependencies
dependencies: [
    .package(url: "https://github.com/clerk/clerk-ios", from: "1.0.0")
]
```

### Configuration

```swift
// App/ForkInTheRoadApp.swift
import SwiftUI
import ClerkSDK

@main
struct ForkInTheRoadApp: App {
    init() {
        // Configure Clerk
        Clerk.configure(
            publishableKey: Environment.clerkPublishableKey
        )
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}

// Core/Environment.swift
extension Environment {
    static var clerkPublishableKey: String {
        guard let key = Bundle.main.infoDictionary?["CLERK_PUBLISHABLE_KEY"] as? String else {
            fatalError("Clerk publishable key not found")
        }
        return key
    }
}
```

---

## 🎭 AuthViewModel

### Core Authentication Logic

```swift
// Features/Authentication/ViewModels/AuthViewModel.swift
import Foundation
import ClerkSDK
import AuthenticationServices

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var user: User?
    @Published var isLoading = false
    @Published var error: String?

    private let apiService = APIService.shared
    private let keychainManager = KeychainManager.shared
    private let notificationService = NotificationService.shared
    private let analyticsService = AnalyticsService.shared

    init() {
        checkAuthState()
    }

    // MARK: - Auth State Management

    func checkAuthState() {
        Task {
            do {
                // Check if token exists in Keychain
                guard let token = try? keychainManager.getToken() else {
                    isAuthenticated = false
                    return
                }

                // Validate token by fetching user
                let user: User = try await apiService.get(.currentUser)
                self.user = user
                self.isAuthenticated = true

                // Register for notifications
                await notificationService.registerDevice()

            } catch {
                // Token invalid, clear and show sign in
                try? keychainManager.deleteToken()
                isAuthenticated = false
            }
        }
    }

    // MARK: - Email/Password Sign In

    func signIn(email: String, password: String) async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            // Sign in with Clerk
            let signIn = try await Clerk.shared.client.signIns.create(
                strategy: .identifier(email, password: password)
            )

            // Get session token
            guard let session = signIn.createdSessionId,
                  let token = try await Clerk.shared.client.sessions.get(session)?.lastActiveToken?.jwt else {
                throw AuthError.noToken
            }

            // Handle successful auth
            try await handleSuccessfulAuth(token: token)

            analyticsService.log(event: .signIn(method: "email"))

        } catch {
            self.error = (error as? AuthError)?.userMessage ?? "Sign in failed"
            analyticsService.log(event: .signInFailed(method: "email", reason: error.localizedDescription))
        }
    }

    // MARK: - Email/Password Sign Up

    func signUp(
        email: String,
        password: String,
        firstName: String,
        lastName: String,
        phoneNumber: String? = nil
    ) async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            // Create Clerk sign up
            let signUp = try await Clerk.shared.client.signUps.create(
                strategy: .standard(
                    emailAddress: email,
                    password: password,
                    firstName: firstName,
                    lastName: lastName
                )
            )

            // Add phone number if provided
            if let phoneNumber = phoneNumber {
                try await signUp.update(phoneNumber: phoneNumber)
            }

            // Prepare email verification
            try await signUp.prepareVerification(strategy: .emailCode)

            // For now, assume verification happens outside
            // In production, you'd implement verification flow here

            analyticsService.log(event: .signUp(method: "email"))

        } catch {
            self.error = (error as? AuthError)?.userMessage ?? "Sign up failed"
            analyticsService.log(event: .signUpFailed(method: "email", reason: error.localizedDescription))
        }
    }

    // MARK: - Sign in with Apple

    func signInWithApple() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            // Request Apple authorization
            let appleIDProvider = ASAuthorizationAppleIDProvider()
            let request = appleIDProvider.createRequest()
            request.requestedScopes = [.fullName, .email]

            let authorizationController = ASAuthorizationController(authorizationRequests: [request])

            // Use async/await wrapper
            let authorization = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<ASAuthorization, Error>) in
                let delegate = AppleSignInDelegate(continuation: continuation)
                authorizationController.delegate = delegate
                authorizationController.performRequests()
            }

            guard let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential else {
                throw AuthError.invalidAppleCredential
            }

            // Extract token and email
            guard let identityToken = appleIDCredential.identityToken,
                  let tokenString = String(data: identityToken, encoding: .utf8) else {
                throw AuthError.noToken
            }

            let email = appleIDCredential.email
            let firstName = appleIDCredential.fullName?.givenName
            let lastName = appleIDCredential.fullName?.familyName

            // Sign in with Clerk using Apple token
            let signIn = try await Clerk.shared.client.signIns.create(
                strategy: .oauth(.apple, token: tokenString)
            )

            // If this is a new user, Clerk creates account automatically
            // Link Apple ID to Clerk account

            // Get session token
            guard let session = signIn.createdSessionId,
                  let clerkToken = try await Clerk.shared.client.sessions.get(session)?.lastActiveToken?.jwt else {
                throw AuthError.noToken
            }

            // Handle successful auth
            try await handleSuccessfulAuth(token: clerkToken)

            analyticsService.log(event: .signIn(method: "apple"))

        } catch {
            self.error = (error as? AuthError)?.userMessage ?? "Apple Sign-in failed"
            analyticsService.log(event: .signInFailed(method: "apple", reason: error.localizedDescription))
        }
    }

    // MARK: - Sign Out

    func signOut() async {
        do {
            // Sign out from Clerk
            try await Clerk.shared.signOut()

            // Delete token from Keychain
            try keychainManager.deleteToken()

            // Clear user state
            user = nil
            isAuthenticated = false

            // Unregister from notifications
            await notificationService.unregisterDevice()

            analyticsService.log(event: .signOut)

        } catch {
            self.error = "Sign out failed"
        }
    }

    // MARK: - Private Helpers

    private func handleSuccessfulAuth(token: String) async throws {
        // Store token in Keychain
        try keychainManager.save(token: token)

        // Fetch user profile from mobile API
        let user: User = try await apiService.get(.currentUser)

        // Update state
        self.user = user
        self.isAuthenticated = true

        // Register for push notifications
        await notificationService.registerDevice()

        // Track user properties
        analyticsService.setUserProperties(userId: user.id, email: user.email)
    }
}

// MARK: - Apple Sign In Delegate

class AppleSignInDelegate: NSObject, ASAuthorizationControllerDelegate {
    private let continuation: CheckedContinuation<ASAuthorization, Error>

    init(continuation: CheckedContinuation<ASAuthorization, Error>) {
        self.continuation = continuation
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        continuation.resume(returning: authorization)
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        continuation.resume(throwing: error)
    }
}

// MARK: - Auth Errors

enum AuthError: Error {
    case noToken
    case invalidAppleCredential
    case clerkError(String)
    case networkError
    case unknown

    var userMessage: String {
        switch self {
        case .noToken:
            return "Authentication failed. Please try again."
        case .invalidAppleCredential:
            return "Apple Sign-in failed. Please try again."
        case .clerkError(let message):
            return message
        case .networkError:
            return "No internet connection"
        case .unknown:
            return "Something went wrong"
        }
    }
}
```

---

## 🎨 Sign In View

### SwiftUI Interface

```swift
// Features/Authentication/Views/SignInView.swift
import SwiftUI
import AuthenticationServices

struct SignInView: View {
    @EnvironmentObject var authViewModel: AuthViewModel

    @State private var email = ""
    @State private var password = ""
    @State private var showSignUp = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                // Logo
                Image("AppLogo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 120, height: 120)

                // Title
                VStack(spacing: 8) {
                    Text("Welcome Back!")
                        .font(.largeTitle)
                        .fontWeight(.bold)

                    Text("Sign in to continue")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                // Sign in with Apple (REQUIRED by App Store)
                SignInWithAppleButton(
                    onRequest: { request in
                        request.requestedScopes = [.fullName, .email]
                    },
                    onCompletion: { result in
                        Task {
                            await authViewModel.signInWithApple()
                        }
                    }
                )
                .signInWithAppleButtonStyle(.black)
                .frame(height: 50)
                .cornerRadius(12)

                // Divider
                HStack {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 1)
                    Text("or")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 1)
                }

                // Email/Password fields
                VStack(spacing: 16) {
                    NeuTextField(
                        "Email",
                        text: $email,
                        placeholder: "your@email.com",
                        keyboardType: .emailAddress
                    )

                    NeuTextField(
                        "Password",
                        text: $password,
                        placeholder: "Enter your password",
                        isSecure: true
                    )
                }

                // Error message
                if let error = authViewModel.error {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.red.opacity(0.1))
                        )
                }

                // Sign In button
                NeuButton("Sign In", variant: .primary) {
                    Task {
                        await authViewModel.signIn(email: email, password: password)
                    }
                }
                .disabled(email.isEmpty || password.isEmpty || authViewModel.isLoading)

                // Sign Up link
                Button {
                    showSignUp = true
                } label: {
                    HStack {
                        Text("Don't have an account?")
                            .foregroundColor(.secondary)
                        Text("Sign Up")
                            .fontWeight(.semibold)
                            .foregroundColor(.accentColor)
                    }
                    .font(.subheadline)
                }

                Spacer()
            }
            .padding()
            .sheet(isPresented: $showSignUp) {
                SignUpView()
            }
            .overlay {
                if authViewModel.isLoading {
                    ZStack {
                        Color.black.opacity(0.3)
                            .ignoresSafeArea()

                        ProgressView()
                            .scaleEffect(1.5)
                            .tint(.white)
                    }
                }
            }
        }
    }
}
```

---

## 📝 Sign Up View

```swift
// Features/Authentication/Views/SignUpView.swift
import SwiftUI

struct SignUpView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authViewModel: AuthViewModel

    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var phoneNumber = ""
    @State private var smsOptIn = false

    @State private var emailError: String?
    @State private var passwordError: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Fields
                    VStack(spacing: 16) {
                        HStack(spacing: 12) {
                            NeuTextField(
                                "First Name",
                                text: $firstName,
                                placeholder: "John"
                            )

                            NeuTextField(
                                "Last Name",
                                text: $lastName,
                                placeholder: "Doe"
                            )
                        }

                        NeuTextField(
                            "Email",
                            text: $email,
                            placeholder: "your@email.com",
                            keyboardType: .emailAddress,
                            error: emailError
                        )
                        .onChange(of: email) { _, _ in
                            validateEmail()
                        }

                        NeuTextField(
                            "Password",
                            text: $password,
                            placeholder: "Min. 8 characters",
                            isSecure: true,
                            error: passwordError
                        )
                        .onChange(of: password) { _, _ in
                            validatePassword()
                        }

                        NeuTextField(
                            "Confirm Password",
                            text: $confirmPassword,
                            placeholder: "Re-enter password",
                            isSecure: true
                        )

                        // Optional phone number
                        VStack(alignment: .leading, spacing: 8) {
                            NeuTextField(
                                "Phone Number (Optional)",
                                text: $phoneNumber,
                                placeholder: "+1 (555) 123-4567",
                                keyboardType: .phonePad
                            )

                            Toggle(isOn: $smsOptIn) {
                                Text("Receive SMS notifications")
                                    .font(.caption)
                            }
                            .padding(.horizontal)
                        }
                    }

                    // Terms
                    Text("By signing up, you agree to our Terms of Service and Privacy Policy")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)

                    // Sign Up button
                    NeuButton("Create Account", variant: .primary) {
                        Task {
                            await authViewModel.signUp(
                                email: email,
                                password: password,
                                firstName: firstName,
                                lastName: lastName,
                                phoneNumber: smsOptIn ? phoneNumber : nil
                            )
                        }
                    }
                    .disabled(!isFormValid || authViewModel.isLoading)
                }
                .padding()
            }
            .navigationTitle("Create Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }

    private var isFormValid: Bool {
        !email.isEmpty &&
        !password.isEmpty &&
        !confirmPassword.isEmpty &&
        !firstName.isEmpty &&
        !lastName.isEmpty &&
        password == confirmPassword &&
        emailError == nil &&
        passwordError == nil
    }

    private func validateEmail() {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format:"SELF MATCHES %@", emailRegex)

        if !emailPredicate.evaluate(with: email) {
            emailError = "Invalid email format"
        } else {
            emailError = nil
        }
    }

    private func validatePassword() {
        if password.count < 8 {
            passwordError = "Password must be at least 8 characters"
        } else {
            passwordError = nil
        }
    }
}
```

---

## 🔄 Root View (Auth Gate)

```swift
// App/RootView.swift
import SwiftUI

struct RootView: View {
    @StateObject private var authViewModel = AuthViewModel()

    var body: some View {
        Group {
            if authViewModel.isAuthenticated {
                MainTabView()
            } else {
                SignInView()
            }
        }
        .environmentObject(authViewModel)
    }
}
```

---

## 🔐 Biometric Authentication

### Face ID / Touch ID

```swift
// Services/BiometricAuthService.swift
import LocalAuthentication

class BiometricAuthService {
    static let shared = BiometricAuthService()

    enum BiometricType {
        case none
        case touchID
        case faceID

        var displayName: String {
            switch self {
            case .none: return "None"
            case .touchID: return "Touch ID"
            case .faceID: return "Face ID"
            }
        }
    }

    func biometricType() -> BiometricType {
        let context = LAContext()
        var error: NSError?

        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return .none
        }

        switch context.biometryType {
        case .faceID:
            return .faceID
        case .touchID:
            return .touchID
        default:
            return .none
        }
    }

    func authenticate(reason: String) async throws -> Bool {
        let context = LAContext()
        context.localizedCancelTitle = "Use Password"

        return try await context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: reason
        )
    }
}

// Usage in AuthViewModel
func signInWithBiometrics() async {
    do {
        let success = try await BiometricAuthService.shared.authenticate(
            reason: "Sign in to Fork In The Road"
        )

        if success {
            // Token already in Keychain, just check auth state
            checkAuthState()
        }
    } catch {
        self.error = "Biometric authentication failed"
    }
}
```

---

## 🧪 Testing Authentication

### Unit Tests

```swift
// Features/Authentication/ViewModels/AuthViewModelTests.swift
import XCTest
@testable import ForkInTheRoad

@MainActor
class AuthViewModelTests: XCTestCase {
    var viewModel: AuthViewModel!
    var mockAPIService: MockAPIService!

    override func setUp() async throws {
        mockAPIService = MockAPIService()
        viewModel = AuthViewModel(apiService: mockAPIService)
    }

    func testSignInSuccess() async {
        // Given
        let email = "test@example.com"
        let password = "password123"
        mockAPIService.mockUser = .fixture

        // When
        await viewModel.signIn(email: email, password: password)

        // Then
        XCTAssertTrue(viewModel.isAuthenticated)
        XCTAssertNotNil(viewModel.user)
        XCTAssertNil(viewModel.error)
    }

    func testSignInFailure() async {
        // Given
        let email = "test@example.com"
        let password = "wrongpassword"
        mockAPIService.shouldFail = true

        // When
        await viewModel.signIn(email: email, password: password)

        // Then
        XCTAssertFalse(viewModel.isAuthenticated)
        XCTAssertNil(viewModel.user)
        XCTAssertNotNil(viewModel.error)
    }

    func testSignOut() async {
        // Given
        viewModel.isAuthenticated = true
        viewModel.user = .fixture

        // When
        await viewModel.signOut()

        // Then
        XCTAssertFalse(viewModel.isAuthenticated)
        XCTAssertNil(viewModel.user)
    }
}
```

---

## ✅ Authentication Checklist

- [ ] Clerk iOS SDK installed and configured
- [ ] Sign in with Apple implemented (required!)
- [ ] Email/password sign in working
- [ ] Sign up flow implemented
- [ ] Token stored in Keychain securely
- [ ] Auto sign-in on app launch
- [ ] Sign out clears all auth data
- [ ] Biometric auth implemented (Face ID/Touch ID)
- [ ] Error handling for all auth flows
- [ ] Analytics tracking for auth events
- [ ] Unit tests for AuthViewModel
- [ ] UI tests for sign in/sign up flows
- [ ] Tested on physical device
- [ ] Privacy Policy linked in sign up

---

**Next**: [Data Models Guide](./05-data-models.md)

**Authentication is the gateway - get it right! 🔐**
