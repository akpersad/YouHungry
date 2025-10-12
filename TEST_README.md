# Testing Quick Start Guide

**Epic 9 Story 3: Advanced Testing & Quality Assurance**

## 🚀 Getting Started

### Prerequisites

```bash
# Install dependencies (already done)
npm install

# Install Playwright browsers
npx playwright install
```

---

## 📋 Running Tests

### Unit Tests (Jest)

```bash
# Run all unit tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Interactive UI mode (recommended for development)
npm run test:e2e:ui

# Run with browser visible
npm run test:e2e:headed

# Run quick smoke tests only
npm run test:e2e:smoke

# Run critical path tests
npm run test:e2e:critical
```

**Test Tags**:

- `@smoke` - Quick smoke tests (5 tests, ~2-3 min)
- `@critical` - Critical path tests (8 tests, ~5-10 min)

See `e2e/README.md` for details on test tagging.

### Accessibility Tests

```bash
# Run all accessibility tests
npm run test:accessibility
```

### Performance Tests

```bash
# Run performance monitoring tests
npm run test:performance

# Run Lighthouse CI
npm run lighthouse
```

---

## 🔍 Test Audit

To audit your existing unit tests for redundancy and coverage gaps:

```bash
node scripts/audit-tests.js
```

This will show you:

- Total test statistics
- Potential issues (skipped tests, .only tests, low coverage)
- Coverage summary
- Recommendations for improvement

---

## 📊 Viewing Reports

### Playwright HTML Report

```bash
npx playwright show-report
```

### Coverage Report

```bash
# After running npm run test:coverage
open coverage/lcov-report/index.html
```

### Lighthouse Report

```bash
# After running npm run lighthouse
open lighthouse-reports/index.html
```

---

## 🐛 Debugging Tests

### E2E Tests

```bash
# Debug single test file
npx playwright test --debug e2e/group-decision-tiered.spec.ts

# Run specific test by name
npx playwright test --grep "Clear winner"

# Run with traces
npx playwright test --trace on
```

### Unit Tests

```bash
# Run single test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="tiered"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 🎯 Next Steps to Reach 80% Coverage

1. **Run coverage report**:

   ```bash
   npm run test:coverage
   open coverage/lcov-report/index.html
   ```

2. **Identify gaps**: Look for red/yellow areas in the report

3. **Prioritize**:
   - `lib/` (business logic) - aim for 90%+
   - `app/api/` (API routes) - aim for 85%+
   - `components/` (UI components) - aim for 75%+

4. **Add tests**: Focus on:
   - Uncovered branches
   - Edge cases
   - Error conditions

---

## 📚 Documentation

- **Testing Strategy**: `promptFiles/testing-strategy.md`
- **Implementation Details**: `promptFiles/epic9-story3-testing-implementation.md`
- **Epic Breakdown**: `promptFiles/epic-breakdown.md`

---

## ✅ Pre-Commit Checklist

Before committing:

- [ ] All unit tests pass: `npm test`
- [ ] No skipped tests (.skip)
- [ ] No focused tests (.only)
- [ ] Coverage hasn't decreased
- [ ] E2E smoke tests pass: `npm run test:e2e:smoke`
- [ ] Type check passes: `npm run type-check`
- [ ] Linting passes: `npm run lint`

---

## 🚨 CI/CD Behavior

### On Pull Request:

- ✅ Unit tests
- ✅ Smoke E2E tests (~5 min)
- ✅ Accessibility tests
- ✅ Type checking
- ✅ Linting

### On Main Branch:

- ✅ Full E2E test suite (~30 min)
- ✅ Lighthouse CI
- ✅ Bundle size regression
- ✅ All checks from PR

### Nightly (2 AM):

- ✅ Comprehensive test suite
- ✅ Synthetic monitoring
- ✅ Performance benchmarking

---

## 🆘 Troubleshooting

### Tests are slow

```bash
# Run tests in parallel (Playwright does this by default)
# Run unit tests in parallel
npm test -- --maxWorkers=4
```

### Playwright tests failing locally

```bash
# Update browsers
npx playwright install

# Clear test artifacts
rm -rf playwright-report playwright/.auth
```

### Coverage not generating

```bash
# Clean jest cache
npx jest --clearCache

# Re-run coverage
npm run test:coverage
```

---

## 📞 Need Help?

- **Playwright Docs**: https://playwright.dev
- **Jest Docs**: https://jestjs.io
- **Testing Strategy**: `promptFiles/testing-strategy.md`
- **Test Audit**: `node scripts/audit-tests.js`

---

**Happy Testing! 🎉**
