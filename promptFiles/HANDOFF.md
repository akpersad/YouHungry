# Session Handoff — Fork In The Road portfolio upgrade

**Last updated:** 2026-07-06 (post-launch gap fix: **`/account` + notification preferences + push opt-in + password reset**, branch `v2/account`, C1–C4 PUSHED to origin; C5 crew fork-started push BUILT locally awaiting push go-ahead; see CURRENT below)
**Read this first, then:** `promptFiles/v2/CHARTER.md` + `promptFiles/v2/WORKPLAN.md` (the authoritative plan for all v2 work — supersedes `phased-execution-plan.md` phases 4–8), `promptFiles/v2/IDENTITY.md` (the committed v2 design direction), `promptFiles/v2/BACKLOG.md` (post-launch triage + remaining owner items), `CLAUDE.md` (repo guide).

## CURRENT: post-launch gap fix — the account surface (branch `v2/account`, built 2026-07-06)

Owner-identified miss (2026-07-06): the v1 profile section died in the
Phase 7 purge with no v2 replacement — no way to edit personal info, no
way to manage push/email preferences, no push opt-in at all (a PWA whose
service worker had no `push` handler), no forgot-password flow, and the
result email had no unsubscribe. This branch closes all of it. Untracked
in BACKLOG.md because it fell through the cracks rather than being a
decision; treated as a launch-quality gap, not new scope.

Commit ledger:

1. `C1` **Server core.** `lib/v2/account.ts` (identity writes go Clerk →
   Mongo mirror, never the reverse: `setFirstName` via clerkClient —
   first name is the only name the product renders; `changePassword` =
   BAPI verifyPassword → updateUser → revoke other sessions BY HAND
   (Clerk's signOutOfOtherSessions kills the current session too);
   `syncAccountFromClerk` for post-email-change mirroring;
   notification-preference flips + push-subscription add/remove under
   **v1's exact field names** — `preferences.notificationSettings.*`,
   `pushSubscriptions[]` — because migrated prod docs already carry that
   shape and notifications.ts already honors it; token-authorized
   `unsubscribeEmailByToken`). `tokens.ts` grew the domain-separated
   (`unsub:` HMAC prefix) 180-day unsubscribe token. Result email now
   carries a footer unsubscribe link + RFC 8058 List-Unsubscribe
   one-click headers. Zod schemas for the whole new surface. ~35 new
   unit tests (account/tokens/validation/notifications).
2. `C2` **API surface** (`/api/v2/account/*`): PATCH account (rename or
   empty-body Clerk resync, 10/min/user), POST password (5/min/user —
   the brake on current-password guessing), PATCH preferences,
   POST/DELETE push-subscriptions, POST unsubscribe (the one-click
   target; GET 303s to the page). **`public/sw.js` gained `push` +
   `notificationclick` handlers** — push was undeliverable end-to-end
   without them.
3. `C3` **UI.** New `Switch` primitive (role="switch", busy≠disabled,
   ON-state is ink NEVER gold — settings are frame register; gallery
   section added). `/account` (gated with the ?next= round-trip like
   /crew): first-name form, email change via the inline email_code
   custom flow, collapsed password form, the two channel switches, and
   an honest per-device push block (states: unsupported /
   iOS-needs-Home-Screen / no-worker (dev) / permission-blocked / off /
   on; permission asked only on the tap; failed server register rolls
   back the browser subscription; subscribed-but-forgotten devices
   self-heal by re-POSTing). Public `/unsubscribe` landing (token IS the
   auth, no sign-in — flip is idempotent). AppHeader first-name is now
   the door to /account (all widths). **Forgot password** (owner ask
   mid-session): custom reset_password_email_code flow on the sign-in
   card — email → code + new password on one card, reset signs you in,
   other sessions revoked. Privacy page now names the account switches +
   the one-tap unsubscribe.
4. `C4` **e2e + docs**. `e2e/account.spec.ts` (8 tests:
   @smoke profile render + honest save gating, switch persistence across
   reload with restore, both-mode axe scans, signed-out gate round-trip,
   reset-path entry, bad-unsubscribe-link honesty); the Clerk-429
   `gotoResilient` helper promoted to shared `e2e/clerk-resilience.ts`
   and adopted by gallery + launch-surfaces + account specs (the account
   spec's 8 extra parallel loads raised dev-instance 429 pressure).
   CLAUDE.md + this ledger refreshed. **C1–C4 pushed 2026-07-06 on the
   owner's go-ahead** (PR creation/merge is the owner's).
5. `C5` **Crew fork-started push** (owner product call 2026-07-06:
   "push notifications should absolutely happen when a fork is
   started" — CHARTER.md amended in place). `notifyForkStarted` in
   notifications.ts: push-only (email never carries a start notice), to
   crew members minus the organizer, `pushEnabled` honored, same
   fire-and-forget/suppression contract as the close path; fired from
   `createFork` whenever `crewId` is set — today that means "Run it
   back", plus any future crew-attached creation for free. Crew forks
   are the only forks with a known audience at creation; every other
   fork's invite stays the link, per the amended charter. Both push
   kinds share the `fork-<code>` tag, so the result replaces the invite
   in the tray. Copy updated everywhere it claimed one notification:
   /account switches ("Push" switch now names both kinds; e2e-pinned
   "Email results" label kept), privacy page, sw.js comment. Result-push
   sender refactored to a payload-generic `sendPush`. 5 new unit tests
   (audience minus organizer, opt-out honored, spin-mode copy +
   never-emails, gone-crew/solo-crew quiet, never-throws); the three
   fork suites' notifications mocks grew the new export.

**Deliberate scope decisions (documented, not silent):**

- **No e2e rename of squad users** — crew-suggestion copy derives from
  seeded first names and specs run in parallel workers; the rename path
  is pinned by unit tests instead.
- **Fork-started push is crew-only** (C5): non-crew forks have no known
  audience at creation (participants materialize by voting via the
  link), so there is nobody to push to; the link stays the invite.
  No new preference switch — the existing push channel switch governs
  both kinds, and the copy says so.
- **Account deletion stays manual** (privacy-page path) per the existing
  owner-level decision; /account links to it honestly.

**Validation (2026-07-06):** full pre-push green (tsc / eslint
--max-warnings=0 / prettier / **Jest 34 suites, 388 tests** (+30) /
production build with /account + /unsubscribe + 5 account API routes).
**Full chromium e2e 36/36 green** against a fresh production build +
reseeded dev DB (1 flaky-passed on the documented Clerk-429 class);
mobile-chrome smoke lane 6/6. One mid-run failure was the
HANDOFF-documented unseeded-rerun crew-board decay, cleared by
reseeding. Google never billed; sends suppressed.

**Owner actions for this gate:**

1. C1–C4 are pushed; give the go-ahead to push C5, then create + merge
   the PR (gh CLI on this machine is still authed as the wrong account).
2. **Verify the Vercel env still has `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
   `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`** (v1-era vars — do NOT delete
   them in the env cleanup; push now genuinely uses them). Set
   `NEXT_PUBLIC_APP_URL=https://fork-in-the-road.vercel.app` in prod if
   unset (unsubscribe links derive from it; the code falls back to the
   right URL either way).
3. ~~Product call: fork-started push?~~ ANSWERED 2026-07-06 — owner
   said yes; built as C5, charter amended.

## Previous: post-launch. The WORKPLAN is complete.

**Post-merge addendum (2026-07-06, owner-approved, executed same day):**

- **Migration executed for real** (`--execute --into you-hungry`):
  1,432 places upserted (1,430 distinct — two v1 restaurants shared a
  googlePlaceId and merged correctly), 200 lists, 1 crew, 14 closed
  forks (4 crew-attached). Dry-run report reviewed and signed off by
  the owner first (200 lists confirmed right; all skips were e2e
  residue). First execute attempt failed building the unique clerkId
  index: prod held 9 duplicate `+clerk_test` squad-user docs
  (CI-to-prod-era webhook/auto-create race). Owner approved deleting
  the dupes (earliest doc per clerkId kept; delete double-guarded by
  explicit ids + test-email pattern); rerun succeeded.
- **v1 collections archived then DROPPED.** All 14 v1-only collections
  (api_cache, collections, decisions, errorGroups, errorLogs,
  friendships, groupInvitations, groups, location_cache, notifications,
  performanceMetrics, phone_verifications, restaurants, short_urls)
  dumped to lossless gzipped EJSON with per-collection count
  verification, then dropped. **The archive is the only rollback:**
  `~/Documents/Development/PersonalProjects/you-hungry-v1-archive-2026-07-06/`
  (~1.4 MB, owner's machine — worth copying somewhere backed up).
  Prod db is now EXACTLY the ten live v2 collections (users 24,
  places 1430, lists 200, forks 14, crews 1, guests, place_queries,
  error_logs, rate_limits, api_usage). Live site verified 200 on
  / /privacy /manifest.json /sw.js /gallery post-drop.
- **Still open (owner, optional):** close dependabot #82/#70/#67
  (superseded) + #66 (close unmerged — types stay on Node 22); the
  remaining clerk_test squad users in prod `users` are harmless and
  deletable any time; the migrated crew is named "Test Group" (the
  only v1 group with completed decisions) — remove via the product if
  unwanted; everything else lives in `promptFiles/v2/BACKLOG.md`.

## Previous: v2 Phase 8 — Polish, PWA & launch (MERGED ✅ as PR #83 `7cff470`, branch `v2/launch`, 2026-07-05)

WORKPLAN Phase 8 — the launch pass. Scope: PWA (manifest/icons for the
"Tonight's board" identity, a real service worker replacing the Phase 7
self-destruct — SAME `public/sw.js` filename so returning browsers take
the update, in-context install prompt that never fires on first load),
accessibility + performance sweep (INP focus: reveal + voting), the
privacy-policy page (Phase 7 backlog), README/docs/portfolio refresh,
and backlog triage (keep/kill/later decisions with the owner).

Commit ledger (update at every checkpoint):

1. `C1` docs — ledger opened (Phase 7 marked merged, Phase 8 in
   progress).
2. `C2` **PWA identity assets.** New app mark ("Tonight's board" made
   literal): a split-flap board tile, the road you came in on bending
   gold toward the chosen branch, the passed-over branch board-muted,
   the flap seam slicing the glyph. Authored as two SVGs
   (`public/icons/app-icon{,-maskable}.svg`); PNGs (192/512 any +
   maskable, apple-touch 180, PNG-in-ICO favicon) rasterized by
   `scripts/v2/render-icons.ts` (Playwright chromium — no new image
   deps). manifest.json rewritten for v2 (real routes in shortcuts,
   canvas splash/theme colors, id/scope, maskable entries split from
   any per spec); robots.txt rewritten (dead v1 routes + wrong domain
   out); root layout now links manifest + icons + appleWebApp and
   ships media-switched themeColor. Deleted: all v1 icons, favicon
   SVGs, Next starter SVGs, v1 screenshots + their placeholder docs.
3. `C3` **Real service worker.** `public/sw.js` (SAME filename — it
   takes over from the Phase 7 self-destruct the way that took over
   from v1's worker) is deliberately conservative given the Phase 4
   stale-chunk history: cache-first ONLY for content-hashed
   /\_next/static + the icon set (bounded, FIFO-trimmed), navigations
   network-first with last-known-copy → `/offline` fallback (new
   static page, precached at install, added to the middleware public
   matcher so the precache can't capture a sign-in redirect), /api
   never intercepted (auth-varying JSON + SSE), /admin never cached.
   Registration is production-only in the root layout; dev keeps the
   unregister/evict block (now also evicts `fitr-*`).
4. `C4` **Dependency updates** (owner ask 2026-07-05; supersedes
   dependabot PRs #82/#70/#67/#66 — close them after this merges).
   Taken: the whole minor/patch group (next/eslint-config-next
   16.2.10, clerk 7.5.12, tailwind 4.3.2, prettier 3.9.4 — reformats
   4 files, svix, tsx, axe, lint-staged, bundle-analyzer);
   **mongodb 6.21→7.4 (major)** — raw-driver usage type-checks clean,
   full Jest + seed + smoke e2e green (Jest mocks are full-module
   fakes, driver-version independent); **@playwright/test 1.56→1.61.1**
   (kept exact-pinned per repo convention, chromium re-downloaded);
   **actions/checkout v6→v7** in both workflows (setup-node v6,
   upload-artifact v7, download-artifact v8 already current);
   `npm audit fix` applied. Deliberate deviations: **@types/node
   pinned to ^22, NOT the bot's 26** (runtime is Node 22 everywhere:
   engines, .nvmrc, CI — types must match the runtime; close
   dependabot #66 unmerged); **eslint 10 tried and reverted**
   (eslint-plugin-react inside eslint-config-next crashes at lint
   time; revisit when Next's config catches up) — vestigial
   @eslint/eslintrc removed while there. Remaining audit findings (7:
   postcss-in-next, tmp/uuid-in-@lhci/cli) are transitive dev/build
   tooling with no non-breaking fix. Lockfile verified clean of the
   corporate registry (grep -c elilillyco = 0).
5. `C5` **In-context install prompt** (`components/v2/InstallPrompt`,
   home page below the fold). Never on first load: a per-session
   visit counter gates it to the second visit on. Chromium gets a
   real "Add to home screen" button driving the stashed
   `beforeinstallprompt` event (a pre-hydration inline script in the
   root layout parks the early-firing event on window and suppresses
   Chrome's own mini-infobar); iOS gets the honest one-liner (Share,
   then Add to Home Screen — no API exists); everything else gets
   nothing rather than a dead button. Quiet frame register, zero
   gold. Dismissal permanent; declining the native prompt only quiets
   the session; standalone mode hides it. Hydration-safe via
   useSyncExternalStore (the new react-hooks set-state-in-effect rule
   rejects the naive effect shape — ThemeToggle idiom followed).
   9 unit tests.
6. `C6` **Privacy page** (`/privacy`, static — the Phase 7 backlog
   item; v1's policy described SMS/phone practices that died with
   v1). Honest, concrete, product-true: guest votes carry zero PII,
   accounts hold email/username/display name (passwords live hashed
   at Clerk), location used once per near-me spin and cached by
   neighborhood not by user, the five third parties named, TTLs
   stated, removal = ask via the GitHub repo. Public in middleware,
   in the sitemap (the app's only other indexable pages are / and
   the auth screens), and reachable from a new one-line root-layout
   footer (brass link — the identity's text-safe accent). Verified
   visually in both modes.
7. `C7` **A11y + perf sweep.** INP review of the two hot interactions
   came back clean by construction: the reveal is CSS transform ticks
   re-keyed per flap (never layout), tap-to-rank is a pure array op,
   every close/vote is a small state update + fetch. New
   `e2e/launch-surfaces.spec.ts` (9 tests): manifest/icon/sw wiring
   pins, axe WCAG 2.x AA on /privacy + /offline in BOTH modes, and
   the full install-prompt journey (first-visit hidden → return-visit
   offer → axe with the section visible → permanent dismissal).
   Lighthouse local run vs the CI bars: home 76 perf / 100 a11y,
   gallery 83/100, sign-in/up 76/100 — all above the enforced floors;
   /privacy added to the Lighthouse CI URL set. TWO REAL FIXES found
   by the sweep: (a) the footer privacy Link was prefetching on every
   pageview in production builds (an extra middleware/Clerk hit per
   view — it flooded the Clerk dev instance into 429s across the e2e
   suite); prefetch={false}. (b) seed-dev's per-run reset deleted the
   accepted pair crew but NOT the forks a prior "run it back" journey
   closed under it, so the next unseeded local run saw a today-dated
   winner decay the shared board and the 100% assertion failed — the
   reset now removes that refork residue too. Full e2e 34/34
   (4 mobile-chrome smokes flaked on the documented Clerk dev 429 and
   passed on retry; the new spec navigates through a bounded-retry
   helper for the same class). Full pre-push green.
8. `C8` **README + portfolio story + backlog triage** (this commit).
   README rewritten for post-cutover v2 (three lanes, engine, guest
   security posture, real env/setup/testing, 4 fresh screenshots in
   docs/screenshots captured off the production build);
   `docs/portfolio-story.md` tells the v1→v2 story with the numbers
   (~113k→~20k LOC, 77→20 handlers, 27→10 runtime deps);
   `promptFiles/v2/BACKLOG.md` is the Phase 8 triage — owner launch
   checklist (prod v1-collection drop, Vercel env cleanup, dependabot
   closures), later items (Sentry, WebKit nightly, Node 24, eslint 10,
   new Places API, manifest screenshots, demo GIF), kill list
   (notification center, export, SMS, photos, social login), and the
   root-level v1 reference docs flagged for an owner keep/archive
   call. Stale v1 operational docs deleted (color audits, URL
   shortener, v1 PWA/perf notes, quick-reference,
   features-implemented, troubleshooting-server-actions —
   git-recoverable). WORKPLAN table: Phase 7 ✅ #81, Phase 8 built.

**Validation (2026-07-05):** full pre-push green (tsc / eslint
--max-warnings=0 / prettier / Jest 30 suites 358 tests / production
build with /offline + /privacy static). Full e2e 34/34 against a
fresh production build + reseeded dev DB (4 mobile-chrome smokes
flaky-passed-on-retry, the documented Clerk dev-instance 429 class).
Lighthouse local: all four URLs above every CI floor. Google never
billed; sends suppressed.

**Owner actions for the Phase 8 gate:**

1. Review the branch; go-ahead to push, then owner merges the PR.
2. After merge: close dependabot #82/#70/#67 (superseded) and #66
   (close unmerged — @types/node stays on 22 to match the runtime).
3. Work the BACKLOG.md owner checklist when convenient (prod v1
   collection archive+drop, Vercel Twilio/Google-client env removal,
   keep-or-archive call on the root v1 reference docs).

## Previous: v2 Phase 7 — Cutover & purge (MERGED ✅ as PR #81 `3d4551f`, branch `v2/cutover`, 2026-07-03)

WORKPLAN Phase 7 — the sign-off-gated migration + wholesale v1 deletion.
Scope: route v2 to `/` (retire `/beta` with redirects), one-time v1→v2
data migration script (dry-run against a snapshot; **owner approves before
it touches Atlas — this PR merges only with explicit owner sign-off on the
dry-run**), delete v1 (route tree, components, dead libs, SMS/shortener/
observability stacks, deps), adopt Vercel Analytics/Speed Insights +
minimal admin, rebuild e2e around v2.

Commit ledger (C1–C7 ALL BUILT 2026-07-03; awaiting owner review + the
migration dry-run sign-off before push):

1. `36569a3` `C1` docs — ledger opened (5+6 marked merged, Phase 7 in
   progress).
2. `b5e6c27` `C2` **Migration script.** `scripts/v2/migrate-v1.ts` +
   pure transforms in `src/lib/v2/migration.ts` (22 unit tests):
   restaurants→places (GeoJSON, $-signs→priceLevel), collections→lists
   (group collections → first resolvable admin, group name kept in the
   list name), groups-with-completed-decisions→crews (crews emerge from
   decisions; ceremony-only groups reported, not migrated),
   completed decisions→closed forks (weights re-keyed to place ids,
   `decidedAt = result.selectedAt` so decay history is bit-identical;
   group decisions carry the migrated crewId → shared crew weights
   survive). v2 docs REUSE the v1 `_id` → idempotent upserts, full
   traceability. `users` untouched (shared collection). Dry run is the
   default and strictly read-only; `--execute` demands `--into <db>`
   typed back. **The dry run itself has NOT been executed** — the
   sandbox blocked Atlas reads; owner runs `npm run migrate:v1`
   (read-only) against prod/snapshot and reviews the report. That
   review is the merge gate.
3. `73809f0` `C3` **Cutover.** v2 IS the app: (v2)/beta/_ → /, /new,
   /f/[code] (real page, not an alias), /places, /crew, /gallery,
   /sign-in, /sign-up; single root layout owns the shell (BetaHeader →
   AppHeader); (v1) route tree deleted; `/beta/:path_` 308→`/:path*`
   (fork links in old group chats keep working); middleware public
   matcher rebuilt (pages self-gate with ?next= round-trips); sanitizer
   accepts any same-app path; **public/sw.js replaced with a
   self-destructing worker** (returning prod browsers unregister v1's
   cache-first SW and drop forkintheroad-* caches — real PWA worker is
   Phase 8); sitemap trimmed; root not-found added; app now indexable.
4. `b20f6e8` `C4` **The purge.** All v1 API families, components,
   hooks, 35 lib modules, v1 types/tests, perf-metrics platform, audit
   scripts, public relics. Survivors (v2's only v1 deps): logger, db,
   rate-limit, notification-suppression, api-usage-tracker,
   push-service (slimmed to the one send v2 does). Clerk webhook re-fit
   to the lean v2 user shape. Deps: 17 runtime + 5 dev packages
   removed (twilio, @googlemaps/_, @tanstack/_, framer-motion, …); 151
   packages out of node_modules; lockfile clean of the corporate
   registry (`grep -c elilillyco` = 0). Branch diff vs main:
   **+2,057 / −124,984 lines**; src+e2e+scripts now ~20k LOC.
5. `d9f7251` `C5` **Observability + minimal admin.** Vercel Analytics
   - Speed Insights in the root layout; `/admin` (ADMIN_USER_IDS gate,
     404 otherwise): 30-day third-party spend from api_usage + recent
     unexpected 500s; the 500 path in `lib/v2/http.ts` now records
     {route, message, stack, at} to error_logs (30-day TTL),
     fire-and-forget — a hosted error tracker can replace the single
     `recordServerError` call site when the owner picks one.
6. `898969e` `C6` **e2e + CI rebuilt.** e2e/v2/\* promoted to e2e/ at
   root URLs; v1 suites/fixtures/helpers/no-auth config deleted;
   auth.setup rewritten for the v2 sign-in form; playwright projects =
   setup + chromium (all journeys) + mobile-chrome (@smoke on Pixel 7);
   playwright.yml: seed step in every server job, nightly de-sharded,
   v1 env relics dropped, **required check names unchanged**;
   lighthouserc URLs = / /sign-in /sign-up /gallery; jest coverage
   floors ratcheted UP to post-purge reality (49S/52B/50F/49L vs old
   43/38/34/43).
7. `C7` (this commit) docs — CLAUDE.md rewritten for the post-cutover
   repo; this ledger.

**Validation (2026-07-03):** full pre-push green (type-check / eslint
--max-warnings=0 / prettier / Jest 30 suites, 349 tests, raised
coverage floors / production build — route table is pure v2). **e2e
25/25 green locally** against a production server + freshly seeded dev
DB: every journey (guest voting, claim, 3-user vote SSE reveal, places
accelerant loop, crew re-fork), both-mode axe scans, and the new
mobile-chrome smoke lane. Google never billed; sends suppressed.

**Owner actions needed before merge (the Phase 7 gate):**

1. Run `npm run migrate:v1` (dry run, strictly read-only) with
   MONGODB_DATABASE=you-hungry (or a snapshot restore) and review the
   report — then sign off. The real run (`--execute --into you-hungry`)
   happens at/after merge, before or right after the deploy.
2. After cutover verification: archive (mongodump) then drop the v1
   collections (collections, decisions, restaurants, groups,
   friendships, group_invitations, in_app_notifications, short_urls,
   plus the pre-TTL error_logs/api_usage residue and the e2e residue
   already in prod — ~611 groups, 12 clerk_test users). Owner-level,
   destructive, scriptable with a dry-run.
3. Decide the hosted error tracker (Sentry?) — optional; the minimal
   error_logs capture covers the gap.
4. Vercel env: no new vars needed (V2_TOKEN_SECRET already set);
   Twilio/Google-client vars can be deleted from the project after
   merge.

**Phase-scope decisions (documented, not silent):**

- **/beta redirects are permanent (308)** — old fork links must survive.
- **Firefox/WebKit e2e dropped** (they only ever ran v1 specs in the
  nightly); cross-browser for the v2 suite is a Phase 8 decision.
- **The privacy-policy page went with v1** — it described v1's data
  practices (SMS, phone). Writing v2's honest policy is Phase 8
  backlog.
- **No client Places key, no next/image, no server actions** — the
  next.config blocks for them are gone.
- **jest floors ratcheted** per the coverage policy (never lowered).

## Previous: v2 Phase 5+6 — Places, Lists & Crews (MERGED ✅ as PR #80 `7c88f84`, branch `v2/places-crews`)

WORKPLAN Phase 5+6 (combined per owner decision): the Places & Lists half
plus the Crews & history half, one branch, one PR, HANDOFF checkpoint at
the halfway line (this update IS that checkpoint).

Commit ledger (C1–C3 = Places half DONE; C4–C7 = Crews half + exit demos):

1. `C1` **Consolidated Google Places client** (`lib/v2/google-places.ts`)
   filling the Phase 3 cache seam in `places.ts`: legacy REST endpoints
   (prod key already enabled), single-page fetches, default-closed billing
   gate (`ALLOW_GOOGLE_PLACES=true` or production only — dev/CI/tests can
   never bill; new env var documented in env.example). Cache design: place
   docs keep the 30-day `cachedAt` window; new `place_queries` marker
   collection throttles search calls (nearby 24h on a ~110m grid, text 7d,
   TTL index self-cleans) and preserves Google's relevance order for text
   results. ZERO_RESULTS is cacheable, an outage is not; `dev-*` fixtures
   never re-fetch. Cost tracking: one `api_usage` row per real call via
   v1's tracker (**exempt api-usage-tracker from the Phase 7 purge**).
   Also landed the Phase 3 deferred item: fork results carry winner place
   details via `enrichForkView` on every result-bearing read path.
2. `C2` **List CRUD + save/unsave** (`lib/v2/lists.ts` + routes): create/
   rename/delete, idempotent save/remove, atomic cap guards (100 lists,
   200 places), ownership enforced in the query filter (foreign id = 404,
   no existence leak). Saving IS list membership — no separate flag.
   `placeSummary` consolidated: canonical `toPlaceSummary` in places.ts,
   http.ts re-exports.
3. `C3` **Places lane UI**: `/beta/places` (search + save + lists,
   sign-in round-trip) and `/beta/places/l/[id]` (rename/delete/remove +
   "Fork this list" → `/beta/new?list=` pre-fills the ballot). Shared
   `SaveToListDialog` powers "Keep this one" on the QuickSpin reveal AND
   the fork room result; fork room now shows winner address/rating. No
   gold on the lane (saving is frame work); "Fork this list" is the
   detail page's one gold action. BetaHeader grew the Places nav link.

4. `C4` **Crews server core** (`lib/v2/crews.ts`): suggestions derived
   from repeated co-participation (exact account set, 3+ closed crew-less
   forks; guests never count toward the set but don't disqualify a fork);
   `createCrew` BACK-ATTACHES matching history (closed forks with exactly
   that member set get the crewId) so shared decay weights are live from
   day one, idempotent on the member set; `getCrewView` (members, recent
   results, shared weight board lightest-first); `reforkCrew` re-runs the
   last crew ballot under the crewId (spinFork already scopes history by
   crewId). API: GET/POST /api/v2/crews, GET/PATCH /api/v2/crews/[id],
   POST /api/v2/crews/[id]/refork — all member-gated in the query filter.
5. `C5` **Crew lane UI**: `/beta/crew` (suggestion cards → one gold tap
   makes the crew; crews list; history section with a stats line) and
   `/beta/crew/[id]` ("Run it back" gold, rename, shared weight board as
   text + bar, crew receipts). `getHistoryForUser` added to forks.ts
   (claim pointer honored). BetaHeader: Crew nav link.
6. `C6` **Result notifications** (`lib/v2/notifications.ts`): push +
   email "We're going here." to account-holder participants when a fork
   closes with a result (the item moved here from Phase 4). Fired exactly
   once, by whichever caller's guarded result write landed; fire-and-
   forget (a notification failure can never fail, slow, or double a
   close). Solo decisions stay quiet; guests unreachable by design; v1
   preference opt-outs honored; expired push endpoints pruned. Push gates
   inside push-service, the lean Resend sender gates on the suppression
   seam here — dev/CI/tests never reach a provider.
7. `C7` **Seed + e2e exit demos.** seed-dev.ts: 3 old crew-history forks
   for organizer+member1 (winners 45+ days stale = weight-neutral, so
   existing weight assertions hold) and a per-run reset ($unset crewId on
   seed forks, delete the accepted pair crew) so the suggestion derives
   fresh every run. `e2e/v2/places-crews.spec.ts`: the full accelerant
   loop (search → save into a fresh list via the dialog → second place →
   list detail → "Fork this list" pre-fills the ballot → fork room →
   list deleted) AND the crew journey (pair suggestion accepted → crew
   page shows the back-attached shared board with decayed + recovered
   weights → "Run it back" → spin → reveal; tolerates a pre-accepted
   crew on local reruns). beta.spec's "no v1 chrome" nav assertion
   updated for v2's own lanes nav.

**Validation (2026-07-02):** full pre-push green (type-check / eslint
--max-warnings=0 / prettier / Jest 1875 passed, 12 skipped / production
build with all new routes); **v2 e2e lane 22/22 green** (production
server, reseeded dev DB), including both Phase 5+6 exit demos and
both-mode axe scans of the two new lanes (reduced-motion emulated so
the scan never reads a half-flipped theme — v1 axe-lane precedent).
Google never billed (default-closed gate); all external sends
suppressed by the Phase 1 seam.

**Phase-scope decisions (documented, not silent):**

- **Legacy Places REST endpoints, not the new Places API** — the prod
  key is enabled for them today; migrating needs an owner-level console
  change. Revisit at/after cutover.
- **No photos anywhere in v2** — the legacy photo URL embeds the API key
  client-side, and the paper-and-ink identity is text-forward. photoRef
  is persisted for the future; nothing renders it.
- **No in-app notification center** (WORKPLAN bias honored): push +
  email only, one trigger (fork closed with a result).
- **Saving IS list membership** — no separate global "saved" flag to
  drift out of sync.
- **Crew suggestions require the exact same account set 3+ times** — a
  superset or subset does not count (deliberate: "the same people").

## Previous: v2 Phase 4 — Fork Links & guest voting (MERGED ✅ as PR #79 `4b03743`, branch `v2/fork-links`)

WORKPLAN Phase 4 — the audited unauthenticated-write surface. Scope:

- Public fork page at the existing `/beta/f/[code]` URL: guests see options,
  pick a display name, rank top 3, watch live results — no account.
- Guest identity: signed httpOnly cookie (HMAC design from Phase 1
  `lib/v2/tokens.ts`); revote allowed until close; guest votes merged into
  consensus scoring (Participant = userId XOR guestId, zero guest PII).
- Abuse controls: signed fork vote tokens, per-IP + per-fork rate limits,
  vote caps, expiry enforcement. Security checklist (rate limits, token
  forgery, replay) goes in the PR description.
- "Claim your votes": guest converts to account post-vote, keeps history.
- Result posting: fork page shows winner to everyone; push/email result to
  account-holders only (through the notification-suppression seam).

**Exit demo:** full group-chat simulation — organizer creates fork, two
guests vote from the raw link in incognito sessions, quorum closes it,
everyone sees the reveal. Automated in the v2 e2e lane.

Commit ledger (update at every checkpoint):

1. `16df09a` **docs** — WORKPLAN Phases 5+6 combined (owner decision
   2026-07-02); ledger opened for Phase 4.
2. `83ba6fc` **Server core.** `lib/v2/guests.ts` (signed-cookie guest
   resolution — forged cookies never touch the DB; lazy minting on first
   vote; rename; claim = one-way pointer, idempotent per user, 409 on
   transfer). `forks.ts`: history follows the claim pointer; **claim
   continuity** (a revote after claiming replaces the guest ballot in
   place — one person never becomes two ballots); `MAX_BALLOTS` 100
   enforced atomically in the push guard (revotes exempt); serializeFork
   resolves viewers through claimed guests. `validation.ts`:
   guestDisplayName (trim/collapse, control+format chars rejected — the
   only thing a guest ever tells us) + guestVoteSchema.
3. `20f6847` **API surface.** forks GET + live SSE serve link-bearers
   (viewer = session → signed guest cookie → anonymous, one resolution
   order in `lib/v2/viewer.ts`); open vote forks ship a signed fork token;
   guest vote path layered cheapest-first (token verified BEFORE any DB
   read → per-IP 12/min + per-fork 30/min limits → cookie/mint);
   guests/claim endpoint; per-IP brakes on fork GET (60/min), SSE connect
   (20/min), quick-spin (30/min — closes the deferred Phase 3 item);
   `/f/[code]` root short link → `/beta/f/[code]`; middleware `/f(.*)`
   public. Rate limiting REUSES v1's generic `src/lib/rate-limit.ts`
   (Mongo fixed-window, fails open) — **exempt it from the Phase 7 purge**.
4. `65a0847` **Guest fork room UI.** Sign-in gate dropped from the fork
   page; guests rank + vote with just a display name (inline validation,
   visible label); vote POST carries the fork token; the room keeps a cast
   ballot when SSE frames from a pre-cookie stream say otherwise; copy
   link copies the short `/f/` form; one quiet post-vote account nudge;
   claim banner (offer / honest failure / confirmation) for signed-in
   viewers with unclaimed guest votes.
5. (this commit) **e2e exit demo + docs + auth-form fix.**
   `e2e/v2/fork-links.spec.ts`: the full group-chat simulation (organizer
   creates a quorum-3 fork; two guests vote from the raw `/f` link in
   fresh incognito contexts, including the inline name-required check, a
   revote, and the SSE-frames-don't-clobber-the-ballot regression pin;
   quorum closes; the guest's still-open page converges on the reveal)
   PLUS the claim journey (guest votes → signs in as the seeded `claimer`
   squad user → claim banner → claim → after reload the account owns the
   guest-era ballot). **Root-cause fix found by the claim e2e:** the v2
   sign-in/sign-up submit buttons silently dropped the click until Clerk
   hydrated (`if (!isLoaded) return`) — a fast human hits the same dead
   button; they are now disabled (the honest state) for that brief window.
6. (this commit) **Sign in by email OR username** (owner catch 2026-07-02):
   Clerk resolves `signIn.create({ identifier })` as either — same
   account, same password — and v1 accounts carry usernames, but the v2
   form's `type="email"` rejected usernames before Clerk ever saw them.
   Field is now "Email or username" (`type=text`,
   `autoComplete="username"`); the claim e2e signs in as `fitr_claimer`
   by USERNAME to pin it. Sign-up stays two-field email/password.
7. `22c7e84` **Dev stale-chunk root fix** (owner hit hydration
   mismatches in dev that `rm -rf .next` couldn't clear — the staleness
   was CLIENT-side): `next.config.ts` served
   `Cache-Control: immutable, max-age=1y` on `/_next/static` in dev too
   (safe only for content-hashed prod filenames; dev URLs are stable, so
   browsers kept year-old JS and hydrated stale bundles against fresh
   HTML), and v1's service worker (scope `/`, so it controls `/beta` too)
   cache-firsts `/_next/static` on the same assumption. Fixes: the
   immutable header is production-only; SW registration is
   production-only; BOTH root layouts run a dev-only SW unregister +
   `forkintheroad-*` cache eviction so any browser that picked the SW up
   from a local production run heals itself. Affected browsers need one
   hard reload (Cmd+Shift+R) to flush already-cached chunks out of the
   HTTP cache; clean thereafter.
8. (this commit) **Decide now + a tally that speaks in ballots** (owner
   asks 2026-07-02). (a) The organizer can end a vote early: quiet
   "Decide now" control beside the live line (only when ballots exist),
   confirm dialog (irreversible), POST `/api/v2/forks/[code]/decide` →
   `decideForkNow()` reuses the sealed consensus close, organizer-only
   (403, claim-aware), rejects an empty ballot box. e2e journey added.
   (b) Points never reach users anymore: "7 pts" reads as "7 people".
   `VoteBreakdown` now shows ballots ("3 ballots" header, "N ranked it"
   per row, "first pick ×2 · second ×1" sub-lines; zero rows say "Not
   ranked"); engine reasoning strings rewritten ("Ranked highest across
   3 ballots." / "Dead even at the top between 2 options. The board
   called it."). The 3/2/1 scoring still decides winner and order —
   only the LANGUAGE changed.
9. (this commit) **CI fixes from the PR's first Playwright run.**
   (a) `V2_TOKEN_SECRET` was only in `.env.local`; the CI workflow env
   never had it, so the fork room's server render (which now signs fork
   tokens) 500'd and all four v2 fork journeys failed. The workflow now
   sets a LITERAL test value in every env block (deliberate: it signs
   tokens only on the throwaway in-runner server, and a missing GitHub
   secret would silently 500 again). (b) The v1 dashboard axe
   heading-order failure was structural, not flaky: "Recent Activity"
   was a fixed h3 whose validity depended on CollectionList's h2 being
   rendered — while collections are loading/erroring there is no h2 and
   the page reads h1 → h3. CardTitle grew an `as` prop (default h3
   unchanged) and the dashboard section is now h2, valid in every
   sibling state.

**Validation (2026-07-02):** full pre-push green — type-check / eslint
--max-warnings=0 / prettier / **Jest 148 suites, 1816 passed / 12 skipped
(~40 new tests this phase)** / production build (`/f/[code]` in the route
table). **v2 e2e lane 14/14 green** (`npm run test:e2e:v2`, production
server, seeded dev DB): both Phase 4 journeys + all Phase 2/3 specs incl.
the both-mode axe scans. Places API never billed; all external sends
suppressed by the Phase 1 seam.

**Phase-scope decisions (documented, not silent):**

- **Result push/email to account-holders moved to Phase 5+6** — the
  combined phase already owns "push + email for fork-closed/result"; the
  fork page showing the winner to everyone (guests included) shipped here.
- Orphan guest docs when a first vote fails after minting: accepted
  (inert, zero PII, no retry amplification).
- Guests are only as unique as their cookies by design (a cookie-clearer
  can mint identities); the abuse controls BOUND that (per-IP + per-fork
  rate limits, MAX_BALLOTS 100) rather than pretend to prevent it. The
  fork link is a group-chat capability, not a public poll.

**Security checklist for the PR description (WORKPLAN requires it):**

- **Token forgery** — fork tokens HMAC-SHA256 under `V2_TOKEN_SECRET`,
  constant-time compare, bound to the fork code, expiry = closesAt + 2min
  grace (so an in-flight ballot at close fails with the honest "fork
  closed" error, not "stale token"). Forged/expired/cross-fork tokens are
  rejected before any DB read.
- **Replay** — a replayed vote POST is an idempotent revote for the same
  guest identity (atomic in-place ballot replace); without the victim's
  httpOnly cookie a replayer only mints a fresh guest, bounded by the
  limits below.
- **Cookie forgery** — guest cookie is signed (httpOnly, SameSite=Lax,
  secure in prod); invalid signatures resolve to anonymous without a DB
  hit.
- **Rate limits** — guest votes 12/min/IP + 30/min/fork; fork GET
  60/min/IP (also the enumeration brake on top of ~49-bit codes); SSE
  connects 20/min/IP; claims 10/min/user; quick-spin 30/min/IP. Mongo
  fixed-window, fails open (availability over strictness).
- **Vote caps** — MAX_BALLOTS 100/fork, enforced atomically in the push
  guard; existing voters can still revote at the cap.
- **Expiry enforcement** — lazy settle on every read path; all ballot
  writes guarded on `status: 'open'`.
- **Guest PII** — none: displayName (control/format characters rejected)
  - timestamps only. Ballots stay private for guests exactly as for
    members (aggregates + own rankings).
- **Identity transfer** — claim is one-way and idempotent per user;
  claiming someone else's guest identity is a 409.

## Previous: v2 Phase 3 — The Fork, core loop (MERGED ✅ as PR #78 `669f497`)

All WORKPLAN Phase 3 deliverables are DONE. **The exit demo is automated:
`npm run test:e2e:v2` drives the solo cold-open journey AND a real 3-user
signed-in vote end-to-end** (organizer creates a quorum-3 vote fork, both
members rank from the shared link, the organizer's ballot hits quorum,
member1's still-open page converges on the reveal over SSE). Owner can also
click through everything on `/beta` (dev server + seeded dev DB).

What landed (one commit each, in order):

1. `02cba7e` **Server core.** `lib/v2/forks.ts` grew the whole loop:
   `quickSpin` (ephemeral compute — "Spin again" never poisons the 30-day
   decay history; nothing persists until lock-in), `lockInQuickSpin`
   (closed fork, weights recomputed server-side), `submitVote` (revote
   upsert via guarded $pull+$push, quorum auto-close), `settleFork` /
   `getSettledForkByCode` (**lazy timer enforcement on every read — no
   cron**; overdue vote w/ ballots → consensus close, else expired; all
   status writes guarded on `status:'open'` so racers can't double-close),
   `serializeFork` (ballots stay private — aggregates + viewer's own
   rankings only). `decision-engine.ts`: deterministic `scoreBallots()`
   extracted from `resolveConsensus` so the UI tally never re-rolls the
   tie-break. New `lib/v2/`: `places.ts` (cache-backed 2dsphere nearby +
   vibe filters + search — **the seam Phase 5's Google client fills; Phase
   3 never bills Places**), `auth.ts` (getV2User/requireV2User, webhook-gap
   auto-create from the real Clerk profile, never fabricated emails),
   `validation.ts` (zod for the whole API surface). 76 new unit tests.
2. `43522d6` **`/api/v2` surface.** quick-spin (public, write-free) +
   quick-spin/lock (authed persist); forks create/list/get-by-code
   (link-bearer capability — the unguessable ~49-bit code; Phase 4 extends
   this exact surface to guests with signed tokens)/vote/spin
   (organizer-only); **forks/[code]/live SSE** (each poll runs the settling
   read, so the stream IS the timer auto-close); places nearby+search;
   lists read-only (CRUD is Phase 5). Middleware: `/api/v2(.*)` public —
   every handler guards itself with JSON 401s (fetch/EventSource targets
   must not get HTML sign-in redirects).
3. `2945a4e` **Shell + auth screens.** Shared `ThemeToggle` (gallery now
   inherits the shell header's toggle), quiet `BetaHeader` (no gold in the
   frame), `/beta/sign-in` + `/beta/sign-up` — custom **two-field**
   email/password forms on the v2 primitives (Clerk legacy hooks per the
   repo's Clerk-7 note; sign-up runs the email_code step inline — squad
   `+clerk_test` addresses use OTP 424242; if an instance still requires a
   username, one is derived silently from the email). `?next=` sanitized
   to /beta-tree paths.
4. `d51e0e3` **Fork lane home.** `QuickSpin`: vibe chips → geolocate →
   spin → the reveal; "Lock it in" (signed-in) / "Spin again" (free);
   signed-out gets the full journey + an honest account nudge. All unhappy
   paths designed (blocked location with a way forward, no fix, empty
   cache, failed spin/lock). `OpenForks` "Live now" rail with countdowns
   (renders nothing when empty). New `ButtonLink` primitive (anchors carry
   their own hover/press rules — `:enabled` never matches `<a>`).
5. `32756e4` **Creation flow** (`/beta/new`, server-gated — sign-in
   round-trips straight back). Three source tabs (near me / my lists /
   search) feeding one ballot; mixed-source ballots honestly recorded as
   ad-hoc; mode cards + optional vote quorum; timer chips 15m–2h.
6. `7788267` **Fork room** (`/beta/f/[code]`). Vote: tap-to-rank top 3
   (pure `toggleRank`, unit-pinned), revote until close, live voted-names
   line. Spin: organizer pulls the lever, others watch. SSE drives updates
   and the close; **the reveal theater plays only for a close witnessed
   live** — reloading a closed fork goes straight to the result.
   `VoteBreakdown`: 3/2/1 tally, winner marked by word + position.
7. (this commit) **e2e + docs.** `e2e/v2/fork.spec.ts` (the exit demo);
   `auth-v2.setup.ts` now signs in organizer + member1 + member2 (three
   storage states, sequential — dev-instance rate limits); `beta.spec.ts`
   updated for the real home. HANDOFF + WORKPLAN ledger refreshed.

**Phase-scope decisions made (documented, not silent):**

- **Zero unauthenticated writes in Phase 3.** The signed-out quick spin is
  ephemeral (compute-only); "Lock it in" is the only persistence and is
  authed. Guest writes + rate limits + tokens are Phase 4's audited
  surface, per the WORKPLAN's risk sequencing.
- **Near-me/search read the v2 place cache only** (dev fixtures seed it;
  prod cache fills via Phase 5's consolidated Google client behind the
  same `lib/v2/places.ts` seam). Empty states say so honestly.
- Sign-up e2e is deliberately not automated (dev-instance user creation
  cap); the sign-IN path is covered by the setup project and the sign-up
  form logic by unit tests.

**Validation (2026-07-02):** full pre-push green — type-check / eslint
--max-warnings=0 / prettier / **Jest 1774 passed, 12 skipped (137 suites;
~90 new v2 tests this phase)** / production build. **v2 e2e lane 12/12
green** (`npm run test:e2e:v2`, production server): solo cold-open
signed-out + signed-in lock-in + vibe filter, the full 3-user vote
(quorum close + member1 SSE convergence), shell wiring, and the Phase 2
gallery specs incl. both-mode axe scans — all against the seeded dev DB
(`npm run seed:v2-dev` re-run first; Places API never billed).

**Adversarial review + hardening commit (same session):** a 28-agent
workflow code review of the branch confirmed 10 findings; ALL were fixed at
the root in the closing commit:

- **Vote integrity under concurrency** (the serious cluster): the ballot
  upsert is now a single atomic in-place replace (revotes have no delete
  window) or a presence-guarded push (double-submits can't duplicate
  ballots); closes now **seal** the fork (status flip) first and compute
  consensus from the sealed document, so the persisted result always
  agrees with the persisted ballots, a crashed closer's seal gets finished
  by the next settle, and a rival's result is never overwritten
  (result-absent guard); the zero-ballot expire is guarded on `'votes.0'`
  so a ballot that beats the deadline closes the fork instead of being
  discarded; `spinFork` refuses to report an outcome that lost the
  persistence race.
- **Honest failure classification:** new `V2DomainError` carries
  user-facing messages + status; everything else is a real 500 with a
  generic body (raw driver/internal messages never reach clients);
  `getV2User` no longer swallows DB errors into null (an Atlas blip used
  to read as "Unauthorized").
- **Validation/authorization:** duplicate `optionPlaceIds` rejected
  (one place twice is not a choice); fork creation verifies the caller
  OWNS a `list` source; `places/nearby` no longer coerces absent lat/lng
  to 0,0 (Number(null) footgun); `getOpenForksForUser` now settles each
  candidate, so dead forks can't haunt the "Live now" rail as
  "Closes in 0:00" forever.

**Known deferred items:** result place details (address/rating) on the fork
room use option names only — place-detail enrichment lands with Phase 5;
"keep this one" (save winner to a list) is Phase 5 per WORKPLAN; per-IP
rate limiting on the public quick-spin endpoint rides with Phase 4's abuse
controls (it is read-only + geo-bounded today).

**CI e2e failures diagnosed post-push (2026-07-02) — MAJOR FINDING: the
Playwright CI `MONGODB_DATABASE` secret points at `you-hungry`, i.e. THE
PRODUCTION DATABASE.** Confirmed via Atlas: prod has no v2 collections (so
every v2 spec deterministically timed out: `findNearbyPlaces` had no
places/2dsphere index), and prod contains ~611 `groups` plus 12
`clerk_test` users — the v1 e2e suite has been writing into production on
every CI run since the lanes were built. Repo-side fixes on this branch:

- `playwright.yml`: a "Seed v2 e2e data" step (smoke, PR, nightly jobs)
  runs `npm run seed:v2-dev` before Playwright. The script refuses the
  prod DB name and non-`sk_test` Clerk keys, so while the secret still
  says `you-hungry` the job now fails FAST with an explicit message
  instead of cryptic spec timeouts.
- `seed-dev.ts`: fully idempotent AND concurrent-safe (smoke + PR jobs
  seed the same DB in parallel): history forks upsert by code instead of
  delete-and-reinsert; all unique-key upserts retry once on E11000.
- `synthetic-monitoring.spec.ts` "Decision history has consistent schema":
  the one genuinely flaky failure — the documented Clerk dev-instance 401
  serves the sign-in HTML page which the test fed to JSON.parse. Now
  detected via content-type and skipped with the flake reason instead of
  hard-failing the lane.

**RESOLVED 2026-07-03:** the owner flipped the `MONGODB_DATABASE` secret
to a dedicated e2e database; the next CI run on `f30279b` went fully
green (E2E Smoke, PR Tests, Accessibility, Lighthouse, Build, Unit,
Types/Lint/Format all success). v1 e2e no longer writes to production.
**Still open (owner-level, destructive):** cleanup of the e2e residue
already in prod (~611 `groups`, 12 `clerk_test` users) — script it with
a dry-run before touching Atlas.

## Previous: v2 Phase 2 — Identity & design system (MERGED ✅ as PR #77 `99c4652`)

The owner gate (`/beta/gallery`, both modes) passed and the PR merged
2026-07-02. What landed (one commit each, in order):

1. `4c904d3` **IDENTITY.md — the committed direction: "Tonight's board."**
   Departure-board-for-dinner: calm green-tinted paper frame (bottle-green
   ink, H 120–155 tinted neutrals), ONE rationed gold accent that appears
   only at decision moments, and a mode-invariant dark board — the reveal
   surface is always a lit sign, in both modes. Type: Archivo variable
   (wght+wdth — the width axis IS the display register, `.type-board`
   condensed-caps) + Spline Sans Mono for codes/tallies/timers. Motion:
   "decisive snap" (100–360ms ease-out-quint, zero bounce; the reveal is
   the one sanctioned long moment). Voice: "Fork it / Lock it in / We're
   going here." Every palette pair WCAG-verified numerically (OKLCH→sRGB
   script) BEFORE adoption; light-mode gold is fill-only (1.8:1 — never
   text/edge), brass is its text-safe shade. Explored-and-rejected
   directions recorded in the doc (incl. why not v1-warm, not the three
   AI-default looks).
2. `6d1af4f` **Token system + fonts.** v2.css: semantic custom properties
   flipped by `.dark` (system default via pre-hydration script, v2's own
   localStorage key `fitr-v2-theme`), registered via `@theme inline` so all
   utilities self-flip; board tokens mode-invariant; tinted layered
   elevation (`shadow-lift/float`); `--ease-snap`; global reduced-motion
   collapse. Fonts via next/font in the (v2) layout only.
3. `a978dea` **Primitive set** (`src/components/v2/ui/`, self-contained, no
   v1 imports): Button (gold "taxi light" primary / quiet / ghost /
   destructive; loading + aria-busy), Input (visible label, error/success
   with icon + aria-describedby, never color-alone), Card (raised XOR
   outline — one elevation story), Skeleton (decorative) + SkeletonGroup
   (announces once), EmptyState (invitation + one action), Dialog + Sheet
   (native `<dialog>`: platform focus trap/Esc/focus-return; discrete
   transitions + @starting-style), Tabs (roving tabindex, arrow/Home/End).
   22 unit tests.
4. `8c619ab` **The reveal** (`Reveal.tsx`) — the signature: names flap on
   the board through a decelerating ~2.1s schedule, lock, tile floods gold.
   Never teases the winner mid-spin; tap-to-skip; reduced-motion goes
   straight to the result; SR hears the outcome, not the theater. 4 tests.
5. `c3d5d23` **/beta/gallery** — the Phase 2 gate: palette, type,
   every primitive in every state, dialog/sheet live, voice do/never,
   the reveal with "Spin again", light/dark toggle (hydration-safe
   useSyncExternalStore, same shape as v1's ThemeProvider). e2e:
   `e2e/v2/gallery.spec.ts` (@smoke reveal lock, dialog/sheet platform
   affordances, reduced-motion variant, axe WCAG 2.x AA scan in BOTH modes).

**Craft bug caught by the dark-mode axe scan (worth remembering):** the gold
tile/button used `text-ink`, which flips near-white in dark mode → white on
gold ≈1.3:1. Fix: mode-invariant `--gold-ink` token (bottle green in both
modes, 8.1:1/8.7:1) — labels on gold never follow the theme. IDENTITY.md
updated to record it as law.

_(Phase 3 was built on `v2/fork` cut from main after this merged — see the
CURRENT section above. Next after Phase 3 merges: Phase 4 `v2/fork-links`
per WORKPLAN.md — the public Fork Link surface, guest voting, and the
abuse-control checklist.)_

## Previous: v2 Phase 1 — Foundations & test rig (MERGED ✅ as PR #75 `3cbaa3c`)

All WORKPLAN Phase 1 deliverables landed in 6 commits;
full pre-push green (type/lint/format/jest 1677 passed incl. 62 new v2-area
tests/build), exit demo green, v2 e2e 3/3 green, v1 e2e:fast at baseline
(43 passed + 2 flaky-passed-on-retry).

What landed (one commit each, in order):

1. `ed60956` **Dual root layouts.** v1 app tree moved wholesale into
   `src/app/(v1)/` (pure git mv, zero URL changes; `api/`, `favicon.ico`,
   `sitemap.ts` stay at app root). `src/app/(v2)/` is a second ROOT layout
   (own `<html>/<body>` + `v2.css` placeholder tokens — real identity is
   Phase 2). `/beta` placeholder page; middleware makes `/beta(.*)` public.
   Unknown public paths still 404 cleanly (verified).
2. `e717495` **v2 data model** (`src/lib/v2/schema.ts` + `db.ts` +
   `tokens.ts`): forks/places/lists/crews/guests docs; ONE identity rule
   (Participant = userId XOR guestId, guests carry zero PII);
   `ensureV2Indexes()` is the single index authority (unique fork `code`,
   2dsphere places, flat participant arrays). Guest cookie + fork vote
   token = HMAC-SHA256 under `V2_TOKEN_SECRET` (new env var, in .env.local
   - env.example); share codes: 10 chars, unambiguous 31-char alphabet.
3. `9d6d81d` **Decision math ported PURE** (`decision-engine.ts`): decay
   weight (30-day, floor-days, 10% floor), weighted spin, 3/2/1 ranked
   consensus w/ ghost-skip + random tie-break — history/clock/rng all
   injected. `forks.ts`: createFork/getSelectionHistory/spinFork (enough
   for the exit demo; vote orchestration is Phase 3/4). 57 tests pin v1
   parity (decay curve, bucket boundaries, tie-breaks) + lifecycle guards.
4. `0445145` **Hard notification-suppression seam**
   (`src/lib/notification-suppression.ts`): external sends (Twilio SMS +
   Verify, Resend, web push) only when `VERCEL_ENV=production` or explicit
   `ALLOW_REAL_NOTIFICATIONS=true`; guarded at ALL 7 provider call sites
   incl. both Twilio Verify starts and Resend's validateConfiguration
   (which really POSTs). Replaces v1's dev "redirect SMS to test number"
   (which still billed Twilio).
5. `bb5efae` **Dev DB + seed + squad.** `npm run seed:v2-dev` (idempotent):
   creates the 5-user Clerk DEV-instance squad (`fitr.<role>+clerk_test@example.com`,
   OTP 424242, password in `scripts/v2/test-squad.ts`, username
   `fitr_<role>` — the dev instance still requires usernames), seeds
   `you-hungry-v2-dev` with 12 fictional `dev-*` places (Places API never
   billed), starter list, staggered history (2/6/12/40 days), one guest;
   applies indexes. Refuses prod DB name + non-sk_test Clerk keys.
   `npm run demo:v2-foundations` = Phase 1 exit demo (asserting weights
   0.16/0.46/1.00 + persistence) — PASSING. `tsx` added as devDep
   (lockfile verified clean of elilillyco).
6. `2cd5b6a` **Playwright v2 lane.** `v2-setup` + `v2-beta` projects
   (`npm run test:e2e:v2`); organizer storage state at
   `playwright/.auth/v2-organizer.json`; v1 `setup` project pinned to
   `e2e/auth.setup.ts` (v1 lanes frozen, not extended).

**⚠️ Owner-visible env change:** `.env.local` `MONGODB_DATABASE` switched
`you-hungry` → **`you-hungry-v2-dev`** — local dev (v1 AND v2) no longer
touches the production database (it previously wrote straight to prod
Atlas). Flip it back temporarily if you need local v1 against real data.
`V2_TOKEN_SECRET` was also added to `.env.local` (random, dev-only).

**Next session:** Phase 2 (`v2/identity`) per WORKPLAN.md, cut from main
after this PR merges. Read DESIGN-UI-UX-SKILLS.md first (design-work rule).

## Previous: Phase 4 / v2 planning (branch `phase4/readme-v2-plan`, MERGED as PR #74)

Owner directive: v2 is a **full product re-imagination** owned by Fable —
original thesis, new visual identity, decision-first IA with guest voting
via share links. PRODUCT.md/DESIGN.md describe v1 and are reference only.
Owner answers on record: full re-imagination ✅; rebuild mode left to Fable
(chosen: greenfield `(v2)` route tree at `/beta` in this repo, cutover at
the end — "v1 must not get in the way of v2; no use for v1 afterwards");
new identity from scratch ✅; test access = Clerk dev-instance test squad ✅.

This session's deliverables (all on this branch):

- README.md rewritten — honest, accurate (Next 16/TS 6/Node 22, real route
  counts, no fabricated metrics), ~280 lines.
- `promptFiles/v2/CHARTER.md` — Fable's v2 product thesis (three lanes:
  Fork / Places / Crew; Fork Links + guest voting; SMS + URL shortener +
  homegrown observability deleted; keep Next/Vercel/Mongo/Clerk).
- `promptFiles/v2/WORKPLAN.md` — 9-phase plan (0 planning → 1 foundations →
  2 identity → 3 fork core → 4 fork links → 5 places → 6 crews → 7 cutover →
  8 launch), one branch/PR/review per phase.
- This HANDOFF refresh.

Exploration findings feeding the plan (from 3 parallel audits this session):
group decisions buried 4 levels deep; `decision_result` notifications 404
(route doesn't exist); onboarding lands in a 1,351-line settings page; ~31KB
of zero-import infra libs; duplicate Places clients (41KB); 9-file/130KB
notification stack; ~21 admin routes of homegrown observability; design
tokens good but only ~60% adopted; `Collection.restaurantIds` is a 3-shape
union; mixed Clerk-id/ObjectId identity model.

**Next session:** Phase 1 (`v2/foundations`) per WORKPLAN.md, cut from main
after this PR merges. Owner action needed: confirm dev Clerk keys in
`.env.local`.

**Owner decision 2026-07-02 (auth):** NO Google/Apple social login — Apple
sign-in requires a paid Apple Developer account (owner won't pay yet) and
owner won't ship Google without Apple. v2 auth = Clerk **email/password
only** (2 fields, no phone/username). Revisit social providers only if the
Apple economics change.

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
