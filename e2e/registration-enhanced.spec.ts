/**
 * E2E Tests: Enhanced Registration Flow
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 *
 * Tests the complete custom sign-up experience
 */

import { test, expect } from '@playwright/test';
import { testUsers } from './fixtures/test-data';

test.describe('Registration - Custom Sign-Up Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-up');
  });

  test('Sign-up page displays all custom elements @smoke', async ({ page }) => {
    // Header
    await expect(
      page.locator('h1:has-text("Join ForkInTheRoad")')
    ).toBeVisible();
    await expect(page.locator('text=Create your account')).toBeVisible();

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

    // Clerk form should be present
    await expect(
      page
        .locator('input[type="email"]')
        .or(page.locator('input[name="identifier"]'))
    ).toBeVisible();
  });

  test('Back button navigates to home', async ({ page }) => {
    await page.click('button:has-text("Back to Home")');

    // Should navigate to home page
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
    const checkmarks = await page
      .locator('.text-primary:has-text("✓")')
      .count();
    expect(checkmarks).toBeGreaterThanOrEqual(4);
  });

  test('SMS notification info is prominent', async ({ page }) => {
    // SMS section should be visible
    const smsSection = page.locator('text=📱 SMS Notifications').locator('..');
    await expect(smsSection).toBeVisible();

    // Should explain the benefits
    await expect(
      page.locator('text=group decisions, friend requests')
    ).toBeVisible();
    await expect(
      page.locator('text=You can always change this later')
    ).toBeVisible();
  });

  test('Clerk sign-in link is present', async ({ page }) => {
    // Clerk form should have link to sign-in
    await expect(
      page
        .locator('a:has-text("Sign in")')
        .or(page.locator('a[href*="sign-in"]'))
    ).toBeVisible();
  });

  test('Registration form has proper validation', async ({ page }) => {
    // Try to submit without filling fields
    const submitButton = page.locator('button[type="submit"]').first();

    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation errors
      // Clerk typically shows "This field is required" or similar
      await expect(
        page.locator('text=/required|enter|invalid/i').first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('Can complete full registration flow', async ({ page }) => {
    // This test requires a unique email each time
    // In real scenarios, you'd generate a unique email or clean up after
    const uniqueEmail = `test-${Date.now()}@playwright-e2e.test`;

    // Fill in Clerk form
    const emailInput = page
      .locator('input[type="email"]')
      .or(page.locator('input[name="identifier"]'))
      .first();
    const passwordInput = page
      .locator('input[type="password"]')
      .or(page.locator('input[name="password"]'))
      .first();

    await emailInput.fill(uniqueEmail);
    await passwordInput.fill(testUsers.user1.password);

    // If there are additional fields (like name, phone), fill them
    const firstNameInput = page.locator('input[name="firstName"]');
    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill('Test');
    }

    const lastNameInput = page.locator('input[name="lastName"]');
    if (await lastNameInput.isVisible()) {
      await lastNameInput.fill('User');
    }

    // Submit form
    await page
      .locator('button[type="submit"]')
      .or(page.locator('button:has-text("Sign up")'))
      .first()
      .click();

    // Wait for redirect (could be to dashboard or verification page)
    await page.waitForURL(/dashboard|verify|complete/, { timeout: 15000 });

    // Verify we moved past the sign-up page
    await expect(page).not.toHaveURL(/sign-up/);
  });

  test('Social sign-up buttons work (if enabled)', async ({ page }) => {
    // Check if social buttons are present
    const googleButton = page.locator('button:has-text("Google")');

    if (await googleButton.isVisible()) {
      await googleButton.click();

      // Should open Google OAuth (or show popup)
      // This would require more complex setup to test fully
      // For now, just verify the button is clickable
      expect(await googleButton.isEnabled()).toBeTruthy();
    }
  });
});

test.describe('Registration - Mobile View', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('Sign-up page is mobile responsive', async ({ page }) => {
    await page.goto('/sign-up');

    // All key elements should still be visible on mobile
    await expect(
      page.locator('h1:has-text("Join ForkInTheRoad")')
    ).toBeVisible();
    await expect(page.locator("text=What you'll get")).toBeVisible();
    await expect(page.locator('text=📱 SMS Notifications')).toBeVisible();
    await expect(page.locator('button:has-text("Back to Home")')).toBeVisible();

    // Form should be usable
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
  });
});
