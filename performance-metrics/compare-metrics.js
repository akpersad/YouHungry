#!/usr/bin/env node

/**
 * Performance Metrics Comparison Script
 *
 * This script compares performance metrics between different dates
 * and generates comparison reports.
 *
 * Usage:
 *   node compare-metrics.js [--days=N] [--date1=YYYY-MM-DD] [--date2=YYYY-MM-DD] [--output=path]
 *
 * Examples:
 *   node compare-metrics.js                    # Compare with previous day (default)
 *   node compare-metrics.js --days=2           # Compare with 2 days ago
 *   node compare-metrics.js --days=7           # Compare with 1 week ago
 *   node compare-metrics.js --date1=2024-01-15 --date2=2024-01-22  # Specific dates
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  metricsDir: './performance-metrics/daily-metrics',
  outputDir: './performance-metrics/comparisons',
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
    } else if (arg.startsWith('--output=')) {
      config.outputDir = arg.split('=')[1];
    }
  });
}

// Get date N days back from today
function getDateDaysBack(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Get available metrics files
function getAvailableMetricsFiles() {
  try {
    const files = fs.readdirSync(config.metricsDir);
    return files
      .filter((file) => file.startsWith('metrics-') && file.endsWith('.json'))
      .map((file) => {
        const dateMatch = file.match(/metrics-(\d{4}-\d{2}-\d{2})\.json/);
        return {
          filename: file,
          date: dateMatch ? dateMatch[1] : null,
        };
      })
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Most recent first
  } catch (error) {
    console.error('❌ Error reading metrics directory:', error.message);
    return [];
  }
}

// Load metrics from file
function loadMetrics(filename) {
  try {
    const filepath = path.join(config.metricsDir, filename);
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading metrics from ${filename}:`, error.message);
    return null;
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
      old: bundle1.firstLoadJS,
      new: bundle2.firstLoadJS,
      change: calculatePercentageChange(
        bundle1.firstLoadJS,
        bundle2.firstLoadJS
      ),
      trend:
        bundle2.firstLoadJS > bundle1.firstLoadJS ? 'increase' : 'decrease',
    },
    totalBundleSize: {
      old: bundle1.totalBundleSize,
      new: bundle2.totalBundleSize,
      change: calculatePercentageChange(
        bundle1.totalBundleSize,
        bundle2.totalBundleSize
      ),
      trend:
        bundle2.totalBundleSize > bundle1.totalBundleSize
          ? 'increase'
          : 'decrease',
    },
    fileCount: {
      old: bundle1.fileCount,
      new: bundle2.fileCount,
      change: calculatePercentageChange(bundle1.fileCount, bundle2.fileCount),
      trend: bundle2.fileCount > bundle1.fileCount ? 'increase' : 'decrease',
    },
  };
}

// Compare build time metrics
function compareBuildTimeMetrics(metrics1, metrics2) {
  if (!metrics1.buildTime || !metrics2.buildTime) {
    return null;
  }

  const build1 = metrics1.buildTime;
  const build2 = metrics2.buildTime;

  return {
    buildTime: {
      old: build1.buildTime,
      new: build2.buildTime,
      change: calculatePercentageChange(build1.buildTime, build2.buildTime),
      trend: build2.buildTime > build1.buildTime ? 'increase' : 'decrease',
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
      old: vitals1.fcp,
      new: vitals2.fcp,
      change: calculatePercentageChange(vitals1.fcp, vitals2.fcp),
      trend: vitals2.fcp > vitals1.fcp ? 'degradation' : 'improvement',
    },
    lcp: {
      old: vitals1.lcp,
      new: vitals2.lcp,
      change: calculatePercentageChange(vitals1.lcp, vitals2.lcp),
      trend: vitals2.lcp > vitals1.lcp ? 'degradation' : 'improvement',
    },
    fid: {
      old: vitals1.fid,
      new: vitals2.fid,
      change: calculatePercentageChange(vitals1.fid, vitals2.fid),
      trend: vitals2.fid > vitals1.fid ? 'degradation' : 'improvement',
    },
    cls: {
      old: vitals1.cls,
      new: vitals2.cls,
      change: calculatePercentageChange(vitals1.cls, vitals2.cls),
      trend: vitals2.cls > vitals1.cls ? 'degradation' : 'improvement',
    },
    ttfb: {
      old: vitals1.ttfb,
      new: vitals2.ttfb,
      change: calculatePercentageChange(vitals1.ttfb, vitals2.ttfb),
      trend: vitals2.ttfb > vitals1.ttfb ? 'degradation' : 'improvement',
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
    averageResponseTime: {
      old: api1.averageResponseTime,
      new: api2.averageResponseTime,
      change: calculatePercentageChange(
        api1.averageResponseTime,
        api2.averageResponseTime
      ),
      trend:
        api2.averageResponseTime > api1.averageResponseTime
          ? 'degradation'
          : 'improvement',
    },
    successRate: {
      old: api1.successRate,
      new: api2.successRate,
      change: calculatePercentageChange(api1.successRate, api2.successRate),
      trend:
        api2.successRate > api1.successRate ? 'improvement' : 'degradation',
    },
    errorRate: {
      old: api1.errorRate,
      new: api2.errorRate,
      change: calculatePercentageChange(api1.errorRate, api2.errorRate),
      trend: api2.errorRate > api1.errorRate ? 'degradation' : 'improvement',
    },
    totalRequests: {
      old: api1.totalRequests,
      new: api2.totalRequests,
      change: calculatePercentageChange(api1.totalRequests, api2.totalRequests),
      trend: api2.totalRequests > api1.totalRequests ? 'increase' : 'decrease',
    },
  };
}

// Generate comparison report
function generateComparisonReport(comparison, date1, date2) {
  const report = {
    comparison: {
      date1,
      date2,
      generatedAt: new Date().toISOString(),
    },
    summary: {
      totalComparisons: Object.keys(comparison).length,
      improvements: 0,
      degradations: 0,
      neutral: 0,
    },
    details: comparison,
  };

  // Count improvements and degradations
  Object.values(comparison).forEach((category) => {
    if (typeof category === 'object' && category !== null) {
      Object.values(category).forEach((metric) => {
        if (metric && typeof metric === 'object' && metric.trend) {
          if (metric.trend === 'improvement') {
            report.summary.improvements++;
          } else if (metric.trend === 'degradation') {
            report.summary.degradations++;
          } else {
            report.summary.neutral++;
          }
        }
      });
    }
  });

  return report;
}

// Save comparison report
function saveComparisonReport(report, date1, date2) {
  // Ensure output directory exists
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  const filename = `comparison-${date1}-vs-${date2}.json`;
  const filepath = path.join(config.outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`✅ Comparison report saved to ${filepath}`);

  return filepath;
}

// Display comparison summary
function displayComparisonSummary(report) {
  console.log('\n📊 Performance Comparison Summary:');
  console.log(
    `📅 Comparing: ${report.comparison.date1} vs ${report.comparison.date2}`
  );
  console.log(`📈 Improvements: ${report.summary.improvements}`);
  console.log(`📉 Degradations: ${report.summary.degradations}`);
  console.log(`➖ Neutral: ${report.summary.neutral}`);

  console.log('\n🔍 Detailed Changes:');

  Object.entries(report.details).forEach(([category, metrics]) => {
    if (metrics && typeof metrics === 'object') {
      console.log(`\n📋 ${category.toUpperCase()}:`);

      Object.entries(metrics).forEach(([metric, data]) => {
        if (data && typeof data === 'object' && data.change !== null) {
          const change = data.change.toFixed(1);
          const trend =
            data.trend === 'improvement'
              ? '📈'
              : data.trend === 'degradation'
                ? '📉'
                : '➖';
          const oldValue =
            typeof data.old === 'number' ? data.old.toFixed(2) : data.old;
          const newValue =
            typeof data.new === 'number' ? data.new.toFixed(2) : data.new;

          console.log(
            `  ${trend} ${metric}: ${oldValue} → ${newValue} (${change > 0 ? '+' : ''}${change}%)`
          );
        }
      });
    }
  });
}

// Main execution
async function main() {
  console.log('🔍 Starting performance metrics comparison...');

  parseArgs();

  // Get available metrics files
  const availableFiles = getAvailableMetricsFiles();

  if (availableFiles.length === 0) {
    console.error('❌ No metrics files found in the metrics directory');
    console.error(`📁 Looking in: ${config.metricsDir}`);
    process.exit(1);
  }

  // Determine which files to compare
  let file1, file2;

  if (config.date1 && config.date2) {
    // Specific dates provided
    file1 = availableFiles.find((f) => f.date === config.date1);
    file2 = availableFiles.find((f) => f.date === config.date2);

    if (!file1) {
      console.error(`❌ Metrics file for date ${config.date1} not found`);
      console.error(
        `📅 Available dates: ${availableFiles.map((f) => f.date).join(', ')}`
      );
      process.exit(1);
    }
    if (!file2) {
      console.error(`❌ Metrics file for date ${config.date2} not found`);
      console.error(
        `📅 Available dates: ${availableFiles.map((f) => f.date).join(', ')}`
      );
      process.exit(1);
    }
  } else {
    // Use days back logic
    const today = getDateDaysBack(0);
    const compareDate = getDateDaysBack(config.daysBack);

    console.log(
      `📅 Looking for metrics from ${compareDate} (${config.daysBack} day${config.daysBack > 1 ? 's' : ''} ago)`
    );

    // Find the most recent file (today or closest to today)
    file2 = availableFiles.find((f) => f.date <= today) || availableFiles[0];

    // Find the file for the comparison date or closest to it
    file1 = availableFiles.find((f) => f.date <= compareDate);

    if (!file1) {
      console.error(`❌ No metrics file found for ${compareDate} or earlier`);
      console.error(
        `📅 Available dates: ${availableFiles.map((f) => f.date).join(', ')}`
      );
      console.error(
        `💡 Try using a different number of days back (--days=N) or specific dates`
      );
      process.exit(1);
    }

    if (!file2) {
      console.error(`❌ No metrics file found for comparison`);
      console.error(
        `📅 Available dates: ${availableFiles.map((f) => f.date).join(', ')}`
      );
      process.exit(1);
    }
  }

  console.log(`📅 Comparing ${file1.date} vs ${file2.date}`);

  // Load metrics
  const metrics1 = loadMetrics(file1.filename);
  const metrics2 = loadMetrics(file2.filename);

  if (!metrics1 || !metrics2) {
    console.error('❌ Failed to load metrics files');
    process.exit(1);
  }

  // Perform comparisons
  const comparison = {};

  const bundleComparison = compareBundleMetrics(metrics1, metrics2);
  if (bundleComparison) comparison.bundle = bundleComparison;

  const buildTimeComparison = compareBuildTimeMetrics(metrics1, metrics2);
  if (buildTimeComparison) comparison.buildTime = buildTimeComparison;

  const webVitalsComparison = compareWebVitalsMetrics(metrics1, metrics2);
  if (webVitalsComparison) comparison.webVitals = webVitalsComparison;

  const apiComparison = compareAPIMetrics(metrics1, metrics2);
  if (apiComparison) comparison.api = apiComparison;

  // Generate and save report
  const report = generateComparisonReport(comparison, file1.date, file2.date);
  const savedFile = saveComparisonReport(report, file1.date, file2.date);

  // Display summary
  displayComparisonSummary(report);

  console.log(`\n✅ Comparison completed! Report saved to: ${savedFile}`);
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  compareBundleMetrics,
  compareBuildTimeMetrics,
  compareWebVitalsMetrics,
  compareAPIMetrics,
  generateComparisonReport,
};
