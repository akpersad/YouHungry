'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cx } from './cx';

/**
 * v2 Dialog — native <dialog> + showModal(): focus trap, inert backdrop,
 * Esc-to-close, and focus return to the trigger all come from the platform.
 * Enter/exit motion uses discrete transitions + @starting-style (Tailwind
 * `transition-discrete` / `starting:`); browsers without support simply
 * show/hide instantly, and reduced motion collapses it globally.
 */
export function Dialog({
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
      // jsdom (and very old engines) lack showModal — degrade to the open
      // attribute so content still renders and tests can assert on it.
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
        // A click on the backdrop targets the <dialog> element itself.
        if (e.target === ref.current) onClose();
      }}
      className={cx(
        'm-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-surface p-6 text-ink shadow-float',
        'scale-95 opacity-0 transition-[opacity,transform,display,overlay] transition-discrete duration-200 ease-snap',
        'open:scale-100 open:opacity-100 starting:open:scale-95 starting:open:opacity-0',
        'backdrop:bg-board/50 backdrop:opacity-0 backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-200',
        'open:backdrop:opacity-100 starting:open:backdrop:opacity-0',
        className
      )}
    >
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
