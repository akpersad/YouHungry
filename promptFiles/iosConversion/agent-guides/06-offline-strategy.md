# Offline Strategy Guide

Complete offline functionality implementation for Fork In The Road iOS app.

---

## 🎯 Offline Features (Per User Request)

**What Works Offline**:

- ✅ View previously loaded collections and restaurants
- ✅ Browse restaurant details (photos, address, ratings) from cache
- ✅ View decision history
- ✅ View group memberships and member lists
- ✅ Create new collections (sync when online)
- ✅ View map locations from cache

**What Requires Internet**:

- ❌ Search new restaurants (Google Places API)
- ❌ Submit votes on active decisions (real-time collaboration)
- ❌ Add restaurants to collections (needs API)
- ❌ Sign in (needs Clerk API)

---

## 🗄️ Core Data Schema

### Entity Definitions

```swift
// RestaurantEntity
@objc(RestaurantEntity)
public class RestaurantEntity: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var googlePlaceId: String
    @NSManaged public var name: String
    @NSManaged public var address: String
    @NSManaged public var latitude: Double
    @NSManaged public var longitude: Double
    @NSManaged public var cuisine: String
    @NSManaged public var rating: Double
    @NSManaged public var priceRange: String?
    @NSManaged public var photoURLs: [String]
    @NSManaged public var phoneNumber: String?
    @NSManaged public var cachedAt: Date
    @NSManaged public var lastUpdated: Date
}

// CollectionEntity
@objc(CollectionEntity)
public class CollectionEntity: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var name: String
    @NSManaged public var descriptionText: String?
    @NSManaged public var type: String
    @NSManaged public var ownerId: String
    @NSManaged public var restaurantIds: [String]
    @NSManaged public var createdAt: Date
    @NSManaged public var updatedAt: Date
    @NSManaged public var restaurants: NSSet?
    @NSManaged public var syncStatus: String // "synced", "pending", "conflict"
}

// DecisionEntity
@objc(DecisionEntity)
public class DecisionEntity: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var type: String
    @NSManaged public var collectionId: String
    @NSManaged public var method: String
    @NSManaged public var status: String
    @NSManaged public var visitDate: Date
    @NSManaged public var resultRestaurantId: String?
    @NSManaged public var createdAt: Date
}

// GroupEntity
@objc(GroupEntity)
public class GroupEntity: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var name: String
    @NSManaged public var descriptionText: String?
    @NSManaged public var adminIds: [String]
    @NSManaged public var memberIds: [String]
    @NSManaged public var cachedAt: Date
}
```

---

## 💾 Offline Data Manager

### Core Data Operations

```swift
// Services/Storage/OfflineDataManager.swift
import CoreData
import Foundation

@MainActor
class OfflineDataManager: ObservableObject {
    static let shared = OfflineDataManager()

    private let coreData = CoreDataManager.shared

    // MARK: - Collections

    func saveCollection(_ collection: Collection) {
        let context = coreData.viewContext

        // Check if exists
        let fetchRequest: NSFetchRequest<CollectionEntity> = CollectionEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", collection.id)

        do {
            let results = try context.fetch(fetchRequest)
            let entity = results.first ?? CollectionEntity(context: context)

            entity.id = collection.id
            entity.name = collection.name
            entity.descriptionText = collection.description
            entity.type = collection.type.rawValue
            entity.ownerId = collection.ownerId
            entity.restaurantIds = collection.restaurantIds
            entity.createdAt = collection.createdAt
            entity.updatedAt = collection.updatedAt
            entity.syncStatus = "synced"

            coreData.save()
        } catch {
            print("Save collection error: \(error)")
        }
    }

    func fetchCollections() -> [Collection] {
        let fetchRequest: NSFetchRequest<CollectionEntity> = CollectionEntity.fetchRequest()
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "updatedAt", ascending: false)]

        do {
            let entities = try coreData.viewContext.fetch(fetchRequest)
            return entities.compactMap { entity in
                Collection(
                    id: entity.id,
                    name: entity.name,
                    description: entity.descriptionText,
                    type: CollectionType(rawValue: entity.type) ?? .personal,
                    ownerId: entity.ownerId,
                    restaurantIds: entity.restaurantIds,
                    restaurants: nil,
                    createdAt: entity.createdAt,
                    updatedAt: entity.updatedAt
                )
            }
        } catch {
            print("Fetch collections error: \(error)")
            return []
        }
    }

    // MARK: - Restaurants

    func saveRestaurant(_ restaurant: Restaurant) {
        let context = coreData.viewContext

        let fetchRequest: NSFetchRequest<RestaurantEntity> = RestaurantEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", restaurant.id)

        do {
            let results = try context.fetch(fetchRequest)
            let entity = results.first ?? RestaurantEntity(context: context)
            entity.update(from: restaurant)

            coreData.save()
        } catch {
            print("Save restaurant error: \(error)")
        }
    }

    func fetchRestaurants(for collectionId: String) -> [Restaurant] {
        // First get collection
        guard let collection = fetchCollection(id: collectionId) else {
            return []
        }

        // Fetch restaurants by IDs
        let fetchRequest: NSFetchRequest<RestaurantEntity> = RestaurantEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id IN %@", collection.restaurantIds)

        do {
            let entities = try coreData.viewContext.fetch(fetchRequest)
            return entities.compactMap { $0.toDomain() }
        } catch {
            print("Fetch restaurants error: \(error)")
            return []
        }
    }

    private func fetchCollection(id: String) -> Collection? {
        let fetchRequest: NSFetchRequest<CollectionEntity> = CollectionEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", id)

        do {
            let results = try coreData.viewContext.fetch(fetchRequest)
            return results.first.flatMap { entity in
                Collection(
                    id: entity.id,
                    name: entity.name,
                    description: entity.descriptionText,
                    type: CollectionType(rawValue: entity.type) ?? .personal,
                    ownerId: entity.ownerId,
                    restaurantIds: entity.restaurantIds,
                    restaurants: nil,
                    createdAt: entity.createdAt,
                    updatedAt: entity.updatedAt
                )
            }
        } catch {
            return nil
        }
    }

    // MARK: - Groups

    func saveGroup(_ group: Group) {
        let context = coreData.viewContext

        let fetchRequest: NSFetchRequest<GroupEntity> = GroupEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", group.id)

        do {
            let results = try context.fetch(fetchRequest)
            let entity = results.first ?? GroupEntity(context: context)

            entity.id = group.id
            entity.name = group.name
            entity.descriptionText = group.description
            entity.adminIds = group.adminIds
            entity.memberIds = group.memberIds
            entity.cachedAt = Date()

            coreData.save()
        } catch {
            print("Save group error: \(error)")
        }
    }

    func fetchGroups() -> [Group] {
        let fetchRequest: NSFetchRequest<GroupEntity> = GroupEntity.fetchRequest()
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "name", ascending: true)]

        do {
            let entities = try coreData.viewContext.fetch(fetchRequest)
            return entities.map { entity in
                Group(
                    id: entity.id,
                    name: entity.name,
                    description: entity.descriptionText,
                    adminIds: entity.adminIds,
                    memberIds: entity.memberIds,
                    collectionIds: [],
                    members: nil,
                    collections: nil,
                    createdAt: Date(),
                    updatedAt: Date()
                )
            }
        } catch {
            print("Fetch groups error: \(error)")
            return []
        }
    }
}
```

---

## 🔄 Sync Manager

### Background Sync Strategy

```swift
// Services/Storage/SyncManager.swift
import Foundation
import Network

@MainActor
class SyncManager: ObservableObject {
    static let shared = SyncManager()

    @Published var isSyncing = false
    @Published var lastSyncDate: Date?
    @Published var pendingSyncCount = 0

    private let offlineData = OfflineDataManager.shared
    private let api = APIService.shared
    private let networkMonitor = NetworkMonitor.shared

    private var syncTask: Task<Void, Never>?

    init() {
        // Start monitoring network
        setupNetworkMonitoring()
    }

    // MARK: - Network Monitoring

    private func setupNetworkMonitoring() {
        // When connection restored, auto-sync
        networkMonitor.$isConnected
            .dropFirst() // Ignore initial value
            .filter { $0 == true } // Only when becomes connected
            .sink { [weak self] _ in
                Task {
                    await self?.syncAll()
                }
            }
            .store(in: &cancellables)
    }

    // MARK: - Sync All Data

    func syncAll() async {
        guard networkMonitor.isConnected else {
            print("Cannot sync - offline")
            return
        }

        guard !isSyncing else {
            print("Sync already in progress")
            return
        }

        isSyncing = true
        defer { isSyncing = false }

        do {
            // Sync collections
            try await syncCollections()

            // Sync restaurants
            try await syncRestaurants()

            // Sync groups
            try await syncGroups()

            // Sync decisions
            try await syncDecisions()

            lastSyncDate = Date()
            pendingSyncCount = 0

        } catch {
            print("Sync error: \(error)")
        }
    }

    // MARK: - Sync Collections

    private func syncCollections() async throws {
        // Fetch from API
        let apiCollections: [Collection] = try await api.get(.collections)

        // Save to Core Data
        apiCollections.forEach { collection in
            offlineData.saveCollection(collection)
        }

        // Check for offline-created collections
        let localCollections = offlineData.fetchCollections()
        let offlineCreated = localCollections.filter { local in
            !apiCollections.contains { $0.id == local.id }
        }

        // Upload offline-created collections
        for collection in offlineCreated {
            do {
                let created: Collection = try await api.post(.createCollection, body: collection)
                offlineData.saveCollection(created)
            } catch {
                print("Failed to sync collection \(collection.name): \(error)")
            }
        }
    }

    private func syncRestaurants() async throws {
        // Similar pattern for restaurants
    }

    private func syncGroups() async throws {
        // Similar pattern for groups
    }

    private func syncDecisions() async throws {
        // Similar pattern for decisions
    }

    private var cancellables = Set<AnyCancellable>()
}
```

---

## 📱 Offline-Aware ViewModels

### CollectionsViewModel with Offline Support

```swift
// Features/Collections/ViewModels/CollectionsViewModel.swift
import Foundation
import Combine

@MainActor
class CollectionsViewModel: ObservableObject {
    @Published var collections: [Collection] = []
    @Published var isLoading = false
    @Published var isOffline = false
    @Published var error: String?

    private let api = APIService.shared
    private let offlineData = OfflineDataManager.shared
    private let networkMonitor = NetworkMonitor.shared
    private let syncManager = SyncManager.shared

    private var cancellables = Set<AnyCancellable>()

    init() {
        setupNetworkMonitoring()
    }

    private func setupNetworkMonitoring() {
        networkMonitor.$isConnected
            .sink { [weak self] isConnected in
                self?.isOffline = !isConnected
            }
            .store(in: &cancellables)
    }

    // MARK: - Load Collections

    func loadCollections() async {
        isLoading = true
        defer { isLoading = false }

        if networkMonitor.isConnected {
            // Online: Fetch from API
            do {
                let response: CollectionsResponse = try await api.get(.collections)
                collections = response.collections

                // Cache to Core Data
                response.collections.forEach { collection in
                    offlineData.saveCollection(collection)
                }
            } catch {
                // Fallback to offline data
                print("API error, using offline data: \(error)")
                collections = offlineData.fetchCollections()
                self.error = "Using offline data"
            }
        } else {
            // Offline: Use Core Data
            collections = offlineData.fetchCollections()
        }
    }

    // MARK: - Create Collection (Offline Support)

    func createCollection(name: String, description: String?) async {
        let tempId = UUID().uuidString
        let newCollection = Collection(
            id: tempId,
            name: name,
            description: description,
            type: .personal,
            ownerId: "current-user-id", // Get from AuthViewModel
            restaurantIds: [],
            restaurants: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        // Optimistic update
        collections.append(newCollection)

        if networkMonitor.isConnected {
            // Online: Create via API
            do {
                let created: Collection = try await api.post(.createCollection, body: newCollection)

                // Replace temp with real
                if let index = collections.firstIndex(where: { $0.id == tempId }) {
                    collections[index] = created
                }

                // Save to Core Data
                offlineData.saveCollection(created)
            } catch {
                // Keep offline version, will sync later
                offlineData.saveCollection(newCollection)
                syncManager.pendingSyncCount += 1
                self.error = "Created offline - will sync when online"
            }
        } else {
            // Offline: Save to Core Data, sync later
            offlineData.saveCollection(newCollection)
            syncManager.pendingSyncCount += 1
            self.error = "Created offline - will sync when online"
        }
    }
}
```

---

## 📦 Image Caching

### Restaurant Photo Caching

```swift
// Services/Storage/ImageCacheManager.swift
import UIKit
import SDWebImage

class ImageCacheManager {
    static let shared = ImageCacheManager()

    private let imageCache = SDImageCache.shared

    init() {
        // Configure cache size
        imageCache.config.maxMemoryCost = 50_000_000 // 50MB memory
        imageCache.config.maxDiskSize = 200_000_000 // 200MB disk
        imageCache.config.maxDiskAge = 30 * 24 * 60 * 60 // 30 days
    }

    func cacheImage(url: URL, completion: @escaping (Bool) -> Void) {
        SDWebImageManager.shared.loadImage(
            with: url,
            options: [.continueInBackground, .highPriority],
            progress: nil
        ) { image, data, error, cacheType, finished, imageURL in
            completion(finished && error == nil)
        }
    }

    func getCachedImage(url: URL) -> UIImage? {
        return imageCache.imageFromCache(forKey: url.absoluteString)
    }

    func hasCachedImage(url: URL) -> Bool {
        return imageCache.diskImageDataExists(withKey: url.absoluteString)
    }

    func clearCache() {
        imageCache.clearMemory()
        imageCache.clearDisk()
    }
}

// Usage in SwiftUI
struct CachedAsyncImage: View {
    let url: URL?

    var body: some View {
        Group {
            if let url = url {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        ProgressView()
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    case .failure:
                        Image(systemName: "photo")
                            .foregroundColor(.gray)
                    @unknown default:
                        EmptyView()
                    }
                }
            } else {
                Image(systemName: "photo")
                    .foregroundColor(.gray)
            }
        }
    }
}
```

---

## 🌐 Network Monitoring

### Connection State Management

```swift
// Services/NetworkMonitor.swift
import Network
import SwiftUI

class NetworkMonitor: ObservableObject {
    static let shared = NetworkMonitor()

    @Published var isConnected = true
    @Published var connectionType: ConnectionType = .unknown

    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")

    enum ConnectionType {
        case wifi
        case cellular
        case ethernet
        case unknown

        var displayName: String {
            switch self {
            case .wifi: return "Wi-Fi"
            case .cellular: return "Cellular"
            case .ethernet: return "Ethernet"
            case .unknown: return "Unknown"
            }
        }
    }

    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isConnected = path.status == .satisfied

                if path.usesInterfaceType(.wifi) {
                    self?.connectionType = .wifi
                } else if path.usesInterfaceType(.cellular) {
                    self?.connectionType = .cellular
                } else if path.usesInterfaceType(.wiredEthernet) {
                    self?.connectionType = .ethernet
                } else {
                    self?.connectionType = .unknown
                }
            }
        }

        monitor.start(queue: queue)
    }

    deinit {
        monitor.cancel()
    }
}

// Usage in Views
struct ContentView: View {
    @ObservedObject var networkMonitor = NetworkMonitor.shared

    var body: some View {
        VStack {
            if !networkMonitor.isConnected {
                OfflineBanner()
            }

            // Main content
        }
    }
}

struct OfflineBanner: View {
    var body: some View {
        HStack {
            Image(systemName: "wifi.slash")
            Text("You're offline")
            Spacer()
        }
        .font(.caption)
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color.yellow.opacity(0.3))
    }
}
```

---

## 🔄 Sync Strategies

### Pull-to-Refresh

```swift
struct CollectionsListView: View {
    @StateObject private var viewModel = CollectionsViewModel()

    var body: some View {
        List(viewModel.collections) { collection in
            CollectionRow(collection: collection)
        }
        .refreshable {
            await viewModel.refresh()
        }
    }
}

// In ViewModel
func refresh() async {
    await SyncManager.shared.syncAll()
    await loadCollections()
}
```

### Background Sync

```swift
// AppDelegate.swift
import UIKit
import BackgroundTasks

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
    ) -> Bool {
        // Register background tasks
        registerBackgroundTasks()
        return true
    }

    private func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "com.forkintheroad.app.sync",
            using: nil
        ) { task in
            self.handleBackgroundSync(task: task as! BGAppRefreshTask)
        }
    }

    private func handleBackgroundSync(task: BGAppRefreshTask) {
        // Schedule next refresh
        scheduleBackgroundSync()

        // Perform sync
        Task {
            await SyncManager.shared.syncAll()
            task.setTaskCompleted(success: true)
        }
    }

    func scheduleBackgroundSync() {
        let request = BGAppRefreshTaskRequest(identifier: "com.forkintheroad.app.sync")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes

        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Could not schedule background sync: \(error)")
        }
    }
}
```

---

## 📊 Conflict Resolution

### Last-Write-Wins Strategy

```swift
// Services/Storage/ConflictResolver.swift
import Foundation

struct ConflictResolver {
    static func resolveCollectionConflict(
        local: Collection,
        remote: Collection
    ) -> Collection {
        // Last-write-wins based on updatedAt
        if local.updatedAt > remote.updatedAt {
            return local
        } else {
            return remote
        }
    }

    static func mergeRestaurantLists(
        local: [String],
        remote: [String]
    ) -> [String] {
        // Union of both lists (no duplicates)
        let combined = Set(local).union(Set(remote))
        return Array(combined)
    }
}
```

---

## ✅ Offline Checklist

### Implementation Checklist

**Core Data Setup**:

- [ ] Create .xcdatamodeld file
- [ ] Define entities (Restaurant, Collection, Group, Decision)
- [ ] Add relationships
- [ ] Configure Core Data stack
- [ ] Implement save/fetch methods

**Caching Strategy**:

- [ ] NSCache for in-memory objects
- [ ] URLCache for HTTP responses
- [ ] Core Data for persistent storage
- [ ] Image caching (SDWebImage)

**Sync Manager**:

- [ ] Network monitoring
- [ ] Background sync registration
- [ ] Pull-to-refresh implementation
- [ ] Conflict resolution strategy

**ViewModels**:

- [ ] Check network state before API calls
- [ ] Fallback to offline data
- [ ] Queue offline actions for sync
- [ ] Show offline indicators

**Testing**:

- [ ] Test offline mode (Airplane mode)
- [ ] Test sync when connection restored
- [ ] Test conflict resolution
- [ ] Test data persistence across app launches

---

**Next**: [Notification System Guide](./07-notification-system.md)

**Offline support makes the app resilient! 💪**
