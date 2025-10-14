#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { COLOR_REPLACEMENTS } = require('./utils/color-contrast-utils');

/**
 * Comprehensive Color Fix Script
 * Fixes hardcoded color classes to use design system colors
 * Combines functionality from comprehensive-fix-contrast-issues.js and fix-hardcoded-colors.js
 */

console.log('🔧 Starting comprehensive color contrast fixes...\n');

// Get all TypeScript/TSX files in src directory
function getAllTsxFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (
          !item.includes('node_modules') &&
          !item.includes('.next') &&
          !item.includes('dist')
        ) {
          traverse(fullPath);
        }
      } else if (
        stat.isFile() &&
        (item.endsWith('.tsx') || item.endsWith('.ts'))
      ) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

let totalFilesProcessed = 0;
let totalReplacements = 0;

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let fileReplacements = 0;

    // Apply all color replacements from shared utils
    Object.entries(COLOR_REPLACEMENTS).forEach(([oldColor, newColor]) => {
      const regex = new RegExp(`\\b${oldColor}\\b`, 'g');
      const matches = newContent.match(regex);

      if (matches) {
        newContent = newContent.replace(regex, newColor);
        fileReplacements += matches.length;
        totalReplacements += matches.length;
      }
    });

    // Write the updated content if changes were made
    if (fileReplacements > 0) {
      fs.writeFileSync(filePath, newContent);
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`✅ ${relativePath}: ${fileReplacements} replacements`);
    }

    totalFilesProcessed++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Process all TypeScript/TSX files
console.log('Scanning for TypeScript/TSX files...\n');

const srcDir = path.join(process.cwd(), 'src');
const allFiles = getAllTsxFiles(srcDir);

console.log(`Found ${allFiles.length} files to process\n`);

allFiles.forEach((filePath) => {
  processFile(filePath);
});

console.log('\n🎉 Comprehensive fixes completed!');
console.log(`📊 Summary:`);
console.log(`   Files processed: ${totalFilesProcessed}`);
console.log(`   Total replacements: ${totalReplacements}`);

console.log('\n📋 Next steps:');
console.log('1. Test your application to ensure all changes work correctly');
console.log('2. Run the audit script again to verify fixes');
console.log('3. Check for any remaining issues that need manual review');

console.log(
  '\n💡 Note: Some complex color combinations may need manual review'
);
console.log('   Check the detailed audit report for any remaining issues.');
