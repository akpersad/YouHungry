'use client';

import { ReactNode, useEffect, useRef, useId } from 'react';
import { Button } from './Button';
import { motion, AnimatePresence } from 'framer-motion';
import { modalVariants, modalBackdropVariants } from '@/lib/animations';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  description?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showCloseButton = true,
  description,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Focus management and keyboard handling
  useEffect(() => {
    if (isOpen) {
      // Store the element that was focused before the modal opened
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      // Focus the modal container after it's mounted
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);

      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      // Focus trap - keep focus within modal
      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !modalRef.current) return;

        const focusableElements =
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTab);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('keydown', handleTab);
        document.body.style.overflow = 'unset';

        // Return focus to the element that opened the modal
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="presentation"
        >
          <motion.div
            ref={modalRef}
            className={`modal-content p-lg ${className}`}
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div
                className="flex items-center justify-between mb-4 pb-4 border-b"
                style={{ borderColor: 'var(--bg-quaternary)' }}
              >
                {title && (
                  <h2
                    id={titleId}
                    className="text-xl font-semibold text-primary"
                  >
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="ml-auto rounded-full w-8 h-8 p-0 flex items-center justify-center"
                    aria-label="Close dialog"
                  >
                    ×
                  </Button>
                )}
              </div>
            )}

            {/* Description (hidden but available for screen readers) */}
            {description && (
              <p id={descriptionId} className="sr-only">
                {description}
              </p>
            )}

            {/* Content */}
            <div className="text-primary">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
