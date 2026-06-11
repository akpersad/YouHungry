# YouHungry (Fork In The Road) — Portfolio Upgrade Plan

**Date:** June 10, 2026
**Target repo:** `github.com/akpersad/YouHungry` (execute this plan in a clone of that repo, NOT in the portfolio repo where this file lives)
**Live app:** https://fork-in-the-road.vercel.app
**Origin:** This plan follows from a 17-repo portfolio audit (see `repo-audit-2026-06-10.md` in this directory). YouHungry tied for the #1 score (7.40/10) and was selected as the flagship portfolio piece. This document is the north star for raising it from 7.40 to ~8.85.

---

## 1. How to Use This Document (instructions for the executing agent)

- **Work in phases, in order.** Phases 1–3 are prerequisites for everything else; they remove things that would embarrass the owner if a recruiter looked today. Phases 5–7 are larger swings that can be re-scoped, but do not skip ahead of an incomplete Phase 1 or 2.
- **Follow the repo's existing conventions.** This repo uses a PR-based workflow with issue-numbered feature branches, conventional-ish commit messages, Jest for unit tests, Playwright for e2e, husky pre-commit/pre-push hooks, and a structured logger (`src/lib/logger.ts`). Match all of it. Do not introduce new tooling without a reason stated in the PR description.
- **Verify before changing.** Several claims below were verified against a June 2026 clone, but the repo may have moved. Re-verify each file path and finding before acting on it. If a finding no longer reproduces, note that and move on — do not "fix" things that aren't broken.
- **Keep the suite green.** `npm run pre-push` (type-check + lint + jest + build) must pass before every push. The Playwright suite (`npm run test:e2e:fast`) must pass before merging anything that touches app behavior.
- **Never fabricate.** No invented test counts, no aspirational README badges, no claimed features that don't exist. Part of this plan exists specifically to make every README claim verifiable.
- **Production is real.** The app is deployed on Vercel with real integrations (Clerk, MongoDB Atlas, Google Places, Twilio, web-push, Resend-style email). Treat environment variables and webhooks as live. Do not rotate/revoke credentials without flagging it to the owner first.
- **One PR per work item** (the numbered items below), unless items are trivially small and adjacent.

---

## 2. Current State (audited June 2026)

**What the app is:** A restaurant decision-making PWA. Users search restaurants via Google Places, organize them into personal/group collections, then decide where to eat via (a) a weighted-random algorithm with 30-day rolling weight decay that penalizes recent picks, or (b) tiered group voting with consensus calculation. Clerk auth, MongoDB Atlas, TanStack Query, Zod, multi-channel notifications (in-app, email, SMS via Twilio, web push), admin panel, ~113k LOC TS/TSX, 133 test files (118 Jest + 15 Playwright suites).

**Audit scores and targets:**

| Dimension       | Weight | Now | Target | Gap summary                                                                                                                    |
| --------------- | ------ | --- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Technical depth | 25%    | 7   | 9      | Good decision engine; nothing _hard_ shipped yet (offline started but unfinished, no real-time)                                |
| Code quality    | 25%    | 8   | 9–10   | Debug endpoint in prod, unit tests not in CI, emoji logging, unverifiable badges                                               |
| Polish          | 20%    | 7   | 9–10   | Placeholder demo GIF, signup wall blocks reviewers, states/a11y unaudited end-to-end                                           |
| Stack relevance | 15%    | 8   | 9–10   | Modern stack already; missing breadth signal (native iOS, AI feature)                                                          |
| Story           | 15%    | 7   | 8      | Real problem + product thinking; no public demo, no users, no write-up. (9–10 requires real adoption — out of scope for code.) |

**Verified facts the plan relies on (re-verify at execution time):**

- CI: `.github/workflows/playwright.yml` is the **only** workflow. It runs e2e on PR/push to main/develop plus a nightly comprehensive lane. **Unit tests, lint, type-check, and build run only in the local husky pre-push hook — nothing enforces them server-side.**
- `src/app/api/debug/push-notifications/route.ts` exists in production code.
- Potentially under-protected endpoints (auth status unverified — auditing them is work item 1.2): `migrate/clear-collections`, `push/test`, `notifications/test`, `decisions/group/subscribe`, the entire `admin/*` family (~15 routes), `cron/*` routes.
- `README.md:34` still says: _"📸 Note: Create a demo GIF showing the core flow"_ and `public/screenshots/DEMO_PLACEHOLDER.md` exists (three real mobile screenshots do exist alongside it).
- README badges (1367 tests, 90%+ coverage, <500KB bundle) are self-asserted, not generated by CI.
- `src/lib/offline-storage.ts` exists — offline support was **started**, not absent. Scope Phase 5 accordingly.
- Emoji-prefixed `console.log`-style strings exist in production server code (e.g., `src/app/api/decisions/group/route.ts` logs "🎯 Group decision created"), despite a structured logger existing at `src/lib/logger.ts` and even a `logs:replace` script.
- `.cursorrules` and AI-tooling artifacts are committed.
- Last substantive activity: October 2025 ("ios app prep" epic left unfinished). Dependencies are ~8 months stale.
- `package.json` carries ~55 scripts, several of which are one-off codemods (`fix-server-actions`, `replace-console-logs`, `comprehensive-fix-contrast-issues`) that read as workspace clutter.

---

## 3. Phase 1 — Security & Hygiene (do first; hours-to-days)

The goal of this phase: nothing in the repo that a senior engineer doing a 15-minute skim would flag as a liability.

### 1.1 Remove the debug endpoint

- Delete `src/app/api/debug/push-notifications/route.ts` (it accepts unauthenticated POSTs and logs arbitrary payloads). If its diagnostics are still useful, fold them into the admin panel behind admin auth instead.
- Grep for anything referencing it (e2e tests, docs, client code) and clean up.

### 1.2 Full API route auth audit

There are ~80 route handlers under `src/app/api/`. For **every** route, document in a table (commit it as `docs/api-auth-matrix.md`): path, methods, expected caller, auth mechanism, and verification status. Specifically verify:

- Every `admin/*` route checks an admin role server-side (not just client-side nav hiding). Verify how admin-ness is determined and that it can't be self-assigned.
- `migrate/clear-collections` — this name implies a destructive data operation. If it's a leftover migration utility, **delete it**. If needed, it must require admin auth + a confirmation token.
- `push/test`, `notifications/test`, `admin/alerts/test-email`, `sms` — test/utility endpoints must require auth or be deleted.
- `cron/*` routes must validate a cron secret (header-based, not query-param).
- `webhooks/clerk` must verify the svix signature (the `svix` dep exists; confirm it's actually used).
- Mutation routes (`collections/*`, `groups/*`, `decisions/*`, `friends/*`) must verify **ownership/membership**, not just authentication — e.g., only a group admin can `promote`/`remove`, only the collection owner can mutate it. Write a focused Jest test per ownership check you fix; this was the exact class of bug that sank the TCG-Demo audit.

### 1.3 Logging cleanup

- Replace all emoji/console logging in server code with the structured logger (`src/lib/logger.ts`). The repo's own `npm run logs:clean` script may do most of this — run it, review the diff carefully, then hand-fix the remainder.
- Add an ESLint rule (`no-console` with allowlist for the logger module) so it can't regress.

### 1.4 Repo hygiene

- Remove or gitignore AI-tooling artifacts: `.cursorrules` and similar. (Judgment call for the owner: these signal heavy AI assistance to screeners. Removing them from the repo going forward is fine; rewriting git history is NOT in scope.)
- Prune one-off codemod scripts from `package.json` (`dev:fix`, `logs:replace` after 1.3 lands, `fix-colors`, `comprehensive-*`). Move any still-useful ones to `scripts/` with a README note instead of polluting the scripts list.
- Delete `public/screenshots/DEMO_PLACEHOLDER.md` once Phase 3.1 lands.
- `npm audit` + dependency refresh: Next 15.x patch updates, Clerk, mongodb driver, etc. Do **minor/patch bumps only** in this phase; majors (e.g., Next 16, Tailwind, React) get their own PR in Phase 4 with full e2e verification.
- Verify no secrets are committed anywhere in the working tree (`git grep` for key-shaped strings, check `public/` for the dev TLS certs referenced by `dev:https` — `cert-key.pem` in `public/` would be served statically; confirm they're gitignored and not deployed).

### Phase 1 exit criteria

- Zero unauthenticated mutation or debug endpoints; `docs/api-auth-matrix.md` committed and 100% rows verified.
- Zero `console.log` in `src/` server code; ESLint enforces it.
- `npm audit` clean of high/critical; deps current at minor level.

---

## 4. Phase 2 — CI & Quality Gates (days)

The repo's biggest unrealized asset: a 36k-line test suite that no server-side gate enforces.

### 2.1 Add a `ci.yml` workflow

- Jobs on every PR + push to main/develop: `type-check`, `lint`, `format:check`, `jest --coverage`, `next build`.
- Upload coverage (Codecov or the GitHub coverage summary action). The README's coverage badge must become **generated from CI output**, not hand-written.
- Cache `node_modules`/Next build cache; keep PR wall-time under ~10 min so it stays tolerable.
- Note: the Playwright workflow installs with `--legacy-peer-deps` — investigate _why_ (which peer conflict) and fix the underlying conflict if possible rather than propagating the flag into the new workflow.

### 2.2 Integrate the existing quality tooling into CI

- Lighthouse CI (`lhci`) config already exists (`lighthouse` scripts + `lighthouserc` config) — wire it into CI on PRs against a deployed preview URL, with budget assertions (the README's "<500KB bundle" claim becomes a CI-asserted budget or gets removed).
- The axe accessibility spec (`test:accessibility`) and `@smoke`/`@critical` Playwright tags exist — make the smoke+a11y lane a required PR check.

### 2.3 Coverage honesty pass

- Run `npm run test:coverage`. Wherever actual coverage materially differs from the README claim, either raise coverage on the gap (priority: `src/lib/decisions.ts` edges, ownership checks from 1.2, notification orchestration) or correct the claim. The end state: every number in the README is CI-verifiable.

### Phase 2 exit criteria

- A PR cannot merge with failing types, lint, unit tests, build, smoke e2e, or a11y spec.
- README badges are generated, not asserted.

---

## 5. Phase 3 — README & Presentation (days; highest ROI per hour in the whole plan)

A hiring manager spends 2–5 minutes here. This phase is about those minutes.

### 3.1 Demo GIF + screenshots

- Record the core flow the README placeholder describes: search → add to collection → create group decision → vote → result. Use Playwright to script the flow for a clean recording if helpful. Optimize to <5MB (or host an MP4 and embed a poster frame).
- Replace the `README.md:34` placeholder note. Keep/refresh the three existing mobile screenshots; add 2–3 desktop shots (heatmap of states: search results, group vote in progress, decision result).

### 3.2 Restructure the README for a 3-minute skim

Current README is 57KB — thorough but unskimmable. Restructure:

1. One-paragraph pitch + demo GIF + **live URL** + "Try it without signing up" link (depends on 4.1).
2. Feature highlights (bullets, each one line).
3. Architecture diagram (the existing diagrams are good — promote the best one).
4. "Engineering highlights" — 4–6 short sections each linking to real code: the decision engine, the notification orchestration, the circuit breaker, offline storage, testing strategy. These are interview talking points; write them so an interviewer can click through to the cited file.
5. Verifiable badges (from Phase 2).
6. Move the remaining deep content to `docs/` and link it. Nothing valuable gets deleted — it gets organized.

### 3.3 Decision-algorithm case study

- Write `docs/decision-engine.md` (~1–2 pages): the problem (groups deadlock on "where to eat"; pure random feels bad when it repeats), the 30-day rolling weight-decay design, the tiered group-voting consensus rules, edge cases the tests cover, and what you'd do differently. Link it from the README. This is the single best artifact for raising the _story_ dimension via engineering writing.

### Phase 3 exit criteria

- A reviewer who only reads the README sees: working GIF, live link, instant demo path, verifiable badges, and three deep-linkable engineering stories.

---

## 6. Phase 4 — Product Polish (1–2 weeks)

### 4.1 Frictionless demo mode (the single most important product change)

A recruiter will not create an account. Build a no-signup path:

- A "Try the demo" button on the landing page that enters a sandboxed demo session: pre-seeded collections, a fake group with simulated members, and the ability to run both decision modes end-to-end.
- Implementation options (agent's choice, justify in PR): a shared demo Clerk user with server-enforced read-mostly semantics + periodic reset cron, or a parallel "demo mode" that runs the decision engine against seeded in-memory/localStorage data with no writes to shared state. The second is safer; the first is more honest. Either way: demo data resets, can't touch real users, and SMS/email/push sends are suppressed in demo sessions.

### 4.2 UX state audit

- Walk every page in three states: loading, empty, error (kill the network in devtools; use Playwright route interception to force API failures). Fix every blank screen, layout shift, or raw error. The repo already has skeleton/empty-state patterns — extend them to full coverage and add `@critical` e2e specs for the worst offenders found.

### 4.3 Accessibility pass

- Run the axe spec across all routes (not just the ones it currently covers), fix violations, then full keyboard-only and VoiceOver passes over the core flow. Target: zero axe violations on every route, all interactive elements reachable and labeled. Document the result in the README (a11y is a differentiator few side projects can claim honestly).

### 4.4 Performance pass with published numbers

- Use the existing `performance-metrics/` harness + Lighthouse CI to capture a **before** baseline, then optimize: bundle analysis (`npm run analyze`), route-level code splitting, image optimization, React Query cache tuning, Mongo index review for the hot queries (decision history, collection lists).
- Publish before/after numbers in `docs/performance.md`. Real numbers ("LCP 3.1s → 1.4s on mobile") are a technical-depth signal; vague claims are noise.

### 4.5 Framework currency (optional, judgment call)

- Evaluate upgrading Next 15 → 16 and Tailwind to current. Only do it if the e2e suite is green afterward; a working Next 15 app beats a half-migrated Next 16 app. Separate PR, easy to abandon.

### Phase 4 exit criteria

- A stranger can experience the full product in <60 seconds with zero signup.
- Zero axe violations; documented before/after perf numbers; every route handles loading/empty/error.

---

## 7. Phase 5 — Technical Depth: ship one genuinely hard thing (2–4 weeks)

Pick **one** of these two and finish it completely. A finished hard feature beats two half-finished ones. Recommendation: 5A, because `offline-storage.ts` already exists and "offline-first PWA with sync conflict resolution" is the strongest depth signal for this app's shape.

### Option 5A — Offline-first with sync conflict resolution (recommended)

- Audit what `src/lib/offline-storage.ts` already does; design from there.
- Scope: collections and personal decisions work fully offline (IndexedDB via the existing storage layer or Dexie); mutations queue while offline; on reconnect, queued mutations replay with explicit conflict policy (last-write-wins with server timestamps is acceptable IF documented and tested; per-field merge for collection edits is the impressive version).
- Service-worker work: cache-first for app shell and restaurant images, network-first with fallback for API reads, background sync for the mutation queue.
- The hard, demo-able test: airplane-mode the device mid-flow, make edits, reconnect, watch them reconcile — script this as a Playwright test with network interception, and show it in the README GIF or a second short clip.
- Write `docs/offline-sync.md` covering the conflict model and its failure modes honestly.

### Option 5B — Real-time group voting

- Replace polling in group decisions with live updates: SSE (fits Vercel serverless better) or a hosted realtime layer (Pusher/Ably). Live vote tallies, "N of M voted" presence, decision-complete push.
- The hard parts to actually solve and test: reconnection with missed-event replay, vote idempotency under retry, and consensus computed server-side exactly once (no double-fire when two members' final votes race — cf. the claim-first dedup pattern praised in the pawscriptions audit).
- `docs/realtime.md` with the architecture and the race cases handled.

### Phase 5 exit criteria

- The chosen feature works in production, has unit + e2e coverage including its failure modes, and has a design doc. The README engineering-highlights section gains its strongest entry.

---

## 8. Phase 6 — Breadth: native iOS + AI (2–4 weeks each; parallelizable with separate agents)

### 6.1 Finish the iOS companion app

- The repo's final epic was "ios app prep" — finishing your own abandoned epic is itself a good story. Decide scope deliberately: a thin SwiftUI companion (auth via Clerk iOS SDK, view collections, run a personal decision, receive the group-vote push and vote) is enough for the breadth signal. Do NOT attempt feature parity.
- Hard requirements learned from the PokeCollectorSwift audit (its failures are the anti-checklist): **no hardcoded API keys, no `temp_user_id`, no TLS-bypass code, no empty test stubs**. Wire Clerk auth through to every API call; write real unit tests for the API client and view models; TestFlight build at minimum (App Store submission is a stretch goal).
- The web API may need a mobile-auth story (Clerk JWT verification on the API routes — verify the existing middleware handles bearer tokens, not just cookies).

### 6.2 One genuinely useful AI feature

- Best fit: **natural-language group preferences feeding the decision engine** — "somewhere cheap with vegetarian options, not pizza again" → structured filters (cuisine, price, dietary) applied to the candidate pool before the weighted-random/voting round, plus a generated one-line "why this pick" explanation on the result screen.
- Implementation notes: use the current Claude API models (consult the `claude-api` skill/docs at build time for model selection); structured output (tool use / JSON schema) for the filter extraction, never free-text parsing; graceful degradation when the API is down (the circuit breaker in `src/lib/circuit-breaker.ts` is the natural seam); server-side calls only, with cost guardrails via the existing `api-usage-tracker.ts`.
- Keep it small and real. One polished AI interaction beats an "AI-powered everything" rebrand.

### Phase 6 exit criteria

- iOS app on TestFlight, linked from the README with screenshots; AI preference input live in the demo-mode flow (so reviewers actually encounter it).

---

## 9. Phase 7 — Story (ongoing; mostly owner work, agent assists)

The rubric caps story at ~8 without real users. The agent can build the on-ramps; only launch + time produce adoption.

- **Agent-buildable:** demo mode (4.1), the case-study docs (3.3, 5.x), a simple privacy-respecting usage dashboard (the analytics plumbing in `src/lib/analytics.ts` already exists), and an unauthenticated share-a-decision-result page (decision permalinks with OG images — these make the app shareable, which is the adoption mechanic).
- **Owner work, not agent work:** posting it (Show HN / r/webdev / LinkedIn), getting 3–5 real groups using it, then adding a "used by N groups for M decisions" line to the README once it's true.

---

## 10. Sequencing, Effort, and Expected Score Movement

| Order | Phase                             | Effort          | Moves                              |
| ----- | --------------------------------- | --------------- | ---------------------------------- |
| 1     | Security & hygiene                | ~2–4 days       | Quality 8→8.5 (removes negatives)  |
| 2     | CI & gates                        | ~2–3 days       | Quality 8.5→9                      |
| 3     | README & presentation             | ~2–3 days       | Polish 7→8, Story 7→7.5            |
| 4     | Product polish + demo mode        | ~1–2 weeks      | Polish 8→9, Story 7.5→8            |
| 5     | One hard feature (5A recommended) | ~2–4 weeks      | Depth 7→9                          |
| 6     | iOS + AI breadth                  | ~2–4 weeks each | Stack 8→9–10                       |
| 7     | Story on-ramps                    | ongoing         | Story capped ~8 without real users |

Projected end state: **Depth 9 · Quality 9 · Polish 9 · Stack 9 · Story 8 ≈ 8.85 weighted** (from 7.40).

## 11. Watchouts

- **Don't break production.** Real users could appear at any time once the README links go out. Vercel preview deployments + the e2e suite are the safety net; use them.
- **Don't gold-plate Phase 1–3.** They are about removing negatives fast, not perfection. The big score movement is in Phases 4–6.
- **Re-verify every cited path** — this plan was written against a June 2026 depth-50 clone.
- **Twilio/SMS and email sends cost money and hit real phones.** Any test or demo-mode work must suppress real sends (the notification orchestration layer is the seam).
- **If a finding here conflicts with reality, reality wins.** Note the discrepancy in the PR and proceed sensibly.
