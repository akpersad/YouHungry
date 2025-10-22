# App Store Review Guidelines Checklist

Proactive checklist to avoid App Store rejection. Based on common rejection reasons.

---

## 🎯 Critical Requirements (Will Cause Rejection)

### 1. Sign in with Apple ✅

**Guideline 4.8**: Apps using third-party login MUST offer Sign in with Apple

**Your Status**: ✅ IMPLEMENTED

- [ ] Sign in with Apple button present on sign-in screen
- [ ] Equally prominent as other social logins
- [ ] Actually functional (not just for show)
- [ ] Tested on physical device

**If Missing**: ⛔ GUARANTEED REJECTION

---

### 2. Privacy Policy ✅

**Guideline 5.1.1**: Apps collecting user data MUST have accessible Privacy Policy

**Requirements**:

- [ ] Privacy Policy URL in App Store Connect
- [ ] Policy accessible without login
- [ ] Policy covers all data collected
- [ ] Policy mentions all third-party services
- [ ] Mobile-friendly (readable on iPhone)
- [ ] Contact information for privacy questions

**If Missing/Inadequate**: ⛔ REJECTION

---

### 3. Functional App

**Guideline 2.1**: App must be complete and functional

**Requirements**:

- [ ] All described features working
- [ ] No "Coming Soon" features in description
- [ ] No placeholder content
- [ ] Demo account works perfectly
- [ ] No crashes in normal usage

**If Broken**: ⛔ REJECTION

---

### 4. Demo Account

**Guideline 2.5.4**: Apps requiring login MUST provide demo account

**Requirements**:

- [ ] Demo account credentials in App Review Information
- [ ] Account actually works (test it yourself!)
- [ ] Account pre-populated with sample data
- [ ] Testing instructions clear
- [ ] Premium features accessible (for testing IAP)

**If Invalid/Missing**: ⛔ REJECTION

---

## 🔐 Privacy & Data (Guideline 5)

### Required Privacy Strings

**Info.plist must include**:

- [ ] NSLocationWhenInUseUsageDescription (for restaurant search)
- [ ] NSFaceIDUsageDescription (for biometric auth)
- [ ] (Add others if you use camera, photo library, etc.)

**Each string must**:

- Explain WHY you need permission
- Be clear and user-friendly
- Not be generic ("For app functionality")

**Example**:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Fork In The Road uses your location to find nearby restaurants. You can also search by entering an address manually.</string>

<key>NSFaceIDUsageDescription</key>
<string>Fork In The Road uses Face ID to securely sign you in and protect your account.</string>
```

---

## 💳 In-App Purchases (Guideline 3.1)

### IAP Requirements

**Must Have**:

- [ ] Use StoreKit for all digital purchases (no Stripe, PayPal, etc.)
- [ ] "Restore Purchases" button in app
- [ ] Purchase restoration working
- [ ] Receipt validation implemented
- [ ] Clear refund policy

**Cannot Do**:

- ❌ Link to external payment (for digital goods)
- ❌ Mention other payment methods
- ❌ Tell users "cheaper on web"
- ❌ Circumvent IAP (30% fee)

**Physical Goods Exception**: You can use external payment for physical goods/services. Fork In The Road has NO physical goods, so must use IAP.

---

## 📱 User Interface (Guideline 4.2)

### Design Requirements

**Must**:

- [ ] Follow Human Interface Guidelines (generally)
- [ ] UI responsive and intuitive
- [ ] No broken UI elements
- [ ] Works in both portrait and landscape (or lock orientation)
- [ ] Looks good in dark mode

**Recommended**:

- [ ] Use iOS 26 Liquid Glass design patterns
- [ ] Native iOS controls where appropriate
- [ ] Smooth animations
- [ ] Haptic feedback

---

## 🔒 Security (Guideline 2.5.3)

**Authentication**:

- [ ] Secure token storage (Keychain) ✅
- [ ] HTTPS for all API calls ✅
- [ ] No passwords logged or stored insecurely
- [ ] Token expiration handled

**Data Protection**:

- [ ] User data isolated (can't see other users' data)
- [ ] Admin features protected
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS prevention (sanitize user input)

---

## 📋 Content Guidelines (Guideline 1)

### Acceptable Content

**Fork In The Road is fine because**:

- [ ] No objectionable content
- [ ] User-generated content moderated (if any)
- [ ] Age rating: 4+ (appropriate)

### What to Avoid

**Never Include**:

- ❌ Hate speech
- ❌ Violence
- ❌ Adult content
- ❌ Harassment
- ❌ Illegal activity

**Fork In The Road Content**: Restaurants and food - safe! ✅

---

## 🎯 Business Model (Guideline 3)

### Freemium + Ads

**Allowed**:

- ✅ Freemium with In-App Purchases
- ✅ Non-intrusive ads (bottom banners)
- ✅ Clear distinction between free and premium

**Required**:

- [ ] Ads clearly labeled ("Ad" or "Sponsored")
- [ ] Ads appropriate (no adult ads)
- [ ] Ads don't interfere with functionality
- [ ] Premium users don't see ads

**Your Implementation**: Bottom banner ads only - compliant! ✅

---

## 📱 App Functionality (Guideline 2)

### Must Work

**Core Functionality**:

- [ ] App has clear purpose (helps decide where to eat) ✅
- [ ] Provides value to users ✅
- [ ] Not just a website wrapper ✅
- [ ] Uses iOS capabilities (widgets, notifications, etc.) ✅

**Performance**:

- [ ] App launches quickly (< 5 seconds)
- [ ] No freezing or hanging
- [ ] No excessive battery drain
- [ ] Works on 3G/4G/5G and WiFi

---

## 🔍 Metadata Accuracy (Guideline 2.3)

### App Description

**Must Be**:

- [ ] Accurate (all features described are present)
- [ ] No false claims
- [ ] No keyword stuffing
- [ ] No promises of future features

**Cannot Mention**:

- ❌ Other platforms ("Also on Android")
- ❌ Beta status ("Still in beta")
- ❌ Prices/features outside the app

### Screenshots

**Must**:

- [ ] Show actual app (not concepts or mockups)
- [ ] Match current app version
- [ ] No misleading images

---

## 🚨 Top 10 Rejection Reasons (For Fork In The Road)

### 1. Missing Sign in with Apple ⛔

**Status**: ✅ IMPLEMENTED
**Prevention**: Already have it!

### 2. Demo Account Doesn't Work ⛔

**Prevention**:

- [ ] Test demo account yourself before submitting
- [ ] Verify it has sample data
- [ ] Ensure password works
- [ ] Document any special steps

### 3. Privacy Policy Issues ⛔

**Prevention**:

- [ ] Privacy Policy accessible
- [ ] Matches app behavior
- [ ] Covers all third-party services
- [ ] Contact info present

### 4. App Crashes ⛔

**Prevention**:

- [ ] TestFlight beta testing (catch crashes early)
- [ ] Crash-free rate > 99.5%
- [ ] Test on multiple devices
- [ ] Test on oldest supported iOS (16.0)

### 5. Broken Links ⛔

**Prevention**:

- [ ] Test Privacy Policy URL
- [ ] Test Support URL
- [ ] Test Marketing URL
- [ ] Test all in-app web links

### 6. Incomplete App ⛔

**Prevention**:

- [ ] All features described are working
- [ ] No placeholder content
- [ ] No "Coming Soon" text
- [ ] Demo account fully functional

### 7. IAP Issues ⛔

**Prevention**:

- [ ] Restore purchases button present
- [ ] Restoration working
- [ ] Receipt validation implemented
- [ ] Clear pricing

### 8. Permissions Not Justified ⛔

**Prevention**:

- [ ] Location permission has clear justification string
- [ ] Face ID permission has clear justification string
- [ ] Only request needed permissions

### 9. Misleading Metadata ⛔

**Prevention**:

- [ ] Screenshots match app
- [ ] Description accurate
- [ ] No false claims

### 10. Poor User Experience ⛔

**Prevention**:

- [ ] App intuitive to use
- [ ] No confusing UI
- [ ] Error messages helpful
- [ ] Loading states clear

---

## ✅ Self-Review Checklist

**Do This Before Submitting**:

1. **Pretend You're an Apple Reviewer**:

   - [ ] Download your own app (TestFlight)
   - [ ] Use demo account
   - [ ] Try to break it
   - [ ] Check all features described
   - [ ] Look for anything misleading

2. **Check Against Guidelines**:

   - [ ] Read [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
   - [ ] Verify compliance with each section
   - [ ] Document any gray areas

3. **Get Feedback**:
   - [ ] Ask beta testers for honest feedback
   - [ ] Ask if anything is confusing
   - [ ] Fix issues before submission

---

## 🎯 Post-Submission

**If Approved**:

- 🎉 Celebrate!
- Monitor for any issues post-launch

**If Rejected**:

- Read rejection email carefully
- Fix issues thoroughly
- Test fixes before resubmitting
- Increment build number
- Resubmit

**Common Resolution**:

- Most rejections are fixable within 24 hours
- Resubmissions typically review faster
- Learn from rejection for future updates

---

## 📚 Resources

**Official Guidelines**:

- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)

**Common Rejections Database**:

- [App Store Rejection Reasons](https://github.com/jpsim/iOS-App-Rejection-Reasons) (community-maintained)

---

**Follow these guidelines - avoid rejection! ✅**
