# Fork In The Road v2 — Phased Workplan

_Companion to [CHARTER.md](./CHARTER.md). Each phase is one branch, one PR,
one review checkpoint, and one clean context-clear point. Owner reviews and
merges at every boundary; course-correction between phases is expected, not
exceptional. Scope inside a phase may shrink to protect the checkpoint —
never silently grow._

## Execution model

- **Greenfield-in-repo.** v2 is built as a parallel app tree served at
  `/beta` (route group `src/app/(v2)` with its own root layout, tokens, and
  component namespace `src/components/v2/`). v1 routes stay untouched until
  cutover, so every phase merges to `main` and deploys without breaking the
  live product. The final phase swaps v2 to `/` and deletes v1 wholesale.
- **New data model, side-by-side.** v2 collections live in the same Atlas
  cluster under new names (`forks`, `places`, `lists`, `crews`, `guests`)
  with code-defined indexes. No v1 document is mutated before cutover; a
  one-time migration script (owner's real history/lists) runs at cutover.
- **Workflow rules unchanged:** one branch per phase, multiple logical
  commits, owner merges all PRs, never push without explicit go-ahead,
  `npm run pre-push` green before every push, HANDOFF.md + this file updated
  at every checkpoint.
- **Verification is self-serve:** from Phase 1 onward every journey must be
  drivable by Claude alone via the dev-instance test squad + Playwright.

## Phase ledger

Status: ☐ not started · ▶ in progress · ✅ merged

| #   | Phase                     | Branch                  | Status |
| --- | ------------------------- | ----------------------- | ------ |
| 0   | README + v2 charter/plan  | `phase4/readme-v2-plan` | ▶      |
| 1   | Foundations & test rig    | `v2/foundations`        | ☐      |
| 2   | Identity & design system  | `v2/identity`           | ☐      |
| 3   | The Fork (core loop)      | `v2/fork`               | ☐      |
| 4   | Fork Links & guest voting | `v2/fork-links`         | ☐      |
| 5   | Places & Lists            | `v2/places`             | ☐      |
| 6   | Crews & history           | `v2/crews`              | ☐      |
| 7   | Cutover & purge           | `v2/cutover`            | ☐      |
| 8   | Polish, PWA & launch      | `v2/launch`             | ☐      |

---

### Phase 0 — README + charter + workplan _(this session)_

**Deliverables:** honest README rewrite; CHARTER.md; this workplan; HANDOFF
refresh.
**Checkpoint:** owner reads the charter and workplan, challenges the thesis,
approves or redirects before any v2 code exists. Cheapest possible moment to
course-correct.

### Phase 1 — Foundations & test rig

Make v2 buildable and self-verifiable before building anything visible.

- Clerk **dev instance** test squad: 4–5 users via `+clerk_test` emails
  (fixed OTP), representing organizer / member / guest-turned-member roles.
- Dev database (separate `MONGODB_DATABASE`) with seed script: test users,
  sample places (cached Google payloads so dev work doesn't bill the Places
  API), sample history for weight testing.
- Notification suppression: hard seam that no-ops external sends outside
  prod (verify against the existing notification-service seam).
- `(v2)` route scaffold at `/beta` with its own layout; placeholder tokens.
- v2 schema (`src/lib/v2/schema.ts` + models + code-defined indexes) for
  forks/places/lists/crews/guests, including the guest-identity and
  fork-token design.
- Port decision math into `src/lib/v2/` with its test suite green.
- Playwright project for `/beta` wired to the test squad.

**Exit demo:** a scripted end-to-end run (seeded data → fake fork → spin →
persisted result) executes locally with zero owner involvement.
**Owner input needed:** confirm dev Clerk instance keys exist in
`.env.local`; enable Google/Apple social connections in the Clerk dashboard
(dev + prod) — an owner-only dashboard action.

### Phase 2 — Identity & design system

Originate the v2 identity before any journey screens, so no screen is ever
built twice.

- Brand exploration → one committed direction: palette (OKLCH, light + dark),
  type pairing, motion language, voice/microcopy rules. Design-manual craft
  rules (contrast, states, anti-slop) are the acceptance bar.
- Token system + primitive set for v2 (button, card, sheet, input, tabs,
  skeleton, empty state, dialog — each with all eight interactive states).
- The **reveal prototype**: the spin/result moment built for real (motion,
  reduced-motion variant) — the hero gets designed first, not last.
- A `/beta/gallery` page rendering every primitive, state, and the reveal.

**Exit demo / checkpoint:** owner browses `/beta/gallery` on a phone and
desktop, in both modes. This is the "do we love it?" gate — cheap to redo
now, expensive after Phase 3.

### Phase 3 — The Fork (core loop, signed-in + solo-first)

- Fork lane home: cold-open → **near-me spin in ≤ 2 taps** (geolocation,
  vibe filter, weighted spin, reveal, "lock it in" / "keep this one").
- Fork creation flow: source (near me / list / ad-hoc search) → mode →
  lifespan; Fork detail page with live state.
- Vote mode for signed-in users: tap-to-rank top 3, live tally (SSE),
  quorum/timer auto-close, result reveal + breakdown.
- One-tap Clerk sign-in (Google/Apple) integrated where the flow first
  requires an account.

**Exit demo:** solo journey and a 3-user signed-in vote, driven end-to-end
by Playwright with the test squad; owner can also click through on `/beta`.

### Phase 4 — Fork Links & guest voting

The differentiating mechanic gets its own phase and review because it's the
riskiest surface (unauthenticated writes).

- Short fork URLs (`/f/[code]`); public fork page: see options, pick a name,
  rank, watch live results — no account.
- Guest identity: signed httpOnly cookie; revote allowed until close; guest
  votes merged into consensus scoring.
- Abuse controls: signed fork tokens, per-IP + per-fork rate limits, vote
  caps, expiry enforcement, no PII from guests.
- "Claim your votes" — guest converts to account post-vote and keeps
  history.
- Result posting: fork page shows the winner to everyone; push/email result
  to account-holders only.

**Exit demo:** full group-chat simulation — organizer creates fork, two
guests vote from the raw link in incognito sessions, quorum closes it,
everyone sees the reveal. Security checklist (rate limits, token forgery,
replay) reviewed in the PR description.

### Phase 5 — Places & Lists

- Places search on a single consolidated Google client (30-day cache,
  cost tracking kept minimal), save/unsave, list CRUD.
- Lists feed fork creation (source picker) and results feed lists ("keep
  this one" → save).
- Empty/loading/error states designed per the manual — no dead ends: every
  empty state carries the next action.

**Exit demo:** search → save → list → fork-from-list journey, automated +
clickable.

### Phase 6 — Crews & history

- Crew suggestion from repeated co-participants; crew page: members, shared
  weight history ("why this pick" transparency), one-tap re-fork.
- History lane: past forks, results, stats; export kept only if it earns its
  sentence.
- Account-holder notifications: push + email for fork-closed/result, in-app
  center only if push adoption proves insufficient (bias: fewer channels).

**Exit demo:** two seeded users with shared history get a crew suggestion;
crew re-fork honors shared decay weights; automated coverage.

### Phase 7 — Cutover & purge

- Route v2 to `/`; retire `/beta`; redirect map for any v1 URLs worth
  keeping (short links, auth callbacks).
- One-time data migration for real users: users, collections→lists,
  decision history→forks (weights preserved). Dry-run against a prod
  snapshot first; owner approves before it touches Atlas.
- **Delete v1**: old route tree, components, dead lib modules (circuit
  breaker, batching/dedup/throttling, URL shortener, SMS stack, homegrown
  observability + admin sprawl), Twilio + heroicons + critters deps, v1
  Mongo collections archived (dump) then dropped.
- Adopt Vercel Analytics/Speed Insights + hosted error tracking; minimal
  admin page (errors + usage) survives.
- E2E suite rebuilt around v2 journeys; CI gates green on the slimmed repo.

**Exit demo:** production runs v2 at the root domain; repo LOC and dep count
measurably down; owner's real data intact. **This phase merges only with
explicit owner sign-off on the migration dry-run.**

### Phase 8 — Polish, PWA & launch

- PWA pass: manifest/icons for the new identity, service worker, install
  prompts done tastefully (in-context, never on first load).
- Accessibility + performance sweep to the CI-enforced bars; INP focus on
  the reveal and voting interactions.
- README/docs refreshed to describe v2; screenshots/demo GIF; portfolio
  story write-up.
- Backlog triage: whatever was cut along the way gets an honest
  keep/kill/later decision with the owner.

**Exit:** launch-quality v2, documented, demoable, and the portfolio story
told.

---

## Standing risks & mitigations

| Risk                                                   | Mitigation                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Guest voting abuse (unauthenticated writes)            | Phase 4 security checklist: signed tokens, rate limits, caps, expiry; reviewed in PR |
| Google Places cost during dev                          | Seeded/cached payloads in dev DB; single client; cache-first                         |
| Clerk dashboard settings (social login) are owner-only | Flagged as Phase 1 owner action, requested early                                     |
| Two apps in one tree bloat CI                          | v1 test lanes frozen (not extended) from Phase 1; deleted at Phase 7                 |
| Migration corrupts live data                           | Dry-run on snapshot + owner sign-off gate; v1 collections archived before drop       |
| Design direction rejected late                         | Phase 2 gallery gate exists precisely to fail fast                                   |

## Session ritual (every phase)

1. Cut branch from fresh `main` (after prior PR merges).
2. Work in logical commits; `npm run pre-push` before every push request.
3. Update HANDOFF.md + this ledger at each checkpoint/session end.
4. Announce "ready to push", wait for owner go-ahead, owner merges.
5. `/clear` — the next session needs only HANDOFF.md, CHARTER.md, and this
   file to resume losslessly.
