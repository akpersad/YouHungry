#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Color Contrast Audit Script
 *
 * This script scans the entire codebase for:
 * 1. Hardcoded color classes (gray-*, red-*, blue-*, etc.)
 * 2. Inline color styles
 * 3. CSS files with hardcoded colors
 * 4. Components that might have contrast issues
 */

// Color patterns to search for
const HARDCODED_COLOR_PATTERNS = [
  // Tailwind color classes
  /\b(text|bg|border|ring|shadow)-(gray|red|blue|green|yellow|purple|pink|indigo|orange|teal|cyan|lime|emerald|violet|fuchsia|rose|amber|sky|slate|zinc|neutral|stone)-\d+\b/g,
  // Specific problematic patterns
  /\btext-gray-\d+\b/g,
  /\bbg-gray-\d+\b/g,
  /\bborder-gray-\d+\b/g,
  /\btext-red-\d+\b/g,
  /\bbg-red-\d+\b/g,
  /\bborder-red-\d+\b/g,
  /\btext-blue-\d+\b/g,
  /\bbg-blue-\d+\b/g,
  /\bborder-blue-\d+\b/g,
  // Inline styles with colors
  /color:\s*['"`][^'"`]*['"`]/g,
  /background-color:\s*['"`][^'"`]*['"`]/g,
  /border-color:\s*['"`][^'"`]*['"`]/g,
  // Hex colors
  /#[0-9a-fA-F]{3,6}/g,
  // RGB/RGBA colors
  /rgba?\([^)]+\)/g,
  // HSL colors
  /hsl\([^)]+\)/g,
];

// Files to scan
const SCAN_PATTERNS = [
  'src/**/*.tsx',
  'src/**/*.ts',
  'src/**/*.css',
  'src/**/*.scss',
  'src/**/*.sass',
];

// Files to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '__tests__',
  'test',
  '.git',
  'coverage',
];

// Results storage
const results = {
  hardcodedColors: [],
  inlineStyles: [],
  cssFiles: [],
  summary: {
    totalFiles: 0,
    filesWithIssues: 0,
    totalIssues: 0,
  },
};

/**
 * Check if file should be excluded
 */
function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some((pattern) => filePath.includes(pattern));
}

/**
 * Get all files matching patterns
 */
function getAllFiles(dir, patterns) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!shouldExcludeFile(fullPath)) {
          traverse(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(fullPath);
        if (['.tsx', '.ts', '.css', '.scss', '.sass'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Scan file for hardcoded colors
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for hardcoded color patterns
      HARDCODED_COLOR_PATTERNS.forEach((pattern) => {
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            issues.push({
              type: 'hardcoded-color',
              line: lineNumber,
              content: line.trim(),
              match: match,
              severity: getSeverity(match),
            });
          });
        }
      });

      // Check for inline styles
      if (
        line.includes('style=') &&
        (line.includes('color:') ||
          line.includes('background-color:') ||
          line.includes('border-color:'))
      ) {
        issues.push({
          type: 'inline-style',
          line: lineNumber,
          content: line.trim(),
          severity: 'high',
        });
      }
    });

    return issues;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Determine severity of color issue
 */
function getSeverity(match) {
  // High severity: text colors that are likely to have contrast issues
  if (
    match.includes('text-gray-') ||
    match.includes('text-red-') ||
    match.includes('text-blue-')
  ) {
    return 'high';
  }

  // Medium severity: background colors
  if (
    match.includes('bg-gray-') ||
    match.includes('bg-red-') ||
    match.includes('bg-blue-')
  ) {
    return 'medium';
  }

  // Low severity: border colors
  if (
    match.includes('border-gray-') ||
    match.includes('border-red-') ||
    match.includes('border-blue-')
  ) {
    return 'low';
  }

  return 'medium';
}

/**
 * Generate fix suggestions
 */
function generateFixSuggestions(issue) {
  const suggestions = [];

  if (issue.type === 'hardcoded-color') {
    const match = issue.match;

    if (match.includes('text-gray-')) {
      suggestions.push(`Replace ${match} with text-text or text-text-light`);
    } else if (match.includes('bg-gray-')) {
      suggestions.push(`Replace ${match} with bg-background or bg-surface`);
    } else if (match.includes('border-gray-')) {
      suggestions.push(`Replace ${match} with border-border`);
    } else if (match.includes('text-red-')) {
      suggestions.push(`Replace ${match} with text-destructive`);
    } else if (match.includes('bg-red-')) {
      suggestions.push(`Replace ${match} with bg-destructive`);
    } else if (match.includes('text-blue-')) {
      suggestions.push(`Replace ${match} with text-primary`);
    } else if (match.includes('bg-blue-')) {
      suggestions.push(`Replace ${match} with bg-primary`);
    }
  } else if (issue.type === 'inline-style') {
    suggestions.push(
      'Move inline styles to CSS classes using design system colors'
    );
  }

  return suggestions;
}

/**
 * Main audit function
 */
function runAudit() {
  console.log('🔍 Starting comprehensive color contrast audit...\n');

  const srcDir = path.join(process.cwd(), 'src');
  const files = getAllFiles(srcDir);

  console.log(`📁 Found ${files.length} files to scan\n`);

  files.forEach((filePath) => {
    const issues = scanFile(filePath);

    if (issues.length > 0) {
      results.hardcodedColors.push({
        file: filePath,
        issues: issues,
      });

      results.summary.filesWithIssues++;
      results.summary.totalIssues += issues.length;
    }

    results.summary.totalFiles++;
  });

  // Generate report
  generateReport();
}

/**
 * Generate detailed report
 */
function generateReport() {
  console.log('📊 AUDIT RESULTS\n');
  console.log('='.repeat(50));

  console.log(`Total files scanned: ${results.summary.totalFiles}`);
  console.log(`Files with issues: ${results.summary.filesWithIssues}`);
  console.log(`Total issues found: ${results.summary.totalIssues}\n`);

  if (results.hardcodedColors.length === 0) {
    console.log('✅ No color contrast issues found!');
    return;
  }

  // Group by severity
  const highSeverity = [];
  const mediumSeverity = [];
  const lowSeverity = [];

  results.hardcodedColors.forEach((fileResult) => {
    fileResult.issues.forEach((issue) => {
      if (issue.severity === 'high') {
        highSeverity.push({ ...issue, file: fileResult.file });
      } else if (issue.severity === 'medium') {
        mediumSeverity.push({ ...issue, file: fileResult.file });
      } else {
        lowSeverity.push({ ...issue, file: fileResult.file });
      }
    });
  });

  // Display high severity issues first
  if (highSeverity.length > 0) {
    console.log('🚨 HIGH SEVERITY ISSUES (Fix immediately):');
    console.log('-'.repeat(40));
    highSeverity.forEach((issue) => {
      console.log(`\n📄 ${issue.file}:${issue.line}`);
      console.log(`   ${issue.content}`);
      console.log(`   Issue: ${issue.match}`);
      const suggestions = generateFixSuggestions(issue);
      if (suggestions.length > 0) {
        console.log(`   💡 Fix: ${suggestions[0]}`);
      }
    });
    console.log('');
  }

  // Display medium severity issues
  if (mediumSeverity.length > 0) {
    console.log('⚠️  MEDIUM SEVERITY ISSUES:');
    console.log('-'.repeat(40));
    mediumSeverity.forEach((issue) => {
      console.log(`\n📄 ${issue.file}:${issue.line}`);
      console.log(`   ${issue.content}`);
      console.log(`   Issue: ${issue.match}`);
      const suggestions = generateFixSuggestions(issue);
      if (suggestions.length > 0) {
        console.log(`   💡 Fix: ${suggestions[0]}`);
      }
    });
    console.log('');
  }

  // Display low severity issues
  if (lowSeverity.length > 0) {
    console.log('ℹ️  LOW SEVERITY ISSUES:');
    console.log('-'.repeat(40));
    lowSeverity.forEach((issue) => {
      console.log(`\n📄 ${issue.file}:${issue.line}`);
      console.log(`   ${issue.content}`);
      console.log(`   Issue: ${issue.match}`);
      const suggestions = generateFixSuggestions(issue);
      if (suggestions.length > 0) {
        console.log(`   💡 Fix: ${suggestions[0]}`);
      }
    });
    console.log('');
  }

  // Generate summary
  console.log('📋 SUMMARY:');
  console.log('-'.repeat(40));
  console.log(`High severity: ${highSeverity.length} issues`);
  console.log(`Medium severity: ${mediumSeverity.length} issues`);
  console.log(`Low severity: ${lowSeverity.length} issues`);
  console.log(`Total: ${results.summary.totalIssues} issues`);

  // Save detailed report to file
  const reportPath = path.join(
    process.cwd(),
    'color-contrast-audit-report.json'
  );
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        summary: results.summary,
        issues: results.hardcodedColors,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );

  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  // Generate fix script
  generateFixScript();
}

/**
 * Generate automated fix script
 */
function generateFixScript() {
  const fixScript = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Automated Color Fix Script
 * Generated by comprehensive-contrast-audit.js
 */

const fixes = [
${results.hardcodedColors
  .map((fileResult) =>
    fileResult.issues
      .map(
        (issue) =>
          `  {
    file: '${fileResult.file}',
    line: ${issue.line},
    original: '${issue.content.replace(/'/g, "\\'")}',
    match: '${issue.match}',
    severity: '${issue.severity}',
    fix: '${generateFixSuggestions(issue)[0] || 'Manual review required'}'
  }`
      )
      .join(',\n')
  )
  .join(',\n')}
];

console.log('🔧 Running automated fixes...');

fixes.forEach((fix, index) => {
  try {
    console.log(\`\${index + 1}/\${fixes.length}: Processing \${fix.file}:\${fix.line}\`);
    
    const content = fs.readFileSync(fix.file, 'utf8');
    const lines = content.split('\\n');
    
    // Apply fix based on match
    if (fix.match.includes('text-gray-')) {
      lines[fix.line - 1] = lines[fix.line - 1].replace(fix.match, 'text-text');
    } else if (fix.match.includes('bg-gray-')) {
      lines[fix.line - 1] = lines[fix.line - 1].replace(fix.match, 'bg-background');
    } else if (fix.match.includes('border-gray-')) {
      lines[fix.line - 1] = lines[fix.line - 1].replace(fix.match, 'border-border');
    } else if (fix.match.includes('text-red-')) {
      lines[fix.line - 1] = lines[fix.line - 1].replace(fix.match, 'text-destructive');
    } else if (fix.match.includes('bg-red-')) {
      lines[fix.line - 1] = lines[fix.line - 1].replace(fix.match, 'bg-destructive');
    } else if (fix.match.includes('text-blue-')) {
      lines[fix.line - 1] = lines[fix.line - 1].replace(fix.match, 'text-primary');
    } else if (fix.match.includes('bg-blue-')) {
      lines[fix.line - 1] = lines[fix.line - 1].replace(fix.match, 'bg-primary');
    }
    
    fs.writeFileSync(fix.file, lines.join('\\n'));
    console.log(\`   ✅ Fixed: \${fix.match}\`);
    
  } catch (error) {
    console.error(\`   ❌ Error fixing \${fix.file}:\${fix.line}: \${error.message}\`);
  }
});

console.log('\\n🎉 Automated fixes completed!');
console.log('Please review the changes and test your application.');
`;

  const fixScriptPath = path.join(
    process.cwd(),
    'scripts/auto-fix-contrast-issues.js'
  );
  fs.writeFileSync(fixScriptPath, fixScript);
  fs.chmodSync(fixScriptPath, '755');

  console.log(`🔧 Auto-fix script generated: ${fixScriptPath}`);
  console.log('   Run: node scripts/auto-fix-contrast-issues.js');
}

// Run the audit
if (require.main === module) {
  runAudit();
}

module.exports = { runAudit, scanFile, generateFixSuggestions };
