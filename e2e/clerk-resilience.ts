import type { Page } from '@playwright/test';

/**
 * The Clerk dev instance rate-limits under full-suite parallelism and the
 * middleware then renders a raw too_many_requests body instead of the page
 * (documented flake class — see synthetic-monitoring precedent in the v1
 * suite). Bounded retry with backoff; a real failure still surfaces.
 */
export async function gotoResilient(page: Page, path: string): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.goto(path);
    const body = (await page.textContent('body')) ?? '';
    if (!body.includes('too_many_requests')) return;
    await page.waitForTimeout(1500 * (attempt + 1));
  }
  throw new Error(`Clerk dev-instance rate limit persisted for ${path}`);
}
