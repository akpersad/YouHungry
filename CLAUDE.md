# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

**Fork In The Road** — the repo is named `you-hungry` for historical reasons, but the product name is Fork In The Road; use it in all user-facing text and docs. A restaurant decision-making app deployed on Vercel at https://fork-in-the-road.vercel.app. The v2 re-imagination (charter: `promptFiles/v2/CHARTER.md`) IS the app since the Phase 7 cutover: users start a **Fork** (a lightweight decision — source + mode + lifespan), spin a weighted wheel or run a ranked-choice vote, and share a **Fork Link** into the group chat where **guests vote with just a display name, no account**. Places/Lists and Crews (recurring groups that emerge from decision history) are accelerants, never prerequisites. **Production is live with real integrations** (Clerk, MongoDB Atlas, Google Places, Resend email, web push) — treat env vars and webhooks as live; email sends cost money.

## Commands

```bash
npm run dev                 # Dev server (Turbopack, port 3000; checks port first)
npm run build               # Production build (Turbopack); build:webpack for webpack fallback
npm run type-check          # tsc
npm run lint / lint:fix     # ESLint
npm run format:check        # Prettier
npm run test                # Jest unit tests
npm run test:coverage       # Jest with coverage (ratchet-only thresholds in jest.config.js)
npm run pre-push            # type-check + lint(--max-warnings=0) + format:check + jest + build — must pass before every push (husky enforces)

# Run a single Jest test
npx jest src/lib/v2/__tests__/forks.test.ts
npx jest -t "test name pattern"

# Playwright e2e (e2e/ directory; seed the dev DB first)
npm run seed:v2-dev         # Clerk dev-instance test squad + fixture places/history (idempotent; refuses prod)
npm run test:e2e            # all journeys (chromium) + @smoke on mobile-chrome
npm run test:e2e:smoke      # @smoke tagged
npm run test:accessibility  # every axe scan (gallery + lanes, both color modes)
npx playwright test e2e/fork-links.spec.ts   # single suite

# One-time v1 → v2 data migration (Phase 7; owner sign-off gates --execute)
npm run migrate:v1          # DRY RUN — read-only report
```

Husky hooks: pre-commit runs lint-staged (eslint --fix + prettier); pre-push runs the full `pre-push` script. CI: `.github/workflows/ci.yml` (types/lint/format/jest-coverage/build + badge publishing) and `playwright.yml` (smoke/e2e/axe/Lighthouse) run on every PR/push — see `docs/ci-quality-gates.md` for check names and the branch-protection setup.

## Workflow conventions

- PR-based workflow; conventional-ish commit messages. **One feature branch per phase/work session with multiple logical commits — do not split work across multiple/stacked branches. The owner personally handles all PR merges; never merge PRs or push to main** (production deploys from main).
- **Never `git push` — any branch — without the owner's explicit go-ahead.** Commit locally as work completes; announce "ready to push" and wait.
- Use the structured logger `src/lib/logger.ts` — never raw `console.log` in `src/`.
- Path alias: `@/*` → `./src/*`.
- v2 plan documents: `promptFiles/v2/CHARTER.md` (product thesis), `promptFiles/v2/WORKPLAN.md` (phase ledger), `promptFiles/v2/IDENTITY.md` (the committed design direction — "Tonight's board"), `promptFiles/HANDOFF.md` (session state). Read HANDOFF first in a fresh session.

## Architecture

Next.js 16 App Router + TypeScript + Tailwind 4. MongoDB (raw driver, no ORM), Clerk auth (email/password only), Zod validation. ~20k LOC after the Phase 7 purge (was ~113k).

### Core domain (`src/lib/v2/`)

- `decision-engine.ts` — the pure math (v1's proven IP, ported with injected history/clock/rng): 30-day decay weights with a 10% floor, weighted spin, 3/2/1 ranked consensus with random tie-break. `scoreBallots()` is deterministic so the UI tally never re-rolls a tie-break.
- `forks.ts` — the whole fork lifecycle: `quickSpin` (ephemeral compute; nothing persists until lock-in), `createFork`, `submitVote` (atomic in-place revote, quorum auto-close), `settleFork` (**lazy timer enforcement on every read — no cron**; closes seal status first, then compute consensus from the sealed doc), `getSelectionHistory` (scoped by participant or crewId for shared crew weights), `decideForkNow` (organizer early close).
- `guests.ts` + `tokens.ts` — guest identity: signed httpOnly cookie (HMAC-SHA256 under `V2_TOKEN_SECRET`), signed per-fork vote tokens, claim = one-way pointer to an account. **Participant = userId XOR guestId; guests carry zero PII.**
- `places.ts` + `google-places.ts` — cache-backed places (2dsphere nearby, vibe filters, text search) over a consolidated Google client with a **default-closed billing gate** (`ALLOW_GOOGLE_PLACES=true` or production only; dev/CI/tests never bill). 30-day place cache; `place_queries` markers throttle repeat searches. Text search is **location-biased** (explicit lat/lng, else the viewer's saved `searchAnchor` from /account, geocoded once via Find Place); biased marker keys carry an ~11km grid cell. `PlaceSummary` carries a free Google Maps `mapsUrl` (menus/photos live there by owner decision, 2026-07-06).
- `lists.ts`, `crews.ts` — Lists (saving IS membership, atomic cap guards, owner-or-collaborator access in the query filter; **shared lists** via signed 7-day `listinv:` invite links — collaborators save/remove/fork, rename/delete/invite stay owner-only) and Crews (suggested from 3+ closed forks by the exact same account set; creation back-attaches matching history so shared weights are live from day one).
- `notifications.ts` — the ONLY notification machinery, two triggers, both fire-and-forget through the suppression seam: push + email "We're going here." to account-holder participants when a fork closes, and a push-only "Where are we going?" heads-up to crew members when a crew fork starts (owner charter amendment 2026-07-06; both kinds share the fork's notification tag so the result replaces the invite). Emails carry a signed one-tap unsubscribe link + RFC 8058 headers; per-user channel switches live in `account.ts` (`preferences.notificationSettings`, absent = on).
- `account.ts` — the account surface: first-name/password writes through Clerk then mirrored to Mongo (never the reverse), notification preference flips, push-subscription add/remove (v1 field shapes kept), token-authorized email unsubscribe.
- `schema.ts` — collections (forks/places/place_queries/lists/crews/guests/users/error_logs) and `ensureV2Indexes()`, the single index authority.
- `migration.ts` + `scripts/v2/migrate-v1.ts` — one-time v1→v2 data migration (restaurants→places, collections→lists, groups-with-history→crews, decisions→closed forks, weights preserved). Dry-run by default; `--execute --into <db>` after owner sign-off.
- `http.ts` — one error policy for `/api/v2`: Zod → 400, `V2DomainError` → its status + user-facing message, everything else → generic 500 + `recordServerError` (the admin page reads these).

### Surviving v1 modules (v2's only v1 dependencies)

`src/lib/`: `logger.ts`, `db.ts` (connection singleton), `rate-limit.ts` (Mongo fixed-window, fails open), `notification-suppression.ts` (external sends only in prod or `ALLOW_REAL_NOTIFICATIONS=true` — guards every provider call), `api-usage-tracker.ts` (cost rows in `api_usage`), `push-service.ts` (web-push + VAPID, slimmed).

### Auth

- `src/middleware.ts` — Clerk `clerkMiddleware`; the page tree is public at the middleware layer (cold-open + guest voting are the product); pages that need an account (`/new`, `/places`, `/crew`, `/admin`) gate themselves server-side with a `?next=`-preserving sign-in round-trip. (Next 16 deprecates the filename in favor of `proxy.ts`; deliberately staying on `middleware.ts` until clerk/javascript#8302 is fixed.)
- `src/lib/v2/auth.ts` — `getV2User()` (Clerk session → lean user doc; webhook-gap auto-create, never fabricated emails), `requireV2User()` (throws 401 `V2DomainError`). `api/webhooks/clerk` (svix-signed) syncs the same lean shape. **Admin** = Mongo `_id` listed in `ADMIN_USER_IDS` (`src/lib/v2/admin.ts`).
- Custom two-field sign-in/sign-up forms (`src/components/v2/auth/`) on Clerk's legacy hooks; sign-in accepts email OR username and offers the custom reset_password_email_code forgot-password flow. Signed-in self-service (name, email change w/ code, password change) lives on `/account` (server-side verifyPassword + updateUser via clerkClient; email change is the client-side Clerk resource flow).

### API surface (`src/app/api/v2/`, ~25 handlers)

`quick-spin(/lock)`, `forks` create/get/vote/spin/decide + `forks/[code]/live` (SSE — each poll runs the settling read, so the stream IS the timer), `guests/claim`, `lists` CRUD + membership + `lists/[id]/invite` + `lists/join` (shared-list capability links), `places/nearby|search` (search biased by lat/lng or the viewer's anchor), `account` (PATCH profile/resync/address, `password`, `preferences`, `push-subscriptions`, `unsubscribe` — the RFC 8058 one-click POST target), `webhooks/clerk`. Handlers return JSON 401s (never HTML redirects); guest-vote path is layered cheapest-first (token → rate limits → cookie). Rate limits: votes 12/min/IP + 30/min/fork, fork GET 60/min/IP, SSE 20/min/IP, quick-spin 30/min/IP, claims 10/min/user, account PATCH 10/min/user, password 5/min/user.

### UI

- `src/app/` — `/` (fork lane home), `/new`, `/f/[code]` (fork room; `/beta/*` 308-redirects here for pre-cutover links), `/places(/l/[id])` (search + anchored discovery browse + lists), `/places/join` (shared-list invite landing), `/crew(/[id])`, `/account` (profile + home-base address + notification switches + per-device push opt-in; header first-name is the door), `/unsubscribe` (public token-authorized email opt-out landing), `/gallery` (living design system), `/admin` (owner-only spend + errors), `/sign-in`, `/sign-up`.
- `src/components/v2/ui/` — the primitive set (Button/ButtonLink, Input, Card, Dialog/Sheet on native `<dialog>`, Tabs, Skeleton, EmptyState, Reveal). Identity: `src/app/v2.css` tokens + `promptFiles/v2/IDENTITY.md` ("Tonight's board": green-tinted paper, ONE rationed gold accent at decision moments, mode-invariant dark board, Archivo + Spline Sans Mono, decisive-snap motion). **Labels on gold never follow the theme** (`--gold-ink`). Settings surfaces (Switch, /account) are frame register: ON-state is ink, never gold. Read `DESIGN-UI-UX-SKILLS.md` before any design/UI work.
- No photos rendered anywhere (legacy photo URLs embed the API key; identity is text-forward). `public/sw.js` (Phase 8) is conservative cache-first-for-hashed-assets + network-first navigations, and owns the `push`/`notificationclick` handlers for the one result notification.

### Testing

- Jest: `src/lib/v2/__tests__/`, `src/components/v2/**/__tests__/`; mongodb/bson/clerk mocks in `src/__mocks__/` (argless mock ObjectIds stringify identically — mint unique hex ids like the existing suites). Coverage thresholds are ratchet-only floors.
- Playwright: `e2e/` — journeys at root URLs against a **production** server build (dev overlay breaks dialog tests; a dev server on :3000 is reused locally, kill it for CI-faithful runs). `auth.setup.ts` signs in the seeded squad (`scripts/v2/test-squad.ts`, `+clerk_test` emails, OTP 424242). Axe scans emulate reduced motion so mid-transition themes never fail contrast.
