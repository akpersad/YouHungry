import { render, screen, fireEvent } from '@testing-library/react';
import { Switch } from '../Switch';

describe('v2 Switch', () => {
  it('is a real switch: role, state, and label wiring', () => {
    render(
      <Switch
        label="Email results"
        description="One email per closed fork."
        checked
        onChange={() => {}}
      />
    );
    const control = screen.getByRole('switch', { name: 'Email results' });
    expect(control).toHaveAttribute('aria-checked', 'true');
    expect(control).toHaveAccessibleDescription('One email per closed fork.');
  });

  it('reports the flipped value on click', () => {
    const onChange = jest.fn();
    render(<Switch label="Push results" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('busy ignores input without dimming to disabled', () => {
    const onChange = jest.fn();
    render(<Switch label="Push results" checked busy onChange={onChange} />);
    const control = screen.getByRole('switch');
    expect(control).toHaveAttribute('aria-busy', 'true');
    expect(control).toBeEnabled();
    fireEvent.click(control);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disabled blocks interaction', () => {
    const onChange = jest.fn();
    render(
      <Switch
        label="Push results"
        checked={false}
        disabled
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
