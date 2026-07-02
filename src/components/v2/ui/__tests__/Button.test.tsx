import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('v2 Button', () => {
  it('renders an accessible button and fires clicks', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Fork it</Button>);
    const button = screen.getByRole('button', { name: 'Fork it' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('defaults type to button (never accidental submit)', () => {
    render(<Button>Fork it</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('loading disables the button, sets aria-busy, and keeps the label', () => {
    const onClick = jest.fn();
    render(
      <Button loading onClick={onClick}>
        Lock it in
      </Button>
    );
    const button = screen.getByRole('button', { name: 'Lock it in' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('disabled blocks interaction', () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Spin again
      </Button>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('primary carries the gold fill; destructive carries danger', () => {
    const { rerender } = render(<Button>Fork it</Button>);
    expect(screen.getByRole('button').className).toContain('bg-gold');
    rerender(<Button variant="destructive">Delete list</Button>);
    expect(screen.getByRole('button').className).toContain('bg-danger');
  });
});
