#!/usr/bin/env node

/**
 * Performance Metrics Comparison Script
 *
 * This script compares performance metrics between different dates
 * by querying MongoDB and generates comparison reports.
 *
 * Usage:
 *   node compare-metrics.js [--days=N] [--date1=YYYY-MM-DD] [--date2=YYYY-MM-DD]
 *
 * Examples:
 *   node compare-metrics.js                    # Compare with previous day (default)
 *   node compare-metrics.js --days=2           # Compare with 2 days ago
 *   node compare-metrics.js --days=7           # Compare with 1 week ago
 *   node compare-metrics.js --date1=2024-01-15 --date2=2024-01-22  # Specific dates
 */

const path = require('path');
const { MongoClient } = require('mongodb');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Configuration
const config = {
  mongoUri: process.env.MONGODB_URI,
  mongoDatabase: process.env.MONGODB_DATABASE,
  date1: null,
  date2: null,
  daysBack: 1, // Default to compare with previous day
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  args.forEach((arg) => {
    if (arg.startsWith('--days=')) {
      config.daysBack = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--date1=')) {
      config.date1 = arg.split('=')[1];
    } else if (arg.startsWith('--date2=')) {
      config.date2 = arg.split('=')[1];
    }
  });
}

// Connect to MongoDB
async function connectToMongoDB() {
  if (!config.mongoUri || !config.mongoDatabase) {
    throw new Error(
      'MongoDB URI or database name not configured. Check your .env file.'
    );
  }

  const client = new MongoClient(config.mongoUri);
  await client.connect();
  const db = client.db(config.mongoDatabase);
  return { client, db };
}

// Get date N days back from today
function getDateDaysBack(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Get today's date
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Load metrics from MongoDB
async function loadMetrics(db, date) {
  try {
    const collection = db.collection('performanceMetrics');
    const metrics = await collection.findOne({ date });
    return metrics;
  } catch (error) {
    console.error(`❌ Error loading metrics for ${date}:`, error.message);
    return null;
  }
}

// Get available metrics dates from MongoDB
async function getAvailableDates(db) {
  try {
    const collection = db.collection('performanceMetrics');
    const dates = await collection
      .find({}, { projection: { date: 1, _id: 0 } })
      .sort({ date: -1 })
      .toArray();
    return dates.map((d) => d.date);
  } catch (error) {
    console.error('❌ Error getting available dates:', error.message);
    return [];
  }
}

// Calculate percentage change
function calculatePercentageChange(oldValue, newValue) {
  if (!oldValue || !newValue) return null;
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

// Compare bundle size metrics
function compareBundleMetrics(metrics1, metrics2) {
  if (!metrics1.bundleSize || !metrics2.bundleSize) {
    return null;
  }

  const bundle1 = metrics1.bundleSize;
  const bundle2 = metrics2.bundleSize;

  return {
    firstLoadJS: {
      before: bundle1.firstLoadJS,
      after: bundle2.firstLoadJS,
      change:
        bundle1.firstLoadJS && bundle2.firstLoadJS
          ? bundle2.firstLoadJS - bundle1.firstLoadJS
          : null,
      changePercent: calculatePercentageChange(
        bundle1.firstLoadJS,
        bundle2.firstLoadJS
      ),
    },
    totalBundleSize: {
      before: bundle1.totalBundleSize,
      after: bundle2.totalBundleSize,
      change: bundle2.totalBundleSize - bundle1.totalBundleSize,
      changePercent: calculatePercentageChange(
        bundle1.totalBundleSize,
        bundle2.totalBundleSize
      ),
    },
    fileCount: {
      before: bundle1.fileCount,
      after: bundle2.fileCount,
      change: bundle2.fileCount - bundle1.fileCount,
      changePercent: calculatePercentageChange(
        bundle1.fileCount,
        bundle2.fileCount
      ),
    },
  };
}

// Compare build time metrics
function compareBuildMetrics(metrics1, metrics2) {
  if (!metrics1.buildTime || !metrics2.buildTime) {
    return null;
  }

  const build1 = metrics1.buildTime;
  const build2 = metrics2.buildTime;

  return {
    buildTime: {
      before: build1.buildTime,
      after: build2.buildTime,
      change: build2.buildTime - build1.buildTime,
      changePercent: calculatePercentageChange(
        build1.buildTime,
        build2.buildTime
      ),
    },
  };
}

// Compare web vitals metrics
function compareWebVitalsMetrics(metrics1, metrics2) {
  if (!metrics1.webVitals || !metrics2.webVitals) {
    return null;
  }

  const vitals1 = metrics1.webVitals;
  const vitals2 = metrics2.webVitals;

  return {
    fcp: {
      before: vitals1.fcp,
      after: vitals2.fcp,
      change: vitals2.fcp - vitals1.fcp,
      changePercent: calculatePercentageChange(vitals1.fcp, vitals2.fcp),
    },
    lcp: {
      before: vitals1.lcp,
      after: vitals2.lcp,
      change: vitals2.lcp - vitals1.lcp,
      changePercent: calculatePercentageChange(vitals1.lcp, vitals2.lcp),
    },
    fid: {
      before: vitals1.fid,
      after: vitals2.fid,
      change: vitals2.fid - vitals1.fid,
      changePercent: calculatePercentageChange(vitals1.fid, vitals2.fid),
    },
    cls: {
      before: vitals1.cls,
      after: vitals2.cls,
      change: vitals2.cls - vitals1.cls,
      changePercent: calculatePercentageChange(vitals1.cls, vitals2.cls),
    },
    ttfb: {
      before: vitals1.ttfb,
      after: vitals2.ttfb,
      change: vitals2.ttfb - vitals1.ttfb,
      changePercent: calculatePercentageChange(vitals1.ttfb, vitals2.ttfb),
    },
  };
}

// Compare API performance metrics
function compareAPIMetrics(metrics1, metrics2) {
  if (!metrics1.apiPerformance || !metrics2.apiPerformance) {
    return null;
  }

  const api1 = metrics1.apiPerformance;
  const api2 = metrics2.apiPerformance;

  return {
    totalRequests: {
      before: api1.totalRequests,
      after: api2.totalRequests,
      change: api2.totalRequests - api1.totalRequests,
      changePercent: calculatePercentageChange(
        api1.totalRequests,
        api2.totalRequests
      ),
    },
    cacheHitRate: {
      before: api1.cacheHitRate,
      after: api2.cacheHitRate,
      change: api2.cacheHitRate - api1.cacheHitRate,
      changePercent: calculatePercentageChange(
        api1.cacheHitRate,
        api2.cacheHitRate
      ),
    },
    totalCacheHits: {
      before: api1.totalCacheHits,
      after: api2.totalCacheHits,
      change: api2.totalCacheHits - api1.totalCacheHits,
      changePercent: calculatePercentageChange(
        api1.totalCacheHits,
        api2.totalCacheHits
      ),
    },
    dailyCost: {
      before: api1.dailyCost,
      after: api2.dailyCost,
      change: api2.dailyCost - api1.dailyCost,
      changePercent: calculatePercentageChange(api1.dailyCost, api2.dailyCost),
    },
    monthlyCost: {
      before: api1.monthlyCost,
      after: api2.monthlyCost,
      change: api2.monthlyCost - api1.monthlyCost,
      changePercent: calculatePercentageChange(
        api1.monthlyCost,
        api2.monthlyCost
      ),
    },
  };
}

// Compare system metrics
function compareSystemMetrics(metrics1, metrics2) {
  if (!metrics1.system || !metrics2.system) {
    return null;
  }

  const sys1 = metrics1.system;
  const sys2 = metrics2.system;

  return {
    heapUsed: {
      before: sys1.memoryUsage.heapUsed,
      after: sys2.memoryUsage.heapUsed,
      change: sys2.memoryUsage.heapUsed - sys1.memoryUsage.heapUsed,
      changePercent: calculatePercentageChange(
        sys1.memoryUsage.heapUsed,
        sys2.memoryUsage.heapUsed
      ),
    },
    heapTotal: {
      before: sys1.memoryUsage.heapTotal,
      after: sys2.memoryUsage.heapTotal,
      change: sys2.memoryUsage.heapTotal - sys1.memoryUsage.heapTotal,
      changePercent: calculatePercentageChange(
        sys1.memoryUsage.heapTotal,
        sys2.memoryUsage.heapTotal
      ),
    },
  };
}

// Format change indicator
function formatChangeIndicator(change, changePercent, lowerIsBetter = false) {
  if (change === null || changePercent === null) return '';

  const isPositive = change > 0;
  const isBetter = lowerIsBetter ? !isPositive : isPositive;
  const indicator = isBetter ? '✅' : '⚠️';
  const sign = isPositive ? '+' : '';

  return `${indicator} ${sign}${changePercent.toFixed(2)}%`;
}

// Generate comparison report
function generateComparisonReport(date1, date2, metrics1, metrics2) {
  console.log('\n📊 Performance Metrics Comparison Report');
  console.log('=========================================\n');
  console.log(`📅 Date 1: ${date1}`);
  console.log(`📅 Date 2: ${date2}\n`);

  if (!metrics1) {
    console.log(`❌ No metrics found for ${date1}`);
    return;
  }

  if (!metrics2) {
    console.log(`❌ No metrics found for ${date2}`);
    return;
  }

  // Bundle Size Comparison
  const bundleComparison = compareBundleMetrics(metrics1, metrics2);
  if (bundleComparison) {
    console.log('📦 Bundle Size:');
    console.log(
      `   First Load JS: ${bundleComparison.firstLoadJS.before} kB → ${bundleComparison.firstLoadJS.after} kB ${formatChangeIndicator(bundleComparison.firstLoadJS.change, bundleComparison.firstLoadJS.changePercent, true)}`
    );
    console.log(
      `   Total Size: ${bundleComparison.totalBundleSize.before} kB → ${bundleComparison.totalBundleSize.after} kB ${formatChangeIndicator(bundleComparison.totalBundleSize.change, bundleComparison.totalBundleSize.changePercent, true)}`
    );
    console.log(
      `   File Count: ${bundleComparison.fileCount.before} → ${bundleComparison.fileCount.after} ${formatChangeIndicator(bundleComparison.fileCount.change, bundleComparison.fileCount.changePercent, true)}\n`
    );
  }

  // Build Time Comparison
  const buildComparison = compareBuildMetrics(metrics1, metrics2);
  if (buildComparison) {
    console.log('⏱️ Build Time:');
    console.log(
      `   Duration: ${(buildComparison.buildTime.before / 1000).toFixed(2)}s → ${(buildComparison.buildTime.after / 1000).toFixed(2)}s ${formatChangeIndicator(buildComparison.buildTime.change, buildComparison.buildTime.changePercent, true)}\n`
    );
  }

  // Web Vitals Comparison
  const vitalsComparison = compareWebVitalsMetrics(metrics1, metrics2);
  if (vitalsComparison) {
    console.log('🌐 Web Vitals:');
    console.log(
      `   FCP: ${vitalsComparison.fcp.before.toFixed(0)}ms → ${vitalsComparison.fcp.after.toFixed(0)}ms ${formatChangeIndicator(vitalsComparison.fcp.change, vitalsComparison.fcp.changePercent, true)}`
    );
    console.log(
      `   LCP: ${vitalsComparison.lcp.before.toFixed(0)}ms → ${vitalsComparison.lcp.after.toFixed(0)}ms ${formatChangeIndicator(vitalsComparison.lcp.change, vitalsComparison.lcp.changePercent, true)}`
    );
    console.log(
      `   FID: ${vitalsComparison.fid.before.toFixed(0)}ms → ${vitalsComparison.fid.after.toFixed(0)}ms ${formatChangeIndicator(vitalsComparison.fid.change, vitalsComparison.fid.changePercent, true)}`
    );
    console.log(
      `   CLS: ${vitalsComparison.cls.before.toFixed(3)} → ${vitalsComparison.cls.after.toFixed(3)} ${formatChangeIndicator(vitalsComparison.cls.change, vitalsComparison.cls.changePercent, true)}`
    );
    console.log(
      `   TTFB: ${vitalsComparison.ttfb.before.toFixed(0)}ms → ${vitalsComparison.ttfb.after.toFixed(0)}ms ${formatChangeIndicator(vitalsComparison.ttfb.change, vitalsComparison.ttfb.changePercent, true)}\n`
    );
  }

  // API Performance Comparison
  const apiComparison = compareAPIMetrics(metrics1, metrics2);
  if (apiComparison) {
    console.log('🔌 API Performance:');
    if (apiComparison.totalRequests) {
      console.log(
        `   Total Requests: ${apiComparison.totalRequests.before} → ${apiComparison.totalRequests.after} ${formatChangeIndicator(apiComparison.totalRequests.change, apiComparison.totalRequests.changePercent)}`
      );
    }
    if (apiComparison.cacheHitRate) {
      console.log(
        `   Cache Hit Rate: ${apiComparison.cacheHitRate.before?.toFixed(1) || 0}% → ${apiComparison.cacheHitRate.after?.toFixed(1) || 0}% ${formatChangeIndicator(apiComparison.cacheHitRate.change, apiComparison.cacheHitRate.changePercent)}`
      );
    }
    if (apiComparison.totalCacheHits) {
      console.log(
        `   Total Cache Hits: ${apiComparison.totalCacheHits.before} → ${apiComparison.totalCacheHits.after} ${formatChangeIndicator(apiComparison.totalCacheHits.change, apiComparison.totalCacheHits.changePercent)}`
      );
    }
    if (apiComparison.dailyCost) {
      console.log(
        `   Daily Cost: $${apiComparison.dailyCost.before?.toFixed(4) || 0} → $${apiComparison.dailyCost.after?.toFixed(4) || 0} ${formatChangeIndicator(apiComparison.dailyCost.change, apiComparison.dailyCost.changePercent, true)}`
      );
    }
    if (apiComparison.monthlyCost) {
      console.log(
        `   Monthly Cost: $${apiComparison.monthlyCost.before?.toFixed(4) || 0} → $${apiComparison.monthlyCost.after?.toFixed(4) || 0} ${formatChangeIndicator(apiComparison.monthlyCost.change, apiComparison.monthlyCost.changePercent, true)}`
      );
    }
    console.log('');
  }

  // System Metrics Comparison
  const systemComparison = compareSystemMetrics(metrics1, metrics2);
  if (systemComparison) {
    console.log('💻 System Metrics:');
    console.log(
      `   Heap Used: ${Math.round(systemComparison.heapUsed.before / 1024 / 1024)}MB → ${Math.round(systemComparison.heapUsed.after / 1024 / 1024)}MB ${formatChangeIndicator(systemComparison.heapUsed.change, systemComparison.heapUsed.changePercent, true)}`
    );
    console.log(
      `   Heap Total: ${Math.round(systemComparison.heapTotal.before / 1024 / 1024)}MB → ${Math.round(systemComparison.heapTotal.after / 1024 / 1024)}MB ${formatChangeIndicator(systemComparison.heapTotal.change, systemComparison.heapTotal.changePercent, true)}\n`
    );
  }

  console.log('✅ Comparison completed!');
}

// Main execution
async function main() {
  console.log('🚀 Starting performance metrics comparison...\n');

  parseArgs();

  const { client, db } = await connectToMongoDB();

  try {
    // Determine dates to compare
    let date1, date2;

    if (config.date1 && config.date2) {
      // Custom date comparison
      date1 = config.date1;
      date2 = config.date2;
    } else {
      // Compare with N days back
      date2 = getTodayDate();
      date1 = getDateDaysBack(config.daysBack);

      // Check if we have data for today
      const todayMetrics = await loadMetrics(db, date2);
      if (!todayMetrics) {
        // If no data for today, use the most recent available date
        const availableDates = await getAvailableDates(db);
        if (availableDates.length === 0) {
          console.error('❌ No metrics data found in MongoDB');
          await client.close();
          process.exit(1);
        }
        date2 = availableDates[0];
        console.log(`ℹ️ Using most recent date: ${date2}`);

        // Adjust date1 accordingly
        const date2Obj = new Date(date2);
        date2Obj.setDate(date2Obj.getDate() - config.daysBack);
        date1 = date2Obj.toISOString().split('T')[0];
      }
    }

    console.log(`📅 Comparing: ${date1} vs ${date2}`);
    console.log(`⏱️ Period: ${config.daysBack} day(s) back\n`);

    // Load metrics from MongoDB
    const metrics1 = await loadMetrics(db, date1);
    const metrics2 = await loadMetrics(db, date2);

    // Generate comparison report
    generateComparisonReport(date1, date2, metrics1, metrics2);

    await client.close();
  } catch (error) {
    console.error('❌ Error during comparison:', error);
    await client.close();
    throw error;
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  loadMetrics,
  compareBundleMetrics,
  compareBuildMetrics,
  compareWebVitalsMetrics,
  compareAPIMetrics,
  compareSystemMetrics,
};
