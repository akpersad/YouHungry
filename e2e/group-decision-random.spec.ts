/**
 * E2E Tests: Random Group Decision Making
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 *
 * Tests random selection with 30-day rolling weight system
 */

import { test, expect } from '@playwright/test';
import {
  createCollection,
  addRestaurantToCollection,
  createGroup,
  startGroupDecision,
  waitForNetworkIdle,
  getDecisionResult,
} from './helpers/test-helpers';
import {
  testRestaurants,
  testCollections,
  testGroups,
} from './fixtures/test-data';

test.describe('Random Group Decision Making', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test data
    await createGroup(
      page,
      testGroups.group2.name,
      testGroups.group2.description
    );
    await createCollection(
      page,
      testCollections.group2.name,
      testCollections.group2.description
    );

    // Add multiple restaurants
    await addRestaurantToCollection(
      page,
      testCollections.group2.name,
      testRestaurants.pizza1.name,
      testRestaurants.pizza1.address
    );
    await addRestaurantToCollection(
      page,
      testCollections.group2.name,
      testRestaurants.sushi1.name,
      testRestaurants.sushi1.address
    );
    await addRestaurantToCollection(
      page,
      testCollections.group2.name,
      testRestaurants.italian1.name,
      testRestaurants.italian1.address
    );
    await addRestaurantToCollection(
      page,
      testCollections.group2.name,
      testRestaurants.mexican1.name,
      testRestaurants.mexican1.address
    );
  });

  test('Random Selection: Selects restaurant and displays result', async ({
    page,
  }) => {
    // Start random decision
    await startGroupDecision(
      page,
      testGroups.group2.name,
      testCollections.group2.name,
      'random'
    );

    await waitForNetworkIdle(page);

    // Random decision completes immediately
    await expect(page.locator('[data-testid="decision-result"]')).toBeVisible();

    // Verify a restaurant was selected
    const result = await getDecisionResult(page);
    expect(result.length).toBeGreaterThan(0);

    // Verify reasoning mentions weighted selection
    await expect(
      page.locator('[data-testid="decision-reasoning"]')
    ).toContainText(/weighted/i);
  });

  test('Random Selection: Shows restaurant weights', async ({ page }) => {
    // Start random decision
    await startGroupDecision(
      page,
      testGroups.group2.name,
      testCollections.group2.name,
      'random'
    );

    await waitForNetworkIdle(page);

    // Check if weight information is displayed
    await page.click('text=View Weights');
    await expect(
      page.locator('[data-testid="restaurant-weights"]')
    ).toBeVisible();

    // Verify all restaurants have weights displayed
    await expect(page.locator('[data-testid="weight-info"]')).toHaveCount(4);
  });

  test('Random Selection: Weight decreases after selection', async ({
    page,
  }) => {
    // First decision
    await startGroupDecision(
      page,
      testGroups.group2.name,
      testCollections.group2.name,
      'random'
    );

    await waitForNetworkIdle(page);

    const firstResult = await getDecisionResult(page);

    // Second decision
    await page.goto('/groups');
    await page.click(`text=${testGroups.group2.name}`);
    await page.click(`text=${testCollections.group2.name}`);

    await startGroupDecision(
      page,
      testGroups.group2.name,
      testCollections.group2.name,
      'random'
    );

    await waitForNetworkIdle(page);

    // Check weights - recently selected restaurant should have lower weight
    await page.click('text=View Weights');

    const selectedRestaurantWeight = page.locator(
      `[data-testid="restaurant-${firstResult}"]:has-text("Weight")`
    );

    await expect(selectedRestaurantWeight).toContainText(/lower|reduced/i);
  });

  test('Random Selection: All restaurants have minimum chance', async ({
    page,
  }) => {
    // View weights before any decisions
    await page.goto('/groups');
    await page.click(`text=${testGroups.group2.name}`);
    await page.click(`text=${testCollections.group2.name}`);

    // Check restaurant weights
    await page.click('text=View Statistics');
    await page.click('text=Weights');

    // All should have 100% weight (never selected)
    const weights = await page
      .locator('[data-testid="restaurant-weight"]')
      .all();

    for (const weight of weights) {
      const text = await weight.textContent();
      expect(text).toMatch(/100%|1\.0|full/i);
    }
  });

  test('Random Selection: Decision history tracked', async ({ page }) => {
    // Make a random decision
    await startGroupDecision(
      page,
      testGroups.group2.name,
      testCollections.group2.name,
      'random'
    );

    await waitForNetworkIdle(page);

    // Navigate to history
    await page.goto('/history');

    // Verify decision appears in history
    await expect(
      page.locator('[data-testid="decision-history"]')
    ).toContainText(testCollections.group2.name);

    // Verify it's marked as 'random' method
    await expect(page.locator('[data-testid="decision-method"]')).toContainText(
      'random'
    );
  });
});
