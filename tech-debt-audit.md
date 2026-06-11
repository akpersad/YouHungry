# Tech Debt Audit — You Hungry? (Fork In The Road)

**Date:** 2026-05-04  
**Scope:** Code · Architecture · Dependencies · Documentation  
**Team:** Solo / 1–2 engineers  
**Stack:** Next.js 15, React 19, TypeScript, MongoDB, Clerk, Vercel

---

## Scoring Method

Each item is scored on Impact (1–5), Risk (1–5), and Effort (1–5, where lower = easier). Priority = (Impact + Risk) × (6 − Effort). Higher score = fix first.

---

## Prioritized Debt Items

### 🔴 P1 — Fix now (Priority 28–32)

---

#### 1. No rate limiting on SMS and auth routes

**Type:** Architecture · **Priority score: 32**

| Impact | Risk | Effort | Score  |
| ------ | ---- | ------ | ------ |
| 3      | 5    | 2      | **32** |

`/api/sms`, `/api/auth/register`, `/api/auth/check-username`, `/api/auth/resend-verification`, and `/api/auth/verify-email` have no rate limiting. The SMS route calls Twilio directly — a single bot can rack up real dollar costs in minutes. Auth routes are open to credential stuffing and enumeration.

**Fix:** Add Vercel's built-in edge rate limiting or a lightweight in-memory rate limiter (e.g. `lru-cache` + token bucket) as middleware on these routes. Apply stricter limits to the SMS route (5 req/min per IP) and auth routes (20 req/min per IP).

**Effort:** ~3–4 hours. A single middleware file covers all affected routes.

---

#### 2. All 54 dependencies are strictly pinned — no auto-patching

**Type:** Dependencies · **Priority score: 30**

| Impact | Risk | Effort | Score  |
| ------ | ---- | ------ | ------ |
| 2      | 4    | 1      | **30** |

54 of 56 packages use exact version pinning (no `^` or `~`). This means security patches in upstream packages never reach your app until you manually bump the version. For a solo dev without a regular update cadence, this is a real vulnerability accumulation risk — especially for `twilio`, `mongodb`, `web-push`, and `@clerk/nextjs`.

**Fix:** Switch runtime dependencies to `^` (accepts patch and minor updates). Keep Playwright pinned — browser compatibility is fragile. Set up a Dependabot or Renovate config to open PRs automatically. Review and merge weekly.

**Effort:** ~1 hour to update `package.json` + add `.github/dependabot.yml`.

---

#### 3. `db.ts` runs a module-level connection and exports `db` as potentially `undefined`

**Type:** Code · **Priority score: 28**

| Impact | Risk | Effort | Score  |
| ------ | ---- | ------ | ------ |
| 3      | 4    | 2      | **28** |

```ts
// Current db.ts
const client = new MongoClient(process.env.MONGODB_URI!);
connectToDatabase().then(...).catch(console.error);  // side effect on import
export { db };  // db is Db | undefined
```

Two problems: (1) the module-level `connectToDatabase()` call fires on every cold start in Vercel's serverless environment, which can create race conditions where routes use `db` before the connection resolves; (2) `db` is typed as `Db | undefined`, so all callers either have to handle undefined or use `!` assertions that will throw at runtime.

**Fix:** Use the standard Next.js MongoDB singleton pattern — cache the client on `global` to survive hot reloads, and change the export to the async `connectToDatabase()` function only (never export `db` directly).

```ts
// Target pattern
let client: MongoClient;
declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

const clientPromise =
  global._mongoClientPromise ??
  (global._mongoClientPromise = new MongoClient(uri).connect());

export default clientPromise;
```

**Effort:** ~2 hours to update `db.ts` and fix all callers.

---

### 🟡 P2 — Fix next sprint (Priority 20–27)

---

#### 4. Two debug/POC pages are live in production

**Type:** Code · **Priority score: 25**

| Impact | Risk | Effort | Score  |
| ------ | ---- | ------ | ------ |
| 2      | 3    | 1      | **25** |

`/design-system-poc` and `/notification-test` are unauthenticated routes accessible in production. The notification test page likely exposes internal push subscription logic. Neither is linked in the UI but both are crawlable and callable.

**Fix:** Delete them, or — if they're needed for ongoing dev — gate them behind `AdminGate` and add a `robots.txt` disallow. Also check `/pwa-explorer` for the same issue.

**Effort:** 30 minutes.

---

#### 5. `google-places.ts` and `optimized-google-places.ts` are two implementations of the same thing

**Type:** Code · **Priority score: 21**

| Impact | Risk | Effort | Score  |
| ------ | ---- | ------ | ------ |
| 4      | 3    | 3      | **21** |

814 lines and 592 lines respectively — total 1,406 lines of Google Places integration code. The "optimized" version was presumably written to fix performance issues in the original, but both still exist and are imported by different parts of the app. Any bug fix or API key rotation needs to happen in two places.

**Fix:** Audit which callers use which file, migrate all callers to `optimized-google-places.ts`, delete `google-places.ts`. If the optimized version is missing anything the original had, merge those functions in first.

**Effort:** ~3–4 hours including testing.

---

#### 6. README has placeholder content and no `.env.example`

**Type:** Documentation · **Priority score: 20**

| Impact | Risk | Effort | Score  |
| ------ | ---- | ------ | ------ |
| 2      | 2    | 1      | **20** |

The README still contains `> 📸 Note: Create a demo GIF...` placeholder text, and version badges reference outdated versions (Next.js 15.5.4 vs actual 15.5.5). More importantly, there is no `.env.example` file — the app uses 25+ environment variables (MongoDB URI, Clerk keys, Twilio credentials, VAPID keys, Google Places API key, Resend API key, etc.) and there's no documented list of what's needed to run locally.

**Fix:** Create `.env.example` with all 25 variable names and placeholder values. Remove placeholder text from README. Update badge versions.

**Effort:** ~1 hour.

---

### 🟠 P3 — Schedule for next month (Priority 10–19)

---

#### 7. Nine notification-related files with blurry ownership

**Type:** Code · **Priority score: 14**

| Impact | Risk | Effort | Score  |
| ------ | ---- | ------ | ------ |
| 4      | 3    | 4      | **14** |

The lib directory contains: `notification-service.ts`, `push-notifications.ts`, `push-service.ts`, `decision-notifications.ts`, `in-app-notifications.ts`, `toast-notifications.ts`, `sms-notifications.ts`, `email-notifications.ts`, and `user-email-notifications.ts`. That's ~130KB of notification code spread across 9 files with overlapping responsibilities. `push-notifications.ts` and `push-service.ts` appear to do the same thing (manage web push) from different angles.

The clear split should be: transport layer (`email.ts`, `sms.ts`, `push.ts`) and domain layer (`decision-notifications.ts`, `friend-notifications.ts`) that calls transports.

**Fix:** Map the call graph, then consolidate the transport files. This is a refactor with meaningful test coverage implications — do it when you have a testing day available.

**Effort:** ~1–2 days.

---

#### 8. Four layout components — unclear which one to use for new pages

**Type:** Architecture · **Priority score: 10**

| Impact | Risk | Effort | Score  |
| ------ | ---- | ------ | ------ |
| 3      | 2    | 4      | **10** |

`AdminLayout`, `AppLayout`, `MainLayout`, and `MobileLayout` all exist. When adding a new route it's not obvious which to use. This will cause layout drift over time.

**Fix:** Document the intent of each layout in a comment at the top of the file, and add a `LAYOUTS.md` note in the components directory. Longer term, consolidate toward 2: one for the app shell, one for auth/marketing pages.

**Effort:** Documentation is 30 minutes. Consolidation is ~1 day of work.

---

## Phased Remediation Plan

This is designed to run alongside feature work — no dedicated "debt sprint" needed.

### Week 1 — Ship the safety fixes

- [ ] Add rate limiting to SMS and auth API routes (P1 #1)
- [ ] Fix `db.ts` to use the serverless-safe singleton pattern (P1 #3)
- [ ] Delete or gate the POC/debug pages (P2 #4)

These three items have the highest risk-to-effort ratio. Collectively ~6–8 hours of work, all isolated changes with no UI impact.

### Week 2 — Dependency hygiene

- [ ] Switch deps to `^` and add Dependabot config (P1 #2)
- [ ] Create `.env.example` and clean up README (P2 #6)

Roughly 2 hours of work total. The Dependabot config pays ongoing dividends.

### Sprint 3 — Code cleanup

- [ ] Consolidate Google Places into one file (P2 #5)
- [ ] Document layout component intent (P3 #8, documentation step only)

These are isolated enough to do in the margins of feature work — pick them up when you're already touching related files.

### Ongoing — Notification refactor

- [ ] Map notification call graph and design the transport/domain split (P3 #7)
- [ ] Implement in phases: consolidate push first, then email, then orchestration layer

This is the biggest refactor and should be treated as its own mini-project. Don't rush it — the current code works, it's just painful to change.

---

## What's Actually Good

For a solo project this size, the tooling setup is strong: Husky + lint-staged enforce formatting on commit, Playwright E2E tests exist alongside Jest unit tests, Lighthouse CI is configured, and there's a custom performance metrics collection system. The type coverage and ESLint config are solid. The architectural patterns (React Query for server state, Zod for validation, proper API route separation) are sound.

The debt here is proportional — it's a project that moved fast and now needs targeted hardening, not a rewrite.
