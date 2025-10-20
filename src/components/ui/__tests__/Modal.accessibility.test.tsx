/**
 * Accessibility tests for Modal component
 * Tests ARIA attributes, focus management, and keyboard navigation
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal Accessibility', () => {
  beforeEach(() => {
    // Clean up any leftover modals
    document.body.innerHTML = '';
  });

  describe('ARIA Attributes', () => {
    it('should have aria-modal="true" when open', () => {
      render(
        <Modal isOpen onClose={jest.fn()} title="Test Modal">
          Content
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      render(
        <Modal isOpen onClose={jest.fn()} title="Test Title">
          Content
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      const title = screen.getByText('Test Title');

      expect(modal).toHaveAttribute('aria-labelledby', title.id);
    });

    it('should have aria-describedby when description provided', () => {
      render(
        <Modal
          isOpen
          onClose={jest.fn()}
          title="Test Modal"
          description="Test description"
        >
          Content
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-describedby');
    });

    it('should not have aria-labelledby when no title provided', () => {
      render(
        <Modal isOpen onClose={jest.fn()}>
          Content
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).not.toHaveAttribute('aria-labelledby');
    });

    it('should mark backdrop as presentation role', () => {
      const { container } = render(
        <Modal isOpen onClose={jest.fn()}>
          Content
        </Modal>
      );

      const backdrop = container.querySelector('.modal-overlay');
      expect(backdrop).toHaveAttribute('role', 'presentation');
    });
  });

  describe('Focus Management', () => {
    it('should focus modal container when opened', async () => {
      render(
        <Modal isOpen onClose={jest.fn()} title="Test Modal">
          <button>Inside button</button>
        </Modal>
      );

      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toHaveFocus();
      });
    });

    it.skip('should trap focus within modal', async () => {
      // SKIP REASON: JSDOM doesn't support focus trapping behavior
      // COVERED BY: e2e/accessibility.spec.ts - Modal focus management tests
      // NOTE: This is tested manually and in E2E tests. JSDOM limitations prevent
      // proper focus trap simulation in unit tests.
      render(
        <Modal isOpen onClose={jest.fn()} title="Test Modal">
          <button>First</button>
          <button>Second</button>
          <button>Last</button>
        </Modal>
      );

      const buttons = screen.getAllByRole('button');
      const closeButton = buttons[0]; // Close button
      const firstButton = buttons[1];
      const lastButton = buttons[buttons.length - 1];

      // Tab through buttons
      closeButton.focus();
      expect(closeButton).toHaveFocus();

      await userEvent.tab();
      expect(firstButton).toHaveFocus();

      // Tab through all buttons to last
      await userEvent.tab();
      await userEvent.tab();
      expect(lastButton).toHaveFocus();

      // Tab should cycle back to close button
      await userEvent.tab();
      expect(closeButton).toHaveFocus();
    });

    it('should restore focus to trigger element on close', async () => {
      const TriggerButton = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        return (
          <>
            <button onClick={() => setIsOpen(true)}>Open Modal</button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
              Content
            </Modal>
          </>
        );
      };

      render(<TriggerButton />);
      const trigger = screen.getByText('Open Modal');

      await userEvent.click(trigger);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await userEvent.keyboard('{Escape}');
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it.skip('should prevent focus from leaving modal', async () => {
      // SKIP REASON: JSDOM doesn't support focus containment testing
      // COVERED BY: e2e/accessibility.spec.ts - Modal focus containment tests
      // NOTE: Focus management in modals requires real browser environment
      render(
        <>
          <button>Outside Before</button>
          <Modal isOpen onClose={jest.fn()} title="Test">
            <button>Inside</button>
          </Modal>
          <button>Outside After</button>
        </>
      );

      const modal = screen.getByRole('dialog');
      const insideButton = screen.getByText('Inside');

      await waitFor(() => {
        expect(modal).toHaveFocus();
      });

      // Try to tab to outside elements - should stay within modal
      await userEvent.tab();
      expect(insideButton).toHaveFocus();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close on Escape key', async () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen onClose={handleClose} title="Test Modal">
          Content
        </Modal>
      );

      await userEvent.keyboard('{Escape}');
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should close when clicking close button', async () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen onClose={handleClose} title="Test Modal">
          Content
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close dialog');
      await userEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should close when clicking backdrop', async () => {
      const handleClose = jest.fn();
      const { container } = render(
        <Modal isOpen onClose={handleClose} title="Test Modal">
          Content
        </Modal>
      );

      const backdrop = container.querySelector('.modal-overlay');
      await userEvent.click(backdrop!);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when clicking modal content', async () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen onClose={handleClose} title="Test Modal">
          <div data-testid="content">Content</div>
        </Modal>
      );

      const content = screen.getByTestId('content');
      await userEvent.click(content);
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce dialog role', () => {
      render(
        <Modal isOpen onClose={jest.fn()} title="Test Modal">
          Content
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });

    it('should have accessible name from title', () => {
      render(
        <Modal isOpen onClose={jest.fn()} title="Confirmation Dialog">
          Are you sure?
        </Modal>
      );

      const modal = screen.getByRole('dialog', { name: 'Confirmation Dialog' });
      expect(modal).toBeInTheDocument();
    });

    it('should hide description from visual but available to SR', () => {
      render(
        <Modal
          isOpen
          onClose={jest.fn()}
          title="Test"
          description="Hidden description"
        >
          Content
        </Modal>
      );

      const description = screen.getByText('Hidden description');
      expect(description).toHaveClass('sr-only');
    });

    it('should prevent body scroll when open', () => {
      // Mock desktop viewport
      global.innerWidth = 1024;

      render(
        <Modal isOpen onClose={jest.fn()}>
          Content
        </Modal>
      );

      // On desktop, we use position: fixed to prevent scrolling
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closed', () => {
      // Mock desktop viewport
      global.innerWidth = 1024;

      const { rerender } = render(
        <Modal isOpen onClose={jest.fn()}>
          Content
        </Modal>
      );

      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={jest.fn()}>
          Content
        </Modal>
      );

      // Body scroll should be restored (empty string means no inline style)
      expect(document.body.style.position).toBe('');
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Close Button Accessibility', () => {
    it('should have accessible label for close button', () => {
      render(
        <Modal isOpen onClose={jest.fn()} title="Test">
          Content
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close dialog');
      expect(closeButton).toBeInTheDocument();
    });

    it.skip('should be keyboard accessible', async () => {
      // SKIP REASON: Complex keyboard event simulation doesn't work reliably in JSDOM
      // COVERED BY: e2e/accessibility.spec.ts - Keyboard navigation tests
      // NOTE: Keyboard accessibility is verified in E2E tests with real keyboard events
      const handleClose = jest.fn();
      render(
        <Modal isOpen onClose={handleClose} title="Test">
          Content
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close dialog');
      closeButton.focus();
      await userEvent.keyboard('{Enter}');
      expect(handleClose).toHaveBeenCalled();
    });

    it('should be hidden when showCloseButton is false', () => {
      render(
        <Modal isOpen onClose={jest.fn()} title="Test" showCloseButton={false}>
          Content
        </Modal>
      );

      const closeButton = screen.queryByLabelText('Close dialog');
      expect(closeButton).not.toBeInTheDocument();
    });
  });
});
