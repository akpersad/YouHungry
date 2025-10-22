# Testing Strategy - You Hungry? App

**Epic 9 Story 3: Advanced Testing & Quality Assurance**

## Overview

This document outlines the comprehensive testing strategy for the You Hungry? application, covering unit tests, integration tests, E2E tests, accessibility testing, and performance monitoring.

## Testing Pyramid

```
                 /\
                /  \  E2E Tests (10%)
               /____\
              /      \  Integration Tests (20%)
             /________\
            /          \  Unit Tests (70%)
           /__________\
```

### Distribution Philosophy

- **70% Unit Tests**: Fast, focused tests for business logic, utilities, and components
- **20% Integration Tests**: Test interactions between modules and API endpoints
- **10% E2E Tests**: Critical user journeys and workflows

## Test Types

### 1. Unit Tests (Jest + React Testing Library)

**Location**: `src/**/__tests__/**/*.test.ts(x)`

**Coverage Target**: 80% overall

- 90%+ for critical business logic (`lib/` directory)
- 80%+ for API routes (`app/api/`)
- 70%+ for UI components (`components/`)

**What to Test**:

- ✅ Business logic functions (decision algorithms, weight calculations)
- ✅ Utility functions (validation, formatting, data transformation)
- ✅ React components (rendering, user interactions, state changes)
- ✅ Custom hooks (state management, API calls)
- ✅ API route handlers (request/response logic)

**What NOT to Test**:

- ❌ Third-party library internals
- ❌ Trivial getters/setters
- ❌ Simple configuration files
- ❌ Type definitions

**Example**:

```typescript
// Good unit test
describe('calculateTieredConsensus', () => {
  it('handles 3-way tie with random selection', () => {
    const votes = [
      { rankings: ['pizza1', 'pizza2', 'pizza3'] },
      { rankings: ['pizza2', 'pizza3', 'pizza1'] },
      { rankings: ['pizza3', 'pizza1', 'pizza2'] },
    ];

    const { winner, reasoning } = calculateTieredConsensus(votes, restaurants);

    expect(winner).toBeDefined();
    expect(reasoning).toMatch(/tie between 3 restaurants/i);
  });
});
```

**Run Commands**:

```bash
npm test                    # Run all unit tests
npm run test:watch          # Watch mode for development
npm run test:coverage       # Generate coverage report
```

---

### 2. Integration Tests

**Location**: `src/**/__tests__/**/*.test.ts` (marked with API calls)

**Purpose**: Test interactions between modules, database operations, and API integrations

**What to Test**:

- ✅ Database operations with real MongoDB connection
- ✅ API route integration with database
- ✅ External API integration (mocked Google Places, Twilio, Resend)
- ✅ Authentication flows with Clerk
- ✅ Complete feature workflows (create collection → add restaurant → make decision)

**Example**:

```typescript
describe('Complete Decision Workflow Integration', () => {
  it('creates collection, adds restaurants, and makes tiered decision', async () => {
    // Create collection
    const collection = await createCollection(userId, 'Test Collection');

    // Add restaurants
    await addRestaurantToCollection(collection._id, restaurant1._id);
    await addRestaurantToCollection(collection._id, restaurant2._id);

    // Start decision
    const decision = await createGroupDecision(
      groupId,
      collection._id,
      'tiered'
    );

    // Submit votes
    await submitGroupVote(decision._id, user1Id, [
      restaurant1._id,
      restaurant2._id,
    ]);
    await submitGroupVote(decision._id, user2Id, [
      restaurant1._id,
      restaurant2._id,
    ]);

    // Complete decision
    const result = await completeTieredGroupDecision(decision._id);

    expect(result.restaurantId).toBe(restaurant1._id);
  });
});
```

---

### 3. E2E Tests (Playwright)

**Location**: `e2e/**/*.spec.ts`

**Coverage**: Critical user journeys (5-7 main flows)

**Test Suites**:

#### 3.1 Authentication Flow (`e2e/authentication.spec.ts`)

- User registration
- User login
- Sign out
- Protected route access

#### 3.2 Restaurant Search (`e2e/restaurant-search.spec.ts`)

- Search by address
- Search with query
- View restaurant details
- Add to collection
- Set custom fields
- Remove from collection

#### 3.3 Tiered Group Decisions (`e2e/group-decision-tiered.spec.ts`) ⭐ CRITICAL

- Clear winner scenario
- 2-way tie (pseudo-random selection)
- 3-way tie (pseudo-random selection)
- Single voter scenario
- Re-voting before deadline
- Real-time vote updates
- Decision completion

#### 3.4 Random Group Decisions (`e2e/group-decision-random.spec.ts`)

- Random selection with weights
- Weight visualization
- Weight decreases after selection
- Decision history tracking

#### 3.5 Group Collaboration (`e2e/group-collaboration.spec.ts`)

- Create group
- Invite members
- Accept/decline invitations
- Manage members
- Create group collections
- Admin controls

#### 3.6 Friend Management (`e2e/friend-management.spec.ts`)

- Search friends
- Send friend requests
- Accept/decline requests
- View friends list
- Remove friends

**Run Commands**:

```bash
npm run test:e2e            # Run all E2E tests
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:smoke      # Quick smoke tests
npm run test:e2e:critical   # Critical path tests only
```

---

### 4. Accessibility Tests

**Location**: `e2e/accessibility.spec.ts`

**Tool**: `@axe-core/playwright` for automated WCAG AA compliance

**Coverage**:

- All public pages (home, sign-in, sign-up)
- All authenticated pages (dashboard, restaurants, groups, friends, history, profile)
- All UI components (buttons, forms, modals, inputs)
- Keyboard navigation flows
- Screen reader support
- Focus management

**Standards**: WCAG 2.1 AA Compliance

**Run Command**:

```bash
npm run test:accessibility
```

---

### 5. Performance Tests

#### 5.1 Lighthouse CI (`lighthouserc.json`)

**Metrics Monitored**:

- Performance Score: ≥80%
- Accessibility Score: ≥90%
- Best Practices Score: ≥85%
- SEO Score: ≥85%
- PWA Score: ≥80%

**Core Web Vitals**:

- First Contentful Paint (FCP): <2s
- Largest Contentful Paint (LCP): <2.5s
- Cumulative Layout Shift (CLS): <0.1
- Total Blocking Time (TBT): <300ms

**Run Commands**:

```bash
npm run lighthouse           # Full Lighthouse run
npm run lighthouse:collect   # Collect metrics only
npm run lighthouse:assert    # Check against budgets
```

#### 5.2 Synthetic Monitoring (`e2e/performance/synthetic-monitoring.spec.ts`)

**Purpose**: Monitor production API performance

**Endpoints Monitored**:

- `/api/collections` - <500ms
- `/api/restaurants/search` - <2s
- `/api/user/profile` - <300ms
- `/api/groups` - <500ms
- `/api/decisions/history` - <800ms
- `/api/friends` - <300ms
- `/api/analytics/personal` - <1s

**Run Command**:

```bash
npm run test:performance
```

#### 5.3 Bundle Size Regression (`e2e/performance/bundle-size.spec.ts`)

**Budgets**:

- Main bundle: <300KB per chunk
- Total initial JS: <500KB
- Individual images: <200KB
- CSS files: <50KB each

**Run on**: Every build in CI/CD

---

## CI/CD Integration

### GitHub Actions Workflows

#### 1. Pull Request (PR) Checks

```yaml
- Unit tests (all)
- Smoke E2E tests (critical paths only, ~5 min)
- Accessibility tests
- Type checking
- Linting
```

#### 2. Main Branch Deployment

```yaml
- Full E2E test suite (all browsers, sharded)
- Lighthouse CI performance tests
- Bundle size regression tests
- Integration tests
```

#### 3. Nightly Scheduled Tests

```yaml
- Full E2E suite with all scenarios
- Synthetic monitoring against production
- Performance benchmarking
- Accessibility full audit
```

### 6. Performance Testing & Benchmarking (Epic 9 Story 4)

**Location**: `performance-metrics/`, `e2e/performance/`

**Purpose**: Establish baseline performance metrics and monitor regressions

**Components**:

1. **Metrics Collection** (`performance-metrics/collect-metrics.js`)

   - Real Web Vitals from Lighthouse (FCP, LCP, FID, CLS, TTFB)
   - API performance from cost monitoring endpoint
   - Bundle size and build time from actual builds
   - System metrics from Node.js runtime

2. **Synthetic Monitoring** (`e2e/performance/synthetic-monitoring.spec.ts`)

   - API response time validation for all endpoints
   - Health checks and uptime monitoring
   - Rate limiting verification
   - Data consistency checks

3. **Performance Baselines**:
   - Bundle: First Load JS < 250KB, Total < 500KB
   - Web Vitals: All metrics targeting "Good" thresholds
   - API Response: Collections <500ms, Search <2s, Analytics <1s
   - Cache Hit Rate: >70% across all layers

**Run Commands**:

```bash
# Collect performance metrics
npm run perf:collect

# Compare with previous metrics
npm run perf:compare

# Generate dashboard
npm run perf:dashboard

# Run performance tests
npm run test:e2e:perf
```

**Documentation**: See `docs/baseline-performance-metrics.md` for complete baselines

---

## Test Data Management

### Fixtures (`e2e/fixtures/test-data.ts`)

**Test Users**:

- `test-user-1@playwright-e2e.test`
- `test-user-2@playwright-e2e.test`
- `test-user-3@playwright-e2e.test`
- `admin@playwright-e2e.test`

**Test Restaurants**: Predefined set of restaurants for consistent testing

**Test Scenarios**: Predefined voting scenarios (clear winner, ties, single voter)

### Database Setup

- **Unit/Integration Tests**: In-memory MongoDB or test database
- **E2E Tests**: Dedicated test database with seed data
- **Cleanup**: Automated cleanup after each test suite

---

## Testing Best Practices

### When to Write Unit Tests

✅ **Do**:

- Test business logic thoroughly
- Test edge cases and error conditions
- Test component rendering and interactions
- Mock external dependencies

❌ **Don't**:

- Test implementation details
- Test third-party library behavior
- Over-test simple components
- Test obvious functionality

### When to Write Integration Tests

✅ **Do**:

- Test feature workflows end-to-end
- Test database operations
- Test API route integration
- Test authentication flows

❌ **Don't**:

- Duplicate unit test coverage
- Test every possible path (use unit tests for that)
- Include UI rendering (use E2E for that)

### When to Write E2E Tests

✅ **Do**:

- Test critical user journeys
- Test cross-browser compatibility
- Test real user interactions
- Test complete workflows

❌ **Don't**:

- Test every edge case (use unit tests)
- Test implementation details
- Create slow, brittle tests
- Test what can be covered by unit tests

---

## Debugging Tests

### Unit Tests

```bash
# Run single test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="tiered"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### E2E Tests

```bash
# Run in headed mode (see browser)
npm run test:e2e:headed

# Run with UI mode (interactive debugging)
npm run test:e2e:ui

# Run single test file
npx playwright test e2e/group-decision-tiered.spec.ts

# Debug specific test
npx playwright test --debug e2e/group-decision-tiered.spec.ts
```

---

## Test Coverage Goals

### Current Coverage (Baseline)

- Overall: 60%
- Lib: 75%
- API Routes: 70%
- Components: 55%

### Target Coverage

- **Overall: 80%**
- **Lib (Business Logic): 90%+**
- **API Routes: 85%+**
- **Components: 75%+**

### How to Improve Coverage

1. **Identify gaps**:

```bash
npm run test:coverage
# Open coverage/lcov-report/index.html
```

2. **Prioritize**:

- Critical business logic first (decision algorithms)
- API routes second
- Components third

3. **Write tests**:

- Focus on uncovered branches
- Add edge case tests
- Test error conditions

---

## Cost Considerations

### Free Tier Limits

**GitHub Actions**:

- 2,000 minutes/month (free tier)
- Optimize by running smoke tests on PR, full suite on main

**Strategy**:

- PR checks: ~5 min (smoke tests)
- Main branch: ~30 min (full suite)
- Nightly: ~60 min (comprehensive)

**Monthly usage**: ~100-150 minutes (well within free tier)

---

## Maintenance

### Regular Tasks

**Weekly**:

- Review failed tests in CI/CD
- Update test data if schema changes
- Check coverage reports

**Monthly**:

- Audit test suite for redundancy
- Update test dependencies
- Review performance baselines

**Quarterly**:

- Major test refactoring if needed
- Update testing strategy
- Performance budget review

---

## Resources

### Documentation

- [Playwright Docs](https://playwright.dev)
- [Jest Docs](https://jestjs.io)
- [Testing Library](https://testing-library.com)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Axe Core](https://github.com/dequelabs/axe-core)

### Tools

- Playwright Test Runner
- Jest
- React Testing Library
- Lighthouse CI
- Axe-core Playwright

---

---

## Mobile Testing Checklist

### Device Testing Matrix

**iOS Devices:**

- iPhone SE (375px): Portrait orientation, touch targets, navigation, forms
- iPhone 12/13 (390px): Full feature testing
- iPhone 12/13 Pro Max (428px): Large screen optimization
- iPad (768px): Tablet layout, landscape orientation

**Android Devices:**

- Samsung Galaxy S21 (360px): Narrow screen testing
- Google Pixel 6 (411px): Standard Android testing

**Key Test Areas:**

- Touch targets (minimum 44px verified)
- Bottom navigation accessibility
- Swipe gestures (decision interface, navigation)
- Form input without zoom trigger (16px font minimum)
- Bottom sheets (drag gestures, snap points)
- Performance (smooth scrolling, 60fps animations)

### Browser Testing

- iOS Safari 14.0+: Touch events, viewport, keyboard, performance
- Chrome Mobile 90.0+: Full compatibility
- Firefox Mobile 88.0+: Alternative browser support
- Samsung Internet 13.0+: Android default browser

### Mobile Component Testing

**Restaurant Cards:**

- Mobile-optimized variant: Large photo (192px), distance badge, clear hierarchy
- Compact variant: Small photo (48px), condensed info
- Touch feedback and 44px minimum touch area

**Bottom Navigation:**

- Fixed positioning with proper z-index
- 60px touch targets with active state feedback
- ARIA labels and keyboard navigation
- Responsive adaptation

**Bottom Sheets:**

- Drag down to close, snap points
- Backdrop click-to-close
- Body scroll lock when open
- Keyboard support (Escape to close)

**View Toggle:**

- Button-only and labeled variants
- Fixed/inline positioning options
- Proper touch target sizing
- Accessibility labels

### Performance Testing

**Mobile Performance:**

- Loading: Fast initial load and navigation
- Animation: 60fps smooth animations
- Memory: Efficient management, no leaks
- Battery: Optimized for mobile battery life

**Core Web Vitals (Mobile):**

- LCP: < 2.5s, FID: < 100ms, CLS: < 0.1
- FCP: < 1.8s, TTI: < 3.8s

### Accessibility Testing (Mobile)

**Touch Accessibility:**

- Touch targets: 44px minimum, adequate spacing
- Visual feedback: Clear on touch
- Error prevention: Prevent accidental touches

**Keyboard Accessibility:**

- Tab navigation: All elements reachable
- Focus indicators: Clear visibility
- Escape key: Closes modals/sheets

**Screen Reader Support:**

- ARIA labels on all components
- Correct roles and descriptions
- Logical reading order

### Edge Cases

**Network Conditions:**

- Offline: Graceful handling
- Slow connection: Works on 3G
- Intermittent: Handles connectivity issues

**Device Conditions:**

- Low memory: Works on constrained devices
- Battery saver mode: Reduced functionality
- Orientation changes: Proper handling

**Testing Tools:**

- Physical devices (primary)
- Browser dev tools (secondary)
- Automated tests (regression)

---

## ⚠️ Critical Testing Patterns (Learned from Production)

### 1. Avoid Module-Level Side Effects

**Problem**: Tests hang indefinitely when modules start background tasks on import

**Root Cause**: Files with top-level `setInterval()` or `setTimeout()` calls

**Bad Pattern**:

```typescript
// ❌ BAD: api-cache.ts
const cache = new Map();

// This runs immediately when file is imported
setInterval(() => {
  cleanupExpiredEntries(cache);
}, 60000);
```

**Good Pattern**:

```typescript
// ✅ GOOD: Guard with environment check
const cache = new Map();

if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    cleanupExpiredEntries(cache);
  }, 60000);
}
```

**Files Already Fixed**:

- `src/lib/api-cache.ts`
- `src/lib/request-deduplication.ts`

**Why This Matters**:

- Tests import these modules (directly or transitively)
- Background intervals prevent test process from exiting
- Tests appear to "hang" or run forever
- No timeout errors, just infinite execution

**Jest Configuration** (already in `jest.setup.js`):

```javascript
// Global test timeout to catch hanging tests
jest.setTimeout(10000); // 10 seconds

// Clean up timers between tests
beforeEach(() => {
  jest.clearAllTimers();
});
```

**iOS Testing Equivalent**:

```swift
// Use #if DEBUG to prevent background tasks in tests
class CacheManager {
  init() {
    #if !DEBUG
    setupCleanupTimer()
    #endif
  }

  private func setupCleanupTimer() {
    Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { _ in
      self.cleanupCache()
    }
  }
}

// In tests
override func tearDown() {
  // Cancel any running operations
  operationQueue.cancelAllOperations()

  // Invalidate timers
  cleanupTimer?.invalidate()

  super.tearDown()
}
```

### 2. Mock Global Fetch for API Tests

**Pattern**: Prevent actual API calls during tests

```javascript
// jest.setup.js
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: [] }),
  })
);
```

**Per-Test Override**:

```typescript
it('handles API error', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

  // Test error handling
  await expect(fetchData()).rejects.toThrow('Network error');
});
```

### 3. Clean Up Async Operations

**Pattern**: Always wait for async operations to complete

```typescript
// ❌ BAD
it('updates data', () => {
  fetchData(); // Fires and forgets
  expect(data).toBeUpdated(); // Race condition!
});

// ✅ GOOD
it('updates data', async () => {
  await fetchData();
  expect(data).toBeUpdated();
});

// ✅ BETTER (with act wrapper for React)
it('updates component', async () => {
  await act(async () => {
    render(<Component />);
  });

  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

### 4. Test Timeout Management

**Pattern**: Set appropriate timeouts for slow operations

```typescript
// Default timeout (jest.setup.js)
jest.setTimeout(10000); // 10 seconds

// Override for slow test
it('performs slow operation', async () => {
  // Test code
}, 30000); // 30 seconds for this specific test
```

**When to Increase Timeout**:

- External API calls (even mocked, if complex)
- Database operations with large datasets
- Complex rendering with many components
- E2E tests with network delays

**When NOT to Increase**:

- If test consistently times out, fix the test (don't just increase timeout)
- Tests should complete quickly (<5s for unit, <30s for integration)

### 5. Mock Logger to Reduce Noise

**Pattern**: Suppress console output during tests

```javascript
// jest.setup.js
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
```

**When to See Logs**:

```typescript
// In specific test
it('logs error correctly', () => {
  const consoleSpy = jest.spyOn(console, 'error');

  performAction();

  expect(consoleSpy).toHaveBeenCalledWith('Expected error message');
});
```

## 📊 Test Results Tracking

### Success Metrics (Current)

**Unit Tests**:

- Test Suites: 99 passed / 99 total (100%)
- Tests: 1,220 passed / 1,234 total (98.9%)
- Execution Time: ~11 seconds
- Zero timeout errors ✅
- Zero hanging tests ✅

**E2E Tests**:

- Critical paths: 100% passing
- Cross-browser: Chrome, Firefox, Safari tested
- Mobile devices: iOS, Android tested

### Performance Baselines

**Test Execution Times**:

- Unit tests: 10-15 seconds (target: <20s)
- Integration tests: 30-60 seconds (target: <90s)
- E2E tests (full suite): 15-25 minutes (target: <30m)
- E2E tests (smoke): 3-5 minutes (target: <10m)

**iOS Testing Equivalent**:

```swift
// XCTest performance metrics
func testPerformanceExample() {
  measure {
    // Code to measure
    loadRestaurants()
  }
}

// Results stored in .xcresult bundle
// Compare against baseline in CI/CD
```

## Summary

This testing strategy ensures:

- ✅ **High confidence** in code quality
- ✅ **Fast feedback** during development
- ✅ **Automated quality gates** in CI/CD
- ✅ **Accessibility compliance**
- ✅ **Performance monitoring**
- ✅ **Mobile optimization** across devices
- ✅ **Cost-effective** test execution
- ✅ **Maintainable** test suite
- ✅ **No hanging tests** (learned from production incidents)
- ✅ **Proper async handling** (prevents race conditions)

**Questions?** Refer to this document or reach out to the team.
