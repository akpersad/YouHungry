# Privacy Policy Requirements

What Apple requires in your Privacy Policy for App Store approval.

---

## 🎯 Overview

**Requirement**: All apps that collect user data MUST have a Privacy Policy accessible from the app and linked in App Store Connect.

**Your Privacy Policy URL**: https://forkintheroad.app/privacy

**Must be accessible**:

- Before account creation
- From app settings
- Without requiring login

---

## 📝 Required Sections

### 1. Data We Collect

**Personal Information**:

```
We collect the following personal information:
- Name and email address (for account creation)
- Phone number (optional, for SMS notifications)
- Profile picture (from Sign in with Apple or Clerk)
- Location data (for restaurant search)
```

**Usage Data**:

```
We collect usage information to improve the app:
- Device information (model, iOS version)
- App usage statistics (features used, session duration)
- Crash reports (for bug fixes)
- Analytics data (Firebase Analytics)
```

**User Content**:

```
We store content you create:
- Restaurant collections
- Group memberships
- Restaurant votes and rankings
- Decision history
```

---

### 2. How We Use Data

```
We use your information to:
- Provide app functionality (authentication, restaurant search)
- Send notifications (group decisions, friend requests)
- Improve the app (analytics, crash reports)
- Comply with legal obligations

We DO NOT:
- Sell your personal information to third parties
- Use your data for advertising targeting (beyond showing non-targeted ads in free tier)
- Share your location with other users
```

---

### 3. Third-Party Services

**Must Disclose All Third-Party Services**:

```
We use the following third-party services:

1. Clerk (Authentication)
   - Processes: Email, password, name
   - Privacy Policy: https://clerk.com/privacy
   - Purpose: User authentication and account management

2. Apple Sign-In (Authentication)
   - Processes: Apple ID, email, name
   - Privacy Policy: https://www.apple.com/legal/privacy/
   - Purpose: User authentication

3. Google Places API (Restaurant Data)
   - Processes: Search queries, location data
   - Privacy Policy: https://policies.google.com/privacy
   - Purpose: Restaurant search and discovery

4. Firebase (Analytics & Notifications)
   - Processes: Device info, usage data, push tokens
   - Privacy Policy: https://firebase.google.com/support/privacy
   - Purpose: Analytics, crash reporting, push notifications

5. Twilio (SMS Notifications)
   - Processes: Phone number, message content
   - Privacy Policy: https://www.twilio.com/legal/privacy
   - Purpose: SMS notifications (optional, user opt-in)

6. Resend (Email Notifications)
   - Processes: Email address, message content
   - Privacy Policy: https://resend.com/legal/privacy-policy
   - Purpose: Email notifications

7. MongoDB Atlas (Database)
   - Processes: All user data
   - Privacy Policy: https://www.mongodb.com/legal/privacy-policy
   - Purpose: Data storage
```

---

### 4. User Rights (GDPR/CCPA)

```
You have the right to:
- Access your personal data
- Correct inaccurate data
- Delete your account and all data
- Export your data (collections, history)
- Opt-out of SMS/Email notifications
- Disable push notifications

To exercise these rights, contact: nodemailer_persad@yahoo.com
```

---

### 5. Data Security

```
We protect your data using:
- Industry-standard encryption (HTTPS/TLS)
- Secure token storage (iOS Keychain)
- Regular security audits
- Limited employee access to data
```

---

### 6. Children's Privacy

```
Fork In The Road is not directed to children under 13.
We do not knowingly collect data from children under 13.
If we learn we have collected data from a child under 13, we will delete it immediately.
```

---

### 7. Changes to Privacy Policy

```
We may update this Privacy Policy from time to time.
We will notify you of any changes by:
- Posting the new Privacy Policy on this page
- Sending an in-app notification
- Updating the "Last Updated" date

Last Updated: [Date of last update]
```

---

### 8. Contact Information

```
For privacy-related questions or concerns, contact:

Email: nodemailer_persad@yahoo.com
Response Time: Within 48 hours

Fork In The Road
[Your Address if required by jurisdiction]
```

---

## ✅ Implementation Checklist

**Privacy Policy**:

- [ ] All sections above included
- [ ] Accessible at https://forkintheroad.app/privacy
- [ ] Works without login
- [ ] Mobile-friendly (readable on iPhone)
- [ ] "Last Updated" date present

**In-App Access**:

- [ ] Link in Settings screen
- [ ] Link in Sign Up screen
- [ ] Link in About/Legal screen

**App Store Connect**:

- [ ] Privacy Policy URL added to App Information
- [ ] App Privacy questionnaire completed (matches policy)

---

## 🚨 Common Privacy Violations (Avoid These!)

**Don't**:

- ❌ Collect data without disclosing in Privacy Policy
- ❌ Share data with third parties without consent
- ❌ Use data for purposes not disclosed
- ❌ Require more data than necessary for app functionality
- ❌ Make Privacy Policy inaccessible
- ❌ Use misleading or unclear language

**Do**:

- ✅ Be transparent about data collection
- ✅ Give users control over their data
- ✅ Update Privacy Policy when practices change
- ✅ Respond to user privacy requests promptly
- ✅ Use clear, simple language

---

**Privacy is not optional - get it right from the start! 🔒**
