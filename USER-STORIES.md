# User Stories — Fork In The Road

Code-derived audit of every user story the app serves, written at the start of
Phase 3 (the Experience Phase). Each story records the flow **as implemented**
(with file paths), a verdict, and what Phase 3 does about it. This document is
also the regression-test charter: e2e and manual verification should be able
to walk every ✅ story end-to-end. The final Phase 3 commit updates the
"Phase 3 action" column with the commit that resolved each item.

**Verdicts:** ✅ makes sense · ⚠️ friction · ❌ broken/missing

**Personas:**

- **New user** — just heard about the app, no account, no data.
- **Solo decider** — has collections, wants dinner answered fast.
- **Group organizer** — runs a group (admin), starts decisions, manages members.
- **Group voter** — group member; votes, follows results.
- **Returning user** — has history; manages friends, preferences, past picks.

---

## New user

| #   | Story                                             | Flow as implemented                                                                                                                           | Verdict                                                               | Phase 3 action                                                                     |
| --- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| N1  | Land on the site and understand what the app does | `src/app/page.tsx` — hero, feature cards, FAQ, CTAs                                                                                           | ✅                                                                    | Restyle only (C3–C5)                                                               |
| N2  | Sign up with email, optional phone/SMS opt-in     | `src/app/sign-up/[[...rest]]`, `CustomRegistrationForm` — validation on blur, username availability, breach check, in-form email verification | ✅ polished                                                           | Restyle only                                                                       |
| N3  | Verify phone for SMS                              | `/profile` phone verification (Twilio 6-digit)                                                                                                | ✅                                                                    | Restyle only                                                                       |
| N4  | First sign-in lands somewhere useful              | Redirect → `/dashboard`; with zero collections shows bare text prompt                                                                         | ⚠️ bare empty state, no guidance toward the core loop                 | C6/C7: decision-first dashboard + designed empty state ("add a first spot → spin") |
| N5  | Create my first collection                        | Dashboard → Create Collection modal (`CollectionList.tsx`)                                                                                    | ✅                                                                    | Restyle (C10)                                                                      |
| N6  | Find a restaurant and add it                      | `/restaurants` (`RestaurantSearchPage`) → Add to Collection modal                                                                             | ⚠️ no skeletons; sort appears only after results; fragile ID matching | C9                                                                                 |
| N7  | Make my first decision                            | Buried: collection → Decisions tab → button; result is an instant modal                                                                       | ❌ the core promise is 3–5 taps deep and anticlimactic                | C6: `/decide` + SpinReveal                                                         |
| N8  | Install the PWA / understand notifications        | Manifest + SW exist; install prompt lazy component; permission flows on test pages only                                                       | ⚠️ install/permission UX not user-facing                              | Document only — deferred (demo/polish phase) except manifest colors (C3)           |

## Solo decider

| #   | Story                                                  | Flow as implemented                                                                                  | Verdict                                             | Phase 3 action                                  |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------- |
| S1  | Open app → answered "where do I eat" in under a minute | No decide entry on dashboard; must know to open a collection's tab                                   | ❌ headline story unsupported                       | C6: dashboard hero → `/decide`, 1 tap           |
| S2  | Spin a collection (weighted random)                    | `CollectionView` → `useRandomDecision` → `POST /api/decisions/random-select` → `DecisionResultModal` | ⚠️ works; zero ceremony, instant modal              | C6: SpinReveal choreography                     |
| S3  | Understand _why_ this pick                             | `reasoning` string: "Weighted random selection…" (`src/lib/decisions.ts`)                            | ❌ generic; weights invisible                       | C6: `WhyThisPick` from `/api/decisions/weights` |
| S4  | Not love it → re-roll                                  | "Try Again" in result modal                                                                          | ⚠️ affordance unclear, no hint of remaining options | C6: explicit "Spin again" + candidates hint     |
| S5  | Log a meal decided outside the app                     | `ManualDecisionForm` (history + collection tabs)                                                     | ✅                                                  | Restyle (C12)                                   |
| S6  | Inspect/reset my 30-day weights                        | `WeightManagement.tsx`, `/api/decisions/weights`                                                     | ✅ exists                                           | Recolor viz (C10)                               |
| S7  | Confirm a visit and see it in history                  | Confirm Visit → decision persisted → `/history`                                                      | ✅                                                  | Restyle (C12)                                   |

## Group organizer (admin)

| #   | Story                                 | Flow as implemented                                                                   | Verdict                                         | Phase 3 action                               |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------- |
| O1  | Create a group                        | `/groups` → Create Group modal (`useCreateGroup`)                                     | ✅                                              | Restyle (C11)                                |
| O2  | Invite people                         | TWO paths: email input + friend-selection modal (`GroupView.tsx`)                     | ⚠️ competing methods confuse                    | C11: single Invite flow                      |
| O3  | Promote/demote admins; remove members | Dropdown per member; remove previously fired instantly                                | ⚠️→✅ remove now confirms (C1, `ConfirmDialog`) | Done in C1                                   |
| O4  | Start a tiered vote with a deadline   | `GroupDecisionMaking.tsx` → method modal → `POST /api/decisions/group` (24h deadline) | ✅ logic; ⚠️ modal UX                           | C8: full-page flow                           |
| O5  | Start a group random decision         | Same modal → instant result                                                           | ⚠️ same anticlimax as S2                        | C6/C8 shared reveal                          |
| O6  | See who hasn't voted / nudge          | Vote count "2/5" + notification triggers on creation                                  | ⚠️ no per-member status UI                      | C8: presence line ("Live · 3 of 5 voted")    |
| O7  | Complete or close the decision        | Complete (≥1 vote) / Close with warning                                               | ✅                                              | Restyle (C8)                                 |
| O8  | Review the outcome + how votes fell   | Result card hides after 24h; votes never shown                                        | ❌ no breakdown, history cliff                  | C8: `VoteBreakdown` + past-decisions section |
| O9  | Delete the group safely               | Confirmation modal exists (`GroupView.tsx`)                                           | ✅                                              | —                                            |

## Group voter (member)

| #   | Story                                 | Flow as implemented                                                                                               | Verdict                                                         | Phase 3 action                             |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------ |
| V1  | Receive and accept a group invite     | `GroupInvitations.tsx` cards, accept/decline                                                                      | ✅                                                              | Restyle (C11)                              |
| V2  | Get told a vote is open               | Push/SMS/email per prefs; **no in-app inbox** (`src/components/notifications/` empty; Bell/Panel exist unmounted) | ❌ in-app channel invisible                                     | C13: notification center                   |
| V3  | Rank choices on my phone              | Drag-to-rank inside a Modal (`GroupDecisionMaking.tsx`)                                                           | ⚠️ cramped; drag affordance unclear; 3-choice limit unexplained | C8: full page + tap-to-rank                |
| V4  | Not lose my picks if I close mid-vote | Closing the modal discards selections                                                                             | ❌ no draft                                                     | C8: localStorage draft                     |
| V5  | Change my vote before deadline        | Re-vote supported; yellow warning easy to miss                                                                    | ⚠️                                                              | C8: persistent banner + preloaded rankings |
| V6  | Watch the vote fill in live           | `useGroupDecisionSubscription` + polling fallback; bare "Connected/Disconnected" text                             | ⚠️ status jargon                                                | C8: quiet live-dot presence                |
| V7  | See the result and the breakdown      | Result modal/card only; vanishes after 24h                                                                        | ❌                                                              | C8                                         |

## Returning user

| #   | Story                                           | Flow as implemented                                                                                  | Verdict                                  | Phase 3 action                                                                   |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------- |
| R1  | Re-decide from a past decision                  | `/history` is read-only                                                                              | ❌ no action from history                | C12: Re-decide → `/decide?collectionId=`                                         |
| R2  | Browse history meaningfully                     | Flat list, filters + export exist; calendar view is a placeholder                                    | ⚠️ no date grouping; fake calendar       | C12: date groups; placeholder removed                                            |
| R3  | Revisit a favorite collection                   | Dashboard cards: name only                                                                           | ⚠️ no stats (count, last decided)        | C10: card stats                                                                  |
| R4  | Manage friends incl. withdrawing a sent request | `FriendRequests.tsx` — received/sent shown; **no cancel on sent**                                    | ❌ requests are forever                  | C11: Cancel sent request (may need sender DELETE on `api/friends/requests/[id]`) |
| R5  | Tune notification channels per group            | `/profile` preferences                                                                               | ✅ comprehensive                         | Restyle (C12)                                                                    |
| R6  | Use the app with bad/no connectivity            | SW caches shell; APIs 503 offline; IndexedDB queue partially built                                   | ⚠️ partial by design                     | Out of scope (offline phase) — documented only                                   |
| R7  | Trust that destructive taps won't bite          | Group delete ✅; friend remove ✅; collection delete ✅; leave-group & member-remove fired instantly | ⚠️→✅ confirmed via `ConfirmDialog` (C1) | Done in C1                                                                       |

## Cross-cutting stories

| #   | Story                                       | State                                                          | Verdict                             | Phase 3 action                                   |
| --- | ------------------------------------------- | -------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------ |
| X1  | Every wait feels handled (loading)          | Spinner-only everywhere; no skeletons                          | ⚠️                                  | C7/C9–C12: skeleton variants                     |
| X2  | Every dead end is designed (empty states)   | Mixed bare text/emoji                                          | ⚠️                                  | `EmptyState` primitive (C4), applied per surface |
| X3  | A crash in one surface doesn't kill the app | Only root `error.tsx` (full-page takeover)                     | ⚠️→✅ segment boundaries added (C1) | Done in C1                                       |
| X4  | Test consoles aren't reachable by users     | `/notification-test` could send real SMS, was public           | ❌→✅ admin-gated (C1)              | Done in C1                                       |
| X5  | The app looks like one designed product     | Legacy monochrome + `#e3005a`; neumorphic experiments          | ⚠️                                  | C3–C5 token system + restyle                     |
| X6  | Accessible to everyone (WCAG AA)            | Enforced in CI (axe + Lighthouse ≥0.9); reduced-motion honored | ✅ keep green                       | Every commit                                     |

## Notes / deferred observations

- The root error page uses a mascot ("Nibbles", `src/components/errors/Mascot.tsx`) — conflicts with the no-mascots anti-reference in PRODUCT.md; decide its fate in the cleanup commit (C14) with the owner.
- Restaurant ID multi-format comparison (`RestaurantSearchPage.tsx`) is a correctness risk being fixed in C9 (`normalizeRestaurantId`), not just styling.
- Server-side search pagination, demo mode, offline sync, calendar view: explicitly out of Phase 3 (see plan).
