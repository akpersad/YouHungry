# Testing Strategy Guide

Comprehensive testing strategy for Fork In The Road? iOS app.

---

## 🎯 Testing Philosophy

**Test Pyramid**:

```
        🔺 UI Tests (10%)
       /   \ End-to-end, critical paths
      /     \
     / Integration Tests (30%)
    /   Feature workflows     \
   /                           \
  / Unit Tests (60%)            \
 /   ViewModels, Services, Utils  \
/___________________________________\
```

**Coverage Goals**:

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All major features
- **UI Tests**: Critical user journeys only

---

## 🧪 Unit Testing

### ViewModel Tests

```swift
// Features/Collections/ViewModels/CollectionsViewModelTests.swift
import XCTest
@testable import ForkInTheRoad

@MainActor
final class CollectionsViewModelTests: XCTestCase {
    var viewModel: CollectionsViewModel!
    var mockService: MockCollectionService!

    override func setUp() async throws {
        mockService = MockCollectionService()
        viewModel = CollectionsViewModel(service: mockService)
    }

    override func tearDown() {
        viewModel = nil
        mockService = nil
    }

    // MARK: - Load Collections Tests

    func testLoadCollectionsSuccess() async {
        // Given
        let expectedCollections = [Collection.mock1, Collection.mock2]
        mockService.mockCollections = expectedCollections

        // When
        await viewModel.loadCollections()

        // Then
        XCTAssertEqual(viewModel.collections.count, 2)
        XCTAssertEqual(viewModel.collections, expectedCollections)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.error)
    }

    func testLoadCollectionsFailure() async {
        // Given
        mockService.shouldFail = true
        mockService.errorToThrow = APIError.networkError(URLError(.notConnectedToInternet))

        // When
        await viewModel.loadCollections()

        // Then
        XCTAssertTrue(viewModel.collections.isEmpty)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNotNil(viewModel.error)
    }

    // MARK: - Create Collection Tests

    func testCreateCollectionSuccess() async {
        // Given
        let name = "My Favorites"
        let description = "Best restaurants"
        mockService.mockCreatedCollection = Collection.mock1

        // When
        await viewModel.createCollection(name: name, description: description)

        // Then
        XCTAssertEqual(viewModel.collections.count, 1)
        XCTAssertEqual(viewModel.collections.first?.name, "My Favorites")
        XCTAssertNil(viewModel.error)
    }

    func testCreateCollectionOptimisticUpdate() async {
        // Given
        let name = "Test Collection"
        mockService.shouldDelay = true // Simulate slow network

        // When
        Task {
            await viewModel.createCollection(name: name, description: nil)
        }

        // Wait a bit for optimistic update
        try? await Task.sleep(nanoseconds: 100_000_000) // 0.1 second

        // Then - should show optimistic update immediately
        XCTAssertFalse(viewModel.collections.isEmpty, "Optimistic update should show collection immediately")
    }

    // MARK: - Delete Collection Tests

    func testDeleteCollectionSuccess() async {
        // Given
        viewModel.collections = [.mock1, .mock2]
        let collectionToDelete = Collection.mock1

        // When
        await viewModel.deleteCollection(id: collectionToDelete.id)

        // Then
        XCTAssertEqual(viewModel.collections.count, 1)
        XCTAssertFalse(viewModel.collections.contains { $0.id == collectionToDelete.id })
    }
}

// MARK: - Mock Service

class MockCollectionService: CollectionServiceProtocol {
    var mockCollections: [Collection] = []
    var mockCreatedCollection: Collection?
    var shouldFail = false
    var shouldDelay = false
    var errorToThrow: Error?

    func fetchCollections() async throws -> [Collection] {
        if shouldDelay {
            try await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds
        }

        if shouldFail {
            throw errorToThrow ?? APIError.serverError("Mock error")
        }

        return mockCollections
    }

    func createCollection(_ collection: Collection) async throws -> Collection {
        if shouldFail {
            throw errorToThrow ?? APIError.serverError("Mock error")
        }

        return mockCreatedCollection ?? collection
    }

    func deleteCollection(id: String) async throws {
        if shouldFail {
            throw errorToThrow ?? APIError.serverError("Mock error")
        }
    }
}

// Service protocol for dependency injection
protocol CollectionServiceProtocol {
    func fetchCollections() async throws -> [Collection]
    func createCollection(_ collection: Collection) async throws -> Collection
    func deleteCollection(id: String) async throws
}
```

### Service Tests

```swift
// Services/CollectionServiceTests.swift
import XCTest
@testable import ForkInTheRoad

final class CollectionServiceTests: XCTestCase {
    var service: CollectionService!
    var mockAPI: MockAPIService!

    override func setUp() {
        mockAPI = MockAPIService()
        service = CollectionService(apiService: mockAPI)
    }

    func testFetchCollections() async throws {
        // Given
        mockAPI.mockResponse = CollectionsResponse(
            collections: [.mock1, .mock2]
        )

        // When
        let collections = try await service.fetchCollections()

        // Then
        XCTAssertEqual(collections.count, 2)
        XCTAssertEqual(mockAPI.requestedEndpoint, .collections)
        XCTAssertEqual(mockAPI.requestedMethod, .get)
    }

    func testCreateCollection() async throws {
        // Given
        let newCollection = Collection.mock1
        mockAPI.mockResponse = newCollection

        // When
        let created = try await service.createCollection(newCollection)

        // Then
        XCTAssertEqual(created.id, newCollection.id)
        XCTAssertEqual(mockAPI.requestedEndpoint, .createCollection)
        XCTAssertEqual(mockAPI.requestedMethod, .post)
    }
}
```

---

## 🔗 Integration Testing

### Feature Integration Tests

```swift
// Tests/Integration/RestaurantSearchIntegrationTests.swift
import XCTest
@testable import ForkInTheRoad

final class RestaurantSearchIntegrationTests: XCTestCase {
    var viewModel: RestaurantSearchViewModel!

    override func setUp() async throws {
        // Use real services but with test configuration
        viewModel = RestaurantSearchViewModel()
    }

    func testSearchFlow() async throws {
        // When - Search for restaurants
        await viewModel.search(query: "pizza", location: "San Francisco")

        // Then
        XCTAssertFalse(viewModel.restaurants.isEmpty, "Should find restaurants")
        XCTAssertFalse(viewModel.isLoading)

        // When - Select a restaurant
        let firstRestaurant = try XCTUnwrap(viewModel.restaurants.first)
        await viewModel.selectRestaurant(firstRestaurant)

        // Then
        XCTAssertEqual(viewModel.selectedRestaurant?.id, firstRestaurant.id)
    }

    func testAddToCollectionFlow() async throws {
        // Given - Load collections
        let collectionsVM = CollectionsViewModel()
        await collectionsVM.loadCollections()
        guard let collection = collectionsVM.collections.first else {
            XCTFail("No collections available")
            return
        }

        // When - Search and add restaurant
        await viewModel.search(query: "pizza", location: "San Francisco")
        let restaurant = try XCTUnwrap(viewModel.restaurants.first)
        await viewModel.addToCollection(restaurant: restaurant, collectionId: collection.id)

        // Then - Reload collection and verify
        await collectionsVM.loadCollections()
        let updatedCollection = collectionsVM.collections.first { $0.id == collection.id }
        XCTAssertTrue(updatedCollection?.restaurantIds.contains(restaurant.id) ?? false)
    }
}
```

---

## 📱 UI Testing

### Critical Path Tests

```swift
// UITests/CriticalPathsUITests.swift
import XCTest

final class CriticalPathsUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["UI-Testing"]
        app.launch()
    }

    // MARK: - Sign In Flow

    func testSignInFlow() {
        // Given - On sign in screen
        XCTAssertTrue(app.staticTexts["Welcome Back!"].exists)

        // When - Enter credentials
        let emailField = app.textFields["Email"]
        emailField.tap()
        emailField.typeText("test@example.com")

        let passwordField = app.secureTextFields["Password"]
        passwordField.tap()
        passwordField.typeText("password123")

        // When - Tap sign in
        app.buttons["Sign In"].tap()

        // Then - Should see main app
        XCTAssertTrue(app.tabBars.buttons["Collections"].waitForExistence(timeout: 5))
    }

    // MARK: - Create Collection Flow

    func testCreateCollectionFlow() {
        // Given - Signed in
        signInTestUser()

        // When - Navigate to collections
        app.tabBars.buttons["Collections"].tap()

        // When - Tap create
        app.navigationBars.buttons["Add"].tap()

        // When - Fill form
        let nameField = app.textFields["Collection Name"]
        nameField.tap()
        nameField.typeText("My Test Collection")

        app.buttons["Create"].tap()

        // Then - Should see new collection
        XCTAssertTrue(app.staticTexts["My Test Collection"].waitForExistence(timeout: 3))
    }

    // MARK: - Restaurant Search Flow

    func testRestaurantSearchFlow() {
        // Given
        signInTestUser()

        // When - Search restaurants
        app.navigationBars.searchFields.firstMatch.tap()
        app.navigationBars.searchFields.firstMatch.typeText("pizza")

        // Then - Should show results
        XCTAssertTrue(app.cells.firstMatch.waitForExistence(timeout: 5))

        // When - Tap restaurant
        app.cells.firstMatch.tap()

        // Then - Should show details
        XCTAssertTrue(app.buttons["Add to Collection"].exists)
    }

    // MARK: - Group Decision Flow

    func testGroupDecisionFlow() {
        // Given
        signInTestUser()

        // When - Navigate to groups
        app.tabBars.buttons["Groups"].tap()

        // When - Select group
        app.cells.firstMatch.tap()

        // When - Start decision
        app.buttons["Start Decision"].tap()

        // When - Vote
        // Drag restaurants to rank them
        let firstRestaurant = app.cells.firstMatch
        let secondRestaurant = app.cells.element(boundBy: 1)

        firstRestaurant.press(forDuration: 1.0)
        // Note: Drag testing requires more complex implementation

        app.buttons["Submit Vote"].tap()

        // Then
        XCTAssertTrue(app.staticTexts["✓ You've Voted"].exists)
    }

    // MARK: - Helper Methods

    private func signInTestUser() {
        // Assumes test user exists in backend
        let emailField = app.textFields["Email"]
        emailField.tap()
        emailField.typeText("test@example.com")

        let passwordField = app.secureTextFields["Password"]
        passwordField.tap()
        passwordField.typeText("password123")

        app.buttons["Sign In"].tap()

        // Wait for main screen
        _ = app.tabBars.buttons["Collections"].waitForExistence(timeout: 5)
    }
}
```

---

## 📸 Snapshot Testing

### SwiftUI Snapshot Tests

```swift
// Tests/Snapshot/SnapshotTests.swift
import XCTest
import SnapshotTesting
@testable import ForkInTheRoad

final class SnapshotTests: XCTestCase {
    func testRestaurantCard() {
        let card = RestaurantCard(restaurant: .mock1)
            .frame(width: 350)

        assertSnapshot(matching: card, as: .image)
    }

    func testRestaurantCardDarkMode() {
        let card = RestaurantCard(restaurant: .mock1)
            .frame(width: 350)
            .preferredColorScheme(.dark)

        assertSnapshot(matching: card, as: .image)
    }

    func testCollectionsList() {
        let view = CollectionsListView()
            .frame(width: 390, height: 844) // iPhone 16 Pro size

        assertSnapshot(matching: view, as: .image)
    }
}
```

---

## 🔄 Mocking Strategy

### Mock Services

```swift
// Tests/Mocks/MockServices.swift
import Foundation
@testable import ForkInTheRoad

// Mock API Service
class MockAPIService {
    var mockResponse: Any?
    var shouldFail = false
    var errorToThrow: Error?
    var requestedEndpoint: APIEndpoint?
    var requestedMethod: HTTPMethod?
    var requestDelay: TimeInterval = 0

    func request<T: Decodable>(
        _ endpoint: APIEndpoint,
        method: HTTPMethod,
        body: Encodable?
    ) async throws -> T {
        requestedEndpoint = endpoint
        requestedMethod = method

        if requestDelay > 0 {
            try await Task.sleep(nanoseconds: UInt64(requestDelay * 1_000_000_000))
        }

        if shouldFail {
            throw errorToThrow ?? APIError.serverError("Mock error")
        }

        guard let response = mockResponse as? T else {
            throw APIError.decodingError(DecodingError.dataCorrupted(.init(codingPath: [], debugDescription: "Mock response type mismatch")))
        }

        return response
    }
}

// Mock Notification Service
class MockNotificationService {
    var didRegisterDevice = false
    var didUnregisterDevice = false
    var registeredToken: String?

    func registerDevice(fcmToken: String) async {
        didRegisterDevice = true
        registeredToken = fcmToken
    }

    func unregisterDevice() async {
        didUnregisterDevice = true
    }
}

// Mock Analytics Service
class MockAnalyticsService {
    var loggedEvents: [(event: String, parameters: [String: Any]?)] = []

    func log(event: AnalyticsEvent, parameters: [String: Any]?) {
        loggedEvents.append((event.name, parameters))
    }
}
```

---

## ⚡ Performance Testing

### Measure Performance

```swift
// Tests/Performance/PerformanceTests.swift
import XCTest
@testable import ForkInTheRoad

final class PerformanceTests: XCTestCase {
    func testCollectionLoadPerformance() {
        let viewModel = CollectionsViewModel()

        measure {
            // Measure async code
            let expectation = expectation(description: "Load collections")

            Task {
                await viewModel.loadCollections()
                expectation.fulfill()
            }

            wait(for: [expectation], timeout: 5.0)
        }
    }

    func testRestaurantSearchPerformance() {
        let viewModel = RestaurantSearchViewModel()

        measure {
            let expectation = expectation(description: "Search restaurants")

            Task {
                await viewModel.search(query: "pizza", location: "San Francisco")
                expectation.fulfill()
            }

            wait(for: [expectation], timeout: 10.0)
        }
    }

    func testImageCachingPerformance() {
        let urls = (1...100).map { _ in
            URL(string: "https://via.placeholder.com/400")!
        }

        measure {
            for url in urls {
                _ = ImageCacheManager.shared.getCachedImage(url: url)
            }
        }
    }
}
```

---

## 🎭 UI Test Helpers

### Test Utilities

```swift
// UITests/Helpers/XCUITestHelpers.swift
import XCTest

extension XCUIElement {
    func clearAndType(_ text: String) {
        tap()

        // Clear existing text
        if let value = value as? String, !value.isEmpty {
            let deleteString = String(repeating: XCUIKeyboardKey.delete.rawValue, count: value.count)
            typeText(deleteString)
        }

        typeText(text)
    }

    func waitForExistenceAndTap(timeout: TimeInterval = 5) -> Bool {
        guard waitForExistence(timeout: timeout) else {
            return false
        }
        tap()
        return true
    }
}

extension XCTestCase {
    func waitForElementToDisappear(_ element: XCUIElement, timeout: TimeInterval = 5) -> Bool {
        let predicate = NSPredicate(format: "exists == false")
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)

        let result = XCTWaiter.wait(for: [expectation], timeout: timeout)
        return result == .completed
    }

    func takeScreenshot(name: String) {
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
```

---

## 🧩 Test Data

### Fixture Factory

```swift
// Tests/Fixtures/Fixtures.swift
import Foundation
@testable import ForkInTheRoad

enum Fixtures {
    // MARK: - Users

    static let user1 = User(
        id: "user1",
        clerkId: "clerk_123",
        email: "test@example.com",
        name: "Test User",
        username: "testuser",
        phoneNumber: "+15555551234",
        profilePictureUrl: nil,
        city: "San Francisco",
        state: "CA",
        smsOptIn: true,
        preferences: .default,
        createdAt: Date(),
        updatedAt: Date()
    )

    // MARK: - Restaurants

    static let restaurant1 = Restaurant(
        id: "rest1",
        googlePlaceId: "place123",
        name: "Test Restaurant",
        address: "123 Main St",
        coordinates: Coordinates(lat: 37.7749, lng: -122.4194),
        cuisine: "American",
        rating: 4.5,
        priceRange: .moderate,
        timeToPickUp: 15,
        photos: [],
        phoneNumber: "(415) 555-0123",
        website: nil,
        hours: nil,
        cachedAt: Date(),
        lastUpdated: Date()
    )

    // MARK: - Collections

    static let collection1 = Collection(
        id: "col1",
        name: "My Favorites",
        description: "Best restaurants",
        type: .personal,
        ownerId: "user1",
        restaurantIds: ["rest1"],
        restaurants: [restaurant1],
        createdAt: Date(),
        updatedAt: Date()
    )

    // MARK: - Groups

    static let group1 = Group(
        id: "group1",
        name: "Dinner Crew",
        description: "Weekly dinner group",
        adminIds: ["user1"],
        memberIds: ["user1", "user2", "user3"],
        collectionIds: ["col1"],
        members: nil,
        collections: nil,
        createdAt: Date(),
        updatedAt: Date()
    )
}

extension UserPreferences {
    static let `default` = UserPreferences(
        defaultLocation: "San Francisco, CA",
        notificationSettings: UserPreferences.NotificationSettings(
            smsEnabled: true,
            emailEnabled: true,
            pushEnabled: true,
            groupDecisions: UserPreferences.NotificationSettings.GroupDecisionSettings(
                started: true,
                completed: true
            ),
            friendRequests: true,
            groupInvites: true
        )
    )
}
```

---

## 🚀 Test Configuration

### Test Scheme Setup

```swift
// Add to Info.plist for UI Testing
<key>IS_UI_TESTING</key>
<string>$(IS_UI_TESTING)</string>

// In app code
#if DEBUG
extension UIApplication {
    static var isUITesting: Bool {
        ProcessInfo.processInfo.arguments.contains("UI-Testing")
    }
}
#endif

// Use for test-specific behavior
if UIApplication.isUITesting {
    // Use mock data
    // Skip onboarding
    // Disable analytics
}
```

### Test User Setup

```swift
// Create test users in database (run once)
// Script or admin panel to create:
// - test@example.com (password: password123)
// - With sample collections, groups, restaurants
// - Premium subscription enabled
```

---

## 📊 Code Coverage

### Xcode Code Coverage

**Enable Coverage**:

1. Edit Scheme (Cmd+<)
2. Test → Options
3. Check "Code Coverage" ✅
4. Select targets to include

**View Coverage**:

1. Run tests (Cmd+U)
2. Show Report Navigator (Cmd+9)
3. Select test report
4. Click Coverage tab
5. See per-file coverage

**Coverage Goals**:

- ViewModels: 90%+
- Services: 85%+
- Models: 70%+ (mostly boilerplate)
- Views: 50%+ (harder to test declarative UI)

---

## 🧪 Test Execution

### Run Tests Locally

```bash
# Run all tests
xcodebuild test \
  -project ForkInTheRoad.xcodeproj \
  -scheme ForkInTheRoad \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro'

# Run specific test
xcodebuild test \
  -project ForkInTheRoad.xcodeproj \
  -scheme ForkInTheRoad \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro' \
  -only-testing:ForkInTheRoadTests/CollectionsViewModelTests

# Generate coverage report
xcodebuild test \
  -project ForkInTheRoad.xcodeproj \
  -scheme ForkInTheRoad \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro' \
  -enableCodeCoverage YES
```

### CI/CD Integration

```yaml
# .github/workflows/ios-tests.yml
name: iOS Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest

    steps:
      - uses: actions/checkout@v3

      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode_26.0.app

      - name: Run Unit Tests
        run: |
          xcodebuild test \
            -project ForkInTheRoad.xcodeproj \
            -scheme ForkInTheRoad \
            -destination 'platform=iOS Simulator,name=iPhone 16 Pro' \
            -enableCodeCoverage YES

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
```

---

## ✅ Testing Checklist

**Unit Tests**:

- [ ] All ViewModels tested (80%+ coverage)
- [ ] All Services tested
- [ ] Model conversions tested (DTO → Domain)
- [ ] Utility functions tested
- [ ] Error handling tested

**Integration Tests**:

- [ ] Authentication flow
- [ ] Collection CRUD flow
- [ ] Restaurant search flow
- [ ] Group management flow
- [ ] Decision voting flow

**UI Tests**:

- [ ] Sign in flow
- [ ] Sign up flow
- [ ] Create collection
- [ ] Search restaurants
- [ ] Add to collection
- [ ] Group decision voting
- [ ] View decision result

**Performance Tests**:

- [ ] API response times
- [ ] View rendering
- [ ] Image loading
- [ ] Database queries

**Manual Testing**:

- [ ] Test on physical device
- [ ] Test in airplane mode (offline)
- [ ] Test with poor network
- [ ] Test push notifications
- [ ] Test biometric auth
- [ ] Test on iOS 16 (minimum supported)
- [ ] Test on iOS 26 (latest features)

---

**All agent guides complete! Ready for epic breakdowns! 🚀**

**Next**: Start generating [Epic Breakdowns](../epic-breakdown/)
