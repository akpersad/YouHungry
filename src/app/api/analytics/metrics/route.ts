import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

interface PerformanceMetric {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  bundleSize?: number;
  memoryUsed?: number;
  memoryTotal?: number;
  memoryLimit?: number;
  networkType?: string;
  networkDownlink?: number;
  networkRtt?: number;
  renderCount?: number;
  timestamp: number;
  url: string;
  userAgent: string;
}

export async function POST(request: NextRequest) {
  try {
    const metric: PerformanceMetric = await request.json();

    // Validate required fields
    if (!metric.timestamp || !metric.url) {
      return NextResponse.json(
        { error: 'Missing required fields: timestamp, url' },
        { status: 400 }
      );
    }

    // Connect to database
    const db = await connectToDatabase();

    // Store metric in database
    await db.collection('performance_metrics').insertOne({
      ...metric,
      createdAt: new Date(),
      date: new Date(metric.timestamp).toISOString().split('T')[0], // YYYY-MM-DD format
    });

    // Log metric for debugging
    logger.debug('Performance metric recorded:', {
      type: 'performance',
      timestamp: new Date(metric.timestamp).toISOString(),
      url: metric.url,
      metrics: Object.keys(metric).filter(
        (key) => key !== 'timestamp' && key !== 'url' && key !== 'userAgent'
      ),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error storing performance metric:', error);
    return NextResponse.json(
      { error: 'Failed to store performance metric' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await connectToDatabase();

    // Build query
    const query: { date?: string } = {};
    if (date) {
      query.date = date;
    }

    // Get metrics
    const metrics = await db
      .collection('performance_metrics')
      .find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Calculate averages for the time period
    const averages = await calculateAverages(db, query);

    return NextResponse.json({
      metrics,
      averages,
      total: metrics.length,
      hasMore: metrics.length === limit,
    });
  } catch (error) {
    logger.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

async function calculateAverages(
  db: {
    collection: (name: string) => {
      find: (query: unknown) => { toArray: () => Promise<unknown[]> };
    };
  },
  query: { date?: string }
) {
  const pipeline = [
    { $match: query },
    {
      $group: {
        _id: null,
        avgFcp: { $avg: '$fcp' },
        avgLcp: { $avg: '$lcp' },
        avgFid: { $avg: '$fid' },
        avgCls: { $avg: '$cls' },
        avgTtfb: { $avg: '$ttfb' },
        avgBundleSize: { $avg: '$bundleSize' },
        avgMemoryUsed: { $avg: '$memoryUsed' },
        avgMemoryTotal: { $avg: '$memoryTotal' },
        avgMemoryLimit: { $avg: '$memoryLimit' },
        avgNetworkDownlink: { $avg: '$networkDownlink' },
        avgNetworkRtt: { $avg: '$networkRtt' },
        count: { $sum: 1 },
      },
    },
  ];

  const result = await db
    .collection('performance_metrics')
    .aggregate(pipeline)
    .toArray();

  if (result.length === 0) {
    return {};
  }

  const averages = result[0];
  return {
    fcp: averages.avgFcp ? Math.round(averages.avgFcp) : null,
    lcp: averages.avgLcp ? Math.round(averages.avgLcp) : null,
    fid: averages.avgFid ? Math.round(averages.avgFid) : null,
    cls: averages.avgCls ? Math.round(averages.avgCls * 1000) / 1000 : null,
    ttfb: averages.avgTtfb ? Math.round(averages.avgTtfb) : null,
    bundleSize: averages.avgBundleSize
      ? Math.round(averages.avgBundleSize)
      : null,
    memoryUsed: averages.avgMemoryUsed
      ? Math.round(averages.avgMemoryUsed)
      : null,
    memoryTotal: averages.avgMemoryTotal
      ? Math.round(averages.avgMemoryTotal)
      : null,
    memoryLimit: averages.avgMemoryLimit
      ? Math.round(averages.avgMemoryLimit)
      : null,
    networkDownlink: averages.avgNetworkDownlink
      ? Math.round(averages.avgNetworkDownlink * 100) / 100
      : null,
    networkRtt: averages.avgNetworkRtt
      ? Math.round(averages.avgNetworkRtt)
      : null,
    count: averages.count,
  };
}
