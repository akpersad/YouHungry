# Registration Data Flow Audit

## Date: 2025-10-19

This document tracks all data collected during registration and verifies it's properly saved to MongoDB.

## Registration Form Data Collection

### Form Fields (CustomRegistrationForm.tsx)

| Field           | Required | Sent to Clerk | Notes                                                 |
| --------------- | -------- | ------------- | ----------------------------------------------------- |
| email           | ✅ Yes   | ✅ Yes        | `emailAddress` in Clerk                               |
| username        | ✅ Yes   | ✅ Yes        | Direct field in Clerk                                 |
| password        | ✅ Yes   | ✅ Yes        | Managed by Clerk, not stored in MongoDB               |
| confirmPassword | ✅ Yes   | ❌ No         | Validation only, not sent                             |
| firstName       | ✅ Yes   | ✅ Yes        | Direct field in Clerk                                 |
| lastName        | ✅ Yes   | ✅ Yes        | Direct field in Clerk                                 |
| phoneNumber     | ❌ No    | ✅ Yes        | Sent in `unsafeMetadata`, formatted with country code |
| countryCode     | ❌ No    | ❌ No         | Combined with phoneNumber before sending              |
| smsOptIn        | ❌ No    | ✅ Yes        | Sent in `unsafeMetadata`                              |
| city            | ❌ No    | ✅ Yes        | Sent in `unsafeMetadata`                              |
| state           | ❌ No    | ✅ Yes        | Sent in `unsafeMetadata`                              |

## Clerk Webhook Data → MongoDB Mapping

### User.created Event Handler

| Clerk Field                 | MongoDB Field  | Status   | Notes                                            |
| --------------------------- | -------------- | -------- | ------------------------------------------------ |
| id                          | clerkId        | ✅ Saved | Unique Clerk identifier                          |
| email_addresses[0]          | email          | ✅ Saved | Primary email                                    |
| username                    | username       | ✅ Saved | **FIXED 2025-10-19** - Was missing               |
| first_name + last_name      | name           | ✅ Saved | Combined into single name field                  |
| image_url                   | profilePicture | ✅ Saved | Profile picture URL from Clerk                   |
| unsafe_metadata.phoneNumber | phoneNumber    | ✅ Saved | User's phone number                              |
| unsafe_metadata.phoneNumber | smsPhoneNumber | ✅ Saved | **FIXED 2025-10-19** - Set when smsOptIn is true |
| -                           | phoneVerified  | ✅ Saved | Defaults to false                                |
| unsafe_metadata.smsOptIn    | smsOptIn       | ✅ Saved | SMS notification preference                      |
| unsafe_metadata.city        | city           | ✅ Saved | User's city                                      |
| unsafe_metadata.state       | state          | ✅ Saved | User's state                                     |
| -                           | preferences    | ✅ Saved | Created with defaults                            |
| -                           | createdAt      | ✅ Saved | Auto-generated timestamp                         |
| -                           | updatedAt      | ✅ Saved | Auto-generated timestamp                         |

### User.updated Event Handler

| Clerk Field                 | MongoDB Field  | Status     | Notes                                                        |
| --------------------------- | -------------- | ---------- | ------------------------------------------------------------ |
| email_addresses[0]          | email          | ✅ Updated |                                                              |
| username                    | username       | ✅ Updated | **FIXED 2025-10-19**                                         |
| first_name + last_name      | name           | ✅ Updated |                                                              |
| image_url                   | profilePicture | ✅ Updated |                                                              |
| unsafe_metadata.phoneNumber | phoneNumber    | ✅ Updated |                                                              |
| unsafe_metadata.phoneNumber | smsPhoneNumber | ✅ Updated | **FIXED 2025-10-19** - Updates when smsOptIn + phone present |
| unsafe_metadata.city        | city           | ✅ Updated |                                                              |
| unsafe_metadata.state       | state          | ✅ Updated |                                                              |
| unsafe_metadata.smsOptIn    | smsOptIn       | ✅ Updated |                                                              |

## Preferences Default Values

When a user is created, the following default preferences are set:

```typescript
preferences: {
  locationSettings: {
    city: <from registration form>,
    state: <from registration form>,
    country: 'US',
    timezone: <server timezone>
  },
  notificationSettings: {
    groupDecisions: {
      started: true,
      completed: true
    },
    friendRequests: true,
    groupInvites: true,
    smsEnabled: <from smsOptIn>,
    emailEnabled: true,
    pushEnabled: false  // Requires explicit permission
  }
}
```

## Issues Found and Fixed

### 1. Missing Username (Fixed ✅)

**Problem**: Username was sent to Clerk during registration but not extracted and saved to MongoDB by the webhook.

**Impact**: Users had usernames in Clerk but not in MongoDB, causing potential data inconsistency.

**Fix**:

- Added `username` extraction in webhook handler
- Added `username` to createUser call
- Added `username` to updateUser call
- Added `username` to updateUser type signature

**Files Changed**:

- `src/app/api/webhooks/clerk/route.ts` (lines 69, 97, 142, 183)
- `src/lib/users.ts` (line 40)

### 2. Missing smsPhoneNumber (Fixed ✅)

**Problem**: Phone number was saved to `phoneNumber` field but not to `smsPhoneNumber`, which is what the SMS notification service actually uses.

**Impact**: Users who opted in for SMS during registration would not receive SMS notifications because the notification service checks `user.smsPhoneNumber`.

**Fix**:

- Set `smsPhoneNumber` to phoneNumber when `smsOptIn` is true during user creation
- Update `smsPhoneNumber` during user updates when `smsOptIn` is true and phone is present

**Files Changed**:

- `src/app/api/webhooks/clerk/route.ts` (lines 104, 174-178, 189)

**Code Reference**:

```typescript
// In notification-service.ts (line 88-91)
const shouldSendSMS =
  smsEnabled &&
  user?.smsOptIn &&
  user?.smsPhoneNumber && // ← Uses smsPhoneNumber, not phoneNumber!
  user?.phoneVerified;
```

## Verification Checklist

- [x] All required registration fields are sent to Clerk
- [x] All Clerk user data is extracted in webhook
- [x] All extracted data is saved to MongoDB
- [x] Username is properly saved
- [x] Phone number is saved to both `phoneNumber` and `smsPhoneNumber` (when applicable)
- [x] SMS opt-in preference is saved
- [x] Location data (city, state) is saved
- [x] Default preferences are properly initialized
- [x] User timestamps are auto-generated
- [x] No linter errors in modified files

## Testing Recommendations

1. **New User Registration Test**:
   - Register a new user with all optional fields filled
   - Verify username appears in MongoDB
   - Verify smsPhoneNumber is set when SMS opt-in is checked
   - Verify all location data is saved

2. **SMS Notification Test**:
   - Register with SMS opt-in
   - Trigger a group decision notification
   - Verify SMS is sent to the user

3. **Profile Update Test**:
   - Update user profile including username
   - Verify changes sync to MongoDB via webhook

## Related Files

- `src/components/forms/CustomRegistrationForm.tsx` - Registration form
- `src/app/api/webhooks/clerk/route.ts` - Webhook handler
- `src/lib/users.ts` - User CRUD operations
- `src/lib/notification-service.ts` - SMS notification service
- `src/types/database.ts` - User schema definition
