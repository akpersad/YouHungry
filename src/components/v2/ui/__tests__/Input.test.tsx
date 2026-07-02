import { render, screen } from '@testing-library/react';
import { Input } from '../Input';

describe('v2 Input', () => {
  it('associates the visible label with the field', () => {
    render(<Input label="Email" type="email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows a required marker without polluting the accessible name', () => {
    render(<Input label="Email" required />);
    // Accessible-name computation must exclude the aria-hidden marker.
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toBeRequired();
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('error sets aria-invalid and wires the message via aria-describedby', () => {
    render(
      <Input
        label="Email"
        error="Email needs an @ symbol. Try name@example.com"
      />
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      'Email needs an @ symbol. Try name@example.com'
    );
  });

  it('success and help are described but never marked invalid', () => {
    const { rerender } = render(<Input label="Code" success="Code accepted" />);
    let input = screen.getByLabelText('Code');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).toHaveAccessibleDescription('Code accepted');

    rerender(<Input label="Code" help="Find it in your fork link" />);
    input = screen.getByLabelText('Code');
    expect(input).toHaveAccessibleDescription('Find it in your fork link');
  });

  it('error takes precedence over help', () => {
    render(<Input label="Code" help="Six characters" error="Code not found" />);
    expect(screen.getByLabelText('Code')).toHaveAccessibleDescription(
      'Code not found'
    );
    expect(screen.queryByText('Six characters')).not.toBeInTheDocument();
  });
});
