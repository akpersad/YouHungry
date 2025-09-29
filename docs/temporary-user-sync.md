# Temporary User Sync Process

## Overview

This document describes the temporary user synchronization process between Clerk and MongoDB that is in place until the custom registration flow is implemented.

## Current Issue

When users register through the out-of-the-box Clerk modal, their information is not automatically captured in our MongoDB `users` collection. This breaks the friend search functionality and other features that depend on user data.

## Temporary Solution

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

## Migration to Custom Registration Flow

### TODO: Update This Process

When the custom registration flow is implemented:

1. **Remove temporary files:**
   - Delete `scripts/sync-clerk-users-api.js`
   - Delete `docs/temporary-user-sync.md`

2. **Update webhook handler:**
   - Modify `src/app/api/webhooks/clerk/route.ts` to handle custom registration data
   - Add additional fields like city, preferences, etc.
   - **Capture city/state** from custom registration form

3. **Update user creation:**
   - Modify `src/lib/users.ts` to handle custom registration fields
   - Update user interface in `src/types/database.ts`
   - **Add city/state capture** as optional fields in registration form

4. **Test thoroughly:**
   - Ensure all existing users are properly migrated
   - Verify new registration flow works end-to-end
   - Test friend search and other user-dependent features

## Current Status

- ✅ Webhook handler implemented
- ✅ Manual sync script created
- ✅ Existing users synced to MongoDB
- ✅ Correct Clerk IDs obtained and updated
- ⚠️ Webhook secret needs to be configured in Clerk Dashboard (requires live URL)

## Next Steps

1. Configure webhook in Clerk Dashboard (after deployment to live URL)
2. Test new user registration
3. Plan custom registration flow implementation
