# App Store Submission Checklist

Complete this checklist before submitting to the App Store.

---

## ✅ App Completeness

**Features**:

- [ ] All features from Epics 1-9 implemented
- [ ] No placeholder content or "Coming Soon" text
- [ ] No debug features visible to users
- [ ] No admin-only features accessible by regular users
- [ ] All features described in description are working
- [ ] Premium features working with valid subscription
- [ ] Free tier limits enforced correctly

**Functionality**:

- [ ] App works on all supported devices (iPhone 11+)
- [ ] App works on all supported iOS versions (16.0+)
- [ ] App works in both dark and light mode
- [ ] App handles offline mode gracefully
- [ ] No critical bugs
- [ ] Crash-free rate > 99.5% (from TestFlight)

---

## ✅ App Store Connect

**App Information**:

- [ ] App name: "Fork In The Road"
- [ ] Subtitle (optional, 30 chars)
- [ ] Categories: Food & Drink, Social Networking
- [ ] Age rating: 4+
- [ ] Copyright: 2025 [Your Name]

**Version Information**:

- [ ] Version number: 1.0.0
- [ ] Build number: 1 (or higher if resubmitting)
- [ ] What's New: Version 1.0 description
- [ ] Promotional text (170 chars)
- [ ] Description (4000 chars) - compelling and accurate
- [ ] Keywords (100 chars) - optimized
- [ ] Support URL: https://youhungry.app/support
- [ ] Marketing URL: https://youhungry.app

**App Review Information**:

- [ ] Contact First Name
- [ ] Contact Last Name
- [ ] Contact Phone
- [ ] Contact Email: nodemailer_persad@yahoo.com
- [ ] Demo Account: appreview@youhungry.app
- [ ] Demo Password: [documented securely]
- [ ] Review Notes: Testing instructions for Apple

**Pricing & Availability**:

- [ ] Price: Free
- [ ] In-App Purchases configured
- [ ] Availability: All countries (or selected)
- [ ] Release: Automatic (or manual/scheduled)

---

## ✅ Privacy & Legal

**Privacy**:

- [ ] Privacy Policy URL set
- [ ] Privacy Policy updated for iOS
- [ ] Privacy Policy accessible without login
- [ ] App Privacy questionnaire completed
- [ ] All privacy strings in Info.plist

**Data Collection Declared**:

- [ ] Contact Info (Name, Email, Phone)
- [ ] Location (Precise Location)
- [ ] Usage Data (Analytics)
- [ ] User Content (Collections, Votes)

**Privacy Manifest Strings**:

- [ ] NSLocationWhenInUseUsageDescription: "Fork In The Road uses your location to find nearby restaurants. You can also search by entering an address manually."
- [ ] NSFaceIDUsageDescription: "Fork In The Road uses Face ID to securely sign you in"
- [ ] NSCameraUsageDescription: (if applicable)
- [ ] NSPhotoLibraryUsageDescription: (if applicable)

---

## ✅ Technical Requirements

**Capabilities Enabled**:

- [ ] Sign in with Apple
- [ ] Push Notifications
- [ ] Background Modes → Remote notifications
- [ ] Associated Domains (if using universal links)

**Build Configuration**:

- [ ] Built in Release configuration
- [ ] Code signing: Automatic or valid manual profiles
- [ ] No compiler warnings (or minimal, none critical)
- [ ] App size reasonable (< 200MB uncompressed)
- [ ] Bitcode disabled (no longer required/supported)

**Info.plist**:

- [ ] Bundle Identifier: com.forkintheroad.app
- [ ] Version: 1.0.0
- [ ] Build: 1
- [ ] All required privacy strings present
- [ ] URL schemes defined (youhungry://)
- [ ] Supported device orientations set

---

## ✅ Assets

**App Icon**:

- [ ] 1024x1024 icon uploaded to App Store Connect
- [ ] All icon sizes in Assets.xcassets
- [ ] Icon looks good at all sizes
- [ ] No alpha channel
- [ ] No rounded corners (Apple adds them)

**Screenshots**:

- [ ] 6.9" display (iPhone 16 Pro Max): 1320 x 2868 - minimum 3 screenshots
- [ ] 6.7" display (iPhone 15 Pro Max): 1284 x 2778 - minimum 3 screenshots
- [ ] 5.5" display (iPhone 8 Plus): 1242 x 2208 - minimum 3 screenshots
- [ ] Screenshots show actual app (not mockups)
- [ ] Screenshots highlight key features
- [ ] Consistent theme (all light or all dark)

**App Preview** (optional):

- [ ] Video uploaded (15-30 seconds)
- [ ] Shows actual app usage
- [ ] Same sizes as screenshots

---

## ✅ In-App Purchases

**Configured in App Store Connect**:

- [ ] Monthly subscription: com.forkintheroad.app.premium.monthly
- [ ] Yearly subscription: com.forkintheroad.app.premium.yearly
- [ ] Pricing: $0.99/month, $10/year (launch price)
- [ ] Localized information complete
- [ ] Review screenshot for IAP
- [ ] Restore purchases button in app
- [ ] IAP tested in Sandbox environment

---

## ✅ Testing

**TestFlight Testing**:

- [ ] Minimum 5 beta testers
- [ ] Beta testing period: 2-3 weeks
- [ ] Feedback collected
- [ ] Critical bugs fixed
- [ ] Crash-free rate > 99.5%

**Device Testing**:

- [ ] Tested on iPhone 16 Pro (iOS 26)
- [ ] Tested on iPhone SE (small screen)
- [ ] Tested on iPhone 11 (minimum iOS 16)
- [ ] Tested on physical device (required!)

**Scenario Testing**:

- [ ] Fresh install works
- [ ] Offline mode works
- [ ] Poor network handled gracefully
- [ ] Push notifications work
- [ ] Sign in with Apple works
- [ ] IAP purchase flow works

---

## ✅ Export Compliance

**Encryption**:

- [ ] Export Compliance question answered
- [ ] Selected "No" (standard HTTPS only)
- [ ] OR if using custom encryption, documentation provided

---

## ✅ Final Pre-Submission Checks

**Last Minute**:

- [ ] Test demo account one more time
- [ ] All links work (Privacy Policy, Support, Marketing)
- [ ] Version number is correct (1.0.0)
- [ ] Build number is correct (1, 2, 3...)
- [ ] No test/debug code in production build
- [ ] Reviewed all metadata for typos
- [ ] Checked screenshots match current UI

**Ready to Submit**:

- [ ] All above checkboxes checked ✅
- [ ] Build uploaded to App Store Connect
- [ ] Build processing complete
- [ ] Build assigned to version 1.0.0

---

## 🚀 Submit!

If all boxes checked:

1. Go to App Store Connect
2. Your App → App Store tab
3. Click "Add for Review"
4. Review summary
5. Click **"Submit for Review"**

**Confirmation**:

- Email sent to your Apple ID email
- Status: "Waiting for Review"
- Typical review time: 24-48 hours

---

## 📊 Post-Submission

**While Waiting**:

- [ ] Prepare launch announcement
- [ ] Prepare social media posts
- [ ] Set up monitoring dashboards
- [ ] Prepare support resources

**If Rejected**:

- [ ] Read rejection email carefully
- [ ] Fix issues
- [ ] Increment build number
- [ ] Create new archive
- [ ] Resubmit

**If Approved**:

- [ ] 🎉 CELEBRATE!
- [ ] Release app (if manual release)
- [ ] Monitor first 24 hours
- [ ] Respond to reviews
- [ ] Plan v1.1 updates

---

**Good luck! You've got this! 🚀**
