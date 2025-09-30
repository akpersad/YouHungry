'use client';

import { ReactNode, useEffect } from 'react';
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
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showCloseButton = true,
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
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
        >
          <motion.div
            className={`modal-content p-lg ${className}`}
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div
                className="flex items-center justify-between mb-4 pb-4 border-b"
                style={{ borderColor: 'var(--bg-quaternary)' }}
              >
                {title && (
                  <h2 className="text-xl font-semibold text-primary">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="ml-auto rounded-full w-8 h-8 p-0 flex items-center justify-center"
                  >
                    ×
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="text-primary">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
