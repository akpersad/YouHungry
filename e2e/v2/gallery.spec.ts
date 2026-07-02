/**
 * Phase 2 gate coverage: /beta/gallery renders the full identity — every
 * primitive, the reveal, both modes — and passes an axe WCAG 2.x AA scan in
 * each. Runs signed-out: the gallery is public by design (the owner reviews
 * it on a phone without ceremony).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('v2 /beta/gallery', () => {
  test('@smoke shows the identity and the reveal locks gold', async ({
    page,
  }) => {
    await page.goto('/beta/gallery');

    await expect(
      page.getByRole('heading', { name: "Tonight's board" })
    ).toBeVisible();

    // "We're going here." also lives in the Voice section — scope to the
    // reveal's own section to stay strict-mode clean.
    const reveal = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'The reveal' }) });

    // The reveal starts on load and locks by itself in ~2.1s — don't race
    // it, just wait for the result.
    await expect(reveal.getByText("We're going here.")).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      reveal.getByText('Golden Duck', { exact: true })
    ).toBeVisible();

    // Spin again restarts the theater; the skip control appears and works.
    await page.getByRole('button', { name: 'Spin again' }).click();
    const skip = page.getByRole('button', { name: 'Skip to the result' });
    await expect(skip).toBeVisible();
    await skip.click();
    await expect(reveal.getByText("We're going here.")).toBeVisible();
  });

  test('reduced motion goes straight to the result', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/beta/gallery');
    const reveal = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'The reveal' }) });
    await expect(reveal.getByText("We're going here.")).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Skip to the result' })
    ).toHaveCount(0);
  });

  test('dialog and sheet open and close on the platform affordances', async ({
    page,
  }) => {
    await page.goto('/beta/gallery');

    await page.getByRole('button', { name: 'Open dialog' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete this list?' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    await page.getByRole('button', { name: 'Open sheet' }).click();
    const sheet = page.getByRole('dialog', { name: 'Pick a vibe' });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Cheap eats' }).click();
    await expect(sheet).not.toBeVisible();
  });

  for (const mode of ['light', 'dark'] as const) {
    test(`axe scan passes in ${mode} mode`, async ({ page }) => {
      await page.goto('/beta/gallery');
      // Let the reveal settle so the scan sees the locked result state.
      await expect(page.getByText("We're going here.")).toBeVisible({
        timeout: 5_000,
      });
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
