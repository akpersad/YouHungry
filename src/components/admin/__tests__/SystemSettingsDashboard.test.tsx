import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SystemSettingsDashboard } from '../SystemSettingsDashboard';

// Mock fetch
global.fetch = jest.fn();

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('SystemSettingsDashboard', () => {
  const mockSettings = {
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
        restrictions: ['textSearch', 'nearbySearch'],
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
        recipients: ['admin@youhungry.app'],
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
        contactInfo: 'admin@youhungry.app',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<SystemSettingsDashboard />);

    // Loading skeleton should be visible - check for skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
    expect(skeletonElements[0]).toHaveClass('animate-pulse');
  });

  it('should render settings successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: mockSettings,
        lastUpdated: new Date().toISOString(),
      }),
    } as Response);

    render(<SystemSettingsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });
  });

  it('should handle fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<SystemSettingsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should switch between sections', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: mockSettings,
        lastUpdated: new Date().toISOString(),
      }),
    } as Response);

    render(<SystemSettingsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    // Click on API Keys section
    fireEvent.click(screen.getByText('API Keys'));

    await waitFor(() => {
      expect(screen.getByText('Google Places API')).toBeInTheDocument();
    });

    // Click on Alert Thresholds section
    fireEvent.click(screen.getByText('Alert Thresholds'));

    await waitFor(() => {
      expect(screen.getByText('Cost Alerts')).toBeInTheDocument();
    });
  });

  it('should update rate limiting settings', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          settings: mockSettings,
          lastUpdated: new Date().toISOString(),
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Settings saved successfully',
          lastUpdated: new Date().toISOString(),
        }),
      } as Response);

    render(<SystemSettingsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    // Update requests per minute
    const requestsPerMinuteInput = screen.getByDisplayValue('60');
    fireEvent.change(requestsPerMinuteInput, { target: { value: '120' } });

    // Save settings
    fireEvent.click(screen.getByText('Save Settings'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"requestsPerMinute":120'),
      });
    });
  });

  it('should reset settings to defaults', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          settings: mockSettings,
          lastUpdated: new Date().toISOString(),
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Settings reset to defaults',
          settings: mockSettings,
          lastUpdated: new Date().toISOString(),
        }),
      } as Response);

    // Mock confirm dialog
    window.confirm = jest.fn(() => true);

    render(<SystemSettingsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    // Click reset button
    fireEvent.click(screen.getByText('Reset to Defaults'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmReset: true }),
      });
    });
  });

  it('should handle save error', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          settings: mockSettings,
          lastUpdated: new Date().toISOString(),
        }),
      } as Response)
      .mockRejectedValueOnce(new Error('Save failed'));

    render(<SystemSettingsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    // Save settings
    fireEvent.click(screen.getByText('Save Settings'));

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });

  it('should update nested settings', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: mockSettings,
        lastUpdated: new Date().toISOString(),
      }),
    } as Response);

    render(<SystemSettingsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    // Switch to Alert Thresholds section
    fireEvent.click(screen.getByText('Alert Thresholds'));

    await waitFor(() => {
      expect(screen.getByText('Cost Alerts')).toBeInTheDocument();
    });

    // Update daily threshold
    const dailyThresholdInput = screen.getByDisplayValue('50');
    fireEvent.change(dailyThresholdInput, { target: { value: '100' } });

    // Verify the input was updated
    expect(dailyThresholdInput).toHaveValue(100);
  });

  it('should update notification settings', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: mockSettings,
        lastUpdated: new Date().toISOString(),
      }),
    } as Response);

    render(<SystemSettingsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    // Switch to Notifications section
    fireEvent.click(screen.getByText('Notifications'));

    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    });

    // Update email recipients
    const recipientsInput = screen.getByDisplayValue('admin@youhungry.app');
    fireEvent.change(recipientsInput, {
      target: { value: 'admin@youhungry.app, alerts@youhungry.app' },
    });

    // Verify the input was updated
    expect(recipientsInput).toHaveValue(
      'admin@youhungry.app, alerts@youhungry.app'
    );
  });

  it('should update maintenance settings', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        settings: mockSettings,
        lastUpdated: new Date().toISOString(),
      }),
    } as Response);

    render(<SystemSettingsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    // Switch to Maintenance section
    fireEvent.click(screen.getByText('Maintenance'));

    await waitFor(() => {
      expect(screen.getByText('Scheduled Downtime')).toBeInTheDocument();
    });

    // Update maintenance message
    const messageTextarea = screen.getByDisplayValue(
      'Scheduled maintenance in progress'
    );
    fireEvent.change(messageTextarea, {
      target: { value: 'Updated maintenance message' },
    });

    // Verify the textarea was updated
    expect(messageTextarea).toHaveValue('Updated maintenance message');
  });
});
