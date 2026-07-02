/**
 * /beta shell wiring: the Fork lane home serves its own root layout,
 * publicly on a cold open and with a test-squad session attached.
 * The journeys themselves live in fork.spec.ts.
 */
import { test, expect } from '@playwright/test';

test.describe('v2 /beta shell', () => {
  test.describe('signed out (cold open)', () => {
    // Fresh context — no squad storage state.
    test.use({ storageState: { cookies: [], origins: [] } });

    test('@smoke serves the Fork lane publicly with no v1 chrome', async ({
      page,
    }) => {
      await page.goto('/beta');

      await expect(
        page.getByRole('heading', { name: 'Where are we eating?' })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Spin near me' })
      ).toBeVisible();
      // Cold open shows the way into an account, not a wall.
      await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
      // The v1 shell must not leak into the v2 root layout.
      await expect(page.locator('nav')).toHaveCount(0);
    });
  });

  test.describe('signed in as squad organizer', () => {
    test('loads /beta with an active Clerk session and shell auth state', async ({
      page,
      context,
    }) => {
      await page.goto('/beta');
      await expect(
        page.getByRole('heading', { name: 'Where are we eating?' })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Sign out' })
      ).toBeVisible();

      const cookies = await context.cookies();
      expect(
        cookies.some((cookie) => cookie.name.startsWith('__session')),
        'expected a Clerk session cookie from the v2-setup sign-in'
      ).toBe(true);
    });
  });
});
