#!/usr/bin/env node

/**
 * Performance Dashboard Script
 *
 * This script generates a simple HTML dashboard to visualize
 * performance metrics over time.
 *
 * Usage:
 *   node dashboard.js [--output=path] [--days=7]
 *
 * Example:
 *   node dashboard.js --output=./performance-metrics/dashboard.html --days=30
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  metricsDir: './performance-metrics/daily-metrics',
  outputDir: './performance-metrics',
  days: 7,
  outputFile: 'dashboard.html',
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  args.forEach((arg) => {
    if (arg.startsWith('--output=')) {
      config.outputFile = arg.split('=')[1];
    } else if (arg.startsWith('--days=')) {
      config.days = parseInt(arg.split('=')[1]);
    }
  });
}

// Get metrics files for the specified number of days
function getMetricsFiles() {
  try {
    const files = fs.readdirSync(config.metricsDir);
    const metricsFiles = files
      .filter((file) => file.startsWith('metrics-') && file.endsWith('.json'))
      .map((file) => {
        const dateMatch = file.match(/metrics-(\d{4}-\d{2}-\d{2})\.json/);
        return {
          filename: file,
          date: dateMatch ? dateMatch[1] : null,
        };
      })
      .filter((item) => item.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Oldest first

    // Get files from the last N days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.days);

    return metricsFiles.filter((file) => new Date(file.date) >= cutoffDate);
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

// Generate HTML dashboard
function generateDashboard(metricsData) {
  const dates = metricsData.map((d) => d.date);
  const bundleSizes = metricsData.map(
    (d) => d.metrics.bundleSize?.totalBundleSize || 0
  );
  const buildTimes = metricsData.map(
    (d) => d.metrics.buildTime?.buildTime || 0
  );
  const fcpValues = metricsData.map((d) => d.metrics.webVitals?.fcp || 0);
  const lcpValues = metricsData.map((d) => d.metrics.webVitals?.lcp || 0);
  const fidValues = metricsData.map((d) => d.metrics.webVitals?.fid || 0);
  const clsValues = metricsData.map((d) => d.metrics.webVitals?.cls || 0);
  const ttfbValues = metricsData.map((d) => d.metrics.webVitals?.ttfb || 0);
  const apiResponseTimes = metricsData.map(
    (d) => d.metrics.apiPerformance?.averageResponseTime || 0
  );
  const successRates = metricsData.map(
    (d) => d.metrics.apiPerformance?.successRate || 0
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Dashboard - You Hungry?</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
            margin: 0;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .card h3 {
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
        }
        .chart-container {
            position: relative;
            height: 300px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .summary-item {
            background: white;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .summary-item h4 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-item .value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .summary-item .trend {
            font-size: 12px;
            margin-top: 5px;
        }
        .trend.up { color: #4caf50; }
        .trend.down { color: #f44336; }
        .trend.neutral { color: #666; }
        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Performance Dashboard</h1>
            <p>You Hungry? App - Last ${config.days} days</p>
        </div>

        <div class="summary">
            <div class="summary-item">
                <h4>Bundle Size</h4>
                <div class="value">${bundleSizes[bundleSizes.length - 1] || 0} KB</div>
                <div class="trend ${bundleSizes.length > 1 ? (bundleSizes[bundleSizes.length - 1] > bundleSizes[0] ? 'up' : 'down') : 'neutral'}">
                    ${
                      bundleSizes.length > 1
                        ? (bundleSizes[bundleSizes.length - 1] > bundleSizes[0]
                            ? '↗'
                            : '↘') +
                          ' ' +
                          Math.abs(
                            ((bundleSizes[bundleSizes.length - 1] -
                              bundleSizes[0]) /
                              bundleSizes[0]) *
                              100
                          ).toFixed(1) +
                          '%'
                        : 'No change'
                    }
                </div>
            </div>
            <div class="summary-item">
                <h4>Build Time</h4>
                <div class="value">${((buildTimes[buildTimes.length - 1] || 0) / 1000).toFixed(1)}s</div>
                <div class="trend ${buildTimes.length > 1 ? (buildTimes[buildTimes.length - 1] > buildTimes[0] ? 'up' : 'down') : 'neutral'}">
                    ${
                      buildTimes.length > 1
                        ? (buildTimes[buildTimes.length - 1] > buildTimes[0]
                            ? '↗'
                            : '↘') +
                          ' ' +
                          Math.abs(
                            ((buildTimes[buildTimes.length - 1] -
                              buildTimes[0]) /
                              buildTimes[0]) *
                              100
                          ).toFixed(1) +
                          '%'
                        : 'No change'
                    }
                </div>
            </div>
            <div class="summary-item">
                <h4>First Contentful Paint</h4>
                <div class="value">${(fcpValues[fcpValues.length - 1] || 0).toFixed(0)}ms</div>
                <div class="trend ${fcpValues.length > 1 ? (fcpValues[fcpValues.length - 1] > fcpValues[0] ? 'up' : 'down') : 'neutral'}">
                    ${
                      fcpValues.length > 1
                        ? (fcpValues[fcpValues.length - 1] > fcpValues[0]
                            ? '↗'
                            : '↘') +
                          ' ' +
                          Math.abs(
                            ((fcpValues[fcpValues.length - 1] - fcpValues[0]) /
                              fcpValues[0]) *
                              100
                          ).toFixed(1) +
                          '%'
                        : 'No change'
                    }
                </div>
            </div>
            <div class="summary-item">
                <h4>API Response Time</h4>
                <div class="value">${(apiResponseTimes[apiResponseTimes.length - 1] || 0).toFixed(0)}ms</div>
                <div class="trend ${apiResponseTimes.length > 1 ? (apiResponseTimes[apiResponseTimes.length - 1] > apiResponseTimes[0] ? 'up' : 'down') : 'neutral'}">
                    ${
                      apiResponseTimes.length > 1
                        ? (apiResponseTimes[apiResponseTimes.length - 1] >
                          apiResponseTimes[0]
                            ? '↗'
                            : '↘') +
                          ' ' +
                          Math.abs(
                            ((apiResponseTimes[apiResponseTimes.length - 1] -
                              apiResponseTimes[0]) /
                              apiResponseTimes[0]) *
                              100
                          ).toFixed(1) +
                          '%'
                        : 'No change'
                    }
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h3>📦 Bundle Size Over Time</h3>
                <div class="chart-container">
                    <canvas id="bundleChart"></canvas>
                </div>
            </div>
            <div class="card">
                <h3>⏱️ Build Time Over Time</h3>
                <div class="chart-container">
                    <canvas id="buildChart"></canvas>
                </div>
            </div>
            <div class="card">
                <h3>🌐 Core Web Vitals</h3>
                <div class="chart-container">
                    <canvas id="webVitalsChart"></canvas>
                </div>
            </div>
            <div class="card">
                <h3>🔌 API Performance</h3>
                <div class="chart-container">
                    <canvas id="apiChart"></canvas>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Generated on ${new Date().toLocaleString()} | Data from ${dates.length} days</p>
        </div>
    </div>

    <script>
        // Chart.js configuration
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        Chart.defaults.color = '#666';

        const dates = ${JSON.stringify(dates)};
        const bundleSizes = ${JSON.stringify(bundleSizes)};
        const buildTimes = ${JSON.stringify(buildTimes.map((t) => t / 1000))};
        const fcpValues = ${JSON.stringify(fcpValues)};
        const lcpValues = ${JSON.stringify(lcpValues)};
        const fidValues = ${JSON.stringify(fidValues)};
        const clsValues = ${JSON.stringify(clsValues)};
        const ttfbValues = ${JSON.stringify(ttfbValues)};
        const apiResponseTimes = ${JSON.stringify(apiResponseTimes)};
        const successRates = ${JSON.stringify(successRates)};

        // Bundle Size Chart
        new Chart(document.getElementById('bundleChart'), {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Total Bundle Size (KB)',
                    data: bundleSizes,
                    borderColor: '#2196f3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Size (KB)'
                        }
                    }
                }
            }
        });

        // Build Time Chart
        new Chart(document.getElementById('buildChart'), {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Build Time (seconds)',
                    data: buildTimes,
                    borderColor: '#ff9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Time (seconds)'
                        }
                    }
                }
            }
        });

        // Web Vitals Chart
        new Chart(document.getElementById('webVitalsChart'), {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'FCP (ms)',
                        data: fcpValues,
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'LCP (ms)',
                        data: lcpValues,
                        borderColor: '#2196f3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'FID (ms)',
                        data: fidValues,
                        borderColor: '#ff9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'CLS',
                        data: clsValues,
                        borderColor: '#f44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'TTFB (ms)',
                        data: ttfbValues,
                        borderColor: '#9c27b0',
                        backgroundColor: 'rgba(156, 39, 176, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Time (ms) / Score'
                        }
                    }
                }
            }
        });

        // API Performance Chart
        new Chart(document.getElementById('apiChart'), {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Response Time (ms)',
                        data: apiResponseTimes,
                        borderColor: '#2196f3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Success Rate (%)',
                        data: successRates,
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Response Time (ms)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Success Rate (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    </script>
</body>
</html>`;
}

// Main execution
async function main() {
  console.log('📊 Generating performance dashboard...');

  parseArgs();

  // Get metrics files
  const metricsFiles = getMetricsFiles();

  if (metricsFiles.length === 0) {
    console.error('❌ No metrics files found');
    process.exit(1);
  }

  console.log(`📅 Found ${metricsFiles.length} metrics files`);

  // Load all metrics
  const metricsData = metricsFiles
    .map((file) => {
      const metrics = loadMetrics(file.filename);
      return {
        date: file.date,
        metrics: metrics || {},
      };
    })
    .filter((data) => data.metrics && Object.keys(data.metrics).length > 0);

  if (metricsData.length === 0) {
    console.error('❌ No valid metrics data found');
    process.exit(1);
  }

  console.log(`📊 Loaded ${metricsData.length} valid metrics files`);

  // Generate dashboard
  const dashboard = generateDashboard(metricsData);

  // Save dashboard
  const outputPath = path.join(config.outputDir, config.outputFile);
  fs.writeFileSync(outputPath, dashboard);

  // Also copy to public directory for easy access via Next.js
  const publicPath = path.join(
    process.cwd(),
    'public',
    'performance-dashboard.html'
  );
  fs.writeFileSync(publicPath, dashboard);

  console.log(`✅ Dashboard generated: ${outputPath}`);
  console.log(`📄 Also available at: ${publicPath}`);
  console.log(`🌐 Open in browser: file://${path.resolve(outputPath)}`);
  console.log(
    `🌐 Or via Next.js: http://localhost:3000/performance-dashboard.html`
  );
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  generateDashboard,
  getMetricsFiles,
  loadMetrics,
};
