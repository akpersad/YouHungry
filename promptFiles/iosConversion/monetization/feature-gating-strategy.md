# Feature Gating Implementation

Technical guide to implementing feature limits and premium checks.

---

## 🎯 Overview

**Feature Gating** = Restricting features based on subscription status

**Requirements**:

- Check premium status before allowing feature use
- Show paywall when limit reached
- Graceful degradation (free users still get value)
- Synced across platforms (web + iOS)

---

## 🔒 Premium Check Service

```swift
// Services/FeatureGateManager.swift
import Foundation

@MainActor
class FeatureGateManager: ObservableObject {
    static let shared = FeatureGateManager()

    @Published var showPaywall = false
    @Published var paywallReason: PaywallReason?

    private let storeKit = StoreKitManager.shared
    private let analytics = AnalyticsService.shared

    enum PaywallReason {
        case collectionLimit
        case groupLimit
        case historyLimit
        case tieredVoting
        case advancedFilters
        case customTags

        var title: String {
            switch self {
            case .collectionLimit: return "Unlock Unlimited Collections"
            case .groupLimit: return "Join Unlimited Groups"
            case .historyLimit: return "See Your Full History"
            case .tieredVoting: return "Vote Fairly with Tiered Voting"
            case .advancedFilters: return "Unlock Advanced Search Filters"
            case .customTags: return "Organize with Custom Tags"
            }
        }

        var message: String {
            switch self {
            case .collectionLimit:
                return "You've reached the free limit of 10 collections. Upgrade to Premium for unlimited collections!"
            case .groupLimit:
                return "You've joined 3 groups (free limit). Upgrade to Premium to join unlimited groups!"
            case .historyLimit:
                return "Free users can view 30 days of history. Upgrade to see your full restaurant history!"
            case .tieredVoting:
                return "Tiered voting ensures fair group decisions. Upgrade to Premium to vote!"
            case .advancedFilters:
                return "Filter by cuisine, price, and rating with Premium!"
            case .customTags:
                return "Organize restaurants your way with custom tags. Upgrade to Premium!"
            }
        }
    }

    // MARK: - Check Functions

    func canCreateCollection(currentCount: Int) -> Bool {
        if storeKit.isPremium {
            return true
        }

        if currentCount >= 10 {
            showPaywallFor(.collectionLimit)
            return false
        }

        return true
    }

    func canJoinGroup(currentCount: Int) -> Bool {
        if storeKit.isPremium {
            return true
        }

        if currentCount >= 3 {
            showPaywallFor(.groupLimit)
            return false
        }

        return true
    }

    func canViewHistory(daysAgo: Int) -> Bool {
        if storeKit.isPremium {
            return true
        }

        if daysAgo > 30 {
            showPaywallFor(.historyLimit)
            return false
        }

        return true
    }

    func canUseTieredVoting() -> Bool {
        if storeKit.isPremium {
            return true
        }

        showPaywallFor(.tieredVoting)
        return false
    }

    func canUseAdvancedFilters() -> Bool {
        if storeKit.isPremium {
            return true
        }

        showPaywallFor(.advancedFilters)
        return false
    }

    // MARK: - Show Paywall

    private func showPaywallFor(_ reason: PaywallReason) {
        paywallReason = reason
        showPaywall = true

        // Log analytics
        analytics.log(event: .paywallShown(reason: reason.title))
    }
}
```

---

## 🎨 Paywall UI

```swift
// Features/Monetization/Views/PaywallView.swift
struct PaywallView: View {
    let reason: FeatureGateManager.PaywallReason
    @EnvironmentObject var storeKit: StoreKitManager
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 32) {
                    // Icon
                    Image(systemName: iconForReason)
                        .font(.system(size: 72))
                        .foregroundColor(.accentInfrared)

                    // Title
                    Text(reason.title)
                        .font(.displayMedium)
                        .multilineTextAlignment(.center)

                    // Message
                    Text(reason.message)
                        .font(.bodyMedium)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)

                    // Features
                    VStack(alignment: .leading, spacing: 16) {
                        FeatureRow(icon: "infinity", title: "Unlimited Collections & Groups")
                        FeatureRow(icon: "chart.bar", title: "Advanced Voting & Decision Making")
                        FeatureRow(icon: "clock.arrow.circlepath", title: "Full History & Analytics")
                        FeatureRow(icon: "tag", title: "Custom Tags & Organization")
                        FeatureRow(icon: "speaker.slash", title: "Ad-Free Experience")
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 20)
                            .fill(Color.cardBackground)
                            .neuShadow()
                    )

                    // Pricing
                    VStack(spacing: 16) {
                        ForEach(storeKit.products) { product in
                            SubscriptionButton(product: product) {
                                Task {
                                    do {
                                        try await storeKit.purchase(product)
                                        dismiss()
                                    } catch {
                                        // Handle error
                                    }
                                }
                            }
                        }
                    }

                    // Restore
                    Button("Restore Purchases") {
                        Task {
                            await storeKit.restorePurchases()
                        }
                    }
                    .font(.caption)
                    .foregroundColor(.secondary)

                    // Maybe Later
                    Button("Maybe Later") {
                        dismiss()
                    }
                    .font(.body)
                    .foregroundColor(.secondary)
                }
                .padding()
            }
            .navigationTitle("Upgrade to Premium")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
        }
    }

    private var iconForReason: String {
        switch reason {
        case .collectionLimit: return "folder.badge.plus"
        case .groupLimit: return "person.3.fill"
        case .historyLimit: return "clock.arrow.circlepath"
        case .tieredVoting: return "chart.bar.fill"
        case .advancedFilters: return "slider.horizontal.3"
        case .customTags: return "tag.fill"
        }
    }
}

struct SubscriptionButton: View {
    let product: Product
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                VStack(alignment: .leading) {
                    Text(product.displayName)
                        .font(.headline)

                    if let subscription = product.subscription {
                        Text(subscription.subscriptionPeriod.unit.localizedDescription)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                Text(product.displayPrice)
                    .font(.title2)
                    .fontWeight(.bold)
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.accentInfrared)
            )
            .foregroundColor(.white)
        }
    }
}
```

---

## 🔄 Usage in ViewModels

### Collections Example

```swift
// Features/Collections/ViewModels/CollectionsViewModel.swift
@MainActor
class CollectionsViewModel: ObservableObject {
    @Published var collections: [Collection] = []
    @Published var showPaywall = false

    private let featureGate = FeatureGateManager.shared

    func createCollection(name: String) async {
        // Check limit
        guard featureGate.canCreateCollection(currentCount: collections.count) else {
            // Paywall shown automatically by FeatureGateManager
            return
        }

        // Proceed with creation
        // ...
    }
}

// In View
struct CollectionsListView: View {
    @StateObject private var viewModel = CollectionsViewModel()
    @StateObject private var featureGate = FeatureGateManager.shared

    var body: some View {
        List(viewModel.collections) { collection in
            // ...
        }
        .sheet(isPresented: $featureGate.showPaywall) {
            if let reason = featureGate.paywallReason {
                PaywallView(reason: reason)
            }
        }
    }
}
```

---

## 📊 Feature Gate Tracking

### Analytics

**Track These Events**:

- Paywall shown (which reason)
- Paywall dismissed (user declined)
- Upgrade completed (from paywall)
- Feature usage (premium vs free)

```swift
// Log paywall events
analytics.log(event: .paywallShown(reason: "group_limit"))
analytics.log(event: .paywallDismissed(reason: "group_limit"))
analytics.log(event: .upgradedFromPaywall(reason: "group_limit"))

// Track conversion by reason
// Which paywall converts best? Optimize messaging!
```

---

## ✅ Implementation Checklist

**FeatureGateManager**:

- [ ] Implemented with all check functions
- [ ] Integrated with StoreKitManager
- [ ] Analytics logging

**Paywall Views**:

- [ ] PaywallView created and polished
- [ ] Displays correct reason
- [ ] Purchase flow working
- [ ] Restore purchases accessible

**Integration**:

- [ ] All ViewModels check premium status
- [ ] Limits enforced (collections, groups, history)
- [ ] Premium features gated (tiered voting, filters, tags)
- [ ] Paywall shows at correct times

**User Experience**:

- [ ] Paywall not annoying (doesn't show too often)
- [ ] Can dismiss and continue as free user
- [ ] Clear value proposition
- [ ] Upgrade flow smooth

**Testing**:

- [ ] Tested as free user (hits all limits)
- [ ] Tested as premium user (no limits)
- [ ] Tested upgrade flow (free → premium)
- [ ] Tested restore purchases

---

**Feature gating drives upgrades when done right! 🔒**
