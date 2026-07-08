/**
 * Mobile PWA audit walkthrough — iPhone 13 Pro (390x844 @3x) against the
 * local production server. Screenshots every surface and measures, per
 * page: horizontal overflow (with offending elements) and interactive
 * targets smaller than 44px. Not a test — an evidence gatherer.
 *
 * Usage: npx tsx scripts/v2/mobile-audit.ts
 * Output: /tmp/fitr-mobile/<nn>-<name>[-dark].png + report.json
 */
import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { TEST_SQUAD, SQUAD_PASSWORD } from './test-squad';
import fs from 'node:fs';

const BASE = 'http://localhost:3000';
const OUT = '/tmp/fitr-mobile';
const ASTORIA = { latitude: 40.763, longitude: -73.921 };

const IPHONE_13_PRO = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
};

type PageFinding = {
  name: string;
  url: string;
  scrollWidth: number;
  innerWidth: number;
  overflowEls: string[];
  smallTargets: { desc: string; w: number; h: number }[];
  consoleErrors: string[];
};

const findings: PageFinding[] = [];
let shot = 0;

async function inspect(page: Page, name: string, errs: string[]) {
  // Let fonts/reveals settle.
  await page.waitForTimeout(600);
  const data = await page.evaluate(() => {
    const iw = document.documentElement.clientWidth;
    const overflowEls: string[] = [];
    const seen = new Set<Element>();
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > iw + 1 || r.left < -1) {
        // skip children of an already-reported offender
        let p = el.parentElement;
        let covered = false;
        while (p) {
          if (seen.has(p)) {
            covered = true;
            break;
          }
          p = p.parentElement;
        }
        if (covered) continue;
        seen.add(el);
        const cls = (el.getAttribute('class') || '').slice(0, 80);
        overflowEls.push(
          `<${el.tagName.toLowerCase()} class="${cls}"> rect ${Math.round(r.left)}..${Math.round(r.right)} (vw ${iw})`
        );
      }
    }
    const smallTargets: { desc: string; w: number; h: number }[] = [];
    const sel =
      'a[href], button, input, select, textarea, [role="button"], [role="switch"], [role="tab"], [role="option"]';
    for (const el of Array.from(document.querySelectorAll(sel))) {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (
        r.width === 0 ||
        r.height === 0 ||
        style.visibility === 'hidden' ||
        style.display === 'none'
      )
        continue;
      // fully offscreen = not currently actionable
      if (r.bottom < 0 || r.top > window.innerHeight * 3) continue;
      if (r.height < 43.5 || r.width < 43.5) {
        const text = (el.textContent || '')
          .trim()
          .replace(/\s+/g, ' ')
          .slice(0, 40);
        const label = el.getAttribute('aria-label') || '';
        smallTargets.push({
          desc: `<${el.tagName.toLowerCase()}> "${label || text}"`,
          w: Math.round(r.width),
          h: Math.round(r.height),
        });
      }
    }
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: iw,
      overflowEls,
      smallTargets,
    };
  });
  findings.push({
    name,
    url: page.url(),
    consoleErrors: [...errs],
    ...data,
  });
  errs.length = 0;
  shot += 1;
  const file = `${OUT}/${String(shot).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(
    `${name}: scroll ${data.scrollWidth}/${data.innerWidth}` +
      (data.overflowEls.length ? ` OVERFLOW x${data.overflowEls.length}` : '') +
      (data.smallTargets.length
        ? ` small-targets x${data.smallTargets.length}`
        : '')
  );
}

function watchConsole(page: Page, errs: string[]) {
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text().slice(0, 200));
  });
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    localStorage.setItem('fitr-v2-theme', t);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(t);
  }, theme);
}

async function newPage(ctx: BrowserContext): Promise<{
  page: Page;
  errs: string[];
}> {
  const page = await ctx.newPage();
  const errs: string[] = [];
  watchConsole(page, errs);
  return { page, errs };
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  // ---- signed-out sweep --------------------------------------------------
  const anon = await browser.newContext({
    ...IPHONE_13_PRO,
    geolocation: ASTORIA,
    permissions: ['geolocation'],
  });
  {
    const { page, errs } = await newPage(anon);
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await inspect(page, 'home-signed-out', errs);
    await setTheme(page, 'dark');
    await inspect(page, 'home-signed-out-dark', errs);
    await setTheme(page, 'light');

    for (const [name, path] of [
      ['sign-in', '/sign-in'],
      ['sign-up', '/sign-up'],
      ['privacy', '/privacy'],
      ['offline', '/offline'],
      ['unsubscribe-bad-token', '/unsubscribe?token=bad'],
      ['places-join-bad-token', '/places/join?token=bad'],
      ['not-found', '/definitely-not-a-page'],
    ] as const) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
      await inspect(page, name, errs);
    }
    await page.close();
  }

  // ---- organizer signs in ------------------------------------------------
  const organizer = TEST_SQUAD.find((m) => m.role === 'organizer')!;
  const authed = await browser.newContext({
    ...IPHONE_13_PRO,
    geolocation: ASTORIA,
    permissions: ['geolocation'],
  });
  const { page, errs } = await newPage(authed);
  await page.goto(`${BASE}/sign-in`, { waitUntil: 'domcontentloaded' });
  await inspect(page, 'sign-in-form', errs);
  await page.getByLabel('Email or username').fill(organizer.email);
  await page.getByLabel('Password').fill(SQUAD_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 30000 });
  await page.waitForTimeout(1200);
  await inspect(page, 'home-signed-in', errs);

  // Quick spin from home (near me) if offered.
  const useLocation = page.getByRole('button', { name: 'Use my location' });
  if (await useLocation.isVisible().catch(() => false)) {
    await useLocation.click();
    await page.waitForTimeout(2500);
    await inspect(page, 'home-quickspin', errs);
  }

  // ---- /new: build a ballot, create a vote fork ---------------------------
  await page.goto(`${BASE}/new`, { waitUntil: 'load' });
  await inspect(page, 'new-empty', errs);
  await page.getByRole('button', { name: 'Use my location' }).click();
  const addButtons = page.getByRole('button', { name: /^Add / });
  await addButtons.first().waitFor({ timeout: 15000 });
  for (let i = 0; i < 3; i++) await addButtons.first().click();
  await page
    .locator('label')
    .filter({ hasText: 'Everyone ranks their top 3' })
    .click();
  await page.getByLabel('Close early after this many votes').fill('3');
  await inspect(page, 'new-ballot-built', errs);
  await page.getByRole('button', { name: 'Fork it' }).click();
  await page.waitForURL(/\/f\/[a-z2-9]{10}/, { timeout: 20000 });
  const code = page.url().match(/\/f\/([a-z2-9]{10})/)![1];
  await page.waitForTimeout(1200);
  await inspect(page, 'fork-room-organizer-open', errs);
  await setTheme(page, 'dark');
  await inspect(page, 'fork-room-organizer-open-dark', errs);
  await setTheme(page, 'light');

  // ---- guest view of the same fork ----------------------------------------
  {
    const guest = await browser.newContext({ ...IPHONE_13_PRO });
    const { page: gp, errs: gerrs } = await newPage(guest);
    await gp.goto(`${BASE}/f/${code}`, { waitUntil: 'load' });
    await inspect(gp, 'fork-room-guest', gerrs);
    // rank all three, fill name, but screenshot before submitting
    const options = gp.getByRole('list', { name: 'Rank the spots' });
    const count = await options.getByRole('button').count();
    for (let i = 0; i < Math.min(3, count); i++) {
      await options.getByRole('button').nth(i).click();
    }
    const nameField = gp.getByLabel(/name/i).first();
    if (await nameField.isVisible().catch(() => false)) {
      await nameField.fill('Mobile Auditor');
    }
    await inspect(gp, 'fork-room-guest-ranked', gerrs);
    const voteBtn = gp.getByRole('button', { name: /vote|lock/i }).first();
    if (await voteBtn.isVisible().catch(() => false)) {
      await voteBtn.click();
      await gp.waitForTimeout(1500);
      await inspect(gp, 'fork-room-guest-voted', gerrs);
    }
    await guest.close();
  }

  // organizer: decide now (early close) to capture the reveal
  await page.reload({ waitUntil: 'load' });
  const decideBtn = page.getByRole('button', { name: /decide now/i });
  if (await decideBtn.isVisible().catch(() => false)) {
    await decideBtn.click();
    await inspect(page, 'fork-room-decide-dialog', errs);
    const confirm = page
      .getByRole('dialog')
      .getByRole('button', { name: /decide|end|close/i })
      .first();
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
      await page.waitForTimeout(2500);
      await inspect(page, 'fork-room-result', errs);
      await setTheme(page, 'dark');
      await inspect(page, 'fork-room-result-dark', errs);
      await setTheme(page, 'light');
    }
  }

  // ---- places ---------------------------------------------------------------
  await page.goto(`${BASE}/places`, { waitUntil: 'load' });
  await inspect(page, 'places', errs);
  // search
  const search = page
    .getByRole('searchbox')
    .or(page.getByPlaceholder(/search/i))
    .first();
  if (await search.isVisible().catch(() => false)) {
    await search.fill('pizza');
    await search.press('Enter');
    await page.waitForTimeout(2000);
    await inspect(page, 'places-search-results', errs);
  }
  // discovery browse near me
  const browseBtn = page
    .getByRole('button', { name: /around|near|location/i })
    .first();
  if (await browseBtn.isVisible().catch(() => false)) {
    await browseBtn.click();
    await page.waitForTimeout(2500);
    await inspect(page, 'places-discovery', errs);
  }
  // first list detail if any
  const listLink = page.locator('a[href^="/places/l/"]').first();
  if (await listLink.isVisible().catch(() => false)) {
    await listLink.click();
    await page.waitForTimeout(1200);
    await inspect(page, 'list-detail', errs);
  }

  // ---- crew -----------------------------------------------------------------
  await page.goto(`${BASE}/crew`, { waitUntil: 'load' });
  await inspect(page, 'crew', errs);
  const crewLink = page.locator('a[href^="/crew/"]').first();
  if (await crewLink.isVisible().catch(() => false)) {
    await crewLink.click();
    await page.waitForTimeout(1200);
    await inspect(page, 'crew-detail', errs);
  }

  // ---- account ---------------------------------------------------------------
  await page.goto(`${BASE}/account`, { waitUntil: 'load' });
  await inspect(page, 'account', errs);
  await setTheme(page, 'dark');
  await inspect(page, 'account-dark', errs);
  await setTheme(page, 'light');
  // open the password form if collapsed
  const pwBtn = page.getByRole('button', { name: /password/i }).first();
  if (await pwBtn.isVisible().catch(() => false)) {
    await pwBtn.click();
    await inspect(page, 'account-password-open', errs);
  }

  // ---- gallery + admin --------------------------------------------------------
  await page.goto(`${BASE}/gallery`, { waitUntil: 'load' });
  await inspect(page, 'gallery', errs);
  await page.goto(`${BASE}/admin`, { waitUntil: 'load' });
  await inspect(page, 'admin-or-404', errs);

  fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(findings, null, 2));
  console.log(`\nDone. ${shot} screenshots + report.json in ${OUT}`);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
