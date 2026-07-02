/**
 * Phase 1 wiring proof for the v2 tree: /beta serves its own root layout,
 * publicly on a cold open and with a test-squad session attached.
 * Real journey specs arrive with the Fork lane in Phase 3.
 */
import { test, expect } from '@playwright/test';

test.describe('v2 /beta scaffold', () => {
  test.describe('signed out (cold open)', () => {
    // Fresh context — no squad storage state.
    test.use({ storageState: { cookies: [], origins: [] } });

    test('@smoke serves the v2 tree publicly with no v1 chrome', async ({
      page,
    }) => {
      await page.goto('/beta');

      await expect(
        page.getByRole('heading', { name: 'v2 beta' })
      ).toBeVisible();
      // The v1 shell must not leak into the v2 root layout.
      await expect(page.locator('nav')).toHaveCount(0);
    });
  });

  test.describe('signed in as squad organizer', () => {
    test('loads /beta with an active Clerk session', async ({
      page,
      context,
    }) => {
      await page.goto('/beta');
      await expect(
        page.getByRole('heading', { name: 'v2 beta' })
      ).toBeVisible();

      const cookies = await context.cookies();
      expect(
        cookies.some((cookie) => cookie.name.startsWith('__session')),
        'expected a Clerk session cookie from the v2-setup sign-in'
      ).toBe(true);
    });
  });
});
