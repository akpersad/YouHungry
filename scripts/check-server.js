#!/usr/bin/env node

/**
 * Check if a development server is running on a specific port
 * Usage: node scripts/check-server.js [port]
 * Default port: 3000
 */

const { exec } = require('child_process');

function checkPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port}`, (error, stdout) => {
      if (error) {
        // No process found on port
        resolve(false);
      } else {
        // Process found on port
        resolve(true);
      }
    });
  });
}

async function main() {
  const port = process.argv[2] || '3000';
  const isRunning = await checkPort(port);

  if (isRunning) {
    console.log(`❌ Port ${port} is already in use.`);
    console.log(`   Run: lsof -ti:${port} | xargs kill -9`);
    console.log(`   Or use: npm run dev:force`);
    process.exit(1);
  } else {
    console.log(`✅ Port ${port} is available.`);
    process.exit(0);
  }
}

main();
