/**
 * Phase 3 exit demo — the Fork core loop, end to end against the seeded
 * dev database (Astoria fixture places, test-squad users):
 *
 * 1. Solo journey: cold-open near-me spin in two taps (signed out AND
 *    signed in; lock-in persists for the account holder).
 * 2. A 3-user signed-in vote: organizer creates a quorum-3 vote fork,
 *    member1 + member2 rank from the shared link, the organizer's ballot
 *    hits quorum, everyone converges on the same winner.
 */
import { test, expect, type Page } from '@playwright/test';
import { storageStateFor } from './squad-states';

// Center of the seeded fixture cluster (scripts/v2/seed-dev.ts).
const ASTORIA = { latitude: 40.763, longitude: -73.921 };

test.use({
  geolocation: ASTORIA,
  permissions: ['geolocation'],
});

async function spinAndSkip(page: Page) {
  await page.getByRole('button', { name: 'Spin near me' }).click();
  // The board flaps for ~2.1s; skip the theater deterministically.
  await page.getByRole('button', { name: 'Skip to the result' }).click();
  await expect(page.getByText("We're going here.")).toBeVisible();
}

test.describe('solo quick spin', () => {
  test('@smoke signed out: cold open to a decision in two taps, no account', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
      geolocation: ASTORIA,
      permissions: ['geolocation'],
    });
    const page = await context.newPage();

    await page.goto('/beta');
    await expect(
      page.getByRole('heading', { name: 'Where are we eating?' })
    ).toBeVisible();

    await spinAndSkip(page);

    // Signed out: no persistence affordance, an honest account nudge, and
    // a free re-spin instead.
    await expect(page.getByRole('button', { name: 'Lock it in' })).toHaveCount(
      0
    );
    await expect(
      page.getByRole('button', { name: 'Spin again' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Create an account' })
    ).toBeVisible();

    await context.close();
  });

  test('signed in: spin, lock it in, history records it', async ({ page }) => {
    await page.goto('/beta');
    await spinAndSkip(page);

    // Winner card carries real place details from the fixture cache.
    await expect(page.getByText(/Fixture Ave/)).toBeVisible();

    await page.getByRole('button', { name: 'Lock it in' }).click();
    await expect(
      page.getByText('Locked in. This one counts toward your history.')
    ).toBeVisible();
  });

  test('vibe filter narrows the wheel', async ({ page }) => {
    await page.goto('/beta');
    await page.getByRole('button', { name: 'Cheap eats' }).click();
    await spinAndSkip(page);
    // Every cheap-eats fixture is priceLevel 1 → "$" (never "$$").
    await expect(page.getByText(/★ · \$(?!\$)/)).toBeVisible();
  });
});

test.describe('3-user vote', () => {
  test('organizer creates a quorum-3 vote; two members + organizer rank; everyone sees the reveal', async ({
    page,
    browser,
  }) => {
    test.setTimeout(120_000);

    // --- Organizer creates the fork ---------------------------------------
    await page.goto('/beta/new');
    await expect(
      page.getByRole('heading', { name: "What's in the running?" })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Use my location' }).click();
    const addButtons = page.getByRole('button', { name: /^Add / });
    await expect(addButtons.first()).toBeVisible({ timeout: 10_000 });
    for (let i = 0; i < 3; i++) {
      // The list re-renders each add; always take the first remaining.
      await addButtons.first().click();
    }
    await expect(page.getByText('On the ballot (3)')).toBeVisible();

    // The radio input is visually hidden inside the mode card — click the
    // card itself.
    await page
      .locator('label')
      .filter({ hasText: 'Everyone ranks their top 3' })
      .click();
    await page.getByLabel('Close early after this many votes').fill('3');
    await page.getByRole('button', { name: 'Fork it' }).click();

    await page.waitForURL(/\/beta\/f\/[a-z2-9]{10}/);
    const forkUrl = page.url();
    await expect(
      page.getByRole('heading', { name: 'Rank your top 3' })
    ).toBeVisible();

    // --- Members vote from the shared link --------------------------------
    const castBallot = async (memberPage: Page, picks: number[]) => {
      await memberPage.goto(forkUrl);
      await expect(
        memberPage.getByRole('heading', { name: 'Rank your top 3' })
      ).toBeVisible();
      const options = memberPage.getByRole('list', { name: 'Rank the spots' });
      for (const index of picks) {
        await options.getByRole('button').nth(index).click();
      }
      await memberPage.getByRole('button', { name: 'Cast your vote' }).click();
      await expect(
        memberPage.getByText('Your ballot is in. Revote until it closes.')
      ).toBeVisible();
    };

    // member1 stays open — it must receive the close over SSE.
    const m1Context = await browser.newContext({
      storageState: storageStateFor('member1'),
    });
    const m1Page = await m1Context.newPage();
    await castBallot(m1Page, [0, 1]);

    const m2Context = await browser.newContext({
      storageState: storageStateFor('member2'),
    });
    await castBallot(await m2Context.newPage(), [0, 2]);
    await m2Context.close();

    // Organizer sees the live tally move (SSE).
    await expect(page.getByText(/(Marco|Mia).*voted/)).toBeVisible({
      timeout: 15_000,
    });

    // --- Organizer's ballot reaches quorum → immediate close --------------
    const organizerOptions = page.getByRole('list', { name: 'Rank the spots' });
    await organizerOptions.getByRole('button').nth(0).click();
    await organizerOptions.getByRole('button').nth(2).click();
    await page.getByRole('button', { name: 'Cast your vote' }).click();

    // Quorum hit in the same request: theater plays for the organizer.
    await page.getByRole('button', { name: 'Skip to the result' }).click();
    await expect(page.getByText("We're going here.")).toBeVisible();
    await expect(page.getByText('The tally')).toBeVisible();
    // exact: the reveal context also contains "Clear winner with N points".
    await expect(page.getByText('Winner', { exact: true })).toBeVisible();

    // member1's still-open page converges on the same close over SSE.
    await expect(
      m1Page.getByRole('heading', { name: 'It’s decided' })
    ).toBeVisible({ timeout: 15_000 });
    await expect(m1Page.getByText("We're going here.")).toBeVisible({
      timeout: 10_000,
    });
    await m1Context.close();
  });
});
