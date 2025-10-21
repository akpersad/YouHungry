# App Privacy - Data Disclosure Guide

Step-by-step guide to completing the App Privacy questionnaire in App Store Connect.

---

## 🎯 Overview

**Location**: App Store Connect → Your App → App Privacy

**Purpose**: Apple requires you to disclose what data you collect and how you use it. This appears as the "Privacy Nutrition Label" on the App Store.

**When to Complete**: Before first submission, update when data practices change

---

## 📊 App Privacy Questionnaire

### Section 1: Data Collection

**Question**: Does this app collect data from this app?

**Answer**: ✅ Yes

---

### Section 2: Data Types

Select all data types you collect. For each, you'll specify usage and linking.

#### Contact Info ✅

**Data Types Collected**:

- [x] Name
- [x] Email Address
- [x] Phone Number
- [ ] Physical Address
- [ ] Other Contact Info

**For Each Type**:

**Name**:

- **Used for**: App Functionality, Analytics
- **Linked to User**: Yes
- **Used for Tracking**: No

**Email Address**:

- **Used for**: App Functionality, Analytics, Product Personalization
- **Linked to User**: Yes
- **Used for Tracking**: No

**Phone Number**:

- **Used for**: App Functionality (SMS notifications, optional)
- **Linked to User**: Yes
- **Used for Tracking**: No

---

#### Location ✅

**Data Types Collected**:

- [x] Precise Location
- [ ] Coarse Location

**Precise Location**:

- **Used for**: App Functionality (restaurant search)
- **Linked to User**: Yes (searches tied to user account)
- **Used for Tracking**: No

**Disclosure**:

```
Location is used to:
- Find nearby restaurants
- Search restaurants by area
- Show distance to restaurants

Users can:
- Deny location permission (can search by manual address instead)
- Location is not shared with other users
- Location data is not stored permanently
```

---

#### User Content ✅

**Data Types Collected**:

- [x] Other User Content

**What this includes**:

- Restaurant collections
- Group memberships
- Restaurant votes/rankings
- Decision history
- Restaurant notes (premium)
- Custom tags (premium)

**Other User Content**:

- **Used for**: App Functionality, Product Personalization
- **Linked to User**: Yes
- **Used for Tracking**: No

---

#### Identifiers ✅

**Data Types Collected**:

- [x] User ID
- [x] Device ID

**User ID**:

- **Used for**: App Functionality, Analytics
- **Linked to User**: Yes
- **Used for Tracking**: No
- **Description**: Internal user identifier for account management

**Device ID**:

- **Used for**: App Functionality (push notifications), Analytics
- **Linked to User**: Yes
- **Used for Tracking**: No
- **Description**: Device token for push notifications

---

#### Usage Data ✅

**Data Types Collected**:

- [x] Product Interaction
- [x] Advertising Data (only if showing ads)
- [ ] Other Usage Data

**Product Interaction**:

- **Used for**: Analytics, Product Personalization
- **Linked to User**: Yes
- **Used for Tracking**: No
- **Description**: Feature usage, session duration, user flows

**Advertising Data** (if showing ads to free users):

- **Used for**: Third-Party Advertising
- **Linked to User**: No (non-targeted ads)
- **Used for Tracking**: No
- **Description**: Ad impressions (anonymized)

---

#### Diagnostics ✅

**Data Types Collected**:

- [x] Crash Data
- [x] Performance Data
- [ ] Other Diagnostic Data

**Crash Data**:

- **Used for**: App Functionality (bug fixes)
- **Linked to User**: No (anonymized)
- **Used for Tracking**: No
- **Description**: Crash logs via Firebase Crashlytics

**Performance Data**:

- **Used for**: App Functionality (optimize performance)
- **Linked to User**: No (anonymized)
- **Used for Tracking**: No
- **Description**: App launch time, network latency, etc.

---

### Section 3: Tracking

**Question**: Does this app or third-party partners use data from this app for tracking purposes?

**Answer**: ❌ No

**Important**: You're NOT tracking users for targeted advertising. You may show ads, but they're not personalized based on user data.

---

## 🔐 Privacy-Preserving Practices

### What to Highlight

**In App Store Description** (optional but builds trust):

```
Privacy You Can Trust:
• No data selling to third parties
• Location data not shared or stored permanently
• Push notifications opt-in only
• Sign in with Apple for maximum privacy
• Export your data anytime
• Delete account and all data with one tap
```

---

## ✅ Completion Checklist

**Before Submitting App Privacy**:

- [ ] All data types selected accurately
- [ ] Each data type has usage purpose
- [ ] "Linked to User" answered correctly
- [ ] "Used for Tracking" answered (No for all)
- [ ] Reviewed for accuracy (matches actual app behavior)
- [ ] Saved in App Store Connect

**Verification**:

- [ ] Preview Privacy Nutrition Label (App Store Connect shows preview)
- [ ] Verify it matches your expectations
- [ ] Ensure nothing misleading

---

## 🚨 Common Mistakes to Avoid

**Mistake 1**: "I forgot to disclose data I collect"

- **Impact**: App rejection
- **Solution**: Review all features, ensure all data collection disclosed

**Mistake 2**: "I said 'No' to data collection but I actually collect data"

- **Impact**: App rejection or removal from App Store
- **Solution**: Be honest, disclose all data types

**Mistake 3**: "I collect data but don't use it (orphaned data)"

- **Impact**: Privacy concern, potential rejection
- **Solution**: Only collect data you actually use

**Mistake 4**: "My Privacy Policy doesn't match App Privacy answers"

- **Impact**: App rejection
- **Solution**: Ensure both are consistent

---

## 📋 Review Process

**Apple Will Verify**:

- App Privacy answers match actual app behavior
- Privacy Policy accessible and accurate
- Data collection justified
- User controls present (can disable notifications, delete account)

**If Mismatch Found**:

- App rejected
- Must fix and resubmit

---

## 🔄 Updates

**When to Update App Privacy**:

- Adding new data collection
- Changing how data is used
- Adding new third-party services
- Changing tracking practices

**How to Update**:

1. App Store Connect → Your App → App Privacy
2. Edit existing data types or add new ones
3. Submit with next app version

---

**Get privacy right - it's required for approval! 🔒**
