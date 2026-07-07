/**
 * The account lane: profile + the notification switches, plus the
 * unsubscribe landing. Runs as the organizer (default storage state).
 *
 * Deliberately does NOT rename the organizer: crew suggestion names and
 * shared-board copy derive from squad first names, and specs run in
 * parallel workers against the same seeded users. The rename path is
 * pinned by unit tests (account.test.ts) instead.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { gotoResilient } from './clerk-resilience';

test.describe('account page', () => {
  test('@smoke shows profile details and gates the save honestly', async ({
    page,
  }) => {
    await gotoResilient(page, '/account');
    await expect(
      page.getByRole('heading', { name: 'Your details, your call' })
    ).toBeVisible();

    // Email on file, name prefilled, nothing to save until it changes.
    await expect(page.getByText('@', { exact: false }).first()).toBeVisible();
    const nameInput = page.getByLabel('First name');
    await expect(nameInput).not.toHaveValue('');
    await expect(
      page.getByRole('button', { name: 'Save name' })
    ).toBeDisabled();

    // Collapsed sensitive flows: buttons, not always-open forms.
    await expect(
      page.getByRole('button', { name: 'Change email' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Change password' })
    ).toBeVisible();

    // The device push block always renders an honest state.
    await expect(
      page.getByRole('heading', { name: 'Push on this device' })
    ).toBeVisible();
  });

  test('notification switches persist across a reload', async ({ page }) => {
    const email = page.getByRole('switch', { name: 'Email results' });
    // The switch flips optimistically before the PATCH resolves, so a
    // reload straight after the click races the server write. Gate every
    // flip on the preferences response landing (and being a real save).
    const flip = async () => {
      const saved = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v2/account/preferences') &&
          response.request().method() === 'PATCH'
      );
      await email.click();
      expect((await saved).ok()).toBe(true);
    };

    await gotoResilient(page, '/account');
    // A failed earlier attempt can leave the seeded organizer switched
    // off; normalize instead of asserting the state a retry inherits.
    if ((await email.getAttribute('aria-checked')) === 'false') {
      await flip();
    }
    await expect(email).toHaveAttribute('aria-checked', 'true');

    await flip();
    await expect(email).toHaveAttribute('aria-checked', 'false');

    await page.reload();
    await expect(email).toHaveAttribute('aria-checked', 'false');

    // Restore: the seeded organizer keeps notifications on for other specs.
    await flip();
    await expect(email).toHaveAttribute('aria-checked', 'true');
  });

  for (const mode of ['light', 'dark'] as const) {
    test(`passes axe (WCAG 2.x AA) in ${mode} mode`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await gotoResilient(page, '/account');
      await expect(
        page.getByRole('heading', { name: 'Your details, your call' })
      ).toBeVisible();
      await page
        .getByRole('group', { name: 'Color mode' })
        .getByRole('button', { name: mode === 'dark' ? 'Dark' : 'Light' })
        .click();
      await expect(page.locator('html')).toHaveClass(new RegExp(mode));

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe('account gate and unsubscribe (signed out)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('signed-out /account round-trips through sign-in with next', async ({
    page,
  }) => {
    await gotoResilient(page, '/account');
    await expect(page).toHaveURL(/\/sign-in\?next=%2Faccount/);
  });

  test('sign-in offers the password reset path', async ({ page }) => {
    await gotoResilient(page, '/sign-in');
    await page.getByRole('button', { name: 'Forgot your password?' }).click();
    await expect(
      page.getByRole('heading', { name: 'Reset your password' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Back to sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('a bad unsubscribe link says so and points at the account', async ({
    page,
  }) => {
    await gotoResilient(page, '/unsubscribe?token=not-a-real-token');
    await expect(
      page.getByRole('heading', { name: 'That link did not work' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Open account settings' })
    ).toBeVisible();
  });
});
