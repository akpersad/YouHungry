# E2E Test Setup Guide

## Prerequisites

Before running E2E tests, you need to set up test users in Clerk.

## Step 1: Create Test Users in Clerk

### Option A: Use Your Clerk Dashboard (Development)

1. Go to your **Clerk Dashboard** → Users
2. Click **"Create User"**
3. Add test users:
   - Email: `test-user-1@your-domain.com` (use a real email you control)
   - Password: Create a secure password
   - **Important**: Mark email as verified
   - Add name: "Test User One"

4. Repeat for additional test users (user2, user3)

### Option B: Use Clerk Test Environment (Recommended for CI/CD)

1. Create a separate Clerk instance for "Testing"
2. Get test API keys
3. Create test users in that environment
4. Use environment variables to switch between dev and test

## Step 2: Configure Test Credentials

### Local Development

Create a `.env.test.local` file (this will NOT be committed):

```bash
# E2E Test User Credentials
E2E_TEST_USER_EMAIL=your-test-user@example.com
E2E_TEST_USER_PASSWORD=YourSecurePassword123!

# Optional: Additional test users
E2E_TEST_USER2_EMAIL=your-test-user-2@example.com
E2E_TEST_USER2_PASSWORD=YourSecurePassword123!

E2E_TEST_USER3_EMAIL=your-test-user-3@example.com
E2E_TEST_USER3_PASSWORD=YourSecurePassword123!
```

### CI/CD (GitHub Actions)

Add these as **GitHub Secrets**:

- `E2E_TEST_USER_EMAIL`
- `E2E_TEST_USER_PASSWORD`

## Step 3: Update Test Data

The test data file already supports environment variables:

```typescript
// e2e/fixtures/test-data.ts
export const testUsers = {
  user1: {
    email: process.env.E2E_TEST_USER_EMAIL || 'fallback@example.com',
    password: process.env.E2E_TEST_USER_PASSWORD || 'fallback-password',
    name: 'Test User One',
  },
};
```

## Step 4: Verify Setup

Run a quick smoke test to verify everything works:

```bash
# Make sure your dev server is running
npm run dev

# In another terminal, run smoke tests
npm run test:e2e:smoke
```

## Common Issues

### Issue: "User not found" or "Invalid credentials"

**Solution**:

- Verify the test user exists in Clerk
- Check that email is verified in Clerk
- Ensure password matches exactly

### Issue: "Authentication timeout"

**Solution**:

- Check that your dev server is running
- Verify Clerk is properly configured
- Check network/firewall settings

### Issue: Tests fail with "Cannot find selector"

**Solution**:

- Run tests in headed mode to see what's happening: `npm run test:e2e:headed`
- Clerk selectors may have changed - check auth.setup.ts
- Your Clerk theme/customization might use different selectors

## Quick Test User Template

If you need to quickly create users for testing:

| Email                              | Password     | Purpose                         |
| ---------------------------------- | ------------ | ------------------------------- |
| `playwright-test-1@yourdomain.com` | `Test123!@#` | Primary test user               |
| `playwright-test-2@yourdomain.com` | `Test123!@#` | Secondary user (groups/friends) |
| `playwright-test-3@yourdomain.com` | `Test123!@#` | Third user (tie scenarios)      |

**Important**:

- Use the same password for all test users to simplify maintenance
- Use a subdomain or "+tag" email format: `yourname+test1@gmail.com`
- Mark all test users as verified in Clerk

## Alternative: Mock Authentication

If you don't want to use real Clerk users, you can:

1. Set up Clerk's test mode
2. Use Clerk's development keys
3. Mock authentication in tests (advanced)

See Clerk's documentation on testing: https://clerk.com/docs/testing

## Running Tests

Once setup is complete:

```bash
# Smoke tests (fastest)
npm run test:e2e:smoke

# All E2E tests
npm run test:e2e

# Interactive mode (debug)
npm run test:e2e:ui

# With browser visible
npm run test:e2e:headed
```

## Security Notes

⚠️ **Never commit test credentials to git!**

Add to `.gitignore`:

```
.env.test.local
playwright/.auth/*.json
playwright-report/
```

✅ **Do**:

- Use environment variables
- Use GitHub Secrets for CI/CD
- Rotate test passwords periodically
- Use dedicated test accounts

❌ **Don't**:

- Commit passwords in code
- Use production accounts for testing
- Share test credentials publicly
