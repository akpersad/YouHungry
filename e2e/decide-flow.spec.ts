/**
 * E2E Tests: Decision-first flow (Phase 3)
 *
 * Covers the headline story — from app open to the decide surface in one tap
 * via the dashboard hero. The weighted spin itself depends on seeded
 * restaurants (live Google Places), so the deep spin assertion is left to
 * manual/integration verification; this guards the IA + navigation contract.
 */

import { test, expect } from '@playwright/test';

test.describe('Decision-first flow', () => {
  test('dashboard hero routes to the decide surface @smoke', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    // The hero leads with the decision, not a generic welcome.
    await expect(
      page.getByRole('heading', { name: /end the debate/i })
    ).toBeVisible();

    const decideCta = page.getByRole('link', { name: /decide where to eat/i });
    await expect(decideCta).toBeVisible();
    await decideCta.click();

    await expect(page).toHaveURL(/\/decide/);
    await expect(
      page.getByRole('heading', { name: /let.?s decide/i })
    ).toBeVisible();
  });

  test('decide page is reachable directly and prompts for a collection @smoke', async ({
    page,
  }) => {
    await page.goto('/decide');
    await expect(
      page.getByRole('heading', { name: /let.?s decide/i })
    ).toBeVisible();
    // Either the picker prompt (has collections) or the empty state renders.
    await expect(
      page.getByText(/which collection|no collections yet/i)
    ).toBeVisible();
  });
});
