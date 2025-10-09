#!/usr/bin/env node

/**
 * Script to identify and fix hardcoded Tailwind color classes
 * that break dark mode contrast
 */

const fs = require('fs');
const path = require('path');

// Problematic color mappings
const COLOR_MAPPINGS = {
  // Text colors that are too dark for dark mode
  'text-gray-900': 'text-primary', // Almost black -> Primary text
  'text-gray-800': 'text-primary', // Very dark gray -> Primary text
  'text-gray-700': 'text-primary', // Dark gray -> Primary text
  'text-gray-600': 'text-secondary', // Medium gray -> Secondary text
  'text-gray-500': 'text-tertiary', // Light gray -> Tertiary text

  // Background colors that are too light for dark mode
  'bg-gray-100': 'bg-tertiary', // Very light gray -> Tertiary background
  'bg-gray-200': 'bg-quaternary', // Light gray -> Quaternary background
  'bg-gray-50': 'bg-secondary', // Off-white -> Secondary background

  // Border colors
  'border-gray-200': 'border-quaternary', // Light border -> Quaternary border
  'border-gray-300': 'border-quinary', // Medium border -> Quinary border
};

// Critical files to prioritize (user-facing components)
const CRITICAL_FILES = [
  'src/app/dashboard/page.tsx',
  'src/app/history/page.tsx',
  'src/components/features/RestaurantCard.tsx',
  'src/components/features/RestaurantCardCompact.tsx',
  'src/components/features/CollectionRestaurantsList.tsx',
  'src/components/features/GroupView.tsx',
  'src/components/features/ManualDecisionForm.tsx',
  'src/app/profile/page.tsx',
  'src/components/forms/CreateGroupForm.tsx',
  'src/components/features/FriendList.tsx',
  'src/components/features/GroupList.tsx',
];

function findFilesWithHardcodedColors() {
  const results = [];

  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (
        stat.isDirectory() &&
        !item.startsWith('.') &&
        item !== 'node_modules'
      ) {
        scanDirectory(fullPath);
      } else if (
        stat.isFile() &&
        (item.endsWith('.tsx') || item.endsWith('.ts'))
      ) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const relativePath = path.relative(process.cwd(), fullPath);

        // Check for problematic colors
        const matches = [];
        for (const [oldColor, newColor] of Object.entries(COLOR_MAPPINGS)) {
          const regex = new RegExp(oldColor, 'g');
          const found = content.match(regex);
          if (found) {
            matches.push({ oldColor, newColor, count: found.length });
          }
        }

        if (matches.length > 0) {
          results.push({
            file: relativePath,
            matches,
            isCritical: CRITICAL_FILES.includes(relativePath),
            totalIssues: matches.reduce((sum, m) => sum + m.count, 0),
          });
        }
      }
    }
  }

  scanDirectory(path.join(process.cwd(), 'src'));
  return results.sort((a, b) => {
    // Prioritize critical files, then by total issues
    if (a.isCritical && !b.isCritical) return -1;
    if (!a.isCritical && b.isCritical) return 1;
    return b.totalIssues - a.totalIssues;
  });
}

function generateFixReport(results) {
  console.log('🔍 HARDCODED COLOR AUDIT REPORT\n');
  console.log('='.repeat(80));

  const criticalFiles = results.filter((r) => r.isCritical);
  const otherFiles = results.filter((r) => !r.isCritical);

  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total files with issues: ${results.length}`);
  console.log(`   Critical user-facing files: ${criticalFiles.length}`);
  console.log(`   Other files: ${otherFiles.length}`);
  console.log(
    `   Total color instances: ${results.reduce((sum, r) => sum + r.totalIssues, 0)}`
  );

  if (criticalFiles.length > 0) {
    console.log('\n🚨 CRITICAL FILES (User-facing components):');
    console.log('-'.repeat(50));

    criticalFiles.forEach((file) => {
      console.log(`\n📁 ${file.file}`);
      console.log(`   Total issues: ${file.totalIssues}`);
      file.matches.forEach((match) => {
        console.log(
          `   ${match.oldColor} → ${match.newColor} (${match.count} instances)`
        );
      });
    });
  }

  if (otherFiles.length > 0) {
    console.log('\n📋 OTHER FILES:');
    console.log('-'.repeat(50));

    otherFiles.slice(0, 10).forEach((file) => {
      // Show top 10
      console.log(`📁 ${file.file} (${file.totalIssues} issues)`);
    });

    if (otherFiles.length > 10) {
      console.log(`   ... and ${otherFiles.length - 10} more files`);
    }
  }

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. Fix critical files first (user-facing components)');
  console.log(
    '2. Use design system classes instead of hardcoded Tailwind colors'
  );
  console.log('3. Test all changes in both light and dark modes');
  console.log(
    '4. Consider adding pre-commit hooks to prevent hardcoded colors'
  );

  console.log('\n🎨 COLOR MAPPING REFERENCE:');
  console.log('   text-gray-900 → text-primary (high contrast text)');
  console.log('   text-gray-600 → text-secondary (body text)');
  console.log('   text-gray-500 → text-tertiary (muted text)');
  console.log('   bg-gray-100 → bg-tertiary (light backgrounds)');
  console.log('   border-gray-200 → border-quaternary (borders)');

  return results;
}

// Main execution
if (require.main === module) {
  console.log('Scanning for hardcoded Tailwind colors...\n');

  const results = findFilesWithHardcodedColors();
  const report = generateFixReport(results);

  // Save detailed report
  const reportPath = path.join(process.cwd(), 'docs/hardcoded-colors-audit.md');
  const reportContent = `# Hardcoded Colors Audit Report

Generated: ${new Date().toISOString()}

## Summary

- **Total files with issues**: ${results.length}
- **Critical files**: ${results.filter((r) => r.isCritical).length}
- **Total color instances**: ${results.reduce((sum, r) => sum + r.totalIssues, 0)}

## Critical Files

${results
  .filter((r) => r.isCritical)
  .map(
    (file) => `
### ${file.file}
- **Total issues**: ${file.totalIssues}
- **Color mappings needed**:
${file.matches.map((m) => `  - \`${m.oldColor}\` → \`${m.newColor}\` (${m.count} instances)`).join('\n')}
`
  )
  .join('\n')}

## All Files

${results
  .map(
    (file) => `
### ${file.file} ${file.isCritical ? '(CRITICAL)' : ''}
- **Total issues**: ${file.totalIssues}
- **Color mappings needed**:
${file.matches.map((m) => `  - \`${m.oldColor}\` → \`${m.newColor}\` (${m.count} instances)`).join('\n')}
`
  )
  .join('\n')}
`;

  fs.writeFileSync(reportPath, reportContent);
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  // Exit with error code if critical issues found
  const criticalIssues = results
    .filter((r) => r.isCritical)
    .reduce((sum, r) => sum + r.totalIssues, 0);
  if (criticalIssues > 0) {
    console.log(
      `\n❌ Found ${criticalIssues} critical color issues that need fixing!`
    );
    process.exit(1);
  } else {
    console.log('\n✅ No critical color issues found!');
    process.exit(0);
  }
}

module.exports = { findFilesWithHardcodedColors, COLOR_MAPPINGS };
