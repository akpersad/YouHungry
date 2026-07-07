/**
 * Shared lists + discovery browse (owner asks 2026-07-06), against the
 * seeded dev database:
 *
 * 1. The couple journey: the organizer builds a list, mints an invite
 *    link, member1 opens it, joins, and works the list (remove a place)
 *    with no owner controls in sight; the owner sees the collaboration.
 * 2. Invite honesty: a garbage token gets the dead-end, not a sign-in
 *    loop.
 * 3. Discovery: browsing near the device location surfaces the seeded
 *    fixture places with the vibe chips filtering them; the no-anchor
 *    nudge points at /account. Home-base saving pins the honest
 *    gate-closed message (Google is unreachable outside production).
 *
 * Runs as the organizer (default storage state); member1 joins from a
 * second context.
 */
import { test, expect } from '@playwright/test';
import { storageStateFor } from './squad-states';
import { gotoResilient } from './clerk-resilience';

// Center of the seeded fixture cluster (scripts/v2/seed-dev.ts).
const ASTORIA = { latitude: 40.763, longitude: -73.921 };

test.use({
  geolocation: ASTORIA,
  permissions: ['geolocation'],
});

test.describe('shared list: share → join → collaborate', () => {
  test('the couple journey end to end', async ({ page, browser }) => {
    test.setTimeout(180_000);
    const listName = `E2E shared ${Date.now().toString(36)}`;

    // Owner builds a two-place list from the seeded cache.
    await gotoResilient(page, '/places');
    await page.getByLabel('Find a spot').fill('Sushi');
    const results = page.getByRole('list', { name: 'Search results' });
    await expect(results.getByText('Sushi Yama')).toBeVisible();
    await results.getByRole('button', { name: 'Save' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('New list').fill(listName);
    await dialog.getByRole('button', { name: 'Start it' }).click();
    await expect(page.getByText(`Kept on ${listName}`)).toBeVisible();

    await page.getByLabel('Find a spot').fill('Taco');
    await expect(results.getByText('Taco Bravo')).toBeVisible();
    await results.getByRole('button', { name: 'Save' }).first().click();
    await dialog.getByRole('button', { name: listName }).click();
    await expect(page.getByText(`Kept on ${listName}`)).toBeVisible();

    // Mint the invite; read the path off the wire rather than the
    // clipboard (headless clipboard permissions vary).
    await page.getByRole('link', { name: new RegExp(listName) }).click();
    await expect(page.getByRole('heading', { name: listName })).toBeVisible();
    const [inviteResponse] = await Promise.all([
      page.waitForResponse((response) => response.url().includes('/invite')),
      page.getByRole('button', { name: 'Share this list' }).click(),
    ]);
    const { invitePath } = (await inviteResponse.json()) as {
      invitePath: string;
    };
    expect(invitePath).toContain('/places/join?token=');
    await expect(page.getByText(/works for 7 days/)).toBeVisible();
    const listUrl = page.url();

    // Member1 opens the link signed in, joins, and lands on the list.
    const memberContext = await browser.newContext({
      storageState: storageStateFor('member1'),
    });
    const memberPage = await memberContext.newPage();
    await gotoResilient(memberPage, invitePath);
    await expect(
      memberPage.getByRole('heading', { name: listName })
    ).toBeVisible();
    await expect(memberPage.getByText(/is sharing this list/)).toBeVisible();
    await memberPage.getByRole('button', { name: 'Join this list' }).click();
    await expect(memberPage).toHaveURL(/\/places\/l\/[0-9a-f]{24}/, {
      timeout: 15_000,
    });

    // Collaborator view: who shared it, the work controls, and none of
    // the owner's.
    await expect(memberPage.getByText(/Shared by/)).toBeVisible();
    await expect(
      memberPage.getByRole('button', { name: 'Rename' })
    ).toHaveCount(0);
    await expect(
      memberPage.getByRole('button', { name: 'Delete list' })
    ).toHaveCount(0);
    await expect(
      memberPage.getByRole('button', { name: 'Share this list' })
    ).toHaveCount(0);

    // Collaborator does real list work: takes a place off.
    await memberPage
      .getByRole('listitem')
      .filter({ hasText: 'Taco Bravo' })
      .getByRole('button', { name: 'Remove' })
      .click();
    await expect(memberPage.getByText('Taco Bravo')).toHaveCount(0);

    // The shared list shows up on the collaborator's /places under
    // "Shared with you".
    await gotoResilient(memberPage, '/places');
    await expect(
      memberPage.getByRole('heading', { name: 'Shared with you' })
    ).toBeVisible();
    await expect(
      memberPage.getByRole('link', { name: new RegExp(listName) })
    ).toBeVisible();
    await memberContext.close();

    // Owner sees the collaboration: one place left, shared-with count.
    await page.goto(listUrl);
    await expect(page.getByText('1 place')).toBeVisible();
    await expect(page.getByText(/Shared with 1 person/)).toBeVisible();
    await expect(page.getByText('Taco Bravo')).toHaveCount(0);

    // Cleanup: retire the list (also keeps reruns clean).
    await page.getByRole('button', { name: 'Delete list' }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete it' })
      .click();
    await expect(page).toHaveURL(/\/places$/);
  });

  test('a bad invite link gets the honest dead-end', async ({ page }) => {
    await gotoResilient(page, '/places/join?token=not-a-real-token');
    await expect(page.getByText('This invite link is not right')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Join this list' })
    ).toHaveCount(0);
  });
});

test.describe('discovery browse', () => {
  test('@smoke browse near the device finds the fixture cluster; vibes filter it', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await gotoResilient(page, '/places');

    // No anchor seeded: the section offers the location path and points
    // at /account for the anchored one.
    await expect(
      page.getByRole('button', { name: 'Use my location' })
    ).toBeVisible();
    await expect(page.getByText(/Set a home base/)).toBeVisible();

    await page.getByRole('button', { name: 'Use my location' }).click();
    const nearby = page.getByRole('list', { name: 'Nearby places' });
    await expect(nearby.getByText('Sushi Yama')).toBeVisible();

    // Every row links out to its Google listing.
    await expect(
      nearby.getByRole('link', { name: /See Sushi Yama on Google Maps/ })
    ).toBeVisible();

    // Vibe chips re-query: "Cheap eats" keeps the taco truck, drops the
    // pricey sushi (fixture price levels are seeded).
    await page.getByRole('button', { name: 'Cheap eats' }).click();
    await expect(nearby.getByText('Taco Bravo')).toBeVisible();
    await expect(nearby.getByText('Sushi Yama')).toHaveCount(0);
  });

  test('home base saving is honest about the closed billing gate in dev', async ({
    page,
  }) => {
    await gotoResilient(page, '/account');
    const homeBase = page.getByLabel('Home base');
    await homeBase.fill('30-01 35th Ave, Astoria, NY');
    await page.getByRole('button', { name: 'Save home base' }).click();
    await expect(
      page.getByText('Address lookup is turned off in this environment.')
    ).toBeVisible();
  });
});
