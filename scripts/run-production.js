#!/usr/bin/env node

/**
 * Run Production Simulation Script
 *
 * This script simulates running the app in production mode using .env.prod
 *
 * Usage:
 *   npm run prod           # Build and start
 *   npm run prod:start     # Start only (assumes already built)
 *   npm run prod:build     # Build only
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n');
  log('='.repeat(60), colors.cyan);
  log(`  ${title}`, colors.bright + colors.cyan);
  log('='.repeat(60), colors.cyan);
  console.log('');
}

function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      log(`⚠️  Warning: ${filePath} not found!`, colors.yellow);
      log(`   Using system environment variables instead.`, colors.yellow);
      return {};
    }

    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach((line) => {
      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('#')) return;

      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Remove quotes if present
        envVars[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    });

    return envVars;
  } catch (error) {
    log(`❌ Error reading ${filePath}: ${error.message}`, colors.red);
    process.exit(1);
  }
}

function validateRequiredEnvVars(envVars) {
  const required = [
    'MONGODB_URI',
    'MONGODB_DATABASE',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'GOOGLE_PLACES_API_KEY',
    'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY',
  ];

  const missing = required.filter(
    (key) => !envVars[key] || envVars[key] === ''
  );

  if (missing.length > 0) {
    log('❌ Missing required environment variables:', colors.red);
    missing.forEach((key) => log(`   - ${key}`, colors.red));
    console.log('');
    log('Please ensure these are set in .env.prod', colors.yellow);
    process.exit(1);
  }
}

function runCommand(command, args, env, options = {}) {
  return new Promise((resolve, reject) => {
    log(`\n▶️  Running: ${command} ${args.join(' ')}`, colors.blue);

    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...env },
      ...options,
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  const command = process.argv[2] || 'all';
  const useHttps = process.argv[3] === 'https' || process.argv[2] === 'https';
  const envFilePath = path.join(process.cwd(), '.env.prod');

  logSection('🚀 Production Simulation Mode');

  log('📋 Configuration:', colors.magenta);
  log(`   Environment File: .env.prod`, colors.reset);
  log(`   NODE_ENV: production`, colors.reset);
  log(`   Command: ${command === 'https' ? 'all' : command}`, colors.reset);
  log(`   HTTPS: ${useHttps ? 'enabled' : 'disabled'}`, colors.reset);

  // Load production environment variables
  const prodEnvVars = loadEnvFile(envFilePath);

  // Set NODE_ENV to production
  const env = {
    ...prodEnvVars,
    NODE_ENV: 'production',
  };

  // Validate required variables
  log('\n🔍 Validating environment variables...', colors.cyan);
  validateRequiredEnvVars(env);
  log('✅ All required variables present', colors.green);

  // Show which variables are loaded (mask sensitive values)
  log('\n📦 Loaded environment variables:', colors.magenta);
  const sensitiveKeys = ['SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'SID', 'URI'];
  Object.keys(env)
    .sort()
    .forEach((key) => {
      const isSensitive = sensitiveKeys.some((sensitive) =>
        key.includes(sensitive)
      );
      const value = env[key];
      const displayValue = isSensitive
        ? value
          ? `${'*'.repeat(Math.min(value.length, 20))}`
          : '(empty)'
        : value;
      log(`   ${key}=${displayValue}`, colors.reset);
    });

  try {
    const actualCommand = command === 'https' ? 'all' : command;

    if (actualCommand === 'all' || actualCommand === 'build') {
      logSection('🔨 Building Production Bundle');
      await runCommand('npm', ['run', 'build'], env);
      log('✅ Build completed successfully!', colors.green);
    }

    if (actualCommand === 'all' || actualCommand === 'start') {
      if (actualCommand === 'all') {
        // Small delay between build and start
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      logSection('🚀 Starting Production Server');

      if (useHttps) {
        log('🔒 Starting with HTTPS enabled', colors.green);
        log(
          '📍 Server will start on https://forkintheroad.local:3000',
          colors.cyan
        );
        log(
          '⚠️  Using self-signed certificates (for local testing only)',
          colors.yellow
        );
        log('\n⚠️  Press Ctrl+C to stop the server', colors.yellow);

        // Check if certificates exist
        const certPath = path.join(process.cwd(), 'public', 'cert.pem');
        const keyPath = path.join(process.cwd(), 'public', 'cert-key.pem');

        if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
          log('\n❌ HTTPS certificates not found!', colors.red);
          log('   Expected locations:', colors.yellow);
          log(`   - ${certPath}`, colors.reset);
          log(`   - ${keyPath}`, colors.reset);
          log('\n   Generate certificates with:', colors.cyan);
          log(
            '   openssl req -x509 -newkey rsa:4096 -keyout public/cert-key.pem -out public/cert.pem -days 365 -nodes',
            colors.reset
          );
          process.exit(1);
        }

        // Start HTTPS server using custom server script
        const serverScript = path.join(__dirname, 'https-server.js');
        await runCommand('node', [serverScript], env);
      } else {
        log(
          '📍 Server will start on the port specified in NEXT_PUBLIC_APP_URL',
          colors.cyan
        );
        log('📍 Or default to http://localhost:3000', colors.cyan);
        log('\n⚠️  Press Ctrl+C to stop the server', colors.yellow);

        await runCommand('npm', ['run', 'start'], env);
      }
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  log('\n\n👋 Shutting down production server...', colors.yellow);
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n\n👋 Shutting down production server...', colors.yellow);
  process.exit(0);
});

main();
