/**
 * AdminPanel Component Tests
 *
 * Tests the main admin panel component with tabbed interface
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminPanel } from '../AdminPanel';

// Mock the AdminNav component to avoid interference with other tests
jest.mock('../AdminNav', () => ({
  AdminNav: ({
    activeTab,
    onTabChange,
  }: {
    activeTab: string;
    onTabChange: (tab: string) => void;
  }) => (
    <div data-testid="admin-nav">
      <button
        onClick={() => onTabChange('performance')}
        data-active={activeTab === 'performance'}
      >
        Performance
      </button>
      <button
        onClick={() => onTabChange('analytics')}
        data-active={activeTab === 'analytics'}
      >
        Analytics
      </button>
      <button
        onClick={() => onTabChange('costs')}
        data-active={activeTab === 'costs'}
      >
        Cost Monitoring
      </button>
      <button
        onClick={() => onTabChange('users')}
        data-active={activeTab === 'users'}
      >
        Users
      </button>
      <button
        onClick={() => onTabChange('database')}
        data-active={activeTab === 'database'}
      >
        Database
      </button>
      <button
        onClick={() => onTabChange('settings')}
        data-active={activeTab === 'settings'}
      >
        Settings
      </button>
      <button
        onClick={() => onTabChange('alerts')}
        data-active={activeTab === 'alerts'}
      >
        Alerts
      </button>
    </div>
  ),
}));

// Mock the dashboard components to avoid API calls during tests
jest.mock('../UsageAnalyticsDashboard', () => ({
  UsageAnalyticsDashboard: () => <div>Usage Analytics</div>,
}));

jest.mock('../UserManagementDashboard', () => ({
  UserManagementDashboard: () => <div>User Management</div>,
}));

jest.mock('../DatabaseManagementDashboard', () => ({
  DatabaseManagementDashboard: () => <div>Database Management</div>,
}));

jest.mock('../CostMonitoringDashboard', () => ({
  CostMonitoringDashboard: () => (
    <div data-testid="cost-monitoring-dashboard">Cost Monitoring Dashboard</div>
  ),
}));

jest.mock('../PerformanceDashboard', () => ({
  PerformanceDashboard: () => (
    <div data-testid="performance-dashboard">Performance Dashboard</div>
  ),
}));

describe('AdminPanel', () => {
  it('should render admin panel with header', () => {
    render(<AdminPanel />);

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(
      screen.getByText('System administration and monitoring')
    ).toBeInTheDocument();
    expect(screen.getByText('You Hungry? Admin Dashboard')).toBeInTheDocument();
  });

  it('should render admin navigation', () => {
    render(<AdminPanel />);

    expect(screen.getByTestId('admin-nav')).toBeInTheDocument();
  });

  it('should default to performance tab', () => {
    render(<AdminPanel />);

    // Should show Performance Dashboard immediately (mocked)
    expect(screen.getByTestId('performance-dashboard')).toBeInTheDocument();
  });

  it('should switch to costs tab when clicked', () => {
    render(<AdminPanel />);

    const costsButton = screen.getByText('Cost Monitoring');
    fireEvent.click(costsButton);

    expect(screen.getByTestId('cost-monitoring-dashboard')).toBeInTheDocument();
  });

  it('should show user management dashboard for users tab', () => {
    render(<AdminPanel />);

    const usersButton = screen.getByText('Users');
    fireEvent.click(usersButton);

    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('should show database management dashboard for database tab', () => {
    render(<AdminPanel />);

    const databaseButton = screen.getByText('Database');
    fireEvent.click(databaseButton);

    expect(screen.getByText('Database Management')).toBeInTheDocument();
  });

  it('should show system settings dashboard for settings tab', async () => {
    // Mock fetch to return settings data
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        settings: {
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
              restrictions: [],
            },
            googleMaps: {
              enabled: true,
              dailyLimit: 1000,
              monthlyLimit: 10000,
              restrictions: [],
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
            sms: { enabled: false, recipients: [], frequency: 'immediate' },
            webhook: { enabled: false, url: '', secret: '' },
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
        },
        lastUpdated: new Date().toISOString(),
      }),
    });

    render(<AdminPanel />);

    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    // Wait for the SystemSettingsDashboard to load
    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });
  });

  it('should switch between tabs correctly', () => {
    render(<AdminPanel />);

    // Start with performance (Performance Dashboard)
    expect(screen.getByTestId('performance-dashboard')).toBeInTheDocument();

    // Switch to analytics
    fireEvent.click(screen.getByText('Analytics'));
    expect(screen.getByText('Usage Analytics')).toBeInTheDocument();

    // Switch to costs
    fireEvent.click(screen.getByText('Cost Monitoring'));
    expect(screen.getByTestId('cost-monitoring-dashboard')).toBeInTheDocument();

    // Switch to users
    fireEvent.click(screen.getByText('Users'));
    expect(screen.getByText('User Management')).toBeInTheDocument();

    // Switch to database
    fireEvent.click(screen.getByText('Database'));
    expect(screen.getByText('Database Management')).toBeInTheDocument();

    // Switch back to performance
    fireEvent.click(screen.getByText('Performance'));
    expect(screen.getByTestId('performance-dashboard')).toBeInTheDocument();
  });

  it('should have proper styling classes', () => {
    render(<AdminPanel />);

    const header = screen.getByText('Admin Panel');
    expect(header).toHaveClass('text-2xl', 'font-bold', 'text-gray-900');

    const description = screen.getByText(
      'System administration and monitoring'
    );
    expect(description).toHaveClass('text-sm', 'text-gray-600');
  });

  it('should render with proper layout structure', () => {
    render(<AdminPanel />);

    // Check main container exists
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();

    // Check header section exists
    expect(
      screen.getByText('System administration and monitoring')
    ).toBeInTheDocument();
  });
});
