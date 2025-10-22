# Certificate & Provisioning Profile Management

Guide to understanding and managing iOS code signing certificates and provisioning profiles.

---

## 🎯 Overview

**Code Signing** is Apple's way of ensuring apps are from trusted developers and haven't been tampered with.

**Key Concepts**:

- **Certificate**: Proves you're a registered developer
- **Provisioning Profile**: Links certificate + App ID + devices
- **Bundle Identifier**: Unique ID for your app (e.g., `com.forkintheroad.app`)

**Good News**: Xcode handles most of this automatically with "Automatically manage signing" ✅

---

## 🔐 Certificate Types

### Development Certificate

**Purpose**: Run app on physical devices during development
**Who Needs**: Everyone on the development team
**Device Limit**: 100 devices per year per developer account

### Distribution Certificate

**Purpose**: Submit app to TestFlight and App Store
**Who Needs**: Only account holder (you)
**Device Limit**: No limit (distributed via App Store/TestFlight)

### Push Notification Certificate (APNs)

**Purpose**: Send push notifications to app
**Setup**: Done in Apple Developer portal + Firebase console
**Required**: For push notifications feature (Epic 6)

---

## 🚀 Automatic Signing (Recommended)

### Enable Automatic Signing

1. **Open Project in Xcode**
2. **Select Project** (blue YouHungry icon in Navigator)
3. **Select Target** → YouHungry
4. **Go to "Signing & Capabilities" tab**
5. **Check "Automatically manage signing"** ✅
6. **Team**: Select your Apple ID
7. **Bundle Identifier**: `com.forkintheroad.app`

**What Xcode Does Automatically**:

- Creates development certificate (if needed)
- Creates provisioning profiles
- Renews expired certificates
- Downloads profiles when needed
- Updates profiles when capabilities change

### Automatic Signing Handles

✅ Development builds
✅ Running on simulator
✅ Running on your physical device
✅ TestFlight builds
✅ App Store builds

**This is the recommended approach for solo developers!**

---

## 🔧 Manual Signing (Advanced)

### When to Use Manual Signing

- Multiple team members sharing certificates
- CI/CD pipelines
- Enterprise distribution
- Precise control over certificate management

### Manual Setup Steps

1. **Generate Certificate Signing Request (CSR)**

   - Keychain Access → Certificate Assistant → Request Certificate from CA
   - Enter email address
   - Save to disk

2. **Create Certificate in Developer Portal**

   - [developer.apple.com/account](https://developer.apple.com/account) → Certificates
   - Click + button
   - Select "iOS App Development" or "iOS Distribution"
   - Upload CSR file
   - Download certificate
   - Double-click to install in Keychain

3. **Create App ID** (if not exists)

   - Identifiers → + button
   - Select "App IDs" → Continue
   - Type: App
   - Description: Fork In The Road iOS App
   - Bundle ID: com.forkintheroad.app (Explicit)
   - Capabilities: Check required features (Push Notifications, Sign in with Apple, etc.)

4. **Create Provisioning Profile**

   - Profiles → + button
   - Select:
     - Development: "iOS App Development"
     - Distribution: "App Store"
   - Select App ID: com.forkintheroad.app
   - Select Certificate
   - Select Devices (development only)
   - Name: YouHungry Dev / YouHungry AppStore
   - Download profile
   - Double-click to install

5. **Configure Xcode**
   - Uncheck "Automatically manage signing"
   - Import Provisioning Profile dropdown
   - Select your profiles for Debug/Release

**We recommend sticking with automatic signing for this project!**

---

## 📱 Device Registration

### Add Development Devices

**Via Xcode (Automatic)**:

1. Connect device
2. Device appears in Xcode
3. Xcode registers it automatically (with paid account)

**Via Developer Portal (Manual)**:

1. [developer.apple.com/account](https://developer.apple.com/account) → Devices
2. Click + button
3. Enter device name and UDID
4. UDID: Find in Finder when iPhone connected (click serial number to show UDID)

**Device Limits**:

- 100 iPhones/iPads per year
- 100 Apple Watches per year
- Resets annually on your enrollment date

---

## 🔔 Push Notification Certificates

### Setup APNs for Firebase Cloud Messaging

**Step 1: Create APNs Key (Recommended Method)**

1. Go to: [developer.apple.com/account](https://developer.apple.com/account) → Keys
2. Click **+ button**
3. **Key Name**: Fork In The Road APNs Key
4. **Check**: Apple Push Notifications service (APNs)
5. Click **Continue** → **Register**
6. **Download** the .p8 file
   - ⚠️ Only shown once! Save it securely!
7. **Note**: Key ID and Team ID (shown on page)

**Step 2: Upload to Firebase**

1. Go to: [console.firebase.google.com](https://console.firebase.google.com)
2. Select your project
3. Project Settings (gear icon)
4. **Cloud Messaging** tab
5. **iOS app configuration** section
6. Under "APNs Authentication Key", click **Upload**
7. Upload .p8 file
8. Enter **Key ID** and **Team ID**
9. Click **Upload**

**Done!** Firebase can now send push notifications to iOS devices.

---

## 🛠️ Troubleshooting

### "Provisioning profile doesn't match"

**Solution**:

1. Xcode → Settings → Accounts
2. Select your Apple ID
3. Click "Download Manual Profiles"
4. Try building again

### "Code signing certificate not found"

**Solution**:

1. Keychain Access → Certificates
2. Look for "Apple Development" or "Apple Distribution"
3. If missing: Xcode → Settings → Accounts → Manage Certificates → + → Apple Development
4. If expired: Delete old certificate, create new one

### "No matching provisioning profiles found"

**Solution**:

1. Xcode → Settings → Accounts → Download Manual Profiles
2. Or: Delete provisioning profiles and let Xcode recreate
   ```bash
   rm -rf ~/Library/MobileDevice/Provisioning\ Profiles/*
   ```
3. Rebuild project

### "Unable to install on device"

**Solutions**:

- Check device is registered (developer.apple.com → Devices)
- Check provisioning profile includes device
- Refresh profiles: Xcode → Settings → Accounts → Download Manual Profiles
- Delete app from device, rebuild

### "Team has no signing certificates"

**Solution**:

1. Xcode → Settings → Accounts
2. Manage Certificates → + → Apple Development
3. Creates new certificate automatically

---

## 📊 Certificate Validity

### Certificate Expiration

**Development Certificates**: Valid for 1 year
**Distribution Certificates**: Valid for 1 year
**APNs Keys**: No expiration (permanent)

### Renewal Process

**Automatic Signing**:

- Xcode renews automatically when needed
- You may need to re-download profiles

**Manual Signing**:

- Renew before expiration (portal sends email reminder)
- Create new certificate
- Update provisioning profiles
- Update Xcode configuration

---

## 🔒 Security Best Practices

### Protect Your Certificates

1. **Never share private keys**

   - Certificates in Keychain are paired with private keys
   - If compromised, revoke immediately

2. **Use automatic signing when possible**

   - Less chance of errors
   - Xcode handles renewals

3. **Backup certificates**

   - Export from Keychain (with password)
   - Store securely (not in version control!)

4. **Revoke compromised certificates**
   - Developer portal → Certificates → Revoke
   - Create new ones immediately

### Team Sharing (If You Add Team Members Later)

**For CI/CD or Team Development**:

1. Create a "shared" Apple ID for code signing
2. Generate certificates under that ID
3. Share certificates securely (encrypted)
4. Use match or fastlane for team signing

**For this project**: You're solo, so automatic signing is perfect!

---

## 🎯 Recommended Setup for You

Based on your solo development setup:

### Current Configuration ✅

- **Signing**: Automatic signing enabled
- **Team**: Your personal Apple ID
- **Certificate**: Development certificate (created by Xcode)
- **Devices**: Your iPhone registered automatically
- **Profile**: Development profile (managed by Xcode)

### For TestFlight (Epic 10)

- **Signing**: Keep automatic signing
- **Distribution**: Xcode creates distribution certificate automatically
- **Profile**: App Store profile (managed by Xcode)

### For Push Notifications (Epic 6)

- **APNs Key**: Create in developer portal (one-time)
- **Upload to Firebase**: Connect Firebase to Apple
- **App Capabilities**: Xcode adds Push Notifications capability automatically

**You're all set!** Automatic signing handles everything for solo developers.

---

## ✅ Verification Checklist

Before major milestones:

**Before First Device Build**:

- [ ] Apple ID added to Xcode
- [ ] Development certificate exists (Xcode creates automatically)
- [ ] Bundle ID configured
- [ ] Automatic signing enabled

**Before TestFlight**:

- [ ] Paid Apple Developer account ($99/year)
- [ ] Distribution certificate exists (Xcode creates automatically)
- [ ] App Store Connect app created
- [ ] Bundle ID matches everywhere

**Before App Store Submission**:

- [ ] Distribution certificate valid
- [ ] App Store provisioning profile valid
- [ ] APNs key uploaded to Firebase (if using push notifications)
- [ ] All capabilities enabled in App ID

---

## 🚀 Quick Commands

### Check Installed Certificates

**Keychain Access**:

1. Open Keychain Access app
2. Select "login" keychain
3. Select "My Certificates" category
4. Look for:
   - Apple Development: [Your Name]
   - Apple Distribution: [Your Name]

### View Provisioning Profiles

```bash
# List all installed profiles
ls ~/Library/MobileDevice/Provisioning\ Profiles/

# View profile details
security cms -D -i ~/Library/MobileDevice/Provisioning\ Profiles/[profile-name].mobileprovision
```

### Clean Certificate Cache

```bash
# If you're having signing issues, clear cache
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/MobileDevice/Provisioning\ Profiles/*

# Then in Xcode: Settings → Accounts → Download Manual Profiles
```

---

## 🎓 Further Learning

**Official Apple Docs**:

- [Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Xcode Help - Signing](https://help.apple.com/xcode/mac/current/#/dev60b6fbbc7)

**When You Need It**:

- [fastlane match](https://docs.fastlane.tools/actions/match/) - Team certificate management
- [CI/CD Signing](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases) - Automated builds

---

## 💡 Pro Tips

1. **Use automatic signing** - Saves hours of troubleshooting
2. **Don't commit certificates** - Keep out of git
3. **One distribution certificate** - Multiple can cause conflicts
4. **APNs key never expires** - Create once, use forever
5. **Test on device early** - Catches signing issues sooner

---

**Next Guide**: [Submission Process](./submission-process.md)

**You're ready for smooth code signing! 🎉**
