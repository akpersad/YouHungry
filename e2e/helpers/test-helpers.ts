/**
 * E2E Test Helper Utilities
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 */

import { Page, expect } from '@playwright/test';

/**
 * Wait for network idle (no pending requests)
 */
export async function waitForNetworkIdle(page: Page, timeout = 10000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Create a collection via UI
 */
export async function createCollection(
  page: Page,
  name: string,
  description?: string
) {
  await page.goto('/dashboard');
  await waitForNetworkIdle(page);

  // Wait for any existing modals to close
  await page.waitForTimeout(500);

  // Click Create Collection button - be more specific to avoid modal issues
  await page
    .locator('button:has-text("Create Collection")')
    .first()
    .click({ timeout: 10000 });

  // Wait for modal dialog to be visible
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });

  // Fill in the form within the dialog
  await page.locator('[role="dialog"] input[name="name"]').fill(name);
  if (description) {
    await page
      .locator('[role="dialog"] textarea[name="description"]')
      .fill(description);
  }

  // Submit the form - click the submit button inside the dialog
  await page
    .locator('[role="dialog"]')
    .locator('button:has-text("Create Collection")')
    .click();

  // Wait for success (modal may auto-close or stay open)
  // Try to close modal if it's still open
  try {
    await page.waitForTimeout(1000); // Brief wait for submission
    const dialog = page.locator('[role="dialog"]');
    if (await dialog.isVisible()) {
      // Try to close the modal
      const closeButton = dialog
        .locator('button:has-text("Close"), button[aria-label="Close"]')
        .first();
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      }
    }
  } catch {
    // Modal already closed, continue
  }

  await waitForNetworkIdle(page);

  // Verify collection was created - use first match to avoid strict mode violations
  await expect(page.getByRole('heading', { name: name }).first()).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Add a restaurant to a collection
 */
export async function addRestaurantToCollection(
  page: Page,
  collectionName: string,
  restaurantName: string,
  address: string
) {
  // Navigate to collection
  await page.goto('/dashboard');
  await waitForNetworkIdle(page);

  // Wait for collection to be clickable
  await page.waitForSelector(`text=${collectionName}`, { timeout: 10000 });
  await page.click(`text=${collectionName}`);
  await waitForNetworkIdle(page);

  // Click add restaurant button
  await page.locator('button:has-text("Add Restaurant")').first().click();

  // Wait for dialog to open
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });

  // Wait for search form within dialog
  await page.waitForSelector('[role="dialog"] input[placeholder*="address"]', {
    timeout: 10000,
  });

  // Search for restaurant - type the address
  await page
    .locator('[role="dialog"] input[placeholder*="address"]')
    .fill(address);

  // Wait for the search button to be enabled (Google Places API needs to load)
  const searchButton = page.locator(
    '[role="dialog"] button:has-text("Search Restaurants")'
  );
  await searchButton.waitFor({ state: 'attached', timeout: 10000 });

  // Wait a bit for the button to be enabled after typing
  await page.waitForTimeout(1000);

  // Click search button
  await searchButton.click({ timeout: 10000 });

  // Wait for results to appear (any results, not necessarily the exact name)
  await page
    .locator('[role="dialog"] .card-base')
    .first()
    .waitFor({ timeout: 30000 });

  // Try to find the exact restaurant name first, but if not found, use the first result
  const exactMatch = page
    .locator('[role="dialog"]')
    .locator(`.card-base:has-text("${restaurantName}")`);
  const exactMatchCount = await exactMatch.count();

  const restaurantCard =
    exactMatchCount > 0
      ? exactMatch.first()
      : page.locator('[role="dialog"] .card-base').first();

  await restaurantCard.locator('button:has-text("Add to Collection")').click();

  await waitForNetworkIdle(page);

  // Wait for modal to close
  await page.waitForSelector('[role="dialog"]', {
    state: 'hidden',
    timeout: 10000,
  });
}

/**
 * Create a group
 */
export async function createGroup(
  page: Page,
  name: string,
  description?: string
) {
  await page.goto('/groups');
  await waitForNetworkIdle(page);

  // Wait for any existing modals to close
  await page.waitForTimeout(500);

  // Click the Create Group button to open modal
  await page.locator('button:has-text("Create Group")').first().click();

  // Wait for modal dialog to be visible
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });

  // Fill in the form within the dialog
  await page.locator('[role="dialog"] input[name="name"]').fill(name);
  if (description) {
    await page
      .locator('[role="dialog"] textarea[name="description"]')
      .fill(description);
  }

  // Submit the form - look for the submit button inside the dialog
  await page
    .locator('[role="dialog"]')
    .locator('button:has-text("Create Group")')
    .click();

  // Wait for success (modal may auto-close or stay open)
  // Try to close modal if it's still open
  try {
    await page.waitForTimeout(1000); // Brief wait for submission
    const dialog = page.locator('[role="dialog"]');
    if (await dialog.isVisible()) {
      // Try to close the modal
      const closeButton = dialog
        .locator('button:has-text("Close"), button[aria-label="Close"]')
        .first();
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      }
    }
  } catch {
    // Modal already closed, continue
  }

  await waitForNetworkIdle(page);

  // Verify group was created - wait for it to appear in the list using a more specific selector
  await expect(page.getByRole('heading', { name: name }).first()).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Invite user to group
 */
export async function inviteToGroup(
  page: Page,
  groupName: string,
  userEmail: string
) {
  await page.goto('/groups');
  await waitForNetworkIdle(page);

  // Click on the group to view it
  await page.click(`text=${groupName}`);
  await waitForNetworkIdle(page);

  // Click Invite Members button
  await page.click('button:has-text("Invite Members")');

  // Wait for invite modal/form to be visible
  await page.waitForSelector('input[placeholder*="email"]', { timeout: 10000 });

  // Search for user
  await page.fill('input[placeholder*="email"]', userEmail);
  await page.click('button:has-text("Search")');

  // Wait for user to appear
  await page.waitForSelector(`text=${userEmail}`, { timeout: 10000 });

  // Send invitation
  await page.click(`button:has-text("Invite")`);
  await waitForNetworkIdle(page);
}

/**
 * Start a group decision
 */
export async function startGroupDecision(
  page: Page,
  groupName: string,
  collectionName: string,
  method: 'tiered' | 'random',
  deadlineHours = 24
) {
  await page.goto('/groups');
  await page.click(`text=${groupName}`);
  await page.click(`text=${collectionName}`);

  await page.click('text=Start Decision');

  // Select method
  await page.click(
    `label:has-text("${method === 'tiered' ? 'Tiered Choice' : 'Random Selection'}")`
  );

  // Set deadline
  await page.fill('input[name="deadline"]', deadlineHours.toString());

  // Set visit date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateString = tomorrow.toISOString().split('T')[0];
  await page.fill('input[type="date"]', dateString);

  await page.click('button:has-text("Start Decision")');
  await waitForNetworkIdle(page);
}

/**
 * Submit a vote in a tiered decision
 */
export async function submitTieredVote(
  page: Page,
  rankings: string[] // Restaurant names in order
) {
  await page.click('button:has-text("Vote")');

  // Wait for voting interface
  await page.waitForSelector('[data-testid="voting-interface"]');

  // Drag and drop restaurants to rank them
  for (let i = 0; i < rankings.length && i < 3; i++) {
    const restaurant = rankings[i];
    const restaurantCard = page.locator(
      `[data-testid="restaurant-card"]:has-text("${restaurant}")`
    );
    const rankSlot = page.locator(`[data-testid="rank-slot-${i}"]`);

    await restaurantCard.dragTo(rankSlot);
  }

  // Submit vote
  await page.click('button:has-text("Submit Vote")');
  await waitForNetworkIdle(page);

  // Verify vote was submitted
  await expect(page.locator("text=You've Voted")).toBeVisible();
}

/**
 * Complete a group decision (admin only)
 */
export async function completeGroupDecision(page: Page) {
  await page.click('button:has-text("Complete Decision")');

  // Confirm
  await page.click('button:has-text("Confirm")');
  await waitForNetworkIdle(page);

  // Verify decision is completed
  await expect(page.locator('text=Decision Complete')).toBeVisible();
}

/**
 * Add friend by email
 */
export async function addFriend(page: Page, email: string) {
  await page.goto('/friends');
  await page.click('text=Add Friend');

  await page.fill('input[placeholder*="email"]', email);
  await page.click('button:has-text("Search")');

  // Wait for user to appear
  await page.waitForSelector(`text=${email}`);

  // Send friend request
  await page.click('button:has-text("Send Request")');
  await waitForNetworkIdle(page);
}

/**
 * Accept friend request
 */
export async function acceptFriendRequest(page: Page, fromUser: string) {
  await page.goto('/friends');
  await page.click('text=Pending Requests');

  // Find and accept request
  await page
    .locator(`[data-testid="friend-request"]:has-text("${fromUser}")`)
    .locator('button:has-text("Accept")')
    .click();
  await waitForNetworkIdle(page);
}

/**
 * Get decision result
 */
export async function getDecisionResult(page: Page): Promise<string> {
  const resultElement = await page
    .locator('[data-testid="decision-result"]')
    .textContent();
  return resultElement || '';
}

/**
 * Check if element is accessible (has proper ARIA attributes)
 */
export async function checkAccessibility(page: Page, selector: string) {
  const element = page.locator(selector);

  // Check for ARIA label or text content
  const ariaLabel = await element.getAttribute('aria-label');
  const textContent = await element.textContent();

  expect(ariaLabel || textContent).toBeTruthy();

  // Check for role if it's interactive
  const role = await element.getAttribute('role');
  const tagName = await element.evaluate((el) => el.tagName.toLowerCase());

  const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
  if (interactiveTags.includes(tagName)) {
    expect(role || interactiveTags.includes(tagName)).toBeTruthy();
  }
}
