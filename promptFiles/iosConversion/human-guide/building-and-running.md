# Building & Running the App

Quick guide to building and running Fork In The Road on simulator and physical devices.

---

## 🎯 Quick Reference

| Action | Shortcut    | Menu                         |
| ------ | ----------- | ---------------------------- |
| Build  | Cmd+B       | Product → Build              |
| Run    | Cmd+R       | Product → Run                |
| Stop   | Cmd+.       | Product → Stop               |
| Clean  | Cmd+Shift+K | Product → Clean Build Folder |
| Test   | Cmd+U       | Product → Test               |

---

## 📱 Running on Simulator

### First Time Setup

1. **Open Project**

   ```bash
   cd ~/path/to/fork-in-the-road-ios
   open ForkInTheRoad.xcodeproj
   ```

2. **Select Simulator**

   - Click device dropdown (top toolbar)
   - Select "iPhone 16 Pro" (recommended)
   - Or: Product → Destination → iOS 26.0 Simulator → iPhone 16 Pro

3. **Build & Run**
   - Press **Cmd+R** (or click ▶️ play button)
   - Wait for build to complete
   - Simulator will launch automatically
   - App installs and opens

### Simulator Controls

**Scale Simulator Window**:

- Window → Physical Size (Cmd+1) - 100% scale
- Window → Pixel Accurate (Cmd+2) - Actual pixels
- Window → Fit Screen (Cmd+3) - Fit to screen

**Rotate Device**:

- Device → Rotate Left (Cmd+←)
- Device → Rotate Right (Cmd+→)

**Shake Gesture**:

- Device → Shake (Ctrl+Cmd+Z)

**Home Button**:

- Device → Home (Cmd+Shift+H)

**Lock Screen**:

- Device → Lock (Cmd+L)

**Trigger Location**:

- Features → Location → Custom Location
- Enter coordinates or select from presets

**Screenshot**:

- Cmd+S (saves to desktop)

### Simulator Tips

**Type with Hardware Keyboard**:

- I/O → Keyboard → Connect Hardware Keyboard (✅)
- Now type normally, no need to click simulator keyboard

**Test Dark Mode**:

- Settings app in simulator → Developer → Dark Appearance
- Or: Features → Toggle Appearance

**Slow Animations** (debug UI issues):

- Debug → Slow Animations (✅)
- Animations run at 10% speed

**Test Different iOS Versions**:

- Download simulators: Xcode → Settings → Components
- Switch: Device dropdown → Add Additional Simulators

---

## 📲 Running on Physical Device

### Prerequisites

- [ ] iPhone connected via cable
- [ ] Developer Mode enabled on iPhone (Settings → Privacy & Security → Developer Mode)
- [ ] iPhone unlocked and "Trust This Computer" accepted

### First Time Build to Device

1. **Connect iPhone**

   - Connect via USB-C or Lightning cable
   - Unlock iPhone
   - Tap "Trust" on popup

2. **Select Device**

   - In Xcode, click device dropdown
   - Select your iPhone (should appear under "iOS Devices")

3. **Configure Signing** (if first time)

   - Select project in Navigator (ForkInTheRoad, blue icon)
   - Select "ForkInTheRoad" target
   - Go to "Signing & Capabilities" tab
   - Check "Automatically manage signing"
   - Team: Select your Apple ID
   - Bundle Identifier: `com.forkintheroad.app` (or your choice)

4. **Build & Run**

   - Press Cmd+R
   - First time: "Developer Mode required" error
   - On iPhone: Settings → Privacy & Security → Developer Mode → ON
   - Restart iPhone
   - Try Cmd+R again

5. **Trust Developer Certificate** (if prompted)
   - On iPhone: Settings → General → VPN & Device Management
   - Under "Developer App", tap your Apple ID
   - Tap "Trust [Your Apple ID]"
   - Tap "Trust" again to confirm

### Wireless Debugging (Optional)

Once your device is working over cable:

1. Window → Devices and Simulators
2. Select your iPhone
3. Check "Connect via network"
4. Wait for network icon to appear next to device
5. Disconnect cable
6. Device stays connected via WiFi!

**Requirements**:

- iPhone and Mac on same WiFi network
- First connection must be via cable

---

## 🔨 Build Configurations

### Debug vs Release

**Debug** (default for development):

- Faster build times
- Includes debug symbols
- Logs to console
- Larger app size
- No optimizations

**Release** (for TestFlight/App Store):

- Slower build times
- Optimized code
- Smaller app size
- Production-ready
- No debug logs

**Switch Configuration**:

1. Product → Scheme → Edit Scheme (Cmd+<)
2. Run (left sidebar)
3. Build Configuration dropdown
4. Select Debug or Release

### Scheme Configuration

**Create Custom Scheme** (optional):

1. Product → Scheme → Manage Schemes
2. Click + button
3. Name: "ForkInTheRoad-Dev", "ForkInTheRoad-Staging", etc.
4. Customize build settings per environment

**Useful for**:

- Different API endpoints (dev/staging/prod)
- Different app icons (to distinguish builds)
- Different bundle identifiers

---

## 🐛 Debugging While Running

### Console Output

**View Console**:

- View → Debug Area → Show Debug Area (Cmd+Shift+Y)
- Or: Click up-arrow icon (bottom toolbar)

**Console Commands**:

```swift
print("Debug message") // Basic print
dump(object) // Detailed object description
debugPrint("Debug info") // Debug-only print
```

**Filter Console**:

- Search box (bottom right)
- Filter by text, log level, or subsystem

### Breakpoints

**Add Breakpoint**:

- Click line number gutter (left side of code)
- Or: Cmd+\ on current line

**Breakpoint Types**:

- **Regular**: Pauses execution
- **Conditional**: Pauses only if condition is true
  - Right-click breakpoint → Edit Breakpoint
  - Condition: `user.id == "12345"`
- **Symbolic**: Breaks on specific function/method
  - Breakpoint Navigator → + → Symbolic Breakpoint

**When Paused**:

- **Step Over** (F6): Execute current line, move to next
- **Step Into** (F7): Step into function call
- **Step Out** (F8): Complete current function, return to caller
- **Continue** (Ctrl+Cmd+Y): Resume execution

**LLDB Commands** (in console when paused):

```bash
po self              # Print object (self)
po viewModel.data    # Print property
p 2 + 2              # Evaluate expression
frame variable       # Show all local variables
bt                   # Show call stack
continue             # Resume execution
```

### View Debugging

**Capture View Hierarchy**:

1. Run app on simulator
2. Navigate to problematic screen
3. Click "Debug View Hierarchy" button (cube icon, bottom toolbar)
4. Rotate 3D view with mouse
5. Click views to see constraints, properties

**Use Case**: Finding layout issues, overlapping views, hidden elements

### Memory Debugging

**Memory Graph**:

1. Run app on simulator
2. Use app for a while
3. Click "Debug Memory Graph" button (bottom toolbar)
4. Look for purple warnings (retain cycles/leaks)
5. Click objects to see references

**Use Case**: Finding memory leaks, retain cycles

---

## ⚡ Performance Tips

### Faster Builds

**Optimize Build Settings** (already done in project):

```swift
// Build Active Architecture Only: YES (Debug)
// Compilation Mode: Incremental (Debug)
// Optimization Level: None (Debug)
```

**Clear Derived Data** (if builds are slow):

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

**Modularize Code** (for future):

- Split into frameworks/packages
- Parallel compilation improves speed

### Faster Iterations

**SwiftUI Previews** (instant feedback):

```swift
struct MyView: View {
    var body: some View {
        Text("Hello")
    }
}

#Preview {
    MyView()
}
```

- Editor → Canvas (Opt+Cmd+Return)
- Live preview updates as you type!
- Click "Play" button in preview to interact

**Hot Reload** (no full rebuild):

- When possible, use SwiftUI previews
- For small changes, SwiftUI updates without full rebuild

---

## 📊 Build Time Analysis

### Measure Build Times

```bash
# Terminal command (from project directory)
xcodebuild -project ForkInTheRoad.xcodeproj \
  -scheme ForkInTheRoad \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro' \
  clean build | xcpretty
```

**View Build Times in Xcode**:

1. Product → Perform Action → Build With Timing Summary
2. Shows compilation time per file
3. Identify slow files to optimize

---

## 🚨 Common Build Errors

### "No such module 'Firebase'"

**Solution**:

```bash
# Clean build folder
Cmd+Shift+K

# Or terminal:
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Rebuild: Cmd+B
```

### "Command SwiftCompile failed"

**Solution**:

1. Check error details in Issue Navigator (Cmd+5)
2. Usually a syntax error in Swift file
3. Fix error, rebuild

### "Unable to install [app]"

**Solution**:

1. Delete app from simulator/device
2. Clean build folder (Cmd+Shift+K)
3. Rebuild and run

### "Signing certificate no longer valid"

**Solution**:

1. Xcode → Settings → Accounts
2. Select Apple ID → Download Manual Profiles
3. Select project → Signing & Capabilities
4. Uncheck "Automatically manage signing"
5. Recheck it
6. Rebuild

### "Failed to prepare device for development"

**Solution**:

1. Disconnect device
2. Restart device
3. Reconnect
4. Xcode → Window → Devices and Simulators
5. Select device → Right-click → Unpair
6. Re-pair device

---

## 🧪 Testing While Developing

### Quick Manual Testing Checklist

Before each commit:

- [ ] App launches without crash
- [ ] Login works (or Sign in with Apple)
- [ ] Main features work (collections, search, etc.)
- [ ] No console errors (check debug area)
- [ ] Test on both dark/light mode
- [ ] Test on simulator AND physical device (occasionally)

### Automated Testing

**Run Unit Tests**:

- Cmd+U (runs all tests)
- Or: Right-click test file → Run Tests

**Run Specific Test**:

- Click diamond icon next to test function

**View Test Results**:

- Test Navigator (Cmd+6)
- Green checkmark = passed
- Red X = failed

---

## 📦 Build for TestFlight (Later)

### Archive Build

When ready for beta testing:

1. **Select "Any iOS Device"**

   - Device dropdown → Any iOS Device (arm64)

2. **Archive**

   - Product → Archive
   - Wait for build to complete (5-10 minutes)

3. **Organizer Opens**
   - Shows your archive
   - Click "Distribute App"
   - Choose "TestFlight & App Store"
   - Follow prompts

**Note**: This requires paid Apple Developer account ($99/year)

---

## 🎯 Quick Start Workflow

### Daily Development Flow

```bash
# Morning
1. Open Xcode: open ForkInTheRoad.xcodeproj
2. Pull latest: git pull origin main
3. Select simulator: iPhone 16 Pro
4. Build & Run: Cmd+R

# During Development
1. Make code changes
2. Cmd+R to test
3. Use SwiftUI previews for quick iteration
4. Check console for errors (Cmd+Shift+Y)

# Before Commit
1. Run tests: Cmd+U
2. Clean build: Cmd+Shift+K
3. Full rebuild: Cmd+B
4. Test on physical device (occasionally)
5. Commit: git add . && git commit -m "..."

# End of Day
1. Push changes: git push origin main
2. Close Xcode
```

---

## 🚀 You're Ready!

### Next Steps

1. Build and run the app (Cmd+R)
2. Explore the codebase
3. Start working on current epic story
4. Reference [Xcode Setup](./xcode-setup.md) for tips
5. Check [Getting Started](./getting-started.md) for workflow

---

**Happy Building! 🎉**

**Quick Commands Reminder**:

- **Cmd+R**: Run
- **Cmd+.**: Stop
- **Cmd+B**: Build
- **Cmd+Shift+K**: Clean
- **Cmd+U**: Test
- **Cmd+Shift+O**: Open Quickly (find file)
