/**
 * v2 auth setup — signs in the test-squad organizer (seeded by
 * `npm run seed:v2-dev`) once and saves storage state for the v2-beta
 * project. The squad definition lives in scripts/v2/test-squad.ts.
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { TEST_SQUAD, SQUAD_PASSWORD } from '../../scripts/v2/test-squad';

const authFile = path.join(
  __dirname,
  '../../playwright/.auth/v2-organizer.json'
);

setup('authenticate v2 organizer', async ({ page }) => {
  const organizer = TEST_SQUAD.find((member) => member.role === 'organizer')!;

  await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[name="identifier"]', { timeout: 15000 });
  await page.locator('input[name="identifier"]').first().fill(organizer.email);

  const passwordVisible = await page
    .locator('input[name="password"]')
    .isVisible()
    .catch(() => false);
  if (!passwordVisible) {
    await page.locator('button:has-text("Continue")').first().click();
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
  }

  await page.locator('input[name="password"]').first().fill(SQUAD_PASSWORD);
  await page.locator('button:has-text("Continue")').first().click();

  // v1's sign-in redirects to its dashboard; the session is app-wide and
  // valid for /beta too.
  await page.waitForURL(/dashboard/, { timeout: 30000 });
  await expect(page).toHaveURL(/dashboard/);

  await page.context().storageState({ path: authFile });
});
