# Session Handoff — Fork In The Road portfolio upgrade

**Last updated:** 2026-06-11
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

## Post-merge: Dependabot majors (branch `fix/dependabot-major-bumps`, awaiting owner PR/merge)

Merging Phase 1 activated dependabot.yml; it opened major-bump PRs, two of
whose preview builds failed. Resolution (commit `2e3f9ce`, pushed, Vercel
preview READY):

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
- After this branch merges: the dependabot typescript PR auto-closes; the
  green minor/patch dependabot PRs (twilio 6, glob 13, …) are the owner's
  call — note twilio 6 and glob 13 are ALSO majors, just ones that built
  green; review before merging.

## Naming

The product is **Fork In The Road** (repo `you-hungry` is historical). Never "You Hungry" in user-facing text or new docs.

## Where we are

**Status: Phase 1 MERGED (PR #45); `fix/dependabot-major-bumps` pushed and awaiting owner PR/merge; Phase 2 (CI & quality gates, then Next 16 + Tailwind 4) starts next.** Phase 2 work should branch off main after the dependabot-fix branch merges (or rebase onto it) so TS 6 + the dependabot ignores are in the base.

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

## Next actions

1. **Owner: open/merge the PR for `fix/dependabot-major-bumps`** (already pushed, preview READY); close the stale Phase 1 stack branches and the dependabot eslint-10 PR.
2. Begin **Phase 2** per `phased-execution-plan.md`, in order:
   - `ci.yml`: type-check, lint, format:check, jest --coverage, build on every PR/push; investigate the `--legacy-peer-deps` root cause rather than propagating it.
   - Coverage uploaded; README badges become CI-generated, not asserted.
   - Lighthouse CI + axe/smoke Playwright lanes as required PR checks.
   - Coverage honesty pass (priority: `decisions.ts` edges, Phase 1 ownership checks, notification orchestration).
   - **Closing PR(s): Next 15 → 16** (Tailwind is already on 4.0.14 — minor bump at most). Fold in eslint-config-next 16 + the React Compiler hooks-rules migration (~74 errors, see Post-merge section). Full e2e verification; abandon rather than ship half-migrated.
3. **Workflow: ONE branch for all of Phase 2, multiple logical commits; NO pushes without owner go-ahead** (see Workflow rules above); `npm run pre-push` must pass per commit batch; `npm run test:e2e:fast` before handing over for merge.

## Owner context

- Owner: Andrew Persad, solo dev; this is a portfolio flagship for a job search.
- Owner prefers being consulted on genuinely owner-level decisions (asked good questions throughout); phases are worked one at a time with regroups between.
