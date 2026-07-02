# Session Handoff — Fork In The Road portfolio upgrade

**Last updated:** 2026-07-02 (C14 complete — **Phase 3 UI refresh DONE, all C-tasks ✅** — plus C15 bug-fix follow-ups landed on the same branch; NOT pushed, owner go-ahead pending)
**Read this first, then:** `promptFiles/phased-execution-plan.md` (the authoritative plan), `CLAUDE.md` (repo guide).

## Workflow rules (owner-set 2026-06-11 — do not deviate)

- **One branch per phase/work session, multiple logical commits** — do NOT
  create stacked/multiple branches again (Phase 1's 13-branch stack prompted
  this rule).
- **The owner handles ALL PR merges personally.** Never merge PRs or push to
  main; production deploys from main.
- **NEVER `git push` — any branch — without the owner's explicit go-ahead**
  (owner-set 2026-06-11). Commit locally as work completes; when ready, say
  "ready to push" and wait.

## Phase 1 status: MERGED ✅ (PR #45, 2026-06-11)

The owner squash-merged `phase1/auth-matrix` (top of the stack, contains
everything) into main as PR #45 (`c357be3e`). Production deployed READY and
the live site was verified healthy. The stacked branches below are historical
record only — the other 12 PRs/branches can be closed/deleted:

1. `feature/upgrade-plan-rework` — setup docs + skills (this file, plans, CLAUDE.md)
2. `phase1/middleware-auth` — public-route matcher tightened (decisions/collections/restaurants/address APIs were PUBLIC)
3. `phase1/remove-debug-endpoints` — debug/push-notifications + migrate/clear-collections deleted; notifications/test admin-gated
4. `phase1/admin-route-auth` — requireAdminAuth across admin/monitoring; timing-safe CRON_SECRET (vercel-monitoring had NO check); webhook fails closed in prod
5. `phase1/collections-decisions-auth` — verifyCollectionAccess + group-membership checks; fixed group-weight-reset deleting personal history; fixed participants id-form mismatch
6. `phase1/friends-groups-auth` — friends routes had zero auth/full IDOR → session-derived identity; groups/[id] GET membership-gated; non-friend emails masked
7. `phase1/notification-channel-auth` — SMS/email sends restricted to caller's own verified targets; unsubscribe enumeration closed
8. `phase1/rate-limiting` — Mongo-backed limiter (src/lib/rate-limit.ts) on sms/email/auth/verify-phone; fixed check-username being edge-blocked for signed-out users (every username looked taken!)
9. `phase1/db-connection` — db.ts cached-client-promise singleton; `db` export removed
10. `phase1/deps-dependabot` — caret ranges (Playwright stays pinned), audit 40→7 vulns (rest need Phase 2 majors), dependabot.yml
11. `phase1/no-console` — structured logger everywhere in src/; no-console ESLint rule (sole exemption: logger.ts)
12. `phase1/repo-hygiene` — .cursorrules gone, codemod scripts pruned, local TLS certs moved out of public/, README placeholder removed
13. `phase1/auth-matrix` — docs/api-auth-matrix.md (route-by-route auth posture + required env vars + known gaps)

Validation: full Jest suite green at every push (1468 tests; husky pre-push runs
type-check/lint/jest/build); `test:e2e:fast` green on the full stack (45 passed).

**Resolved at merge time (2026-06-11):**

- **Vercel env vars: ALL FIVE CONFIRMED SET in the Vercel project**
  (`ADMIN_ALERT_EMAILS`, `INTERNAL_API_SECRET`, `CRON_SECRET`,
  `CLERK_WEBHOOK_SECRET`, `ADMIN_USER_IDS`). Note `ADMIN_ALERT_EMAILS` is
  still absent from local `.env.local`/`.env.prod` if syncing those matters.
- **Lockfile registry poisoning (found + fixed):** every Vercel deploy since
  Oct 2025 failed at `npm install` with E401 because 749 `package-lock.json`
  `resolved` URLs pointed at the owner's old corporate Artifactory proxy
  (`elilillyco.jfrog.io`, from a now-commented-out `~/.npmrc` line). Local
  installs masked it via warm npm cache. Fixed in `3fbf212` (URLs rewritten
  to registry.npmjs.org; integrity hashes unchanged). **Watch for
  re-poisoning** if the lockfile regenerates while that npmrc line is active:
  `grep -c elilillyco package-lock.json` must be 0.
- `gh` CLI still has a stale token for the wrong account (apersad_deloitte) —
  PRs cannot be created from the CLI until the owner runs
  `gh auth login -h github.com` as akpersad. Owner merges via the GitHub UI.
- See "Known gaps / deferred" in docs/api-auth-matrix.md (unsubscribe token
  redesign → Phase 5; dead auth/\* routes are deletion candidates).

## Post-merge: Dependabot majors (MERGED ✅ as PR #59, `927bf9b`)

Merging Phase 1 activated dependabot.yml; it opened major-bump PRs, two of
whose preview builds failed. Resolution (merged 2026-06-11):

- **typescript ^6.0.3 ADOPTED** — TS 6's new TS2882 check requires
  declarations for side-effect asset imports; `src/types/css.d.ts`
  (`declare module '*.css'`) fixes it. type-check/lint/jest/build all green.
- **eslint stays ^9** — eslint 10 removed `context.getFilename()`, which
  eslint-plugin-react (bundled by eslint-config-next, peer eslint ≤^9.7)
  still calls. Not fixable on our side; dependabot now ignores eslint majors.
- **eslint-config-next stays ^15.x** (bumped to ^15.5.19) — v16 works
  mechanically but introduces the React Compiler hooks rules
  (`react-hooks/refs` etc.) = ~74 lint errors; adopt during the Phase 2
  Next 16 upgrade. Dependabot ignores its majors too.
- The dependabot typescript PR auto-closes now that main has 6.0.3; the
  remaining green dependabot PRs (twilio 6, glob 13, …) are the owner's
  call — note twilio 6 and glob 13 are ALSO majors, just ones that built
  green; review before merging.

## Naming

The product is **Fork In The Road** (repo `you-hungry` is historical). Never "You Hungry" in user-facing text or new docs.

## Where we are

**Status: Phase 2 MERGED ✅ (PR #60, `29cf15c`, 2026-06-12).** Post-merge
verification (2026-06-12, same day):

- **Production deploy on Next 16/Turbopack: READY** (`bundler: turbopack` in
  deploy meta); live site returns 200.
- **CI workflow on the merge commit: success.** `badges` branch auto-created;
  endpoint JSON serving (coverage 44.06%, 1551 tests passed) and README
  badges render.
- **Lockfile poisoning regression check: clean** (`grep -c elilillyco
package-lock.json` = 0).
- **Defect 1:** Vercel attempts to deploy the orphan `badges` branch
  on every badge push and ERRORs (no Next app there). Fixed on
  `housekeeping/post-phase2-verification`: the publish-badges job now writes
  a `vercel.json` with `git.deploymentEnabled: { badges: false }` onto the
  branch, which Vercel reads from the deployed commit.
- **Defect 2 — the main-branch Playwright run FAILED** (Accessibility +
  PR Tests jobs; Smoke and Lighthouse passed). Root cause: **Next 16's dev
  overlay** renders its own `role="dialog"` and auto-opens a "Console
  Error" panel whenever an app-level error logs — the trigger was the
  documented Clerk dev-instance flake (intermittent 401 on
  `/api/decisions/history` + `unhandledRejection: NEXT_REDIRECT` from
  `auth.protect()` in middleware, with Clerk's "infinite redirect loop"
  refresh warning in the server log). Strict-mode dialog assertions then
  resolve two dialogs and the overlay intercepts clicks; the modal a11y
  tests failed deterministically even in isolation. **Fix (same branch):
  both Playwright configs now run against `npm run build && npm run start`**
  — no dev overlay exists in production, and e2e now tests what ships.
  Verified: `test:e2e:fast` 43 passed / 2 flaky-passed-on-retry / 0 failed
  (= the 45-green Phase 2 baseline). Note: locally a dev server already on
  :3000 is still reused — kill it for a CI-faithful run. The Clerk
  `NEXT_REDIRECT` unhandledRejection noise still logs server-side
  (clerk#8302 territory; harmless, redirect works) — candidate alongside
  the proxy.ts rename.
- Dependabot re-opened ~10 PRs after the merge (majors: glob 13,
  lint-staged 17, twilio 6, @vercel/analytics 2, @vercel/speed-insights 2,
  actions/checkout 6, setup-node 6, upload/download-artifact, plus a grouped
  minor-and-patch PR). The typescript-6 / eslint-config-next-16 / eslint-10
  PRs auto-closed as expected (first two satisfied by main, third ignored).
  Merging these is the owner's call — CI quality gates now run on each.

All Phase 2 plan items that landed in PR #60:

1. **`--legacy-peer-deps` root cause fixed** — the flag dated to Epic 9 (Oct 2025) pinned-deps peer conflicts; Phase 1 unpinning removed the cause. Verified clean `npm ci` from empty node_modules; flag removed from workflows, runners moved Node 20 → 22 (engines requires >=22).
2. **`ci.yml` quality gates** — types / eslint --max-warnings=0 / prettier --check / jest --coverage (summary + artifact) / production build on every PR+push; `pre-push` now mirrors CI exactly (added --max-warnings=0 + format:check). Repo-wide prettier normalized; vendored skills (.agents/, .github/skills/, .cursor/) prettier-ignored.
3. **CI-generated badges** — `publish-badges` job (main pushes) writes shields endpoint JSON (coverage %, test count) to the `badges` branch; README badges now CI workflow badges + endpoint badges. **The fabricated README claims (91.2% coverage, "90+" Lighthouse) were replaced with measured reality.**
4. **Lanes** — new `E2E Smoke` job (--grep @smoke); Lighthouse a11y category warn → **error** at 0.9 (measured 0.93–1.0 locally); perf/BP/SEO stay warn. `docs/ci-quality-gates.md` lists every check name + the **owner-action branch-protection setup** (GitHub UI, one-time).
5. **Coverage honesty pass** — real coverage was **42%, not the asserted 90%+** (old 60% jest threshold never executed in any gate). New tests: auth.ts 0→100%, decisions.ts 37→99.6% lines (45 edge tests), notification-service.ts functions 37.5→100% (all channels factory-mocked — no live sends), verifyCollectionAccess 100%. Thresholds now ratchet-only floors at measured reality (43L/43S/34F/38B). Suite: 1551 passed / 120 suites. **Source bugs found while testing (NOT fixed, candidates for later):** tiered-consensus NaN/TypeError when a voted restaurant leaves the collection; voteBreakdown understates ranks >3; getCurrentUser auto-creates with placeholder email/name in prod; ADMIN_USER_IDS compares Mongo \_id not Clerk id; hardcoded admin phone in notification-service.
6. **Next 15 → 16 + Clerk 6 → 7 + eslint-config-next 16** (Clerk 7 was REQUIRED — Clerk 6 has no Next 16 peer support):
   - Turbopack now default: --turbopack flags dropped; build:webpack → `next build --webpack`; webpack config in next.config.ts gated behind explicit --webpack; removed-in-16 `eslint` config option deleted; tsconfig rewritten by Next (jsx react-jsx, .next/dev/types).
   - Clerk 7: ClerkProvider afterSignInUrl/afterSignUpUrl → signInFallbackRedirectUrl/signUpFallbackRedirectUrl + afterSignOutUrl moved off UserButton to provider; appearance variables renamed (colorInput/colorInputForeground/colorForeground/colorMutedForeground); CustomRegistrationForm imports useSignUp from `@clerk/nextjs/legacy` (v6 resource shape — the new signals API is a future refactor).
   - **middleware.ts deliberately NOT renamed to proxy.ts**: clerk/javascript#8302 (OPEN) — auth.protect() in proxy mode redirects to current URL instead of sign-in = route-protection bypass, exactly our pattern. Migrate when that closes. middleware.ts is deprecated-not-removed in 16.
   - React Compiler hooks rules: all 74 errors fixed across ~30 files (set-state-in-effect 36, refs 18, immutability 10, static-components 8, + misc); 1 justified eslint-disable total. eslint.config.mjs migrated off FlatCompat to native flat configs.
   - sw.js cache bumped v26 → v27. dependabot ignore for eslint-config-next majors removed (eslint 10 ignore stays — retest deliberately, config-next 16 peers eslint >=9).
   - **Tailwind 4.0.14 → 4.3.0** (the plan's "minor bump at most"). Came with an a11y-lane determinism fix: PageTransition now honors prefers-reduced-motion, the axe spec emulates reduced motion (axe was scanning mid page-fade — primary button read #ec5f97 = #e3005a half-faded over white, 3.1:1), and local playwright retries are 1 (Clerk DEV-instance usage limits intermittently produce a signed-out render under 4-worker load; CI keeps retries=2).
   - **Validation: full pre-push green + `test:e2e:fast` 45 passed / 0 failed** (same as Phase 1 baseline; 2 a11y tests flaked once under parallel load, pass deterministically in isolation — CI has retries=2).

## Background documents

- `promptFiles/youhungry-upgrade-plan.md` — original upgrade plan from a 17-repo portfolio audit (app scored 7.40, tied #1, chosen as flagship for owner's job search). The audit itself: `../personal-portfolio/promptFiles/repo-audit-2026-06-10.md` (rubric: depth 25% / quality 25% / polish 20% / stack 15% / story 15%, scored 1–10 with anchors).
- `tech-debt-audit.md` (repo root) — separate May 2026 audit; its P1s were merged into Phase 1.
- `promptFiles/phased-execution-plan.md` — **the merged, decision-applied plan. This supersedes both docs above.** 8 phases: Security → CI + Next16/Tailwind4 → UI refresh → README → demo mode/polish → offline-first → AI feature → story.

## Owner decisions made (do not re-litigate)

1. **iOS companion app CUT** — owner won't pay for an Apple Developer account. PWA + offline-first (Phase 6) is the mobile story; AI feature (Phase 7) is the breadth signal. Accepted ~0.15 weighted-score cost (Stack 9 instead of 9–10).
2. **Keep Clerk** — no Supabase auth migration (zero rubric movement, high risk on a live app). Shared login with `../overlapp` is a possible post-plan project.
3. **Next 16 + Tailwind 4 upgrade IN** — closing PRs of Phase 2 (after CI lands, before UI refresh).
4. **UI/UX refresh is Phase 3** — before README/GIF capture so nothing is recorded twice. **Owner is NOT tied to the current color scheme (`#e3005a`)** — Phase 3 starts with a design-direction discussion (palette/typography/style) with the owner before restyling.
5. Tech-debt P1s (rate limiting, `db.ts` serverless fix, dep unpinning + Dependabot) are in Phase 1.

## Environment setup already done

- **Design skills installed** (owner-authorized) into `.agents/skills/`: ui-ux-pro-max, the ckm:_ suite, impeccable (also into `.cursor/` + `.github/`), emil-design-eng, design-taste-frontend(-v1), design-for-ai — plus extras bundled by the ui-ux-pro-max repo (high-end-visual-design, minimalist-ui, redesign-existing-projects, image-to-code, imagegen-_, etc.). Catalog + usage guidance: `DESIGN-UI-UX-SKILLS.md` (repo root). `skills-lock.json` pins versions. Note: `/impeccable init` (PRODUCT.md/DESIGN.md) must run before other impeccable commands — that's a Phase 3 prerequisite.
- **MCP servers registered and health-checked** (local scope in `~/.claude.json`, secrets pulled from `.env.local`): `mongodb` (mongodb-mcp-server, conn string from MONGODB_URI) and `clerk` (@clerk/agent-toolkit local-mcp, CLERK_SECRET_KEY). Both showed ✔ Connected via `claude mcp list`.

## Key technical findings

All the pre-Phase-1 findings (public middleware routes, db.ts side effect, no
rate limiting, pinned deps) were confirmed and FIXED in Phase 1 — see the
status section above and `docs/api-auth-matrix.md`. Still true:

- Only CI is Playwright (`.github/workflows/playwright.yml`) — unit/lint/build enforced only by local husky pre-push. **Phase 2 fixes this.**
- Production is LIVE (fork-in-the-road.vercel.app) with real Clerk/Mongo/Twilio/Resend/push integrations. Suppress real sends in any test/demo work; don't rotate credentials without flagging the owner.
- The Oct 2025 "ios app prep" epic was docs-only — no Swift code exists anywhere.
- Tailwind is ALREADY on 4.0.14 — Phase 2's "Tailwind → 4" item reduces to a minor-version bump at most; the real Phase 2 framework work is Next 15 → 16.
- **LOCAL-DEV GOTCHA — always browse `http://localhost:3000`, NOT
  `forkintheroad.local:3000`.** `/etc/hosts` maps `127.0.0.1
forkintheroad.local` and `.env.local` uses a Clerk **dev** instance
  (`pk_test`) with `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Clerk dev
  instances only trust `localhost`/`127.0.0.1`, so on the custom host the
  client shows you signed-in (Clerk FAPI cookies on accounts.dev) but the
  **server** can't validate the session → `auth.protect()` redirects **every**
  request to `/sign-in`, flooding the log with `NEXT_REDIRECT` /
  `CLERK_PROTECT_REDIRECT_TO_URL` unhandled rejections and 500-ing every data
  fetch (dashboard shows "Internal server error"). This looks like a Mongo or
  app bug and is neither — it's purely the domain mismatch. Making
  `forkintheroad.local` work would need a `pk_live`/satellite domain +
  `allowedDevOrigins` + Clerk-dashboard config; not worth it for local dev.
  Diagnosed 2026-06-30. Separately, `src/middleware.ts` now `await`s
  `auth.protect()` (`1859f81`) — the callback was sync + un-awaited, which by
  itself leaked the rejection as `unhandledRejection` on every protected
  request even on localhost when signed out.

## Housekeeping completed 2026-06-12 (after Phase 2)

- `housekeeping/post-phase2-verification` merged (PR #63).
- All ~10 reopened dependabot PRs consolidated into one rollup
  (`chore/deps-rollup`, PR #64, `11aab7d`): the 18-package minor/patch group
  - majors twilio 6 / glob 13 / lint-staged 17 / @vercel/analytics 2 /
    @vercel/speed-insights 2 + 4 GitHub Actions bumps + the prettier 3.8
    repo reformat. Lockfile verified clean of corporate-registry URLs.
    Dependabot auto-closes its PRs/branches now that main satisfies them.
- All 58 stale remote branches deleted (epic/_, phase1/_ stack, phase2,
  housekeeping, feature/fix branches). Remote is now `main` + `badges` +
  live dependabot branches only.

## Phase 3 — UI/UX refresh: IN PROGRESS (branch `phase3/ui-refresh`)

Design-direction discussion with the owner held 2026-06-12; decisions:

- **Personality: fresh, playful, social** on a **warm & appetizing**
  foundation. References: Airbnb (warm human product craft) + Resy (dining
  culture editorial). Anti-references: delivery-app generic, corporate SaaS
  dashboard, cartoonish/over-gamified, AI-template slop.
- **Palette: warm trio** — tomato/terracotta primary, saffron + olive
  support; **whole canvas warms** (blush-tinted neutrals, hue ~35, both
  modes; dark = warm charcoal). Replaces `#e3005a` infrared.
- **Typography: Fraunces** display serif over existing Geist Sans UI.
- **Both modes ship, light-led.**

`/impeccable init` prerequisite DONE: `PRODUCT.md` (register: product) and
`DESIGN.md` (full token spec, OKLCH) written at repo root — read both before
any design work. Live-mode config at `.impeccable/live/config.json`. The token
system landed in C3 (OKLCH values WCAG-verified as they hit `globals.css`; axe

- Lighthouse a11y gate stays at error level in CI). `manifest.json`
  theme_color + `sw.js` cache were bumped with C3.

### C-task ledger (Phase 3 commit sequence — KEEP CURRENT each checkpoint)

Phase 3 is sequenced as numbered commits **C1–C14**, each resolving a set of
USER-STORIES.md rows (see that doc's "Phase 3 action" column). Status legend:
✅ done · ◧ partial · ▶ in progress / next · ☐ not started. Non-C-task
commits this branch: `be787c6` (design docs), `2a3b623` (PWA install-banner
desktop fix).

| C   | Scope (stories)                                                                                                                                                                                                                                                                                                     | Status   | Commit    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------- |
| C1  | Hazard sweep: gate test consoles, ConfirmDialog on destructive actions, segment error boundaries (X3,X4,O3,R7)                                                                                                                                                                                                      | ✅       | `f29e852` |
| C2  | USER-STORIES.md code-derived story audit                                                                                                                                                                                                                                                                            | ✅       | `2c1ece2` |
| C3  | Warm OKLCH token system + Fraunces + class-driven theming; legacy names aliased; manifest/sw bump (X5)                                                                                                                                                                                                              | ✅       | `835d5af` |
| C4  | `ui/EmptyState` primitive, accent-tint Badge variants, semantic z-index scale (X2 primitive)                                                                                                                                                                                                                        | ✅       | `b566e55` |
| C5  | Landing/marketing restyle (N1–N3) — **no dedicated commit**: page.tsx inherits the warm palette via C3 aliases ("restyle only"). Revisit only if it reads off after the sweep.                                                                                                                                      | (folded) | —         |
| C6  | Decision-first dashboard hero + `/decide` route + SpinReveal + WhyThisPick (N7,S1,S2,S3,S4)                                                                                                                                                                                                                         | ✅       | `61d7e04` |
| C7  | **Loading & empty states (dashboard)**: skeleton lib already existed → made base `Skeleton` decorative + new `SkeletonGroup` (announce once); `CollectionList` loading→skeleton, zero-state→`EmptyState`; activity-feed loading→skeleton rows (N4 done, X1 dashboard). C9–C12 apply skeletons to remaining surfaces | ✅       | `f0ed224` |
| C8  | Group decision full-page flow: VoteBreakdown, localStorage draft, presence line, tap-to-rank, past-decisions (O4,O6,O7,O8,V3,V4,V5,V6,V7)                                                                                                                                                                           | ✅       | `dd9c232` |
| C9  | Restaurant search: skeletons, sort affordance, `normalizeRestaurantId` correctness fix (N6)                                                                                                                                                                                                                         | ✅       | `9472e2e` |
| C10 | Collection cards + restyle: card stats (count/last decided), weight-viz recolor, create-collection (N5,R3,S6)                                                                                                                                                                                                       | ✅       | `7b4628e` |
| C11 | Groups & friends: single Invite flow, cancel sent request via sender DELETE on `api/friends/requests/[id]` (O1,O2,V1,R4)                                                                                                                                                                                            | ✅       | `fae0832` |
| C12 | History + profile restyle: re-decide from history, date grouping, remove fake calendar, manual/confirm/prefs (R1,R2,R5,S5,S7)                                                                                                                                                                                       | ✅       | `0a42114` |
| C13 | Notification center (V2): desktop bell (`6be3bd5`) + shared `NotificationCenterProvider`, mobile More-menu entry w/ unread badge, drawer restyle (Fraunces, warm type-tinted chips, dialog semantics, skeleton, EmptyState)                                                                                         | ✅       | `7ac03a9` |
| C14 | Cleanup: FULL legacy-alias retirement (owner decision A), Mascot removed + error/404 rebuilt on-brand (owner decision B), final USER-STORIES action-column pass                                                                                                                                                     | ✅       | `bb67f6c` |

## Next actions

1. **Owner one-time GitHub UI setup (still pending):** branch protection on
   `main` — required PR checks per `docs/ci-quality-gates.md`
   (Types/Lint/Format, Unit Tests, Build, E2E Smoke, Accessibility,
   Lighthouse). Also still pending: `gh auth login -h github.com` as
   akpersad (CLI can't create PRs until then).
2. **Phase 3 COMPLETE (C1–C14 all ✅, `bb67f6c`)** — see the ledger above and
   the C14 completion notes below. Owner to review + push/PR when ready
   (never push without the owner's go-ahead). Next phase per plan: Phase 4
   (README) — regroup with the owner first.
   Validate each commit against the axe lane + full pre-push.
   C13 notes (`7ac03a9`): **V2** was the last ❌ story — the in-app channel
   existed (Bell/Panel components + `/api/notifications`) but had no
   user-facing entry on mobile and only a bare desktop bell. New
   `src/components/providers/NotificationCenterProvider.tsx` (mounted in
   `layout.tsx` inside `QueryProvider`, wrapping both `AppLayout` and
   `RootNavigation`) holds one `NotificationPanel` + its open state and exposes
   `useNotificationCenter() → { isOpen, open, close }` (safe no-op default so
   consumers never crash without the provider). The panel mounts **only for
   signed-in users** so its polling `useInAppNotifications` hook doesn't run
   otherwise. `Header` dropped its local `useState` + mounted panel and calls
   `open()`; `useMobileNavigation` adds a "Notifications" More-menu action
   (heroicons `BellIcon`) with an unread-count badge, and `QuickActionSheet`
   gained an optional trailing `badge` slot to render it. The panel was
   restyled from a plain white sheet into a drawer: framer-motion slide-in +
   fading backdrop, dialog semantics (`role="dialog"`, `aria-modal`,
   `aria-labelledby`, Escape-to-close, body-scroll lock, focus moved to the
   close control on open), a Fraunces (`font-display`) title, warm
   type-tinted icon chips (tomato/saffron/olive `--*-tint`) replacing the
   floating emoji, `SkeletonGroup` loading rows instead of a spinner, and the
   `EmptyState` primitive with caught-up vs never-had-any copy. Cold hardcoded
   colors removed (`divide-gray-100`, `bg-white`, `bg-black bg-opacity-50`).
   **Token-system root fix (`globals.css`):** the canonical design tokens were
   only CSS vars + hand-written `.bg-*/.text-*` classes, never registered with
   Tailwind — so opacity modifiers (`bg-surface/60`), `divide-*`, `ring-*` and
   utility classes for the accent tints did NOT generate, which is why the
   first cut of the panel used inline `style` props. Fixed properly by adding
   an **`@theme inline`** block that registers the canonical tokens as Tailwind
   colors (`--color-tomato`/`-tint`, `saffron`/`-tint`, `olive`/`-tint`,
   `surface`/`-sunken`, `border`/`-strong`, `ink`/`-secondary`/`-muted`).
   `inline` makes the generated utilities reference the CSS vars directly, so
   the `.dark` overrides still flip them; verified in the compiled CSS
   (`.bg-tomato-tint{background-color:var(--tomato-tint)}`). Purely additive —
   where a name overlaps a hand-written class the values are identical and the
   hand-written (unlayered) rule still wins; the legacy `bg-primary`/`-text`
   aliases (which DO still collide on the `primary` name and stay no-op for
   opacity) are the C14 alias-retirement job. The panel now uses `bg-tomato`,
   `text-olive`, `bg-*-tint` etc. — zero inline color styles remain (only the
   `--z-modal` z-index token, which has no utility equivalent by design).
   No test renders Header/nav/panel, so no suite needed updating. Validation:
   full pre-push green (129 suites, 1612 passed / 12 skipped, build OK) **and
   the axe lane** `test:accessibility` green (22 passed / 9 skipped / 0 failed;
   the `[WebServer]` `/sign-in` redirect noise is the documented harmless Clerk
   dev-instance behavior, clerk#8302 territory).
   C12 notes (`0a42114`): **R2** — `/history` flat list is now
   `groupDecisionsByDate` sections (Today / Yesterday / Earlier this week /
   This month / then `Month YYYY`) with sticky per-group headers; the
   `viewMode` list/calendar toggle and the "Calendar view coming soon"
   placeholder are **gone** (the fake calendar was an anti-slop dead-end).
   Loading is a layout-mirroring `SkeletonGroup` (X1); the zero-state is the
   `EmptyState` primitive with **filter-aware** copy (distinguishes "no
   matches" from "no decisions yet") + a CTA (X2). The redundant duplicate
   mobile/desktop search inputs were collapsed to one. **R1** — every card
   has a "Decide again" action (desktop action column + mobile dropdown);
   `handleDecideAgain` routes personal decisions → `/decide?collectionId=`
   and group decisions → `/groups/[id]`. **S5** — `ManualDecisionForm`
   selects/textarea moved onto `input-base` (dropped `border-quinary`); the
   personal/group radios became a **segmented control** (kept real radio
   inputs + label text "Personal"/"Group" + `role="radiogroup"` so the
   existing `getByLabelText`/`getByRole('combobox')` tests stay green); group
   & restaurant selects gained `htmlFor` labels (1.3.1). **S7** —
   `DecisionResultModal` "Planned visit" box moved off cold
   `text-blue-900/800` onto a warm tomato tint (fill only, no border+shadow);
   reasoning box onto warm ink tokens; `tabular-nums` on dates/amounts. Two
   `DecisionResultModal.test` string assertions were updated for the
   sentence-cased "Planned visit" / "Selection reasoning". **R5/X1** —
   `/profile` full-screen spinner → `ProfileSkeleton` that mirrors the
   settings-card layout; the amount input gained `aria-invalid` +
   `aria-describedby`. The profile loading-state test now asserts the
   skeleton's "Loading profile settings" region. **Note:** the design
   manual (`DESIGN-UI-UX-SKILLS.md`) was expanded and added to
   `.prettierignore` (commit `cfc5063`) — it is hand-formatted and Prettier
   mangles its emphasis + TOC; treat it as a vendored reference doc.
   Validation: full pre-push green (1612 passed / 12 skipped, build OK); axe
   lane `test:accessibility` green (20 passed, 0 failed, 2 flaky = the
   documented dashboard Clerk dev-instance flake, passed on retry).
   C11 notes (`fae0832`): **O2** folded the two competing group-invite
   paths into one — `FriendSelectionModal` gained an optional
   `onInviteByEmail` prop (email field + divider + friend list in one
   "Invite to Group" modal); `GroupView`'s header dropdown is now Edit-only
   and the Members section shows a single primary **Invite** button (the old
   standalone email Modal + `showInviteModal`/`inviteEmail` state/handler are
   gone). **R4** added withdraw-a-sent-request: `cancelFriendRequest` in
   `lib/friends.ts` (deletes only a _pending_ request where `requesterId ===`
   the caller), `DELETE /api/friends/requests/[id]`, `useCancelFriendRequest`,
   and a Cancel button on sent-request cards. **O1/V1** moved the
   Admin/member-count badges off the cold leftover `text-blue-800` onto the
   warm `Badge` primitive (`default` for Admin, `secondary` for the count) and
   gave invitation cards a hover affordance. Pre-push green (1612 passed).
   Note: the GroupView close-modal test asserts the Close control is present
   rather than that the modal unmounts — framer-motion's `AnimatePresence`
   defers unmount in jsdom (the old test only ever checked a never-mounted
   title); actual dismissal is covered in the `FriendSelectionModal` unit test.
   C9 notes (`9472e2e`): search loading now renders a view-aware
   `SkeletonGroup` grid (announces once) instead of a spinner; the sort
   `<select>` is rendered during loading and beside results so it no longer
   pops in only after the first page; the duplicated, brittle restaurant-id
   comparison in `RestaurantSearchPage` (two paths) was replaced by
   `normalizeRestaurantId` / `restaurantIdentityKeys` / `restaurantIdsMatch`
   in `lib/utils` (googlePlaceId-preferred canonical key + key-set
   intersection that still matches legacy bare-ObjectId entries). `lib/utils`
   also gained a shared `formatRelativeDate` consumed by C10.
   C10 notes (`7b4628e`): `getCollectionsByUserId` /
   `getGroupCollectionsByUserId` attach a derived (not persisted)
   `lastDecisionAt` via one grouped aggregation over **completed** decisions;
   dashboard collection cards show restaurant count + "Decided N ago" /
   "Not decided yet". WeightManagement viz moved onto warm tokens (dropped a
   hardcoded cold `text-blue-900` info card; sunk the weight-bar track for
   contrast — the High/Medium/Low bars already alias to olive/saffron/tomato).
   CreateCollectionForm was already token-based, so N5 needed no restyle.
   C8 notes: group-decision voting moved out of the cramped modal into a
   full-page tap-to-rank view (up/down reorder; drag kept for pointers);
   localStorage draft per decision (`fitr-vote-draft:<id>`); re-vote preloads
   the user's own ballot via a new `myRankings` field; quiet live-dot presence
   ("Live · N of M voted") replaces the Connected/Disconnected jargon;
   `VoteBreakdown` (new `decide/VoteBreakdown.tsx`) renders on the completed
   card and in a new Past decisions section (no more 24h history cliff). API:
   `serializeGroupDecision`/`buildVoteBreakdown` in `decisions.ts` now back
   both the REST and SSE group routes (individual ballots stay private — only
   an aggregated breakdown + the requester's own rankings are exposed).
   **All active group-decision e2e specs are `test.skip`** (Google Places /
   multi-session), so behavior changes carried no e2e lane risk.
   **Checkpoint discipline (owner-set 2026-06-12):** at each C-task commit,
   update this ledger (status + hash) AND the USER-STORIES "Phase 3 action"
   column for the rows it resolved — documentation must stay lossless across a
   context clear.
3. ~~Later candidates recorded from the Phase 2 honesty pass~~ **FIXED 2026-07-02
   as "C15" follow-ups on this branch** (all five code candidates; each with
   tests, full pre-push + axe green):
   - `d0bf8ac` — tiered-consensus crash when a voted restaurant left the
     collection (NaN/TypeError → ghost rankings skipped; empty candidate set
     returns null winner) AND >3-rank scoring divergence (scores now strictly
     top-3 3/2/1, matching the visible breakdown; vote API + voteSchema
     reject >3 rankings).
   - `d4ffeab` — getCurrentUser auto-create now uses the real Clerk profile
     (email/name via currentUser(); defers to the webhook when no email) —
     no more 'user@example.com' placeholders in prod; ADMIN_USER_IDS accepts
     BOTH the Mongo \_id and the Clerk id; six routes that hand-parsed
     ADMIN_USER_IDS consolidated onto isAdminUser(); api-auth-matrix updated.
   - `8e91a29` — admin alert phone moved off the hardcoded +18777804236 onto
     **`ADMIN_ALERT_PHONE`** (service skips SMS channel w/ warning when unset;
     admin/sms route 400s for test/alert actions; route also moved onto
     requireAdminAuth). **OWNER ACTION: set `ADMIN_ALERT_PHONE` in Vercel +
     local env files if admin-alert SMS should keep firing** — until then the
     SMS channel is silently (warn-logged) skipped. Note: the admin-gated
     `/notification-test` page still hardcodes the number client-side
     (can't read server env) — cosmetic, admin-only, left as is.
   - Still open (unchanged): proxy.ts rename when clerk#8302 closes, eslint 10
     retest.
     Also fixed en route (`7a0993b`, found by C14 visual spot-check): middleware
     `unauthenticatedUrl` must be absolute — relative '/sign-in' 500'd every
     signed-out protected request (bug was branch-local from `1859f81`, never
     deployed).

## C14 completion notes (2026-07-02, `bb67f6c`) — Phase 3 complete

Executed the pin below exactly; the pin's step list is kept for the record in
git history only (section replaced). What matters going forward:

- **`@theme inline` now registers `--color-bg` + `--color-ink-inverse`** on top
  of the C13 set — every utility (incl. `bg-bg`, `text-ink-inverse`,
  `accent-tomato`) generates from canonical tokens; compiled CSS contains ZERO
  legacy names.
- **~113 files renamed to canonical tokens.** Key discovery during execution:
  pre-C3 there was NO Tailwind color registration at all, so every
  variant-prefixed legacy class (`hover:bg-tertiary`, `focus:ring-primary`,
  `dark:text-text-light`, ~250 sites) had been generating **no CSS ever**.
  Policy applied: hand-written-class names → pure rename (pixel-identical);
  inert `hover:`/`focus:` states → renamed canonical (ACTIVATES the intended
  affordances: tomato focus rings/borders on inputs, sunken hovers, brand
  spinners); inert `dark:` legacy overrides → DELETED (canonical tokens
  self-flip in dark mode; deletion is the pixel-preserving move).
- **`bg-primary` disambiguated by author intent**: plain = canvas → `bg-bg`;
  `/alpha` + `text-white` pairings = brand → `bg-tomato...`; native checkboxes
  `text-primary focus:ring-primary` → `accent-tomato focus:ring-tomato`.
- **Dead code deleted:** unused Button `outline-accent` variant +
  `.btn-outline-accent` CSS (byte-identical duplicate of `.btn-outline`),
  never-imported `src/components/ui/Tabs.css` (referenced vars that never
  existed), unused `.focus\:ring-ring` / `.text-destructive-foreground` rules.
- **Mascot ("Nibbles") removed** per owner decision B; `error.tsx` /
  `not-found.tsx` rebuilt as on-brand typographic pages (Fraunces headline,
  tomato-tint icon chip / giant Fraunces 404 numeral, warm tokens, honest
  copy-led text, quiet `hover:text-tomato` links). Visually verified light +
  dark via production-server screenshots.
- **Bug found & fixed during the visual spot-check (`7a0993b`):**
  `auth.protect({ unauthenticatedUrl: '/sign-in' })` (from `1859f81`, this
  branch only, never deployed) throws ERR_INVALID_URL inside
  NextResponse.redirect — every signed-out visit to a protected route
  **500'd instead of redirecting**. Fixed with
  `new URL('/sign-in', req.url).toString()`; verified 307 → /sign-in.
- Validation: type-check / eslint --max-warnings=0 / prettier / Jest
  (128 suites, 1607 passed / 12 skipped) / production build all green; axe
  lane `test:accessibility` green (22 passed / 9 skipped / 0 failed);
  landing + 404 + sign-in screenshots checked in both modes.
- USER-STORIES.md action column finalized (all rows resolved or explicitly
  deferred with phase); X5 now ✅ C3–C14.

## Owner context

- Owner: Andrew Persad, solo dev; this is a portfolio flagship for a job search.
- Owner prefers being consulted on genuinely owner-level decisions (asked good questions throughout); phases are worked one at a time with regroups between.
