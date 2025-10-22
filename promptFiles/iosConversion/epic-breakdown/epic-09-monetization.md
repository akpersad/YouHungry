# Epic 9: Monetization & In-App Purchases

**Goal**: Implement freemium model with In-App Purchases (StoreKit 2) and non-intrusive ads

**Duration**: 1 week (aggressive: 4-5 days)
**Priority**: 🟡 Medium
**Dependencies**: Epic 3 (Collections), Epic 4 (Groups), Epic 5 (Decisions)

---

## 💎 Freemium Model (Per Your Decisions)

### Free Tier

- ✅ 10 personal collections (limit)
- ✅ Restaurant search and discovery
- ✅ Basic personal decision making (random selection)
- ✅ Join up to 3 groups
- ✅ Participate in group decisions (random only)
- ✅ View decision history (last 30 days)
- ✅ Push notifications, email, in-app
- ⚠️ Ads (non-intrusive, bottom banners)

### Premium Tier ($0.99/month launch price → $3.99/month)

- 🔒 Unlimited personal collections
- 🔒 Unlimited groups (no 3-group limit)
- 🔒 Advanced group decision voting (tiered voting)
- 🔒 Full decision history (unlimited)
- 🔒 SMS notifications
- 🔒 Advanced filters (price, cuisine, rating)
- 🔒 Spotlight/Siri/Widgets (premium features)
- 🔒 Ad-free experience
- 🔒 Export data (collections, history to CSV)
- 🔒 Group admin controls (advanced settings)
- 🔒 Restaurant notes and ratings
- 🔒 Custom tags and organization

---

## 📖 Stories

### Story 9.1: StoreKit 2 Integration

**Estimated Time**: 6-8 hours

**Tasks**:

- [ ] Create In-App Purchase in App Store Connect

  - Product ID: com.forkintheroad.app.premium.monthly
  - Type: Auto-Renewable Subscription
  - Subscription Group: Premium
  - Price: $0.99/month (launch), $3.99/month (regular)
  - Also create yearly: com.forkintheroad.app.premium.yearly ($10/year launch, $39.99 regular)

- [ ] Implement StoreKitManager

  - Load products
  - Purchase product
  - Restore purchases
  - Handle subscription status
  - Sync with backend

- [ ] Create subscription status sync
  - Store premium status in MongoDB
  - Sync across web and iOS
  - Check status on app launch

**Deliverables**:

- ✅ Products load from App Store Connect
- ✅ Can purchase subscription
- ✅ Can restore purchase
- ✅ Premium status syncs with backend
- ✅ Premium status available on web app too

**Code Example**:

```swift
// Services/StoreKitManager.swift
import StoreKit

@MainActor
class StoreKitManager: ObservableObject {
    static let shared = StoreKitManager()

    @Published var products: [Product] = []
    @Published var purchasedProductIDs: Set<String> = []
    @Published var isPremium = false

    private let productIDs = [
        "com.forkintheroad.app.premium.monthly",
        "com.forkintheroad.app.premium.yearly"
    ]

    init() {
        Task {
            await loadProducts()
            await updateSubscriptionStatus()
        }
    }

    func loadProducts() async {
        do {
            products = try await Product.products(for: productIDs)
        } catch {
            print("Failed to load products: \(error)")
        }
    }

    func purchase(_ product: Product) async throws {
        let result = try await product.purchase()

        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)

            // Grant access
            await updateSubscriptionStatus()

            // Finish transaction
            await transaction.finish()

            // Sync with backend
            await syncPremiumStatus(transaction: transaction)

            return

        case .userCancelled:
            throw PurchaseError.cancelled

        case .pending:
            throw PurchaseError.pending

        @unknown default:
            throw PurchaseError.unknown
        }
    }

    func restorePurchases() async {
        do {
            try await AppStore.sync()
            await updateSubscriptionStatus()
        } catch {
            print("Restore failed: \(error)")
        }
    }

    private func updateSubscriptionStatus() async {
        var validSubscription = false

        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)

                if transaction.productID.contains("premium") &&
                   transaction.revocationDate == nil {
                    validSubscription = true
                    purchasedProductIDs.insert(transaction.productID)
                }
            } catch {
                print("Transaction verification error: \(error)")
            }
        }

        isPremium = validSubscription
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .verified(let safe):
            return safe
        case .unverified:
            throw PurchaseError.failedVerification
        }
    }

    private func syncPremiumStatus(transaction: Transaction) async {
        // Send to backend
        struct SyncPremiumRequest: Encodable {
            let transactionId: UInt64
            let productId: String
            let purchaseDate: Date
            let expirationDate: Date?
        }

        let request = SyncPremiumRequest(
            transactionId: transaction.id,
            productId: transaction.productID,
            purchaseDate: transaction.purchaseDate,
            expirationDate: transaction.expirationDate
        )

        do {
            let _: EmptyResponse = try await APIService.shared.post(.syncPremium, body: request)
        } catch {
            print("Sync premium status error: \(error)")
        }
    }
}

enum PurchaseError: Error {
    case cancelled
    case pending
    case failedVerification
    case unknown
}
```

---

### Story 9.2: Premium Features Paywall

**Estimated Time**: 6-8 hours

**Tasks**:

- [ ] Create PaywallView

  - Feature comparison (Free vs Premium)
  - Pricing options (monthly, yearly)
  - Purchase buttons
  - Restore purchases button
  - Terms and Privacy links

- [ ] Implement feature gating

  - Check premium status before premium features
  - Show paywall when limit reached (e.g., 4th group)
  - Allow trial/preview of premium features

- [ ] Create SubscriptionManager
  - Check if premium
  - Show paywall if not
  - Track feature usage against limits

**Deliverables**:

- ✅ Paywall showing when limits reached
- ✅ Clear value proposition
- ✅ Purchase flow smooth
- ✅ Premium features unlocked after purchase

**Code Example**:

```swift
struct PaywallView: View {
    @EnvironmentObject var storeKit: StoreKitManager
    @Environment(\.dismiss) var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.yellow)

                    Text("Upgrade to Premium")
                        .font(.displayMedium)

                    Text("Unlock unlimited features")
                        .font(.bodyMedium)
                        .foregroundColor(.secondary)
                }

                // Feature list
                VStack(alignment: .leading, spacing: 16) {
                    FeatureRow(icon: "infinity", title: "Unlimited Groups", subtitle: "Free: 3 groups")
                    FeatureRow(icon: "chart.bar", title: "Advanced Voting", subtitle: "Tiered ranking system")
                    FeatureRow(icon: "clock.arrow.circlepath", title: "Full History", subtitle: "Free: 30 days only")
                    FeatureRow(icon: "tag", title: "Custom Tags", subtitle: "Organize your way")
                    FeatureRow(icon: "arrow.down.doc", title: "Export Data", subtitle: "Download your data")
                    FeatureRow(icon: "speaker.slash", title: "Ad-Free", subtitle: "No ads, ever")
                }
                .padding()

                // Pricing
                VStack(spacing: 12) {
                    ForEach(storeKit.products) { product in
                        PricingButton(product: product) {
                            Task {
                                try? await storeKit.purchase(product)
                                dismiss()
                            }
                        }
                    }
                }

                // Restore button
                Button("Restore Purchases") {
                    Task {
                        await storeKit.restorePurchases()
                    }
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
            .padding()
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.accentInfrared)
                .frame(width: 40)

            VStack(alignment: .leading) {
                Text(title)
                    .font(.headline)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.successGreen)
        }
    }
}
```

---

### Story 9.3: Feature Limit Enforcement

**Estimated Time**: 4-6 hours

**Tasks**:

- [ ] Implement SubscriptionManager

  - Check premium status
  - Enforce collection limit (10 for free)
  - Enforce group limit (3 for free)
  - Enforce history limit (30 days for free)

- [ ] Add limit checks to ViewModels

  - Before creating 11th collection → Show paywall
  - Before joining 4th group → Show paywall
  - Viewing history older than 30 days → Show paywall

- [ ] Show upgrade prompts
  - Soft prompts (banner at bottom)
  - Hard blocks (paywall modal)

**Deliverables**:

- ✅ Free tier limits enforced
- ✅ Paywall shows when limit reached
- ✅ Upgrading unlocks features immediately
- ✅ Limits sync across platforms

---

### Story 9.4: Ad Integration (Free Tier)

**Estimated Time**: 6-8 hours

**Tasks**:

- [ ] Add Google AdMob SDK

  - Via SPM or CocoaPods
  - Configure AdMob app ID

- [ ] Implement AdManager

  - Load banner ads
  - Show at appropriate locations
  - Handle ad loading errors

- [ ] Add ads to views (non-intrusive)

  - Bottom banner on restaurant search results
  - Native ad in collections list (every 5th item)
  - No ads on decision/voting screens (critical UX)

- [ ] Hide ads for premium users

  - Check subscription status
  - Don't load ads if premium

- [ ] Test ad display
  - Use test ad units in development
  - Switch to production ads for release

**Deliverables**:

- ✅ Ads displaying for free users
- ✅ Ads hidden for premium users
- ✅ Ads non-intrusive (bottom banners only)
- ✅ Ads clearly labeled
- ✅ Compliant with App Store guidelines

**Code Example**:

```swift
// Services/AdManager.swift
import GoogleMobileAds

class AdManager: NSObject, ObservableObject {
    static let shared = AdManager()

    @Published var bannerView: GADBannerView?

    private let storeKit = StoreKitManager.shared

    func loadBanner(for viewController: UIViewController) {
        // Don't show ads for premium users
        guard !storeKit.isPremium else {
            bannerView = nil
            return
        }

        let banner = GADBannerView(adSize: GADAdSizeBanner)
        banner.adUnitID = "ca-app-pub-xxxxx/xxxxx" // Your ad unit ID
        banner.rootViewController = viewController
        banner.load(GADRequest())

        bannerView = banner
    }
}

// Usage in SwiftUI
struct AdBannerView: UIViewRepresentable {
    func makeUIView(context: Context) -> GADBannerView {
        let banner = GADBannerView(adSize: GADAdSizeBanner)
        banner.adUnitID = "ca-app-pub-xxxxx/xxxxx"
        banner.load(GADRequest())
        return banner
    }

    func updateUIView(_ uiView: GADBannerView, context: Context) {}
}

// In a view
struct RestaurantSearchView: View {
    @EnvironmentObject var storeKit: StoreKitManager

    var body: some View {
        VStack(spacing: 0) {
            // Search results
            ScrollView {
                // ...
            }

            // Ad banner (if free tier)
            if !storeKit.isPremium {
                AdBannerView()
                    .frame(height: 50)
            }
        }
    }
}
```

---

## 🔄 Parallel Work Groups

**Week 1**:

- Day 1-3: Story 9.1 (StoreKit) - Must be first
- Day 4-5: Stories 9.2 + 9.3 in parallel (Paywall + Limits)
- Day 6-7: Story 9.4 (Ads)

**Testing**: Ongoing throughout week

---

## ✅ Epic Completion Checklist

**In-App Purchases**:

- [ ] Products configured in App Store Connect
- [ ] Products load in app
- [ ] Can purchase monthly subscription
- [ ] Can purchase yearly subscription
- [ ] Can restore purchases
- [ ] Subscription status syncs with backend
- [ ] Premium unlocks features immediately

**Feature Gating**:

- [ ] Collection limit enforced (10 for free)
- [ ] Group limit enforced (3 for free)
- [ ] History limit enforced (30 days for free)
- [ ] Tiered voting premium-only
- [ ] Advanced features gated

**Paywall**:

- [ ] Shows at correct times
- [ ] Clear value proposition
- [ ] Pricing options clear
- [ ] Purchase flow smooth
- [ ] Restore purchases working

**Ads**:

- [ ] Ads display for free users
- [ ] Ads hidden for premium users
- [ ] Ads non-intrusive
- [ ] Ads clearly labeled
- [ ] Compliant with guidelines

**Testing**:

- [ ] Test purchase flow (Sandbox environment)
- [ ] Test restore purchases
- [ ] Test subscription expiration
- [ ] Test premium feature access
- [ ] Test ads on free tier

---

## 🐛 Common Issues

**Issue**: "Products not loading"

- **Solution**: Check product IDs match App Store Connect, verify Paid Applications agreement signed.

**Issue**: "Purchase fails"

- **Solution**: Test in Sandbox environment, verify test account configured.

**Issue**: "Restore doesn't work"

- **Solution**: Ensure restore button calls AppStore.sync(), check transaction verification.

---

## 💰 Revenue Expectations

**Conservative Estimates** (Based on freemium SaaS benchmarks):

**Year 1**:

- 1,000 users
- 3% conversion rate to premium = 30 paying users
- $0.99/month × 30 users = $29.70/month
- **Annual (Year 1)**: ~$350

**Year 2** (Price increase to $3.99):

- 5,000 users
- 5% conversion rate = 250 paying users
- $3.99/month × 250 users = $997.50/month
- **Annual (Year 2)**: ~$12,000

**Year 3+**:

- Scale to 20k+ users
- Maintain 5-8% conversion
- **Annual**: $50k-$100k potential

---

**Next**: [Epic 10: Testing & QA](./epic-10-testing-qa.md)

**Monetization keeps the lights on! 💰**
