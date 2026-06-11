# Session Handoff — Fork In The Road portfolio upgrade

**Last updated:** 2026-06-10
**Read this first, then:** `promptFiles/phased-execution-plan.md` (the authoritative plan), `CLAUDE.md` (repo guide).

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
