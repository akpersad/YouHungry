# Data Models Guide

Complete guide to data modeling in the iOS app - Swift structs, Core Data entities, and DTO mappings.

---

## 🎯 Overview

**Three-Layer Data Architecture**:

1. **DTOs (Data Transfer Objects)** - API request/response models
2. **Domain Models** - Business logic models (app's source of truth)
3. **Core Data Entities** - Persistent storage models

**Data Flow**:

```
API (JSON) → DTO (Codable) → Domain Model → Core Data Entity
                                    ↓
                              SwiftUI Views
```

---

## 👤 User Models

### Domain Model

```swift
// Models/Domain/User.swift
import Foundation

struct User: Identifiable, Codable, Equatable {
    let id: String
    let clerkId: String
    let email: String
    let name: String
    let username: String?
    let phoneNumber: String?
    let profilePictureUrl: URL?
    let city: String?
    let state: String?
    let smsOptIn: Bool
    let preferences: UserPreferences
    let createdAt: Date
    let updatedAt: Date

    var fullName: String {
        name
    }

    var displayName: String {
        username ?? name
    }
}

struct UserPreferences: Codable, Equatable {
    var defaultLocation: String?
    var notificationSettings: NotificationSettings

    struct NotificationSettings: Codable, Equatable {
        var smsEnabled: Bool
        var emailEnabled: Bool
        var pushEnabled: Bool
        var groupDecisions: GroupDecisionSettings
        var friendRequests: Bool
        var groupInvites: Bool

        struct GroupDecisionSettings: Codable, Equatable {
            var started: Bool
            var completed: Bool
        }
    }
}
```

### DTO (API Response)

```swift
// Models/DTOs/UserDTO.swift
import Foundation

struct UserDTO: Codable {
    let _id: String
    let clerkId: String
    let email: String
    let name: String
    let username: String?
    let phoneNumber: String?
    let profilePicture: String?
    let city: String?
    let state: String?
    let smsOptIn: Bool
    let preferences: PreferencesDTO
    let createdAt: String
    let updatedAt: String

    // Convert DTO to Domain Model
    func toDomain() -> User {
        User(
            id: _id,
            clerkId: clerkId,
            email: email,
            name: name,
            username: username,
            phoneNumber: phoneNumber,
            profilePictureUrl: profilePicture.flatMap { URL(string: $0) },
            city: city,
            state: state,
            smsOptIn: smsOptIn,
            preferences: preferences.toDomain(),
            createdAt: ISO8601DateFormatter().date(from: createdAt) ?? Date(),
            updatedAt: ISO8601DateFormatter().date(from: updatedAt) ?? Date()
        )
    }
}

struct PreferencesDTO: Codable {
    let defaultLocation: String?
    let notificationSettings: NotificationSettingsDTO

    func toDomain() -> UserPreferences {
        UserPreferences(
            defaultLocation: defaultLocation,
            notificationSettings: notificationSettings.toDomain()
        )
    }
}

struct NotificationSettingsDTO: Codable {
    let smsEnabled: Bool
    let emailEnabled: Bool
    let pushEnabled: Bool
    let groupDecisions: GroupDecisionSettingsDTO
    let friendRequests: Bool
    let groupInvites: Bool

    func toDomain() -> UserPreferences.NotificationSettings {
        UserPreferences.NotificationSettings(
            smsEnabled: smsEnabled,
            emailEnabled: emailEnabled,
            pushEnabled: pushEnabled,
            groupDecisions: groupDecisions.toDomain(),
            friendRequests: friendRequests,
            groupInvites: groupInvites
        )
    }
}

struct GroupDecisionSettingsDTO: Codable {
    let started: Bool
    let completed: Bool

    func toDomain() -> UserPreferences.NotificationSettings.GroupDecisionSettings {
        UserPreferences.NotificationSettings.GroupDecisionSettings(
            started: started,
            completed: completed
        )
    }
}
```

---

## 🍽️ Restaurant Models

### Domain Model

```swift
// Models/Domain/Restaurant.swift
import Foundation
import CoreLocation

struct Restaurant: Identifiable, Codable, Equatable, Hashable {
    let id: String
    let googlePlaceId: String
    let name: String
    let address: String
    let coordinates: Coordinates
    let cuisine: String
    let rating: Double
    let priceRange: PriceRange?
    let timeToPickUp: Int? // minutes
    let photos: [URL]
    let phoneNumber: String?
    let website: URL?
    let hours: [String: String]?
    let cachedAt: Date
    let lastUpdated: Date

    var location: CLLocationCoordinate2D {
        CLLocationCoordinate2D(
            latitude: coordinates.lat,
            longitude: coordinates.lng
        )
    }

    var formattedPrice: String {
        priceRange?.rawValue ?? "N/A"
    }

    var formattedRating: String {
        String(format: "%.1f", rating)
    }
}

struct Coordinates: Codable, Equatable, Hashable {
    let lat: Double
    let lng: Double
}

enum PriceRange: String, Codable, CaseIterable {
    case budget = "$"
    case moderate = "$$"
    case expensive = "$$$"
    case veryExpensive = "$$$$"

    var description: String {
        switch self {
        case .budget: return "Budget-friendly"
        case .moderate: return "Moderate"
        case .expensive: return "Expensive"
        case .veryExpensive: return "Very Expensive"
        }
    }
}
```

### DTO

```swift
// Models/DTOs/RestaurantDTO.swift
import Foundation

struct RestaurantDTO: Codable {
    let _id: String
    let googlePlaceId: String
    let name: String
    let address: String
    let coordinates: CoordinatesDTO
    let cuisine: String
    let rating: Double
    let priceRange: String?
    let timeToPickUp: Int?
    let photos: [String]?
    let phoneNumber: String?
    let website: String?
    let hours: [String: String]?
    let cachedAt: String
    let lastUpdated: String

    func toDomain() -> Restaurant {
        Restaurant(
            id: _id,
            googlePlaceId: googlePlaceId,
            name: name,
            address: address,
            coordinates: coordinates.toDomain(),
            cuisine: cuisine,
            rating: rating,
            priceRange: priceRange.flatMap { PriceRange(rawValue: $0) },
            timeToPickUp: timeToPickUp,
            photos: photos?.compactMap { URL(string: $0) } ?? [],
            phoneNumber: phoneNumber,
            website: website.flatMap { URL(string: $0) },
            hours: hours,
            cachedAt: ISO8601DateFormatter().date(from: cachedAt) ?? Date(),
            lastUpdated: ISO8601DateFormatter().date(from: lastUpdated) ?? Date()
        )
    }
}

struct CoordinatesDTO: Codable {
    let lat: Double
    let lng: Double

    func toDomain() -> Coordinates {
        Coordinates(lat: lat, lng: lng)
    }
}
```

### Core Data Entity

```swift
// Models/Entities/RestaurantEntity+CoreDataClass.swift
import Foundation
import CoreData

@objc(RestaurantEntity)
public class RestaurantEntity: NSManagedObject {

    // Convert to Domain Model
    func toDomain() -> Restaurant? {
        guard let id = id,
              let googlePlaceId = googlePlaceId,
              let name = name,
              let address = address,
              let cuisine = cuisine,
              let cachedAt = cachedAt,
              let lastUpdated = lastUpdated else {
            return nil
        }

        return Restaurant(
            id: id,
            googlePlaceId: googlePlaceId,
            name: name,
            address: address,
            coordinates: Coordinates(lat: latitude, lng: longitude),
            cuisine: cuisine,
            rating: rating,
            priceRange: priceRange.flatMap { PriceRange(rawValue: $0) },
            timeToPickUp: timeToPickUp > 0 ? Int(timeToPickUp) : nil,
            photos: (photos as? [String])?.compactMap { URL(string: $0) } ?? [],
            phoneNumber: phoneNumber,
            website: website.flatMap { URL(string: $0) },
            hours: hours as? [String: String],
            cachedAt: cachedAt,
            lastUpdated: lastUpdated
        )
    }

    // Update from Domain Model
    func update(from restaurant: Restaurant) {
        self.id = restaurant.id
        self.googlePlaceId = restaurant.googlePlaceId
        self.name = restaurant.name
        self.address = restaurant.address
        self.latitude = restaurant.coordinates.lat
        self.longitude = restaurant.coordinates.lng
        self.cuisine = restaurant.cuisine
        self.rating = restaurant.rating
        self.priceRange = restaurant.priceRange?.rawValue
        self.timeToPickUp = Int16(restaurant.timeToPickUp ?? 0)
        self.photos = restaurant.photos.map { $0.absoluteString } as NSArray
        self.phoneNumber = restaurant.phoneNumber
        self.website = restaurant.website?.absoluteString
        self.hours = restaurant.hours as NSDictionary?
        self.cachedAt = restaurant.cachedAt
        self.lastUpdated = restaurant.lastUpdated
    }
}

// Models/Entities/RestaurantEntity+CoreDataProperties.swift
import Foundation
import CoreData

extension RestaurantEntity {
    @NSManaged public var id: String?
    @NSManaged public var googlePlaceId: String?
    @NSManaged public var name: String?
    @NSManaged public var address: String?
    @NSManaged public var latitude: Double
    @NSManaged public var longitude: Double
    @NSManaged public var cuisine: String?
    @NSManaged public var rating: Double
    @NSManaged public var priceRange: String?
    @NSManaged public var timeToPickUp: Int16
    @NSManaged public var photos: NSArray?
    @NSManaged public var phoneNumber: String?
    @NSManaged public var website: String?
    @NSManaged public var hours: NSDictionary?
    @NSManaged public var cachedAt: Date?
    @NSManaged public var lastUpdated: Date?
    @NSManaged public var collections: NSSet?
}
```

---

## 📁 Collection Models

### Domain Model

```swift
// Models/Domain/Collection.swift
import Foundation

struct Collection: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let description: String?
    let type: CollectionType
    let ownerId: String
    var restaurantIds: [String]
    var restaurants: [Restaurant]?
    let createdAt: Date
    let updatedAt: Date

    var restaurantCount: Int {
        restaurants?.count ?? restaurantIds.count
    }

    var isEmpty: Bool {
        restaurantCount == 0
    }
}

enum CollectionType: String, Codable {
    case personal
    case group

    var displayName: String {
        switch self {
        case .personal: return "Personal"
        case .group: return "Group"
        }
    }
}
```

### DTO

```swift
// Models/DTOs/CollectionDTO.swift
import Foundation

struct CollectionDTO: Codable {
    let _id: String
    let name: String
    let description: String?
    let type: String
    let ownerId: String
    let restaurantIds: [String]
    let restaurants: [RestaurantDTO]?
    let createdAt: String
    let updatedAt: String

    func toDomain() -> Collection {
        Collection(
            id: _id,
            name: name,
            description: description,
            type: CollectionType(rawValue: type) ?? .personal,
            ownerId: ownerId,
            restaurantIds: restaurantIds,
            restaurants: restaurants?.map { $0.toDomain() },
            createdAt: ISO8601DateFormatter().date(from: createdAt) ?? Date(),
            updatedAt: ISO8601DateFormatter().date(from: updatedAt) ?? Date()
        )
    }
}
```

---

## 👥 Group Models

### Domain Model

```swift
// Models/Domain/Group.swift
import Foundation

struct Group: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let description: String?
    var adminIds: [String]
    var memberIds: [String]
    var collectionIds: [String]
    var members: [User]?
    var collections: [Collection]?
    let createdAt: Date
    let updatedAt: Date

    var memberCount: Int {
        members?.count ?? memberIds.count
    }

    var collectionCount: Int {
        collections?.count ?? collectionIds.count
    }

    func isAdmin(userId: String) -> Bool {
        adminIds.contains(userId)
    }

    func isMember(userId: String) -> Bool {
        memberIds.contains(userId) || isAdmin(userId: userId)
    }
}
```

---

## 🎲 Decision Models

### Domain Model

```swift
// Models/Domain/Decision.swift
import Foundation

struct Decision: Identifiable, Codable, Equatable {
    let id: String
    let type: DecisionType
    let collectionId: String
    let groupId: String?
    let createdBy: String?
    var participants: [String]
    let method: DecisionMethod
    var status: DecisionStatus
    let deadline: Date?
    let visitDate: Date
    var result: DecisionResult?
    var votes: [Vote]?
    let createdAt: Date
    let updatedAt: Date

    var isActive: Bool {
        status == .active
    }

    var isCompleted: Bool {
        status == .completed
    }

    var hasVoted: Bool {
        // Check if current user has voted
        // Requires current user ID
        false // Placeholder
    }
}

enum DecisionType: String, Codable {
    case personal
    case group
}

enum DecisionMethod: String, Codable {
    case random
    case tiered
    case manual

    var displayName: String {
        switch self {
        case .random: return "Random Selection"
        case .tiered: return "Tiered Voting"
        case .manual: return "Manual Entry"
        }
    }
}

enum DecisionStatus: String, Codable {
    case active
    case completed
    case expired
    case closed
}

struct DecisionResult: Codable, Equatable {
    let restaurantId: String
    var restaurant: Restaurant?
    let selectedAt: Date
    let reasoning: String?
    let weights: [String: Double]?
}

struct Vote: Codable, Equatable, Identifiable {
    var id: String { userId }
    let userId: String
    let rankings: [String] // Restaurant IDs in order
    let submittedAt: Date
    var user: User?
}
```

---

## 🔔 Notification Models

### Domain Model

```swift
// Models/Domain/Notification.swift
import Foundation

struct AppNotification: Identifiable, Codable, Equatable {
    let id: String
    let userId: String
    let type: NotificationType
    let title: String
    let message: String
    var data: [String: String]?
    var read: Bool
    let createdAt: Date
    let updatedAt: Date

    var displayTime: String {
        RelativeDateTimeFormatter().localizedString(for: createdAt, relativeTo: Date())
    }
}

enum NotificationType: String, Codable {
    case groupDecision = "group_decision"
    case friendRequest = "friend_request"
    case groupInvitation = "group_invitation"
    case decisionResult = "decision_result"
    case adminAlert = "admin_alert"

    var icon: String {
        switch self {
        case .groupDecision: return "person.3.fill"
        case .friendRequest: return "person.badge.plus"
        case .groupInvitation: return "envelope.fill"
        case .decisionResult: return "checkmark.circle.fill"
        case .adminAlert: return "bell.fill"
        }
    }
}
```

---

## 🗄️ Core Data Schema

### Data Model Definition

```swift
// Supporting Files/CoreData/ForkInTheRoad.xcdatamodeld

// Entities:
// - RestaurantEntity
// - CollectionEntity
// - DecisionEntity
// - UserEntity

// Relationships:
// Collection → Restaurant (many-to-many)
// Group → Collection (one-to-many)
// Decision → Restaurant (one-to-one for result)
```

### Core Data Manager

```swift
// Services/Storage/CoreDataManager.swift
import CoreData

class CoreDataManager {
    static let shared = CoreDataManager()

    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "ForkInTheRoad")

        container.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Unable to load Core Data: \(error)")
            }
        }

        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy

        return container
    }()

    var viewContext: NSManagedObjectContext {
        persistentContainer.viewContext
    }

    var backgroundContext: NSManagedObjectContext {
        persistentContainer.newBackgroundContext()
    }

    // MARK: - Save

    func save() {
        let context = viewContext

        if context.hasChanges {
            do {
                try context.save()
            } catch {
                let nsError = error as NSError
                print("Core Data save error: \(nsError), \(nsError.userInfo)")
            }
        }
    }

    // MARK: - Fetch

    func fetchRestaurants() -> [RestaurantEntity] {
        let fetchRequest: NSFetchRequest<RestaurantEntity> = RestaurantEntity.fetchRequest()
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "name", ascending: true)]

        do {
            return try viewContext.fetch(fetchRequest)
        } catch {
            print("Fetch error: \(error)")
            return []
        }
    }

    // MARK: - Delete

    func deleteRestaurant(id: String) {
        let fetchRequest: NSFetchRequest<RestaurantEntity> = RestaurantEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", id)

        do {
            let results = try viewContext.fetch(fetchRequest)
            results.forEach { viewContext.delete($0) }
            save()
        } catch {
            print("Delete error: \(error)")
        }
    }

    // MARK: - Clear All

    func clearAll() {
        let entities = persistentContainer.managedObjectModel.entities

        entities.forEach { entity in
            guard let name = entity.name else { return }

            let fetchRequest = NSFetchRequest<NSFetchRequestResult>(entityName: name)
            let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)

            do {
                try viewContext.execute(deleteRequest)
            } catch {
                print("Clear error for \(name): \(error)")
            }
        }

        save()
    }
}
```

---

## 🧪 Mock Data

### Test Fixtures

```swift
// Models/Mock/MockData.swift
#if DEBUG
extension Restaurant {
    static let mock1 = Restaurant(
        id: "1",
        googlePlaceId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
        name: "The Burger Joint",
        address: "123 Main St, San Francisco, CA 94102",
        coordinates: Coordinates(lat: 37.7749, lng: -122.4194),
        cuisine: "American",
        rating: 4.5,
        priceRange: .moderate,
        timeToPickUp: 15,
        photos: [URL(string: "https://via.placeholder.com/400")!],
        phoneNumber: "(415) 555-0123",
        website: URL(string: "https://burgerjo int.com"),
        hours: ["Monday": "11:00 AM - 10:00 PM"],
        cachedAt: Date(),
        lastUpdated: Date()
    )

    static let mock2 = Restaurant(
        id: "2",
        googlePlaceId: "ChIJN1t_tDeuEmsRUsoyG83frY5",
        name: "Sushi Paradise",
        address: "456 Market St, San Francisco, CA 94103",
        coordinates: Coordinates(lat: 37.7849, lng: -122.4094),
        cuisine: "Japanese",
        rating: 4.8,
        priceRange: .expensive,
        timeToPickUp: 25,
        photos: [URL(string: "https://via.placeholder.com/400")!],
        phoneNumber: "(415) 555-0456",
        website: URL(string: "https://sushi.com"),
        hours: ["Monday": "12:00 PM - 11:00 PM"],
        cachedAt: Date(),
        lastUpdated: Date()
    )
}

extension Collection {
    static let mock1 = Collection(
        id: "1",
        name: "My Favorites",
        description: "Best restaurants in SF",
        type: .personal,
        ownerId: "user1",
        restaurantIds: ["1", "2"],
        restaurants: [.mock1, .mock2],
        createdAt: Date(),
        updatedAt: Date()
    )
}

extension User {
    static let mock = User(
        id: "1",
        clerkId: "clerk_123",
        email: "test@example.com",
        name: "John Doe",
        username: "johndoe",
        phoneNumber: "+15555551234",
        profilePictureUrl: nil,
        city: "San Francisco",
        state: "CA",
        smsOptIn: true,
        preferences: UserPreferences(
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
        ),
        createdAt: Date(),
        updatedAt: Date()
    )
}
#endif
```

---

## ✅ Data Model Checklist

When creating a new model:

- [ ] Define Domain Model (source of truth)
- [ ] Define DTO for API (Codable)
- [ ] Create Core Data Entity (if needs persistence)
- [ ] Implement `toDomain()` conversion methods
- [ ] Implement `update(from:)` for Core Data entities
- [ ] Add mock data for testing
- [ ] Implement Equatable/Hashable (if needed)
- [ ] Add computed properties for UI convenience
- [ ] Document complex properties
- [ ] Write unit tests for conversions

---

**Next**: [Offline Strategy Guide](./06-offline-strategy.md)

**Data models are the foundation - structure them well! 📊**
