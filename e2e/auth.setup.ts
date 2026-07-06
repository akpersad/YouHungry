/**
 * Auth setup — signs in the test-squad members the journeys need
 * (organizer for every spec via the project storageState; member1 +
 * member2 for the 3-user vote) and saves one storage state each. The
 * squad is seeded by `npm run seed:v2-dev`; definitions live in
 * scripts/v2/test-squad.ts.
 */
import { test as setup, expect, type Browser } from '@playwright/test';
import { TEST_SQUAD, SQUAD_PASSWORD } from '../scripts/v2/test-squad';
import { storageStateFor } from './squad-states';

async function signInAndSave(browser: Browser, role: string) {
  const member = TEST_SQUAD.find((m) => m.role === role)!;
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email or username').fill(member.email);
  await page.getByLabel('Password').fill(SQUAD_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // The form lands on the fork lane home (safeNextPath default).
  await page.waitForURL('/', { timeout: 30000 });
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

  await context.storageState({ path: storageStateFor(role) });
  await context.close();
}

setup('authenticate squad', async ({ browser }) => {
  // Sequential on purpose: the Clerk dev instance rate-limits under
  // parallel sign-in load.
  for (const role of ['organizer', 'member1', 'member2']) {
    await signInAndSave(browser, role);
  }
});
