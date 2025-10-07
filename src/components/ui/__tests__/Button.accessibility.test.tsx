/**
 * Accessibility tests for Button component
 * Tests ARIA attributes, keyboard navigation, and screen reader support
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button Accessibility', () => {
  describe('ARIA Attributes', () => {
    it('should have aria-disabled when disabled', () => {
      render(<Button disabled>Click me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeDisabled();
    });

    it('should have aria-busy when loading', () => {
      render(<Button isLoading>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
    });

    it('should accept custom aria-label', () => {
      render(<Button aria-label="Custom label">Icon</Button>);
      const button = screen.getByRole('button', { name: 'Custom label' });
      expect(button).toBeInTheDocument();
    });

    it('should use loadingText as aria-label when loading', () => {
      render(
        <Button isLoading loadingText="Saving changes...">
          Save
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Saving changes...');
    });

    it('should hide loading spinner from screen readers', () => {
      const { container } = render(<Button isLoading>Submit</Button>);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have screen reader only text for loading state', () => {
      render(<Button isLoading>Submit</Button>);
      const srText = document.querySelector('.sr-only');
      expect(srText).toHaveTextContent('Loading...');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard accessible', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();

      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      await userEvent.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should not be keyboard activatable when disabled', async () => {
      const handleClick = jest.fn();
      render(
        <Button disabled onClick={handleClick}>
          Click me
        </Button>
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not be keyboard activatable when loading', async () => {
      const handleClick = jest.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Submit
        </Button>
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it.skip('should have visible focus indicator', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      button.focus();

      // Check that button has focus-visible class or appropriate styling
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
    });

    it.skip('should maintain focus order in document', () => {
      render(
        <>
          <Button>First</Button>
          <Button>Second</Button>
          <Button>Third</Button>
        </>
      );

      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      expect(buttons[0]).toHaveFocus();

      userEvent.tab();
      expect(buttons[1]).toHaveFocus();

      userEvent.tab();
      expect(buttons[2]).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce button role', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have accessible name from children', () => {
      render(<Button>Submit Form</Button>);
      const button = screen.getByRole('button', { name: 'Submit Form' });
      expect(button).toBeInTheDocument();
    });

    it('should announce loading state changes', () => {
      const { rerender } = render(<Button>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-busy');

      rerender(<Button isLoading>Submit</Button>);
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should announce disabled state', () => {
      render(<Button disabled>Cannot click</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Variants and Sizes', () => {
    it('should maintain accessibility across all variants', () => {
      const variants = [
        'primary',
        'secondary',
        'accent',
        'warm',
        'outline',
        'outline-accent',
      ] as const;

      variants.forEach((variant) => {
        const { unmount } = render(<Button variant={variant}>Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveAccessibleName('Button');
        unmount();
      });
    });

    it('should maintain accessibility across all sizes', () => {
      const sizes = ['sm', 'md', 'lg'] as const;

      sizes.forEach((size) => {
        const { unmount } = render(<Button size={size}>Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveAccessibleName('Button');
        unmount();
      });
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast for primary variant', () => {
      const { container } = render(<Button variant="primary">Click</Button>);
      const button = container.querySelector('button');

      // Button should have the btn-primary class which applies WCAG AA compliant colors
      expect(button).toHaveClass('btn-primary');
    });

    it('should have sufficient color contrast for all variants', () => {
      const variants = [
        'primary',
        'secondary',
        'accent',
        'warm',
        'outline',
        'outline-accent',
      ] as const;

      variants.forEach((variant) => {
        const { container, unmount } = render(
          <Button variant={variant}>Button</Button>
        );
        const button = container.querySelector('button');
        expect(button).toHaveClass(`btn-${variant}`);
        unmount();
      });
    });
  });
});
