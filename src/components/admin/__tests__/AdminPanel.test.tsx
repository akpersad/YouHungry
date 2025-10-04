/**
 * AdminPanel Component Tests
 *
 * Tests the main admin panel component with tabbed interface
 */

import { render, screen, fireEvent } from '@testing-library/react';
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
        onClick={() => onTabChange('analytics')}
        data-active={activeTab === 'analytics'}
      >
        Analytics
      </button>
      <button
        onClick={() => onTabChange('costs')}
        data-active={activeTab === 'costs'}
      >
        Costs
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
  CostMonitoringDashboard: () => <div>Cost Monitoring</div>,
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

  it('should default to analytics tab', () => {
    render(<AdminPanel />);

    // Should show Usage Analytics Dashboard immediately (mocked)
    expect(screen.getByText('Usage Analytics')).toBeInTheDocument();
  });

  it('should switch to costs tab when clicked', () => {
    render(<AdminPanel />);

    const costsButton = screen.getByText('Costs');
    fireEvent.click(costsButton);

    expect(screen.getByText('Cost Monitoring')).toBeInTheDocument();
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

  it('should show coming soon message for settings tab', () => {
    render(<AdminPanel />);

    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    expect(screen.getByText('System Settings')).toBeInTheDocument();
    expect(screen.getByText('Coming Soon:')).toBeInTheDocument();
    expect(
      screen.getByText(
        'System settings will be implemented in a future update.'
      )
    ).toBeInTheDocument();
  });

  it('should switch between tabs correctly', () => {
    render(<AdminPanel />);

    // Start with analytics (Usage Analytics Dashboard)
    expect(screen.getByText('Usage Analytics')).toBeInTheDocument();

    // Switch to costs
    fireEvent.click(screen.getByText('Costs'));
    expect(screen.getByText('Cost Monitoring')).toBeInTheDocument();

    // Switch to users
    fireEvent.click(screen.getByText('Users'));
    expect(screen.getByText('User Management')).toBeInTheDocument();

    // Switch to database
    fireEvent.click(screen.getByText('Database'));
    expect(screen.getByText('Database Management')).toBeInTheDocument();

    // Switch back to analytics
    fireEvent.click(screen.getByText('Analytics'));
    expect(screen.getByText('Usage Analytics')).toBeInTheDocument();
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
