# Ad Integration Guide

Guide to implementing non-intrusive ads for free tier using Google AdMob.

---

## 🎯 Strategy

**Ad Philosophy**: Ads should be present but NOT annoying. Users should want to upgrade to remove them, but tolerate them if staying free.

**Ad Placement** (Non-Intrusive):

- ✅ Bottom banner on restaurant search results (small, doesn't block content)
- ✅ Native ad in collections list (every 5-8 items, looks like content)
- ❌ NO pop-ups or interstitials (annoying)
- ❌ NO ads on decision/voting screens (critical UX)
- ❌ NO ads during onboarding (poor first impression)

**Premium Users**: ZERO ads (ad-free is a premium benefit)

---

## 📱 Google AdMob Setup

### 1. Create AdMob Account

**Steps**:

1. Go to [admob.google.com](https://admob.google.com)
2. Sign up with Google account
3. Accept terms
4. Create app:
   - Platform: iOS
   - App name: Fork In The Road
   - Is your app listed on a supported app store?: Not yet (select "No")

### 2. Create Ad Units

**Ad Unit 1: Banner (Search Results)**

- Format: Banner
- Ad unit name: "Search Results Banner"
- Copy Ad Unit ID: `ca-app-pub-3940256099942544/2934735716` (test) → replace with your ID in production

**Ad Unit 2: Native (Collections List)**

- Format: Native Advanced
- Ad unit name: "Collections Native"
- Copy Ad Unit ID

---

## 💻 AdMob SDK Integration

### Installation

```swift
// Package.swift or use CocoaPods
dependencies: [
    .package(url: "https://github.com/googleads/swift-package-manager-google-mobile-ads", from: "11.0.0")
]

// Or CocoaPods (Podfile)
pod 'Google-Mobile-Ads-SDK', '~> 11.0'
```

### Configuration

```swift
// App/YouHungryApp.swift
import GoogleMobileAds

@main
struct YouHungryApp: App {
    init() {
        // Initialize Mobile Ads SDK
        GADMobileAds.sharedInstance().start(completionHandler: nil)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}

// Info.plist - Add AdMob App ID
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-xxxxxxxxxxxxx~yyyyyyyyyy</string> // Your AdMob app ID

// SKAdNetwork identifiers (for ad attribution)
<key>SKAdNetworkItems</key>
<array>
  <dict>
    <key>SKAdNetworkIdentifier</key>
    <string>cstr6suwn9.skadnetwork</string>
  </dict>
  // Add all from Google's documentation
</array>
```

---

## 🎨 Banner Ad Implementation

```swift
// Services/AdManager.swift
import GoogleMobileAds
import SwiftUI

class AdManager: NSObject, ObservableObject, GADBannerViewDelegate {
    static let shared = AdManager()

    @Published var bannerView: GADBannerView?
    @Published var bannerHeight: CGFloat = 50

    private let storeKit = StoreKitManager.shared

    // Test ad unit ID (use in development)
    private let testBannerID = "ca-app-pub-3940256099942544/2934735716"

    // Production ad unit ID (use in release)
    private let prodBannerID = "ca-app-pub-YOUR_ID/YOUR_BANNER_ID"

    private var adUnitID: String {
        #if DEBUG
        return testBannerID
        #else
        return prodBannerID
        #endif
    }

    func loadBanner(rootViewController: UIViewController, adSize: GADAdSize = GADAdSizeBanner) {
        // Don't load ads for premium users
        guard !storeKit.isPremium else {
            bannerView = nil
            return
        }

        let banner = GADBannerView(adSize: adSize)
        banner.adUnitID = adUnitID
        banner.rootViewController = rootViewController
        banner.delegate = self
        banner.load(GADRequest())

        self.bannerView = banner
    }

    // MARK: - GADBannerViewDelegate

    func bannerViewDidReceiveAd(_ bannerView: GADBannerView) {
        print("Banner ad loaded")
        bannerHeight = bannerView.adSize.size.height
    }

    func bannerView(_ bannerView: GADBannerView, didFailToReceiveAdWithError error: Error) {
        print("Banner ad failed to load: \(error.localizedDescription)")
        // Hide ad space if no ad available
        self.bannerView = nil
    }
}

// SwiftUI Wrapper
struct BannerAdView: UIViewRepresentable {
    @StateObject private var adManager = AdManager.shared
    @EnvironmentObject var storeKit: StoreKitManager

    func makeUIView(context: Context) -> UIView {
        let view = UIView()

        if !storeKit.isPremium {
            DispatchQueue.main.async {
                if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                   let rootViewController = windowScene.windows.first?.rootViewController {
                    adManager.loadBanner(rootViewController: rootViewController)
                }
            }
        }

        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        uiView.subviews.forEach { $0.removeFromSuperview() }

        if !storeKit.isPremium, let bannerView = adManager.bannerView {
            uiView.addSubview(bannerView)
            bannerView.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                bannerView.centerXAnchor.constraint(equalTo: uiView.centerXAnchor),
                bannerView.topAnchor.constraint(equalTo: uiView.topAnchor),
                bannerView.bottomAnchor.constraint(equalTo: uiView.bottomAnchor)
            ])
        }
    }
}
```

---

## 🎯 Usage in Views

### Restaurant Search (Banner Ad)

```swift
struct RestaurantSearchView: View {
    @StateObject private var viewModel = RestaurantSearchViewModel()
    @EnvironmentObject var storeKit: StoreKitManager

    var body: some View {
        VStack(spacing: 0) {
            // Search results
            ScrollView {
                LazyVStack(spacing: 16) {
                    ForEach(viewModel.restaurants) { restaurant in
                        RestaurantCard(restaurant: restaurant)
                    }
                }
                .padding()
            }

            // Ad banner at bottom (if free tier)
            if !storeKit.isPremium {
                VStack(spacing: 0) {
                    Divider()

                    HStack {
                        Text("Ad")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                Capsule()
                                    .fill(Color.gray.opacity(0.2))
                            )

                        Spacer()
                    }
                    .padding(.horizontal, 8)
                    .padding(.top, 4)

                    BannerAdView()
                        .frame(height: 50)
                }
                .background(Color.backgroundSecondary)
            }
        }
    }
}
```

---

## 📊 Ad Revenue Expectations

### Revenue Model

**CPM** (Cost per 1,000 impressions): $1-$5 typical for non-targeted ads
**CTR** (Click-through rate): 0.5-2%

**Conservative Estimate**:

- 1,000 free users
- Each sees 10 ads per session
- 3 sessions per week
- = 30 ad impressions per user per week
- = 30,000 impressions per week
- At $2 CPM = $60/week
- **Monthly ad revenue**: ~$240
- After 32% ad network cut: ~$160/month

**Comparison to Premium**:

- 30 premium users @ $0.99 = $29.70/month
- Ads from 970 free users = ~$160/month
- **Total revenue**: ~$190/month

**Insight**: Ads actually generate MORE revenue than premium in early stages! But premium is sustainable long-term.

---

## ✅ Ad Compliance

### App Store Requirements

**Must**:

- [ ] Clearly label ads ("Ad" or "Sponsored")
- [ ] Ads appropriate for age rating (4+)
- [ ] No ads that mimic app UI (confuse users)
- [ ] Respect user privacy (use SKAdNetwork)

**Cannot**:

- ❌ Force users to watch ads
- ❌ Show ads before app is usable
- ❌ Use deceptive ad placement

**Your Implementation**: Compliant! ✅

### User Privacy

**Use SKAdNetwork**:

- Apple's privacy-preserving ad attribution
- No tracking of individual users
- Aggregated attribution data only

```swift
// AdMob automatically uses SKAdNetwork
// Just ensure Info.plist has SKAdNetworkItems
```

---

## 🎨 Ad Best Practices

### Non-Intrusive Placement

**Good**:

- Bottom of screen (doesn't block content)
- Native ads that match design (blend in)
- Clearly labeled
- Easy to ignore

**Bad**:

- Pop-ups (annoying)
- Full-screen interstitials (disruptive)
- Auto-play video (battery drain)
- Fake close buttons (deceptive)

### Refresh Rate

**Banner Ads**:

- Refresh every 60 seconds (AdMob default)
- Don't refresh too often (annoying)

**Native Ads**:

- Static (don't refresh while user viewing)

---

## ✅ Ad Integration Checklist

**Setup**:

- [ ] AdMob account created
- [ ] App added to AdMob
- [ ] Ad units created
- [ ] SDK integrated
- [ ] App ID in Info.plist
- [ ] SKAdNetwork items in Info.plist

**Implementation**:

- [ ] BannerAdView created
- [ ] Only shows for free users
- [ ] Clearly labeled ("Ad")
- [ ] Bottom placement (non-intrusive)

**Testing**:

- [ ] Test ads load (use test IDs)
- [ ] Test premium users see no ads
- [ ] Test ad clicks work
- [ ] Verified compliant with guidelines

**Production**:

- [ ] Replace test ad units with production IDs
- [ ] Verify ads appropriate for 4+ rating
- [ ] Monitor ad revenue in AdMob dashboard

---

## 🚨 Avoid Rejection

**Apple Rejects If**:

- Ads obstruct core functionality
- Ads not clearly labeled
- Ads inappropriate for age rating
- Ads use tracking without consent

**Your Implementation**:

- ✅ Ads at bottom (don't obstruct)
- ✅ Clearly labeled
- ✅ Family-friendly (4+)
- ✅ Uses SKAdNetwork (privacy-preserving)

---

**Ads provide revenue while building premium base! 📱**
