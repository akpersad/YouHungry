import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, TabItem } from '../Tabs';

describe('Tabs Component', () => {
  const mockTabs: TabItem[] = [
    {
      id: 'tab1',
      label: 'Tab 1',
      content: <div>Content 1</div>,
    },
    {
      id: 'tab2',
      label: 'Tab 2',
      content: <div>Content 2</div>,
      badge: 5,
    },
    {
      id: 'tab3',
      label: 'Tab 3',
      content: <div>Content 3</div>,
      badge: 'New',
    },
  ];

  it('renders all tab headers', () => {
    const mockOnTabChange = jest.fn();
    render(
      <Tabs tabs={mockTabs} activeTab="tab1" onTabChange={mockOnTabChange} />
    );

    expect(screen.getByRole('tab', { name: /tab 1/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tab 2/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tab 3/i })).toBeInTheDocument();
  });

  it('displays badges when provided', () => {
    const mockOnTabChange = jest.fn();
    render(
      <Tabs tabs={mockTabs} activeTab="tab1" onTabChange={mockOnTabChange} />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('shows the content of the active tab', () => {
    const mockOnTabChange = jest.fn();
    render(
      <Tabs tabs={mockTabs} activeTab="tab1" onTabChange={mockOnTabChange} />
    );

    expect(screen.getByText('Content 1')).toBeVisible();
    expect(screen.queryByText('Content 2')).not.toBeVisible();
    expect(screen.queryByText('Content 3')).not.toBeVisible();
  });

  it('marks the active tab with aria-selected', () => {
    const mockOnTabChange = jest.fn();
    render(
      <Tabs tabs={mockTabs} activeTab="tab2" onTabChange={mockOnTabChange} />
    );

    const tab1 = screen.getByRole('tab', { name: /tab 1/i });
    const tab2 = screen.getByRole('tab', { name: /tab 2/i });
    const tab3 = screen.getByRole('tab', { name: /tab 3/i });

    expect(tab1).toHaveAttribute('aria-selected', 'false');
    expect(tab2).toHaveAttribute('aria-selected', 'true');
    expect(tab3).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onTabChange when a tab is clicked', () => {
    const mockOnTabChange = jest.fn();
    render(
      <Tabs tabs={mockTabs} activeTab="tab1" onTabChange={mockOnTabChange} />
    );

    const tab2 = screen.getByRole('tab', { name: /tab 2/i });
    fireEvent.click(tab2);

    expect(mockOnTabChange).toHaveBeenCalledWith('tab2');
  });

  it('switches content when tab changes', () => {
    const mockOnTabChange = jest.fn();
    const { rerender } = render(
      <Tabs tabs={mockTabs} activeTab="tab1" onTabChange={mockOnTabChange} />
    );

    expect(screen.getByText('Content 1')).toBeVisible();

    // Simulate tab change
    rerender(
      <Tabs tabs={mockTabs} activeTab="tab2" onTabChange={mockOnTabChange} />
    );

    expect(screen.queryByText('Content 1')).not.toBeVisible();
    expect(screen.getByText('Content 2')).toBeVisible();
  });

  it('applies custom className', () => {
    const mockOnTabChange = jest.fn();
    const { container } = render(
      <Tabs
        tabs={mockTabs}
        activeTab="tab1"
        onTabChange={mockOnTabChange}
        className="custom-class"
      />
    );

    const tabsContainer = container.firstChild;
    expect(tabsContainer).toHaveClass('custom-class');
  });

  it('handles single tab', () => {
    const singleTab: TabItem[] = [
      {
        id: 'only',
        label: 'Only Tab',
        content: <div>Only Content</div>,
      },
    ];

    const mockOnTabChange = jest.fn();
    render(
      <Tabs tabs={singleTab} activeTab="only" onTabChange={mockOnTabChange} />
    );

    expect(screen.getByRole('tab', { name: /only tab/i })).toBeInTheDocument();
    expect(screen.getByText('Only Content')).toBeVisible();
  });

  it('handles tabs with no badges', () => {
    const noBadgeTabs: TabItem[] = [
      {
        id: 'tab1',
        label: 'Tab 1',
        content: <div>Content 1</div>,
      },
      {
        id: 'tab2',
        label: 'Tab 2',
        content: <div>Content 2</div>,
      },
    ];

    const mockOnTabChange = jest.fn();
    render(
      <Tabs tabs={noBadgeTabs} activeTab="tab1" onTabChange={mockOnTabChange} />
    );

    // Tabs without badges should just show the label
    expect(screen.getByRole('tab', { name: /tab 1/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tab 2/i })).toBeInTheDocument();
    // No badge elements should be present
    expect(screen.queryByText('5')).not.toBeInTheDocument();
    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });

  it('renders tabpanel with correct role', () => {
    const mockOnTabChange = jest.fn();
    render(
      <Tabs tabs={mockTabs} activeTab="tab1" onTabChange={mockOnTabChange} />
    );

    const panels = screen.getAllByRole('tabpanel', { hidden: true });
    expect(panels).toHaveLength(3);
  });
});
