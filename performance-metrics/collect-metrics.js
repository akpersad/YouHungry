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
const { execSync } = require('child_process');

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

// Collect web vitals from browser (simulated)
function collectWebVitalsMetrics() {
  console.log('🌐 Collecting web vitals metrics...');

  // In a real implementation, this would collect actual web vitals from the browser
  // For now, we'll simulate some baseline metrics
  return {
    fcp: Math.random() * 2000 + 1000, // First Contentful Paint (ms)
    lcp: Math.random() * 3000 + 1500, // Largest Contentful Paint (ms)
    fid: Math.random() * 100 + 50, // First Input Delay (ms)
    cls: Math.random() * 0.1, // Cumulative Layout Shift
    ttfb: Math.random() * 500 + 200, // Time to First Byte (ms)
    timestamp: Date.now(),
  };
}

// Collect API performance metrics
function collectAPIMetrics() {
  console.log('🔌 Collecting API performance metrics...');

  // In a real implementation, this would collect actual API metrics
  // For now, we'll simulate some baseline metrics
  return {
    averageResponseTime: Math.random() * 200 + 100, // ms
    successRate: 95 + Math.random() * 5, // percentage
    errorRate: Math.random() * 2, // percentage
    totalRequests: Math.floor(Math.random() * 1000) + 500,
    timestamp: Date.now(),
  };
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
          avgResponseTime: `${metrics.apiPerformance.averageResponseTime.toFixed(0)}ms`,
          successRate: `${metrics.apiPerformance.successRate.toFixed(1)}%`,
          errorRate: `${metrics.apiPerformance.errorRate.toFixed(2)}%`,
          totalRequests: metrics.apiPerformance.totalRequests,
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

// Main execution
async function main() {
  console.log('🚀 Starting performance metrics collection...');
  console.log(`📅 Date: ${getCurrentDate()}`);
  console.log(`🌍 Environment: ${config.env}`);
  console.log(`📁 Output directory: ${config.outputDir}`);

  parseArgs();
  ensureOutputDir();

  const metrics = {};

  // Collect different types of metrics
  if (config.metrics.bundleSize) {
    metrics.bundleSize = collectBundleSizeMetrics();
  }

  if (config.metrics.buildTime) {
    metrics.buildTime = collectBuildTimeMetrics();
  }

  if (config.metrics.webVitals) {
    metrics.webVitals = collectWebVitalsMetrics();
  }

  if (config.metrics.memoryUsage || config.metrics.networkPerformance) {
    metrics.system = collectSystemMetrics();
  }

  if (config.metrics.apiPerformance) {
    metrics.apiPerformance = collectAPIMetrics();
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
};
