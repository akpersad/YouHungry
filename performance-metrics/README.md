# Performance Metrics Monitoring

This folder contains tools and scripts for monitoring and analyzing the performance of the You Hungry? application.

## 📁 File Structure

```
performance-metrics/
├── README.md                 # This file
├── collect-metrics.js        # Script to collect performance metrics
├── compare-metrics.js        # Script to compare metrics between dates
├── dashboard.js              # Script to generate HTML dashboard
├── daily-metrics/            # Daily metrics files (generated)
│   └── metrics-YYYY-MM-DD.json
├── comparisons/              # Comparison reports (generated)
│   └── comparison-YYYY-MM-DD-vs-YYYY-MM-DD.json
└── dashboard.html            # HTML dashboard (generated)
```

## 🚀 Quick Start

### Prerequisites

Before collecting metrics, ensure:

- The development server is running (`npm run dev`)
- You have sufficient permissions to access the admin API endpoints
- Chrome/Chromium is installed (for Lighthouse web vitals collection)

### 1. Collect Performance Metrics

Run the metrics collection script to gather current performance data:

```bash
# Start the development server first
npm run dev

# In a new terminal, collect metrics for current environment
node performance-metrics/collect-metrics.js

# Collect metrics for specific environment
node performance-metrics/collect-metrics.js --env=production

# Specify custom output directory
node performance-metrics/collect-metrics.js --output=./custom-metrics/
```

**Note**: The script collects real metrics from:

- **Web Vitals**: Lighthouse analysis of the running application
- **API Performance**: Real-time data from the cost monitoring API
- **Bundle Size**: Actual build output analysis
- **Build Time**: Measured compilation time

### 2. Compare Performance Over Time

Compare metrics with previous days or specific dates:

```bash
# Compare with previous day (default)
node performance-metrics/compare-metrics.js

# Compare with 2 days ago
node performance-metrics/compare-metrics.js --days=2

# Compare with 1 week ago
node performance-metrics/compare-metrics.js --days=7

# Compare two specific dates
node performance-metrics/compare-metrics.js --date1=2024-01-15 --date2=2024-01-22
```

### 3. Generate Performance Dashboard

Create an interactive HTML dashboard:

```bash
# Generate dashboard for last 7 days
node performance-metrics/dashboard.js

# Generate dashboard for last 30 days
node performance-metrics/dashboard.js --days=30

# Specify custom output file
node performance-metrics/dashboard.js --output=dashboard.html
```

## 📊 Metrics Collected

### Bundle Performance

- **First Load JS**: Size of the initial JavaScript bundle
- **Total Bundle Size**: Combined size of all JavaScript files
- **File Count**: Number of JavaScript files in the bundle
- **Build Time**: Time taken to build the application

### Web Vitals

- **FCP (First Contentful Paint)**: Time to first contentful paint
- **LCP (Largest Contentful Paint)**: Time to largest contentful paint
- **FID (First Input Delay)**: Time to first input response
- **CLS (Cumulative Layout Shift)**: Visual stability score
- **TTFB (Time to First Byte)**: Server response time

### API Performance

- **Total Requests**: Number of API requests made (from database)
- **Cache Hit Rate**: Percentage of requests served from cache
- **Total Cache Hits**: Number of successful cache hits
- **Memory Entries**: Number of cached entries in memory
- **Daily Cost**: Estimated daily API cost
- **Monthly Cost**: Estimated monthly API cost

### System Metrics

- **Memory Usage**: JavaScript heap usage
- **Platform**: Operating system information
- **Node Version**: Node.js version used
- **Uptime**: Application uptime

## 📈 Understanding the Data

### Bundle Size Guidelines

- **Good**: < 250KB initial bundle
- **Acceptable**: 250KB - 500KB
- **Needs Optimization**: > 500KB

### Web Vitals Thresholds

- **FCP**: Good < 1.8s, Needs Improvement < 3.0s, Poor > 3.0s
- **LCP**: Good < 2.5s, Needs Improvement < 4.0s, Poor > 4.0s
- **FID**: Good < 100ms, Needs Improvement < 300ms, Poor > 300ms
- **CLS**: Good < 0.1, Needs Improvement < 0.25, Poor > 0.25
- **TTFB**: Good < 800ms, Needs Improvement < 1800ms, Poor > 1800ms

### API Performance Guidelines

- **Response Time**: Good < 200ms, Acceptable < 500ms, Poor > 500ms
- **Success Rate**: Good > 99%, Acceptable > 95%, Poor < 95%

## 🔧 Configuration

### Environment Variables

- `NODE_ENV`: Environment (development/production)
- `ANALYZE`: Enable bundle analysis (true/false)

### Script Options

#### collect-metrics.js

- `--env=environment`: Set environment (default: development)
- `--output=path`: Set output directory (default: ./performance-metrics/)

#### compare-metrics.js

- `--days=N`: Number of days back to compare (default: 1)
- `--date1=YYYY-MM-DD`: First date to compare (overrides --days)
- `--date2=YYYY-MM-DD`: Second date to compare (overrides --days)
- `--output=path`: Set output directory for comparisons

#### dashboard.js

- `--output=filename`: Set output filename (default: dashboard.html)
- `--days=number`: Number of days to include (default: 7)

## 📋 Daily Workflow

### Morning Routine

1. Run `node performance-metrics/collect-metrics.js` to collect overnight metrics
2. Check `dashboard.html` for any performance regressions
3. Review any alerts or warnings in the console output

### Weekly Review

1. Run `node performance-metrics/compare-metrics.js` to compare with previous week
2. Generate new dashboard: `node performance-metrics/dashboard.js --days=7`
3. Review trends and identify optimization opportunities

### Monthly Analysis

1. Generate monthly dashboard: `node performance-metrics/dashboard.js --days=30`
2. Run comprehensive comparison against previous month
3. Document performance improvements and regressions

## 🚨 Troubleshooting

### Common Issues

**"No metrics files found"**

- Ensure you've run `collect-metrics.js` at least once
- Check that the output directory exists and is writable

**"Could not collect real web vitals" or "Could not collect real API metrics"**

- Ensure the development server is running on `http://localhost:3000`
- Check that you have admin access to the cost monitoring API
- Verify that Chrome/Chromium is installed for Lighthouse
- The script will continue with partial metrics if some collection fails

**"Failed to load metrics file"**

- Verify the JSON file is valid and not corrupted
- Check file permissions

**"Chart not displaying"**

- Ensure you have an internet connection (Chart.js is loaded from CDN)
- Check browser console for JavaScript errors

### Performance Issues

**High Bundle Size**

- Run `npm run analyze` to identify large dependencies
- Consider code splitting for large components
- Remove unused dependencies

**Slow Web Vitals**

- Optimize images and use Next.js Image component
- Implement lazy loading for non-critical components
- Review and optimize API calls

**API Performance Issues**

- Check database query performance
- Implement proper caching strategies
- Review network requests and reduce unnecessary calls

## 📚 Additional Resources

- [Next.js Performance Documentation](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Bundle Analysis Guide](https://nextjs.org/docs/advanced-features/analyzing-bundles)
- [Chrome DevTools Performance](https://developers.google.com/web/tools/chrome-devtools/evaluate-performance)

## 🔄 Maintenance

### Cleanup

The scripts automatically clean up metrics files older than 30 days. You can adjust this in the configuration.

### Backup

Consider backing up important metrics files before major deployments or changes.

### Updates

Keep the scripts updated as the application evolves to ensure accurate metrics collection.
