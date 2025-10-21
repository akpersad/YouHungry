# App Store Submission Process

Complete step-by-step guide to submitting Fork In The Road to the App Store.

---

## 🎯 Overview

**When**: After Epic 10 (Beta Testing) is complete and all bugs are fixed

**Timeline**:

- Preparation: 2-4 hours
- Submission: 30 minutes
- Review: 1-3 days (typically 24-48 hours)
- Approval → Live: Automatic or scheduled

**Prerequisites**:

- Paid Apple Developer account
- App tested thoroughly on TestFlight
- All assets prepared (screenshots, description, etc.)
- Privacy Policy and support pages live

---

## ✅ Pre-Submission Checklist

### App Completeness

- [ ] All features implemented and tested
- [ ] No placeholder content (fake data, "Coming Soon", etc.)
- [ ] No debug features or admin-only content visible
- [ ] Privacy Policy and Terms accessible from within app
- [ ] Support URL functional
- [ ] App works on all supported devices (iPhone 11+)
- [ ] App works on all supported iOS versions (16.0+)
- [ ] App works in both dark and light mode
- [ ] No crashes (99.5%+ crash-free rate on TestFlight)

### Legal & Compliance

- [ ] Privacy Policy updated and accessible
- [ ] Terms of Service available
- [ ] App Privacy questionnaire completed in App Store Connect
- [ ] Age rating appropriate (4+ for Fork In The Road)
- [ ] No copyright violations (all content is yours or licensed)
- [ ] GDPR/CCPA compliant (data export/deletion available)

### App Store Connect

- [ ] App created in App Store Connect
- [ ] Bundle ID matches
- [ ] All metadata complete (title, description, keywords, categories)
- [ ] Screenshots uploaded for all required sizes
- [ ] App icon uploaded (1024x1024)
- [ ] App previews uploaded (optional but recommended)
- [ ] In-App Purchases configured (if applicable)
- [ ] Pricing and availability set

### Technical Requirements

- [ ] App built in Release configuration
- [ ] Code signing certificates valid
- [ ] No compiler warnings (or minimal, none critical)
- [ ] App size reasonable (< 200MB uncompressed recommended)
- [ ] Launch time < 5 seconds
- [ ] No private APIs used
- [ ] All required capabilities declared
- [ ] TestFlight build tested by multiple users
- [ ] Export compliance answered (encryption usage)

---

## 📦 Prepare Final Build

### Step 1: Version & Build Number

In Xcode:

1. **Select Project** → YouHungry target
2. **General tab**
3. **Identity section**:
   - **Version**: 1.0.0 (semantic versioning: Major.Minor.Patch)
   - **Build**: 1 (increment for each submission)

**Version Guidelines**:

- **1.0.0**: Initial release
- **1.0.1**: Bug fixes
- **1.1.0**: Minor features
- **2.0.0**: Major redesign/rewrite

### Step 2: Build Configuration

1. **Product → Scheme → Edit Scheme** (Cmd+<)
2. **Run** → **Build Configuration** → **Release**
3. **Archive** → **Build Configuration** → **Release**

### Step 3: Clean Build

```bash
# In Xcode
Cmd+Shift+K (Clean Build Folder)

# Or terminal
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

### Step 4: Final Tests

- [ ] Run full test suite (Cmd+U)
- [ ] Test on physical device in Release mode
- [ ] Check for any console warnings
- [ ] Verify performance (no lag, smooth animations)
- [ ] Test all user flows end-to-end

---

## 🚀 Create Archive

### Step 1: Select Device

1. In Xcode device dropdown (top toolbar)
2. Select **"Any iOS Device (arm64)"**
   - This creates universal binary for all devices

### Step 2: Archive

1. **Product → Archive**
2. Wait for build to complete (5-15 minutes)
3. **Organizer** window opens automatically
   - If not: Window → Organizer (Cmd+Shift+Option+O)

### Archive Contents

Archive includes:

- App binary
- dSYM files (for crash symbolication)
- All resources (images, assets, etc.)

---

## 📤 Upload to App Store Connect

### Step 1: Validate Archive

1. In **Organizer**, select your archive
2. Click **"Validate App"** button
3. Choose options:
   - **App Thinning**: For all compatible device and OS variants
   - **Upload symbols**: Yes (for crash reports)
   - **Manage Version and Build Number**: Automatically (recommended)
4. Click **Validate**
5. Wait for validation (2-5 minutes)
6. Fix any errors, re-archive if needed

**Common Validation Errors**:

- **Missing icons**: Add all required icon sizes
- **Missing privacy strings**: Add to Info.plist
- **Invalid entitlements**: Check capabilities
- **Binary size too large**: Optimize assets

### Step 2: Distribute App

1. Click **"Distribute App"** button
2. Choose **"App Store Connect"**
3. Choose **"Upload"**
4. Select options (same as validation)
5. Sign build (automatic if using Xcode-managed signing)
6. Click **Upload**
7. Wait for upload (5-15 minutes depending on size)

### Step 3: Export Compliance

**Question**: "Is your app exempt from encryption?"

**For Fork In The Road**:

- Select **"No"** (you use standard HTTPS encryption)
- This is standard for most apps

**If You Added Custom Encryption**:

- Select "Yes" and answer follow-up questions
- Unlikely for Fork In The Road

---

## 🖥️ Complete App Store Connect Listing

### Step 1: Add Build to Version

1. Go to: [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **My Apps** → **Fork In The Road**
3. **App Store** tab (left sidebar)
4. Under **Build**, click **+ (Add Build)**
5. Select the build you just uploaded
   - **Note**: May take 10-30 minutes to process after upload
6. Click **Done**

### Step 2: App Review Information

Scroll to **App Review Information**:

**Contact Information**:

- **First Name**: Your first name
- **Last Name**: Your last name
- **Phone Number**: +1-XXX-XXX-XXXX
- **Email**: nodemailer_persad@yahoo.com

**Sign-in Required**:

- ✅ Yes (app requires account)

**Demo Account** (for App Review team):

```
Username: appreview@forkintheroad.app (create test account)
Password: [Strong password - at least 8 chars, mixed case, numbers]

Notes:
- Account pre-populated with sample collections
- Includes test group with active decision
- Premium features enabled for testing
```

**Notes**:

```
Thank you for reviewing Fork In The Road!

TESTING INSTRUCTIONS:
1. Sign in with demo account (credentials above)
2. View pre-populated restaurant collections
3. Join test group "App Review Test Group"
4. Participate in active group decision
5. Test premium features (IAP enabled for demo account)

FEATURES TO TEST:
✅ Authentication (Sign in with Apple also available)
✅ Restaurant search and discovery
✅ Personal collections management
✅ Group decision making (voting + random)
✅ Offline mode (airplane mode, view cached data)
✅ Push notifications (if device allows)

PREMIUM FEATURES:
Premium subscription unlocked for demo account.
Test unlimited groups, advanced voting, full history.

SUPPORT:
For questions: nodemailer_persad@yahoo.com
Response within 24 hours.
```

### Step 3: Version Information

**Copyright**: 2025 [Your Name or Company]

**Promotional Text** (170 chars, updatable anytime):

```
Tired of deciding where to eat? Fork In The Road helps you and your friends pick restaurants together!
```

**Description**: (Use the full description from app-store-connect-setup.md)

**Keywords** (100 chars):

```
restaurant,food,decide,group,friends,voting,random,collection,dining,eat
```

**Support URL**: https://forkintheroad.app/support

**Marketing URL**: https://forkintheroad.app

### Step 4: Final Review

Check everything one more time:

- [ ] Build selected
- [ ] Screenshots look good
- [ ] Description accurate (no promises for features not yet built)
- [ ] Demo account works
- [ ] Privacy Policy accessible
- [ ] All required fields filled

---

## 🎬 Submit for Review

### Ready to Submit

1. **Click "Add for Review"** (top right)
2. Review summary page shows:
   - App Information
   - Pricing and Availability
   - Version Information
   - App Review Information
3. **Click "Submit for Review"**

**Confirmation**:

- Email sent to your Apple ID email
- Status changes to "Waiting for Review"

---

## ⏱️ Review Process Timeline

### Status Progression

**Prepare for Submission**:

- You're still editing
- Not submitted yet

**Waiting for Review**:

- Submitted successfully
- In queue (typically < 24 hours)

**In Review**:

- Apple reviewer testing app
- Duration: 24-48 hours (sometimes faster!)

**Pending Developer Release** (if you chose manual release):

- Approved! Waiting for you to release

**Processing for App Store**:

- Final processing before going live
- Duration: 15-30 minutes

**Ready for Sale**:

- Live on App Store! 🎉

### Review Time Estimates

| Day                | Typical Timeline            |
| ------------------ | --------------------------- |
| Weekdays           | 24-48 hours                 |
| Weekends           | May be slower (48-72 hours) |
| Holidays           | Slower (3-5 days)           |
| Major iOS releases | Slower (queue backlog)      |

---

## 🚨 Common Rejection Reasons (And How to Avoid)

### 1. Incomplete Demo Account

**Rejection**: "We were unable to sign in..."

**Solution**:

- Test demo account yourself before submitting
- Ensure password works
- Pre-populate with sample data
- Document any special steps in review notes

### 2. Broken Links

**Rejection**: "Your Privacy Policy URL doesn't work"

**Solution**:

- Test ALL links before submission
- Privacy Policy must be accessible without login
- Support URL must load

### 3. Crashes

**Rejection**: "App crashed on launch"

**Solution**:

- TestFlight beta testing (catch crashes early)
- Test on multiple devices
- Test on oldest supported iOS (16.0)
- Check crash reports in App Store Connect

### 4. Missing Features

**Rejection**: "Feature mentioned in description doesn't work"

**Solution**:

- Only describe features that are fully implemented
- Test all described features
- Update description if features are incomplete

### 5. Requires Non-Existent Content

**Rejection**: "App is empty/requires content we can't access"

**Solution**:

- Demo account must have sample data
- Don't require user to create groups/collections to use app
- Pre-populate demo account with everything

### 6. Privacy Policy Issues

**Rejection**: "Privacy Policy doesn't match data collection"

**Solution**:

- Privacy Policy must cover ALL data you collect
- Match App Privacy questionnaire in App Store Connect
- Include third-party services (Firebase, Clerk, Google, Twilio)

### 7. In-App Purchase Not Restorable

**Rejection**: "User can't restore purchase"

**Solution**:

- Implement "Restore Purchases" button
- Test restoration flow
- Document in review notes

### 8. Sign in with Apple Issues

**Rejection**: "Sign in with Apple button doesn't work"

**Solution**:

- Test Sign in with Apple on physical device
- Ensure callback URLs configured in Clerk
- Test new user signup AND existing user login

---

## 📝 If Your App is Rejected

### Don't Panic!

- **Rejection is normal**: Even experienced developers get rejections
- **Fix and resubmit**: Usually quick turnaround
- **Learn for next time**: Avoid same mistake

### Response Process

1. **Read Rejection Email Carefully**

   - Apple explains what's wrong
   - Often includes screenshots

2. **Respond in Resolution Center** (if needed)

   - App Store Connect → Your App → Version → Resolution Center
   - Ask for clarification if rejection is unclear

3. **Fix Issues**

   - Make necessary code changes
   - Update metadata if needed
   - Re-test thoroughly

4. **Increment Build Number**

   - Don't change version (still 1.0.0)
   - Increment build (1 → 2)

5. **Create New Archive**

   - Product → Archive
   - Upload to App Store Connect

6. **Add to Version & Resubmit**
   - Select new build
   - Click "Submit for Review" again

**Typical Resubmission Time**: Same as initial (24-48 hours)

---

## 🎉 After Approval

### Release Strategy

**Automatic Release** (recommended for v1.0):

- Goes live immediately after approval
- No control over timing

**Manual Release**:

- You control when it goes live
- Up to 180 days to release after approval
- Good for coordinated launches

**Scheduled Release**:

- Set specific date/time
- Good for marketing campaigns

### Post-Launch Checklist

Immediately after launch:

- [ ] Search for app in App Store (may take 15-30 min to appear)
- [ ] Download and test from App Store
- [ ] Share link with friends/beta testers
- [ ] Post on social media
- [ ] Monitor crash reports
- [ ] Monitor ratings and reviews
- [ ] Watch analytics (App Store Connect → Analytics)

### Monitor Performance

**First 24 Hours**:

- Check for crashes (should be < 0.5%)
- Monitor user reviews
- Watch download numbers
- Test payment/IAP (if applicable)

**First Week**:

- Respond to reviews (especially negative ones)
- Track user retention
- Monitor server load (mobile API on Render)
- Gather user feedback

**First Month**:

- Plan version 1.1 updates based on feedback
- Analyze usage patterns
- Identify most popular features
- Address any bugs or issues

---

## 🔄 Future Updates

### Update Process (Version 1.1, 1.2, etc.)

1. **Make Changes** in Xcode
2. **Increment Version/Build**:
   - Bug fixes: 1.0.0 → 1.0.1
   - New features: 1.0.0 → 1.1.0
3. **Test Thoroughly**
4. **Archive & Upload**
5. **Create New Version** in App Store Connect:
   - Your App → + Version or Platform
   - Version Number: 1.1.0
   - What's New: Describe changes
6. **Add Build** to new version
7. **Submit for Review**

**Update Review**: Usually faster than initial (24-48 hours)

---

## 📊 App Store Optimization (ASO)

### Improve Discoverability

**Keywords**:

- Research competitors
- Use all 100 characters
- Comma-separated, no spaces
- Update with each version (test what works)

**Title & Subtitle**:

- Include main keyword in title
- Subtitle helps with search (30 chars)

**Screenshots**:

- First 2-3 are most important (preview in search)
- Show key features
- Use text overlays to highlight benefits

**Ratings & Reviews**:

- Prompt users at right time (after successful group decision)
- Respond to reviews (shows you care)
- Fix issues mentioned in reviews

**App Preview Video**:

- 15-30 seconds
- Shows actual app usage
- No music needed
- Increases conversion

---

## ✅ Final Submission Checklist

**Before clicking "Submit for Review"**:

- [ ] App fully tested on TestFlight
- [ ] All features working
- [ ] No crashes or major bugs
- [ ] Privacy Policy accessible
- [ ] Demo account created and tested
- [ ] All screenshots uploaded
- [ ] App icon looks good at all sizes
- [ ] Description accurate
- [ ] Keywords optimized
- [ ] Build uploaded and selected
- [ ] App Review Information complete
- [ ] Export compliance answered
- [ ] Pricing set correctly
- [ ] Release timing chosen
- [ ] Team notified of submission
- [ ] Prepared for user feedback

---

## 🎯 Success Metrics

### Track These After Launch

**Week 1**:

- Downloads
- Crash-free rate (target: > 99.5%)
- Rating (target: > 4.5 stars)
- Reviews (respond to all!)

**Month 1**:

- Active users
- Retention (Day 1, Day 7, Day 30)
- Feature usage (most popular features)
- Premium conversion (if applicable)

**Ongoing**:

- Update frequency (monthly recommended)
- User feedback themes
- Performance metrics
- Server costs vs. user growth

---

## 🚀 You're Ready to Launch!

**Next Steps**:

1. Complete [Pre-Submission Checklist](#-pre-submission-checklist)
2. Create final archive
3. Upload to App Store Connect
4. Complete all metadata
5. Submit for review
6. Wait patiently (24-48 hours)
7. Celebrate launch! 🎉

**Support**: nodemailer_persad@yahoo.com

---

**Go make it live! The world is ready for Fork In The Road! 🍔📱**
