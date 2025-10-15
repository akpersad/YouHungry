/**
 * Performance Metrics Types
 *
 * Defines the structure for performance metrics stored in MongoDB
 */

export interface BundleSizeMetrics {
  firstLoadJS: number | null;
  totalBundleSize: number;
  fileCount: number;
  timestamp: number;
}

export interface BuildTimeMetrics {
  buildTime: number;
  timestamp: number;
}

export interface WebVitalsMetrics {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  timestamp: number;
}

export interface ApiPerformanceMetrics {
  totalRequests: number;
  cacheHitRate: number;
  totalCacheHits: number;
  memoryEntries: number;
  dailyCost: number;
  monthlyCost: number;
  timestamp: number;
}

export interface SystemMetrics {
  platform: string;
  arch: string;
  nodeVersion: string;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  uptime: number;
  timestamp: number;
}

export interface PerformanceMetrics {
  _id?: string;
  date: string; // YYYY-MM-DD format
  bundleSize: BundleSizeMetrics;
  buildTime: BuildTimeMetrics;
  webVitals: WebVitalsMetrics;
  apiPerformance: ApiPerformanceMetrics;
  system: SystemMetrics;
  lastUpdated: string; // ISO 8601 date string
  createdAt?: Date;
}

export interface MetricsComparison {
  date1: string;
  date2: string;
  metrics1: PerformanceMetrics | null;
  metrics2: PerformanceMetrics | null;
  comparison: {
    bundleSize?: {
      firstLoadJS: {
        value1: number | null;
        value2: number | null;
        change: number | null;
        changePercent: number | null;
      };
      totalBundleSize: {
        value1: number;
        value2: number;
        change: number;
        changePercent: number;
      };
      fileCount: {
        value1: number;
        value2: number;
        change: number;
        changePercent: number;
      };
    };
    buildTime?: {
      buildTime: {
        value1: number;
        value2: number;
        change: number;
        changePercent: number;
      };
    };
    webVitals?: {
      fcp: {
        value1: number;
        value2: number;
        change: number;
        changePercent: number;
      };
      lcp: {
        value1: number;
        value2: number;
        change: number;
        changePercent: number;
      };
      fid: {
        value1: number;
        value2: number;
        change: number;
        changePercent: number;
      };
      cls: {
        value1: number;
        value2: number;
        change: number;
        changePercent: number;
      };
      ttfb: {
        value1: number;
        value2: number;
        change: number;
        changePercent: number;
      };
    };
    apiPerformance?: {
      totalRequests: {
        value1: number;
        value2: number;
        change: number;
        changePercent: number;
      };
      cacheHitRate: {
        value1: number;
        value2: number;
        change: number;
        changePercent: number;
      };
      totalCacheHits: {
        value1: number;
        value2: number;
        change: number;
        changePercent: number;
      };
    };
    system?: {
      memoryUsage: {
        heapUsed: {
          value1: number;
          value2: number;
          change: number;
          changePercent: number;
        };
      };
    };
  };
}

export type ComparisonPeriod = '1day' | '1week' | '2weeks' | '1month';
