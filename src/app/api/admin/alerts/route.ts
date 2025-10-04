import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { emailNotificationService, AlertData } from '@/lib/email-notifications';
import { alertStorage, StoredAlert } from '@/lib/alert-storage';

// GET /api/admin/alerts - Retrieve all alerts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const acknowledged = searchParams.get('acknowledged');
    const resolved = searchParams.get('resolved');

    logger.info('Admin: Fetching alerts', {
      limit,
      offset,
      severity,
      type,
      acknowledged,
      resolved,
    });

    let alerts = Array.from(alertStorage.values());

    // Apply filters
    if (severity) {
      alerts = alerts.filter((alert) => alert.severity === severity);
    }
    if (type) {
      alerts = alerts.filter((alert) => alert.type === type);
    }
    if (acknowledged !== null) {
      const isAcknowledged = acknowledged === 'true';
      alerts = alerts.filter((alert) => alert.acknowledged === isAcknowledged);
    }
    if (resolved !== null) {
      const isResolved = resolved === 'true';
      alerts = alerts.filter((alert) => alert.resolved === isResolved);
    }

    // Sort by timestamp (newest first)
    alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const paginatedAlerts = alerts.slice(offset, offset + limit);

    // Calculate statistics
    const stats = {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      high: alerts.filter((a) => a.severity === 'high').length,
      medium: alerts.filter((a) => a.severity === 'medium').length,
      low: alerts.filter((a) => a.severity === 'low').length,
      unacknowledged: alerts.filter((a) => !a.acknowledged).length,
      unresolved: alerts.filter((a) => !a.resolved).length,
    };

    return NextResponse.json({
      success: true,
      alerts: paginatedAlerts,
      stats,
      pagination: {
        limit,
        offset,
        total: alerts.length,
        hasMore: offset + limit < alerts.length,
      },
    });
  } catch (error) {
    logger.error('Admin: Error fetching alerts', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch alerts',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/alerts - Create a new alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      alertData,
      sendEmail = true,
    }: { alertData: AlertData; sendEmail?: boolean } = body;

    logger.info('Admin: Creating new alert', {
      alertType: alertData.type,
      severity: alertData.severity,
    });

    // Validate alert data
    if (
      !alertData.type ||
      !alertData.severity ||
      !alertData.title ||
      !alertData.message
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required alert fields',
        },
        { status: 400 }
      );
    }

    // Generate unique ID
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create stored alert
    const storedAlert: StoredAlert = {
      ...alertData,
      id: alertId,
      acknowledged: false,
      resolved: false,
    };

    // Store alert
    alertStorage.set(alertId, storedAlert);

    // Send email notification if requested
    if (sendEmail) {
      try {
        // Get email recipients from system settings
        // In a real implementation, this would fetch from the settings API
        const emailRecipients = [
          { email: 'akpersad@gmail.com', name: 'Admin' },
        ];

        await emailNotificationService.sendAlertNotification(
          alertData,
          emailRecipients
        );
        logger.info('Admin: Email notification sent for alert', { alertId });
      } catch (emailError) {
        logger.error('Admin: Failed to send email notification for alert', {
          alertId,
          error: emailError,
        });
        // Don't fail the alert creation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      alert: storedAlert,
      message: 'Alert created successfully',
    });
  } catch (error) {
    logger.error('Admin: Error creating alert', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create alert',
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/alerts/[id] - Update an alert (acknowledge/resolve)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      alertId,
      action,
      userId,
    }: { alertId: string; action: 'acknowledge' | 'resolve'; userId: string } =
      body;

    logger.info('Admin: Updating alert', { alertId, action, userId });

    const alert = alertStorage.get(alertId);
    if (!alert) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alert not found',
        },
        { status: 404 }
      );
    }

    const now = new Date();

    if (action === 'acknowledge') {
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = now;
    } else if (action === 'resolve') {
      alert.resolved = true;
      alert.resolvedBy = userId;
      alert.resolvedAt = now;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action',
        },
        { status: 400 }
      );
    }

    alertStorage.set(alertId, alert);

    return NextResponse.json({
      success: true,
      alert,
      message: `Alert ${action}d successfully`,
    });
  } catch (error) {
    logger.error('Admin: Error updating alert', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update alert',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/alerts/[id] - Delete an alert
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');

    if (!alertId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alert ID required',
        },
        { status: 400 }
      );
    }

    logger.info('Admin: Deleting alert', { alertId });

    const alert = alertStorage.get(alertId);
    if (!alert) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alert not found',
        },
        { status: 404 }
      );
    }

    alertStorage.delete(alertId);

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (error) {
    logger.error('Admin: Error deleting alert', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete alert',
      },
      { status: 500 }
    );
  }
}
