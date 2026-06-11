# Session Handoff — Fork In The Road portfolio upgrade

**Last updated:** 2026-06-11
**Read this first, then:** `promptFiles/phased-execution-plan.md` (the authoritative plan), `CLAUDE.md` (repo guide).

## Phase 1 status (2026-06-11): WORK COMPLETE — PRs awaiting creation/merge

All Phase 1 work is implemented, tested, and pushed as a **stacked branch chain**
(each branch based on the previous; merge top-down into main):

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

**Blockers/owner actions:**

- `gh` CLI had a stale token for the wrong account (apersad_deloitte) — PRs could
  not be created from the CLI. Owner: run `gh auth login -h github.com` (as
  akpersad), then PRs can be created per branch, or merge the stack manually.
- New env vars to set in Vercel before merging: `ADMIN_ALERT_EMAILS`,
  `INTERNAL_API_SECRET` (verify it's set — cost-monitoring internal bypass),
  confirm `CRON_SECRET` and `CLERK_WEBHOOK_SECRET` are set (handlers now fail
  closed without them).
- See "Known gaps / deferred" in docs/api-auth-matrix.md (unsubscribe token
  redesign → Phase 5; dead auth/\* routes are deletion candidates).

## Naming

The product is **Fork In The Road** (repo `you-hungry` is historical). Never "You Hungry" in user-facing text or new docs.

## Where we are

**Status: setup complete, Phase 1 NOT started.** Branch `feature/upgrade-plan-rework` (off `main`). **Nothing committed yet.** Uncommitted/untracked files: `CLAUDE.md`, `promptFiles/phased-execution-plan.md`, `promptFiles/youhungry-upgrade-plan.md`, `tech-debt-audit.md`, `DESIGN-UI-UX-SKILLS.md`, `skills-lock.json`, `.agents/`, `.cursor/` + `.github/` impeccable additions, this file.

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

## Key technical findings (verify before acting — from architecture sweep, not yet confirmed line-by-line)

- `src/middleware.ts` appears to mark `/api/decisions/*`, `/api/collections/*`, `/api/restaurants/search` as PUBLIC routes — likely the single biggest security issue; Phase 1 starts here.
- The Oct 2025 "ios app prep" epic (last activity) was docs-only — no Swift code exists anywhere.
- `db.ts` has a module-level connection side effect and exports `db: Db | undefined` (tech-debt P1 #3).
- No rate limiting on `/api/sms` + `/api/auth/*` (tech-debt P1 #1 — real Twilio cost exposure).
- 54 deps strictly pinned, ~8 months stale; only CI is Playwright (`.github/workflows/playwright.yml`) — unit/lint/build enforced only by local husky pre-push.
- Production is LIVE (fork-in-the-road.vercel.app) with real Clerk/Mongo/Twilio/Resend/push integrations. Suppress real sends in any test/demo work; don't rotate credentials without flagging the owner.

## Next actions

1. Commit the setup files on `feature/upgrade-plan-rework` (owner was about to approve this — confirm grouping; owner's convention from `.cursorrules`: logical grouped commits, conventional format).
2. Begin **Phase 1** per `phased-execution-plan.md`: verify the middleware public-route finding first, then the route auth audit → `docs/api-auth-matrix.md`, rate limiting, db.ts fix, logging cleanup, dep unpinning + Dependabot, repo hygiene.
3. One PR per work item; `npm run pre-push` must pass before push; `npm run test:e2e:fast` before merging behavior changes.

## Owner context

- Owner: Andrew Persad, solo dev; this is a portfolio flagship for a job search.
- Owner prefers being consulted on genuinely owner-level decisions (asked good questions throughout); phases are worked one at a time with regroups between.
