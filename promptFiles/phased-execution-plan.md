# Fork In The Road — Phased Execution Plan

**Date:** 2026-06-10 (updated same day with owner decisions)
**App:** Fork In The Road (repo name is `you-hungry` for historical reasons — the product name is Fork In The Road; use it in all user-facing text, docs, and READMEs)
**Derived from:** `youhungry-upgrade-plan.md` + `tech-debt-audit.md` (merged), with owner decisions applied.
**Goal:** Raise the portfolio score from 7.40 toward ~8.7. Work one phase at a time; each phase is a set of small PRs; stop and regroup between phases.

## Owner decisions (2026-06-10)

1. **Native iOS companion app is CUT** (upgrade plan §6.1). No Apple Developer account; TestFlight off the table. The October 2025 "ios app prep" epic produced docs only — no Swift code exists. The **PWA is the mobile story**: offline-first (Phase 6) is the mobile demo, the AI feature (Phase 7) carries the breadth signal. (Rubric note: Stack likely lands 9 instead of 9–10 without native; accepted trade.)
2. **Tech-debt-audit P1 items merge into Phase 1.**
3. **Keep Clerk — no Supabase auth migration.** Zero rubric movement for 1–2 weeks of risky work on a live app. Shared login with overlapp may be revisited as a standalone project after this plan ships.
4. **Next 16 + Tailwind 4 upgrade is IN**, as the closing PR(s) of Phase 2 — after CI lands (so the suite verifies it), before the UI refresh (so we don't restyle twice). Abandonable if e2e goes red.
5. **UI/UX refresh added as Phase 3**, before README/presentation so the demo GIF and screenshots capture the new UI. **Prerequisite: owner installs UI/UX skills before this phase starts.**

## Phases

### Phase 1 — Security & hygiene (days)

From the upgrade plan §3 **plus** tech-debt-audit P1s:

- Delete `src/app/api/debug/push-notifications/route.ts` + references.
- **Middleware first**: `src/middleware.ts` appears to mark `/api/decisions/*`, `/api/collections/*`, `/api/restaurants/search` as public — verify and fix before the route-by-route audit.
- Full API route auth audit (~80 handlers) → `docs/api-auth-matrix.md`: admin role checks, ownership/membership on mutations, cron secrets, svix verification, delete-or-protect test/utility endpoints (`migrate/clear-collections`, `push/test`, etc.). Jest test per ownership fix.
- **Rate limiting** on `/api/sms` and `/api/auth/*` routes (tech-debt P1 — real Twilio cost exposure).
- **Fix `db.ts`**: global-cached client promise singleton; stop exporting `db: Db | undefined` (tech-debt P1).
- Logging cleanup: structured logger everywhere in server code; `no-console` ESLint rule.
- **Dependency unpinning** (`^` for runtime deps, keep Playwright pinned) + Dependabot config; `npm audit` clean at minor/patch level (majors land in Phase 2).
- Repo hygiene: remove `.cursorrules`/AI artifacts going forward (no history rewrite), prune one-off codemod scripts from `package.json`, verify no secrets/TLS certs servable from `public/`. Quick README wins land here too (remove the `README.md:34` "create a demo GIF" placeholder note — the real GIF comes in Phase 4).

**Exit:** zero unauthenticated mutation/debug endpoints; auth matrix committed; rate limiting live; zero console.log in server code; deps current + auto-patching.

### Phase 2 — CI & quality gates, then framework currency (days)

- `ci.yml`: type-check, lint, format:check, jest --coverage, build on every PR/push; investigate and fix the `--legacy-peer-deps` root cause rather than propagating it.
- Coverage uploaded; README badges become CI-generated, not asserted.
- Wire Lighthouse CI + axe/smoke Playwright lanes as required PR checks.
- Coverage honesty pass (priority: `decisions.ts` edges, Phase 1 ownership checks, notification orchestration).
- **Closing PR(s): upgrade Next 15 → 16 and Tailwind → 4** with the new CI as the safety net. Separate PRs, full e2e verification, abandon rather than ship half-migrated.

**Exit:** a PR cannot merge with failing types/lint/tests/build/smoke/a11y; badges are generated; framework current (or upgrade consciously deferred with a note).

### Phase 3 — UI/UX refresh (NEW; ~1–2 weeks)

**Prerequisites (see `DESIGN-UI-UX-SKILLS.md` at repo root for the full catalog + install commands):**

- Design skills installed: `ui-ux-pro-max` + `ckm:*` suite, `impeccable`, `emil-design-eng`, `design-taste-frontend`, `design-for-ai`. (Install requires owner-run commands; the agent is not permitted to install third-party skill packages itself.)
- Run `/impeccable init` (or hand-write `PRODUCT.md` + `DESIGN.md`) before any impeccable commands — it drives everything else.
- **Color scheme is an open question** — the owner is NOT tied to the current palette (`#e3005a` theme). Phase kickoff starts with a design-direction discussion (palette, typography, overall style), using `ui-ux-pro-max`'s curated palettes/font pairings as the menu, before any restyling.

Work:

- Visual redesign pass over the whole app: the current UI reads as janky; target a cohesive, modern look (design tokens, spacing/typography scale, consistent component states) built on Tailwind 4 from Phase 2.
- Suggested skill pipeline (from the catalog doc): `ckm:design-system` tokens + `ui-ux-pro-max` direction → `impeccable` build/redesign → `emil-design-eng` motion/detail polish + `impeccable audit/critique` review.
- Keep the existing `src/components/ui/` design-system structure as the seam — restyle primitives, and feature components inherit.
- Every change verified against the e2e suite; visual work must not regress a11y (axe lane from Phase 2 stays green). Note: a palette change invalidates `color-contrast-audit-report.json` and any hardcoded-color lint expectations — re-run the contrast audit after.

**Exit:** owner signs off on the new look; e2e + axe green; screenshots-worthy UI ready for Phase 4 capture.

### Phase 4 — README & presentation (days; highest ROI/hour)

- Demo GIF of the core flow (search → collection → group decision → vote → result), recorded against the refreshed UI; Playwright-scripted so re-capture is cheap. Delete `DEMO_PLACEHOLDER.md`; fresh mobile + desktop screenshots.
- Restructure 57KB README for a 3-minute skim: pitch + GIF + live URL + (later) demo link, feature bullets, architecture diagram, 4–6 deep-linked engineering highlights, verifiable badges; deep content moves to `docs/`. **Use "Fork In The Road" as the product name throughout.**
- `docs/decision-engine.md` case study (weight decay design, consensus rules, edge cases, retrospective).

**Exit:** README-only reviewer sees working GIF of the new UI, live link, verifiable badges, deep-linkable engineering stories.

### Phase 5 — Product polish + demo mode (1–2 weeks)

- **Demo mode (the most important product change):** no-signup "Try the demo" path with seeded data; prefer the sandboxed no-shared-writes design; all SMS/email/push sends suppressed (notification-service is the seam); demo data resets.
- UX state audit: loading/empty/error on every page; `@critical` e2e specs for worst offenders. (Lighter than originally scoped — Phase 3 will have already touched most surfaces.)
- Accessibility: axe across all routes → zero violations; keyboard + VoiceOver pass on core flow; document in README.
- Performance: before/after numbers via `performance-metrics/` + Lighthouse → `docs/performance.md`; bundle analysis, Mongo index review.

**Exit:** stranger experiences full product in <60s with zero signup; zero axe violations; published perf numbers.

### Phase 6 — Offline-first with sync conflict resolution (2–4 weeks; the "one hard thing")

Upgrade plan option 5A (chosen; 5B realtime voting not pursued).

- Build from existing `src/lib/offline-storage.ts`: collections + personal decisions fully offline; mutation queue replays on reconnect with an explicit, documented conflict policy (per-field merge for collection edits is the stretch goal).
- Service worker: cache-first app shell/images, network-first API reads w/ fallback, background sync for the queue.
- Playwright test of the airplane-mode flow via network interception; show it in a README clip — **this doubles as the mobile story** (installed PWA, offline, reconcile on reconnect).
- `docs/offline-sync.md` covering the conflict model and failure modes honestly.

**Exit:** works in production with unit + e2e coverage incl. failure modes; design doc; strongest README engineering highlight.

### Phase 7 — AI feature (1–2 weeks)

- Natural-language group preferences → structured filters (tool use / JSON schema, never free-text parsing) applied to the candidate pool, plus a one-line "why this pick" explanation.
- Server-side only; current Claude models (consult `claude-api` skill at build time); graceful degradation via `circuit-breaker.ts`; cost guardrails via `api-usage-tracker.ts`.
- Must be reachable inside demo mode so reviewers actually hit it.

**Exit:** AI preference input live in the demo flow.

### Phase 8 — Story on-ramps (ongoing)

- Agent-buildable: unauthenticated share-a-decision-result permalinks with OG images; simple privacy-respecting usage dashboard on existing `analytics.ts` plumbing.
- Owner work: posting publicly, getting real groups using it; only then add adoption claims to the README.

## Standing rules (from the upgrade plan §1 and §11 — still apply)

- Re-verify every cited path before acting; reality wins over this document.
- One PR per work item; `npm run pre-push` green before every push; `test:e2e:fast` green before merging behavior changes.
- Never fabricate claims; production is live — suppress real SMS/email/push in all test/demo work; don't rotate credentials without flagging the owner.
- The product is **Fork In The Road** — never "You Hungry" in user-facing text or new docs.
