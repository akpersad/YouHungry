#!/usr/bin/env node

/**
 * Fix Server Actions Error Script
 *
 * This script helps resolve the "Server Action was not found" error
 * by clearing Next.js caches and restarting the development server.
 *
 * Usage: node scripts/fix-server-actions.js
 * Or add to package.json: npm run dev:fix
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

console.log('🔧 Fixing Server Actions Error...\n');

// Step 1: Clear .next directory
console.log('1️⃣  Clearing .next directory...');
const nextDir = path.join(ROOT_DIR, '.next');
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('✅ .next directory cleared\n');
} else {
  console.log('ℹ️  .next directory does not exist\n');
}

// Step 2: Clear node_modules/.cache (if exists)
console.log('2️⃣  Clearing node_modules cache...');
const cacheDir = path.join(ROOT_DIR, 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('✅ node_modules cache cleared\n');
} else {
  console.log('ℹ️  node_modules cache does not exist\n');
}

// Step 3: Kill any process on port 3000
console.log('3️⃣  Killing any process on port 3000...');
try {
  execSync('lsof -ti:3000 | xargs kill -9 2>/dev/null', { stdio: 'ignore' });
  console.log('✅ Port 3000 cleared\n');
} catch (error) {
  console.log('ℹ️  No process found on port 3000\n');
}

console.log(
  '✨ Done! You can now run "npm run dev" to start the development server.\n'
);
console.log('⚠️  IMPORTANT: Clear your browser caches too!');
console.log(
  '   Chrome/Edge: DevTools → Application → Clear Storage → Clear site data'
);
console.log('   Or visit: chrome://serviceworker-internals/ and unregister\n');
console.log('💡 Tips to prevent this error:');
console.log(
  '   - Service workers can cache stale pages with old Server Actions'
);
console.log('   - Clear browser cache after updating service worker version');
console.log(
  '   - Avoid making Server Components into Client Components and vice versa'
);
console.log('   - Restart the dev server if you see this error frequently');
console.log('   - Use this script: npm run dev:fix\n');
