import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog } from '../Dialog';
import { Sheet } from '../Sheet';

// jsdom's <dialog> support varies by version; both components degrade to the
// `open` attribute when showModal is missing, so these assertions hold either way.

describe('v2 Dialog', () => {
  it('renders title + content when open, labelled for AT', () => {
    render(
      <Dialog open onClose={jest.fn()} title="Delete this list?">
        <p>Sushi Tour and its 12 places go away for good.</p>
      </Dialog>
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(screen.getByText('Delete this list?')).toBeInTheDocument();
    expect(
      screen.getByText('Sushi Tour and its 12 places go away for good.')
    ).toBeInTheDocument();
  });

  it('close control calls onClose', () => {
    const onClose = jest.fn();
    render(
      <Dialog open onClose={onClose} title="Delete this list?">
        <p>Body</p>
      </Dialog>
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Close', hidden: true })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays closed when open is false', () => {
    render(
      <Dialog open={false} onClose={jest.fn()} title="Hidden">
        <p>Body</p>
      </Dialog>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('v2 Sheet', () => {
  it('renders as a labelled dialog with its content', () => {
    render(
      <Sheet open onClose={jest.fn()} title="Pick a vibe">
        <p>Cheap eats</p>
      </Sheet>
    );
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute(
      'aria-labelledby'
    );
    expect(screen.getByText('Pick a vibe')).toBeInTheDocument();
    expect(screen.getByText('Cheap eats')).toBeInTheDocument();
  });

  it('close control calls onClose', () => {
    const onClose = jest.fn();
    render(
      <Sheet open onClose={onClose} title="Pick a vibe">
        <p>Body</p>
      </Sheet>
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Close', hidden: true })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
