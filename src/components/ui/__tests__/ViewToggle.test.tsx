import { render, screen, fireEvent } from '@testing-library/react';
import { ViewToggle } from '../ViewToggle';

describe('ViewToggle', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
  });

  it('renders list, map, and grid buttons', () => {
    render(<ViewToggle currentView="list" onToggle={mockOnToggle} />);

    expect(screen.getByLabelText('Switch to list view')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to map view')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to grid view')).toBeInTheDocument();
  });

  it('shows list button as active when currentView is list', () => {
    render(<ViewToggle currentView="list" onToggle={mockOnToggle} />);

    const listButton = screen.getByLabelText('Switch to list view');
    const gridButton = screen.getByLabelText('Switch to grid view');

    expect(listButton).toHaveClass('bg-accent');
    expect(gridButton).toHaveClass('text-secondary');
  });

  it('shows grid button as active when currentView is grid', () => {
    render(<ViewToggle currentView="grid" onToggle={mockOnToggle} />);

    const listButton = screen.getByLabelText('Switch to list view');
    const gridButton = screen.getByLabelText('Switch to grid view');

    expect(gridButton).toHaveClass('bg-accent');
    expect(listButton).toHaveClass('text-secondary');
  });

  it('calls onToggle with "list" when list button is clicked', () => {
    render(<ViewToggle currentView="grid" onToggle={mockOnToggle} />);

    const listButton = screen.getByLabelText('Switch to list view');
    fireEvent.click(listButton);

    expect(mockOnToggle).toHaveBeenCalledWith('list');
  });

  it('calls onToggle with "grid" when grid button is clicked', () => {
    render(<ViewToggle currentView="list" onToggle={mockOnToggle} />);

    const gridButton = screen.getByLabelText('Switch to grid view');
    fireEvent.click(gridButton);

    expect(mockOnToggle).toHaveBeenCalledWith('grid');
  });

  it('calls onToggle with "map" when map button is clicked', () => {
    render(<ViewToggle currentView="list" onToggle={mockOnToggle} />);

    const mapButton = screen.getByLabelText('Switch to map view');
    fireEvent.click(mapButton);

    expect(mockOnToggle).toHaveBeenCalledWith('map');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ViewToggle
        currentView="list"
        onToggle={mockOnToggle}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
