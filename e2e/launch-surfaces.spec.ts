/**
 * Phase 8 launch surfaces: the privacy page, the offline fallback page,
 * the PWA wiring (manifest + service worker file), and the in-context
 * install prompt journey. All signed-out — every one of these surfaces is
 * public by design.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { gotoResilient } from './clerk-resilience';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('PWA wiring', () => {
  test('@smoke manifest is linked and resolves with the v2 identity', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    const href = await page
      .locator('link[rel="manifest"]')
      .getAttribute('href');
    expect(href).toBeTruthy();

    const manifest = await (await request.get(href!)).json();
    expect(manifest.name).toBe('Fork In The Road');
    expect(manifest.display).toBe('standalone');
    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    // Maskable is its own entry, never fused with "any" (safe-zone art
    // differs from the full-bleed art).
    for (const icon of manifest.icons) {
      expect(['any', 'maskable']).toContain(icon.purpose);
    }
  });

  test('service worker file is served at the v1-takeover URL', async ({
    request,
  }) => {
    const response = await request.get('/sw.js');
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('fitr-static-');
  });

  test('icons referenced by the manifest actually exist', async ({
    request,
  }) => {
    const manifest = await (await request.get('/manifest.json')).json();
    for (const icon of manifest.icons) {
      const response = await request.get(icon.src);
      expect(response.status(), `${icon.src} should exist`).toBe(200);
      expect(response.headers()['content-type']).toContain('image/png');
    }
  });
});

test.describe('privacy and offline pages pass axe (WCAG 2.x AA), both modes', () => {
  for (const surface of [
    { path: '/privacy', heading: 'Privacy' },
    { path: '/offline', heading: "You're offline" },
  ]) {
    for (const mode of ['light', 'dark'] as const) {
      test(`${surface.path} in ${mode} mode`, async ({ page }) => {
        // Collapse color transitions so the scan never reads a half-flipped
        // theme (v1 axe-lane precedent).
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await gotoResilient(page, surface.path);
        await expect(
          page.getByRole('heading', { name: surface.heading })
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
  }
});

test.describe('install prompt', () => {
  test('hides on a first visit, offers in context on a return visit, and stays dismissed', async ({
    page,
  }) => {
    // First visit: nothing, even though the browser offered install.
    await gotoResilient(page, '/');
    await page.evaluate(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });
    await expect(page.getByText('Keep it one tap away')).toBeHidden();

    // Return visit (new session): the browser's install offer surfaces as
    // the quiet home-lane section.
    await page.evaluate(() =>
      sessionStorage.removeItem('fitr-v2-visit-counted')
    );
    await gotoResilient(page, '/');
    await page.evaluate(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });
    await expect(page.getByText('Keep it one tap away')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Add to home screen' })
    ).toBeVisible();

    // The section is part of the page, so it must scan clean too.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);

    // "No thanks" is permanent: survives reload and a re-offer.
    await page.getByRole('button', { name: 'No thanks' }).click();
    await expect(page.getByText('Keep it one tap away')).toBeHidden();
    await gotoResilient(page, '/');
    await page.evaluate(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });
    await expect(page.getByText('Keep it one tap away')).toBeHidden();
  });
});
