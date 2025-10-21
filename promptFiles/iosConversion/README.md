# iOS Conversion Documentation Suite

**Project**: Fork In The Road - Native iOS App
**Framework**: Swift + SwiftUI
**iOS Support**: iOS 16+ (optimized for iOS 26 with Liquid Glass design)
**Timeline**: 2-3 months aggressive development
**Target**: App Store submission

---

## 🎯 Quick Start

**New to this project?** Start here:

1. Read [Human Guide - Getting Started](./human-guide/getting-started.md)
2. Review [Pre-Development Checklist](./checklists/pre-development-checklist.md)
3. Set up your [Xcode Environment](./human-guide/xcode-setup.md)
4. Complete [Web App Epic 11](../promptFiles/planning/epic-breakdown.md#epic-11) (prerequisite work)

**Ready to build?** Jump to:

- [Epic Breakdown](./epic-breakdown/epic-01-foundation.md) - Start with Epic 1
- [Architecture Overview](./agent-guides/01-architecture-overview.md) - Technical foundation

---

## 📚 Documentation Structure

### For Humans (You!)

| Document                                                            | Purpose                           | Time to Read |
| ------------------------------------------------------------------- | --------------------------------- | ------------ |
| [Getting Started](./human-guide/getting-started.md)                 | Your step-by-step setup guide     | 10 min       |
| [Xcode Setup](./human-guide/xcode-setup.md)                         | Install and configure Xcode       | 15 min       |
| [Building & Running](./human-guide/building-and-running.md)         | Run the app on simulator/device   | 5 min        |
| [App Store Connect Setup](./human-guide/app-store-connect-setup.md) | Prepare for TestFlight/submission | 20 min       |
| [Certificate Management](./human-guide/certificate-management.md)   | Code signing and provisioning     | 15 min       |
| [Submission Process](./human-guide/submission-process.md)           | Submit to App Store               | 30 min       |

### For AI Agents (Development Guides)

| Document                                                                 | Purpose                     |
| ------------------------------------------------------------------------ | --------------------------- |
| [01 - Architecture Overview](./agent-guides/01-architecture-overview.md) | High-level system design    |
| [02 - Component Mapping](./agent-guides/02-component-mapping.md)         | Web → iOS conversion guide  |
| [03 - API Integration](./agent-guides/03-api-integration.md)             | Backend communication       |
| [04 - Authentication Flow](./agent-guides/04-authentication-flow.md)     | Clerk + Sign in with Apple  |
| [05 - Data Models](./agent-guides/05-data-models.md)                     | Swift models and Core Data  |
| [06 - Offline Strategy](./agent-guides/06-offline-strategy.md)           | Caching and sync            |
| [07 - Notification System](./agent-guides/07-notification-system.md)     | Firebase Cloud Messaging    |
| [08 - Design System iOS](./agent-guides/08-design-system-ios.md)         | Liquid Glass + Neumorphism  |
| [09 - Testing Strategy](./agent-guides/09-testing-strategy.md)           | Unit, integration, UI tests |

### Epic Breakdown (Development Phases)

**Aggressive 2-3 Month Timeline** 🏃‍♂️💨

| Epic                                                                   | Focus                          | Duration  | Priority        |
| ---------------------------------------------------------------------- | ------------------------------ | --------- | --------------- |
| [Epic 1: Foundation](./epic-breakdown/epic-01-foundation.md)           | Xcode, SwiftUI, Design System  | 2-3 weeks | 🔴 Critical     |
| [Epic 2: Authentication](./epic-breakdown/epic-02-authentication.md)   | Clerk + Apple Sign-in          | 1-2 weeks | 🔴 Critical     |
| [Epic 3: Collections](./epic-breakdown/epic-03-collections.md)         | Personal collections, search   | 2-3 weeks | 🔴 Critical     |
| [Epic 4: Groups](./epic-breakdown/epic-04-groups.md)                   | Group management               | 1-2 weeks | 🟠 High         |
| [Epic 5: Decisions](./epic-breakdown/epic-05-decisions.md)             | Voting, random selection       | 2-3 weeks | 🟠 High         |
| [Epic 6: Notifications](./epic-breakdown/epic-06-notifications.md)     | Push, SMS, Email               | 1-2 weeks | 🟡 Medium       |
| [Epic 7: Offline & Polish](./epic-breakdown/epic-07-offline-polish.md) | Caching, performance           | 1-2 weeks | 🟡 Medium       |
| [Epic 8: iOS Features](./epic-breakdown/epic-08-ios-features.md)       | Widgets, Siri, Live Activities | 1-2 weeks | 🟢 Nice to Have |
| [Epic 9: Monetization](./epic-breakdown/epic-09-monetization.md)       | IAP, ads, premium features     | 1 week    | 🟡 Medium       |
| [Epic 10: Testing & QA](./epic-breakdown/epic-10-testing-qa.md)        | Beta testing, bug fixes        | 2-3 weeks | 🔴 Critical     |
| [Epic 11: App Store](./epic-breakdown/epic-11-app-store.md)            | Compliance, submission         | 1 week    | 🔴 Critical     |

**Total**: 15-24 weeks (aggressive: 8-12 weeks with parallel work)

### Checklists

| Checklist                                                              | When to Use                  |
| ---------------------------------------------------------------------- | ---------------------------- |
| [Pre-Development](./checklists/pre-development-checklist.md)           | Before starting Epic 1       |
| [Per-Epic Checklists](./checklists/per-epic-checklists.md)             | At start of each epic        |
| [App Store Submission](./checklists/app-store-submission-checklist.md) | Before submitting to Apple   |
| [Testing Checklist](./checklists/testing-checklist.md)                 | Before each TestFlight build |

### App Store Compliance

| Document                                                                             | Purpose                 |
| ------------------------------------------------------------------------------------ | ----------------------- |
| [Privacy Policy Requirements](./app-store-compliance/privacy-policy-requirements.md) | What Apple requires     |
| [Data Disclosure Guide](./app-store-compliance/data-disclosure-guide.md)             | App Store Connect forms |
| [Screenshot Requirements](./app-store-compliance/screenshot-requirements.md)         | Marketing materials     |
| [Review Guidelines Checklist](./app-store-compliance/review-guidelines-checklist.md) | Avoid rejection         |

### Monetization Strategy

| Document                                                                           | Purpose                         |
| ---------------------------------------------------------------------------------- | ------------------------------- |
| [Freemium Strategy](./monetization/freemium-strategy.md)                           | Free vs Premium features        |
| [In-App Purchase Implementation](./monetization/in-app-purchase-implementation.md) | StoreKit 2 setup                |
| [Pricing Analysis](./monetization/pricing-analysis.md)                             | Competitive pricing             |
| [Feature Gating Strategy](./monetization/feature-gating-strategy.md)               | Technical implementation        |
| [Ad Integration Guide](./monetization/ad-integration-guide.md)                     | Non-intrusive ads for free tier |

### Historical Documentation

| Document                                                                   | Purpose                      |
| -------------------------------------------------------------------------- | ---------------------------- |
| [Planning Questions & Answers](./historical/planning-questions-answers.md) | All 3 rounds of Q&A combined |

---

## 🚀 Development Workflow

### Phase 1: Foundation (Weeks 1-3)

1. Complete Web App Epic 11 (Sign in with Apple, API docs)
2. Set up Xcode and iOS project
3. Implement design system (Liquid Glass + Neumorphism)
4. Build authentication (Clerk + Apple)

### Phase 2: Core Features (Weeks 4-7)

1. Collections management
2. Restaurant search integration
3. Group management
4. Decision making (voting + random)

### Phase 3: Polish & Features (Weeks 8-10)

1. Notifications (Push, SMS, Email)
2. Offline support and caching
3. iOS-specific features (Widgets, Siri, etc.)
4. Monetization (IAP + Ads)

### Phase 4: Launch (Weeks 11-12)

1. Beta testing (TestFlight)
2. Bug fixes and polish
3. App Store compliance review
4. Submit to App Store

---

## 🔧 Technology Stack

### iOS Development

- **Language**: Swift 6
- **UI Framework**: SwiftUI
- **Architecture**: MVVM (Model-View-ViewModel)
- **Min iOS**: 16.0
- **Target iOS**: 26.0 (Liquid Glass features)

### Backend & Services

- **Mobile API**: Node.js/Express on Render
- **Database**: MongoDB (shared with web)
- **Auth**: Clerk iOS SDK + Sign in with Apple
- **Search**: Google Places API
- **SMS**: Twilio
- **Email**: Resend
- **Push**: Firebase Cloud Messaging (FCM)
- **Analytics**: Firebase Analytics + Apple Analytics
- **Crash Reporting**: Firebase Crashlytics

### Data & Persistence

- **Local Storage**: Core Data
- **Caching**: URLCache + NSCache
- **Image Caching**: SDWebImage or Kingfisher
- **Keychain**: Secure credential storage

### Monetization

- **In-App Purchases**: StoreKit 2
- **Ads**: Google AdMob (for free tier)
- **Subscription Management**: RevenueCat (optional)

---

## 📊 Key Metrics & Success Criteria

### Performance Targets

- **App Launch**: < 2 seconds (cold start)
- **API Response**: < 500ms (cached), < 2s (fresh)
- **UI Responsiveness**: 60 FPS minimum
- **Memory Usage**: < 150MB typical
- **Battery Impact**: < 5% per hour of active use

### User Experience Goals

- **Crash-Free Rate**: > 99.5%
- **User Retention**: > 40% (30-day)
- **App Store Rating**: > 4.5 stars
- **Feature Adoption**: > 60% use groups within 7 days

### App Store Compliance

- **Review Time**: 1-3 days (if compliant)
- **Rejection Rate**: < 10% (target: 0%)
- **Update Frequency**: Bi-weekly during beta, monthly post-launch

---

## 🎨 Design Philosophy

### Liquid Glass (iOS 26) + Neumorphism Hybrid

**System UI (Liquid Glass)**:

- Navigation bars
- Tab bars
- Sheets and modals
- System controls (buttons, toggles)
- Translucent, fluid, refracts background

**Brand Identity (Neumorphism)**:

- Restaurant cards
- Collection views
- Decision interfaces
- Custom components
- Soft shadows, depth, tactile feel

**Result**: Native iOS feel + recognizable brand consistency

---

## 🔐 Security & Privacy

### Data Protection

- **Encryption**: All API calls over HTTPS
- **Keychain**: Store auth tokens securely
- **Biometric Auth**: Face ID/Touch ID for login
- **Privacy**: No data sharing with third parties (except required services)

### Compliance

- **GDPR**: User data export/deletion
- **CCPA**: California privacy compliance
- **Apple Privacy**: Nutrition labels accurate
- **Terms & Privacy**: Accessible in-app

---

## 📱 Cross-Platform Strategy

### Shared Backend

- Web app (Next.js) → Next.js API Routes (Vercel)
- iOS app → Dedicated Mobile API (Render)
- Both → MongoDB + External Services

### Data Sync

- Real-time sync via API polling (5-minute intervals)
- Optimistic updates for instant feedback
- Conflict resolution (last-write-wins)
- Background sync when app returns to foreground

### Feature Parity

- 100% feature parity with web app
- iOS-exclusive features (Widgets, Siri, Live Activities)
- Progressive enhancement (new features deployed to both)

---

## 🐛 Known Issues & Limitations

### Pre-Development

1. **Web App Epic 11**: Must be completed before iOS development starts
2. **Apple Developer Account**: $99/year required for App Store submission
3. **Render Account**: Mobile API hosting (free tier to start)
4. **Firebase Project**: Setup required for analytics and push notifications

### Technical Debt

1. **API Versioning**: Not yet implemented, add during Web App Epic 11
2. **GraphQL**: Planned for future, using REST for MVP
3. **Offline Queue**: Submit votes offline (Phase 3 feature)

---

## 🆘 Support & Resources

### Internal Resources

- **Web App Repo**: Current Next.js codebase (reference)
- **Design System**: [promptFiles/architecture/design-system.md](../promptFiles/architecture/design-system.md)
- **Technical Architecture**: [promptFiles/architecture/technical-architecture.md](../promptFiles/architecture/technical-architecture.md)

### External Resources

- **Apple Documentation**: [developer.apple.com](https://developer.apple.com)
- **SwiftUI Tutorials**: [hackingwithswift.com](https://www.hackingwithswift.com)
- **Clerk iOS SDK**: [clerk.com/docs/quickstarts/ios](https://clerk.com/docs/quickstarts/ios)
- **Firebase iOS**: [firebase.google.com/docs/ios](https://firebase.google.com/docs/ios)

### Getting Help

- **Technical Issues**: Review agent guides first, then debug with Xcode
- **Design Questions**: Reference design-system-ios.md
- **App Store Questions**: Check review-guidelines-checklist.md
- **API Issues**: Refer to Web App documentation

---

## 🎉 Ready to Start?

1. **Read**: [Getting Started Guide](./human-guide/getting-started.md)
2. **Complete**: [Pre-Development Checklist](./checklists/pre-development-checklist.md)
3. **Prep**: Complete Web App Epic 11 (Sign in with Apple, API docs)
4. **Build**: Start [Epic 1: Foundation](./epic-breakdown/epic-01-foundation.md)

Let's build an amazing iOS app! 🚀

---

**Last Updated**: October 21, 2025
**Document Version**: 1.0.0
**Status**: Ready for Development
