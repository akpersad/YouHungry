/**
 * Error Tracking Utility
 *
 * Comprehensive error logging system for capturing, grouping, and analyzing
 * errors across the application. Designed to provide actionable insights
 * for debugging and improving reliability.
 */

import { logger } from '@/lib/logger';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from './db';
import { ErrorLog, ErrorGroup } from '@/types/database';

/**
 * Generate a fingerprint for error grouping
 * Uses error message + first line of stack trace for consistency
 */
export function generateErrorFingerprint(
  message: string,
  stack?: string
): string {
  const stackLine = stack ? stack.split('\n')[1]?.trim() || '' : '';

  const combined = `${message}:${stackLine}`;

  // Simple hash function for fingerprinting
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Classify error severity based on message and context
 */
export function classifyErrorSeverity(
  error: Error | unknown,
  _context?: Record<string, unknown>
): 'critical' | 'error' | 'warning' | 'info' {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  // Critical errors that affect core functionality
  if (
    message.includes('database') ||
    message.includes('auth') ||
    message.includes('payment') ||
    message.includes('critical') ||
    message.includes('fatal')
  ) {
    return 'critical';
  }

  // Regular errors that should be fixed but don't break core features
  if (
    message.includes('error') ||
    message.includes('failed') ||
    message.includes('exception')
  ) {
    return 'error';
  }

  // Warnings for potential issues
  if (message.includes('warn') || message.includes('deprecated')) {
    return 'warning';
  }

  return 'info';
}

/**
 * Determine error category
 */
export function categorizeError(
  error: Error | unknown,
  url?: string
): 'client' | 'server' | 'network' | 'api' {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('connection')
  ) {
    return 'network';
  }

  if (url?.includes('/api/')) {
    return 'api';
  }

  if (typeof window !== 'undefined') {
    return 'client';
  }

  return 'server';
}

/**
 * Parse user agent for device and browser info
 */
export function parseUserAgent(userAgent?: string): {
  browser?: string;
  device?: string;
} {
  if (!userAgent) return {};

  // Simple browser detection
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  // Simple device detection
  let device = 'Desktop';
  if (userAgent.includes('Mobile')) device = 'Mobile';
  else if (userAgent.includes('Tablet')) device = 'Tablet';

  return { browser, device };
}

export interface LogErrorOptions {
  error: Error | unknown;
  mongoUserId?: string; // MongoDB user ID (ObjectId as string)
  userEmail?: string;
  userName?: string;
  url: string;
  userAgent?: string;
  screenSize?: string;
  breadcrumbs?: {
    timestamp: Date;
    action: string;
    data?: Record<string, unknown>;
  }[];
  additionalData?: Record<string, unknown>;
  userReport?: {
    description: string;
  };
}

/**
 * Log an error to the database
 */
export async function logError(options: LogErrorOptions): Promise<void> {
  try {
    const db = await connectToDatabase();

    const errorMessage =
      options.error instanceof Error
        ? options.error.message
        : String(options.error);

    const errorStack =
      options.error instanceof Error ? options.error.stack : undefined;

    const fingerprint = generateErrorFingerprint(errorMessage, errorStack);
    const severity = classifyErrorSeverity(
      options.error,
      options.additionalData
    );
    const category = categorizeError(options.error, options.url);
    const { browser, device } = parseUserAgent(options.userAgent);

    const now = new Date();

    // Convert MongoDB user ID string to ObjectId if provided
    const userObjectId = options.mongoUserId
      ? new ObjectId(options.mongoUserId)
      : undefined;

    // Create error log entry
    const errorLog: Omit<ErrorLog, '_id'> = {
      fingerprint,
      message: errorMessage,
      stack: errorStack,
      userId: userObjectId,
      userEmail: options.userEmail,
      userName: options.userName,
      url: options.url,
      userAgent: options.userAgent,
      browser,
      device,
      screenSize: options.screenSize,
      breadcrumbs: options.breadcrumbs || [],
      severity,
      category,
      additionalData: options.additionalData,
      userReport: options.userReport
        ? {
            description: options.userReport.description,
            reportedAt: now,
          }
        : undefined,
      resolved: false,
      occurrenceCount: 1,
      firstSeenAt: now,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Insert error log
    await db.collection('errorLogs').insertOne(errorLog);

    // Update or create error group
    const existingGroup = await db
      .collection('errorGroups')
      .findOne({ fingerprint });

    if (existingGroup) {
      // Update existing group
      const updateData: Partial<ErrorGroup> = {
        totalOccurrences: existingGroup.totalOccurrences + 1,
        lastSeenAt: now,
        updatedAt: now,
      };

      // Add user to affected users if not already included
      if (
        userObjectId &&
        !existingGroup.affectedUserIds.some((id: ObjectId) =>
          id.equals(userObjectId)
        )
      ) {
        updateData.affectedUsers = existingGroup.affectedUsers + 1;
        updateData.affectedUserIds = [
          ...existingGroup.affectedUserIds,
          userObjectId,
        ];
      }

      await db
        .collection('errorGroups')
        .updateOne({ fingerprint }, { $set: updateData });
    } else {
      // Create new error group
      const errorGroup: Omit<ErrorGroup, '_id'> = {
        fingerprint,
        message: errorMessage,
        stack: errorStack,
        totalOccurrences: 1,
        affectedUsers: userObjectId ? 1 : 0,
        affectedUserIds: userObjectId ? [userObjectId] : [],
        severity,
        category,
        status: 'open',
        firstSeenAt: now,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('errorGroups').insertOne(errorGroup);
    }

    // If critical error, trigger alert
    if (severity === 'critical') {
      await triggerErrorAlert(errorMessage, fingerprint, options.url);
    }
  } catch (err) {
    // Fail silently to avoid error logging loop
    logger.error('Failed to log error:', err);
  }
}

/**
 * Trigger alert for critical errors
 */
async function triggerErrorAlert(
  errorMessage: string,
  fingerprint: string,
  url: string
): Promise<void> {
  try {
    // Call admin alerts API
    await fetch('/api/admin/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'error',
        severity: 'critical',
        title: 'Critical Error Detected',
        message: `Critical error occurred: ${errorMessage}`,
        metadata: {
          fingerprint,
          url,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  } catch (err) {
    logger.error('Failed to trigger error alert:', err);
  }
}

/**
 * Client-side error logger
 * NOTE: This is now in error-tracking-client.ts for use in client components
 * This export is kept for backwards compatibility but should not be used in client components
 */

/**
 * Get error statistics
 */
export async function getErrorStats(): Promise<{
  totalErrors: number;
  criticalErrors: number;
  affectedUsers: number;
  errorRate: number;
  topErrors: Array<{
    fingerprint: string;
    message: string;
    occurrences: number;
    affectedUsers: number;
  }>;
}> {
  const db = await connectToDatabase();

  const errorGroups = await db
    .collection('errorGroups')
    .find({ status: { $ne: 'ignored' } })
    .toArray();

  const totalErrors = errorGroups.reduce(
    (sum, group) => sum + (group.totalOccurrences || 0),
    0
  );

  const criticalErrors = errorGroups
    .filter((group) => group.severity === 'critical')
    .reduce((sum, group) => sum + (group.totalOccurrences || 0), 0);

  // Get unique affected users across all errors
  const allAffectedUserIds = new Set(
    errorGroups.flatMap((group) =>
      (group.affectedUserIds || []).map((id: ObjectId) => id.toString())
    )
  );

  const affectedUsers = allAffectedUserIds.size;

  // Calculate error rate (errors per hour over last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentErrors = await db
    .collection('errorLogs')
    .countDocuments({ createdAt: { $gte: oneDayAgo } });

  const errorRate = Math.round(recentErrors / 24);

  // Get top 5 errors by occurrence
  const topErrors = errorGroups
    .sort((a, b) => (b.totalOccurrences || 0) - (a.totalOccurrences || 0))
    .slice(0, 5)
    .map((group) => ({
      fingerprint: group.fingerprint,
      message: group.message,
      occurrences: group.totalOccurrences || 0,
      affectedUsers: group.affectedUsers || 0,
    }));

  return {
    totalErrors,
    criticalErrors,
    affectedUsers,
    errorRate,
    topErrors,
  };
}
