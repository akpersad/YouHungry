# Bloat Audit & Cleanup Plan

**Date:** October 14, 2025  
**Goal:** Remove all unnecessary code, dependencies, and files to make the application as lean as possible without impacting functionality

---

## 📊 Executive Summary

**Total Bloat Identified:**

- **150+** unnecessary files
- **~2,800** lines of dead/duplicate code
- **7** unused npm packages
- **~350KB** unnecessary bundle size
- **~10MB** wasted disk space

**Expected Results:**

- ⚡ 15-20% faster npm install
- 📦 ~350KB smaller production bundle
- 🗂️ ~10MB less disk space
- 🧹 Cleaner, more maintainable codebase
- ⏱️ Faster test execution

**✅ PHASE 1 COMPLETED - GraphQL Removal:**

- ✓ **17MB** saved from node_modules
- ✓ **1,367 lines** of code removed
- ✓ **58 packages** removed (4 direct + 54 transitive dependencies)
- ✓ **44KB** source code files deleted
- ✓ Real-time updates confirmed working (uses SSE, not GraphQL)

---

## 🔴 CRITICAL BLOAT - HIGH IMPACT

### 1. Unused GraphQL Infrastructure

**Status:** ✅ COMPLETED  
**Priority:** CRITICAL  
**Impact:** 17MB node_modules, 4 packages + 54 dependencies (58 total), 1,367 lines of code

**Files Removed:**

```
✓ src/lib/graphql/ (40KB)
  ├── schema.ts (519 lines)
  ├── resolvers.ts (760 lines)
  └── server.ts (38 lines)

✓ src/app/api/graphql/ (4KB)
  └── route.ts (50 lines)
```

**Dependencies Removed:**

- ✓ `@apollo/server@5.0.0`
- ✓ `@as-integrations/next@4.0.0`
- ✓ `graphql@16.11.0`
- ✓ `graphql-tag@2.12.6`

**Additional Cleanup:**

- ✓ Removed `/api/graphql` from middleware.ts public routes
- ✓ Removed all GraphQL imports

**Actual Results:**

**BEFORE:**

- node_modules: 989M
- GraphQL code: 1,367 lines
- GraphQL disk: 44KB
- Dependencies: 4 packages (+ 54 transitive)

**AFTER:**

- node_modules: 972M (↓ 17MB)
- GraphQL code: 0 lines (↓ 1,367 lines)
- GraphQL disk: 0KB (↓ 44KB)
- Dependencies: 0 packages (↓ 58 total removed)

**Verification:**

- [x] Confirmed ZERO frontend usage
- [x] All files and directories removed
- [x] All dependencies removed (58 packages)
- [x] Middleware updated
- [x] 17MB disk space saved

---

### 2. Duplicate Toast Libraries

**Status:** ✅ COMPLETED  
**Priority:** CRITICAL  
**Impact:** 1MB node_modules, 2 packages removed

**Action:**

- ✓ Migrated 11 files from `react-hot-toast` to `sonner`
- ✓ Updated 4 test files to mock `sonner` instead
- ✓ Updated `next.config.ts` optimizePackageImports
- ✓ Removed `react-hot-toast` from package.json
- ✓ Removed 2 packages (react-hot-toast + goober dependency)

**Verification:**

- [x] Found both libraries were actively used (not duplicate as initially thought)
- [x] Migrated all 11 files using react-hot-toast to sonner
- [x] Updated all test mocks
- [x] All tests passed (GroupInvitations, FriendSelectionModal, page.test)
- [x] Removed dependency from package.json
- [x] Ran npm install --legacy-peer-deps
- [x] Build successful
- [x] Verified all toasts still work

---

### 3. Unused Dependencies

**Status:** ✅ PARTIALLY COMPLETED  
**Priority:** HIGH  
**Impact:** 9MB node_modules, 18 packages removed

**Dependencies Analysis:**

1. **critters** - ❌ CANNOT REMOVE - Required by Next.js `experimental.optimizeCss: true` (line 23 in next.config.ts)
   - Peer dependency of Next.js
   - Build fails without it: "Cannot find module 'critters'"
   - Keeping in package.json as required dependency
2. **node-fetch** - ✅ SUCCESSFULLY REMOVED - Redundant with Node.js 18+ built-in fetch
   - Updated `performance-metrics/collect-metrics.js` to use Node.js built-in fetch
   - Removed from package.json
   - 18 packages removed total (node-fetch + 17 transitive dependencies)

**Verification:**

- [x] Grep confirmed direct usage only in collect-metrics.js
- [x] Updated collect-metrics.js to use built-in fetch (Node v22.18.0)
- [x] Removed node-fetch from package.json
- [x] Kept critters (required by Next.js)
- [x] Run npm install (removed 19 packages, re-added critters = net -18)
- [x] Verified performance script loads without errors
- [x] Run build - successful
- [x] All tests pass

---

## 🟡 MODERATE BLOAT - MEDIUM IMPACT

### 4. Redundant Performance Test Files

**Status:** ❌ Not Started  
**Priority:** MEDIUM  
**Impact:** ~800 lines of duplicate test code

**Files:**

- `src/__tests__/performance.test.tsx` (392 lines) - HAS DUPLICATES
- `src/__tests__/performance-monitoring.test.tsx` (475 lines) - KEEP, unique tests
- `src/__tests__/performance-utils.test.ts` (518 lines) - KEEP, most comprehensive

**Duplicate Test Cases:**

- useDebounce (tested in ALL 3 files)
- useThrottle (tested in ALL 3 files)
- useStableCallback (tested in ALL 3 files)
- PerformanceMonitor component (tested in 2 files)

**Action Plan:**

1. Review `performance.test.tsx` line by line
2. Identify unique tests not in other files
3. Move unique tests to appropriate file
4. Delete `performance.test.tsx`
5. Update imports if needed

**Verification:**

- [ ] Run test suite before changes (baseline)
- [ ] After deletion, verify all tests pass
- [ ] Check coverage hasn't decreased

---

### 5. Empty Debug API Directories

**Status:** ❌ Not Started  
**Priority:** MEDIUM  
**Impact:** Clutter, confusion

**Directories to Delete:**

```
src/app/api/debug/
├── collections/ (EMPTY)
├── env/ (EMPTY)
├── google-places/ (EMPTY)
├── restaurant/ (EMPTY)
├── test-google-places/ (EMPTY)
└── validate-restaurant/ (EMPTY)
```

**Note:** Parent `debug/` directory can be deleted entirely if all subdirs are empty

**Verification:**

- [x] Confirmed all directories are empty
- [ ] Delete directories
- [ ] Verify no build errors

---

### 6. Duplicate Color Contrast Scripts

**Status:** ❌ Not Started  
**Priority:** MEDIUM  
**Impact:** ~1000 lines of duplicate code

**Current Scripts:**

```
scripts/
├── verify-color-contrast.js (221 lines) - SIMILAR TO verify-card-contrast
├── verify-card-contrast.js (220 lines) - SIMILAR TO verify-color-contrast
├── comprehensive-contrast-audit.js - KEEP (most complete)
├── comprehensive-fix-contrast-issues.js - KEEP
├── auto-fix-contrast-issues.js - EVALUATE (may duplicate above)
├── fix-hardcoded-colors.js - KEEP
└── setup-color-prevention.js - KEEP
```

**Duplicate Code:**

- getLuminance() function copied across files
- hexToRgb() function copied across files
- getContrastRatio() function copied across files
- checkCompliance() function copied across files

**Action Plan:**

1. Create `scripts/utils/color-contrast-utils.js` with shared functions
2. Update scripts to import shared utilities
3. Delete redundant scripts:
   - Remove `verify-color-contrast.js`
   - Remove `verify-card-contrast.js`
4. Evaluate if `auto-fix-contrast-issues.js` duplicates `comprehensive-fix-contrast-issues.js`

**Final Script List:**

- `comprehensive-contrast-audit.js` (audit)
- `comprehensive-fix-contrast-issues.js` (fix)
- `fix-hardcoded-colors.js` (prevention)
- `setup-color-prevention.js` (setup)
- `utils/color-contrast-utils.js` (shared utilities)

**Verification:**

- [ ] Create shared utilities module
- [ ] Update imports in remaining scripts
- [ ] Test each script still works
- [ ] Delete redundant scripts

---

### 7. Test Artifact Files

**Status:** ❌ Not Started  
**Priority:** MEDIUM  
**Impact:** ~5MB disk space, repo clutter

**Files to Delete:**

```
Root level:
- test-db-connection.js (127 lines - one-time manual testing)
- tests/skipped/ (empty directory)
- tsconfig.tsbuildinfo (build artifact)

Generated directories (should be gitignored):
- coverage/ (full lcov reports)
- playwright-report/ (test reports)
- test-results/
```

**Action Plan:**

1. Delete `test-db-connection.js`
2. Delete `tests/skipped/` directory
3. Delete `tsconfig.tsbuildinfo`
4. Update `.gitignore` to exclude:
   - `coverage/`
   - `playwright-report/`
   - `test-results/`
   - `tsconfig.tsbuildinfo`

**Verification:**

- [ ] Commit changes
- [ ] Verify files not tracked after gitignore update
- [ ] Document how to regenerate coverage if needed

---

## 🟢 MINOR BLOAT - LOW IMPACT

### 8. Unnecessary Playwright Config

**Status:** ❌ Not Started  
**Priority:** LOW  
**Impact:** Minimal, but adds confusion

**File:** `playwright.config.no-auth.ts`

**Analysis:**

- 48 lines
- Only configures Chromium browser
- Can be replaced with: `npm run test:e2e -- --project=chromium`
- Minimal usage compared to main playwright.config.ts

**Action:**

- Document use case OR
- Remove if not actively used
- Update any scripts that reference it

**Verification:**

- [ ] Search for usage: `grep -r "playwright.config.no-auth" .`
- [ ] Check npm scripts for references
- [ ] Decide: keep or remove
- [ ] If removing, update documentation

---

### 9. Example/Temporary Files

**Status:** ❌ Not Started  
**Priority:** LOW  
**Impact:** ~2MB disk, repo clutter

**Files:**

**A. Example Design Files**

```
public/example-design/
├── image copy 2.png
├── image copy 3.png
├── image copy.png
├── image_copy_3.txt
├── image_copy.txt
└── image.png
```

**Action:** Move to `/docs/design-archive/` or delete entirely

**B. Prompt Files** (20 markdown files)

```
promptFiles/
├── completed-items.md
├── pending-items.md
├── in-flight.md
├── [17 other .md files]
```

**Action:**

- Keep if using for AI context
- Consider moving to separate repo or using `.cursorrules`
- At minimum, organize into subdirectories

**C. Static HTML Dashboards**

```
public/
├── performance-dashboard.html (300+ lines)
└── clear-cache.html (static utility page)
```

**Action:**

- Evaluate if still needed
- Consider moving to admin panel as React components
- If keeping, document purpose

**Verification:**

- [ ] Review each category with team
- [ ] Archive or delete as decided
- [ ] Update documentation

---

### 10. Historical Performance Metrics

**Status:** ❌ Not Started  
**Priority:** LOW  
**Impact:** Growing over time

**Files:**

```
performance-metrics/
├── daily-metrics/ (14 JSON files)
└── comparisons/ (12 JSON files)
```

**Analysis:**

- Growing daily
- No cleanup strategy
- Could be moved to analytics platform
- Or archived periodically

**Recommendation:**

1. Keep last 7 days only
2. Archive older files monthly
3. Or move to external storage/analytics

**Action Plan:**

1. Create archive directory structure
2. Move files older than 7 days
3. Add cleanup script to npm scripts
4. Document archival process

**Verification:**

- [ ] Create archival strategy
- [ ] Move old files
- [ ] Add automated cleanup
- [ ] Document in README

---

## 📋 CLEANUP CHECKLIST

### Phase 1: Quick Wins (No Risk) ✅

- [x] ✅ **Remove unused npm packages** (COMPLETED)
  - [x] GraphQL packages (58 total removed) ✅
  - [x] `react-hot-toast` (2 packages removed - migrated to sonner) ✅
  - [x] `critters` (CANNOT REMOVE - required by Next.js optimizeCss) ⚠️
  - [x] `node-fetch` (18 packages removed - updated to use Node.js built-in fetch) ✅
- [ ] Delete empty debug directories
- [ ] Remove `test-db-connection.js`
- [ ] Delete `tests/skipped/`
- [ ] Update `.gitignore` for coverage/, playwright-report/

**Est. Time:** 15 minutes  
**Risk Level:** None  
**Impact:** ~250KB bundle + cleaner repo  
**Actual Progress:** 27MB saved (17MB GraphQL + 1MB react-hot-toast + 9MB node-fetch dependencies) ✅

---

### Phase 2: Code Cleanup (Low Risk) ✅

- [x] ✅ **Remove GraphQL infrastructure** (COMPLETED)
  - [x] Delete GraphQL files (1,367 lines removed)
  - [x] Remove GraphQL packages (58 packages removed)
  - [x] Update middleware
  - [x] Verified real-time features still work (SSE-based)
- [ ] Consolidate performance tests
  - [ ] Review duplicates
  - [ ] Move unique tests
  - [ ] Delete redundant file
  - [ ] Verify coverage
- [ ] Consolidate color scripts
  - [ ] Create shared utilities
  - [ ] Update scripts
  - [ ] Delete duplicates
  - [ ] Test remaining scripts

**Est. Time:** 1-2 hours  
**Risk Level:** Low (good test coverage)  
**Impact:** ~1800 lines removed, ~150KB bundle

---

### Phase 3: Organization (Medium Risk) ⚠️

- [ ] Archive promptFiles/
- [ ] Archive example-design/
- [ ] Evaluate HTML dashboards
- [ ] Review playwright.config.no-auth.ts
- [ ] Set up metrics archival strategy

**Est. Time:** 30-60 minutes  
**Risk Level:** Low-Medium  
**Impact:** Better organization, ~2MB disk

---

## 🎯 SUCCESS METRICS

### Before Cleanup

- [ ] Run `npm install` - record time
- [ ] Run `npm run build` - record bundle size
- [ ] Run `npm test` - record test count & time
- [ ] Check `du -sh node_modules/` - record size
- [ ] Check `du -sh .` - record total repo size

### After Each Phase

- [ ] Verify all tests pass
- [ ] Verify app builds successfully
- [ ] Verify dev server runs
- [ ] Check bundle size reduction
- [ ] Document any issues encountered

### Final Verification

- [ ] Compare before/after metrics
- [ ] Verify no functionality broken
- [ ] Update documentation
- [ ] Commit changes with detailed message

---

## 📝 NOTES

### Dependencies to Keep (Verified as Used)

- `sonner` - Toast notifications (23 files)
- All other current dependencies appear to be in use

### Areas NOT Audited (Future Work)

- Individual component bloat
- CSS optimization opportunities
- Image optimization
- Database query optimization
- API response size optimization

### Questions/Decisions Needed

- [ ] GraphQL: Remove completely or commit to using?
- [ ] Playwright no-auth config: Keep or remove?
- [ ] HTML dashboards: Keep, move to admin, or remove?
- [ ] PromptFiles: Keep in repo or move elsewhere?
- [ ] Metrics retention: How long to keep?

---

## 🚀 GETTING STARTED

1. Create a new branch: `git checkout -b cleanup/remove-bloat`
2. Start with Phase 1 (quick wins)
3. Commit after each major change
4. Run tests frequently
5. Document any issues or decisions
6. Review with team before merging

---

## 🎉 COMPLETION SUMMARY

### GraphQL Removal - October 14, 2025

**Status:** ✅ COMPLETED

**Actual Savings:**

- **17MB** node_modules size reduction (989M → 972M)
- **1,367 lines** of code removed
- **58 packages** removed (4 direct dependencies + 54 transitive)
- **44KB** source files deleted
- **1 API endpoint** removed (/api/graphql)
- **1 middleware route** removed

**What Was Removed:**

```
✓ src/lib/graphql/schema.ts (519 lines)
✓ src/lib/graphql/resolvers.ts (760 lines)
✓ src/lib/graphql/server.ts (38 lines)
✓ src/app/api/graphql/route.ts (50 lines)
✓ @apollo/server@5.0.0
✓ @as-integrations/next@4.0.0
✓ graphql@16.11.0
✓ graphql-tag@2.12.6
✓ 54 transitive dependencies
```

**Verification:**

- ✅ All GraphQL files and directories removed
- ✅ All GraphQL dependencies uninstalled
- ✅ Middleware updated (removed /api/graphql route)
- ✅ Real-time group decision updates confirmed working (SSE-based, not GraphQL)
- ✅ No impact on existing functionality

**Why Removed:**

- Zero frontend usage (no Apollo Client, no GraphQL queries written)
- REST + React Query already handles all data fetching efficiently
- No N+1 query problems in current architecture
- Real-time features use Server-Sent Events (SSE), not GraphQL subscriptions
- iOS app development will be simpler with REST (standard URLSession)
- Smaller bundle size and simpler codebase

**Time Taken:** 15 minutes  
**Risk Level:** None (zero frontend usage confirmed)

---

### Toast Library Consolidation - October 14, 2025

**Status:** ✅ COMPLETED

**Actual Savings:**

- **1MB** node_modules size reduction (972M → 971M)
- **2 packages** removed (react-hot-toast + goober dependency)
- **11 files** migrated from react-hot-toast to sonner
- **4 test files** updated to mock sonner
- **1 config file** updated (next.config.ts)
- **0 lines** removed (migration, not deletion)

**What Was Changed:**

```
✓ Migrated Components:
  - FriendSelectionModal.tsx
  - GroupInvitations.tsx
  - RestaurantSearchPage.tsx
  - src/app/groups/page.tsx
  - src/app/restaurants/page.tsx
  - src/app/groups/[id]/page.tsx
  - src/app/groups/[id]/collections/page.tsx

✓ Migrated Test Files:
  - GroupView.test.tsx
  - FriendSelectionModal.test.tsx
  - GroupInvitations.test.tsx
  - page.test.tsx

✓ Configuration Updates:
  - next.config.ts: optimizePackageImports updated

✓ Dependencies Removed:
  - react-hot-toast@2.6.0
  - goober (transitive dependency)
```

**Verification:**

- ✅ All 11 component files migrated successfully
- ✅ All 4 test files updated and passing
- ✅ Full test suite passed
- ✅ Production build successful
- ✅ No functionality impacted
- ✅ Toast notifications confirmed working

**Why Migrated (Not Just Removed):**

- Initial audit incorrectly stated only `sonner` was used
- Both libraries were actively used in parallel (technical debt)
- `react-hot-toast` used in 11 files, `sonner` in 10 files
- Consolidated to single toast library (`sonner`) for consistency
- `sonner` already configured in root layout as primary toast provider
- Cleaner, more maintainable codebase with single toast solution

**Metrics Summary:**

**BEFORE:**

- node_modules: 972M
- Total repo: 1.0G
- Toast libraries: 2 (react-hot-toast + sonner)
- Files using react-hot-toast: 11

**AFTER:**

- node_modules: 971M (↓ 1MB)
- Total repo: 1.0G (same)
- Toast libraries: 1 (sonner only)
- Files using sonner: 21 (11 migrated + 10 existing)

**Time Taken:** 20 minutes  
**Risk Level:** Low (comprehensive testing performed)

---

### Node-Fetch Removal - October 14, 2025

**Status:** ✅ COMPLETED

**Actual Savings:**

- **9MB** node_modules size reduction (971M → 962M)
- **18 packages** removed (node-fetch + 17 transitive dependencies)
- **148KB** direct package size
- **1 dependency** removed from package.json
- **0 lines** removed from source (updated to use Node.js built-in fetch)

**What Was Changed:**

```
✓ performance-metrics/collect-metrics.js:
  - Removed dynamic node-fetch import
  - Removed initializeFetch() function
  - Updated to use Node.js built-in fetch (Node 18+)

✓ package.json:
  - Removed node-fetch@3.3.2
  - Added engines field (node >=18.0.0, npm >=9.0.0)

✓ Dependencies Removed:
  - node-fetch@3.3.2
  - 17 transitive dependencies
```

**What Was NOT Removed:**

```
✗ critters@0.0.23:
  - Required by Next.js experimental.optimizeCss: true
  - Peer dependency of Next.js
  - Build fails without it
  - Kept in package.json as required dependency
```

**Verification:**

- ✅ Updated collect-metrics.js to use built-in fetch
- ✅ Added engines field to package.json (node >=18.0.0)
- ✅ Script loads and runs without errors
- ✅ Performance metrics collection still functional
- ✅ Production build successful
- ✅ All tests passing
- ✅ No impact on existing functionality

**Why Removed:**

- Node.js 18+ (current: v22.18.0) has built-in fetch API
- No need for external fetch polyfill
- Reduces dependency tree by 18 packages
- Simpler, more maintainable codebase
- No compatibility issues

**Time Taken:** 20 minutes  
**Risk Level:** Low (Node 18+ has stable fetch support)

---

**Last Updated:** October 14, 2025  
**Status:** Phase 1 dependency cleanup completed ✅  
**Estimated Total Time:** 2-3 hours  
**Expected Savings:** ~350KB bundle, 2800 lines of code, 7 packages, 10MB disk space  
**Actual Savings So Far:** 27MB disk space, 1367 lines, 78 packages (58 GraphQL + 2 toast + 18 node-fetch) ✅
