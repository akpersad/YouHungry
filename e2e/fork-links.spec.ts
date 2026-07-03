/**
 * Phase 4 exit demo — Fork Links & guest voting, the full group-chat
 * simulation against the seeded dev database:
 *
 * 1. Organizer creates a quorum-3 vote fork; two guests vote from the raw
 *    /f short link in fresh (incognito) contexts with nothing but a name;
 *    the organizer's ballot hits quorum; everyone, guests included, sees
 *    the reveal.
 * 2. The claim journey: a guest votes, signs in, and claims their guest
 *    votes into the account (the ballot follows them).
 */
import { test, expect, type Browser, type Page } from '@playwright/test';
import { TEST_SQUAD, SQUAD_PASSWORD } from '../scripts/v2/test-squad';

// Center of the seeded fixture cluster (scripts/v2/seed-dev.ts).
const ASTORIA = { latitude: 40.763, longitude: -73.921 };

test.use({
  geolocation: ASTORIA,
  permissions: ['geolocation'],
});

/** Organizer builds a near-me quorum-3 vote fork; returns the share code. */
async function createQuorumVoteFork(page: Page): Promise<string> {
  await page.goto('/new');
  await expect(
    page.getByRole('heading', { name: "What's in the running?" })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Use my location' }).click();
  const addButtons = page.getByRole('button', { name: /^Add / });
  await expect(addButtons.first()).toBeVisible({ timeout: 10_000 });
  for (let i = 0; i < 3; i++) {
    await addButtons.first().click();
  }
  await expect(page.getByText('On the ballot (3)')).toBeVisible();

  await page
    .locator('label')
    .filter({ hasText: 'Everyone ranks their top 3' })
    .click();
  await page.getByLabel('Close early after this many votes').fill('3');
  await page.getByRole('button', { name: 'Fork it' }).click();

  await page.waitForURL(/\/f\/[a-z2-9]{10}/);
  return page.url().match(/\/f\/([a-z2-9]{10})/)![1];
}

/** A signed-out browser, cookie jar empty — someone tapping a chat link. */
async function guestContext(browser: Browser) {
  return browser.newContext({ storageState: { cookies: [], origins: [] } });
}

async function rank(page: Page, picks: number[]) {
  const options = page.getByRole('list', { name: 'Rank the spots' });
  for (const index of picks) {
    await options.getByRole('button').nth(index).click();
  }
}

test.describe('guest voting via the fork link', () => {
  test('@critical two guests vote from the raw /f link; quorum closes; everyone sees the reveal', async ({
    page,
    browser,
  }) => {
    test.setTimeout(120_000);

    const code = await createQuorumVoteFork(page);

    // --- Guest 1 (stays open to witness the close over SSE) ---------------
    const g1 = await guestContext(browser);
    const g1Page = await g1.newPage();
    await g1Page.goto(`/f/${code}`);
    // The short link resolves to the fork room.
    await g1Page.waitForURL(new RegExp(`/f/${code}`));
    await expect(
      g1Page.getByRole('heading', { name: 'Rank your top 3' })
    ).toBeVisible();

    // A ballot needs a name — validation is inline, nothing leaves the browser.
    await rank(g1Page, [0, 1]);
    await g1Page.getByRole('button', { name: 'Cast your vote' }).click();
    await expect(
      g1Page.getByText('Pick a name so the group knows who voted')
    ).toBeVisible();

    await g1Page.getByLabel(/Your name/).fill('Priya');
    await g1Page.getByRole('button', { name: 'Cast your vote' }).click();
    await expect(
      g1Page.getByText('Your ballot is in. Revote until it closes.')
    ).toBeVisible();
    await expect(g1Page.getByText(/Voting as Priya/)).toBeVisible();
    // The one quiet account nudge.
    await expect(
      g1Page.getByRole('link', { name: 'Create an account' })
    ).toBeVisible();

    // The SSE stream connected before this guest existed; its frames must
    // not clobber the cast ballot (poll cadence is 2.5s — outlast one).
    await g1Page.waitForTimeout(3_200);
    await expect(
      g1Page.getByRole('button', { name: 'Update your vote' })
    ).toBeVisible();

    // Revote until close is a promise, not a slogan.
    await rank(g1Page, [2]);
    await g1Page.getByRole('button', { name: 'Update your vote' }).click();
    await expect(
      g1Page.getByText('Your ballot is in. Revote until it closes.')
    ).toBeVisible();

    // --- Guest 2 (votes and leaves) ----------------------------------------
    const g2 = await guestContext(browser);
    const g2Page = await g2.newPage();
    await g2Page.goto(`/f/${code}`);
    await g2Page.waitForURL(new RegExp(`/f/${code}`));
    await rank(g2Page, [0, 2]);
    await g2Page.getByLabel(/Your name/).fill('Jordan');
    await g2Page.getByRole('button', { name: 'Cast your vote' }).click();
    await expect(
      g2Page.getByText('Your ballot is in. Revote until it closes.')
    ).toBeVisible();
    await g2.close();

    // --- Organizer watches the tally move, then completes the quorum -------
    await expect(page.getByText(/(Priya|Jordan).*voted/)).toBeVisible({
      timeout: 15_000,
    });
    await rank(page, [0, 1]);
    await page.getByRole('button', { name: 'Cast your vote' }).click();

    // Quorum hit in the same request: theater plays for the organizer.
    await page.getByRole('button', { name: 'Skip to the result' }).click();
    await expect(page.getByText("We're going here.")).toBeVisible();
    await expect(page.getByText('The tally')).toBeVisible();

    // Guest 1's still-open page converges on the same close over SSE —
    // the reveal belongs to everyone, account or not.
    await expect(
      g1Page.getByRole('heading', { name: 'It’s decided' })
    ).toBeVisible({ timeout: 15_000 });
    await expect(g1Page.getByText("We're going here.")).toBeVisible({
      timeout: 10_000,
    });
    await g1.close();
  });

  test('decide now: the organizer ends the vote early and the cast ballots pick the winner', async ({
    page,
    browser,
  }) => {
    test.setTimeout(120_000);

    // Quorum 3 so nothing closes on its own — the early close must do it.
    const code = await createQuorumVoteFork(page);

    const guest = await guestContext(browser);
    const guestPage = await guest.newPage();
    await guestPage.goto(`/f/${code}`);
    await guestPage.waitForURL(new RegExp(`/f/${code}`));
    await rank(guestPage, [0, 1]);
    await guestPage.getByLabel(/Your name/).fill('Noor');
    await guestPage.getByRole('button', { name: 'Cast your vote' }).click();
    await expect(
      guestPage.getByText('Your ballot is in. Revote until it closes.')
    ).toBeVisible();

    // Organizer sees the ballot land, then calls it early.
    await expect(page.getByText(/Noor.*voted/)).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: 'Decide now' }).click();
    await expect(
      page.getByText(/ballot already in picks the winner/)
    ).toBeVisible();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Decide now' })
      .click();

    // The early close plays the theater like any other close.
    await page.getByRole('button', { name: 'Skip to the result' }).click();
    await expect(page.getByText("We're going here.")).toBeVisible();
    // The tally speaks in ballots and picks, never points.
    await expect(page.getByText('1 ballot', { exact: true })).toBeVisible();
    await expect(page.getByText(/first pick ×1/)).toBeVisible();

    // The guest's still-open page converges over SSE.
    await expect(
      guestPage.getByRole('heading', { name: 'It’s decided' })
    ).toBeVisible({ timeout: 15_000 });
    await guest.close();
  });

  test('claim your votes: guest ballot follows the account after sign-in', async ({
    page,
    browser,
  }) => {
    test.setTimeout(120_000);
    const claimer = TEST_SQUAD.find((m) => m.role === 'claimer')!;

    const code = await createQuorumVoteFork(page);

    // Vote as a guest in a fresh browser.
    const guest = await guestContext(browser);
    const guestPage = await guest.newPage();
    await guestPage.goto(`/f/${code}`);
    await guestPage.waitForURL(new RegExp(`/f/${code}`));
    await rank(guestPage, [1, 0]);
    await guestPage.getByLabel(/Your name/).fill('Casey');
    await guestPage.getByRole('button', { name: 'Cast your vote' }).click();
    await expect(
      guestPage.getByText('Your ballot is in. Revote until it closes.')
    ).toBeVisible();

    // Sign in from the same browser (the guest cookie rides along) — by
    // USERNAME, not email: Clerk resolves either to the same account, and
    // this pins that the v2 form doesn't gate the identifier to emails.
    await guestPage.goto(`/sign-in?next=${encodeURIComponent(`/f/${code}`)}`);
    await guestPage
      .getByLabel('Email or username')
      .fill(`fitr_${claimer.role}`);
    await guestPage.getByLabel('Password').fill(SQUAD_PASSWORD);
    await guestPage.getByRole('button', { name: 'Sign in' }).click();
    await guestPage.waitForURL(new RegExp(`/f/${code}`), {
      timeout: 30_000,
    });

    // The claim banner knows about the unclaimed guest identity.
    await expect(
      guestPage.getByText(/Votes cast in this browser as Casey/)
    ).toBeVisible();
    await guestPage.getByRole('button', { name: 'Claim your votes' }).click();
    await expect(
      guestPage.getByText(/Votes cast as Casey are yours now/)
    ).toBeVisible();

    // The claim pointer holds end to end: after a reload the account sees
    // its guest-era ballot as its own.
    await guestPage.reload();
    await expect(
      guestPage.getByText('Your ballot is in. Revote until it closes.')
    ).toBeVisible();
    await expect(
      guestPage.getByRole('button', { name: 'Update your vote' })
    ).toBeVisible();
    await guest.close();
  });
});
