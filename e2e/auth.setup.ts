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

  // Wait for the email input to be visible (this means Clerk loaded)
  await page.waitForSelector('input[name="identifier"]', { timeout: 15000 });

  // Fill in credentials
  await page
    .locator('input[name="identifier"]')
    .first()
    .fill(testUsers.user1.email);
  await page
    .locator('input[name="password"]')
    .first()
    .fill(testUsers.user1.password);

  // Click Continue button and wait for navigation
  await Promise.all([
    page.waitForURL(/dashboard/, { timeout: 30000 }),
    page.locator('button:has-text("Continue")').first().click(),
  ]);

  // Verify we're signed in
  await expect(page).toHaveURL(/dashboard/);

  // Save signed-in state
  await page.context().storageState({ path: authFile });
});

setup.describe.configure({ mode: 'serial' });
