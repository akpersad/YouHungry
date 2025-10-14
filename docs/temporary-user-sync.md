# User Sync Process

## Overview

This document describes the user synchronization process between Clerk and MongoDB with the custom registration flow implementation.

## Custom Registration Flow (✅ IMPLEMENTED)

**Update:** The custom registration flow has been fully implemented! Users now register through a custom form that uses Clerk's client-side SDK (`useSignUp` hook) with in-line email verification.

### How It Works:

1. User fills out custom registration form at `/sign-up`
2. Form uses Clerk's `useSignUp` hook to create user client-side
3. User data stored in Clerk including custom fields in `unsafeMetadata`
4. Clerk sends 6-digit verification code via email
5. User enters code within the same form (no page redirect)
6. On successful verification, Clerk activates session
7. User automatically redirected to `/dashboard`
8. Webhook creates MongoDB user record with custom fields from `unsafeMetadata`

## Webhook Configuration (Still Active)

### 1. Webhook Configuration

The webhook endpoint at `/api/webhooks/clerk/route.ts` is configured to handle:

- `user.created` - Creates user in MongoDB when new user signs up
- `user.updated` - Updates user data when profile changes
- `user.deleted` - Handles user deletion

### 2. Manual Sync Process

For existing users who registered before the webhook was properly configured, we use a manual sync process:

```bash
# Run the sync script
node scripts/sync-clerk-users-api.js
```

### 3. Webhook Setup in Clerk Dashboard

To ensure new users are automatically synced:

1. Go to Clerk Dashboard → Webhooks
2. Create a new webhook endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy the webhook secret to `CLERK_WEBHOOK_SECRET` in `.env.local`

## Files Involved

### Core Files

- `src/app/api/webhooks/clerk/route.ts` - Webhook handler
- `src/lib/users.ts` - User CRUD operations
- `src/lib/auth.ts` - Authentication helpers

### Temporary Files (to be removed)

- `scripts/sync-clerk-users-api.js` - Manual sync script
- `docs/temporary-user-sync.md` - This documentation

## Testing

To test the user sync:

1. **Check existing users:**

   ```bash
   curl "http://localhost:3000/api/friends/search?q=Andrew&userId=user_33ErQ6awQwQU7ZQA5xnpit4oyE0"
   ```

2. **Test new user registration:**
   - Register a new user through Clerk
   - Check if they appear in MongoDB
   - Verify they can be found in friend search

## Custom Registration Implementation (✅ COMPLETED)

### What Was Implemented:

1. **Custom Registration Form** (`src/components/forms/CustomRegistrationForm.tsx`)
   - Fully custom form component using Clerk's `useSignUp` hook
   - Collects: email, username, password, first/last name, phone (optional), SMS opt-in, city/state (optional)
   - Real-time field validation on blur with visual success indicators
   - In-line email verification with 6-digit code input
   - Verification code resend with 60-second cooldown
   - Client-side validation for password strength (10-72 chars), email format, username format (4-64 chars), phone format

2. **Username Availability API** (`src/app/api/auth/check-username/route.ts`)
   - Checks username availability in Clerk user database
   - Validates username format (4-64 characters, alphanumeric + \_ -)
   - Returns availability status for real-time feedback

3. **Email Verification (In-Form)**
   - 6-digit verification code sent by Clerk
   - User enters code within registration form
   - Form transitions to verification state (no page redirect)
   - Resend functionality with countdown timer
   - On success, session activated and user redirected to dashboard

4. **Webhook Handler** (`src/app/api/webhooks/clerk/route.ts`)
   - Handles `user.created` events from Clerk
   - Extracts custom fields from `unsafeMetadata` (phone, SMS opt-in, city, state)
   - Creates MongoDB user with all custom fields
   - Sets up default notification preferences
   - Works in development mode without webhook secret

## Current Status

- ✅ Custom registration flow fully implemented using Clerk's client-side SDK
- ✅ In-line email verification within registration form (no page redirect)
- ✅ Username availability checking with real-time validation
- ✅ Webhook handler implemented for MongoDB user creation
- ✅ Manual sync script available for legacy users
- ✅ Existing users synced to MongoDB
- ✅ Custom fields (phone, SMS opt-in, city/state) stored in Clerk's `unsafeMetadata` and synced to MongoDB
- ✅ 6-digit email verification code with resend functionality
- ⚠️ Webhook secret should be configured in Clerk Dashboard for production (optional for dev)

## Testing the Registration Flow

1. Navigate to `http://localhost:3000/sign-up`
2. Fill out the custom registration form with all required fields
3. See real-time validation feedback on blur (✓ checkmarks for valid fields)
4. Submit the form
5. Form transitions to verification view (same page, no redirect)
6. Check email for 6-digit verification code from Clerk
7. Enter the 6-digit code in the verification input
8. On successful verification, automatically redirected to `/dashboard`
9. MongoDB user created automatically via webhook with all custom fields
