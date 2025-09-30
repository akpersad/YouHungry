'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  showHandle?: boolean;
  snapPoints?: number[]; // Heights in percentage (0-100)
  defaultSnapPoint?: number; // Default snap point index
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
  showHandle = true,
  snapPoints = [25, 50, 90], // eslint-disable-line @typescript-eslint/no-unused-vars
  defaultSnapPoint = 0, // eslint-disable-line @typescript-eslint/no-unused-vars
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Touch event handlers for drag gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    // Only allow downward dragging
    if (deltaY > 0) {
      const translateY = Math.min(deltaY, 100); // Limit drag distance
      sheetRef.current.style.transform = `translateY(${translateY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || !sheetRef.current) return;

    isDragging.current = false;
    const deltaY = currentY.current - startY.current;

    // If dragged down more than 100px, close the sheet
    if (deltaY > 100) {
      onClose();
    } else {
      // Snap back to original position
      sheetRef.current.style.transform = 'translateY(0)';
    }
  };

  // Mouse event handlers for desktop drag
  const handleMouseDown = (e: React.MouseEvent) => {
    startY.current = e.clientY;
    currentY.current = e.clientY;
    isDragging.current = true;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !sheetRef.current) return;

    currentY.current = e.clientY;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 0) {
      const translateY = Math.min(deltaY, 100);
      sheetRef.current.style.transform = `translateY(${translateY}px)`;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current || !sheetRef.current) return;

    isDragging.current = false;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 100) {
      onClose();
    } else {
      sheetRef.current.style.transform = 'translateY(0)';
    }

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Add mouse event listeners when dragging starts
  const handleMouseDownWithListeners = (e: React.MouseEvent) => {
    handleMouseDown(e);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-secondary border-t border-quaternary',
          'rounded-t-3xl shadow-neumorphic-elevated',
          'transition-transform duration-300 ease-out',
          className
        )}
        style={{
          borderColor: 'var(--bg-quaternary)',
          borderRadius: 'var(--radius-3xl) var(--radius-3xl) 0 0',
          maxHeight: '90vh',
          transform: 'translateY(0)',
        }}
      >
        {/* Handle */}
        {showHandle && (
          <div
            className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDownWithListeners}
          >
            <div className="w-12 h-1 bg-quaternary rounded-full" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="px-4 py-3 border-b border-quaternary">
            <h3 className="text-lg font-semibold text-primary text-center">
              {title}
            </h3>
          </div>
        )}

        {/* Content */}
        <div className="px-4 py-4 max-h-80vh overflow-y-auto">{children}</div>
      </div>
    </>
  );
}

// Quick action bottom sheet for common actions
interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  actions: {
    id: string;
    label: string;
    icon: ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }[];
}

export function QuickActionSheet({
  isOpen,
  onClose,
  actions,
}: QuickActionSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Quick Actions">
      <div className="space-y-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
              'transition-all duration-200 touch-target',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              action.variant === 'destructive'
                ? 'text-error hover:bg-error/10 focus:ring-error/30'
                : 'text-primary hover:bg-tertiary focus:ring-accent/30'
            )}
          >
            <div className="flex-shrink-0">{action.icon}</div>
            <span className="font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
