# Fork In The Road

**End the "where should we eat?" debate.**

[![CI](https://github.com/akpersad/YouHungry/actions/workflows/ci.yml/badge.svg)](https://github.com/akpersad/YouHungry/actions/workflows/ci.yml)
[![E2E](https://github.com/akpersad/YouHungry/actions/workflows/playwright.yml/badge.svg)](https://github.com/akpersad/YouHungry/actions/workflows/playwright.yml)
[![Tests](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fakpersad%2FYouHungry%2Fbadges%2Ftests.json)](https://github.com/akpersad/YouHungry/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fakpersad%2FYouHungry%2Fbadges%2Fcoverage.json)](https://github.com/akpersad/YouHungry/actions/workflows/ci.yml)

Fork In The Road is a mobile-first PWA for the moment a group chat stalls on
dinner plans. Users build collections of restaurants (personal or shared with
a group), then let the app decide: a weighted-random "spin" that avoids
repeating recent picks, or a ranked-choice group vote. The goal is simple —
from "idk, you pick" to a confirmed restaurant in under a minute.

**Live at [fork-in-the-road.vercel.app](https://fork-in-the-road.vercel.app)**

> The repository is named `you-hungry` for historical reasons; the product
> name is Fork In The Road.

---

## How it decides

The decision engine lives in [`src/lib/decisions.ts`](./src/lib/decisions.ts)
and supports two modes:

**Weighted random ("spin").** Every restaurant in a collection starts at equal
weight. A restaurant picked recently is penalized on a 30-day linear decay —
`weight = base × (0.1 + 0.9 × daysSinceSelection / 30)` — with a floor of 10%,
so variety is enforced but nothing is ever fully excluded. Group spins share
weight history across the whole group's decisions, so "we just went there"
counts even if someone else spun.

**Tiered group voting.** Members rank their top three choices; ranks score
3/2/1 points. Votes are upserted (you can change your mind until the decision
closes), a live presence line shows who has voted, and consensus is computed
server-side with a random tie-break. The group admin completes or closes the
decision, and everyone is notified of the result.

Both modes write to a shared decision history that powers per-collection
statistics, a history view, and the weight decay above.

## Feature overview

- **Restaurant search** — Google Places–backed search with location,
  radius, cuisine, rating, and price filters; results cached in MongoDB for
  30 days to control API costs.
- **Collections** — personal lists ("Date Night", "Quick Lunch") and group
  collections shared by all members.
- **Groups & friends** — friend requests, group creation, email invitations,
  admin/member roles.
- **Decisions** — weighted-random spin (personal and group), tiered group
  voting, manual entry for logging past visits, full decision history with
  CSV/JSON export.
- **Notifications** — in-app notification center, web push, email (Resend),
  and SMS (Twilio), routed per user preference with graceful per-channel
  degradation.
- **PWA** — installable, offline-aware shell with a versioned service worker
  (network-first HTML, cached static assets, APIs never cached).
- **Admin console** — error tracking, performance metrics, API cost
  monitoring, and user management, gated by an admin allow-list.
- **Accessibility** — WCAG 2.1 AA is enforced in CI: an axe scan and a
  Lighthouse accessibility assertion run on every PR.

## Tech stack

| Layer         | Choice                                              |
| ------------- | --------------------------------------------------- |
| Framework     | Next.js 16 (App Router, Turbopack) + React 19       |
| Language      | TypeScript 6 (strict)                               |
| Styling       | Tailwind CSS 4 + OKLCH design-token system          |
| Data          | MongoDB Atlas (raw driver, no ORM)                  |
| Auth          | Clerk (custom sign-up flow, svix-verified webhooks) |
| Client state  | TanStack Query                                      |
| Validation    | Zod                                                 |
| Motion        | Framer Motion (reduced-motion aware)                |
| External APIs | Google Places, Twilio SMS, Resend email, Web Push   |
| Hosting       | Vercel (production deploys from `main`)             |
| Runtime       | Node.js ≥ 22                                        |

Design direction is documented in [`PRODUCT.md`](./PRODUCT.md) (product
principles and brand personality) and [`DESIGN.md`](./DESIGN.md) (the warm
OKLCH token system: tomato/saffron/olive accents, Fraunces display serif over
Geist Sans).

## Architecture at a glance

```
Browser (React 19 + TanStack Query, PWA service worker)
   │
   ├── Next.js App Router pages (src/app)
   │
   └── API routes (src/app/api, ~77 route handlers)
         │  requireAuth / requireAdminAuth  (src/lib/auth.ts)
         │  Zod validation                  (src/lib/validation.ts)
         ▼
       Domain layer (src/lib)
         decisions.ts · collections.ts · groups.ts · friends.ts · restaurants.ts
         notification-service.ts (multi-channel fan-out)
         │
         ▼
       MongoDB Atlas ──── Google Places · Twilio · Resend · Web Push
```

Key conventions:

- **Thin controllers.** API routes authenticate, validate, and delegate to
  domain modules in `src/lib`; business logic never lives in route handlers.
- **Auth in layers.** Clerk middleware protects the route tree; handlers call
  `requireAuth()`/`requireAdminAuth()`; mutation routes additionally verify
  ownership or group membership. See
  [`docs/api-auth-matrix.md`](./docs/api-auth-matrix.md) for the
  route-by-route auth posture.
- **Cost-aware integrations.** Google Places responses are cached for 30
  days; every third-party call is recorded in an `api_usage` collection that
  the admin console reads.
- **Structured logging.** `src/lib/logger.ts` everywhere — raw
  `console.log` is lint-blocked in `src/`.

MongoDB collections: `users`, `restaurants`, `collections`, `groups`,
`decisions`, `friendships`, `group_invitations`, `in_app_notifications`,
`short_urls`, `error_logs`, `api_usage`.

## Getting started

### Prerequisites

- Node.js 22+ and npm 9+
- A MongoDB Atlas cluster (free tier works)
- A Clerk application (email + phone auth enabled)
- Google Cloud project with **Places API** and **Address Validation API**
  enabled (billing required)
- Optional: Twilio (SMS) and Resend (email) accounts — the app degrades
  gracefully without them

### Setup

```bash
git clone https://github.com/akpersad/YouHungry.git
cd you-hungry
npm install
cp env.example .env.local   # then fill in your values
npm run dev                 # http://localhost:3000
```

See [`env.example`](./env.example) for the full variable list. The essentials:

```bash
MONGODB_URI=...             # Atlas connection string
MONGODB_DATABASE=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...    # svix secret for /api/webhooks/clerk
GOOGLE_PLACES_API_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_USER_IDS=...          # comma-separated user ids granted /admin access
```

Point a Clerk webhook (`user.created`, `user.updated`, `user.deleted`) at
`/api/webhooks/clerk` so user records sync into MongoDB. During local
development, browse `http://localhost:3000` — the Clerk dev instance only
trusts `localhost`.

## Development

```bash
npm run dev                 # dev server (Turbopack, checks port 3000 first)
npm run build               # production build
npm run type-check          # tsc
npm run lint / lint:fix     # ESLint (custom rule: no hardcoded colors)
npm run format:check        # Prettier
npm run pre-push            # type-check + lint + format + jest + build
```

Husky enforces quality gates: pre-commit runs lint-staged (ESLint + Prettier
on staged files); pre-push runs the full `pre-push` script. CI
([`ci.yml`](./.github/workflows/ci.yml)) repeats those checks plus coverage
on every PR, and [`playwright.yml`](./.github/workflows/playwright.yml) runs
smoke/E2E/accessibility/Lighthouse lanes — see
[`docs/ci-quality-gates.md`](./docs/ci-quality-gates.md).

The Tests and Coverage badges above are regenerated by CI on every push to
`main` — never hand-edited.

### Testing

```bash
npm run test                # Jest unit tests (jsdom)
npm run test:coverage       # with coverage (ratchet-only thresholds)
npx jest src/lib/__tests__/decisions.test.ts   # single suite

npm run test:e2e:fast       # Playwright: chromium-fast + mobile-chrome-fast
npm run test:e2e:smoke      # @smoke-tagged specs
npm run test:accessibility  # axe scan (e2e/accessibility.spec.ts)
```

Playwright's `webServer` builds and runs a **production** server; it reuses
an existing server on port 3000 locally, so kill any dev server first for a
CI-faithful run.

## Project structure

```
src/
├── app/                # App Router pages + ~77 API route handlers
│   ├── api/            # decisions, collections, groups, friends,
│   │                   # restaurants, notifications, admin, webhooks, cron
│   ├── dashboard/      # signed-in home
│   ├── decide/         # the personal decision flow (collection → spin)
│   ├── restaurants/    # search
│   ├── groups/         # groups, invitations, group collections
│   └── ...             # friends, history, analytics, profile, admin
├── components/
│   ├── ui/             # design-system primitives (Button, Modal, Tabs, …)
│   ├── features/       # per-domain feature modules
│   └── layout/ forms/ providers/ admin/
├── hooks/api/          # TanStack Query hooks per domain
├── lib/                # domain logic + integrations (decisions.ts is the core)
└── types/database.ts   # MongoDB document models

e2e/                    # Playwright suites (@smoke / @critical tags)
docs/                   # focused reference docs (auth matrix, CI gates, …)
promptFiles/            # planning, handoff, and architecture working docs
```

## Deployment

Production deploys from `main` via Vercel. Configure the same environment
variables in Vercel, switch Clerk to production keys, and point the Clerk
webhook at the production domain. `vercel.json` defines cron jobs (e.g.
daily performance-metrics collection). Post-deploy smoke checklist lives in
[`promptFiles/deployment/`](./promptFiles/deployment/).

> **Note:** production uses live integrations — SMS and email sends cost
> real money and reach real phones. Test/demo work must suppress sends via
> the notification-service seam.

## Documentation map

| Doc                                                      | What it covers                                 |
| -------------------------------------------------------- | ---------------------------------------------- |
| [`PRODUCT.md`](./PRODUCT.md)                             | Product purpose, audience, design principles   |
| [`DESIGN.md`](./DESIGN.md)                               | Visual system: tokens, type, motion, bans      |
| [`USER-STORIES.md`](./USER-STORIES.md)                   | Persona-based story audit (regression charter) |
| [`docs/api-auth-matrix.md`](./docs/api-auth-matrix.md)   | Route-by-route auth posture                    |
| [`docs/ci-quality-gates.md`](./docs/ci-quality-gates.md) | CI checks + branch-protection setup            |
| [`promptFiles/HANDOFF.md`](./promptFiles/HANDOFF.md)     | Session-state ledger for ongoing work          |
| [`CLAUDE.md`](./CLAUDE.md)                               | Working agreements for AI-assisted development |

## Author

**Andrew Persad** —
[andrewpersad.com](https://www.andrewpersad.com) ·
[LinkedIn](https://www.linkedin.com/in/andrew-persad-aa496432/) ·
[@akpersad](https://github.com/akpersad)

This is a personal portfolio project. All rights reserved.
