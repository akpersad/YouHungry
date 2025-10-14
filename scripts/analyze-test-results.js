#!/usr/bin/env node
/**
 * Analyze Playwright test results and extract failures
 */

const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, '../playwright-report/results.json');

if (!fs.existsSync(resultsPath)) {
  console.error('No results.json found. Run tests first.');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

const stats = {
  passed: 0,
  failed: 0,
  skipped: 0,
  timedOut: 0,
};

const failures = [];

// Parse test results
for (const suite of results.suites || []) {
  processSuite(suite);
}

function processSuite(suite) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      for (const result of test.results || []) {
        const status = result.status;

        if (status === 'passed') {
          stats.passed++;
        } else if (status === 'failed') {
          stats.failed++;
          failures.push({
            file: suite.file || suite.title,
            title: spec.title,
            project: test.projectName,
            error: result.error?.message || 'Unknown error',
            stack: result.error?.stack || '',
          });
        } else if (status === 'skipped') {
          stats.skipped++;
        } else if (status === 'timedOut') {
          stats.timedOut++;
        }
      }
    }
  }

  // Process nested suites
  for (const child of suite.suites || []) {
    processSuite(child);
  }
}

console.log('\n=== TEST RESULTS SUMMARY ===');
console.log(`Passed: ${stats.passed}`);
console.log(`Failed: ${stats.failed}`);
console.log(`Skipped: ${stats.skipped}`);
console.log(`Timed Out: ${stats.timedOut}`);
console.log(
  `Total: ${stats.passed + stats.failed + stats.skipped + stats.timedOut}`
);

if (failures.length > 0) {
  console.log('\n=== FAILED TESTS ===\n');

  // Group by file
  const byFile = {};
  for (const failure of failures) {
    const file = failure.file;
    if (!byFile[file]) {
      byFile[file] = [];
    }
    byFile[file].push(failure);
  }

  for (const [file, tests] of Object.entries(byFile)) {
    console.log(`\n${file}:`);

    // Group by test title to see which browsers failed
    const byTest = {};
    for (const test of tests) {
      if (!byTest[test.title]) {
        byTest[test.title] = [];
      }
      byTest[test.title].push(test.project);
    }

    for (const [title, projects] of Object.entries(byTest)) {
      console.log(`  - ${title}`);
      console.log(`    Failed in: ${projects.join(', ')}`);

      // Show one error example
      const example = tests.find((t) => t.title === title);
      if (example && example.error) {
        const errorLines = example.error.split('\n').slice(0, 3);
        console.log(`    Error: ${errorLines.join('\n           ')}`);
      }
    }
  }
}

// Write detailed report
const reportPath = path.join(__dirname, '../E2E_TEST_FAILURES.md');
let markdown = `# E2E Test Failures Report\n\n`;
markdown += `Generated: ${new Date().toISOString()}\n\n`;
markdown += `## Summary\n\n`;
markdown += `- ✅ Passed: ${stats.passed}\n`;
markdown += `- ❌ Failed: ${stats.failed}\n`;
markdown += `- ⏭️ Skipped: ${stats.skipped}\n`;
markdown += `- ⏱️ Timed Out: ${stats.timedOut}\n`;
markdown += `- **Total: ${stats.passed + stats.failed + stats.skipped + stats.timedOut}**\n\n`;

if (failures.length > 0) {
  markdown += `## Failed Tests by File\n\n`;

  const byFile = {};
  for (const failure of failures) {
    const file = failure.file;
    if (!byFile[file]) {
      byFile[file] = [];
    }
    byFile[file].push(failure);
  }

  for (const [file, tests] of Object.entries(byFile)) {
    markdown += `### ${file.replace(/^e2e\//, '')}\n\n`;

    // Group by test title
    const byTest = {};
    for (const test of tests) {
      if (!byTest[test.title]) {
        byTest[test.title] = {
          projects: [],
          error: test.error,
          stack: test.stack,
        };
      }
      byTest[test.title].projects.push(test.project);
    }

    for (const [title, data] of Object.entries(byTest)) {
      markdown += `#### ${title}\n\n`;
      markdown += `**Failed in:** ${data.projects.join(', ')}\n\n`;
      markdown += `**Error:**\n\`\`\`\n${data.error.substring(0, 500)}\n\`\`\`\n\n`;
    }
  }
}

fs.writeFileSync(reportPath, markdown);
console.log(`\n\nDetailed report written to: E2E_TEST_FAILURES.md`);
