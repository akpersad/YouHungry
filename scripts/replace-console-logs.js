#!/usr/bin/env node

/**
 * Script to automatically replace console.log statements with smart logger
 * This helps ensure debug logs don't run in production
 */

const fs = require('fs');
const glob = require('glob');

// Configuration
const config = {
  // Directories to search
  srcDirs: ['src/**/*.{ts,tsx,js,jsx}'],
  // Files to exclude
  exclude: [
    'src/**/*.test.{ts,tsx,js,jsx}',
    'src/**/*.spec.{ts,tsx,js,jsx}',
    'src/__mocks__/**/*',
    'node_modules/**/*',
    '.next/**/*',
  ],
  // Console methods to replace
  consoleMethods: ['log', 'debug', 'info', 'warn', 'error'],
  // Logger import statement
  loggerImport: "import { logger } from '@/lib/logger';",
};

// Patterns for different console methods
const patterns = {
  log: {
    regex: /console\.log\(/g,
    replacement: 'logger.debug(',
    level: 'debug',
  },
  debug: {
    regex: /console\.debug\(/g,
    replacement: 'logger.debug(',
    level: 'debug',
  },
  info: {
    regex: /console\.info\(/g,
    replacement: 'logger.info(',
    level: 'info',
  },
  warn: {
    regex: /console\.warn\(/g,
    replacement: 'logger.warn(',
    level: 'warn',
  },
  error: {
    regex: /console\.error\(/g,
    replacement: 'logger.error(',
    level: 'error',
  },
};

function findFiles() {
  const files = [];

  config.srcDirs.forEach((pattern) => {
    const matches = glob.sync(pattern, {
      ignore: config.exclude,
      cwd: process.cwd(),
    });
    files.push(...matches);
  });

  return [...new Set(files)]; // Remove duplicates
}

function needsLoggerImport(content) {
  return (
    content.includes('logger.debug(') ||
    content.includes('logger.info(') ||
    content.includes('logger.warn(') ||
    content.includes('logger.error(') ||
    content.includes('logger.perf(') ||
    content.includes('logger.api(') ||
    content.includes('logger.component(') ||
    content.includes('logger.analytics(')
  );
}

function addLoggerImport(content) {
  // Skip if already has logger import
  if (content.includes("from '@/lib/logger'")) {
    return content;
  }

  // Determine if it's a client component
  const isClientComponent = content.includes("'use client'");

  if (isClientComponent) {
    // Add after 'use client' directive
    return content.replace(
      /('use client';?\s*\n)/,
      `$1${config.loggerImport}\n`
    );
  } else {
    // Add at the beginning of imports
    const importMatch = content.match(
      /^import\s+.*?from\s+['"][^'"]+['"];?\s*\n/m
    );
    if (importMatch) {
      return content.replace(
        importMatch[0],
        `${config.loggerImport}\n${importMatch[0]}`
      );
    } else {
      // No imports found, add at the top
      return `${config.loggerImport}\n\n${content}`;
    }
  }
}

function replaceConsoleStatements(content) {
  let newContent = content;
  let hasChanges = false;

  // Replace console statements
  Object.entries(patterns).forEach(([method, pattern]) => {
    const matches = newContent.match(pattern.regex);
    if (matches) {
      newContent = newContent.replace(pattern.regex, pattern.replacement);
      hasChanges = true;
      console.log(`  Replaced ${matches.length} console.${method} statements`);
    }
  });

  return { content: newContent, hasChanges };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } =
      replaceConsoleStatements(content);

    if (hasChanges) {
      // Add logger import if needed
      const finalContent = needsLoggerImport(newContent)
        ? addLoggerImport(newContent)
        : newContent;

      fs.writeFileSync(filePath, finalContent, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔍 Finding files to process...');
  const files = findFiles();

  if (files.length === 0) {
    console.log('No files found to process.');
    return;
  }

  console.log(`Found ${files.length} files to check:`);

  let processedCount = 0;
  let updatedCount = 0;

  files.forEach((file) => {
    console.log(`\n📁 Processing: ${file}`);
    const wasUpdated = processFile(file);
    processedCount++;
    if (wasUpdated) {
      updatedCount++;
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`  Files processed: ${processedCount}`);
  console.log(`  Files updated: ${updatedCount}`);
  console.log(`  Files unchanged: ${processedCount - updatedCount}`);

  if (updatedCount > 0) {
    console.log(`\n✨ Console statements replaced with smart logger!`);
    console.log(
      `   Debug logs will now be automatically disabled in production.`
    );
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processFile, findFiles, replaceConsoleStatements };
