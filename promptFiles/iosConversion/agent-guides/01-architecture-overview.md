# Architecture Overview - iOS App

Comprehensive architectural guide for Fork In The Road iOS app development.

---

## 🎯 Architecture Principles

### Design Philosophy

**1. MVVM (Model-View-ViewModel) Pattern**

- **Model**: Data structures and business logic
- **View**: SwiftUI views (declarative UI)
- **ViewModel**: Presentation logic, state management

**2. Single Source of Truth**

- @Published properties in ViewModels
- Combine framework for reactive updates
- SwiftUI automatically re-renders on changes

**3. Dependency Injection**

- Services injected via @EnvironmentObject or @StateObject
- Testable architecture
- Easy to mock for testing

**4. Separation of Concerns**

- Network layer separate from UI
- Business logic in ViewModels
- Data models independent of UI

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  SwiftUI Views                      │
│  (User Interface - Declarative, Reactive)           │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│                   ViewModels                        │
│  (@MainActor, @Published, Business Logic)           │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│                    Services                         │
│  (API, Auth, Notifications, Analytics)              │
└────────────────┬────────────────────────────────────┘
                 │
       ┌─────────┼─────────┬──────────┐
       ▼         ▼         ▼          ▼
┌──────────┐ ┌────────┐ ┌─────────┐ ┌──────────┐
│ Mobile   │ │ Core   │ │ Firebase│ │ External │
│ API      │ │ Data   │ │         │ │ APIs     │
│ (Render) │ │(Cache) │ │(FCM/Ana)│ │(Google)  │
└──────────┘ └────────┘ └─────────┘ └──────────┘
```

---

## 📦 Project Structure

```
ForkInTheRoad/
├── App/
│   ├── ForkInTheRoadApp.swift          # App entry point, @main
│   ├── AppDelegate.swift           # Lifecycle, push notifications
│   └── SceneDelegate.swift         # Scene management (if needed)
│
├── Core/
│   ├── Design/
│   │   ├── Colors.swift            # Design system colors
│   │   ├── Typography.swift        # Font styles
│   │   ├── Shadows.swift           # Neumorphic shadows
│   │   ├── LiquidGlass.swift       # iOS 26 Liquid Glass styles
│   │   └── Components/             # Reusable UI components
│   │       ├── NeuButton.swift
│   │       ├── NeuCard.swift
│   │       └── LiquidGlassButton.swift
│   │
│   ├── Extensions/
│   │   ├── View+Extensions.swift
│   │   ├── Color+Extensions.swift
│   │   ├── String+Extensions.swift
│   │   └── Date+Extensions.swift
│   │
│   ├── Utilities/
│   │   ├── Logger.swift            # Firebase Analytics wrapper
│   │   ├── KeychainManager.swift   # Secure storage
│   │   └── Validator.swift         # Input validation
│   │
│   └── Constants.swift              # App-wide constants
│
├── Features/
│   ├── Authentication/
│   │   ├── Views/
│   │   │   ├── SignInView.swift
│   │   │   ├── SignUpView.swift
│   │   │   └── AppleSignInButton.swift
│   │   ├── ViewModels/
│   │   │   └── AuthViewModel.swift
│   │   └── Models/
│   │       └── User.swift
│   │
│   ├── Collections/
│   │   ├── Views/
│   │   │   ├── CollectionsListView.swift
│   │   │   ├── CollectionDetailView.swift
│   │   │   └── CreateCollectionView.swift
│   │   ├── ViewModels/
│   │   │   ├── CollectionsViewModel.swift
│   │   │   └── CollectionDetailViewModel.swift
│   │   └── Models/
│   │       └── Collection.swift
│   │
│   ├── Restaurants/
│   │   ├── Views/
│   │   │   ├── RestaurantSearchView.swift
│   │   │   ├── RestaurantDetailView.swift
│   │   │   └── RestaurantCard.swift
│   │   ├── ViewModels/
│   │   │   ├── RestaurantSearchViewModel.swift
│   │   │   └── RestaurantDetailViewModel.swift
│   │   └── Models/
│   │       └── Restaurant.swift
│   │
│   ├── Groups/
│   │   ├── Views/
│   │   ├── ViewModels/
│   │   └── Models/
│   │
│   ├── Decisions/
│   │   ├── Views/
│   │   ├── ViewModels/
│   │   └── Models/
│   │
│   └── Profile/
│       ├── Views/
│       ├── ViewModels/
│       └── Models/
│
├── Services/
│   ├── Network/
│   │   ├── APIService.swift        # Base API client
│   │   ├── APIEndpoint.swift       # Endpoint definitions
│   │   ├── APIError.swift          # Error types
│   │   └── NetworkMonitor.swift    # Connectivity monitoring
│   │
│   ├── Auth/
│   │   ├── AuthService.swift       # Clerk + Apple Sign-in
│   │   └── TokenManager.swift      # JWT token management
│   │
│   ├── Notifications/
│   │   ├── NotificationService.swift   # FCM integration
│   │   └── PushNotificationManager.swift
│   │
│   ├── Analytics/
│   │   └── AnalyticsService.swift  # Firebase Analytics
│   │
│   └── Storage/
│       ├── CoreDataManager.swift   # Local persistence
│       ├── CacheManager.swift      # URLCache + NSCache
│       └── ImageCache.swift        # Restaurant photos
│
├── Models/
│   ├── DTOs/                       # Data Transfer Objects (API)
│   │   ├── UserDTO.swift
│   │   ├── CollectionDTO.swift
│   │   └── RestaurantDTO.swift
│   │
│   ├── Entities/                   # Core Data entities
│   │   ├── RestaurantEntity.swift
│   │   ├── CollectionEntity.swift
│   │   └── DecisionEntity.swift
│   │
│   └── Domain/                     # Business models
│       ├── User.swift
│       ├── Collection.swift
│       ├── Restaurant.swift
│       ├── Group.swift
│       └── Decision.swift
│
├── Resources/
│   ├── Assets.xcassets             # Images, colors, icons
│   ├── GoogleService-Info.plist    # Firebase config
│   ├── Info.plist                  # App configuration
│   └── Localizable.strings         # Localization
│
└── Supporting Files/
    ├── CoreData/
    │   └── ForkInTheRoad.xcdatamodeld  # Core Data schema
    └── Configurations/
        ├── Dev.xcconfig            # Development config
        ├── Staging.xcconfig        # Staging config
        └── Prod.xcconfig           # Production config
```

---

## 🔄 Data Flow

### Read Flow (Display Data)

```
1. View loads
     ↓
2. ViewModel fetches data
     ↓
3. Service checks cache (Core Data / NSCache)
     ↓
4. If cached: Return immediately
   If not cached: API request → Mobile API (Render)
     ↓
5. Mobile API → MongoDB + External APIs
     ↓
6. Response → Cache → ViewModel
     ↓
7. ViewModel updates @Published property
     ↓
8. SwiftUI auto-updates View
```

### Write Flow (Modify Data)

```
1. User action in View
     ↓
2. ViewModel receives action
     ↓
3. Optimistic update (update UI immediately)
     ↓
4. Service sends request → Mobile API
     ↓
5. API processes → MongoDB
     ↓
6. Success: Keep optimistic update
   Failure: Rollback optimistic update, show error
     ↓
7. Invalidate relevant caches
     ↓
8. Background sync updates other views
```

---

## 🌐 Network Layer

### APIService Architecture

```swift
// Base service - handles all HTTP requests
class APIService {
    static let shared = APIService()
    private let baseURL = Environment.apiBaseURL
    private let session: URLSession

    // Generic request method
    func request<T: Decodable>(
        _ endpoint: APIEndpoint,
        method: HTTPMethod,
        body: Encodable? = nil
    ) async throws -> T {
        // Build URLRequest
        // Add auth headers (JWT from Clerk)
        // Execute request
        // Decode response
        // Handle errors
        return decodedResponse
    }
}

// Endpoint definitions
enum APIEndpoint {
    case collections
    case collection(id: String)
    case restaurants
    case searchRestaurants(query: String)
    case groups
    case decisions

    var path: String {
        switch self {
        case .collections: return "/api/collections"
        case .collection(let id): return "/api/collections/\(id)"
        // ...
        }
    }
}

// Feature-specific services extend base
class CollectionService {
    private let api = APIService.shared

    func fetchCollections() async throws -> [Collection] {
        return try await api.request(.collections, method: .get)
    }

    func createCollection(_ collection: Collection) async throws -> Collection {
        return try await api.request(.collections, method: .post, body: collection)
    }
}
```

### Error Handling

```swift
enum APIError: Error {
    case networkError(URLError)
    case decodingError(DecodingError)
    case serverError(Int, String)
    case unauthorized
    case notFound
    case unknown

    var userMessage: String {
        switch self {
        case .networkError:
            return "No internet connection"
        case .unauthorized:
            return "Please sign in again"
        case .serverError(_, let message):
            return message
        default:
            return "Something went wrong"
        }
    }
}
```

---

## 💾 Data Persistence

### Three-Layer Caching Strategy

**Layer 1: In-Memory Cache (NSCache)**

```swift
// Fast access, automatic eviction
class CacheManager {
    private let cache = NSCache<NSString, AnyObject>()

    func get<T>(_ key: String) -> T? {
        return cache.object(forKey: key as NSString) as? T
    }

    func set<T: AnyObject>(_ value: T, forKey key: String) {
        cache.setObject(value, forKey: key as NSString)
    }
}
```

**Layer 2: URLCache**

```swift
// HTTP response caching
let cache = URLCache(
    memoryCapacity: 50_000_000,   // 50 MB
    diskCapacity: 200_000_000,    // 200 MB
    directory: nil
)
URLCache.shared = cache

// Configure per-request
var request = URLRequest(url: url)
request.cachePolicy = .returnCacheDataElseLoad
```

**Layer 3: Core Data (Persistent)**

```swift
// Long-term storage, offline access
class CoreDataManager {
    static let shared = CoreDataManager()

    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "ForkInTheRoad")
        container.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Core Data failed: \(error)")
            }
        }
        return container
    }()

    var viewContext: NSManagedObjectContext {
        return persistentContainer.viewContext
    }

    func save() {
        if viewContext.hasChanges {
            try? viewContext.save()
        }
    }
}
```

### Cache Strategy by Feature

| Feature      | In-Memory    | URLCache   | Core Data    |
| ------------ | ------------ | ---------- | ------------ |
| Collections  | ✅ (5 min)   | ❌         | ✅ (offline) |
| Restaurants  | ✅ (10 min)  | ✅ (1 day) | ✅ (visited) |
| Groups       | ✅ (5 min)   | ❌         | ✅ (offline) |
| Decisions    | ✅ (1 min)   | ❌         | ✅ (history) |
| User Profile | ✅ (forever) | ❌         | ✅ (offline) |

---

## 🔐 Authentication Flow

### Clerk + Sign in with Apple Integration

```swift
@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var user: User?

    private let authService = AuthService.shared

    // Email/Password via Clerk
    func signIn(email: String, password: String) async throws {
        let clerkUser = try await ClerkSDK.shared.signIn(
            identifier: email,
            password: password
        )
        await handleSuccessfulAuth(clerkUser)
    }

    // Sign in with Apple
    func signInWithApple() async throws {
        let appleCredential = try await requestAppleSignIn()

        // Send to Clerk for account linking
        let clerkUser = try await ClerkSDK.shared.signInWithApple(
            identityToken: appleCredential.identityToken,
            email: appleCredential.email
        )

        await handleSuccessfulAuth(clerkUser)
    }

    private func handleSuccessfulAuth(_ clerkUser: ClerkUser) async {
        // Get JWT token
        let token = try await clerkUser.getToken()

        // Store in Keychain
        KeychainManager.shared.save(token: token)

        // Fetch user profile from mobile API
        let user = try await APIService.shared.fetchCurrentUser()

        // Update state
        self.user = user
        self.isAuthenticated = true

        // Register for push notifications
        await NotificationService.shared.registerDevice()
    }
}
```

---

## 📱 UI Architecture

### SwiftUI + MVVM Pattern

```swift
// View (UI)
struct CollectionsListView: View {
    @StateObject private var viewModel = CollectionsViewModel()

    var body: some View {
        List(viewModel.collections) { collection in
            CollectionRow(collection: collection)
        }
        .task {
            await viewModel.loadCollections()
        }
        .refreshable {
            await viewModel.refresh()
        }
    }
}

// ViewModel (Presentation Logic)
@MainActor
class CollectionsViewModel: ObservableObject {
    @Published var collections: [Collection] = []
    @Published var isLoading = false
    @Published var error: Error?

    private let service = CollectionService()

    func loadCollections() async {
        isLoading = true
        defer { isLoading = false }

        do {
            collections = try await service.fetchCollections()
        } catch {
            self.error = error
        }
    }

    func createCollection(name: String) async {
        // Optimistic update
        let tempCollection = Collection(id: UUID().uuidString, name: name)
        collections.append(tempCollection)

        do {
            let newCollection = try await service.createCollection(tempCollection)
            // Replace temp with real
            if let index = collections.firstIndex(where: { $0.id == tempCollection.id }) {
                collections[index] = newCollection
            }
        } catch {
            // Rollback on error
            collections.removeAll { $0.id == tempCollection.id }
            self.error = error
        }
    }
}
```

---

## 🚀 Performance Optimization

### Key Strategies

**1. Lazy Loading**

```swift
// Load data only when needed
LazyVStack {
    ForEach(restaurants) { restaurant in
        RestaurantRow(restaurant: restaurant)
            .onAppear {
                if restaurant == restaurants.last {
                    viewModel.loadMore()
                }
            }
    }
}
```

**2. Image Optimization**

```swift
// Use SDWebImage or similar for caching
AsyncImage(url: restaurant.photoURL) { image in
    image.resizable().aspectRatio(contentMode: .fill)
} placeholder: {
    ProgressView()
}
.frame(width: 100, height: 100)
.clipShape(RoundedRectangle(cornerRadius: 12))
```

**3. Background Processing**

```swift
Task(priority: .background) {
    // Heavy operations off main thread
    let processedData = await heavyComputation()

    await MainActor.run {
        // UI updates on main thread
        self.data = processedData
    }
}
```

**4. Debouncing Search**

```swift
@Published var searchQuery = ""

private var cancellables = Set<AnyCancellable>()

init() {
    $searchQuery
        .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
        .sink { [weak self] query in
            self?.performSearch(query)
        }
        .store(in: &cancellables)
}
```

---

## 🧪 Testing Architecture

### Unit Tests

```swift
@MainActor
class CollectionsViewModelTests: XCTestCase {
    var viewModel: CollectionsViewModel!
    var mockService: MockCollectionService!

    override func setUp() {
        mockService = MockCollectionService()
        viewModel = CollectionsViewModel(service: mockService)
    }

    func testLoadCollections() async {
        // Given
        mockService.mockCollections = [.fixture1, .fixture2]

        // When
        await viewModel.loadCollections()

        // Then
        XCTAssertEqual(viewModel.collections.count, 2)
        XCTAssertFalse(viewModel.isLoading)
    }
}
```

### Integration Tests

```swift
class APIIntegrationTests: XCTestCase {
    func testFetchCollections() async throws {
        let service = CollectionService()
        let collections = try await service.fetchCollections()
        XCTAssertFalse(collections.isEmpty)
    }
}
```

### UI Tests

```swift
class CollectionsUITests: XCTestCase {
    func testCreateCollection() {
        let app = XCUIApplication()
        app.launch()

        app.buttons["Add Collection"].tap()
        app.textFields["Name"].typeText("My Favorites")
        app.buttons["Create"].tap()

        XCTAssertTrue(app.staticTexts["My Favorites"].exists)
    }
}
```

---

## 📊 Analytics & Monitoring

### Firebase Analytics Integration

```swift
class AnalyticsService {
    static let shared = AnalyticsService()

    func log(event: AnalyticsEvent, parameters: [String: Any]? = nil) {
        Analytics.logEvent(event.name, parameters: parameters)
    }
}

enum AnalyticsEvent {
    case screenView(String)
    case buttonTapped(String)
    case collectionCreated
    case restaurantSearched(String)
    case decisionMade

    var name: String {
        switch self {
        case .screenView(let screen): return "screen_view_\(screen)"
        case .buttonTapped(let button): return "button_\(button)"
        case .collectionCreated: return "collection_created"
        case .restaurantSearched: return "restaurant_searched"
        case .decisionMade: return "decision_made"
        }
    }
}
```

### Crash Reporting

```swift
// Firebase Crashlytics
import FirebaseCrashlytics

class ErrorHandler {
    static func log(_ error: Error, additionalInfo: [String: Any]? = nil) {
        Crashlytics.crashlytics().record(error: error)

        additionalInfo?.forEach { key, value in
            Crashlytics.crashlytics().setCustomValue(value, forKey: key)
        }
    }
}
```

---

## 🔄 State Management

### Environment Objects (Global State)

```swift
@main
struct ForkInTheRoadApp: App {
    @StateObject private var authViewModel = AuthViewModel()
    @StateObject private var themeManager = ThemeManager()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(authViewModel)
                .environmentObject(themeManager)
        }
    }
}

// Access in any view
struct SomeView: View {
    @EnvironmentObject var auth: AuthViewModel

    var body: some View {
        Text("User: \(auth.user?.name ?? "Guest")")
    }
}
```

### StateObject vs ObservedObject

- **@StateObject**: View owns the object (creates it)
- **@ObservedObject**: View observes object created elsewhere
- **@EnvironmentObject**: Passed down view hierarchy

---

## 🎯 Key Architecture Decisions

### Why MVVM?

- **Testability**: ViewModels are easy to unit test
- **Separation**: UI logic separate from business logic
- **SwiftUI Native**: Works naturally with @Published and Combine

### Why Single Mobile API?

- **Resilience**: Independent from web app
- **Optimization**: Mobile-specific endpoints
- **App Store**: Reviewers prefer dedicated mobile infrastructure

### Why Core Data?

- **Offline**: Full offline functionality
- **Performance**: Optimized for iOS
- **Apple Native**: First-class iOS support

### Why Firebase?

- **Cross-Platform**: Works with web app
- **Free Tier**: Generous limits
- **Feature Rich**: Analytics + Crashlytics + FCM in one SDK

---

## 🚀 Next Steps

**For Development**:

1. Review [Component Mapping](./02-component-mapping.md) - Web → iOS conversion
2. Study [API Integration](./03-api-integration.md) - Mobile API details
3. Understand [Authentication Flow](./04-authentication-flow.md) - Clerk + Apple

**Ready to Start**:

- Begin [Epic 1: Foundation](../epic-breakdown/epic-01-foundation.md)
- Set up Xcode project with this architecture
- Create folder structure
- Implement core services

---

**Architecture is the foundation - build it right! 🏗️**
