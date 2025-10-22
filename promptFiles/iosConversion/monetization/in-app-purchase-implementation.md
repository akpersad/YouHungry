# In-App Purchase Implementation Guide

Complete guide to implementing IAP with StoreKit 2 and syncing with backend.

---

## 🎯 Overview

**Framework**: StoreKit 2 (modern Swift API)
**Products**: Auto-Renewable Subscriptions
**Apple's Cut**: 30% first year, 15% thereafter
**Backend Sync**: Required (premium status must sync with web app)

---

## 📦 Products Configuration

### App Store Connect Setup

**Product 1: Monthly Subscription**

- Product ID: `com.forkintheroad.app.premium.monthly`
- Type: Auto-Renewable Subscription
- Subscription Group: `Premium`
- Duration: 1 Month
- Price Tier: Launch $0.99, Regular $3.99
- Free Trial: No (keep it simple for v1.0)

**Product 2: Yearly Subscription**

- Product ID: `com.forkintheroad.app.premium.yearly`
- Type: Auto-Renewable Subscription
- Subscription Group: `Premium`
- Duration: 1 Year
- Price Tier: Launch $10, Regular $39.99
- Free Trial: No

**Subscription Group Level**:

- Both products in same group (user can only have one at a time)
- Yearly has higher level (if user has monthly, upgrade to yearly = immediate switch)

---

## 💻 StoreKit Manager Implementation

```swift
// Services/StoreKitManager.swift
import StoreKit
import Foundation

@MainActor
class StoreKitManager: ObservableObject {
    static let shared = StoreKitManager()

    @Published var products: [Product] = []
    @Published var purchasedProductIDs: Set<String> = []
    @Published var isPremium = false
    @Published var subscriptionStatus: SubscriptionStatus = .notSubscribed

    enum SubscriptionStatus {
        case notSubscribed
        case subscribed(expirationDate: Date?)
        case expired
        case inGracePeriod
    }

    private let productIDs = [
        "com.forkintheroad.app.premium.monthly",
        "com.forkintheroad.app.premium.yearly"
    ]

    private var updateListenerTask: Task<Void, Error>?
    private let api = APIService.shared

    init() {
        // Start listening for transaction updates
        updateListenerTask = listenForTransactions()

        Task {
            await loadProducts()
            await updateSubscriptionStatus()
        }
    }

    deinit {
        updateListenerTask?.cancel()
    }

    // MARK: - Load Products

    func loadProducts() async {
        do {
            products = try await Product.products(for: productIDs)
                .sorted { $0.price < $1.price } // Monthly first, then yearly
        } catch {
            print("Failed to load products: \(error)")
        }
    }

    // MARK: - Purchase

    func purchase(_ product: Product) async throws {
        let result = try await product.purchase()

        switch result {
        case .success(let verification):
            // Verify transaction
            let transaction = try checkVerified(verification)

            // Grant premium access
            await updateSubscriptionStatus()

            // Sync with backend
            await syncWithBackend(transaction: transaction)

            // Finish transaction
            await transaction.finish()

            // Log analytics
            AnalyticsService.shared.log(event: .purchaseCompleted(productId: product.id))

        case .userCancelled:
            throw PurchaseError.cancelled

        case .pending:
            throw PurchaseError.pending

        @unknown default:
            throw PurchaseError.unknown
        }
    }

    // MARK: - Restore Purchases

    func restorePurchases() async {
        do {
            // Sync with App Store
            try await AppStore.sync()

            // Update local status
            await updateSubscriptionStatus()

            // Sync with backend
            await syncAllTransactionsWithBackend()

            AnalyticsService.shared.log(event: .restorePurchases)
        } catch {
            print("Restore failed: \(error)")
            throw error
        }
    }

    // MARK: - Check Subscription Status

    func updateSubscriptionStatus() async {
        var validSubscription = false
        var expirationDate: Date?

        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)

                // Check if it's a premium subscription
                if productIDs.contains(transaction.productID) {
                    if transaction.revocationDate == nil {
                        validSubscription = true
                        expirationDate = transaction.expirationDate
                        purchasedProductIDs.insert(transaction.productID)
                    }
                }
            } catch {
                print("Transaction verification failed: \(error)")
            }
        }

        isPremium = validSubscription

        if validSubscription {
            subscriptionStatus = .subscribed(expirationDate: expirationDate)
        } else {
            subscriptionStatus = .notSubscribed
        }
    }

    // MARK: - Transaction Verification

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw PurchaseError.failedVerification
        case .verified(let safe):
            return safe
        }
    }

    // MARK: - Listen for Updates

    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try self.checkVerified(result)

                    await self.updateSubscriptionStatus()
                    await self.syncWithBackend(transaction: transaction)

                    await transaction.finish()
                } catch {
                    print("Transaction update error: \(error)")
                }
            }
        }
    }

    // MARK: - Backend Sync

    private func syncWithBackend(transaction: Transaction) async {
        struct SyncRequest: Encodable {
            let transactionId: UInt64
            let productId: String
            let purchaseDate: Date
            let expirationDate: Date?
            let originalTransactionId: UInt64
        }

        let request = SyncRequest(
            transactionId: transaction.id,
            productId: transaction.productID,
            purchaseDate: transaction.purchaseDate,
            expirationDate: transaction.expirationDate,
            originalTransactionId: transaction.originalID
        )

        do {
            let _: EmptyResponse = try await api.post(.syncPremium, body: request)
            print("Synced transaction with backend")
        } catch {
            print("Failed to sync with backend: \(error)")
            // Retry later or queue for sync
        }
    }

    private func syncAllTransactionsWithBackend() async {
        for await result in Transaction.currentEntitlements {
            if let transaction = try? checkVerified(result) {
                await syncWithBackend(transaction: transaction)
            }
        }
    }
}

// MARK: - Errors

enum PurchaseError: Error {
    case cancelled
    case pending
    case failedVerification
    case networkError
    case unknown

    var userMessage: String {
        switch self {
        case .cancelled:
            return "Purchase cancelled"
        case .pending:
            return "Purchase pending approval"
        case .failedVerification:
            return "Could not verify purchase"
        case .networkError:
            return "Network error - please try again"
        case .unknown:
            return "Purchase failed"
        }
    }
}
```

---

## 🗄️ Backend Sync (Mobile API)

### Store Premium Status in MongoDB

```javascript
// mobile-api/models/User.js
const userSchema = new mongoose.Schema({
  // ... existing fields

  premium: {
    isActive: { type: Boolean, default: false },
    subscriptionType: String, // 'monthly' or 'yearly'
    productId: String,
    transactionId: String,
    originalTransactionId: String,
    purchaseDate: Date,
    expirationDate: Date,
    lastVerified: Date,
  },
});

// mobile-api/routes/subscription.js
router.post('/api/subscription/sync', authenticateUser, async (req, res) => {
  const {
    transactionId,
    productId,
    purchaseDate,
    expirationDate,
    originalTransactionId,
  } = req.body;
  const userId = req.user.id;

  // Update user's premium status
  await User.findByIdAndUpdate(userId, {
    'premium.isActive': true,
    'premium.subscriptionType': productId.includes('monthly')
      ? 'monthly'
      : 'yearly',
    'premium.productId': productId,
    'premium.transactionId': transactionId,
    'premium.originalTransactionId': originalTransactionId,
    'premium.purchaseDate': purchaseDate,
    'premium.expirationDate': expirationDate,
    'premium.lastVerified': new Date(),
  });

  res.json({ success: true });
});

// Check premium status endpoint
router.get('/api/subscription/status', authenticateUser, async (req, res) => {
  const user = await User.findById(req.user.id);

  const isPremium =
    user.premium?.isActive &&
    (!user.premium?.expirationDate || new Date() < user.premium.expirationDate);

  res.json({
    isPremium,
    subscriptionType: user.premium?.subscriptionType,
    expirationDate: user.premium?.expirationDate,
  });
});
```

---

## ✅ Implementation Checklist

**StoreKit Setup**:

- [ ] Products created in App Store Connect
- [ ] StoreKitManager implemented
- [ ] Products load correctly
- [ ] Can purchase monthly subscription
- [ ] Can purchase yearly subscription
- [ ] Restore purchases working

**Transaction Handling**:

- [ ] Transactions verified
- [ ] Receipt validation working
- [ ] Transaction listener active
- [ ] Failed purchases handled

**Backend Integration**:

- [ ] Sync endpoint implemented
- [ ] Premium status stored in MongoDB
- [ ] Status check endpoint working
- [ ] Syncs on purchase
- [ ] Syncs on restore
- [ ] Handles expiration

**Testing**:

- [ ] Tested in Sandbox environment
- [ ] Created Sandbox test account
- [ ] Tested purchase flow
- [ ] Tested restore purchases
- [ ] Tested subscription expiration
- [ ] Verified backend sync

---

## 🧪 Testing with Sandbox

### Create Sandbox Tester

**App Store Connect** → Users and Access → Sandbox Testers:

1. Click + button
2. First Name: Test
3. Last Name: User
4. Email: test1@forkintheroad.sandbox.com (use + trick: your+test@gmail.com)
5. Password: [Strong password]
6. Country: United States
7. Create

### Test Purchase Flow

**On Device**:

1. Sign out of real App Store account (Settings → [Your Name] → Sign Out)
2. Run app from Xcode
3. Tap "Upgrade to Premium"
4. Tap subscription
5. When prompted, sign in with Sandbox account
6. Confirm purchase
7. ✅ Premium features should unlock immediately

**Test Scenarios**:

- [ ] Purchase monthly
- [ ] Purchase yearly
- [ ] Upgrade monthly → yearly
- [ ] Cancel subscription
- [ ] Restore purchases
- [ ] Expired subscription (after 5 minutes in Sandbox, subscriptions expire)

---

**IAP is your revenue - implement it correctly! 💳**
