# E2E Tests

Playwright journeys for the Fork In The Road app (rebuilt around v2 at the
Phase 7 cutover).

## Prerequisites

1. `.env.local` pointing `MONGODB_DATABASE` at a dev database (the seed
   script refuses `you-hungry`) with dev-instance Clerk keys (`sk_test_`).
2. `npm run seed:v2-dev` — creates the Clerk test squad
   (scripts/v2/test-squad.ts) and seeds fixture places, a starter list,
   weight history, and a guest. Idempotent; run any time.
3. Kill any dev server on :3000 — the config builds and runs a
   **production** server (the Next dev overlay breaks dialog tests), but
   reuses an existing server locally.

## Suites

| Spec                 | Journey                                                             |
| -------------------- | ------------------------------------------------------------------- |
| app-shell.spec.ts    | Cold-open shell, signed-in shell state                              |
| fork.spec.ts         | Solo quick spin (2 taps, no account), 3-user vote with SSE reveal   |
| fork-links.spec.ts   | Guest voting from the raw /f link, revote, quorum close, claim flow |
| places-crews.spec.ts | Search → save → list → fork-from-list; crew suggestion → re-fork    |
| gallery.spec.ts      | Design-system states, the reveal, axe scans in both color modes     |

`auth.setup.ts` signs in the squad (organizer/member1/member2) once per run
and saves storage states under `playwright/.auth/`.

## Commands

```bash
npm run test:e2e            # everything (chromium + mobile-chrome @smoke)
npm run test:e2e:smoke      # @smoke cuts only
npm run test:accessibility  # every axe scan, chromium
npm run test:e2e:mobile     # mobile-chrome project
```

## Tags

- `@smoke` — the fastest critical-path cuts; run as a required PR check and
  re-run on Mobile Chrome.
