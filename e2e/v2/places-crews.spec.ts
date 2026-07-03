/**
 * Phase 5+6 exit demos, against the seeded dev database:
 *
 * 1. Places & Lists: search → save into a fresh list → list detail →
 *    "Fork this list" pre-fills the ballot → the fork exists. The list is
 *    deleted at the end (covers delete AND keeps reruns clean).
 * 2. Crews: the seeded organizer + member1 co-participation surfaces a
 *    crew suggestion; accepting it back-attaches the shared history (the
 *    weight board shows decayed and recovered places) and "Run it back"
 *    starts a fresh fork on the last crew ballot.
 *
 * Runs as the organizer (default v2-beta storage state). The crew journey
 * tolerates a previously-accepted crew (local reruns without reseeding)
 * by entering through the crews list instead of the suggestion card.
 */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Places lane: search → save → list → fork-from-list', () => {
  test('the full accelerant loop, then the list retires', async ({ page }) => {
    test.setTimeout(120_000);
    const listName = `E2E keeps ${Date.now().toString(36)}`;

    // Search the seeded cache and keep a first place on a brand-new list.
    await page.goto('/beta/places');
    await expect(
      page.getByRole('heading', { name: 'Your spots, on file' })
    ).toBeVisible();

    await page.getByLabel('Find a spot').fill('Sushi');
    const results = page.getByRole('list', { name: 'Search results' });
    await expect(results.getByText('Sushi Yama')).toBeVisible();

    await results.getByRole('button', { name: 'Save' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Keep Sushi Yama/)).toBeVisible();
    await dialog.getByLabel('New list').fill(listName);
    await dialog.getByRole('button', { name: 'Start it' }).click();
    await expect(page.getByText(`Kept on ${listName}`)).toBeVisible();

    // Second place onto the same list (a one-place list can't fork).
    await page.getByLabel('Find a spot').fill('Taco');
    await expect(results.getByText('Taco Bravo')).toBeVisible();
    await results.getByRole('button', { name: 'Save' }).first().click();
    await expect(dialog.getByText(/Keep Taco Bravo/)).toBeVisible();
    await dialog.getByRole('button', { name: listName }).click();
    // Only the current search's rows render, so exactly one note shows.
    await expect(page.getByText(`Kept on ${listName}`)).toBeVisible();

    // The list shows up in the overview and holds both places.
    await page.getByRole('link', { name: new RegExp(listName) }).click();
    await expect(page.getByRole('heading', { name: listName })).toBeVisible();
    await expect(page.getByText('2 places')).toBeVisible();
    await expect(page.getByText('Sushi Yama')).toBeVisible();
    await expect(page.getByText('Taco Bravo')).toBeVisible();

    // Fork this list → the ballot arrives pre-filled from the list.
    await page.getByRole('link', { name: 'Fork this list' }).click();
    await expect(page).toHaveURL(/\/beta\/new\?list=/);
    await expect(page.getByText('On the ballot (2)')).toBeVisible();

    await page.getByRole('button', { name: 'Fork it' }).click();
    await expect(page).toHaveURL(/\/beta\/f\/[a-z0-9]+/i, {
      timeout: 15_000,
    });
    await expect(page.getByText('Sushi Yama')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Spin the board' })
    ).toBeVisible();

    // Retire the list; places stay in the shared cache.
    await page.goto('/beta/places');
    await page.getByRole('link', { name: new RegExp(listName) }).click();
    await page.getByRole('button', { name: 'Delete list' }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete it' })
      .click();
    await expect(page).toHaveURL(/\/beta\/places$/);
  });
});

test.describe('Crew lane: suggestion → shared board → run it back', () => {
  test.describe.configure({ mode: 'serial' });

  async function openPairCrew(page: Page): Promise<void> {
    await page.goto('/beta/crew');
    await expect(
      page.getByRole('heading', { name: 'Your people, your record' })
    ).toBeVisible();

    // Target the PAIR card specifically — a trio suggestion ("You, Marco &
    // Mia") can accumulate from other spec runs and must not be accepted
    // here. Fresh seed: the suggestion is offered. Local rerun without a
    // reseed: the crew already exists — enter through the crews list.
    const pairCard = page
      .locator('section[aria-label="Crew suggestions"] > div')
      .filter({ hasText: 'You & Marco' });
    if (await pairCard.isVisible().catch(() => false)) {
      await pairCard.getByRole('button', { name: 'Make it a crew' }).click();
    } else {
      await page.getByRole('link', { name: /Olivia & Marco/ }).click();
    }
    await expect(page).toHaveURL(/\/beta\/crew\/[0-9a-f]{24}/);
    await expect(
      page.getByRole('heading', { name: 'Olivia & Marco' })
    ).toBeVisible();
  }

  test('accepting the suggestion lands on the crew with its history attached', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await openPairCrew(page);

    // The shared board carries the back-attached history: Trattoria Nonna
    // (picked 45+ days ago) has fully recovered; Taco Bravo (12 days ago)
    // still holds a reduced slice. Lightest first.
    const board = page.locator('section[aria-label="The shared board"]');
    await expect(board.getByText('Trattoria Nonna')).toBeVisible();
    await expect(board.getByText(/picked .+ · 100%/).first()).toBeVisible();
    await expect(board.getByText('Taco Bravo')).toBeVisible();

    // The receipts are there too.
    const historySection = page.locator('section[aria-label="Crew history"]');
    await expect(
      historySection.getByText('Trattoria Nonna').first()
    ).toBeVisible();
  });

  test('run it back: a fresh fork on the last crew ballot, shared weights live', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await openPairCrew(page);

    await page.getByRole('button', { name: 'Run it back' }).click();
    await expect(page).toHaveURL(/\/beta\/f\/[a-z0-9]+/i, {
      timeout: 15_000,
    });
    // The copied ballot (seeded fixture options) and the organizer's lever.
    await expect(page.getByText('Sushi Yama')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Spin the board' })
    ).toBeVisible();

    // Spin it: the crew fork settles against SHARED decay history server-
    // side (unit-pinned); here the loop closes end to end on the reveal.
    await page.getByRole('button', { name: 'Spin the board' }).click();
    await page.getByRole('button', { name: 'Skip to the result' }).click();
    await expect(page.getByText("We're going here.")).toBeVisible();
  });
});

test.describe('new lanes pass axe (WCAG 2.x AA), both modes', () => {
  for (const lane of [
    { path: '/beta/places', heading: 'Your spots, on file' },
    { path: '/beta/crew', heading: 'Your people, your record' },
  ]) {
    for (const mode of ['light', 'dark'] as const) {
      test(`${lane.path} in ${mode} mode`, async ({ page }) => {
        // Collapse color transitions so the scan never reads a half-flipped
        // theme (v1 axe-lane precedent: mid-fade contrast reads as failing).
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(lane.path);
        await expect(
          page.getByRole('heading', { name: lane.heading })
        ).toBeVisible();
        await page
          .getByRole('group', { name: 'Color mode' })
          .getByRole('button', { name: mode === 'dark' ? 'Dark' : 'Light' })
          .click();
        await expect(page.locator('html')).toHaveClass(new RegExp(mode));

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
});
