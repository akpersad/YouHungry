'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cx } from './cx';

/**
 * v2 Sheet — a bottom sheet on native <dialog> (same platform affordances as
 * Dialog: trap, Esc, backdrop, focus return). Slides from the bottom edge,
 * respects the home-indicator safe area, and scroll inside it doesn't chain
 * to the page. Drag-to-dismiss arrives with its first real consumer
 * (Phase 3) so the gesture can be tuned against real content, not a demo.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      if (typeof el.showModal === 'function') el.showModal();
      else el.setAttribute('open', '');
    } else if (!open && el.open) {
      if (typeof el.close === 'function') el.close();
      else el.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cx(
        'mx-auto mt-auto mb-0 w-full max-w-lg rounded-t-3xl bg-surface text-ink shadow-float',
        'max-h-[85dvh] overflow-y-auto overscroll-contain',
        'px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]',
        'translate-y-full transition-[transform,display,overlay] transition-discrete duration-300 ease-snap',
        'open:translate-y-0 starting:open:translate-y-full',
        'backdrop:bg-board/50 backdrop:opacity-0 backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-300',
        'open:backdrop:opacity-100 starting:open:backdrop:opacity-0',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="mx-auto mb-3 h-1 w-9 rounded-full bg-line-strong"
      />
      <div className="flex items-start justify-between gap-4">
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-focus"
        >
          <svg
            viewBox="0 0 16 16"
            className="size-4"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m3 3 10 10M13 3 3 13"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className="mt-3">{children}</div>
    </dialog>
  );
}
