# Epic 1: iOS Foundation

**Goal**: Set up Xcode project, design system, and core infrastructure

**Duration**: 2-3 weeks (aggressive: 1-1.5 weeks)
**Priority**: 🔴 Critical
**Dependency**: Complete Web App Epic 11 first!

---

## 📋 Prerequisites

**Must Be Complete Before Starting**:

- [ ] Web App Epic 11 completed (Sign in with Apple added to web)
- [ ] Xcode 26.0.1 installed
- [ ] Firebase project created
- [ ] Render account set up
- [ ] Apple Developer account (free tier OK for now)

---

## 📖 Stories

### Story 1.1: Xcode Project Setup

**Estimated Time**: 4-6 hours

**Tasks**:

- [ ] Create new iOS App project in Xcode

  - Name: ForkInTheRoad
  - Team: Your Apple ID
  - Organization Identifier: com.youhungry
  - Bundle Identifier: com.forkintheroad.app
  - Interface: SwiftUI
  - Language: Swift
  - Minimum Deployment: iOS 16.0

- [ ] Configure project structure

  - Create folder structure (App/, Core/, Features/, Services/, Models/, Resources/)
  - Add .gitignore for Swift projects
  - Initialize git repository
  - Create README.md

- [ ] Configure Build Settings

  - Enable Swift Strict Concurrency
  - Set optimization levels (Debug vs Release)
  - Configure code signing (Automatic)

- [ ] Add to version control
  - Create GitHub repository
  - Initial commit
  - Set up branch strategy (main, develop)

**Deliverables**:

- ✅ Xcode project created and building successfully
- ✅ Folder structure matches agent guide architecture
- ✅ Git repository initialized
- ✅ Can run on simulator (shows "Hello World")

**Code Example**:

```swift
// App/ForkInTheRoadApp.swift
import SwiftUI

@main
struct ForkInTheRoadApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

// ContentView.swift
struct ContentView: View {
    var body: some View {
        Text("Hello, Fork In The Road!")
            .font(.largeTitle)
    }
}
```

---

### Story 1.2: Firebase Integration

**Estimated Time**: 2-3 hours

**Tasks**:

- [ ] Add Firebase SDK via Swift Package Manager

  - Firebase Analytics
  - Firebase Crashlytics
  - Firebase Messaging

- [ ] Download GoogleService-Info.plist from Firebase Console
- [ ] Add to Xcode project (drag into Resources/)
- [ ] Configure Firebase in App

- [ ] Test Firebase Analytics
  - Log test event
  - Verify in Firebase Console

**Deliverables**:

- ✅ Firebase SDK integrated
- ✅ GoogleService-Info.plist added
- ✅ Test event shows in Firebase Console
- ✅ Crashlytics test crash logged

**Code Example**:

```swift
// App/ForkInTheRoadApp.swift
import SwiftUI
import Firebase

@main
struct ForkInTheRoadApp: App {
    init() {
        FirebaseApp.configure()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

// Test analytics
Analytics.logEvent("app_launched", parameters: [
    "platform": "ios",
    "version": "1.0.0"
])
```

---

### Story 1.3: Design System Implementation

**Estimated Time**: 8-12 hours
**🔄 Can work in parallel with Story 1.4**

**Tasks**:

- [ ] Create color asset catalog

  - Add all colors from design system
  - Configure light/dark mode variants
  - Test color adaptation

- [ ] Implement typography system

  - Font extensions
  - Dynamic Type support
  - Test scaling

- [ ] Create shadow modifiers

  - Neumorphic shadow (.neuShadow)
  - Liquid Glass effects
  - Test performance

- [ ] Build core UI components

  - NeuButton (neumorphic buttons)
  - LGButton (Liquid Glass buttons)
  - NeuCard (neumorphic cards)
  - HybridCard (blended style)
  - NeuTextField (input fields)
  - LoadingView
  - ErrorView
  - EmptyStateView

- [ ] Create spacing/layout constants
- [ ] Implement haptic feedback utilities
- [ ] Test all components with previews

**Deliverables**:

- ✅ All colors defined and adaptive (dark/light mode)
- ✅ Typography system working with Dynamic Type
- ✅ Core components library complete
- ✅ SwiftUI previews for all components
- ✅ Haptics working on device

**Code Example**:

```swift
// Core/Design/Components/NeuButton.swift
struct NeuButton: View {
    let title: String
    let variant: Variant = .primary
    let action: () -> Void

    enum Variant {
        case primary, secondary, destructive
    }

    var body: some View {
        Button(action: {
            Haptics.medium()
            action()
        }) {
            Text(title)
                .font(.headline)
                .foregroundColor(.white)
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.accentInfrared)
                .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .neuShadow()
    }
}

#Preview {
    VStack(spacing: 20) {
        NeuButton("Primary Button", variant: .primary) {}
        NeuButton("Secondary Button", variant: .secondary) {}
    }
    .padding()
}
```

---

### Story 1.4: Core Services Setup

**Estimated Time**: 6-8 hours
**🔄 Can work in parallel with Story 1.3**

**Tasks**:

- [ ] Implement KeychainManager

  - Save/get/delete token methods
  - Test on simulator and device

- [ ] Create Environment configuration

  - Dev, Staging, Prod environments
  - API base URLs
  - Firebase config

- [ ] Implement APIService base class

  - Generic request method
  - Error handling
  - Token injection
  - Retry logic

- [ ] Create NetworkMonitor

  - Monitor connectivity
  - Publish connection state
  - Test with airplane mode

- [ ] Implement AnalyticsService
  - Wrap Firebase Analytics
  - Define event types
  - Log test events

**Deliverables**:

- ✅ KeychainManager working (test save/retrieve)
- ✅ Environment switching (dev/staging/prod)
- ✅ APIService base ready for feature services
- ✅ Network monitoring active
- ✅ Analytics logging events

**Code Example**:

```swift
// Services/Network/APIService.swift
class APIService {
    static let shared = APIService()

    private let baseURL: String

    init() {
        #if DEBUG
        baseURL = "http://localhost:3001"
        #else
        baseURL = "https://you-hungry-mobile-api.onrender.com"
        #endif
    }

    func request<T: Decodable>(
        _ endpoint: APIEndpoint,
        method: HTTPMethod,
        body: Encodable? = nil
    ) async throws -> T {
        // Implementation from agent guide
    }
}
```

---

### Story 1.5: Mobile API Deployment (Backend)

**Estimated Time**: 6-10 hours

**Tasks**:

- [ ] Extract business logic from Next.js to shared module
- [ ] Create new Node.js/Express project for mobile API
- [ ] Implement authentication middleware (Clerk JWT verification)
- [ ] Implement CORS for iOS app
- [ ] Set up environment variables on Render
- [ ] Deploy to Render (staging environment)
- [ ] Test all endpoints with Postman/Insomnia
- [ ] Configure MongoDB connection
- [ ] Set up logging and error tracking

**Deliverables**:

- ✅ Mobile API running on Render
- ✅ All REST endpoints working
- ✅ iOS app can connect to API
- ✅ Authentication working
- ✅ MongoDB operations working

**API Structure**:

```javascript
// mobile-api/server.js
const express = require('express');
const cors = require('cors');
const { clerkMiddleware } = require('@clerk/express');

const app = express();

// Middleware
app.use(cors({ origin: 'https://youhungry.app' }));
app.use(express.json());
app.use(clerkMiddleware());

// Routes
app.use('/api/collections', require('./routes/collections'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/decisions', require('./routes/decisions'));
app.use('/api/auth', require('./routes/auth'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Mobile API running on port ${PORT}`);
});
```

---

### Story 1.6: Core Data Setup

**Estimated Time**: 4-6 hours

**Tasks**:

- [ ] Create Core Data model (.xcdatamodeld)
- [ ] Define entities:

  - RestaurantEntity
  - CollectionEntity
  - GroupEntity
  - DecisionEntity
  - UserEntity (cached profile)

- [ ] Configure relationships
- [ ] Implement CoreDataManager
- [ ] Test save/fetch/delete operations
- [ ] Set up migrations strategy (for future schema changes)

**Deliverables**:

- ✅ Core Data stack configured
- ✅ All entities defined
- ✅ Save/fetch working
- ✅ Can persist data across app launches

---

## 🔄 Parallel Work Recommendations

These stories can be worked on simultaneously:

**Group A** (Foundation - sequential):

- Story 1.1 → Story 1.2 (Project setup THEN Firebase)

**Group B** (Implementation - parallel):

- Story 1.3 (Design System) + Story 1.4 (Services) ← Work on both at once!

**Group C** (Backend - can do anytime):

- Story 1.5 (Mobile API) ← Can be done before, during, or after iOS work

**Group D** (Data Layer - sequential after 1.4):

- Story 1.6 (Core Data) ← Needs service architecture from 1.4

**Optimal Workflow**:

1. Day 1-2: Complete 1.1 + 1.2 (Project + Firebase)
2. Day 3-5: Parallel work on 1.3 + 1.4 (Design + Services)
3. Day 6-7: Complete 1.6 (Core Data)
4. Day 8-10: Complete 1.5 (Mobile API deployment)

---

## ✅ Epic Completion Checklist

Before moving to Epic 2:

**Project Setup**:

- [ ] Xcode project created and version controlled
- [ ] Builds successfully on simulator
- [ ] Firebase integrated and logging events
- [ ] All required capabilities enabled

**Design System**:

- [ ] All colors defined (light + dark mode)
- [ ] Typography system implemented
- [ ] Core components created
- [ ] SwiftUI previews working
- [ ] Haptics implemented

**Services**:

- [ ] APIService base class ready
- [ ] KeychainManager working
- [ ] NetworkMonitor active
- [ ] AnalyticsService logging

**Backend**:

- [ ] Mobile API deployed on Render
- [ ] All endpoints accessible
- [ ] iOS app connects successfully
- [ ] MongoDB operations working

**Data Layer**:

- [ ] Core Data configured
- [ ] Entities defined
- [ ] Save/fetch working
- [ ] Persists across launches

---

## 🧪 Testing Requirements

**Unit Tests**:

- [ ] KeychainManager tests
- [ ] APIService base tests
- [ ] Color/Typography tests
- [ ] Core Data operations tests

**Integration Tests**:

- [ ] API connection test (health check endpoint)
- [ ] Firebase logging test
- [ ] Core Data persistence test

**Manual Testing**:

- [ ] Run on simulator
- [ ] Run on physical device
- [ ] Test dark/light mode switching
- [ ] Test offline mode (airplane mode)

---

## 📊 Success Metrics

- **Build Time**: < 30 seconds (incremental)
- **App Launch**: < 2 seconds
- **Design Consistency**: All components match design system
- **Code Coverage**: 70%+ on core utilities

---

## 🚀 Ready for Next Epic

Once Epic 1 is complete, you'll have:

- ✅ Solid foundation for all future features
- ✅ Design system ready for any UI
- ✅ API client ready to connect backend
- ✅ Storage layer ready for offline functionality
- ✅ Analytics and monitoring active

**Next**: [Epic 2: Authentication](./epic-02-authentication.md)

---

**Foundation is everything - build it solid! 🏗️**
