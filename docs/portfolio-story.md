# The v1 → v2 story

_The portfolio write-up behind Fork In The Road's re-imagination
(2026-07-01 → 2026-07-05, WORKPLAN phases 0–8)._

## The setup

v1 was a feature-complete restaurant decision app that had grown the way
side projects grow: ~113k lines, 77 API routes, a 9-file notification stack
spanning SMS/email/push/in-app, a homegrown URL shortener, a homegrown
observability platform with ~21 admin routes, two duplicate Google Places
clients, and an onboarding flow that landed users in a 1,351-line settings
page. Every feature worked. Almost none of them were the product.

The owner's brief for v2 was explicit: **a full product re-imagination with
original thinking** — v1's docs and design system demoted to reference, not
true north.

## The thesis

Watching how the app was actually used produced one sentence: _the product
is the moment the debate ends._ Everything in v2 serves it:

- **The Fork** is the atom: source + mode + lifespan. Not collections, not
  groups, not profiles. A decision.
- **The group chat is the platform.** v1 required both sides of a decision
  to have accounts and be "friends." v2's fork link lets anyone vote with a
  display name. Accounts are for keeping things, not for participating.
- **Structure emerges from behavior.** v1 asked users to build groups
  before deciding anything. v2 watches decision history and suggests a crew
  after the same people finish three forks, back-attaching the history so
  shared weights work from day one.
- **Deletion as a feature.** SMS (and its cost), the URL shortener, the
  in-app notification center, the observability platform, CSV export,
  onboarding tours: all dead. What remained got sharper.

## What was deliberately kept

The decision math was v1's proven IP: 30-day decay weights with a 10%
floor, weighted spin, 3/2/1 ranked consensus. It was ported pure — history,
clock, and RNG injected — and pinned with unit tests asserting bit-identical
parity with v1's curve, bucket boundaries, and tie-break behavior. Migrated
decisions keep their original timestamps, so the weight a place carried on
cutover day is exactly the weight it carried the day before.

Five v1 modules survived the purge on merit: the structured logger, the DB
connection singleton, the Mongo fixed-window rate limiter, the
notification-suppression seam, and the API cost tracker.

## The parts worth talking about in an interview

- **Identity: participant = userId XOR guestId.** Guests are a signed
  httpOnly cookie carrying zero PII. Claiming converts a guest to an
  account via a one-way pointer; a revote after claiming replaces the guest
  ballot in place, so one human can never become two ballots.
- **The unauthenticated write surface** (guest voting) shipped with a
  security checklist in the PR: HMAC-signed fork tokens verified before any
  database read, layered rate limits (per-IP, per-fork, per-user), atomic
  in-place revotes so replays are idempotent, ballot caps enforced in the
  push guard, and expiry checked on every write.
- **No cron.** Fork deadlines are enforced lazily on every read; the SSE
  stream that keeps the room live is also the timer. Closing seals the fork
  with a status-guarded write first, then computes consensus from the
  sealed document — a crashed closer's seal is finished by the next reader,
  and racing closers cannot produce two results.
- **A default-closed billing gate.** Google Places can only be called in
  production or with an explicit opt-in env var. Dev, CI, and tests run on
  seeded fixture data and can never bill; the e2e suite proves its journeys
  without one real API call.
- **The reveal.** The identity ("Tonight's board") rations gold to decision
  moments, and the split-flap reveal is the one sanctioned long animation.
  It never teases the winner mid-spin, collapses to a crossfade under
  reduced motion, and screen readers hear the outcome, not the theater.
  Every palette pair was verified numerically (OKLCH→sRGB) before becoming
  a token; the dark-mode axe scan still caught a white-on-gold 1.3:1 bug,
  which became a mode-invariant `--gold-ink` token and a rule in the
  identity doc.
- **The migration** reuses v1 `_id`s in v2 documents, making it idempotent
  and fully traceable, with a strictly read-only dry run and an execute
  path that demands the target database typed back. The owner sign-off on
  the dry run gated the cutover PR itself.

## The numbers

| Measure                         | v1                                   | v2                              |
| ------------------------------- | ------------------------------------ | ------------------------------- |
| Lines of code (src+e2e+scripts) | ~113k                                | ~20k                            |
| API route handlers              | ~77                                  | ~20                             |
| Runtime dependencies            | 27                                   | 10                              |
| Notification channels           | 4 (SMS/email/push/in-app)            | 2 (push/email, one trigger)     |
| Cost surfaces                   | Places ×2 clients, Twilio, shortener | Places ×1, gated default-closed |
| Sign-up fields                  | email, phone, username, password     | email, password                 |
| Votes without an account        | impossible                           | the core mechanic               |

Same test rigor at a fraction of the size: every phase merged with full
type/lint/format/Jest/build gates green, real multi-user e2e journeys
(guest voting in incognito contexts, SSE convergence, claim, crews) against
a production build, axe WCAG 2.x AA scans in both color modes, and
Lighthouse floors in CI.

## Process notes

The rebuild ran as nine phases (plan → foundations → identity → fork core →
fork links → places → crews → cutover → launch), one branch and one PR per
phase, with an explicit owner gate wherever a decision was irreversible
(the design direction at `/gallery`, the migration dry-run before cutover).
The v1 tree kept running untouched at the root while v2 grew at `/beta`,
then swapped in wholesale — old fork links survive through permanent
redirects, and returning browsers shed v1's service worker via a
self-destructing replacement at the same URL.
