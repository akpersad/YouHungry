/**
 * Accessibility tests for Input and Switch components
 * Tests ARIA attributes, keyboard navigation, and screen reader support
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';
import { Switch } from '../Switch';

describe('Input Accessibility', () => {
  describe('ARIA Attributes', () => {
    it('should have aria-required when required', () => {
      render(<Input label="Name" required />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toBeRequired();
    });

    it('should have aria-invalid when error exists', () => {
      render(<Input label="Email" error="Invalid email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not have aria-invalid when no error', () => {
      render(<Input label="Email" />);
      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('aria-invalid', 'true');
    });

    it('should link error message with aria-describedby', () => {
      render(<Input label="Email" error="Invalid email format" />);
      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');

      expect(errorId).toBeTruthy();
      const errorElement = document.getElementById(errorId!);
      expect(errorElement).toHaveTextContent('Invalid email format');
    });

    it('should link helper text with aria-describedby', () => {
      render(<Input label="Username" helperText="Must be unique" />);
      const input = screen.getByRole('textbox');
      const helperId = input.getAttribute('aria-describedby');

      expect(helperId).toBeTruthy();
      const helperElement = document.getElementById(helperId!);
      expect(helperElement).toHaveTextContent('Must be unique');
    });

    it('should prioritize error over helper text', () => {
      render(
        <Input
          label="Email"
          error="Invalid"
          helperText="Should not be linked"
        />
      );
      const input = screen.getByRole('textbox');
      const describedById = input.getAttribute('aria-describedby');

      const describedByElement = document.getElementById(describedById!);
      expect(describedByElement).toHaveTextContent('Invalid');
      expect(describedByElement).not.toHaveTextContent('Should not be linked');
    });
  });

  describe('Label Association', () => {
    it('should associate label with input', () => {
      render(<Input label="Full Name" />);
      const input = screen.getByLabelText('Full Name');
      expect(input).toBeInTheDocument();
    });

    it('should show required indicator in label', () => {
      render(<Input label="Email" required />);
      const requiredIndicator = screen.getByLabelText('required');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveTextContent('*');
    });

    it('should use provided id or generate unique one', () => {
      render(<Input label="Test" id="custom-id" />);
      const input = screen.getByLabelText('Test');
      expect(input).toHaveAttribute('id', 'custom-id');
    });

    it('should generate unique id when not provided', () => {
      render(
        <>
          <Input label="First" />
          <Input label="Second" />
        </>
      );

      const first = screen.getByLabelText('First');
      const second = screen.getByLabelText('Second');

      expect(first.id).toBeTruthy();
      expect(second.id).toBeTruthy();
      expect(first.id).not.toBe(second.id);
    });
  });

  describe('Error Announcements', () => {
    it('should have role="alert" for error messages', () => {
      render(<Input label="Email" error="Invalid email" />);
      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent('Invalid email');
    });

    it('should have aria-live="polite" for error announcements', () => {
      render(<Input label="Email" error="Invalid email" />);
      const error = screen.getByRole('alert');
      expect(error).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce error changes to screen readers', () => {
      const { rerender } = render(<Input label="Email" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      rerender(<Input label="Email" error="Invalid format" />);
      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent('Invalid format');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable', () => {
      render(<Input label="Name" />);
      const input = screen.getByRole('textbox');
      input.focus();
      expect(input).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Input label="Name" disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should accept text input', async () => {
      render(<Input label="Name" />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'John Doe');
      expect(input).toHaveValue('John Doe');
    });
  });

  describe('Disabled State', () => {
    it('should have disabled styling', () => {
      const { container } = render(<Input label="Name" disabled />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('input-disabled');
    });

    it('should be announced as disabled', () => {
      render(<Input label="Name" disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });
});

describe('Switch Accessibility', () => {
  describe('ARIA Attributes', () => {
    it('should have role="switch"', () => {
      render(<Switch label="Enable notifications" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });

    it('should have aria-checked based on checked state', () => {
      const { rerender } = render(<Switch label="Dark mode" checked={false} />);
      let switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');

      rerender(<Switch label="Dark mode" checked={true} />);
      switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should use label for aria-label', () => {
      render(<Switch label="Enable feature" />);
      const switchElement = screen.getByLabelText('Enable feature');
      expect(switchElement).toBeInTheDocument();
    });

    it('should use srLabel when provided', () => {
      render(<Switch label="Visual" srLabel="Screen reader label" />);
      const switchElement = screen.getByLabelText('Screen reader label');
      expect(switchElement).toBeInTheDocument();
    });

    it('should hide visual switch from screen readers', () => {
      const { container } = render(<Switch label="Toggle" />);
      const visualSwitch = container.querySelector('[aria-hidden="true"]');
      expect(visualSwitch).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should toggle on Space key', async () => {
      const handleChange = jest.fn();
      render(<Switch label="Toggle" onCheckedChange={handleChange} />);

      const switchElement = screen.getByRole('switch');
      switchElement.focus();

      await userEvent.keyboard(' ');
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should toggle on Enter key', async () => {
      const handleChange = jest.fn();
      render(<Switch label="Toggle" onCheckedChange={handleChange} />);

      const switchElement = screen.getByRole('switch');
      switchElement.focus();

      await userEvent.keyboard('{Enter}');
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should not toggle when disabled', async () => {
      const handleChange = jest.fn();
      render(<Switch label="Toggle" disabled onCheckedChange={handleChange} />);

      const switchElement = screen.getByRole('switch');
      await userEvent.click(switchElement);
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should be focusable', () => {
      render(<Switch label="Toggle" />);
      const switchElement = screen.getByRole('switch');
      switchElement.focus();
      expect(switchElement).toHaveFocus();
    });
  });

  describe('Label Association', () => {
    it('should associate label with switch', () => {
      render(<Switch label="Dark mode" />);
      const labelElement = screen.getByText('Dark mode');
      expect(labelElement).toBeInTheDocument();
    });

    it('should work without visual label', () => {
      render(<Switch srLabel="Accessible name" />);
      const switchElement = screen.getByLabelText('Accessible name');
      expect(switchElement).toBeInTheDocument();
    });

    it('should generate unique id', () => {
      render(
        <>
          <Switch label="First" />
          <Switch label="Second" />
        </>
      );

      const first = screen.getByLabelText('First');
      const second = screen.getByLabelText('Second');

      expect(first.id).toBeTruthy();
      expect(second.id).toBeTruthy();
      expect(first.id).not.toBe(second.id);
    });
  });

  describe('Click Interaction', () => {
    it('should toggle on click', async () => {
      const handleChange = jest.fn();
      render(<Switch label="Toggle" onCheckedChange={handleChange} />);

      const switchElement = screen.getByRole('switch');
      await userEvent.click(switchElement);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should update checked state', async () => {
      const TestSwitch = () => {
        const [checked, setChecked] = React.useState(false);
        return (
          <Switch
            label="Toggle"
            checked={checked}
            onCheckedChange={setChecked}
          />
        );
      };

      render(<TestSwitch />);
      const switchElement = screen.getByRole('switch');

      expect(switchElement).toHaveAttribute('aria-checked', 'false');

      await userEvent.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled styling', () => {
      const { container } = render(<Switch label="Toggle" disabled />);
      const visualSwitch = container.querySelector('.opacity-50');
      expect(visualSwitch).toBeInTheDocument();
    });

    it('should not be interactive when disabled', async () => {
      const handleChange = jest.fn();
      render(<Switch label="Toggle" disabled onCheckedChange={handleChange} />);

      const switchElement = screen.getByRole('switch');
      await userEvent.click(switchElement);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Visual Feedback', () => {
    it('should show focus ring on focus', () => {
      const { container } = render(<Switch label="Toggle" />);
      const switchElement = screen.getByRole('switch');
      switchElement.focus();

      const visualSwitch = container.querySelector('.peer-focus\\:ring-2');
      expect(visualSwitch).toBeInTheDocument();
    });

    it('should show checked state visually', () => {
      const { container } = render(<Switch label="Toggle" checked={true} />);
      const visualSwitch = container.querySelector('[aria-hidden="true"]');
      expect(visualSwitch).toHaveStyle({
        backgroundColor: 'var(--accent-primary)',
      });
    });
  });
});
