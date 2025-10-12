# E2E Tests - Tagging Guide

## Test Tags

We use Playwright's test tags to organize and filter tests:

### Available Tags

- **`@smoke`** - Quick smoke tests for critical functionality
  - Run time: ~2-3 minutes
  - Run on: Every PR
  - Tests: 5 core tests

- **`@critical`** - Critical path tests that must never break
  - Run time: ~5-10 minutes
  - Tests: ~8 important user journeys

## How to Add Tags

Add tags to test names:

```typescript
// Smoke test (fast, critical)
test('User can login @smoke @critical', async ({ page }) => {
  // test code
});

// Critical test only
test('User can complete tiered decision @critical', async ({ page }) => {
  // test code
});

// Regular test (no tags)
test('User can view decision history', async ({ page }) => {
  // test code
});
```

## Running Tagged Tests

```bash
# Run smoke tests only
npm run test:e2e:smoke

# Run critical tests only
npm run test:e2e:critical

# Run all tests
npm run test:e2e
```

## Current Tagged Tests

### Smoke Tests (@smoke)

1. ✅ User login (authentication.spec.ts)
2. ✅ Restaurant search (restaurant-search.spec.ts)
3. ✅ Tiered decision - clear winner (group-decision-tiered.spec.ts)
4. ✅ Create group (group-collaboration.spec.ts)
5. ✅ Dashboard accessibility (accessibility.spec.ts)

### Critical Tests (@critical)

1. ✅ User login (authentication.spec.ts)
2. ✅ Restaurant search (restaurant-search.spec.ts)
3. ✅ Tiered decision - clear winner (group-decision-tiered.spec.ts)
4. ✅ Tiered decision - single voter (group-decision-tiered.spec.ts)
5. ✅ Create group (group-collaboration.spec.ts)

## Adding More Tags

To add tags to more tests:

1. Identify tests that should be smoke/critical
2. Add `@smoke` and/or `@critical` to test name
3. Update this README

**Smoke test criteria**:

- Fast (<30 seconds)
- Tests core functionality
- No external dependencies
- High value if it catches issues

**Critical test criteria**:

- Tests must-have features
- Core user journeys
- High impact if broken
