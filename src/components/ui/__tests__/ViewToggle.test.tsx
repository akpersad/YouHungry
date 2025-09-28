import { render, screen, fireEvent } from '@testing-library/react';
import { ViewToggle } from '../ViewToggle';

describe('ViewToggle', () => {
  const mockOnViewChange = jest.fn();

  beforeEach(() => {
    mockOnViewChange.mockClear();
  });

  it('renders both list and grid buttons', () => {
    render(<ViewToggle currentView="list" onViewChange={mockOnViewChange} />);

    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText('Grid')).toBeInTheDocument();
  });

  it('shows list button as active when currentView is list', () => {
    render(<ViewToggle currentView="list" onViewChange={mockOnViewChange} />);

    const listButton = screen.getByText('List').closest('button');
    const gridButton = screen.getByText('Grid').closest('button');

    expect(listButton).toHaveClass('btn-primary');
    expect(gridButton).toHaveClass('btn-outline');
  });

  it('shows grid button as active when currentView is grid', () => {
    render(<ViewToggle currentView="grid" onViewChange={mockOnViewChange} />);

    const listButton = screen.getByText('List').closest('button');
    const gridButton = screen.getByText('Grid').closest('button');

    expect(gridButton).toHaveClass('btn-primary');
    expect(listButton).toHaveClass('btn-outline');
  });

  it('calls onViewChange with "list" when list button is clicked', () => {
    render(<ViewToggle currentView="grid" onViewChange={mockOnViewChange} />);

    const listButton = screen.getByText('List');
    fireEvent.click(listButton);

    expect(mockOnViewChange).toHaveBeenCalledWith('list');
  });

  it('calls onViewChange with "grid" when grid button is clicked', () => {
    render(<ViewToggle currentView="list" onViewChange={mockOnViewChange} />);

    const gridButton = screen.getByText('Grid');
    fireEvent.click(gridButton);

    expect(mockOnViewChange).toHaveBeenCalledWith('grid');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ViewToggle
        currentView="list"
        onViewChange={mockOnViewChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
