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

jest.mock('../PerformanceDashboard', () => ({
  PerformanceDashboard: () => (
    <div data-testid="performance-dashboard">Performance Dashboard</div>
  ),
}));

jest.mock('../CostMonitoringDashboard', () => ({
  CostMonitoringDashboard: () => (
    <div data-testid="cost-monitoring-dashboard">Cost Monitoring Dashboard</div>
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

    expect(screen.getByTestId('performance-dashboard')).toBeInTheDocument();
    expect(
      screen.queryByTestId('cost-monitoring-dashboard')
    ).not.toBeInTheDocument();
  });

  it('should switch to costs tab when clicked', () => {
    render(<AdminPanel />);

    const costsButton = screen.getByText('Costs');
    fireEvent.click(costsButton);

    expect(screen.getByTestId('cost-monitoring-dashboard')).toBeInTheDocument();
    expect(
      screen.queryByTestId('performance-dashboard')
    ).not.toBeInTheDocument();
  });

  it('should show coming soon message for users tab', () => {
    render(<AdminPanel />);

    const usersButton = screen.getByText('Users');
    fireEvent.click(usersButton);

    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Coming Soon:')).toBeInTheDocument();
    expect(
      screen.getByText(
        'User management features will be implemented in a future update.'
      )
    ).toBeInTheDocument();
  });

  it('should show coming soon message for database tab', () => {
    render(<AdminPanel />);

    const databaseButton = screen.getByText('Database');
    fireEvent.click(databaseButton);

    expect(screen.getByText('Database Management')).toBeInTheDocument();
    expect(screen.getByText('Coming Soon:')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Database management features will be implemented in a future update.'
      )
    ).toBeInTheDocument();
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

    // Start with analytics
    expect(screen.getByTestId('performance-dashboard')).toBeInTheDocument();

    // Switch to costs
    fireEvent.click(screen.getByText('Costs'));
    expect(screen.getByTestId('cost-monitoring-dashboard')).toBeInTheDocument();

    // Switch to users
    fireEvent.click(screen.getByText('Users'));
    expect(screen.getByText('User Management')).toBeInTheDocument();

    // Switch back to analytics
    fireEvent.click(screen.getByText('Analytics'));
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
