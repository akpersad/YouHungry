/**
 * v2 auth setup — signs in the test-squad members the Phase 3 journeys
 * need (organizer for every spec via the project storageState; member1 +
 * member2 for the 3-user vote) and saves one storage state each. The squad
 * is seeded by `npm run seed:v2-dev`; definitions live in
 * scripts/v2/test-squad.ts.
 */
import { test as setup, expect, type Browser } from '@playwright/test';
import { TEST_SQUAD, SQUAD_PASSWORD } from '../../scripts/v2/test-squad';
import { storageStateFor } from './squad-states';

async function signInAndSave(browser: Browser, role: string) {
  const member = TEST_SQUAD.find((m) => m.role === role)!;
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[name="identifier"]', { timeout: 15000 });
  await page.locator('input[name="identifier"]').first().fill(member.email);

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

  await context.storageState({ path: storageStateFor(role) });
  await context.close();
}

setup('authenticate v2 squad', async ({ browser }) => {
  // Sequential on purpose: the Clerk dev instance rate-limits under
  // parallel sign-in load (documented flake in the v1 lanes).
  for (const role of ['organizer', 'member1', 'member2']) {
    await signInAndSave(browser, role);
  }
});
