# App Store Connect Setup

Complete guide to setting up App Store Connect for TestFlight and App Store submission.

---

## 🎯 Overview

**App Store Connect** is Apple's portal for managing apps, TestFlight beta testing, and App Store submissions.

**When to do this**: After Epic 9 (before TestFlight testing)

**Prerequisites**:

- Paid Apple Developer account ($99/year)
- App built and ready for testing
- App icon, screenshots, description prepared

---

## 💳 Apple Developer Program Enrollment

### Step 1: Enroll in Apple Developer Program

1. **Go to**: [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll)
2. **Sign in** with your Apple ID
3. **Click "Start Your Enrollment"**
4. **Entity Type**: Individual (or Company if you have one)
5. **Complete Personal Information**
   - Legal Name
   - Address
   - Phone Number
6. **Accept Agreements**
   - Apple Developer Agreement
   - Apple Developer Program License Agreement
7. **Purchase** ($99/year)
   - Payment via credit card or Apple Pay
   - Charges annually on enrollment date

### Step 2: Wait for Approval

- **Timeline**: Usually 24-48 hours
- **Email Confirmation**: You'll receive "Welcome to Apple Developer Program"
- **Check Status**: [developer.apple.com/account](https://developer.apple.com/account)

---

## 🏗️ Create App in App Store Connect

### Step 1: Access App Store Connect

1. Go to: [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Sign in with your Apple ID
3. Click "My Apps"

### Step 2: Create New App

1. Click **+ (plus icon)** → New App
2. **Platforms**: iOS (✅)
3. **Name**: Fork In The Road
   - Must be unique across App Store
   - Can change later if needed
4. **Primary Language**: English (U.S.)
5. **Bundle ID**: Select "com.forkintheroad.app" (from dropdown)
   - If not there: Register in [developer.apple.com/account](https://developer.apple.com/account) → Certificates, IDs & Profiles → Identifiers → + → App IDs
6. **SKU**: forkintheroad-ios (unique identifier for your records)
7. **User Access**: Full Access
8. Click **Create**

---

## 📝 App Information

### Basic App Information

Navigate to: **App Store** tab → **App Information** (left sidebar)

**Name**: Fork In The Road

**Subtitle** (optional, 30 chars):

- "Find restaurants with friends"
- "Group decision made easy"
- "Decide where to eat, together"

**Privacy Policy URL**:

- `https://forkintheroad.app/privacy` (your web app URL)
- Must be accessible without login

**Category**:

- **Primary**: Food & Drink
- **Secondary** (optional): Social Networking

**Content Rights**:

- Do you hold the necessary rights to: **Yes**

**Age Rating**:

- Click "Edit" next to Age Rating
- Answer questionnaire (all should be "No" for Fork In The Road)
- Result: Should be **4+** (no mature content)

---

## 🎨 Prepare App Store Assets

### App Icon

**Requirements**:

- Size: 1024x1024 pixels
- Format: PNG or JPEG (no transparency)
- Color space: sRGB or P3
- No alpha channel
- No rounded corners (Apple adds them)

**Your App Icon**:

- Should match your neumorphism design system
- Clear, simple, recognizable
- Test at small sizes (looks good on Home Screen)

### Screenshots

**Required Sizes**:

- **6.9" Display** (iPhone 16 Pro Max): 1320 x 2868 px
- **6.7" Display** (iPhone 15 Pro Max): 1284 x 2778 px
- **5.5" Display** (iPhone 8 Plus): 1242 x 2208 px

**Minimum Required**: 3 screenshots per size
**Maximum**: 10 screenshots per size

**What to Screenshot**:

1. **Onboarding/Login** - Sign in with Apple screen
2. **Collections View** - Your restaurant collections
3. **Restaurant Search** - Search results with map
4. **Group Decision** - Voting interface
5. **Decision Result** - Selected restaurant

**Tips**:

- Use **Device Frame** (looks professional)
- **Consistent Theme**: All in light mode OR dark mode
- **Real Data**: Use realistic restaurant names/photos
- **Highlight Features**: Show what makes app unique
- **Text Overlays** (optional): Add feature callouts

**Tools**:

- Screenshots.pro (automated, paid)
- Figma (manual, free)
- Simulator → Cmd+S (basic screenshots)

### App Preview Video (Optional but Recommended)

**Requirements**:

- Length: 15-30 seconds
- Portrait orientation
- Same sizes as screenshots
- No audio required

**Show**: Quick walkthrough of main features

---

## ✍️ App Store Listing

### App Description

Navigate to: **App Store** tab → **Version Information**

**Promotional Text** (170 chars, can update anytime):

```
Tired of deciding where to eat? Fork In The Road helps you and your friends pick restaurants together. Create collections, vote on favorites, or let us choose randomly!
```

**Description** (up to 4000 chars):

```
FORK IN THE ROAD - Group Restaurant Decision Made Easy

Stop the endless "Where do you want to eat?" conversations! Fork In The Road helps you and your friends decide on restaurants together, whether you're craving something specific or feeling adventurous.

🍽️ PERSONAL COLLECTIONS
• Save your favorite restaurants in custom collections
• Organize by cuisine, location, or occasion
• Access your collections anytime, anywhere

👥 GROUP FEATURES
• Create groups with friends and family
• Everyone adds their favorite spots
• Vote on restaurants together
• Fair voting system ensures everyone's voice counts

🎲 DECISION MODES
• Random Selection: Let the app surprise you
• Tiered Voting: Rank your top choices
• Smart Weighting: Recently visited places get lower priority

📍 RESTAURANT DISCOVERY
• Search nearby restaurants
• View on map
• See ratings, prices, and reviews
• One-tap directions in Apple Maps

🎯 FEATURES
• Sign in with Apple for privacy and security
• Works offline - access your collections anywhere
• Dark mode support
• Siri Shortcuts integration
• Home Screen widgets
• Live Activities for group decisions

💎 PREMIUM FEATURES (Optional)
• Unlimited groups (free = 3 groups)
• Advanced voting features
• Full decision history
• Restaurant notes and custom tags
• Export your data
• Ad-free experience

Perfect for:
• Date nights with indecisive partners
• Family dinners with picky eaters
• Friend groups who can't decide
• Foodies tracking their favorite spots
• Anyone tired of decision fatigue

Download Fork In The Road today and never struggle with "where to eat" again!
```

**Keywords** (100 chars total, comma-separated):

```
restaurant,food,decide,group,friends,voting,random,collection,dining,eat
```

**What's New** (version updates, 4000 chars):

```
Welcome to Fork In The Road!

This is our initial release with:
• Personal restaurant collections
• Group decision making
• Sign in with Apple
• Restaurant search and discovery
• Smart random selection
• Offline access to collections
• Dark mode support

We're constantly improving! Send feedback to: nodemailer_persad@yahoo.com
```

**Support URL**:

- `https://forkintheroad.app/support` (or create support page)

**Marketing URL** (optional):

- `https://forkintheroad.app`

---

## 🔐 Privacy & Data

### Privacy Policy

**Required**: Privacy Policy URL in App Information section

**Must Include**:

- What data you collect (email, name, phone, location)
- How you use data (authentication, restaurant search, notifications)
- Third-party services (Clerk, Google Places, Firebase, Twilio)
- User rights (data export, deletion)
- Contact information

**Update your web app Privacy Policy** to include iOS-specific items.

### Data Collection Survey

Navigate to: **App Privacy** (left sidebar)

**Complete the questionnaire**:

**Contact Info**:

- ✅ Name
- ✅ Email Address
- ✅ Phone Number (optional, for SMS)

**Location**:

- ✅ Precise Location (for restaurant search)
- **Usage**: App functionality

**User Content**:

- ✅ Other User Content (restaurant collections, votes)

**Usage Data**:

- ✅ Product Interaction (analytics)

**For Each Data Type, Specify**:

- **Linked to user**: Yes
- **Used for tracking**: No (we don't track for ads)
- **Used for**: App functionality, Analytics

---

## 🧪 TestFlight Setup

### Step 1: Create Test Group

1. **Navigate to**: TestFlight tab → Internal Testing
2. **Click +** next to "Internal Testing"
3. **Group Name**: Beta Testers (or "Internal Team")
4. **Add Testers**:
   - Click "+" to add testers
   - Enter email addresses (up to 100 for internal, 10,000 for external)
   - Testers receive invitation email

### Step 2: Upload Build (from Xcode)

This happens later, but here's the process:

1. In Xcode: Product → Archive
2. Organizer opens → Select archive
3. Click "Distribute App"
4. Choose "TestFlight & App Store"
5. Follow prompts
6. Build uploads (takes 5-15 minutes)
7. Build processes (takes 10-30 minutes)
8. **Export Compliance**: If asked, select "No" (you're not using encryption beyond standard HTTPS)

### Step 3: Add Build to Test Group

1. Build appears in TestFlight tab
2. Select build
3. Click "+ Add Missing Compliance"
4. Answer: "No" for encryption (unless you added custom encryption)
5. Select your test group
6. Build becomes available to testers

### Step 4: Test Information

**What to Test** (shown to testers):

```
Welcome to Fork In The Road Beta!

Please test these features:
✅ Sign in with Apple
✅ Create personal collections
✅ Search for restaurants
✅ Add restaurants to collections
✅ Create groups and invite friends
✅ Vote on restaurant decisions
✅ Random selection
✅ Offline mode

Known Issues:
• Push notifications may have delays
• Some analytics features still in development

Feedback: nodemailer_persad@yahoo.com
```

**Beta App Description**:

```
Help us test Fork In The Road - the app that helps you and your friends decide where to eat!

This is a beta version. Expect some bugs and rough edges. Your feedback is crucial!
```

---

## 📊 Analytics & Reports

### Sales and Trends

- **Access**: App Analytics (left sidebar)
- **Metrics**: Downloads, crashes, engagement
- **Available**: After App Store launch

### TestFlight Analytics

- **Access**: TestFlight tab → Testers
- **Metrics**: Installs, sessions, crashes, feedback
- **Available**: After TestFlight builds deployed

---

## 💰 Pricing & Availability

Navigate to: **Pricing and Availability** (left sidebar)

**Price**: Free (base app)

**Availability**:

- **Countries**: Select All (or specific countries)
- **Release**: Automatically after approval

**Pre-Orders**: No (not for version 1.0)

---

## 💳 In-App Purchases Setup

### Create In-App Purchase

Navigate to: **Features** → **In-App Purchases**

**For Premium Subscription**:

1. Click **+ Create**
2. Type: **Auto-Renewable Subscription**
3. Reference Name: Premium Monthly
4. Product ID: com.forkintheroad.app.premium.monthly
5. Subscription Group: Create new "Premium"
6. **Subscription Duration**: 1 Month
7. **Price**: $0.99 (first year promo) / $3.99 (regular)

**Localized Information**:

- **Display Name**: Premium
- **Description**:
  ```
  Unlock unlimited groups, advanced voting, full history,
  restaurant notes, and ad-free experience.
  ```

**Review Screenshot**: Screenshot showing premium features

**Review Notes**:

```
Test account credentials will be provided in App Review Information.
Premium features include: unlimited groups, tiered voting, full history.
```

**Repeat for**:

- Premium Yearly: $10/year (first year) / $39.99/year (regular)

---

## 🔑 Users and Access

### Add Team Members (Optional)

Navigate to: **Users and Access** (top menu)

**Roles**:

- **Admin**: Full access (you)
- **Developer**: Technical access (CI/CD)
- **Marketing**: App Store listing only
- **Finance**: Sales and financial reports only

**For Solo Developer**: Just you as Admin

---

## ✅ Pre-Submission Checklist

Before submitting to App Store:

**App Store Connect**:

- [ ] App created in App Store Connect
- [ ] Bundle ID matches Xcode project
- [ ] App icon uploaded (1024x1024)
- [ ] Screenshots for all required sizes
- [ ] App description and keywords
- [ ] Privacy Policy URL
- [ ] App Privacy completed
- [ ] Support URL
- [ ] Categories selected
- [ ] Age rating completed

**Xcode**:

- [ ] Build archived
- [ ] Build uploaded to App Store Connect
- [ ] Export compliance answered
- [ ] Build assigned to TestFlight (if testing first)

**Legal**:

- [ ] Privacy Policy updated and accessible
- [ ] Terms of Service available
- [ ] Contact information for support

---

## 🚀 Next Steps

1. **Now**: Set up App Store Connect account structure
2. **Epic 9**: Prepare app assets (icon, screenshots, description)
3. **Epic 10**: TestFlight beta testing
4. **Epic 11**: Submit to App Store

**Guides to Read Next**:

- [Certificate Management](./certificate-management.md)
- [Submission Process](./submission-process.md)

---

**You've Got This! 🎉**

**Support**: nodemailer_persad@yahoo.com
