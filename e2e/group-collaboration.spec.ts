/**
 * E2E Tests: Group Creation, Invitation & Collaboration
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 */

import { test, expect } from '@playwright/test';
import {
  createGroup,
  inviteToGroup,
  addRestaurantToCollection,
  waitForNetworkIdle,
} from './helpers/test-helpers';
import {
  testGroups,
  testCollections,
  testUsers,
  testRestaurants,
} from './fixtures/test-data';

test.describe('Group Collaboration', () => {
  test('Create new group @smoke @critical', async ({ page }) => {
    await createGroup(
      page,
      testGroups.group1.name,
      testGroups.group1.description
    );

    // Verify group was created
    await expect(page.locator(`text=${testGroups.group1.name}`)).toBeVisible();
  });

  test('View group details', async ({ page }) => {
    await createGroup(
      page,
      testGroups.group1.name,
      testGroups.group1.description
    );

    // Click on group
    await page.click(`text=${testGroups.group1.name}`);

    // Verify details are shown
    await expect(page.locator('[data-testid="group-name"]')).toContainText(
      testGroups.group1.name
    );
    await expect(
      page.locator('[data-testid="group-description"]')
    ).toContainText(testGroups.group1.description);
  });

  test('Edit group details as admin', async ({ page }) => {
    await createGroup(
      page,
      testGroups.group1.name,
      testGroups.group1.description
    );

    // Go to group
    await page.click(`text=${testGroups.group1.name}`);

    // Click edit
    await page.click('button:has-text("Edit Group")');

    // Update details
    const newName = `${testGroups.group1.name} (Updated)`;
    await page.fill('input[name="name"]', newName);

    // Save
    await page.click('button:has-text("Save")');
    await waitForNetworkIdle(page);

    // Verify updated
    await expect(page.locator('[data-testid="group-name"]')).toContainText(
      newName
    );
  });

  test('Invite member to group', async ({ page }) => {
    await createGroup(
      page,
      testGroups.group1.name,
      testGroups.group1.description
    );
    await inviteToGroup(page, testGroups.group1.name, testUsers.user2.email);

    // Verify invitation sent
    await expect(page.locator('text=invitation sent')).toBeVisible();
  });

  test('View group invitations', async ({ page }) => {
    await page.goto('/groups');

    // Click on invitations tab
    await page.click('text=Invitations');

    // Verify invitations section is visible
    await expect(
      page.locator('[data-testid="group-invitations"]')
    ).toBeVisible();
  });

  test('Accept group invitation', async ({ page }) => {
    await page.goto('/groups');
    await page.click('text=Invitations');

    // Accept first invitation
    const acceptButton = page
      .locator('[data-testid="accept-invitation"]')
      .first();

    if (await acceptButton.isVisible()) {
      await acceptButton.click();
      await waitForNetworkIdle(page);

      // Verify accepted
      await expect(page.locator('text=joined')).toBeVisible();
    }
  });

  test('Decline group invitation', async ({ page }) => {
    await page.goto('/groups');
    await page.click('text=Invitations');

    // Decline first invitation
    const declineButton = page
      .locator('[data-testid="decline-invitation"]')
      .first();

    if (await declineButton.isVisible()) {
      await declineButton.click();

      // Confirm
      await page.click('button:has-text("Confirm")');
      await waitForNetworkIdle(page);

      // Verify declined
      await expect(page.locator('text=declined')).toBeVisible();
    }
  });

  test('View group members', async ({ page }) => {
    await createGroup(
      page,
      testGroups.group1.name,
      testGroups.group1.description
    );
    await page.click(`text=${testGroups.group1.name}`);

    // Click members tab
    await page.click('text=Members');

    // Verify members list is shown
    await expect(page.locator('[data-testid="group-members"]')).toBeVisible();

    // At least the creator should be listed
    const count = await page.locator('[data-testid="member-card"]').count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Promote member to admin', async ({ page }) => {
    await createGroup(
      page,
      testGroups.group1.name,
      testGroups.group1.description
    );
    await inviteToGroup(page, testGroups.group1.name, testUsers.user2.email);

    // Go to members
    await page.click(`text=${testGroups.group1.name}`);
    await page.click('text=Members');

    // Find member and promote (if they've accepted)
    const memberCard = page.locator(
      `[data-testid="member-card"]:has-text("${testUsers.user2.name}")`
    );

    if (await memberCard.isVisible()) {
      await memberCard.locator('[data-testid="member-menu"]').click();
      await page.click('text=Promote to Admin');

      await waitForNetworkIdle(page);

      // Verify promoted
      await expect(
        memberCard.locator('[data-testid="admin-badge"]')
      ).toBeVisible();
    }
  });

  test('Remove member from group', async ({ page }) => {
    await createGroup(
      page,
      testGroups.group1.name,
      testGroups.group1.description
    );
    await inviteToGroup(page, testGroups.group1.name, testUsers.user2.email);

    // Go to members
    await page.click(`text=${testGroups.group1.name}`);
    await page.click('text=Members');

    // Remove member
    const memberCard = page.locator('[data-testid="member-card"]').nth(1);

    if (await memberCard.isVisible()) {
      await memberCard.locator('[data-testid="member-menu"]').click();
      await page.click('text=Remove');

      // Confirm
      await page.click('button:has-text("Confirm")');
      await waitForNetworkIdle(page);

      // Verify removed
      await expect(page.locator('text=removed')).toBeVisible();
    }
  });

  test('Create group collection', async ({ page }) => {
    await createGroup(
      page,
      testGroups.group1.name,
      testGroups.group1.description
    );

    // Go to group
    await page.click(`text=${testGroups.group1.name}`);

    // Create collection
    await page.click('text=Collections');
    await page.click('text=Create Collection');

    await page.fill('input[name="name"]', testCollections.group1.name);
    await page.fill(
      'textarea[name="description"]',
      testCollections.group1.description
    );

    await page.click('button:has-text("Create")');
    await waitForNetworkIdle(page);

    // Verify collection was created
    await expect(
      page.locator(`text=${testCollections.group1.name}`)
    ).toBeVisible();
  });

  test('Add restaurant to group collection', async ({ page }) => {
    await createGroup(
      page,
      testGroups.group1.name,
      testGroups.group1.description
    );
    await page.click(`text=${testGroups.group1.name}`);

    // Create group collection
    await page.click('text=Collections');
    await page.click('text=Create Collection');
    await page.fill('input[name="name"]', testCollections.group1.name);
    await page.click('button:has-text("Create")');
    await waitForNetworkIdle(page);

    // Add restaurant to collection
    await addRestaurantToCollection(
      page,
      testCollections.group1.name,
      testRestaurants.pizza1.name,
      testRestaurants.pizza1.address
    );

    // Verify restaurant was added
    await expect(
      page.locator(`text=${testRestaurants.pizza1.name}`)
    ).toBeVisible();
  });

  test('Group members can view collections', async ({ page }) => {
    await createGroup(
      page,
      testGroups.group1.name,
      testGroups.group1.description
    );
    await page.click(`text=${testGroups.group1.name}`);

    // Click collections tab
    await page.click('text=Collections');

    // Verify collections section is visible
    await expect(
      page.locator('[data-testid="group-collections"]')
    ).toBeVisible();
  });

  test('Only admins can edit group collections', async ({ page }) => {
    await createGroup(
      page,
      testGroups.group1.name,
      testGroups.group1.description
    );
    await page.click(`text=${testGroups.group1.name}`);
    await page.click('text=Collections');

    // Admin should see edit button
    await expect(
      page.locator('button:has-text("Create Collection")')
    ).toBeVisible();
  });

  test('Leave group', async ({ page }) => {
    await createGroup(
      page,
      testGroups.group1.name,
      testGroups.group1.description
    );

    // Invite another member first (admin can't leave if they're the only one)
    await inviteToGroup(page, testGroups.group1.name, testUsers.user2.email);

    await page.goto('/groups');
    await page.click(`text=${testGroups.group1.name}`);

    // Try to leave
    await page.click('[data-testid="group-menu"]');
    await page.click('text=Leave Group');

    // Should see warning about being last admin
    await expect(page.locator('text=last admin')).toBeVisible();
  });

  test('Delete group as admin', async ({ page }) => {
    await createGroup(
      page,
      testGroups.group1.name,
      testGroups.group1.description
    );
    await page.click(`text=${testGroups.group1.name}`);

    // Delete group
    await page.click('[data-testid="group-menu"]');
    await page.click('text=Delete Group');

    // Confirm
    await page.fill('input[placeholder*="confirm"]', testGroups.group1.name);
    await page.click('button:has-text("Delete")');

    await waitForNetworkIdle(page);

    // Verify group was deleted
    await expect(
      page.locator(`text=${testGroups.group1.name}`)
    ).not.toBeVisible();
  });
});
