/**
 * E2E Tests: Restaurant Search and Add to Collection
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 */

import { test, expect } from '@playwright/test';
import { createCollection, waitForNetworkIdle } from './helpers/test-helpers';
import { testRestaurants, testCollections } from './fixtures/test-data';

test.describe('Restaurant Search and Add to Collection', () => {
  test.beforeEach(async ({ page }) => {
    // Create a collection to add restaurants to
    await createCollection(
      page,
      testCollections.personal1.name,
      testCollections.personal1.description
    );
  });

  test('Search for restaurant by address @smoke @critical', async ({
    page,
  }) => {
    await page.goto('/restaurants');

    // Fill in address
    await page.fill(
      'input[placeholder*="address"]',
      testRestaurants.pizza1.address
    );

    // Search
    await page.click('button:has-text("Search")');

    // Wait for results
    await waitForNetworkIdle(page);

    // Verify restaurant appears in results
    await expect(
      page.locator(`text=${testRestaurants.pizza1.name}`)
    ).toBeVisible();
  });

  test('Search with query for specific restaurant', async ({ page }) => {
    await page.goto('/restaurants');

    // Fill in query and address
    await page.fill('input[placeholder*="query"]', 'pizza');
    await page.fill('input[placeholder*="address"]', 'New York, NY');

    // Search
    await page.click('button:has-text("Search")');

    await waitForNetworkIdle(page);

    // Verify pizza restaurants appear
    const count = await page.locator('[data-testid="restaurant-card"]').count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('View restaurant details', async ({ page }) => {
    await page.goto('/restaurants');
    await page.fill(
      'input[placeholder*="address"]',
      testRestaurants.pizza1.address
    );
    await page.click('button:has-text("Search")');

    await waitForNetworkIdle(page);

    // Click on restaurant card
    await page.click(`text=${testRestaurants.pizza1.name}`);

    // Verify details modal opens
    await expect(
      page.locator('[data-testid="restaurant-details"]')
    ).toBeVisible();

    // Verify details are displayed
    await expect(page.locator('[data-testid="restaurant-name"]')).toContainText(
      testRestaurants.pizza1.name
    );
    await expect(
      page.locator('[data-testid="restaurant-address"]')
    ).toContainText(testRestaurants.pizza1.address);
  });

  test('Add restaurant to collection', async ({ page }) => {
    await page.goto('/restaurants');
    await page.fill(
      'input[placeholder*="address"]',
      testRestaurants.pizza1.address
    );
    await page.click('button:has-text("Search")');

    await waitForNetworkIdle(page);

    // Click add to collection
    await page
      .locator(
        `[data-testid="restaurant-card"]:has-text("${testRestaurants.pizza1.name}")`
      )
      .locator('button:has-text("Add")')
      .click();

    // Select collection
    await page.click(`text=${testCollections.personal1.name}`);

    // Confirm
    await page.click('button:has-text("Add to Collection")');

    await waitForNetworkIdle(page);

    // Verify success message
    await expect(page.locator('text=added to collection')).toBeVisible();
  });

  test('Restaurant appears in collection after adding', async ({ page }) => {
    // Add restaurant
    await page.goto('/restaurants');
    await page.fill(
      'input[placeholder*="address"]',
      testRestaurants.pizza1.address
    );
    await page.click('button:has-text("Search")');
    await waitForNetworkIdle(page);

    await page
      .locator(
        `[data-testid="restaurant-card"]:has-text("${testRestaurants.pizza1.name}")`
      )
      .locator('button:has-text("Add")')
      .click();
    await page.click(`text=${testCollections.personal1.name}`);
    await page.click('button:has-text("Add to Collection")');
    await waitForNetworkIdle(page);

    // Navigate to collection
    await page.goto('/dashboard');
    await page.click(`text=${testCollections.personal1.name}`);

    // Verify restaurant is in collection
    await expect(
      page.locator(`text=${testRestaurants.pizza1.name}`)
    ).toBeVisible();
  });

  test('Set custom fields when adding restaurant', async ({ page }) => {
    await page.goto('/restaurants');
    await page.fill(
      'input[placeholder*="address"]',
      testRestaurants.pizza1.address
    );
    await page.click('button:has-text("Search")');
    await waitForNetworkIdle(page);

    // Add to collection
    await page
      .locator(
        `[data-testid="restaurant-card"]:has-text("${testRestaurants.pizza1.name}")`
      )
      .locator('button:has-text("Add")')
      .click();
    await page.click(`text=${testCollections.personal1.name}`);

    // Set custom fields
    await page.fill(
      'input[name="priceRange"]',
      testRestaurants.pizza1.priceRange
    );
    await page.fill('input[name="timeToPickUp"]', '15');

    await page.click('button:has-text("Add to Collection")');
    await waitForNetworkIdle(page);

    // Verify custom fields were saved
    await page.goto('/dashboard');
    await page.click(`text=${testCollections.personal1.name}`);
    await page.click(`text=${testRestaurants.pizza1.name}`);

    await expect(page.locator('[data-testid="price-range"]')).toContainText(
      testRestaurants.pizza1.priceRange
    );
    await expect(page.locator('[data-testid="time-to-pickup"]')).toContainText(
      '15'
    );
  });

  test('Remove restaurant from collection', async ({ page }) => {
    // First add a restaurant
    await page.goto('/restaurants');
    await page.fill(
      'input[placeholder*="address"]',
      testRestaurants.pizza1.address
    );
    await page.click('button:has-text("Search")');
    await waitForNetworkIdle(page);

    await page
      .locator(
        `[data-testid="restaurant-card"]:has-text("${testRestaurants.pizza1.name}")`
      )
      .locator('button:has-text("Add")')
      .click();
    await page.click(`text=${testCollections.personal1.name}`);
    await page.click('button:has-text("Add to Collection")');
    await waitForNetworkIdle(page);

    // Go to collection
    await page.goto('/dashboard');
    await page.click(`text=${testCollections.personal1.name}`);

    // Remove restaurant
    await page
      .locator(
        `[data-testid="restaurant-card"]:has-text("${testRestaurants.pizza1.name}")`
      )
      .locator('button:has-text("Remove")')
      .click();

    // Confirm removal
    await page.click('button:has-text("Confirm")');
    await waitForNetworkIdle(page);

    // Verify restaurant is removed
    await expect(
      page.locator(`text=${testRestaurants.pizza1.name}`)
    ).not.toBeVisible();
  });

  test('Address validation catches invalid addresses', async ({ page }) => {
    await page.goto('/restaurants');

    // Enter invalid address
    await page.fill(
      'input[placeholder*="address"]',
      'invalid address that does not exist'
    );

    // Try to search
    await page.click('button:has-text("Search")');

    // Verify error message
    await expect(page.locator('[role="alert"]')).toContainText(
      /invalid|not found/i
    );
  });

  test('Address autocomplete provides suggestions', async ({ page }) => {
    await page.goto('/restaurants');

    const addressInput = page.locator('input[placeholder*="address"]');

    // Start typing
    await addressInput.fill('New York');

    // Wait for suggestions
    await page.waitForSelector('[data-testid="address-suggestion"]', {
      timeout: 5000,
    });

    // Verify suggestions appear
    const count = await page
      .locator('[data-testid="address-suggestion"]')
      .count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
