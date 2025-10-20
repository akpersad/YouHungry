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
  const scrollPosition = useRef<number>(0);
  const wasBodyLocked = useRef<boolean>(false);
  const titleId = useId();
  const descriptionId = useId();

  // Focus management and keyboard handling
  useEffect(() => {
    if (isOpen) {
      // Store the element that was focused before the modal opened
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Check if body is already locked (nested modal scenario)
      const isAlreadyLocked = document.body.style.overflow === 'hidden';
      wasBodyLocked.current = isAlreadyLocked;

      // Only lock body if not already locked (first modal)
      if (!isAlreadyLocked) {
        // Save current scroll position
        scrollPosition.current = window.scrollY;

        const isMobile = window.innerWidth <= 640;

        if (isMobile) {
          // Mobile/PWA: Add class to prevent scrolling
          // This uses CSS rules that prevent body movement
          document.body.classList.add('modal-open');
          document.documentElement.classList.add('modal-open');
        } else {
          // Desktop: Use position fixed to prevent scroll
          document.body.style.position = 'fixed';
          document.body.style.top = `-${scrollPosition.current}px`;
          document.body.style.width = '100%';
          document.body.style.overflow = 'hidden';
        }
      }

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

        // Only restore body scroll if this modal was the one that locked it
        if (!wasBodyLocked.current) {
          const isMobile = window.innerWidth <= 640;

          if (isMobile) {
            // Mobile: Remove modal-open class
            document.body.classList.remove('modal-open');
            document.documentElement.classList.remove('modal-open');
            // Don't scroll - keep user where they were
          } else {
            // Desktop: Restore body scroll and position
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';

            // Restore scroll position (wrap in try-catch for JSDOM compatibility)
            try {
              window.scrollTo(0, scrollPosition.current);
            } catch {
              // Ignore scrollTo errors in test environments (JSDOM doesn't implement it)
            }
          }
        }

        // Return focus to the element that opened the modal
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          {...(!isMobile && {
            variants: modalBackdropVariants,
            initial: 'hidden',
            animate: 'visible',
            exit: 'exit',
          })}
          role="presentation"
        >
          <motion.div
            ref={modalRef}
            className={`modal-content ${className}`}
            onClick={(e) => e.stopPropagation()}
            {...(!isMobile && {
              variants: modalVariants,
              initial: 'hidden',
              animate: 'visible',
              exit: 'exit',
            })}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div
                className="flex items-center justify-between p-lg pb-4 border-b flex-shrink-0"
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

            {/* Content - Scrollable area */}
            <div className="text-primary p-lg overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
