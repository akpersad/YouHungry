#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Color Fix Script - Phase 2
 * Fixes remaining hardcoded color classes to use design system colors
 */

console.log('🔧 Starting comprehensive color contrast fixes - Phase 2...\n');

// Extended color replacement mappings
const colorReplacements = {
  // Text colors
  'text-gray-900': 'text-text',
  'text-gray-800': 'text-text',
  'text-gray-700': 'text-text',
  'text-gray-600': 'text-text-light',
  'text-gray-500': 'text-text-light',
  'text-gray-400': 'text-text-light',
  'text-gray-300': 'text-text-light',
  'text-gray-200': 'text-text-light',
  'text-gray-100': 'text-text-light',

  // Background colors
  'bg-gray-900': 'bg-background',
  'bg-gray-800': 'bg-background',
  'bg-gray-700': 'bg-surface',
  'bg-gray-600': 'bg-surface',
  'bg-gray-500': 'bg-surface',
  'bg-gray-400': 'bg-surface',
  'bg-gray-300': 'bg-surface',
  'bg-gray-200': 'bg-surface',
  'bg-gray-100': 'bg-surface',
  'bg-gray-50': 'bg-surface',

  // Border colors
  'border-gray-900': 'border-border',
  'border-gray-800': 'border-border',
  'border-gray-700': 'border-border',
  'border-gray-600': 'border-border',
  'border-gray-500': 'border-border',
  'border-gray-400': 'border-border',
  'border-gray-300': 'border-border',
  'border-gray-200': 'border-border',
  'border-gray-100': 'border-border',

  // Red colors (error states)
  'text-red-600': 'text-destructive',
  'text-red-500': 'text-destructive',
  'text-red-400': 'text-destructive',
  'bg-red-50': 'bg-destructive/10',
  'bg-red-100': 'bg-destructive/10',
  'bg-red-200': 'bg-destructive/10',
  'bg-red-900': 'bg-destructive/20',
  'border-red-200': 'border-destructive',
  'border-red-300': 'border-destructive',
  'border-red-500': 'border-destructive',
  'border-red-600': 'border-destructive',
  'border-red-800': 'border-destructive',

  // Blue colors (primary states)
  'text-blue-600': 'text-primary',
  'text-blue-500': 'text-primary',
  'text-blue-400': 'text-primary',
  'text-blue-300': 'text-primary',
  'text-blue-700': 'text-primary',
  'bg-blue-50': 'bg-primary/10',
  'bg-blue-100': 'bg-primary/10',
  'bg-blue-200': 'bg-primary/10',
  'bg-blue-900': 'bg-primary/20',
  'border-blue-200': 'border-primary',
  'border-blue-300': 'border-primary',
  'border-blue-500': 'border-primary',
  'border-blue-600': 'border-primary',
  'border-blue-800': 'border-primary',

  // Green colors (success states)
  'text-green-600': 'text-success',
  'text-green-500': 'text-success',
  'text-green-400': 'text-success',
  'bg-green-50': 'bg-success/10',
  'bg-green-100': 'bg-success/10',
  'border-green-300': 'border-success',
  'border-green-500': 'border-success',
  'hover:border-green-300': 'hover:border-success',
  'hover:bg-green-50': 'hover:bg-success/10',

  // Focus states
  'focus:ring-red-500': 'focus:ring-destructive',
  'focus:border-red-500': 'focus:border-destructive',
  'focus:ring-blue-500': 'focus:ring-primary',
  'focus:border-blue-500': 'focus:border-primary',

  // Hover states
  'hover:bg-gray-50': 'hover:bg-surface',
  'hover:bg-gray-100': 'hover:bg-surface',
  'hover:border-gray-300': 'hover:border-border',
  'hover:text-gray-700': 'hover:text-text',
  'hover:bg-red-50': 'hover:bg-destructive/10',
  'hover:bg-blue-50': 'hover:bg-primary/10',
  'hover:bg-blue-100': 'hover:bg-primary/10',
  'hover:bg-blue-900': 'hover:bg-primary/20',

  // Dark mode specific
  'dark:bg-gray-800': 'dark:bg-background',
  'dark:bg-gray-700': 'dark:bg-surface',
  'dark:bg-gray-600': 'dark:bg-surface',
  'dark:text-gray-300': 'dark:text-text-light',
  'dark:text-gray-400': 'dark:text-text-light',
  'dark:border-gray-700': 'dark:border-border',
  'dark:border-gray-600': 'dark:border-border',
  'dark:border-gray-800': 'dark:border-border',
  'dark:hover:bg-gray-700': 'dark:hover:bg-surface',
  'dark:hover:bg-gray-800': 'dark:hover:bg-surface',
  'dark:hover:bg-red-900': 'dark:hover:bg-destructive/20',
  'dark:hover:bg-blue-900': 'dark:hover:bg-primary/20',
  'dark:text-red-400': 'dark:text-destructive',
  'dark:text-blue-300': 'dark:text-primary',
  'dark:border-red-600': 'dark:border-destructive',
  'dark:border-red-800': 'dark:border-destructive',
  'dark:border-blue-600': 'dark:border-primary',
  'dark:border-blue-800': 'dark:border-primary',
};

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

    // Apply all color replacements
    Object.entries(colorReplacements).forEach(([oldColor, newColor]) => {
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
