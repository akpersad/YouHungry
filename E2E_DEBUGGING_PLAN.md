# E2E Test Debugging Plan

**Status**: 25 tests failing with timeouts (30s)
**Root Cause**: Authentication setup not completing successfully

---

## 🎯 Current Situation

**Test Results**:

- ❌ Authentication Flow: All 5 browser variants failing (30s timeout)
- ❌ Group Collaboration: All 5 browser variants failing (30s timeout)
- ❌ Tiered Group Decision: All 5 browser variants failing (30s timeout)
- ❌ Restaurant Search: All 5 browser variants failing (30s timeout)
- ❌ Registration Enhanced: All 5 browser variants failing (6-10s timeout)

**Key Observation**: All tests are timing out, suggesting a **common root cause** - the authentication setup.

---

## 📋 Methodical Investigation Steps

### Phase 1: Diagnose Authentication Setup (ROOT CAUSE)

**Goal**: Get the auth setup working so all dependent tests can run.

#### Step 1.1: Manual Verification

- [ ] Manually sign in at http://localhost:3000/sign-in with test credentials
- [ ] Confirm it redirects to `/dashboard` successfully
- [ ] Note exact behavior (any delays, redirects, modals?)
- [ ] Check browser console for errors
- [ ] Check network tab for failed requests

#### Step 1.2: Inspect Test Screenshots

```bash
npx playwright show-report
```

- [ ] Look at `auth.setup.ts` failure screenshot
- [ ] What page is visible? (sign-in, dashboard, error, blank?)
- [ ] Are credentials filled in the form?
- [ ] Is the "Continue" button visible and clickable?
- [ ] Any error messages visible?

#### Step 1.3: Run Auth Setup in Debug Mode

```bash
npm run test:e2e:debug-auth
```

- [ ] Step through line by line (F10)
- [ ] Watch the browser window at each step
- [ ] Note exactly where it gets stuck
- [ ] Check what URL it's on when it fails
- [ ] Look for any console errors in dev tools

#### Step 1.4: Check Environment Variables

```bash
# In the e2e/auth.setup.ts file, add temporary logging
console.log('Email:', testUsers.user1.email);
console.log('Password:', testUsers.user1.password ? '***SET***' : 'MISSING');
```

- [ ] Verify variables are loading from `.env.local`
- [ ] Confirm email matches Clerk user exactly
- [ ] Ensure password is correct (case-sensitive!)

---

### Phase 2: Fix Authentication Setup

Based on Phase 1 findings, try fixes in order:

#### Fix Option A: Clerk Takes Too Long to Load

**Symptom**: Clerk form not appearing or taking >15s to load

```typescript
// In auth.setup.ts, line 21
await page.waitForSelector('input[name="identifier"]', { timeout: 30000 }); // Increase timeout
```

#### Fix Option B: Navigation After Login Takes Too Long

**Symptom**: Login succeeds but redirect to dashboard times out

```typescript
// In auth.setup.ts, line 44
await Promise.all([
  page.waitForURL(/dashboard/, { timeout: 60000 }), // Increase to 60s
  page.locator('button:has-text("Continue")').first().click(),
]);
```

#### Fix Option C: Clerk Showing Verification Screen

**Symptom**: Redirects to email verification instead of dashboard

- [ ] Go to Clerk Dashboard → Users
- [ ] Find test user
- [ ] Click "Verify email" manually
- [ ] Try test again

#### Fix Option D: Middleware Blocking Navigation

**Symptom**: Stuck on sign-in page after clicking Continue

```typescript
// Check src/middleware.ts to ensure test user isn't being blocked
// Temporarily disable middleware for testing:
// export const config = { matcher: [] }; // Disables all middleware
```

#### Fix Option E: Multiple Clerk Forms Interfering

**Symptom**: Screenshot shows modal overlaying main form

```typescript
// Add before filling credentials:
await page.evaluate(() => {
  // Close any modals
  document.querySelectorAll('[role="dialog"]').forEach((el) => {
    if (el.parentElement) el.parentElement.remove();
  });
});
```

---

### Phase 3: Adjust Test Strategy

If authentication continues to be problematic:

#### Option 1: Skip Setup, Use Clerk Test Tokens

```typescript
// Use Clerk's testing tokens directly
// https://clerk.com/docs/testing/playwright
import { clerkSetup } from '@clerk/testing/playwright';

setup('authenticate', async () => {
  await clerkSetup({
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });
});
```

#### Option 2: Mock Authentication

```typescript
// Create fake auth state for testing
const authState = {
  cookies: [
    {
      name: '__clerk_db_jwt',
      value: 'test-token',
      domain: 'localhost',
      path: '/',
    },
  ],
};
await page.context().addCookies(authState.cookies);
```

#### Option 3: Test Public Pages First

```bash
# Comment out auth dependency temporarily in playwright.config.ts
# Run tests that don't need auth:
npm run test:e2e:no-auth
```

---

### Phase 4: Fix Individual Test Issues

Once authentication works, tackle test-specific issues:

#### Test 1: Authentication Tests

**File**: `e2e/authentication.spec.ts`
**Issue**: Depends on working auth setup

- [ ] Should pass once auth.setup.ts is fixed
- [ ] If not, check selectors for sign-out button
- [ ] Verify protected route redirects work

#### Test 2: Registration Tests

**File**: `e2e/registration-enhanced.spec.ts`
**Issue**: May not actually need auth (shorter timeouts suggest different issue)
**Fix**: These should run without auth, check why they're failing:

```typescript
// Might be waiting for elements that don't exist
// Check if selectors match actual page
```

#### Test 3: Restaurant Search Tests

**File**: `e2e/restaurant-search.spec.ts`
**Issue**: Needs auth + collection to exist
**Fix**: Create test collection in beforeEach

```typescript
test.beforeEach(async ({ page }) => {
  // Make sure user is authenticated
  // Create a test collection
  await createCollection(page, testCollections.personal1.name);
});
```

#### Test 4: Group Collaboration Tests

**File**: `e2e/group-collaboration.spec.ts`
**Issue**: Needs auth + likely creating resources that take time
**Fix**: Increase timeouts, add better waits

```typescript
// Use waitForNetworkIdle after creating resources
await waitForNetworkIdle(page);
```

#### Test 5: Group Decision Tests

**File**: `e2e/group-decision-tiered.spec.ts`
**Issue**: Complex flow, needs auth + group + collection + restaurants
**Fix**: Simplify test setup or increase timeouts

```typescript
test.setTimeout(120000); // 2 minutes for complex tests
```

---

### Phase 5: Optimize Test Configuration

#### 5.1: Adjust Timeouts Globally

```typescript
// In playwright.config.ts
export default defineConfig({
  timeout: 60000, // 60s default timeout
  expect: {
    timeout: 10000, // 10s for assertions
  },
  use: {
    navigationTimeout: 30000, // 30s for page navigations
    actionTimeout: 15000, // 15s for clicks, fills, etc.
  },
});
```

#### 5.2: Run Tests in Serial (Not Parallel)

```typescript
// In playwright.config.ts
export default defineConfig({
  fullyParallel: false, // Run one test at a time
  workers: 1, // Single worker
});
```

#### 5.3: Reduce Browser Matrix

```typescript
// Test only on Chromium first
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  // Comment out mobile and other browsers until tests pass on Chrome
];
```

---

## 🔍 Debugging Commands Reference

```bash
# View last test results
npx playwright show-report

# Run just the auth setup in debug mode
npm run test:e2e:debug-auth

# Run smoke tests (current failing tests)
npm run test:e2e:smoke

# Run without auth dependency
npm run test:e2e:no-auth

# Run single test file
npx playwright test e2e/authentication.spec.ts --headed

# Run single test by name
npx playwright test --grep "Existing user login"

# Run with full trace
npx playwright test --trace on

# View traces
npx playwright show-trace test-results/.../trace.zip
```

---

## 📝 Expected Outcomes

### Success Criteria:

- ✅ `auth.setup.ts` completes without timeout
- ✅ Authentication state saved to `playwright/.auth/user.json`
- ✅ At least 1 smoke test passes
- ✅ Can run tests in headed mode and see them work

### When to Move On:

- Once auth setup works, tackle each test suite one at a time
- Don't try to fix all 25 at once
- Focus on getting 1-2 tests passing completely
- Then expand to other browsers and test suites

---

## 🎯 Priority Order

**DO THIS FIRST**:

1. Fix authentication setup (`auth.setup.ts`) - everything depends on this
2. Get ONE test passing (probably "Existing user login")
3. Verify auth state is being saved and reused

**DO THIS SECOND**:

1. Fix registration tests (don't need auth, should be quick)
2. Fix restaurant search tests
3. Fix group collaboration tests
4. Fix decision making tests (most complex)

**DO THIS LAST**:

1. Test on multiple browsers
2. Optimize performance
3. Add more test scenarios

---

## 🚨 Quick Wins

If you're stuck, try these quick wins to verify the framework works:

### Quick Win 1: Test Public Pages

```typescript
// Create e2e/public-pages.spec.ts
test('Home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});

test('Sign-in page loads', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.locator('text=Welcome Back')).toBeVisible();
});
```

### Quick Win 2: Test With Manual Auth

```bash
# Sign in manually in the browser
# Copy cookies and create auth file manually
# Then run tests that depend on auth
```

### Quick Win 3: Increase All Timeouts

```typescript
// Temporarily set very high timeouts to see if tests eventually pass
test.setTimeout(300000); // 5 minutes
```

---

## 📊 Progress Tracking

Update this as you go:

- [ ] Phase 1: Diagnosed root cause
- [ ] Phase 2: Authentication setup fixed
- [ ] Phase 3: Test strategy adjusted (if needed)
- [ ] Phase 4: Individual tests fixed
- [ ] Phase 5: Configuration optimized

**Current Status**: All tests fail due to auth setup timeout
**Next Action**: Phase 1 - Diagnose why auth.setup.ts times out

---

## 💡 Key Insights

**Why all tests fail**:

- All smoke/critical tests depend on authentication
- Auth setup runs ONCE before all tests
- If auth setup fails, ALL tests fail
- This is actually good - fix one thing (auth), fix everything!

**Most Likely Issue**:

- Clerk taking longer than 15s to load/process
- Test credentials don't actually work in Clerk
- Middleware or redirect interfering with navigation
- Network requests not completing

**Next Session Plan**:

1. Open Playwright report: `npx playwright show-report`
2. Look at auth.setup.ts screenshot
3. Follow Phase 1 investigation steps
4. Apply appropriate fix from Phase 2
5. Re-run smoke tests
6. Celebrate when they pass! 🎉

---

**Created**: October 12, 2025
**Status**: Ready to debug when you return to E2E testing
