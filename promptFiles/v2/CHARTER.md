# Fork In The Road v2 — Product Charter

_Authored by Fable, 2026-07-02. This is the v2 north star. PRODUCT.md and
DESIGN.md describe v1 and remain as reference/quality-bar context only._

## The one-sentence thesis

**v1 built an app you must furnish before it feeds you; v2 makes the decision
itself the product — instant for one person, shareable into a group chat for
many, with accounts as a deepener rather than a toll booth.**

## The diagnosis (why v2 exists)

The "where should we eat?" moment lives in a group chat, lasts about ninety
seconds, and involves people with wildly different app-installation appetites.
v1 answered that moment with a toll road: create an account (8 required
fields, phone verification), add friends, create a group, build a group
collection, then find the voting feature buried four levels deep. Every gate
sheds participants, and the person who most needed the app — the impatient
friend who just wants to tap a link and vote — was never served at all.

The concept (weighted spins, ranked group votes, decay-based variety) is
genuinely good. The delivery inverted the funnel.

## The three lanes

Instagram-simple means users are placed in lanes and led down them. v2 has
exactly three, and the first one works with zero setup:

### 1. Fork (default lane — "end the debate")

Open the app, start a **Fork** in two taps. A Fork is a lightweight decision
object with a source, a mode, and a lifespan:

- **Source**: near me (geolocation + optional vibe filter), one of my Lists,
  or ad-hoc picks searched on the spot. No list required — "near me" delivers
  value on a cold open, before any account exists.
- **Mode**: **Spin** (instant weighted-random, solo or "let fate decide" for
  a group) or **Vote** (ranked-choice, 3/2/1 points — v1's proven engine).
- **Lifespan**: Forks end themselves. A vote closes on quorum or on a timer
  (default ~30 minutes). Debates that used to trail off now expire into a
  result. The reveal is the product's hero moment and gets the richest
  design/motion investment.

### 2. Places ("my restaurants")

Search (Google Places), save, and organize into **Lists** — v1's collections,
renamed and demoted from prerequisite to accelerant. A List makes a Fork
faster; its absence never blocks one. Saving a restaurant from a Fork result
is one tap ("keep this one").

### 3. Crew ("my people, our history")

History, weights, and recurring groups. The structural inversion from v1:
**crews emerge from decisions instead of preceding them.** After you've
forked with the same people a few times, the app offers to make it a Crew —
which then carries shared weight history ("we just did sushi"), stats, and a
one-tap re-fork. Nobody fills out a group-creation form to earn the right to
decide.

## The Fork Link (the core mechanic v1 was missing)

Every group Fork mints a short shareable URL. The organizer pastes it into
the group chat — iMessage, WhatsApp, Discord, wherever the debate already is.
**Anyone with the link votes with just a display name. No account, no
install, no verification.** Guest identity persists via a signed cookie so
revotes and result views work; rate limiting and signed tokens keep it
honest.

This one mechanic replaces most of v1's notification machinery. v1 built
SMS, email, push, and in-app channels to pull people into the app; v2
recognizes that **the group chat is the notification channel** — the link
travels where the people already are, and the result posts back into the
Fork page everyone already has open. Push and email survive only as
account-holder conveniences (your Fork closed, your Crew picked a place).
SMS is deleted outright: it cost real money per send, demanded phone
verification at signup, and dragged a homegrown URL shortener behind it. The
Fork Link does its job better for free.

## Accounts: one tap, and only when they pay for themselves

- Sign in with Google/Apple via Clerk. No phone number, no username
  ceremony, no multi-field form. First-run should reach a completed Fork
  faster than v1 reached the end of its registration form.
- An account buys: saved Places/Lists, Crew membership and shared weight
  history, decision history, push/email results. Voting on a Fork Link never
  requires one.
- Organizing a Fork requires an account (spam control + someone must own the
  lifecycle), but creating one is a single tap inside that same flow.

## What carries over from v1 (kept on merit, not sentiment)

- **The decision math** (`decisions.ts`): weighted random with 30-day decay
  and a 10% floor; tiered 3/2/1 consensus with tie-breaks. This is the IP.
- **Auth plumbing patterns**: middleware + `requireAuth` layering, svix
  webhook sync — the audited-clean parts, re-fit to the simpler account
  model.
- **Cost-aware Places caching** (30-day cache), collapsed to one client.
- **The quality culture**: CI gates, axe + Lighthouse accessibility
  enforcement, honest-claims-only documentation.

## What v2 deliberately does not have

- No SMS channel, no phone verification, no URL shortener.
- No homegrown observability platform (Vercel Analytics/Speed Insights + a
  hosted error tracker replace ~21 admin routes and five metrics libraries).
- No dead infrastructure (circuit breaker, request batching/dedup/throttling
  — zero imports in v1; they do not board the boat).
- No mandatory group/collection ceremony before a decision.
- No feature that can't state its purpose in one sentence.

## Visual identity (to be originated in its own phase)

The v2 identity is designed from scratch — palette, type, motion, and voice
are new work, not an evolution of v1's tomato/saffron/olive system. The
design manual (DESIGN-UI-UX-SKILLS.md) remains the **craft bar** (contrast,
motion discipline, state coverage, anti-slop rules); it constrains quality,
not direction. Direction brief for that phase: the energy of the moment the
check hits the table and someone says "okay, we're doing this" — decisive,
social, appetite-forward; calm frame, electric reveal.

## Stack decision (explicitly weighed, not sunk-cost)

**Keep: Next.js on Vercel, MongoDB Atlas, Clerk. Rebuild: everything above
them.** The Clerk→Supabase question was evaluated honestly: Clerk's
integration is the cleanest-audited code in v1, its one-tap social login is
exactly v2's auth model, and guest voting bypasses auth entirely — so the
auth provider was never the bottleneck. Supabase only earns its migration
cost if we also move to Postgres, and the document shapes (Forks, Lists,
weight histories) fit Mongo naturally. Chosen fresh today, this stack wins
on merit; the innovation budget goes to product and design instead of
plumbing.

## Success criteria

1. **Cold open → completed solo Fork in ≤ 2 taps** (no account).
2. **Group chat → cast vote in ≤ 15 seconds** from tapping a Fork Link (no
   account).
3. **New user → organized group Fork in under a minute**, including one-tap
   sign-in.
4. Every journey drivable end-to-end by automated tests with the dev-instance
   test squad — no manual owner intervention to verify a flow.
5. The codebase shrinks: v2 at cutover is meaningfully smaller than v1 while
   doing the job better.
