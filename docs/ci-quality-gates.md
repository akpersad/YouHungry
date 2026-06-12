# CI quality gates

Phase 2 made CI the enforcement point for every quality gate. Before this,
only Playwright ran in CI; types/lint/tests/build were enforced solely by the
local husky pre-push hook.

## Workflows

### `ci.yml` — on every PR and push to `main`/`develop`

| Job (check name)        | What it runs                                                           |
| ----------------------- | ---------------------------------------------------------------------- |
| `Types, Lint & Format`  | `tsc`, `eslint --max-warnings=0`, `prettier --check`                   |
| `Unit Tests (Coverage)` | `jest --coverage` — thresholds in `jest.config.js`, summary + artifact |
| `Production Build`      | `next build --turbopack`                                               |
| `Publish Badges`        | main pushes only — writes shields endpoint JSON to the `badges` branch |

### `playwright.yml` — on every PR and push to `main`/`develop`

| Job (check name)                      | What it runs                                        |
| ------------------------------------- | --------------------------------------------------- |
| `E2E Smoke`                           | `playwright test --grep @smoke` (chromium projects) |
| `PR Tests (Chromium + Mobile Chrome)` | full default-project e2e suite                      |
| `Accessibility Tests`                 | axe scan (`e2e/accessibility.spec.ts`)              |
| `Lighthouse Performance`              | `lhci autorun` against a production build           |
| `Nightly Tests (All Browsers)`        | schedule-only, all 5 browsers, 4 shards             |

## Required PR checks (owner action — one-time GitHub UI setup)

Branch protection can only be configured by the repo admin. On
**Settings → Branches → Branch protection rules → `main`**, enable
_Require status checks to pass before merging_ and select:

- `Types, Lint & Format`
- `Unit Tests (Coverage)`
- `Production Build`
- `E2E Smoke`
- `Accessibility Tests`
- `Lighthouse Performance`

(`PR Tests (Chromium + Mobile Chrome)` is intentionally not required — it is
the broad lane; the smoke lane is the fast merge gate. Make it required too
if you prefer stricter merges over merge latency.)

## Badges

`README.md` badges are CI-generated, never hand-edited:

- **CI / E2E** — native GitHub workflow status badges.
- **Tests / Coverage** — shields.io endpoint badges reading
  `tests.json` / `coverage.json` from the `badges` branch, which the
  `Publish Badges` job force-pushes on every `main` push.

## Coverage thresholds

`jest.config.js` enforces global floors set to measured reality at the time
they were introduced (the previous 60% figure never ran in any gate and the
suite was actually at ~42%). Policy: **thresholds only ratchet up** — when a
PR meaningfully raises coverage, raise the floors to just below the new
measured values.

## Lighthouse assertions

`lighthouserc.json` runs against 6 routes, 3 runs each. Category scores
assert at error level for accessibility and warn for
performance/best-practices/SEO (CI runner performance is too noisy to gate
merges on). Thresholds live in `lighthouserc.json`.
