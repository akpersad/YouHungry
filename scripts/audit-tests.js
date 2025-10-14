#!/usr/bin/env node
/**
 * Test Audit Script
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 *
 * Analyzes the test suite for:
 * - Redundant tests
 * - Coverage gaps
 * - Test quality issues
 * - Performance issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findTestFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (
      stat.isDirectory() &&
      !item.includes('node_modules') &&
      !item.includes('.next')
    ) {
      findTestFiles(fullPath, files);
    } else if (item.endsWith('.test.ts') || item.endsWith('.test.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

function analyzeTestFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  return {
    path: filePath,
    lines: lines.length,
    describes: (content.match(/describe\(/g) || []).length,
    its: (content.match(/\bit\(/g) || []).length,
    expects: (content.match(/expect\(/g) || []).length,
    mocks: (content.match(/jest\.mock\(/g) || []).length,
    beforeEach: (content.match(/beforeEach\(/g) || []).length,
    afterEach: (content.match(/afterEach\(/g) || []).length,
    hasSkipped: content.includes('.skip') || content.includes('xit('),
    hasFocused: content.includes('.only') || content.includes('fit('),
  };
}

function analyzeCoverage() {
  log('\n📊 Running coverage analysis...', 'cyan');

  try {
    execSync('npm run test:coverage -- --silent', { stdio: 'inherit' });

    const coveragePath = path.join(
      process.cwd(),
      'coverage',
      'coverage-summary.json'
    );
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
      return coverage.total;
    }
  } catch (error) {
    log('⚠️  Coverage analysis failed', 'yellow');
  }

  return null;
}

function main() {
  log('\n🔍 Test Suite Audit', 'bright');
  log('━'.repeat(50), 'cyan');

  const srcDir = path.join(process.cwd(), 'src');
  const testFiles = findTestFiles(srcDir);

  log(`\n📁 Found ${testFiles.length} test files`, 'green');

  // Analyze all test files
  const analyses = testFiles.map(analyzeTestFile);

  // Calculate statistics
  const totalLines = analyses.reduce((sum, a) => sum + a.lines, 0);
  const totalTests = analyses.reduce((sum, a) => sum + a.its, 0);
  const totalExpects = analyses.reduce((sum, a) => sum + a.expects, 0);
  const avgTestsPerFile = (totalTests / analyses.length).toFixed(1);
  const avgAssertsPerTest = (totalExpects / totalTests).toFixed(1);

  log('\n📈 Test Suite Statistics:', 'cyan');
  log(`  Total test files: ${testFiles.length}`);
  log(`  Total test cases: ${totalTests}`);
  log(`  Total assertions: ${totalExpects}`);
  log(`  Avg tests per file: ${avgTestsPerFile}`);
  log(`  Avg assertions per test: ${avgAssertsPerTest}`);
  log(`  Total lines of test code: ${totalLines}`);

  // Find issues
  log('\n⚠️  Potential Issues:', 'yellow');

  const skipped = analyses.filter((a) => a.hasSkipped);
  const focused = analyses.filter((a) => a.hasFocused);
  const lowCoverage = analyses.filter((a) => a.its < 3);
  const heavyMocking = analyses.filter((a) => a.mocks > 5);

  if (skipped.length > 0) {
    log(`  ${skipped.length} files with skipped tests:`, 'red');
    skipped.forEach((a) => log(`    - ${path.relative(srcDir, a.path)}`));
  }

  if (focused.length > 0) {
    log(`  ${focused.length} files with focused tests (.only):`, 'red');
    focused.forEach((a) => log(`    - ${path.relative(srcDir, a.path)}`));
  }

  if (lowCoverage.length > 0) {
    log(
      `  ${lowCoverage.length} files with <3 tests (may need more coverage):`,
      'yellow'
    );
    lowCoverage.slice(0, 10).forEach((a) => {
      log(`    - ${path.relative(srcDir, a.path)} (${a.its} tests)`);
    });
    if (lowCoverage.length > 10) {
      log(`    ... and ${lowCoverage.length - 10} more`);
    }
  }

  if (heavyMocking.length > 0) {
    log(
      `  ${heavyMocking.length} files with heavy mocking (>5 mocks):`,
      'yellow'
    );
    heavyMocking.forEach((a) => {
      log(`    - ${path.relative(srcDir, a.path)} (${a.mocks} mocks)`);
    });
  }

  // Coverage analysis
  const coverage = analyzeCoverage();

  if (coverage) {
    log('\n📊 Coverage Summary:', 'cyan');
    log(`  Statements: ${coverage.statements.pct}%`);
    log(`  Branches: ${coverage.branches.pct}%`);
    log(`  Functions: ${coverage.functions.pct}%`);
    log(`  Lines: ${coverage.lines.pct}%`);

    const target = 80;
    if (coverage.statements.pct < target) {
      log(`\n⚠️  Statement coverage is below ${target}% target`, 'yellow');
      log(
        `  Need to increase by ${(target - coverage.statements.pct).toFixed(1)}%`,
        'yellow'
      );
    } else {
      log(`\n✅ Coverage meets ${target}% target!`, 'green');
    }
  }

  // Recommendations
  log('\n💡 Recommendations:', 'cyan');
  log('  1. Review and fix skipped tests');
  log('  2. Remove .only from focused tests before committing');
  log('  3. Add more test cases to files with low coverage');
  log('  4. Consider reducing heavy mocking - use integration tests instead');
  log('  5. Aim for 3-5 assertions per test on average');

  log('\n✅ Audit complete!', 'green');
  log('━'.repeat(50), 'cyan');
}

main();
