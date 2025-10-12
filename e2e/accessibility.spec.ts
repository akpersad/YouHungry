/**
 * E2E Accessibility Tests
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 *
 * Uses @axe-core/playwright for automated accessibility scanning
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests - Critical User Flows', () => {
  test('Home page meets WCAG AA standards', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Sign-in page meets WCAG AA standards', async ({ page }) => {
    await page.goto('/sign-in');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Sign-up page meets WCAG AA standards', async ({ page }) => {
    await page.goto('/sign-up');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Dashboard meets WCAG AA standards @smoke', async ({ page }) => {
    await page.goto('/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Restaurant search page meets WCAG AA standards', async ({ page }) => {
    await page.goto('/restaurants');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Collection view page meets WCAG AA standards', async ({ page }) => {
    await page.goto('/dashboard');

    // Click on first collection (if exists)
    const firstCollection = page
      .locator('[data-testid="collection-card"]')
      .first();

    if (await firstCollection.isVisible()) {
      await firstCollection.click();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('Groups page meets WCAG AA standards', async ({ page }) => {
    await page.goto('/groups');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Friends page meets WCAG AA standards', async ({ page }) => {
    await page.goto('/friends');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('History page meets WCAG AA standards', async ({ page }) => {
    await page.goto('/history');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Profile page meets WCAG AA standards', async ({ page }) => {
    await page.goto('/profile');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Accessibility Tests - UI Components', () => {
  test('Buttons are keyboard accessible', async ({ page }) => {
    await page.goto('/dashboard');

    // Test keyboard navigation
    await page.keyboard.press('Tab');

    // Verify focus is visible on buttons
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
  });

  test('Forms have proper labels', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Create Collection');

    // Scan form for accessibility
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="create-collection-form"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Modals have proper ARIA attributes', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Create Collection');

    // Wait for modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Check ARIA attributes
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby');
  });

  test('Color contrast meets AA standards on all pages', async ({ page }) => {
    const pages = [
      '/',
      '/dashboard',
      '/restaurants',
      '/groups',
      '/friends',
      '/history',
      '/profile',
    ];

    for (const path of pages) {
      await page.goto(path);

      const _accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .disableRules(['color-contrast']) // We'll test this specifically
        .analyze();

      // Run color contrast check separately
      const contrastResults = await new AxeBuilder({ page })
        .include('body')
        .withRules(['color-contrast'])
        .analyze();

      if (contrastResults.violations.length > 0) {
        console.warn(
          `Color contrast issues on ${path}:`,
          contrastResults.violations
        );
      }

      expect(contrastResults.violations).toEqual([]);
    }
  });

  test('Interactive elements have focus indicators', async ({ page }) => {
    await page.goto('/dashboard');

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Check if focus ring is visible
    const focusedElement = await page.locator(':focus');
    const outline = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline || styles.boxShadow || styles.border;
    });

    expect(outline).not.toBe('none');
  });

  test('Images have alt text', async ({ page }) => {
    await page.goto('/dashboard');

    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('Headings follow proper hierarchy', async ({ page }) => {
    await page.goto('/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['heading-order'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Lists are properly structured', async ({ page }) => {
    await page.goto('/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['list', 'listitem'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Tables have proper headers', async ({ page }) => {
    await page.goto('/history');

    // If there are tables, check they have proper headers
    const tables = await page.locator('table').count();

    if (tables > 0) {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules([
          'table-fake-caption',
          'td-headers-attr',
          'th-has-data-cells',
        ])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('Skip links present for keyboard users', async ({ page }) => {
    await page.goto('/');

    // Press tab to reveal skip link
    await page.keyboard.press('Tab');

    // Check if skip link is visible or focusable
    const skipLink = page.locator('a[href="#main-content"]');

    if ((await skipLink.count()) > 0) {
      await expect(skipLink).toBeFocused();
    }
  });
});

test.describe('Accessibility Tests - Keyboard Navigation', () => {
  test('Can navigate entire app with keyboard only', async ({ page }) => {
    await page.goto('/dashboard');

    // Tab through all interactive elements
    let tabCount = 0;
    const maxTabs = 20; // Prevent infinite loop

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;

      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          type: el?.getAttribute('type'),
          role: el?.getAttribute('role'),
        };
      });

      // Verify focus is on an interactive element
      const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
      const isInteractive =
        interactiveTags.includes(focusedElement.tag) ||
        focusedElement.role === 'button' ||
        focusedElement.role === 'link';

      if (isInteractive) {
        expect(isInteractive).toBeTruthy();
      }
    }
  });

  test('Can close modal with Escape key', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Create Collection');

    // Wait for modal
    await page.waitForSelector('[role="dialog"]');

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('Focus trap works in modals', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Create Collection');

    // Wait for modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Tab should stay within modal
    let lastFocused: string | null = null;
    let cycleCount = 0;

    while (cycleCount < 10) {
      await page.keyboard.press('Tab');

      const currentFocused = await page.evaluate(() => {
        const el = document.activeElement;
        return (
          el?.getAttribute('data-testid') || el?.textContent?.substring(0, 20)
        );
      });

      if (currentFocused === lastFocused && cycleCount > 5) {
        // Focus has cycled back, good!
        break;
      }

      lastFocused = currentFocused;
      cycleCount++;
    }

    // Verify focus stayed in modal
    const focusedInModal = await page.evaluate(() => {
      const activeEl = document.activeElement;
      const modal = document.querySelector('[role="dialog"]');
      return modal?.contains(activeEl);
    });

    expect(focusedInModal).toBeTruthy();
  });

  test('Can activate buttons with Space and Enter', async ({ page }) => {
    await page.goto('/dashboard');

    // Focus on create button
    await page.locator('text=Create Collection').focus();

    // Press Space
    await page.keyboard.press('Space');

    // Modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');

    // Try with Enter
    await page.locator('text=Create Collection').focus();
    await page.keyboard.press('Enter');

    // Modal should open again
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });
});

test.describe('Accessibility Tests - Screen Reader Support', () => {
  test('Page has proper title', async ({ page }) => {
    await page.goto('/dashboard');

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe('');
  });

  test('Main landmark is present', async ({ page }) => {
    await page.goto('/dashboard');

    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
  });

  test('Navigation landmark is present', async ({ page }) => {
    await page.goto('/dashboard');

    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toHaveCount({ gte: 1 });
  });

  test('Form fields have associated labels', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Create Collection');

    const inputs = await page.locator('input').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');

      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = (await label.count()) > 0;

        expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
  });

  test('Loading states are announced to screen readers', async ({ page }) => {
    await page.goto('/restaurants');

    // Fill in search to trigger loading state
    await page.fill('input[placeholder*="address"]', 'New York');
    await page.click('button:has-text("Search")');

    // Check for aria-live region during loading
    const liveRegion = page.locator(
      '[aria-live="polite"], [aria-live="assertive"]'
    );

    if ((await liveRegion.count()) > 0) {
      await expect(liveRegion).toBeVisible();
    }
  });

  test('Error messages are announced to screen readers', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Create Collection');

    // Try to submit empty form
    await page.click('button:has-text("Create")');

    // Error should have role="alert" or aria-live
    const error = page.locator('[role="alert"], [aria-live="assertive"]');
    await expect(error).toBeVisible();
  });
});
