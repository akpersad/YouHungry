#!/usr/bin/env node

/**
 * Performance Metrics Collection Script
 *
 * This script collects performance metrics from the application and saves them
 * to dated JSON files for historical analysis and comparison.
 *
 * Usage:
 *   node collect-metrics.js [--env=production|development] [--output=path]
 *
 * Example:
 *   node collect-metrics.js --env=production --output=./performance-metrics/
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Configuration
const config = {
  env: process.env.NODE_ENV || 'development',
  outputDir: './performance-metrics/daily-metrics',
  dateFormat: 'YYYY-MM-DD',
  maxHistoryDays: 30,
  metrics: {
    bundleSize: true,
    buildTime: true,
    webVitals: true,
    memoryUsage: true,
    networkPerformance: true,
    apiPerformance: true,
  },
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  args.forEach((arg) => {
    if (arg.startsWith('--env=')) {
      config.env = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      config.outputDir = arg.split('=')[1];
    }
  });
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

// Ensure output directory exists
function ensureOutputDir() {
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
}

// Collect bundle size metrics
function collectBundleSizeMetrics() {
  console.log('📦 Collecting bundle size metrics...');

  try {
    // Run Next.js build with bundle analyzer using webpack (not turbopack)
    // Ignore ESLint errors for performance collection
    const buildOutput = execSync('npm run build:webpack', {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: { ...process.env, ANALYZE: 'true', ESLINT_NO_DEV_ERRORS: 'true' },
    });

    // Extract bundle size information from build output
    const bundleSizeMatch = buildOutput.match(
      /First Load JS shared by all[^\d]*(\d+\.?\d*)\s*kB/
    );
    const bundleSize = bundleSizeMatch ? parseFloat(bundleSizeMatch[1]) : null;

    // Get actual bundle files and their sizes
    const buildDir = '.next/static/chunks';
    let totalSize = 0;
    let fileCount = 0;

    if (fs.existsSync(buildDir)) {
      const files = fs.readdirSync(buildDir);
      files.forEach((file) => {
        if (file.endsWith('.js')) {
          const filePath = path.join(buildDir, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
          fileCount++;
        }
      });
    }

    return {
      firstLoadJS: bundleSize,
      totalBundleSize: Math.round(totalSize / 1024), // Convert to KB
      fileCount,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('❌ Error collecting bundle size metrics:', error.message);
    return null;
  }
}

// Collect build time metrics
function collectBuildTimeMetrics() {
  console.log('⏱️ Collecting build time metrics...');

  try {
    const startTime = Date.now();
    execSync('npm run build:webpack', {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { ...process.env, ESLINT_NO_DEV_ERRORS: 'true' },
    });
    const endTime = Date.now();

    return {
      buildTime: endTime - startTime,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('❌ Error collecting build time metrics:', error.message);
    return null;
  }
}

// Collect system performance metrics
function collectSystemMetrics() {
  console.log('💻 Collecting system metrics...');

  const systemInfo = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: Date.now(),
  };

  return systemInfo;
}

// Collect web vitals from Lighthouse (actual metrics)
async function collectWebVitalsMetrics() {
  console.log('🌐 Collecting web vitals metrics...');

  let chrome;
  try {
    // Run Lighthouse to collect real web vitals
    // Lighthouse v12+ is ESM-only, use dynamic import
    const lighthouseModule = await import('lighthouse');
    const lighthouse = lighthouseModule.default;
    const chromeLauncher = require('chrome-launcher');

    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    const options = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
    };

    const runnerResult = await lighthouse('http://localhost:3000', options);

    // Extract metrics from Lighthouse results
    const audits = runnerResult.lhr.audits;

    return {
      fcp: audits['first-contentful-paint']?.numericValue || 0,
      lcp: audits['largest-contentful-paint']?.numericValue || 0,
      fid: audits['max-potential-fid']?.numericValue || 0,
      cls: audits['cumulative-layout-shift']?.numericValue || 0,
      ttfb: audits['server-response-time']?.numericValue || 0,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.warn(
      '⚠️ Could not collect real web vitals, using fallback:',
      error.message
    );
    // Fallback: Return null to indicate metrics weren't collected
    return null;
  } finally {
    // Ensure Chrome is always killed, even if there's an error
    if (chrome) {
      await chrome.kill();
    }
  }
}

// Collect API performance metrics from database
async function collectAPIMetrics() {
  console.log('🔌 Collecting API performance metrics...');

  try {
    // Fetch real API metrics from the cost monitoring endpoint
    const response = await fetch(
      'http://localhost:3000/api/admin/cost-monitoring'
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.metrics) {
      throw new Error('Invalid API response');
    }

    // Calculate total API requests from all tracked services
    const googlePlaces = data.metrics.googlePlaces;
    const totalGoogleRequests =
      googlePlaces.textSearch +
      googlePlaces.nearbySearch +
      googlePlaces.placeDetails +
      googlePlaces.geocoding +
      googlePlaces.addressValidation;

    // Get cache statistics
    const cache = data.metrics.cache;

    return {
      totalRequests: totalGoogleRequests,
      cacheHitRate: cache.hitRate,
      totalCacheHits: cache.totalHits,
      memoryEntries: cache.memoryEntries,
      dailyCost: data.metrics.estimatedCosts.daily,
      monthlyCost: data.metrics.estimatedCosts.monthly,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.warn(
      '⚠️ Could not collect real API metrics, using fallback:',
      error.message
    );
    // Fallback: Return null to indicate metrics weren't collected
    return null;
  }
}

// Save metrics to dated file
function saveMetrics(metrics) {
  const date = getCurrentDate();
  const filename = `metrics-${date}.json`;
  const filepath = path.join(config.outputDir, filename);

  // Load existing metrics if file exists
  let existingMetrics = {};
  if (fs.existsSync(filepath)) {
    try {
      existingMetrics = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch (error) {
      console.warn(
        '⚠️ Could not parse existing metrics file, creating new one'
      );
    }
  }

  // Merge new metrics with existing ones
  const updatedMetrics = {
    ...existingMetrics,
    ...metrics,
    lastUpdated: new Date().toISOString(),
  };

  // Save to file
  fs.writeFileSync(filepath, JSON.stringify(updatedMetrics, null, 2));
  console.log(`✅ Metrics saved to ${filepath}`);

  return filepath;
}

// Generate performance report
function generateReport(metrics) {
  const report = {
    summary: {
      date: getCurrentDate(),
      environment: config.env,
      totalMetrics: Object.keys(metrics).length,
    },
    bundle: metrics.bundleSize
      ? {
          firstLoadJS: `${metrics.bundleSize.firstLoadJS} kB`,
          totalSize: `${metrics.bundleSize.totalBundleSize} kB`,
          fileCount: metrics.bundleSize.fileCount,
        }
      : null,
    build: metrics.buildTime
      ? {
          duration: `${(metrics.buildTime.buildTime / 1000).toFixed(2)}s`,
        }
      : null,
    webVitals: metrics.webVitals
      ? {
          fcp: `${metrics.webVitals.fcp.toFixed(0)}ms`,
          lcp: `${metrics.webVitals.lcp.toFixed(0)}ms`,
          fid: `${metrics.webVitals.fid.toFixed(0)}ms`,
          cls: metrics.webVitals.cls.toFixed(3),
          ttfb: `${metrics.webVitals.ttfb.toFixed(0)}ms`,
        }
      : null,
    api: metrics.apiPerformance
      ? {
          totalRequests: metrics.apiPerformance.totalRequests,
          cacheHitRate: `${metrics.apiPerformance.cacheHitRate.toFixed(1)}%`,
          totalCacheHits: metrics.apiPerformance.totalCacheHits,
          memoryEntries: metrics.apiPerformance.memoryEntries,
          dailyCost: `$${metrics.apiPerformance.dailyCost.toFixed(4)}`,
          monthlyCost: `$${metrics.apiPerformance.monthlyCost.toFixed(4)}`,
        }
      : null,
    system: metrics.system
      ? {
          platform: metrics.system.platform,
          arch: metrics.system.arch,
          nodeVersion: metrics.system.nodeVersion,
          memoryUsage: `${Math.round(metrics.system.memoryUsage.heapUsed / 1024 / 1024)}MB`,
        }
      : null,
  };

  return report;
}

// Clean up old metrics files
function cleanupOldMetrics() {
  console.log('🧹 Cleaning up old metrics files...');

  try {
    const files = fs.readdirSync(config.outputDir);
    const now = new Date();
    const maxAge = config.maxHistoryDays * 24 * 60 * 60 * 1000; // Convert days to ms

    files.forEach((file) => {
      if (file.startsWith('metrics-') && file.endsWith('.json')) {
        const filepath = path.join(config.outputDir, file);
        const stats = fs.statSync(filepath);
        const age = now.getTime() - stats.mtime.getTime();

        if (age > maxAge) {
          fs.unlinkSync(filepath);
          console.log(`🗑️ Removed old metrics file: ${file}`);
        }
      }
    });
  } catch (error) {
    console.error('❌ Error cleaning up old metrics:', error.message);
  }
}

// Start the Next.js server
async function startServer(skipBuild = false) {
  console.log('🚀 Starting Next.js server...');

  return new Promise((resolve, reject) => {
    // Build the app if not skipped
    if (!skipBuild) {
      try {
        console.log('🔨 Building Next.js app...');
        execSync('npm run build:webpack', {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, ESLINT_NO_DEV_ERRORS: 'true' },
        });
      } catch (error) {
        console.error('❌ Error building app:', error.message);
        return reject(error);
      }
    } else {
      console.log('⏭️ Skipping build (using existing build)...');
    }

    // Start the production server
    const serverProcess = spawn('npm', ['run', 'start'], {
      stdio: 'pipe',
      env: { ...process.env, PORT: '3000' },
    });

    let serverReady = false;
    const timeout = setTimeout(() => {
      if (!serverReady) {
        serverProcess.kill();
        reject(new Error('Server failed to start within timeout'));
      }
    }, 60000); // 60 second timeout

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Server] ${output}`);

      // Check if server is ready
      if (output.includes('Ready') || output.includes('started server')) {
        serverReady = true;
        clearTimeout(timeout);
        console.log('✅ Server is ready!');
        // Give the server a moment to fully initialize before resolving
        setTimeout(() => resolve(serverProcess), 2000);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server Error] ${data.toString()}`);
    });

    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    serverProcess.on('exit', (code) => {
      clearTimeout(timeout);
      if (!serverReady) {
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });
}

// Stop the server
async function stopServer(serverProcess) {
  if (!serverProcess) return;

  console.log('🛑 Stopping server...');
  return new Promise((resolve) => {
    serverProcess.on('exit', () => {
      console.log('✅ Server stopped');
      resolve();
    });

    serverProcess.kill('SIGTERM');

    // Force kill after 5 seconds if graceful shutdown fails
    setTimeout(() => {
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
      resolve();
    }, 5000);
  });
}

// Wait for server to be responsive
async function waitForServer(maxAttempts = 10) {
  console.log('⏳ Waiting for server to be responsive...');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('http://localhost:3000', {
        signal: controller.signal,
        redirect: 'manual', // Don't follow redirects
      });

      clearTimeout(timeout);

      // Consider any response from the server as "ready"
      // This includes: 200 OK, 307 Redirect, 401 Unauthorized, etc.
      // The key is that the server is responding
      if (response.status >= 200 && response.status < 600) {
        console.log(`✅ Server is responsive! (Status: ${response.status})`);
        return true;
      }
    } catch (error) {
      // Server not ready yet (connection refused or timeout)
      console.log(`  Attempt ${i + 1}/${maxAttempts}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Server did not become responsive in time');
}

// Main execution
async function main() {
  // Using Node.js built-in fetch (available in Node 18+)

  console.log('🚀 Starting performance metrics collection...');
  console.log(`📅 Date: ${getCurrentDate()}`);
  console.log(`🌍 Environment: ${config.env}`);
  console.log(`📁 Output directory: ${config.outputDir}`);

  parseArgs();
  ensureOutputDir();

  const metrics = {};
  let serverProcess = null;

  try {
    // Collect different types of metrics
    if (config.metrics.bundleSize) {
      metrics.bundleSize = collectBundleSizeMetrics();
    }

    if (config.metrics.buildTime) {
      metrics.buildTime = collectBuildTimeMetrics();
    }

    // Start server for metrics that require it (webVitals, apiPerformance)
    const needsServer =
      config.metrics.webVitals || config.metrics.apiPerformance;
    if (needsServer) {
      // Skip build since we already built above
      const alreadyBuilt =
        config.metrics.bundleSize || config.metrics.buildTime;
      serverProcess = await startServer(alreadyBuilt);

      // Wait for server to be fully responsive
      await waitForServer();
    }

    if (config.metrics.webVitals) {
      metrics.webVitals = await collectWebVitalsMetrics();
    }

    if (config.metrics.apiPerformance) {
      metrics.apiPerformance = await collectAPIMetrics();
    }

    // Stop server if it was started
    if (serverProcess) {
      await stopServer(serverProcess);
      serverProcess = null;
    }

    if (config.metrics.memoryUsage || config.metrics.networkPerformance) {
      metrics.system = collectSystemMetrics();
    }

    // Save metrics
    const savedFile = saveMetrics(metrics);

    // Generate and display report
    const report = generateReport(metrics);
    console.log('\n📊 Performance Report:');
    console.log(JSON.stringify(report, null, 2));

    // Clean up old files
    cleanupOldMetrics();

    console.log('\n✅ Performance metrics collection completed!');
    console.log(`📄 Metrics saved to: ${savedFile}`);
  } catch (error) {
    console.error('❌ Error during metrics collection:', error);

    // Ensure server is stopped even if there's an error
    if (serverProcess) {
      await stopServer(serverProcess);
    }

    throw error;
  } finally {
    // Explicitly exit to ensure script doesn't hang
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  collectBundleSizeMetrics,
  collectBuildTimeMetrics,
  collectSystemMetrics,
  collectWebVitalsMetrics,
  collectAPIMetrics,
  saveMetrics,
  generateReport,
  startServer,
  stopServer,
  waitForServer,
};
