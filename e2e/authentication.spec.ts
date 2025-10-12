/**
 * E2E Tests: Registration & Authentication
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 */

import { test, expect } from '@playwright/test';
import { testUsers } from './fixtures/test-data';

test.describe('Authentication Flow', () => {
  test('New user registration', async ({ page }) => {
    await page.goto('/sign-up');

    // Wait for registration page to load
    await expect(page).toHaveURL(/sign-up/);

    // Verify benefits are displayed
    await expect(page.locator('text=Benefits')).toBeVisible();
    await expect(page.locator('text=SMS')).toBeVisible();

    // Fill in registration form (Clerk form)
    const emailInput = page
      .locator('input[name="identifier"]')
      .or(page.locator('input[type="email"]'))
      .first();
    const passwordInput = page
      .locator('input[name="password"]')
      .or(page.locator('input[type="password"]'))
      .first();

    await emailInput.fill(testUsers.user1.email);
    await passwordInput.fill(testUsers.user1.password);

    // Submit form
    await page
      .locator('button[type="submit"]')
      .or(page.locator('button:has-text("Sign up")'))
      .first()
      .click();

    // Wait for redirect to dashboard (or verification page)
    await page.waitForURL(/dashboard|verify/, { timeout: 15000 });
  });

  test('Existing user login @smoke @critical', async ({ page }) => {
    await page.goto('/sign-in');

    // Wait for sign-in page to load
    await expect(page).toHaveURL(/sign-in/);

    // Fill in login form
    const emailInput = page
      .locator('input[name="identifier"]')
      .or(page.locator('input[type="email"]'))
      .first();
    const passwordInput = page
      .locator('input[name="password"]')
      .or(page.locator('input[type="password"]'))
      .first();

    await emailInput.fill(testUsers.user1.email);
    await passwordInput.fill(testUsers.user1.password);

    // Submit form
    await page
      .locator('button[type="submit"]')
      .or(page.locator('button:has-text("Sign in")'))
      .first()
      .click();

    // Wait for dashboard
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Sign out functionality', async ({ page }) => {
    // User should already be signed in from setup
    await page.goto('/dashboard');

    // Find and click sign out button
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Sign out');

    // Wait for redirect to home
    await page.waitForURL(/\/$/, { timeout: 10000 });

    // Verify we're signed out (sign in button should be visible)
    await expect(page.locator('text=Sign in')).toBeVisible();
  });

  test('Protected route redirects to sign-in', async ({ context }) => {
    // Create new context without auth
    const page = await context.newPage();

    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to sign-in
    await page.waitForURL(/sign-in/, { timeout: 10000 });
    await expect(page).toHaveURL(/sign-in/);
  });

  test('Sign-in page has back navigation', async ({ page }) => {
    await page.goto('/sign-in');

    // Verify back button exists
    await expect(page.locator('a:has-text("Back")')).toBeVisible();

    // Click back
    await page.click('a:has-text("Back")');

    // Should return to home
    await expect(page).toHaveURL(/\/$/);
  });

  test('Sign-up page shows SMS opt-in information', async ({ page }) => {
    await page.goto('/sign-up');

    // Verify SMS benefits are explained
    await expect(page.locator('text=SMS')).toBeVisible();
    await expect(page.locator('text=notification')).toBeVisible();
  });
});
