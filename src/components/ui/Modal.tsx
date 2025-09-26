'use client';

import { ReactNode, useEffect } from 'react';
import { Button } from './Button';

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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          zIndex: 1001,
          padding: '1.5rem',
          position: 'relative',
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className="flex items-center justify-between mb-4"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            {title && (
              <h2
                className="text-xl font-semibold"
                style={{ color: 'var(--color-text)' }}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="ml-auto"
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '50%',
                  width: '2rem',
                  height: '2rem',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ color: 'var(--color-text)' }}>{children}</div>
      </div>
    </div>
  );
}
