import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders the title and description', () => {
    render(
      <EmptyState title="Your table is empty" description="Add a first spot" />
    );
    expect(screen.getByText('Your table is empty')).toBeInTheDocument();
    expect(screen.getByText('Add a first spot')).toBeInTheDocument();
  });

  it('renders the title in the display heading', () => {
    render(<EmptyState title="Nothing here yet" />);
    expect(
      screen.getByRole('heading', { name: 'Nothing here yet' })
    ).toBeInTheDocument();
  });

  it('renders an action button from an action spec and fires onClick', () => {
    const onClick = jest.fn();
    render(
      <EmptyState
        title="No collections"
        action={{ label: 'Create Collection', onClick }}
      />
    );
    const button = screen.getByRole('button', { name: 'Create Collection' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a custom action node when provided', () => {
    render(
      <EmptyState
        title="No results"
        action={<a href="/search">Custom link</a>}
      />
    );
    expect(
      screen.getByRole('link', { name: 'Custom link' })
    ).toBeInTheDocument();
  });

  it('renders an icon when provided', () => {
    render(
      <EmptyState title="Empty" icon={<svg data-testid="empty-icon" />} />
    );
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('omits description and action when not provided', () => {
    render(<EmptyState title="Just a title" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
