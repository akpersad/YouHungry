/**
 * E2E Test Helper Utilities
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 */

import { Page, expect } from '@playwright/test';

/**
 * Wait for network idle (no pending requests)
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
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
  await page.click('text=Create Collection');

  await page.fill('input[name="name"]', name);
  if (description) {
    await page.fill('textarea[name="description"]', description);
  }

  await page.click('button:has-text("Create")');
  await waitForNetworkIdle(page);

  // Verify collection was created
  await expect(page.locator(`text=${name}`)).toBeVisible();
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
  await page.click(`text=${collectionName}`);

  // Click add restaurant
  await page.click('text=Add Restaurant');

  // Search for restaurant
  await page.fill('input[placeholder*="address"]', address);
  await page.click('button:has-text("Search")');

  // Wait for results
  await page.waitForSelector(`text=${restaurantName}`, { timeout: 10000 });

  // Add restaurant
  await page.click(`text=${restaurantName}`);
  await page.click('button:has-text("Add to Collection")');

  await waitForNetworkIdle(page);
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
  await page.click('text=Create Group');

  await page.fill('input[name="name"]', name);
  if (description) {
    await page.fill('textarea[name="description"]', description);
  }

  await page.click('button:has-text("Create Group")');
  await waitForNetworkIdle(page);

  // Verify group was created
  await expect(page.locator(`text=${name}`)).toBeVisible();
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
  await page.click(`text=${groupName}`);
  await page.click('text=Invite Members');

  // Search for user
  await page.fill('input[placeholder*="email"]', userEmail);
  await page.click('button:has-text("Search")');

  // Wait for user to appear
  await page.waitForSelector(`text=${userEmail}`);

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
