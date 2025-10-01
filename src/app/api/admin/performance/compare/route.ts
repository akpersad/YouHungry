import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '1');

    const metricsDir = path.join(
      process.cwd(),
      'performance-metrics',
      'daily-metrics'
    );
    const comparisonsDir = path.join(
      process.cwd(),
      'performance-metrics',
      'comparisons'
    );

    // Check if directories exist
    if (!fs.existsSync(metricsDir)) {
      return NextResponse.json(
        {
          error: 'No metrics directory found',
        },
        { status: 404 }
      );
    }

    // Get available metrics files
    const files = fs
      .readdirSync(metricsDir)
      .filter((file) => file.startsWith('metrics-') && file.endsWith('.json'))
      .map((file) => {
        const dateMatch = file.match(/metrics-(\d{4}-\d{2}-\d{2})\.json/);
        return {
          filename: file,
          date: dateMatch ? dateMatch[1] : null,
        };
      })
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (files.length < 2) {
      return NextResponse.json(
        {
          error: 'Need at least 2 metrics files to compare',
          availableFiles: files.length,
        },
        { status: 400 }
      );
    }

    // Calculate comparison dates
    const today = new Date().toISOString().split('T')[0];
    const compareDate = new Date();
    compareDate.setDate(compareDate.getDate() - days);
    const compareDateStr = compareDate.toISOString().split('T')[0];

    // Find the most recent file (today or closest to today)
    const file2 = files.find((f) => f.date <= today) || files[0];

    // Find the file for the comparison date or closest to it
    const file1 = files.find((f) => f.date <= compareDateStr);

    if (!file1 || !file2) {
      return NextResponse.json(
        {
          error: `No metrics files found for comparison`,
          lookingFor: compareDateStr,
          availableDates: files.map((f) => f.date),
        },
        { status: 404 }
      );
    }

    // Check if comparison already exists
    const comparisonFilename = `comparison-${file1.date}-vs-${file2.date}.json`;
    const comparisonPath = path.join(comparisonsDir, comparisonFilename);

    if (fs.existsSync(comparisonPath)) {
      const comparisonData = JSON.parse(
        fs.readFileSync(comparisonPath, 'utf8')
      );
      return NextResponse.json(comparisonData);
    }

    // Load metrics for comparison
    const metrics1 = JSON.parse(
      fs.readFileSync(path.join(metricsDir, file1.filename), 'utf8')
    );
    const metrics2 = JSON.parse(
      fs.readFileSync(path.join(metricsDir, file2.filename), 'utf8')
    );

    // Perform comparison (simplified version)
    const comparison = {
      comparison: {
        date1: file1.date,
        date2: file2.date,
        generatedAt: new Date().toISOString(),
      },
      summary: {
        totalComparisons: 0,
        improvements: 0,
        degradations: 0,
        neutral: 0,
      },
      details: {},
    };

    // Compare web vitals
    if (metrics1.webVitals && metrics2.webVitals) {
      const webVitalsComparison = {};
      Object.keys(metrics2.webVitals).forEach((key) => {
        const oldValue = metrics1.webVitals[key];
        const newValue = metrics2.webVitals[key];
        const change = ((newValue - oldValue) / oldValue) * 100;
        const trend =
          change > 0 ? 'degradation' : change < 0 ? 'improvement' : 'neutral';

        webVitalsComparison[key] = {
          old: oldValue,
          new: newValue,
          change: change,
          trend: trend,
        };

        comparison.summary.totalComparisons++;
        if (trend === 'improvement') comparison.summary.improvements++;
        else if (trend === 'degradation') comparison.summary.degradations++;
        else comparison.summary.neutral++;
      });
      comparison.details.webVitals = webVitalsComparison;
    }

    // Compare bundle size
    if (metrics1.bundleSize && metrics2.bundleSize) {
      const bundleComparison = {};
      Object.keys(metrics2.bundleSize).forEach((key) => {
        const oldValue = metrics1.bundleSize[key];
        const newValue = metrics2.bundleSize[key];
        const change = ((newValue - oldValue) / oldValue) * 100;
        const trend =
          change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral';

        bundleComparison[key] = {
          old: oldValue,
          new: newValue,
          change: change,
          trend: trend,
        };

        comparison.summary.totalComparisons++;
        if (trend === 'decrease') comparison.summary.improvements++;
        else if (trend === 'increase') comparison.summary.degradations++;
        else comparison.summary.neutral++;
      });
      comparison.details.bundle = bundleComparison;
    }

    // Compare API performance
    if (metrics1.apiPerformance && metrics2.apiPerformance) {
      const apiComparison = {};
      Object.keys(metrics2.apiPerformance).forEach((key) => {
        const oldValue = metrics1.apiPerformance[key];
        const newValue = metrics2.apiPerformance[key];
        const change = ((newValue - oldValue) / oldValue) * 100;

        let trend = 'neutral';
        if (key === 'successRate') {
          trend =
            change > 0 ? 'improvement' : change < 0 ? 'degradation' : 'neutral';
        } else if (key === 'errorRate') {
          trend =
            change > 0 ? 'degradation' : change < 0 ? 'improvement' : 'neutral';
        } else if (key === 'averageResponseTime') {
          trend =
            change > 0 ? 'degradation' : change < 0 ? 'improvement' : 'neutral';
        } else {
          trend = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral';
        }

        apiComparison[key] = {
          old: oldValue,
          new: newValue,
          change: change,
          trend: trend,
        };

        comparison.summary.totalComparisons++;
        if (trend === 'improvement' || trend === 'decrease')
          comparison.summary.improvements++;
        else if (trend === 'degradation' || trend === 'increase')
          comparison.summary.degradations++;
        else comparison.summary.neutral++;
      });
      comparison.details.api = apiComparison;
    }

    return NextResponse.json(comparison);
  } catch (error) {
    logger.error('Error comparing performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to compare performance metrics' },
      { status: 500 }
    );
  }
}
