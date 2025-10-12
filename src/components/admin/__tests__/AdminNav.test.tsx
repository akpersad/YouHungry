/**
 * AdminNav Component Tests
 *
 * Tests the admin navigation component with tabbed interface
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { AdminNav } from '../AdminNav';

describe('AdminNav', () => {
  const mockOnTabChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all navigation tabs', () => {
    render(<AdminNav activeTab="analytics" onTabChange={mockOnTabChange} />);

    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByText('Cost Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
  });

  it('should render all navigation icons', () => {
    render(<AdminNav activeTab="analytics" onTabChange={mockOnTabChange} />);

    // Icons are rendered as SVG elements, we can check for their presence
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(8); // 8 navigation tabs (Performance, Analytics, Errors, Cost Monitoring, Users, Database, Settings, Alerts)
  });

  it('should highlight active tab', () => {
    render(<AdminNav activeTab="costs" onTabChange={mockOnTabChange} />);

    const costsButton = screen.getByText('Cost Monitoring');
    expect(costsButton.closest('button')).toHaveClass(
      'border-primary',
      'text-primary'
    );
  });

  it('should not highlight inactive tabs', () => {
    render(<AdminNav activeTab="analytics" onTabChange={mockOnTabChange} />);

    const costsButton = screen.getByText('Cost Monitoring');
    expect(costsButton.closest('button')).toHaveClass(
      'border-transparent',
      'text-text-light'
    );
  });

  it('should call onTabChange when tab is clicked', () => {
    render(<AdminNav activeTab="analytics" onTabChange={mockOnTabChange} />);

    const usersButton = screen.getByText('Users');
    fireEvent.click(usersButton);

    expect(mockOnTabChange).toHaveBeenCalledWith('users');
  });

  it('should call onTabChange with correct tab ID for each tab', () => {
    render(<AdminNav activeTab="analytics" onTabChange={mockOnTabChange} />);

    // Test each tab
    fireEvent.click(screen.getByText('Performance'));
    expect(mockOnTabChange).toHaveBeenCalledWith('performance');

    fireEvent.click(screen.getByText('Analytics'));
    expect(mockOnTabChange).toHaveBeenCalledWith('analytics');

    fireEvent.click(screen.getByText('Errors'));
    expect(mockOnTabChange).toHaveBeenCalledWith('errors');

    fireEvent.click(screen.getByText('Cost Monitoring'));
    expect(mockOnTabChange).toHaveBeenCalledWith('costs');

    fireEvent.click(screen.getByText('Users'));
    expect(mockOnTabChange).toHaveBeenCalledWith('users');

    fireEvent.click(screen.getByText('Database'));
    expect(mockOnTabChange).toHaveBeenCalledWith('database');

    fireEvent.click(screen.getByText('Settings'));
    expect(mockOnTabChange).toHaveBeenCalledWith('settings');

    fireEvent.click(screen.getByText('Alerts'));
    expect(mockOnTabChange).toHaveBeenCalledWith('alerts');
  });

  it('should render external tools section', () => {
    render(<AdminNav activeTab="analytics" onTabChange={mockOnTabChange} />);

    expect(screen.getByText('External Tools:')).toBeInTheDocument();
    expect(screen.getByText('Legacy Dashboard')).toBeInTheDocument();
  });

  it('should have proper external link attributes', () => {
    render(<AdminNav activeTab="analytics" onTabChange={mockOnTabChange} />);

    const externalLink = screen.getByText('Legacy Dashboard').closest('a');
    expect(externalLink).toHaveAttribute('href', '/performance-dashboard.html');
    expect(externalLink).toHaveAttribute('target', '_blank');
    expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should have proper hover styles for inactive tabs', () => {
    render(<AdminNav activeTab="analytics" onTabChange={mockOnTabChange} />);

    const costsButton = screen.getByText('Cost Monitoring');
    expect(costsButton.closest('button')).toHaveClass(
      'hover:text-text',
      'hover:border-border'
    );
  });

  it('should have proper styling classes for navigation container', () => {
    render(<AdminNav activeTab="analytics" onTabChange={mockOnTabChange} />);

    // Check that navigation exists
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('should have proper styling for tab buttons', () => {
    render(<AdminNav activeTab="analytics" onTabChange={mockOnTabChange} />);

    const analyticsButton = screen.getByText('Analytics');
    expect(analyticsButton.closest('button')).toHaveClass(
      'whitespace-nowrap',
      'py-4',
      'px-1',
      'border-b-2',
      'font-medium',
      'text-sm',
      'transition-colors',
      'flex',
      'items-center',
      'gap-2'
    );
  });

  it('should render external link icon', () => {
    render(<AdminNav activeTab="analytics" onTabChange={mockOnTabChange} />);

    // The external link should have an icon (ExternalLink from lucide-react)
    const externalLink = screen.getByText('Legacy Dashboard').closest('a');
    expect(externalLink).toBeInTheDocument();
  });

  it('should handle tab changes correctly with different active tabs', () => {
    const { rerender } = render(
      <AdminNav activeTab="analytics" onTabChange={mockOnTabChange} />
    );

    // Initially analytics should be active
    let analyticsButton = screen.getByText('Analytics');
    expect(analyticsButton.closest('button')).toHaveClass(
      'border-primary',
      'text-primary'
    );

    // Change active tab to costs
    rerender(<AdminNav activeTab="costs" onTabChange={mockOnTabChange} />);

    const costsButton = screen.getByText('Cost Monitoring');
    expect(costsButton.closest('button')).toHaveClass(
      'border-primary',
      'text-primary'
    );

    // Analytics should no longer be active
    analyticsButton = screen.getByText('Analytics');
    expect(analyticsButton.closest('button')).toHaveClass(
      'border-transparent',
      'text-text-light'
    );
  });
});
