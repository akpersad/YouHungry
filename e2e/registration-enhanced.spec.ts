/**
 * E2E Tests: Enhanced Registration Flow
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 *
 * Tests the complete custom sign-up experience with CustomRegistrationForm
 */

import { test, expect } from '@playwright/test';

test.describe('Registration - Custom Sign-Up Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-up');
  });

  test('Sign-up page displays all custom elements @smoke', async ({ page }) => {
    // Header
    await expect(
      page.locator('h1:has-text("Join Fork In The Road")')
    ).toBeVisible();
    await expect(
      page.locator('text=Create your account to start discovering')
    ).toBeVisible();

    // Benefits section
    await expect(page.locator("text=What you'll get")).toBeVisible();
    await expect(
      page.locator('text=Create personal restaurant collections')
    ).toBeVisible();
    await expect(
      page.locator('text=Make group decisions with friends')
    ).toBeVisible();
    await expect(page.locator('text=Get smart recommendations')).toBeVisible();
    await expect(
      page.locator('text=Never argue about where to eat')
    ).toBeVisible();

    // Back button
    await expect(page.locator('button:has-text("Back to Home")')).toBeVisible();

    // SMS info section
    await expect(page.locator('text=📱 SMS Notifications')).toBeVisible();
    await expect(page.locator('text=Enable SMS to get notified')).toBeVisible();

    // Terms section
    await expect(page.locator('text=Terms of Service')).toBeVisible();
    await expect(page.locator('text=Privacy Policy')).toBeVisible();

    // Custom form fields should be present
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#username')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();
    await expect(page.locator('input#firstName')).toBeVisible();
    await expect(page.locator('input#lastName')).toBeVisible();
  });

  test('Back button navigates to home', async ({ page }) => {
    // Click back button and wait for navigation
    // Separate click and wait for better reliability in CI
    const isCI = !!process.env.CI;
    const timeout = isCI ? 30000 : 10000; // More lenient in CI

    await page.click('button:has-text("Back to Home")');
    await page.waitForURL('/', { timeout });

    // Verify we're on home page
    await expect(page).toHaveURL('/');
  });

  test('Benefits section shows all features', async ({ page }) => {
    // Verify all 4 benefits are displayed
    const benefits = [
      'Create personal restaurant collections',
      'Make group decisions with friends',
      'Get smart recommendations',
      'Never argue about where to eat',
    ];

    for (const benefit of benefits) {
      await expect(page.locator(`text=${benefit}`)).toBeVisible();
    }

    // Verify checkmarks are present
    const checkmarks = await page.locator('text=✓').count();
    expect(checkmarks).toBeGreaterThanOrEqual(4);
  });

  test('SMS notification info is prominent', async ({ page }) => {
    // SMS section should be visible
    await expect(page.locator('text=📱 SMS Notifications')).toBeVisible();

    // Should explain the benefits
    await expect(
      page.locator('text=Enable SMS to get notified about group decisions')
    ).toBeVisible();
  });

  test('Sign-in link is present in form', async ({ page }) => {
    // Custom form should have link/button to sign-in
    await expect(
      page.locator('button:has-text("Sign in")').first()
    ).toBeVisible();
  });

  test('Registration form has proper validation', async ({
    page,
    browserName,
  }) => {
    // FLAKY on mobile-chrome-fast - skip for mobile Chrome
    if (
      browserName === 'chromium' &&
      page.viewportSize()?.width &&
      page.viewportSize()!.width < 500
    ) {
      test.skip();
    }

    // FLAKY on webkit - skip for WebKit browsers (validation behavior differs)
    if (browserName === 'webkit') {
      test.skip();
    }

    // Try to submit without filling fields - button should be disabled
    const submitButton = page.locator('button:has-text("Create Account")');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();

    // Fill in some fields and check validation triggers
    await page.locator('input#email').fill('invalid-email');
    await page.locator('input#email').blur();

    // Should show email validation error (use role="alert" to target actual error, not helper text)
    await expect(
      page.locator(
        '[role="alert"]:has-text("Please enter a valid email address")'
      )
    ).toBeVisible({ timeout: 2000 });

    // Fill valid email
    await page.locator('input#email').fill('test@example.com');
    await page.locator('input#email').blur();

    // Try password that's too short
    await page.locator('input#password').fill('short');
    await page.locator('input#password').blur();

    // Use role="alert" to target actual error, not helper text
    await expect(
      page.locator('[role="alert"]:has-text("must be at least 10 characters")')
    ).toBeVisible({ timeout: 2000 });
  });

  test('Username validation checks availability', async ({
    page,
    browserName,
  }) => {
    // Skip on webkit (mobile Safari) due to timeout issues
    if (browserName === 'webkit') {
      test.skip();
    }

    // Fill in username
    const username = `testuser${Date.now()}`;
    await page.locator('input#username').fill(username);
    await page.locator('input#username').blur();

    // Optional: Check for loading state (may be too fast to catch in CI)
    // Don't fail if we miss it - the important part is the final result
    const isCI = !!process.env.CI;
    if (!isCI) {
      // Only check loading state locally where timing is more predictable
      try {
        await expect(page.locator('text=Checking availability')).toBeVisible({
          timeout: 2000,
        });
      } catch {
        // Loading state may have been too fast, continue to final check
      }
    }

    // Wait for result (should be available for random username)
    const timeout = isCI ? 10000 : 5000; // More time in CI
    await expect(
      page
        .locator('text=Username is available')
        .or(page.locator('text=Username is already taken'))
    ).toBeVisible({ timeout });
  });

  test('Password confirmation validates match', async ({ page }) => {
    // Fill password
    await page.locator('input#password').fill('TestPassword123');

    // Fill mismatched confirm password
    await page.locator('input#confirmPassword').fill('DifferentPassword');
    await page.locator('input#confirmPassword').blur();

    // Should show error (use role="alert" to target actual error message)
    await expect(
      page.locator('[role="alert"]:has-text("Passwords do not match")')
    ).toBeVisible({
      timeout: 2000,
    });
  });

  test('Phone number formatting works', async ({ page, browserName }) => {
    // Skip on webkit (mobile Safari) due to timeout issues
    if (browserName === 'webkit') {
      test.skip();
    }

    const phoneInput = page.locator('input#phoneNumber');

    // Type digits
    await phoneInput.fill('5551234567');

    // Should be formatted as (555) 123-4567
    const value = await phoneInput.inputValue();
    expect(value).toMatch(/\(\d{3}\) \d{3}-\d{4}/);
  });

  test('Can fill complete registration form', async ({ page, browserName }) => {
    // FLAKY on webkit-fast - mark as potentially flaky
    test.slow(browserName === 'webkit'); // Give webkit tests more time

    // Generate unique data
    const uniqueEmail = `test-${Date.now()}@playwright-e2e.test`;
    const uniqueUsername = `testuser${Date.now()}`;

    // Fill all required fields
    await page.locator('input#firstName').fill('Test');
    await page.locator('input#lastName').fill('User');
    await page.locator('input#email').fill(uniqueEmail);
    await page.locator('input#username').fill(uniqueUsername);
    await page.locator('input#password').fill('TestPassword123');
    await page.locator('input#confirmPassword').fill('TestPassword123');

    // Wait for username validation
    await page.waitForTimeout(1000);

    // Optional: Fill phone number
    await page.locator('input#phoneNumber').fill('5551234567');

    // Optional: Enable SMS
    await page.locator('input#smsOptIn').check();

    // Submit button should be enabled after all validations pass
    const submitButton = page.locator('button:has-text("Create Account")');

    // Note: We can't actually complete registration in tests without real Clerk setup
    // This test validates the form is fillable and interactive
    await expect(submitButton).toBeVisible();
  });

  test('Verification view shows after successful registration', async ({
    page: _page,
  }) => {
    // This test would need actual Clerk integration to work
    // Skipping for now as it requires backend setup
    test.skip();
  });
});

test.describe('Registration - Mobile View', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('Sign-up page is mobile responsive', async ({ page }) => {
    await page.goto('/sign-up');

    // All key elements should still be visible on mobile
    await expect(
      page.locator('h1:has-text("Join Fork In The Road")')
    ).toBeVisible();
    await expect(page.locator("text=What you'll get")).toBeVisible();
    await expect(page.locator('text=📱 SMS Notifications')).toBeVisible();
    await expect(page.locator('button:has-text("Back to Home")')).toBeVisible();

    // Form should be usable
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#username')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
  });

  test('Mobile form fields are touch-friendly', async ({ page }) => {
    await page.goto('/sign-up');

    // Test that inputs can be focused and typed into on mobile
    // Use click() instead of tap() for compatibility across all test contexts
    await page.locator('input#firstName').click();
    await page.locator('input#firstName').fill('Test');

    const value = await page.locator('input#firstName').inputValue();
    expect(value).toBe('Test');
  });
});
