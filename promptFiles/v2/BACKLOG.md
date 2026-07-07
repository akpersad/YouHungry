# Post-launch backlog triage

_Phase 8's honest keep/kill/later pass (WORKPLAN: "whatever was cut along
the way gets an honest keep/kill/later decision with the owner").
Recommendations are Fable's; items marked **OWNER** need the owner's call
or the owner's hands (credentials, money, destructive actions)._

## Owner actions still open (not backlog — launch checklist)

1. **OWNER — prod data hygiene:** archive (mongodump) then drop the v1
   collections and the e2e residue already in prod (~611 `groups`, 12
   `clerk_test` users). Scriptable with a dry-run; destructive, so it
   stays owner-run. (Phase 7 handoff item.)
2. **OWNER — Vercel env cleanup:** Twilio and Google-client vars can be
   deleted from the project. No new vars are needed for Phase 8 (the
   service worker, manifest, and privacy page are static).
3. **OWNER — close superseded dependabot PRs** after this branch merges:
   #82, #70, #67 (all taken here), and **#66 close-unmerged** (types must
   track the Node 22 runtime, not jump to 26).

## Later (worth doing, not launch-blocking)

- **Hosted error tracker (Sentry or similar).** The minimal
  `error_logs` + `/admin` capture covers the gap; a hosted tracker
  replaces exactly one call site (`recordServerError`). Revisit if real
  traffic shows up. **OWNER** picks the vendor/plan.
- **Cross-browser e2e (WebKit/Firefox).** Dropped at Phase 7 (they only
  ever ran v1 specs). The suite is engine-agnostic Playwright; adding
  projects is cheap in code but expensive in CI minutes. Recommend: add
  WebKit to the nightly lane only, when the owner wants the spend.
- **Node 24 LTS runtime bump.** Vercel default is moving; repo pins 22
  everywhere (engines/.nvmrc/CI). Bump deliberately in one PR
  (runtime + types + CI matrix) after launch settles.
- **eslint 10.** Blocked today: eslint-plugin-react inside
  eslint-config-next crashes at lint time. Re-try when Next ships a
  compatible config.
- **Google Places: migrate legacy REST → new Places API.** The prod key
  is enabled for legacy endpoints today; migrating needs an owner-level
  console change plus client rework in `google-places.ts`. Watch for a
  Google deprecation date. **OWNER** initiates.
- **PWA manifest screenshots.** The install dialog upgrades to an
  app-store-style card on Android with fresh `screenshots` entries.
  Cheap once real UI settles; the old v1 shots were deleted rather than
  lie.
- **Demo GIF for the README.** Needs a recording pass (Kap/Gifski).
  The four stills carry the story meanwhile. **OWNER** taste call.
- **Place photos via server proxy** (owner call 2026-07-06: "Later",
  demoted from Kill). `photoRef` is persisted for all cached places; a
  server route can stream Place Photos with the key server-side and
  long CDN caching, behind the existing billing gate (~$7/1k uncached
  loads). The discovery cards ship text-forward meanwhile.
- **Crew-attached shared lists** (the second half of the owner's
  2026-07-06 "Both" answer). Invite-link collaborators shipped; a list
  attached to a crew (every member auto-collaborates, membership tracks
  the crew) is the follow-up. Design question to settle: what happens
  to the list when the crew is deleted.
- **Start a NEW fork for an existing crew** (flagged 2026-07-06). Crew
  forks today only come from "Run it back" (same ballot). A fresh
  ballot built at /new can't be crew-attached, so it misses the shared
  weight history and the fork-started push. Needs a crew picker on
  /new (or a "new fork" action on the crew page).

## Kill (decided dead — do not resurrect without new evidence)

- **In-app notification center.** WORKPLAN bias held: push + email,
  two triggers ("We're going here." + the crew fork-started heads-up,
  owner charter amendment 2026-07-06). Still no center.
- **CSV/JSON history export.** "Only if it earns its sentence" — it
  never did. Decision history lives on the crew page where it means
  something.
- **SMS anything.** Cost + carrier compliance killed it in the charter;
  guests-via-link removed the need.
- ~~**Photos in the UI.**~~ Moved to Later (owner call 2026-07-06): a
  server proxy keeps the key out of the client, so the original
  blocker is gone; only the identity/taste question remains.
- **Social login (Google/Apple).** Owner decision on record
  (2026-07-02): not without Apple, and Apple costs money. Email/password
  and guest links carry the load. Revisit only if the Apple economics
  change.

## Root-level v1 reference docs — OWNER decision

`PRODUCT.md`, `DESIGN.md`, `USER-STORIES.md`, `tech-debt-audit.md`, and
`docs/api-auth-matrix.md` describe the deleted v1 app. They were kept
through the rebuild as reference. Options: move to a `docs/v1-archive/`
folder (recommended — the git history keeps them either way), or delete
outright. Stale v1 operational docs with no reference value (color-audit
reports, URL-shortener notes, v1 PWA/perf docs) were deleted in Phase 8;
these five were kept because the owner authored or gated them.
