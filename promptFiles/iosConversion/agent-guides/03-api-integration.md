# API Integration Guide

Complete guide to integrating iOS app with the mobile API backend.

---

## 🎯 Overview

**Mobile API Architecture**:

```
iOS App → Mobile API (Node.js/Express on Render) → MongoDB + External APIs
```

**Why Separate Mobile API?**:

- Independent from web app (resilience)
- Mobile-optimized endpoints
- App Store reviewers prefer dedicated mobile infrastructure
- Can scale independently

**Base URL**:

- **Development**: `http://localhost:3001`
- **Staging**: `https://fork-in-the-road-mobile-api-staging.onrender.com`
- **Production**: `https://fork-in-the-road-mobile-api.onrender.com`

---

## 🔧 APIService Architecture

### Base API Service

```swift
// Services/Network/APIService.swift
import Foundation

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
    case patch = "PATCH"
}

enum APIError: Error {
    case invalidURL
    case networkError(Error)
    case invalidResponse
    case httpError(statusCode: Int, data: Data?)
    case decodingError(Error)
    case unauthorized
    case serverError(String)

    var userMessage: String {
        switch self {
        case .invalidURL:
            return "Invalid request"
        case .networkError:
            return "No internet connection"
        case .unauthorized:
            return "Please sign in again"
        case .httpError(let code, _):
            return "Server error (\(code))"
        case .decodingError:
            return "Invalid response from server"
        case .serverError(let message):
            return message
        default:
            return "Something went wrong"
        }
    }
}

class APIService {
    static let shared = APIService()

    private let baseURL: String
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    private init() {
        // Configure based on environment
        #if DEBUG
        self.baseURL = Environment.current == .local
            ? "http://localhost:3001"
            : "https://fork-in-the-road-mobile-api-staging.onrender.com"
        #else
        self.baseURL = "https://fork-in-the-road-mobile-api.onrender.com"
        #endif

        // Configure URLSession
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        configuration.waitsForConnectivity = true
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData

        self.session = URLSession(configuration: configuration)

        // Configure JSON decoder
        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
        self.decoder.dateDecodingStrategy = .iso8601

        // Configure JSON encoder
        self.encoder = JSONEncoder()
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
        self.encoder.dateEncodingStrategy = .iso8601
    }

    // MARK: - Generic Request Method

    func request<T: Decodable>(
        _ endpoint: APIEndpoint,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        headers: [String: String]? = nil
    ) async throws -> T {
        // Build URL
        guard let url = URL(string: baseURL + endpoint.path) else {
            throw APIError.invalidURL
        }

        var urlComponents = URLComponents(url: url, resolvingAgainstBaseURL: false)!

        // Add query parameters
        if !endpoint.queryItems.isEmpty {
            urlComponents.queryItems = endpoint.queryItems
        }

        guard let finalURL = urlComponents.url else {
            throw APIError.invalidURL
        }

        // Build request
        var request = URLRequest(url: finalURL)
        request.httpMethod = method.rawValue

        // Add headers
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        // Add auth token
        if let token = try? KeychainManager.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // Add custom headers
        headers?.forEach { key, value in
            request.setValue(value, forHTTPHeaderField: key)
        }

        // Add body
        if let body = body {
            request.httpBody = try encoder.encode(body)
        }

        // Execute request
        do {
            let (data, response) = try await session.data(for: request)

            // Validate response
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }

            // Handle status codes
            switch httpResponse.statusCode {
            case 200...299:
                // Success - decode response
                do {
                    let decodedResponse = try decoder.decode(T.self, from: data)
                    return decodedResponse
                } catch {
                    print("Decoding error: \(error)")
                    print("Response data: \(String(data: data, encoding: .utf8) ?? "nil")")
                    throw APIError.decodingError(error)
                }

            case 401:
                // Unauthorized - clear token and throw
                try? KeychainManager.shared.deleteToken()
                throw APIError.unauthorized

            case 400...499:
                // Client error - try to decode error message
                if let errorResponse = try? decoder.decode(ErrorResponse.self, from: data) {
                    throw APIError.serverError(errorResponse.message)
                }
                throw APIError.httpError(statusCode: httpResponse.statusCode, data: data)

            case 500...599:
                // Server error
                throw APIError.httpError(statusCode: httpResponse.statusCode, data: data)

            default:
                throw APIError.httpError(statusCode: httpResponse.statusCode, data: data)
            }

        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError(error)
        }
    }

    // MARK: - Convenience Methods

    func get<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T {
        return try await request(endpoint, method: .get)
    }

    func post<T: Decodable>(_ endpoint: APIEndpoint, body: Encodable) async throws -> T {
        return try await request(endpoint, method: .post, body: body)
    }

    func put<T: Decodable>(_ endpoint: APIEndpoint, body: Encodable) async throws -> T {
        return try await request(endpoint, method: .put, body: body)
    }

    func delete<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T {
        return try await request(endpoint, method: .delete)
    }
}

// Error response model
struct ErrorResponse: Decodable {
    let message: String
    let code: String?
}
```

---

## 📍 API Endpoints

### Endpoint Definitions

```swift
// Services/Network/APIEndpoint.swift
import Foundation

enum APIEndpoint {
    // Authentication
    case login
    case register
    case currentUser
    case refreshToken

    // Collections
    case collections
    case collection(id: String)
    case createCollection
    case updateCollection(id: String)
    case deleteCollection(id: String)

    // Restaurants
    case restaurants
    case restaurant(id: String)
    case searchRestaurants(query: String?, location: String?, lat: Double?, lng: Double?)
    case addRestaurantToCollection(collectionId: String)

    // Groups
    case groups
    case group(id: String)
    case createGroup
    case updateGroup(id: String)
    case inviteToGroup(groupId: String)
    case leaveGroup(groupId: String)

    // Decisions
    case decisions
    case decision(id: String)
    case createDecision
    case submitVote(decisionId: String)
    case completeDecision(decisionId: String)

    // Profile
    case profile
    case updateProfile
    case notifications
    case updateNotificationSettings

    var path: String {
        switch self {
        // Auth
        case .login: return "/api/auth/login"
        case .register: return "/api/auth/register"
        case .currentUser: return "/api/auth/me"
        case .refreshToken: return "/api/auth/refresh"

        // Collections
        case .collections: return "/api/collections"
        case .collection(let id): return "/api/collections/\(id)"
        case .createCollection: return "/api/collections"
        case .updateCollection(let id): return "/api/collections/\(id)"
        case .deleteCollection(let id): return "/api/collections/\(id)"

        // Restaurants
        case .restaurants: return "/api/restaurants"
        case .restaurant(let id): return "/api/restaurants/\(id)"
        case .searchRestaurants: return "/api/restaurants/search"
        case .addRestaurantToCollection(let id): return "/api/collections/\(id)/restaurants"

        // Groups
        case .groups: return "/api/groups"
        case .group(let id): return "/api/groups/\(id)"
        case .createGroup: return "/api/groups"
        case .updateGroup(let id): return "/api/groups/\(id)"
        case .inviteToGroup(let id): return "/api/groups/\(id)/invite"
        case .leaveGroup(let id): return "/api/groups/\(id)/leave"

        // Decisions
        case .decisions: return "/api/decisions"
        case .decision(let id): return "/api/decisions/\(id)"
        case .createDecision: return "/api/decisions"
        case .submitVote(let id): return "/api/decisions/\(id)/vote"
        case .completeDecision(let id): return "/api/decisions/\(id)/complete"

        // Profile
        case .profile: return "/api/user/profile"
        case .updateProfile: return "/api/user/profile"
        case .notifications: return "/api/notifications"
        case .updateNotificationSettings: return "/api/user/notification-settings"
        }
    }

    var queryItems: [URLQueryItem] {
        switch self {
        case .searchRestaurants(let query, let location, let lat, let lng):
            var items: [URLQueryItem] = []
            if let query = query {
                items.append(URLQueryItem(name: "q", value: query))
            }
            if let location = location {
                items.append(URLQueryItem(name: "location", value: location))
            }
            if let lat = lat {
                items.append(URLQueryItem(name: "lat", value: String(lat)))
            }
            if let lng = lng {
                items.append(URLQueryItem(name: "lng", value: String(lng)))
            }
            return items
        default:
            return []
        }
    }
}
```

---

## 🎯 Feature-Specific Services

### Collection Service

```swift
// Services/CollectionService.swift
import Foundation

class CollectionService {
    private let api = APIService.shared

    // Fetch all collections
    func fetchCollections() async throws -> [Collection] {
        let response: CollectionsResponse = try await api.get(.collections)
        return response.collections
    }

    // Fetch single collection
    func fetchCollection(id: String) async throws -> Collection {
        return try await api.get(.collection(id: id))
    }

    // Create collection
    func createCollection(_ collection: CreateCollectionRequest) async throws -> Collection {
        return try await api.post(.createCollection, body: collection)
    }

    // Update collection
    func updateCollection(id: String, name: String) async throws -> Collection {
        let request = UpdateCollectionRequest(name: name)
        return try await api.put(.updateCollection(id: id), body: request)
    }

    // Delete collection
    func deleteCollection(id: String) async throws {
        let _: EmptyResponse = try await api.delete(.deleteCollection(id: id))
    }

    // Add restaurant to collection
    func addRestaurant(restaurantId: String, to collectionId: String) async throws -> Collection {
        let request = AddRestaurantRequest(restaurantId: restaurantId)
        return try await api.post(.addRestaurantToCollection(collectionId: collectionId), body: request)
    }
}

// Request/Response models
struct CollectionsResponse: Decodable {
    let collections: [Collection]
}

struct CreateCollectionRequest: Encodable {
    let name: String
    let description: String?
}

struct UpdateCollectionRequest: Encodable {
    let name: String
}

struct AddRestaurantRequest: Encodable {
    let restaurantId: String
}

struct EmptyResponse: Decodable {}
```

### Restaurant Service

```swift
// Services/RestaurantService.swift
import Foundation
import CoreLocation

class RestaurantService {
    private let api = APIService.shared

    // Search restaurants
    func searchRestaurants(
        query: String? = nil,
        location: String? = nil,
        coordinates: CLLocationCoordinate2D? = nil,
        radius: Int? = nil,
        cuisine: String? = nil
    ) async throws -> [Restaurant] {
        let lat = coordinates?.latitude
        let lng = coordinates?.longitude

        let response: RestaurantsResponse = try await api.get(
            .searchRestaurants(query: query, location: location, lat: lat, lng: lng)
        )
        return response.restaurants
    }

    // Fetch restaurant details
    func fetchRestaurant(id: String) async throws -> Restaurant {
        return try await api.get(.restaurant(id: id))
    }
}

struct RestaurantsResponse: Decodable {
    let restaurants: [Restaurant]
}
```

### Group Service

```swift
// Services/GroupService.swift
import Foundation

class GroupService {
    private let api = APIService.shared

    func fetchGroups() async throws -> [Group] {
        let response: GroupsResponse = try await api.get(.groups)
        return response.groups
    }

    func fetchGroup(id: String) async throws -> Group {
        return try await api.get(.group(id: id))
    }

    func createGroup(_ request: CreateGroupRequest) async throws -> Group {
        return try await api.post(.createGroup, body: request)
    }

    func inviteToGroup(groupId: String, userEmail: String) async throws {
        let request = InviteRequest(email: userEmail)
        let _: EmptyResponse = try await api.post(.inviteToGroup(groupId: groupId), body: request)
    }

    func leaveGroup(id: String) async throws {
        let _: EmptyResponse = try await api.post(.leaveGroup(groupId: id), body: EmptyRequest())
    }
}

struct GroupsResponse: Decodable {
    let groups: [Group]
}

struct CreateGroupRequest: Encodable {
    let name: String
    let description: String?
}

struct InviteRequest: Encodable {
    let email: String
}

struct EmptyRequest: Encodable {}
```

---

## 🔒 Authentication Integration

### Token Management

```swift
// Core/Utilities/KeychainManager.swift
import Foundation
import Security

class KeychainManager {
    static let shared = KeychainManager()

    private let service = "com.forkintheroad.app"
    private let tokenKey = "auth_token"

    // Save token
    func save(token: String) throws {
        let data = token.data(using: .utf8)!

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenKey,
            kSecValueData as String: data
        ]

        // Delete existing
        SecItemDelete(query as CFDictionary)

        // Add new
        let status = SecItemAdd(query as CFDictionary, nil)

        guard status == errSecSuccess else {
            throw KeychainError.saveFailed
        }
    }

    // Get token
    func getToken() throws -> String {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenKey,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            throw KeychainError.notFound
        }

        return token
    }

    // Delete token
    func deleteToken() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenKey
        ]

        let status = SecItemDelete(query as CFDictionary)

        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.deleteFailed
        }
    }
}

enum KeychainError: Error {
    case saveFailed
    case notFound
    case deleteFailed
}
```

---

## 🔄 Retry & Error Handling

### Retry Logic

```swift
// Services/Network/NetworkMonitor.swift
import Network

class NetworkMonitor: ObservableObject {
    static let shared = NetworkMonitor()

    @Published var isConnected = true
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")

    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isConnected = path.status == .satisfied
            }
        }
        monitor.start(queue: queue)
    }
}

// Retry helper
extension APIService {
    func requestWithRetry<T: Decodable>(
        _ endpoint: APIEndpoint,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        maxRetries: Int = 3
    ) async throws -> T {
        var lastError: Error?

        for attempt in 0..<maxRetries {
            do {
                return try await request(endpoint, method: method, body: body)
            } catch let error as APIError {
                lastError = error

                // Don't retry on certain errors
                switch error {
                case .unauthorized, .invalidURL, .decodingError:
                    throw error
                default:
                    if attempt < maxRetries - 1 {
                        // Exponential backoff
                        let delay = pow(2.0, Double(attempt))
                        try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                        continue
                    }
                }
            }
        }

        throw lastError ?? APIError.serverError("Max retries exceeded")
    }
}
```

---

## 📊 Response Caching

### Cache Strategy

```swift
// Services/CacheManager.swift
import Foundation

actor CacheManager {
    static let shared = CacheManager()

    private var cache: [String: CachedItem] = [:]

    struct CachedItem {
        let data: Data
        let expiration: Date
    }

    func get(key: String) -> Data? {
        guard let item = cache[key],
              item.expiration > Date() else {
            cache.removeValue(forKey: key)
            return nil
        }
        return item.data
    }

    func set(key: String, data: Data, ttl: TimeInterval = 300) {
        let expiration = Date().addingTimeInterval(ttl)
        cache[key] = CachedItem(data: data, expiration: expiration)
    }

    func clear() {
        cache.removeAll()
    }
}

// Use in APIService
extension APIService {
    func cachedRequest<T: Decodable>(
        _ endpoint: APIEndpoint,
        method: HTTPMethod = .get,
        cacheTTL: TimeInterval = 300
    ) async throws -> T {
        let cacheKey = "\(method.rawValue):\(endpoint.path)"

        // Check cache
        if method == .get,
           let cachedData = await CacheManager.shared.get(key: cacheKey) {
            do {
                return try decoder.decode(T.self, from: cachedData)
            } catch {
                // Invalid cache, continue to API
            }
        }

        // Fetch from API
        let result: T = try await request(endpoint, method: method)

        // Cache result
        if method == .get {
            if let data = try? encoder.encode(result) {
                await CacheManager.shared.set(key: cacheKey, data: data, ttl: cacheTTL)
            }
        }

        return result
    }
}
```

---

## 🧪 Testing

### Mock API Service

```swift
// Services/Network/MockAPIService.swift
#if DEBUG
class MockAPIService: APIService {
    var shouldFail = false
    var mockDelay: TimeInterval = 0.5

    override func request<T>(_ endpoint: APIEndpoint, method: HTTPMethod, body: Encodable?) async throws -> T where T : Decodable {
        // Simulate network delay
        try await Task.sleep(nanoseconds: UInt64(mockDelay * 1_000_000_000))

        if shouldFail {
            throw APIError.serverError("Mock error")
        }

        // Return mock data based on endpoint
        switch endpoint {
        case .collections:
            return CollectionsResponse(collections: [
                .mock1,
                .mock2
            ]) as! T
        case .collection(let id):
            return Collection.mock1 as! T
        default:
            fatalError("Mock not implemented for \(endpoint)")
        }
    }
}

extension Collection {
    static let mock1 = Collection(
        id: "1",
        name: "Favorites",
        description: "My favorite restaurants",
        type: .personal,
        restaurantIds: [],
        createdAt: Date(),
        updatedAt: Date()
    )
}
#endif
```

---

## 📋 API Integration Checklist

When implementing a new API feature:

- [ ] Define endpoint in `APIEndpoint` enum
- [ ] Create request/response models (Codable)
- [ ] Implement service method
- [ ] Add error handling
- [ ] Implement caching strategy (if applicable)
- [ ] Add retry logic for critical endpoints
- [ ] Write unit tests
- [ ] Test with mock data
- [ ] Test with real API
- [ ] Handle offline scenarios

---

## 🔗 Environment Configuration

```swift
// Core/Environment.swift
enum Environment {
    case local
    case staging
    case production

    static var current: Environment {
        #if DEBUG
        return .local
        #else
        return .production
        #endif
    }

    var apiBaseURL: String {
        switch self {
        case .local:
            return "http://localhost:3001"
        case .staging:
            return "https://fork-in-the-road-mobile-api-staging.onrender.com"
        case .production:
            return "https://fork-in-the-road-mobile-api.onrender.com"
        }
    }
}
```

---

**Next**: [Authentication Flow Guide](./04-authentication-flow.md)

**API integration is the backbone of the app - build it solid! 🚀**
