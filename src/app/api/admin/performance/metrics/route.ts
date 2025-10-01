import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const metricsDir = path.join(
      process.cwd(),
      'performance-metrics',
      'daily-metrics'
    );

    // Check if directory exists
    if (!fs.existsSync(metricsDir)) {
      return NextResponse.json({
        metrics: [],
        message: 'No metrics directory found',
      });
    }

    // Read all metrics files
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
      .sort(
        (a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()
      );

    // Load metrics data
    const metrics = files
      .map((file) => {
        try {
          const filepath = path.join(metricsDir, file.filename);
          const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
          return {
            date: file.date,
            ...data,
          };
        } catch (error) {
          logger.error(`Error loading metrics file ${file.filename}:`, error);
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json({
      metrics,
      totalFiles: files.length,
      dateRange:
        files.length > 0
          ? {
              from: files[0].date,
              to: files[files.length - 1].date,
            }
          : null,
    });
  } catch (error) {
    logger.error('Error loading performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to load performance metrics' },
      { status: 500 }
    );
  }
}
