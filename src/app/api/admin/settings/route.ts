import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// System settings configuration interface
interface SystemSettings {
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit: number;
  };
  apiKeys: {
    googlePlaces: {
      enabled: boolean;
      dailyLimit: number;
      monthlyLimit: number;
      restrictions: string[];
    };
    googleMaps: {
      enabled: boolean;
      dailyLimit: number;
      monthlyLimit: number;
      restrictions: string[];
    };
  };
  alertThresholds: {
    costAlerts: {
      dailyThreshold: number;
      monthlyThreshold: number;
      enabled: boolean;
    };
    performanceAlerts: {
      responseTimeThreshold: number;
      errorRateThreshold: number;
      enabled: boolean;
    };
    systemAlerts: {
      cpuThreshold: number;
      memoryThreshold: number;
      diskThreshold: number;
      enabled: boolean;
    };
  };
  notificationSettings: {
    email: {
      enabled: boolean;
      recipients: string[];
      frequency: 'immediate' | 'hourly' | 'daily';
    };
    sms: {
      enabled: boolean;
      recipients: string[];
      frequency: 'immediate' | 'hourly' | 'daily';
    };
    webhook: {
      enabled: boolean;
      url: string;
      secret: string;
    };
  };
  maintenance: {
    scheduledDowntime: {
      enabled: boolean;
      startTime: string;
      endTime: string;
      timezone: string;
      message: string;
    };
    emergencyMode: {
      enabled: boolean;
      message: string;
      contactInfo: string;
    };
  };
}

// Default system settings
const defaultSettings: SystemSettings = {
  rateLimiting: {
    enabled: true,
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstLimit: 100,
  },
  apiKeys: {
    googlePlaces: {
      enabled: true,
      dailyLimit: 1000,
      monthlyLimit: 10000,
      restrictions: ['textSearch', 'nearbySearch', 'placeDetails'],
    },
    googleMaps: {
      enabled: true,
      dailyLimit: 1000,
      monthlyLimit: 10000,
      restrictions: ['mapsLoads'],
    },
  },
  alertThresholds: {
    costAlerts: {
      dailyThreshold: 50,
      monthlyThreshold: 1000,
      enabled: true,
    },
    performanceAlerts: {
      responseTimeThreshold: 2000,
      errorRateThreshold: 5,
      enabled: true,
    },
    systemAlerts: {
      cpuThreshold: 80,
      memoryThreshold: 85,
      diskThreshold: 90,
      enabled: true,
    },
  },
  notificationSettings: {
    email: {
      enabled: true,
      recipients: ['akpersad@gmail.com'],
      frequency: 'immediate',
    },
    sms: {
      enabled: false,
      recipients: [],
      frequency: 'immediate',
    },
    webhook: {
      enabled: false,
      url: '',
      secret: '',
    },
  },
  maintenance: {
    scheduledDowntime: {
      enabled: false,
      startTime: '02:00',
      endTime: '04:00',
      timezone: 'UTC',
      message: 'Scheduled maintenance in progress',
    },
    emergencyMode: {
      enabled: false,
      message: 'System is currently in emergency mode',
      contactInfo: 'akpersad@gmail.com',
    },
  },
};

// GET /api/admin/settings - Retrieve current system settings
export async function GET() {
  try {
    logger.info('Admin: Fetching system settings');

    // In a real implementation, this would fetch from a database or config file
    // For now, we'll return the default settings
    const settings = defaultSettings;

    return NextResponse.json({
      success: true,
      settings,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Admin: Error fetching system settings', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch system settings',
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update system settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings }: { settings: Partial<SystemSettings> } = body;

    logger.info('Admin: Updating system settings', { settings });

    // Validate the settings structure
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid settings format',
        },
        { status: 400 }
      );
    }

    // Validate rate limiting settings
    if (settings.rateLimiting) {
      const { rateLimiting } = settings;
      if (
        rateLimiting.requestsPerMinute < 1 ||
        rateLimiting.requestsPerHour < 1 ||
        rateLimiting.requestsPerDay < 1 ||
        rateLimiting.burstLimit < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limiting values must be positive numbers',
          },
          { status: 400 }
        );
      }
    }

    // Validate alert thresholds
    if (settings.alertThresholds) {
      const { alertThresholds } = settings;

      if (alertThresholds.costAlerts) {
        const { costAlerts } = alertThresholds;
        if (costAlerts.dailyThreshold < 0 || costAlerts.monthlyThreshold < 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'Cost alert thresholds must be non-negative numbers',
            },
            { status: 400 }
          );
        }
      }

      if (alertThresholds.performanceAlerts) {
        const { performanceAlerts } = alertThresholds;
        if (
          performanceAlerts.responseTimeThreshold < 0 ||
          performanceAlerts.errorRateThreshold < 0 ||
          performanceAlerts.errorRateThreshold > 100
        ) {
          return NextResponse.json(
            {
              success: false,
              error: 'Performance alert thresholds must be valid numbers',
            },
            { status: 400 }
          );
        }
      }

      if (alertThresholds.systemAlerts) {
        const { systemAlerts } = alertThresholds;
        if (
          systemAlerts.cpuThreshold < 0 ||
          systemAlerts.cpuThreshold > 100 ||
          systemAlerts.memoryThreshold < 0 ||
          systemAlerts.memoryThreshold > 100 ||
          systemAlerts.diskThreshold < 0 ||
          systemAlerts.diskThreshold > 100
        ) {
          return NextResponse.json(
            {
              success: false,
              error: 'System alert thresholds must be between 0 and 100',
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate notification settings
    if (settings.notificationSettings) {
      const { notificationSettings } = settings;

      if (notificationSettings.email) {
        const { email } = notificationSettings;
        if (email.recipients && !Array.isArray(email.recipients)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Email recipients must be an array',
            },
            { status: 400 }
          );
        }

        // Validate email addresses
        if (email.recipients) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          for (const recipient of email.recipients) {
            if (!emailRegex.test(recipient)) {
              return NextResponse.json(
                {
                  success: false,
                  error: `Invalid email address: ${recipient}`,
                },
                { status: 400 }
              );
            }
          }
        }
      }
    }

    // In a real implementation, this would save to a database or config file
    // For now, we'll just log the update
    logger.info('Admin: System settings updated successfully', { settings });

    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully',
      settings,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Admin: Error updating system settings', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update system settings',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/reset - Reset settings to defaults
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { confirmReset } = body;

    if (!confirmReset) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reset confirmation required',
        },
        { status: 400 }
      );
    }

    logger.info('Admin: Resetting system settings to defaults');

    // In a real implementation, this would reset the database or config file
    // For now, we'll just log the reset
    logger.info('Admin: System settings reset to defaults');

    return NextResponse.json({
      success: true,
      message: 'System settings reset to defaults',
      settings: defaultSettings,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Admin: Error resetting system settings', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset system settings',
      },
      { status: 500 }
    );
  }
}
