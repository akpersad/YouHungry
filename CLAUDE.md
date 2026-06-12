# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

**Fork In The Road** — the repo is named `you-hungry` for historical reasons, but the product name is Fork In The Road; use it in all user-facing text and docs. A restaurant decision-making PWA deployed on Vercel at https://fork-in-the-road.vercel.app. Users search restaurants via Google Places, organize them into personal/group collections, and decide where to eat via either a weighted-random algorithm with 30-day decay or tiered group voting. **Production is live with real integrations** (Clerk, MongoDB Atlas, Google Places, Twilio SMS, Resend email, web push) — treat env vars and webhooks as live; SMS/email sends cost money and hit real phones.

## Commands

```bash
npm run dev                 # Dev server (Turbopack, port 3000; checks port first)
npm run build               # Production build (Turbopack); build:webpack for webpack fallback
npm run type-check          # tsc
npm run lint / lint:fix     # ESLint
npm run format:check        # Prettier
npm run test                # Jest unit tests
npm run test:coverage       # Jest with coverage (60% threshold in jest.config.js)
npm run pre-push            # type-check + lint + jest + build — must pass before every push (husky enforces)

# Run a single Jest test
npx jest src/lib/__tests__/decisions.test.ts
npx jest -t "test name pattern"

# Playwright e2e (e2e/ directory)
npm run test:e2e:fast       # chromium-fast + mobile-chrome-fast projects (use before merging behavior changes)
npm run test:e2e:smoke      # @smoke tagged
npm run test:e2e:critical   # @critical tagged
npm run test:accessibility  # axe spec (e2e/accessibility.spec.ts)
npx playwright test e2e/group-decisions.spec.ts   # single e2e suite
```

Husky hooks: pre-commit runs lint-staged (eslint --fix + prettier); pre-push runs the full `pre-push` script. CI (`.github/workflows/playwright.yml`) currently runs only Playwright — unit tests/lint/build are enforced locally only.

## Workflow conventions

- PR-based workflow; conventional-ish commit messages. **One feature branch per phase/work session with multiple logical commits — do not split work across multiple/stacked branches. The owner personally handles all PR merges; never merge PRs or push to main** (production deploys from main).
- **Never `git push` — any branch — without the owner's explicit go-ahead.** Commit locally as work completes; announce "ready to push" and wait.
- Use the structured logger `src/lib/logger.ts` (`logger.debug/info/warn/error`, plus dev-only `perf/api/component/analytics`) — never raw `console.log` in `src/`.
- Path alias: `@/*` → `./src/*`.

## Architecture

Next.js 15 App Router + TypeScript + Tailwind. ~113k LOC. MongoDB (raw driver, no ORM), Clerk auth, TanStack Query client state, Zod validation.

### Core domain: the decision engine

`src/lib/decisions.ts` is the heart of the app:

- **Weighted random**: `calculateRestaurantWeight()` — weight = base × (0.1 + 0.9 × daysSinceSelection/30); recently picked restaurants are penalized for 30 days, floor of 10%. `performRandomSelection()` (personal) and `performGroupRandomSelection()` (group; weights shared across the group's decision history by `groupId`).
- **Tiered group voting**: ranked-choice votes scored 3/2/1 points; `submitGroupVote()` upserts votes, `calculateTieredConsensus()` resolves the winner (random tie-break), `completeTieredGroupDecision()` finalizes.
- Decisions have type `personal|group`, method `random|tiered|manual`, status `active|completed|expired`; persisted in the `decisions` Mongo collection.

### Data layer

- `src/lib/db.ts` — MongoDB connection (`connectToDatabase()`); DB name from `MONGODB_DATABASE`.
- `src/types/database.ts` — the model definitions (User, Restaurant, Collection, Group, Decision, Friendship, GroupInvitation, InAppNotification, etc.). Mongo collections: users, restaurants, collections, groups, decisions, friendships, group_invitations, in_app_notifications, short_urls, error_logs, api_usage.
- `src/lib/validation.ts` — Zod schemas + `validateData()` helper; API routes validate input with these.
- Domain helpers per entity: `src/lib/collections.ts`, `groups.ts`, `restaurants.ts`.

### Auth

- `src/middleware.ts` — Clerk `clerkMiddleware` with public-route matcher.
- `src/lib/auth.ts` — `getCurrentUser()` (Clerk ID → DB user, auto-creates), `requireAuth()`, `requireAdminAuth()`. **Admin = user ID listed in `ADMIN_USER_IDS` env var.** Route handlers call these at the top; mutation routes must also verify ownership/membership (collection owner, group admin), not just authentication.
- `api/webhooks/clerk` — svix-signed Clerk user lifecycle events.

### API surface (`src/app/api/`, ~80 route handlers)

Major families: `decisions/*` (random-select, group, group/vote, weights, history), `collections/*`, `groups/*`, `restaurants/*` (Google Places search), `friends/*`, `user/*`, `push|email|sms/*` (notification channels), `admin/*` (~15 monitoring/cost routes), `analytics/*`, `cron/*`, `webhooks/*`.

### External integrations & resilience

- `src/lib/google-places.ts` + `optimized-google-places.ts` (caching/dedup via `api-cache.ts`).
- `src/lib/circuit-breaker.ts` — CLOSED→OPEN after 5 failures, 30s wait, HALF_OPEN probe; instances wrap each Google API.
- `src/lib/api-usage-tracker.ts` — cost tracking for every third-party call (Google, Twilio, Resend, Clerk) into the `api_usage` collection; admin panel reads it.
- **Notification orchestration**: `src/lib/notification-service.ts` is the multi-channel facade (push/email/SMS/in-app/toast routed by user preferences, graceful per-channel degradation). Channel impls: `push-service.ts` (server web-push + VAPID), `push-notifications.ts` (client), `sms-notifications.ts` (Twilio), `email-notifications.ts` (Resend), `in-app-notifications.ts`, `decision-notifications.ts` (decision-triggered). Any test/demo work must suppress real sends — this orchestration layer is the seam.

### Client state & UI

- `src/components/providers/QueryProvider.tsx` — TanStack Query defaults (5min staleTime, no retry on 4xx, exponential backoff).
- `src/hooks/api/*` — query hooks per domain (useCollections, useDecisions, useGroups, …).
- `src/components/` — `ui/` design-system primitives, `features/` per-domain modules, `layout/`, `forms/`, `providers/`, `admin/`.

### PWA / offline

- `public/sw.js` — versioned cache name (bump `forkintheroad-vNN` to invalidate); network-first for HTML, cache for static assets, APIs never cached (503 JSON offline fallback).
- `src/lib/offline-storage.ts` — IndexedDB (`YouHungryOfflineDB`) with stores for restaurants/collections/decisions/votes plus an `offlineActions` queue for replaying mutations on reconnect. Offline support is **partially built** — check what exists before extending.

### Testing

- Jest: `src/__tests__/`, `src/lib/__tests__/`, `src/hooks/__tests__/`; mocks for mongodb/clerk/bson in `src/__mocks__/`; jsdom env.
- Playwright: `e2e/` with `@smoke`/`@critical` grep tags; projects split fast/slow/mobile/auth (`playwright.config.ts`); `playwright.config.no-auth.ts` for public routes; fixtures in `e2e/fixtures/`.
