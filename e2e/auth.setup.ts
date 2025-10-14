/**
 * Authentication Setup for E2E Tests
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 *
 * This setup file runs once before all tests to authenticate a test user
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { testUsers } from './fixtures/test-data';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Note: This assumes Clerk test environment is configured
  // In production, we'd need to set up test users in Clerk test environment

  await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });

  // Step 1: Wait for the email input to be visible (this means Clerk loaded)
  await page.waitForSelector('input[name="identifier"]', { timeout: 15000 });

  // Step 2: Fill in email
  await page
    .locator('input[name="identifier"]')
    .first()
    .fill(testUsers.user1.email);

  // Step 3: Click Continue to proceed to password step (if needed)
  // Check if password field is already visible or if we need to proceed
  const passwordVisible = await page
    .locator('input[name="password"]')
    .isVisible()
    .catch(() => false);

  if (!passwordVisible) {
    // Password field not visible yet, need to click Continue first
    await page.locator('button:has-text("Continue")').first().click();
    // Wait for password field to appear
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
  }

  // Step 4: Fill in password
  await page
    .locator('input[name="password"]')
    .first()
    .fill(testUsers.user1.password);

  // Step 5: Submit the form and wait for navigation to dashboard
  // Click the Continue button after password is filled
  const continueButton = page.locator('button:has-text("Continue")').first();
  await continueButton.click();

  // Wait for navigation to dashboard
  await page.waitForURL(/dashboard/, { timeout: 30000 });

  // Verify we're signed in
  await expect(page).toHaveURL(/dashboard/);

  // Save signed-in state
  await page.context().storageState({ path: authFile });
});

setup.describe.configure({ mode: 'serial' });
