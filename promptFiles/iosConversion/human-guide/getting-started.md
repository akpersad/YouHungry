# Getting Started - iOS Development

**Welcome!** This guide will help you set up your development environment and start building the Fork In The Road iOS app.

---

## 🎯 Overview

You're about to build a native iOS app using **Swift + SwiftUI** that connects to your existing backend infrastructure. This app will have:

- Full feature parity with the web app
- iOS-exclusive features (Widgets, Siri, Live Activities)
- Liquid Glass design language (iOS 26) + your neumorphism brand
- Freemium monetization with In-App Purchases

**Timeline**: 2-3 months aggressive development
**Your Role**: 20% (review, adjustments, testing)
**AI Role**: 80% (code generation, implementation)

---

## ✅ Prerequisites Checklist

### 1. Hardware & Software

- [ ] **Mac computer** running macOS 15.2 or later (you have: macOS 15.7.1) ✅
- [ ] **Xcode 26.0.1** installed (you have this) ✅
- [ ] **Minimum 50GB free disk space** (Xcode + simulators + project)
- [ ] **16GB RAM minimum** (32GB recommended for smooth development)

### 2. Accounts & Services

- [ ] **Apple ID** (free tier OK for now) ✅
- [ ] **Apple Developer Program** ($99/year - enroll when ready for TestFlight)
- [ ] **GitHub account** (for version control)
- [ ] **Render account** (for mobile API hosting - free tier available)
- [ ] **Firebase account** (for analytics & push notifications - free)

### 3. Web App Prerequisites

- [ ] **Complete Web App Epic 11** (MUST be done first!)
  - Add Sign in with Apple to web app
  - Document all API endpoints
  - Update Privacy Policy for iOS
  - Extract business logic for mobile API

---

## 🚀 Quick Start (30-Minute Setup)

### Step 1: Verify Xcode Installation (5 min)

```bash
# Check Xcode version
xcodebuild -version
# Should show: Xcode 26.0.1

# Check installed simulators
xcrun simctl list devices

# Install command line tools (if not already)
xcode-select --install
```

### Step 2: Create Firebase Project (10 min)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Add project"
3. Name: "fork-in-the-road-ios" (or similar)
4. Enable Google Analytics: YES
5. Create project
6. Add iOS app:
   - iOS bundle ID: `com.forkintheroad.app` (choose yours)
   - App nickname: "Fork In The Road iOS"
   - Download `GoogleService-Info.plist` (save for later)

### Step 3: Set Up Render Account (5 min)

1. Go to [render.com](https://render.com)
2. Sign up (free tier)
3. Connect your GitHub account
4. Don't create anything yet - we'll do this in Epic 1

### Step 4: Clone/Create iOS Project (10 min)

```bash
# Navigate to your projects directory
cd ~/Documents/Development/PersonalProjects/

# Create iOS project directory
mkdir fork-in-the-road-ios
cd fork-in-the-road-ios

# Initialize git
git init
git branch -M main

# Create .gitignore for iOS
curl https://raw.githubusercontent.com/github/gitignore/main/Swift.gitignore -o .gitignore
```

**Note**: We'll create the Xcode project in Epic 1. For now, just have the directory ready.

---

## 📋 Development Workflow

### Daily Workflow (Burning the Midnight Oil 🔥)

1. **Pull Latest Code**

   ```bash
   git pull origin main
   ```

2. **Open Xcode Project**

   ```bash
   open ForkInTheRoad.xcodeproj
   ```

3. **Work on Current Epic Story**

   - Read the story details in epic breakdown
   - AI generates code (me!)
   - You review and test
   - Run on simulator/device

4. **Test Changes**

   - Run in simulator (Cmd+R)
   - Test on physical device
   - Check for crashes/bugs

5. **Commit & Push**
   ```bash
   git add .
   git commit -m "Epic X Story Y: Description"
   git push origin main
   ```

### Weekly Workflow

- **Monday**: Plan week's stories
- **Daily**: 2-3 hours of development
- **Friday**: Review progress, deploy TestFlight build (when ready)
- **Sunday**: Optional catchup day

---

## 🗂️ Project Structure (What You'll Build)

```
fork-in-the-road-ios/
├── ForkInTheRoad/                  # Main app target
│   ├── App/
│   │   ├── ForkInTheRoadApp.swift  # App entry point
│   │   └── AppDelegate.swift   # Lifecycle management
│   ├── Core/
│   │   ├── Design/             # Design system (Liquid Glass + Neumorphism)
│   │   ├── Extensions/         # Swift extensions
│   │   ├── Utilities/          # Helper functions
│   │   └── Constants.swift     # App constants
│   ├── Features/
│   │   ├── Authentication/     # Login, Sign in with Apple
│   │   ├── Collections/        # Personal collections
│   │   ├── Restaurants/        # Search, details
│   │   ├── Groups/             # Group management
│   │   ├── Decisions/          # Voting, random selection
│   │   └── Profile/            # User profile, settings
│   ├── Services/
│   │   ├── APIService.swift    # Mobile API client
│   │   ├── AuthService.swift   # Authentication
│   │   ├── NotificationService.swift  # Push notifications
│   │   └── AnalyticsService.swift     # Firebase Analytics
│   ├── Models/                 # Data models (Swift structs)
│   ├── ViewModels/             # MVVM view models
│   ├── Views/                  # SwiftUI views
│   ├── Resources/
│   │   ├── Assets.xcassets     # Images, colors
│   │   ├── GoogleService-Info.plist   # Firebase config
│   │   └── Info.plist          # App configuration
│   └── Supporting Files/
├── ForkInTheRoadTests/             # Unit tests
├── ForkInTheRoadUITests/           # UI tests
└── Frameworks/                 # Third-party SDKs

```

---

## 🔧 Essential Xcode Skills

### Running the App

1. **Simulator**: Click the device dropdown → Select iPhone 16 Pro → Press Cmd+R
2. **Physical Device**: Connect iPhone → Select it → Press Cmd+R (requires Apple Developer account)

### Debugging

1. **Breakpoints**: Click line number to add breakpoint
2. **Console**: View → Debug Area → Show Debug Area (Cmd+Shift+Y)
3. **View Hierarchy**: Debug → View Debugging → Capture View Hierarchy

### Common Shortcuts

| Shortcut     | Action                   |
| ------------ | ------------------------ |
| Cmd+R        | Run app                  |
| Cmd+.        | Stop app                 |
| Cmd+B        | Build project            |
| Cmd+Shift+K  | Clean build folder       |
| Cmd+0        | Toggle navigator         |
| Cmd+Option+0 | Toggle inspector         |
| Cmd+Shift+Y  | Toggle debug area        |
| Cmd+Shift+O  | Open quickly (find file) |

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Developer cannot be verified" when running on device

- **Solution**: Settings → Privacy & Security → Developer Mode → Enable

**Issue**: "No matching provisioning profiles found"

- **Solution**: Xcode → Settings → Accounts → Download Manual Profiles

**Issue**: Simulator won't launch

- **Solution**: `killall -9 com.apple.CoreSimulator.CoreSimulatorService`

**Issue**: Build errors about "missing GoogleService-Info.plist"

- **Solution**: Download from Firebase console, drag into Xcode project

**Issue**: "Failed to code sign"

- **Solution**: Xcode → Signing & Capabilities → Change team to your Apple ID

---

## 📚 Learning Resources

### Essential Reading

- [SwiftUI Basics](https://developer.apple.com/tutorials/swiftui) - Apple's official tutorial
- [Swift Programming Language](https://docs.swift.org/swift-book/) - Language reference
- [iOS 26 Design Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)

### Recommended (Optional)

- [Hacking with Swift](https://www.hackingwithswift.com/100/swiftui) - 100 Days of SwiftUI
- [SwiftUI by Example](https://www.hackingwithswift.com/quick-start/swiftui) - Code examples
- [Ray Wenderlich](https://www.raywenderlich.com/ios) - Tutorials

### Video Courses (Optional)

- [Stanford CS193p](https://cs193p.sites.stanford.edu/) - Free SwiftUI course
- [iOS Academy](https://www.youtube.com/@iOSAcademy) - YouTube tutorials

---

## 🎯 Your Development Environment Setup

Based on your answers, here's your specific setup:

### Current Status ✅

- **Mac**: macOS 15.7.1 ✅
- **Xcode**: Version 26.0.1 ✅
- **Apple Developer**: Free tier (upgrade when ready for TestFlight)

### Next Steps

1. ✅ Complete Web App Epic 11 (prerequisite)
2. Create Firebase project (above)
3. Set up Render account (above)
4. Read [Xcode Setup Guide](./xcode-setup.md)
5. Start Epic 1: Foundation

---

## 🚀 Ready to Build?

### Immediate Next Steps:

1. **Complete Prerequisites**

   - [ ] Set up Firebase project
   - [ ] Set up Render account
   - [ ] Complete Web App Epic 11

2. **Read These Guides**

   - [ ] [Xcode Setup](./xcode-setup.md)
   - [ ] [Building & Running](./building-and-running.md)
   - [ ] [Pre-Development Checklist](../checklists/pre-development-checklist.md)

3. **Start Development**
   - [ ] Begin [Epic 1: Foundation](../epic-breakdown/epic-01-foundation.md)

---

## 💪 Mindset for Success

### Aggressive 2-3 Month Timeline

- **Daily commitment**: 2-3 hours minimum
- **Weekend sprints**: 4-6 hours on Saturdays
- **Parallel work**: Multiple stories at once when possible
- **AI partnership**: I'll generate 80% of code, you review and adjust

### Key Principles

1. **Move fast, iterate later** - Get features working, polish later
2. **Test early, test often** - Run on device frequently
3. **Trust the process** - Follow epic breakdown sequentially
4. **Ask questions** - I'm here to help, don't get stuck
5. **Celebrate wins** - Each completed story is progress!

---

## 📞 Getting Help

### During Development

- **Code issues**: Check agent guides in `/agent-guides/`
- **Design questions**: Reference `/agent-guides/08-design-system-ios.md`
- **API problems**: Check Web App documentation
- **App Store questions**: See `/app-store-compliance/`

### Stuck on Something?

1. Check relevant epic documentation
2. Review agent guides for that feature
3. Look at web app implementation for reference
4. Search Apple Developer documentation
5. Ask me (the AI) to explain or generate code!

---

**You've got this! Let's build something amazing! 🚀**

---

**Next Steps**:

1. Complete prerequisites above
2. Read [Xcode Setup Guide](./xcode-setup.md)
3. Start [Epic 1: Foundation](../epic-breakdown/epic-01-foundation.md)

**Estimated Time to Start Coding**: 1-2 hours (after prerequisites)
