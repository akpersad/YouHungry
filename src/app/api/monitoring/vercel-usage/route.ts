import { NextRequest, NextResponse } from 'next/server';

interface VercelUsageData {
  bandwidth: {
    used: number; // bytes
    limit: number; // bytes
    percentage: number;
  };
  functionExecution: {
    used: number; // GB-hours
    limit: number; // GB-hours
    percentage: number;
  };
  requests: {
    count: number;
    averagePerHour: number;
  };
}

interface AlertThresholds {
  bandwidth: {
    warning: number; // percentage
    critical: number; // percentage
  };
  functionExecution: {
    warning: number; // percentage
    critical: number; // percentage
  };
  requests: {
    warning: number; // requests per hour
    critical: number; // requests per hour
  };
}

// Alert thresholds - adjust these based on your usage patterns
const ALERT_THRESHOLDS: AlertThresholds = {
  bandwidth: {
    warning: 70, // Alert at 70% of bandwidth limit
    critical: 90, // Critical at 90%
  },
  functionExecution: {
    warning: 70, // Alert at 70% of function execution limit
    critical: 90, // Critical at 90%
  },
  requests: {
    warning: 1000, // Alert at 1000 requests/hour
    critical: 2000, // Critical at 2000 requests/hour
  },
};

// Mock function to get Vercel usage data
// In production, you'd call Vercel's API or use their webhook
async function getVercelUsageData(): Promise<VercelUsageData> {
  // This would be replaced with actual Vercel API calls
  // For now, we'll simulate some data
  return {
    bandwidth: {
      used: 50 * 1024 * 1024 * 1024, // 50GB
      limit: 100 * 1024 * 1024 * 1024, // 100GB
      percentage: 50,
    },
    functionExecution: {
      used: 50, // 50 GB-hours
      limit: 100, // 100 GB-hours
      percentage: 50,
    },
    requests: {
      count: 500, // 500 requests in current hour
      averagePerHour: 500,
    },
  };
}

// Function to send alerts (email, Slack, etc.)
async function sendAlert(
  type: 'warning' | 'critical',
  metric: 'bandwidth' | 'functionExecution' | 'requests',
  data: VercelUsageData
): Promise<void> {
  const thresholds = ALERT_THRESHOLDS[metric];
  const currentValue =
    metric === 'requests'
      ? data.requests.averagePerHour
      : data[metric].percentage;

  const message = `
🚨 Vercel Usage Alert - ${type.toUpperCase()}

Metric: ${metric}
Current Usage: ${currentValue}${metric === 'requests' ? ' requests/hour' : '%'}
Threshold: ${type === 'warning' ? thresholds.warning : thresholds.critical}${metric === 'requests' ? ' requests/hour' : '%'}

Bandwidth: ${data.bandwidth.percentage}% (${(data.bandwidth.used / 1024 ** 3).toFixed(1)}GB / ${(data.bandwidth.limit / 1024 ** 3).toFixed(1)}GB)
Function Execution: ${data.functionExecution.percentage}% (${data.functionExecution.used}GB-hours / ${data.functionExecution.limit}GB-hours)
Requests/Hour: ${data.requests.averagePerHour}

Time: ${new Date().toISOString()}
  `.trim();

  console.log(`ALERT: ${message}`);

  // In production, you would:
  // 1. Send email via SendGrid, AWS SES, etc.
  // 2. Send Slack notification
  // 3. Send SMS via Twilio
  // 4. Create a ticket in your issue tracker

  // Example: Send to Slack webhook
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          channel: '#alerts',
          username: 'Vercel Monitor',
          icon_emoji: type === 'critical' ? ':rotating_light:' : ':warning:',
        }),
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }
}

// Check if alerts should be sent
function shouldSendAlert(
  metric: 'bandwidth' | 'functionExecution' | 'requests',
  data: VercelUsageData,
  lastAlertTimes: Record<string, number>
): { shouldAlert: boolean; type: 'warning' | 'critical' | null } {
  const thresholds = ALERT_THRESHOLDS[metric];
  const currentValue =
    metric === 'requests'
      ? data.requests.averagePerHour
      : data[metric].percentage;

  const now = Date.now();
  const alertKey = `${metric}_${currentValue >= thresholds.critical ? 'critical' : 'warning'}`;
  const lastAlertTime = lastAlertTimes[alertKey] || 0;

  // Don't spam alerts - wait at least 1 hour between same-level alerts
  const ALERT_COOLDOWN = 60 * 60 * 1000; // 1 hour

  if (
    currentValue >= thresholds.critical &&
    now - lastAlertTime > ALERT_COOLDOWN
  ) {
    return { shouldAlert: true, type: 'critical' };
  }

  if (
    currentValue >= thresholds.warning &&
    now - lastAlertTime > ALERT_COOLDOWN
  ) {
    return { shouldAlert: true, type: 'warning' };
  }

  return { shouldAlert: false, type: null };
}

// Main monitoring function
export async function checkVercelUsage(): Promise<void> {
  try {
    const data = await getVercelUsageData();

    // In production, you'd store last alert times in a database
    // For now, we'll use a simple in-memory store
    const lastAlertTimes: Record<string, number> = {};

    // Check each metric
    const metrics: Array<'bandwidth' | 'functionExecution' | 'requests'> = [
      'bandwidth',
      'functionExecution',
      'requests',
    ];

    for (const metric of metrics) {
      const { shouldAlert, type } = shouldSendAlert(
        metric,
        data,
        lastAlertTimes
      );

      if (shouldAlert && type) {
        await sendAlert(type, metric, data);
        lastAlertTimes[`${metric}_${type}`] = Date.now();
      }
    }

    // Log current usage for monitoring
    console.log('Vercel Usage Check:', {
      bandwidth: `${data.bandwidth.percentage}%`,
      functionExecution: `${data.functionExecution.percentage}%`,
      requestsPerHour: data.requests.averagePerHour,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to check Vercel usage:', error);
  }
}

// API endpoint to manually check usage
export async function GET(_request: NextRequest) {
  try {
    await checkVercelUsage();
    return NextResponse.json({
      success: true,
      message: 'Usage check completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// API endpoint to get current usage data
export async function POST(_request: NextRequest) {
  try {
    const data = await getVercelUsageData();
    return NextResponse.json({
      success: true,
      data,
      thresholds: ALERT_THRESHOLDS,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
