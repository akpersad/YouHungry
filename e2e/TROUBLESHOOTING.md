# E2E Testing Troubleshooting Guide

## Quick Diagnostics

### 1. Check if environment variables are loaded

```bash
# Run this to see what Playwright sees
npm run test:e2e:debug-auth
```

This will:

- Open the browser in headed mode
- Pause at the first step
- Let you see what's happening

### 2. Test without authentication

```bash
# Run tests that don't require login
npm run test:e2e:no-auth
```

### 3. View the failure report

The test generated a screenshot and video. Check them in the HTML report:

```bash
npx playwright show-report
```

Look at:

- Screenshot: `test-results/auth.setup.ts-authenticate-setup/test-failed-1.png`
- Video: `test-results/auth.setup.ts-authenticate-setup/video.webm`

## Common Errors

### Error: "TimeoutError: page.waitForURL: Timeout 15000ms exceeded"

**This means the login didn't redirect to dashboard.**

**Possible causes:**

1. **Test user doesn't exist in Clerk**
   - Check: Go to Clerk Dashboard → Users
   - Solution: Create the test user manually

2. **Wrong credentials**
   - Check: `.env.local` has correct email/password
   - Check: Email matches exactly (case-sensitive!)
   - Solution: Copy-paste credentials directly from Clerk

3. **Email not verified**
   - Check: In Clerk Dashboard, user should show "Verified"
   - Solution: Verify the email in Clerk Dashboard

4. **Wrong Clerk selectors**
   - Check: Open the HTML report and look at the screenshot
   - Solution: Update selectors in `e2e/auth.setup.ts`

5. **Environment variables not loading**
   - Check: Run `echo $E2E_TEST_USER_EMAIL` in terminal
   - Solution: Make sure `.env.local` is in project root

## Debug Steps

### Step 1: Verify your .env.local file

File location: `/Users/apersad/Documents/Development/PersonalProjects/you-hungry/.env.local`

Should contain:

```bash
E2E_TEST_USER_EMAIL=your-actual-email@example.com
E2E_TEST_USER_PASSWORD=YourActualPassword123!
```

### Step 2: Test manually

1. Open http://localhost:3000/sign-in in your browser
2. Enter the exact email from `.env.local`
3. Enter the exact password from `.env.local`
4. Click Sign In
5. **Does it work?**
   - ✅ Yes → Problem is in the E2E test selectors
   - ❌ No → Problem is with Clerk setup

### Step 3: Check the screenshot

```bash
npx playwright show-report
```

Click on the failed test and look at the screenshot. What do you see?

**If you see:**

- ❌ Error message → Wrong credentials or user doesn't exist
- ❌ Sign-in form still visible → Login button didn't click or credentials didn't fill
- ❌ Verification screen → User email is not verified in Clerk
- ❌ Other page → Check the URL in the screenshot

### Step 4: Run in headed mode with debug

```bash
npm run test:e2e:debug-auth
```

This opens the browser so you can watch what happens. Use the Playwright Inspector to:

- See each step
- Check if fields are filled correctly
- See if buttons are clicked
- Watch where the navigation goes

## Fixing Clerk Selectors

If Clerk's UI has changed, update `e2e/auth.setup.ts`:

```typescript
// Current selectors
const emailInput = page
  .locator('input[name="identifier"]')
  .or(page.locator('input[type="email"]'))
  .first();

// If that doesn't work, try:
const emailInput = page.locator('input[type="email"]').first();
// or
const emailInput = page.locator('#email-field');
```

**To find the right selector:**

1. Run with debug mode: `npm run test:e2e:debug-auth`
2. Right-click on the input field in the browser
3. Inspect Element
4. Copy the `name`, `id`, or `type` attribute
5. Update `auth.setup.ts`

## Alternative: Skip Authentication for Now

If you want to test the framework without dealing with auth:

1. **Test public pages only:**

   ```bash
   npm run test:e2e:no-auth
   ```

2. **Comment out the setup dependency** in `playwright.config.ts`:

   ```typescript
   projects: [
     // {
     //   name: 'setup',
     //   testMatch: /.*\.setup\.ts/,
     // },
     {
       name: 'chromium',
       use: {
         ...devices['Desktop Chrome'],
         // storageState: 'playwright/.auth/user.json', // Comment this out
       },
       // dependencies: ['setup'], // Comment this out
     },
   ];
   ```

3. **Test pages that don't require auth:**
   - Home page
   - Sign-in page (just the display, not actual sign-in)
   - Sign-up page
   - Accessibility tests on public pages

## Still Stuck?

Share this information:

1. **Screenshot from the report**
   - Path: `test-results/auth.setup.ts-authenticate-setup/test-failed-1.png`

2. **Your .env.local setup** (hide actual password!)

   ```
   E2E_TEST_USER_EMAIL=my-test-user@example.com
   E2E_TEST_USER_PASSWORD=*********
   ```

3. **What you see in Clerk Dashboard**
   - Does the user exist?
   - Is email verified?
   - Can you sign in manually with these credentials?

4. **Output from:**
   ```bash
   npm run test:e2e:debug-auth
   ```
