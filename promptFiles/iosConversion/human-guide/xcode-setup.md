# Xcode Setup & Configuration

Complete guide to setting up Xcode for Fork In The Road iOS development.

---

## ✅ Current Status

Based on your setup:

- **macOS**: 15.7.1 (24G231) ✅
- **Xcode**: 26.0.1 (17A400) ✅
- **Apple Developer**: Free tier (will upgrade for TestFlight)

You're already set up! This guide covers configuration and optimization.

---

## 🔧 Xcode Configuration

### 1. Configure Xcode Preferences

Open Xcode → Settings (Cmd+,)

#### **Accounts Tab**

1. Click **+** → Add Apple ID
2. Sign in with your Apple ID
3. Click **Manage Certificates...**
4. Click **+** → Select "Apple Development"
5. This creates your development certificate

#### **Locations Tab**

1. **Command Line Tools**: Select Xcode 26.0.1
2. **Derived Data**: Leave default or set custom location
3. **Archives**: Leave default

#### **Text Editing Tab**

Recommended settings:

- ✅ Line numbers
- ✅ Code folding ribbon
- ✅ Page guide at column: 100
- ✅ Trim trailing whitespace
- ✅ Including whitespace-only lines

#### **Components Tab**

Install these simulators (if not already):

- ✅ iOS 26.0 Simulator
- ✅ iOS 25.0 Simulator (for testing compatibility)
- ✅ watchOS 13.0 Simulator (optional, for future Apple Watch app)

### 2. Install Additional Tools

```bash
# Install iOS Simulator
xcrun simctl list devices

# Install Swift Package Manager (should be included)
swift package --version

# Install SwiftLint (code style enforcement)
brew install swiftlint

# Install CocoaPods (if needed for dependencies)
sudo gem install cocoapods
```

---

## 📱 Simulator Setup

### Recommended Simulators

Install these for testing:

**Primary Development**:

- iPhone 16 Pro (iOS 26) - Your main testing device
- iPhone 16 (iOS 26) - Standard iPhone testing

**Compatibility Testing**:

- iPhone 15 Pro (iOS 26) - Previous gen with Dynamic Island
- iPhone SE (3rd gen, iOS 26) - Smaller screen testing
- iPhone 13 (iOS 25) - Backward compatibility (iOS 16+)

**iPad Testing** (optional for now):

- iPad Pro 13" (iOS 26)
- iPad Air 13" (iOS 26)

### Install Simulators

```bash
# List available simulators
xcrun simctl list devicetypes

# Install specific simulator (if missing)
xcodebuild -downloadPlatform iOS
```

### Configure Simulator

1. **Open Simulator**: Xcode → Open Developer Tool → Simulator
2. **Settings adjustments**:
   - I/O → Keyboard → Connect Hardware Keyboard (easier typing)
   - Window → Physical Size (or Cmd+1 for 100% scale)
3. **Add multiple simulators**:
   - File → New Simulator
   - Select device type and iOS version

---

## 🔨 Xcode Tips & Tricks

### Essential Keyboard Shortcuts

| Shortcut               | Action                                           |
| ---------------------- | ------------------------------------------------ |
| **Building & Running** |
| Cmd+R                  | Run app                                          |
| Cmd+B                  | Build project                                    |
| Cmd+.                  | Stop app                                         |
| Cmd+Shift+K            | Clean build folder                               |
| Cmd+U                  | Run tests                                        |
| **Navigation**         |
| Cmd+Shift+O            | Open quickly (find file)                         |
| Cmd+Shift+J            | Reveal in Project Navigator                      |
| Ctrl+Cmd+↑/↓           | Switch between .h/.m or interface/implementation |
| Cmd+1...9              | Navigate between tabs                            |
| **Editing**            |
| Cmd+/                  | Comment/uncomment                                |
| Cmd+[ or ]             | Indent left/right                                |
| Ctrl+I                 | Re-indent selection                              |
| Option+Cmd+[ or ]      | Move line up/down                                |
| **Debugging**          |
| Cmd+\                  | Add/remove breakpoint                            |
| Cmd+Y                  | Toggle all breakpoints                           |
| F6                     | Step over                                        |
| F7                     | Step into                                        |
| F8                     | Continue                                         |

### Code Snippets

Create custom snippets for common patterns:

1. Type your code pattern
2. Select it
3. Drag to Code Snippets library (bottom right)
4. Set completion shortcut (e.g., "vmmodel" for ViewModel)

**Recommended Snippets**:

```swift
// ViewModel Template (shortcut: vmmodel)
import SwiftUI
import Combine

@MainActor
class <#Name#>ViewModel: ObservableObject {
    @Published var <#property#>: <#Type#>

    init() {
        // Setup
    }
}

// SwiftUI View Template (shortcut: swview)
import SwiftUI

struct <#Name#>View: View {
    @StateObject private var viewModel = <#Name#>ViewModel()

    var body: some View {
        VStack {
            <#content#>
        }
    }
}

#Preview {
    <#Name#>View()
}
```

### Build Time Optimization

Add to your project's Build Settings:

```
# Faster incremental builds
SWIFT_COMPILATION_MODE = incremental

# Parallel compilation
SWIFT_ENABLE_BATCH_MODE = YES

# Debug info format (faster debug builds)
DEBUG_INFORMATION_FORMAT = dwarf (Debug)
DEBUG_INFORMATION_FORMAT = dwarf-with-dsym (Release)
```

---

## 🎨 Xcode Themes

### Install Custom Theme (Optional)

1. Download theme file (.xccolortheme)
2. Place in: `~/Library/Developer/Xcode/UserData/FontAndColorThemes/`
3. Restart Xcode
4. Xcode → Settings → Themes → Select theme

**Recommended Themes**:

- Default Dark (built-in, works great)
- Dracula Theme (popular third-party)
- Solarized Dark (easy on eyes)

---

## 📦 Package Dependencies

### Swift Package Manager (SPM)

You'll add these during development:

```swift
// Essential Packages for Fork In The Road iOS

dependencies: [
    // Firebase (Analytics, Crashlytics, Messaging)
    .package(url: "https://github.com/firebase/firebase-ios-sdk", from: "11.0.0"),

    // Clerk iOS SDK
    .package(url: "https://github.com/clerk/clerk-ios", from: "1.0.0"),

    // Networking (if needed beyond URLSession)
    .package(url: "https://github.com/Alamofire/Alamofire", from: "5.9.0"),

    // Image loading
    .package(url: "https://github.com/SDWebImage/SDWebImageSwiftUI", from: "3.0.0"),

    // Keychain access
    .package(url: "https://github.com/evgenyneu/keychain-swift", from: "20.0.0"),
]
```

### Add Package to Xcode

1. File → Add Package Dependencies
2. Enter package URL
3. Select version rule (recommend: Up to Next Major)
4. Click Add Package
5. Select target (YouHungry)

---

## 🔍 Debugging Tools

### LLDB Commands

Essential debugger commands:

```bash
# Print variable
po variableName

# Print with formatting
p variableName

# Print frame variable
frame variable variableName

# Continue execution
continue

# Step over
next

# Step into
step

# Step out
finish

# Print backtrace
bt

# List breakpoints
breakpoint list
```

### View Debugging

1. Run app in simulator
2. Click "Debug View Hierarchy" button (bottom toolbar)
3. Rotate 3D view to see layer stack
4. Click views to inspect properties

### Memory Graph

1. Run app in simulator
2. Click Memory Graph button (bottom toolbar)
3. Look for retain cycles (purple warnings)
4. Click objects to see references

### Network Debugging

Use Charles Proxy or Proxyman:

1. Install Charles/Proxyman
2. Configure simulator proxy (automatic in most cases)
3. View all network requests/responses
4. Modify requests for testing

---

## ⚠️ Common Issues & Fixes

### Issue: "Unable to boot simulator"

```bash
# Kill simulator service
killall -9 com.apple.CoreSimulator.CoreSimulatorService

# Restart simulator
open -a Simulator
```

### Issue: "Xcode is slow/laggy"

```bash
# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Clear module cache
rm -rf ~/Library/Developer/Xcode/DerivedData/ModuleCache.noindex/*

# Clear archives (if you have old ones)
rm -rf ~/Library/Developer/Xcode/Archives/*
```

### Issue: "SwiftUI previews not working"

1. Clean build folder (Cmd+Shift+K)
2. Restart Xcode
3. Editor → Canvas → Refresh (Opt+Cmd+P)
4. If still broken, delete `~/Library/Developer/Xcode/UserData/Previews/`

### Issue: "Code signing errors"

1. Xcode → Settings → Accounts
2. Select your Apple ID
3. Click "Download Manual Profiles"
4. In project: Signing & Capabilities → Automatically manage signing ✅

### Issue: "Swift Package Manager not resolving"

```bash
# In terminal, from project root:
swift package reset
swift package resolve
swift package update
```

---

## 🚀 Performance Optimization

### Build Settings for Development

**Debug Configuration** (fast iteration):

```
SWIFT_OPTIMIZATION_LEVEL = -Onone
SWIFT_COMPILATION_MODE = incremental
GCC_OPTIMIZATION_LEVEL = 0
```

**Release Configuration** (App Store):

```
SWIFT_OPTIMIZATION_LEVEL = -O
SWIFT_COMPILATION_MODE = wholemodule
GCC_OPTIMIZATION_LEVEL = s (optimize for size)
```

### Indexing Optimization

If Xcode indexing is slow:

1. Xcode → Settings → Locations → Derived Data
2. Click arrow to open in Finder
3. Delete folder for your project
4. Restart Xcode (will re-index)

---

## 📱 Physical Device Testing

### Connect Your iPhone

1. Connect iPhone via USB-C/Lightning cable
2. Trust computer on iPhone
3. In Xcode, select your iPhone from device dropdown
4. First time: May need to "Register Device" (automatic with paid account)

### Enable Developer Mode (iOS 16+)

On your iPhone:

1. Settings → Privacy & Security
2. Scroll down → Developer Mode
3. Toggle ON
4. Restart iPhone
5. Confirm "Turn On Developer Mode"

### Wireless Debugging (Optional)

1. Connect iPhone via cable first
2. Window → Devices and Simulators
3. Select your iPhone
4. Check "Connect via network"
5. Disconnect cable - iPhone stays connected via WiFi

---

## 🎯 Ready for Development

### Verification Checklist

- [ ] Xcode 26.0.1 installed and configured
- [ ] Apple ID added to Xcode
- [ ] Development certificate created
- [ ] iPhone 16 Pro simulator installed
- [ ] SwiftLint installed (optional but recommended)
- [ ] Xcode shortcuts memorized (at least Cmd+R, Cmd+B, Cmd+Shift+O)
- [ ] Simulator can launch successfully
- [ ] Physical device connected (optional for now)

### Next Steps

1. Read [Building & Running Guide](./building-and-running.md)
2. Complete [Pre-Development Checklist](../checklists/pre-development-checklist.md)
3. Start [Epic 1: Foundation](../epic-breakdown/epic-01-foundation.md)

---

**You're all set up! Time to build! 🚀**
