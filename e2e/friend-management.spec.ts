/**
 * E2E Tests: Friend Management
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 */

import { test, expect } from '@playwright/test';
import { addFriend, waitForNetworkIdle } from './helpers/test-helpers';
import { testUsers } from './fixtures/test-data';

test.describe('Friend Management', () => {
  test('Search for friend by email', async ({ page }) => {
    await page.goto('/friends');

    // Click add friend
    await page.click('text=Add Friend');

    // Search by email
    const searchInput = page.locator('input[placeholder*="email"]');
    await searchInput.fill(testUsers.user2.email);
    await page.click('button:has-text("Search")');

    await waitForNetworkIdle(page);

    // Verify search results
    await expect(page.locator(`text=${testUsers.user2.email}`)).toBeVisible();
  });

  test('Send friend request', async ({ page }) => {
    await addFriend(page, testUsers.user2.email);

    // Verify success message
    await expect(page.locator('text=request sent')).toBeVisible();
  });

  test('View pending friend requests', async ({ page }) => {
    await page.goto('/friends');

    // Click on pending requests tab
    await page.click('text=Pending');

    // Verify pending requests section is visible
    await expect(
      page.locator('[data-testid="pending-requests"]')
    ).toBeVisible();
  });

  test('Accept friend request', async ({ page }) => {
    // Navigate to friends page
    await page.goto('/friends');
    await page.click('text=Pending');

    // Accept first pending request
    const acceptButton = page.locator('[data-testid="accept-request"]').first();
    await acceptButton.click();

    await waitForNetworkIdle(page);

    // Verify request was accepted
    await expect(page.locator('text=accepted')).toBeVisible();
  });

  test('Decline friend request', async ({ page }) => {
    await page.goto('/friends');
    await page.click('text=Pending');

    // Decline first pending request
    const declineButton = page
      .locator('[data-testid="decline-request"]')
      .first();
    await declineButton.click();

    // Confirm
    await page.click('button:has-text("Confirm")');

    await waitForNetworkIdle(page);

    // Verify request was declined
    await expect(page.locator('text=declined')).toBeVisible();
  });

  test('View friends list', async ({ page }) => {
    await page.goto('/friends');

    // Friends tab should be active by default
    await expect(page.locator('[data-testid="friends-list"]')).toBeVisible();

    // Should show list of friends
    await expect(page.locator('[data-testid="friend-card"]')).toHaveCount({
      gte: 0,
    });
  });

  test('Remove friend', async ({ page }) => {
    await page.goto('/friends');

    // Click on first friend's menu
    const friendCard = page.locator('[data-testid="friend-card"]').first();
    await friendCard.locator('[data-testid="friend-menu"]').click();

    // Click remove
    await page.click('text=Remove Friend');

    // Confirm
    await page.click('button:has-text("Confirm")');

    await waitForNetworkIdle(page);

    // Verify friend was removed
    await expect(page.locator('text=removed')).toBeVisible();
  });

  test('User avatar displays correctly', async ({ page }) => {
    await page.goto('/friends');

    // Check that friend cards have avatars
    const friendCards = await page.locator('[data-testid="friend-card"]').all();

    for (const card of friendCards) {
      const avatar = card.locator('[data-testid="user-avatar"]');
      await expect(avatar).toBeVisible();
    }
  });

  test('Friendship status indicators work correctly', async ({ page }) => {
    await page.goto('/friends');
    await page.click('text=Add Friend');

    // Search for user
    await page.fill('input[placeholder*="email"]', testUsers.user3.email);
    await page.click('button:has-text("Search")');
    await waitForNetworkIdle(page);

    // Check status indicator
    const statusBadge = page.locator('[data-testid="friendship-status"]');
    await expect(statusBadge).toBeVisible();
  });

  test('Cannot send duplicate friend request', async ({ page }) => {
    // Send first request
    await addFriend(page, testUsers.user2.email);
    await waitForNetworkIdle(page);

    // Try to send again
    await page.goto('/friends');
    await page.click('text=Add Friend');
    await page.fill('input[placeholder*="email"]', testUsers.user2.email);
    await page.click('button:has-text("Search")');
    await waitForNetworkIdle(page);

    // Button should show "Pending" or be disabled
    const requestButton = page.locator('[data-testid="friend-action-button"]');
    const buttonText = await requestButton.textContent();

    expect(buttonText).toMatch(/pending|sent/i);
  });
});
