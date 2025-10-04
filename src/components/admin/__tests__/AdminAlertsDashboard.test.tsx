import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminAlertsDashboard } from '../AdminAlertsDashboard';

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

// Use global.fetch directly for mocking

describe('AdminAlertsDashboard', () => {
  const mockAlerts = [
    {
      id: 'alert-1',
      type: 'cost_threshold_exceeded',
      severity: 'high',
      title: 'Daily Cost Exceeded',
      message: 'Daily cost has exceeded the threshold',
      timestamp: new Date('2024-01-01T10:00:00Z'),
      acknowledged: false,
      resolved: false,
      metadata: { dailyCost: 75, threshold: 50 },
      recommendedActions: ['Review API usage', 'Implement cost controls'],
    },
    {
      id: 'alert-2',
      type: 'performance_degradation',
      severity: 'medium',
      title: 'Response Time High',
      message: 'API response time has increased',
      timestamp: new Date('2024-01-01T09:00:00Z'),
      acknowledged: true,
      acknowledgedBy: 'admin',
      acknowledgedAt: new Date('2024-01-01T09:30:00Z'),
      resolved: false,
    },
  ];

  const mockStats = {
    total: 2,
    critical: 0,
    high: 1,
    medium: 1,
    low: 0,
    unacknowledged: 1,
    unresolved: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the global fetch mock to its default implementation
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        headers: new Headers(),
      })
    );
  });

  it('should render loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AdminAlertsDashboard />);

    // Loading skeleton should be visible - check for the skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
    expect(skeletonElements[0]).toHaveClass('animate-pulse');
  });

  it('should render alerts successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        alerts: mockAlerts,
        stats: mockStats,
        pagination: {
          limit: 50,
          offset: 0,
          total: 2,
          hasMore: false,
        },
      }),
    } as Response);

    render(<AdminAlertsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Admin Alerts')).toBeInTheDocument();
      expect(screen.getByText('Daily Cost Exceeded')).toBeInTheDocument();
      expect(screen.getByText('Response Time High')).toBeInTheDocument();
    });
  });

  it('should display alert statistics', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        alerts: mockAlerts,
        stats: mockStats,
        pagination: {
          limit: 50,
          offset: 0,
          total: 2,
          hasMore: false,
        },
      }),
    } as Response);

    render(<AdminAlertsDashboard />);

    await waitFor(() => {
      // Check for specific statistics by looking for the labels
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getAllByText('High')).toHaveLength(2); // One in stats, one in filter button
      expect(screen.getAllByText('Medium')).toHaveLength(2); // One in stats, one in filter button
      expect(screen.getAllByText('Unacknowledged')).toHaveLength(3); // One in stats, one in filter button, one in alert badge
      expect(screen.getAllByText('Unresolved')).toHaveLength(4); // One in stats, one in filter button, two in alert badges

      // Check that the statistics cards are rendered
      const statsCards = document.querySelectorAll(
        '.bg-white.rounded-lg.shadow.p-4'
      );
      expect(statsCards.length).toBe(7); // Total, Critical, High, Medium, Low, Unacknowledged, Unresolved
    });
  });

  it('should handle fetch error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(<AdminAlertsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should filter alerts by severity', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          alerts: mockAlerts,
          stats: mockStats,
          pagination: { limit: 50, offset: 0, total: 2, hasMore: false },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          alerts: [mockAlerts[0]], // Only high severity
          stats: { ...mockStats, total: 1, high: 1, medium: 0 },
          pagination: { limit: 50, offset: 0, total: 1, hasMore: false },
        }),
      } as Response);

    render(<AdminAlertsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Daily Cost Exceeded')).toBeInTheDocument();
    });

    // Click High filter button (not the stats label)
    const highButtons = screen.getAllByText('High');
    const highFilterButton = highButtons.find(
      (button) => button.tagName === 'BUTTON'
    );
    fireEvent.click(highFilterButton!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('severity=high')
      );
    });
  });

  it('should acknowledge an alert', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          alerts: mockAlerts,
          stats: mockStats,
          pagination: { limit: 50, offset: 0, total: 2, hasMore: false },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          alert: { ...mockAlerts[0], acknowledged: true },
          message: 'Alert acknowledged successfully',
        }),
      } as Response);

    render(<AdminAlertsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Daily Cost Exceeded')).toBeInTheDocument();
    });

    // Click acknowledge button
    fireEvent.click(screen.getByText('Acknowledge'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId: 'alert-1',
          action: 'acknowledge',
          userId: 'admin',
        }),
      });
    });
  });

  it('should resolve an alert', async () => {
    // Clear any previous mocks
    (global.fetch as jest.Mock).mockClear();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          alerts: mockAlerts,
          stats: mockStats,
          pagination: { limit: 50, offset: 0, total: 2, hasMore: false },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          alert: { ...mockAlerts[0], resolved: true },
          message: 'Alert resolved successfully',
        }),
      } as Response);

    render(<AdminAlertsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Daily Cost Exceeded')).toBeInTheDocument();
    });

    // Click resolve button (first one)
    const resolveButtons = screen.getAllByText('Resolve');
    fireEvent.click(resolveButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId: 'alert-1',
          action: 'resolve',
          userId: 'admin',
        }),
      });
    });
  });

  it('should delete an alert', async () => {
    // Clear any previous mocks
    (global.fetch as jest.Mock).mockClear();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          alerts: mockAlerts,
          stats: mockStats,
          pagination: { limit: 50, offset: 0, total: 2, hasMore: false },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Alert deleted successfully',
        }),
      } as Response);

    // Mock confirm dialog
    window.confirm = jest.fn(() => true);

    render(<AdminAlertsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Daily Cost Exceeded')).toBeInTheDocument();
    });

    // Click delete button - use getAllByRole to get the first delete button
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/alerts?id=alert-1',
        {
          method: 'DELETE',
        }
      );
    });
  });

  it('should send test email', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          alerts: [],
          stats: {
            total: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            unacknowledged: 0,
            unresolved: 0,
          },
          pagination: { limit: 50, offset: 0, total: 0, hasMore: false },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Test email sent successfully',
        }),
      } as Response);

    render(<AdminAlertsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Email Test')).toBeInTheDocument();
    });

    // Update test email
    const emailInput = screen.getByDisplayValue('akpersad@gmail.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Send test email
    fireEvent.click(screen.getByText('Send Test Email'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/alerts/test-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipient: 'test@example.com' }),
        }
      );
    });
  });

  it('should validate email configuration', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          alerts: [],
          stats: {
            total: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            unacknowledged: 0,
            unresolved: 0,
          },
          pagination: { limit: 50, offset: 0, total: 0, hasMore: false },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          valid: true,
          message: 'Email configuration is valid',
        }),
      } as Response);

    render(<AdminAlertsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Email Test')).toBeInTheDocument();
    });

    // Validate email config
    fireEvent.click(screen.getByText('Validate Email Config'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/alerts/test-email');
    });
  });

  it.skip('should show alert details modal', async () => {
    // Clear any previous mocks
    (global.fetch as jest.Mock).mockClear();

    // Mock the initial fetch call for alerts
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        alerts: mockAlerts,
        stats: mockStats,
        pagination: { limit: 50, offset: 0, total: 2, hasMore: false },
      }),
    } as Response);

    render(<AdminAlertsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Daily Cost Exceeded')).toBeInTheDocument();
    });

    // Click on alert to open details - click on the first alert container
    const alertContainers = screen.getAllByText('Daily Cost Exceeded');
    // Find the parent container that has the onClick handler
    const clickableContainer = alertContainers[0].closest(
      'div[class*="cursor-pointer"]'
    );
    fireEvent.click(clickableContainer!);

    await waitFor(() => {
      expect(screen.getByText('Alert Details')).toBeInTheDocument();
      expect(screen.getAllByText('Daily Cost Exceeded')).toHaveLength(2); // One in list, one in modal
      expect(
        screen.getAllByText('Daily cost has exceeded the threshold')
      ).toHaveLength(2); // One in list, one in modal
    });
  });

  it.skip('should close alert details modal', async () => {
    // Clear any previous mocks
    (global.fetch as jest.Mock).mockClear();

    // Mock the initial fetch call for alerts
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        alerts: mockAlerts,
        stats: mockStats,
        pagination: { limit: 50, offset: 0, total: 2, hasMore: false },
      }),
    } as Response);

    render(<AdminAlertsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Daily Cost Exceeded')).toBeInTheDocument();
    });

    // Click on alert to open details - use the first occurrence (in the alert list)
    const alertTitles = screen.getAllByText('Daily Cost Exceeded');
    // Click on the alert container, not just the title
    const alertContainer = alertTitles[0].closest('.p-4');
    fireEvent.click(alertContainer!);

    await waitFor(() => {
      expect(screen.getByText('Alert Details')).toBeInTheDocument();
    });

    // Close modal - find the close button by its position in the modal header
    const modalHeader = screen.getByText('Alert Details').closest('div');
    const closeButton = modalHeader?.querySelector('button');
    if (closeButton) {
      fireEvent.click(closeButton);
    }

    await waitFor(() => {
      expect(screen.queryByText('Alert Details')).not.toBeInTheDocument();
    });
  });

  it.skip('should handle empty alerts list', async () => {
    // Clear any previous mocks
    (global.fetch as jest.Mock).mockClear();

    // Mock the initial fetch call for alerts
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        alerts: [],
        stats: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          unacknowledged: 0,
          unresolved: 0,
        },
        pagination: { limit: 50, offset: 0, total: 0, hasMore: false },
      }),
    } as Response);

    render(<AdminAlertsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No alerts')).toBeInTheDocument();
      expect(
        screen.getByText('No alerts have been generated yet.')
      ).toBeInTheDocument();
    });
  });

  it.skip('should handle test email error', async () => {
    // Clear any previous mocks
    (global.fetch as jest.Mock).mockClear();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          alerts: [],
          stats: {
            total: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            unacknowledged: 0,
            unresolved: 0,
          },
          pagination: { limit: 50, offset: 0, total: 0, hasMore: false },
        }),
      } as Response)
      .mockRejectedValueOnce(new Error('Email service error'));

    render(<AdminAlertsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Email Test')).toBeInTheDocument();
    });

    // Send test email
    fireEvent.click(screen.getByText('Send Test Email'));

    await waitFor(() => {
      expect(screen.getByText('Error sending test email')).toBeInTheDocument();
    });
  });
});
